import logging
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models.checklist import ChecklistItem, PermitType
from app.models.document import Document
from app.models.application import Application
from app.services.ai_extraction import extract_data_from_document
from app.services.checklist_service import validate_document
from app.services.dwf_service import convert_dwf_to_pdf
from app.services.ocr_service import extract_text_from_pdf, extract_text_from_image

logger = logging.getLogger(__name__)


async def process_document(document_id: str) -> None:
    """Orchestrate the full document processing pipeline.

    This function runs the following steps in sequence:
    1. If the file is a DWF, convert it to PDF.
    2. Run OCR on the PDF (or image) to extract text.
    3. If a checklist item is associated, use AI to extract and analyze data.
    4. Validate the extracted data against the checklist item requirements.
    5. Update the document record with all results.

    Args:
        document_id: The UUID string of the document to process.
    """
    async with async_session_maker() as session:
        try:
            result = await session.execute(
                select(Document).where(Document.id == uuid.UUID(document_id))
            )
            document = result.scalar_one_or_none()

            if document is None:
                logger.error("Document not found: %s", document_id)
                return

            document.processing_status = "processing"
            await session.commit()

            stored_path = document.stored_path
            file_type = document.file_type.lower()
            pdf_path = stored_path

            # Step 1: Convert DWF to PDF if needed
            if file_type in ("dwf", "dwfx"):
                try:
                    output_pdf = str(Path(stored_path).with_suffix(".pdf"))
                    pdf_path = convert_dwf_to_pdf(stored_path, output_pdf)
                    document.converted_pdf_path = pdf_path
                    await session.commit()
                except Exception as e:
                    logger.error("DWF conversion failed for document %s: %s", document_id, e)
                    document.processing_status = "failed"
                    document.ai_validation_result = {
                        "status": "error",
                        "issues": [f"DWF conversion failed: {str(e)}"],
                    }
                    await session.commit()
                    return

            # Step 2: OCR
            ocr_text = ""
            try:
                if file_type in ("pdf", "dwf", "dwfx"):
                    ocr_text = extract_text_from_pdf(pdf_path)
                elif file_type in ("jpg", "jpeg", "png", "tiff", "bmp"):
                    ocr_text = extract_text_from_image(stored_path)
                else:
                    ocr_text = f"[Unsupported file type for OCR: {file_type}]"

                document.ocr_text = ocr_text
                await session.commit()
            except Exception as e:
                logger.error("OCR failed for document %s: %s", document_id, e)
                ocr_text = f"[OCR failed: {str(e)}]"
                document.ocr_text = ocr_text
                await session.commit()

            # Step 3: AI extraction (if checklist item is linked)
            checklist_item = None
            permit_type_name = "Unknown"
            checklist_item_name = "Unknown"

            if document.checklist_item_id:
                ci_result = await session.execute(
                    select(ChecklistItem).where(ChecklistItem.id == document.checklist_item_id)
                )
                checklist_item = ci_result.scalar_one_or_none()

                if checklist_item:
                    checklist_item_name = checklist_item.name_en

                    app_result = await session.execute(
                        select(Application).where(Application.id == document.application_id)
                    )
                    application = app_result.scalar_one_or_none()

                    if application:
                        pt_result = await session.execute(
                            select(PermitType).where(PermitType.id == application.permit_type_id)
                        )
                        permit_type = pt_result.scalar_one_or_none()
                        if permit_type:
                            permit_type_name = permit_type.name_en

            try:
                extracted_data = await extract_data_from_document(
                    pdf_path=pdf_path,
                    checklist_item_name=checklist_item_name,
                    permit_type_name=permit_type_name,
                    ocr_text=ocr_text,
                )
                document.extracted_data = extracted_data
                await session.commit()
            except Exception as e:
                logger.error("AI extraction failed for document %s: %s", document_id, e)
                extracted_data = {
                    "detected_document_type": "error",
                    "matches_expected_type": False,
                    "confidence": 0.0,
                    "issues": [f"AI extraction failed: {str(e)}"],
                }
                document.extracted_data = extracted_data
                await session.commit()

            # Step 4: Validate against checklist
            if checklist_item and extracted_data:
                try:
                    validation_result = validate_document(extracted_data, checklist_item)
                    document.ai_validation_result = validation_result
                except Exception as e:
                    logger.error("Validation failed for document %s: %s", document_id, e)
                    document.ai_validation_result = {
                        "status": "error",
                        "issues": [f"Validation failed: {str(e)}"],
                    }
            else:
                document.ai_validation_result = {
                    "status": "no_checklist_item",
                    "is_valid": True,
                    "issues": [],
                    "warnings": ["No checklist item linked; skipping validation"],
                }

            document.processing_status = "completed"
            await session.commit()

            logger.info("Document processing completed successfully: %s", document_id)

        except Exception as e:
            logger.error("Unexpected error processing document %s: %s", document_id, e)
            try:
                document.processing_status = "failed"
                document.ai_validation_result = {
                    "status": "error",
                    "issues": [f"Unexpected processing error: {str(e)}"],
                }
                await session.commit()
            except Exception:
                logger.error("Failed to update document status after error")
                await session.rollback()
