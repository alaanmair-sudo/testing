import uuid
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checklist import ChecklistItem
from app.models.document import Document
from app.schemas.checklist import ChecklistItemResponse
from app.schemas.document import ChecklistProgress, ChecklistProgressItem

logger = logging.getLogger(__name__)


def validate_document(extracted_data: Dict[str, Any], checklist_item: ChecklistItem) -> Dict[str, Any]:
    """Compare AI extraction results against checklist requirements.

    Checks whether the extracted document data satisfies the requirements
    defined by the checklist item.

    Args:
        extracted_data: The AI extraction result dictionary.
        checklist_item: The checklist item defining requirements.

    Returns:
        A validation result dictionary with pass/fail status and details.
    """
    issues = []
    warnings = []
    is_valid = True

    matches_expected = extracted_data.get("matches_expected_type", False)
    confidence = extracted_data.get("confidence", 0.0)

    if not matches_expected:
        issues.append(
            f"Document does not match expected type '{checklist_item.name_en}'. "
            f"Detected type: '{extracted_data.get('detected_document_type', 'unknown')}'"
        )
        is_valid = False

    if confidence < 0.5:
        issues.append(
            f"Low confidence score ({confidence:.2f}). "
            "The document may not be the correct type or may be of poor quality."
        )
        if confidence < 0.3:
            is_valid = False

    ai_issues = extracted_data.get("issues", [])
    if ai_issues:
        for issue in ai_issues:
            warnings.append(f"AI detected issue: {issue}")

    has_signature = extracted_data.get("has_signature", False)
    has_stamp = extracted_data.get("has_official_stamp", False)

    category = checklist_item.document_category.lower()
    if category in ("legal", "ownership", "deed") and not has_signature:
        warnings.append("No signature detected on a legal document")

    if category in ("legal", "ownership", "deed", "registration") and not has_stamp:
        warnings.append("No official stamp detected on a document that typically requires one")

    status = "approved" if is_valid else "rejected"
    if is_valid and warnings:
        status = "approved_with_warnings"

    return {
        "status": status,
        "is_valid": is_valid,
        "confidence": confidence,
        "matches_expected_type": matches_expected,
        "detected_type": extracted_data.get("detected_document_type", "unknown"),
        "has_signature": has_signature,
        "has_official_stamp": has_stamp,
        "issues": issues,
        "warnings": warnings,
        "summary_en": extracted_data.get("summary_en", ""),
        "summary_ar": extracted_data.get("summary_ar", ""),
    }


async def get_checklist_progress(
    application_id: uuid.UUID,
    permit_type_id: uuid.UUID,
    session: AsyncSession,
) -> ChecklistProgress:
    """Compute checklist completion progress for an application.

    Queries all checklist items for the permit type and checks which
    ones have been satisfied by uploaded documents.

    Args:
        application_id: The application UUID.
        permit_type_id: The permit type UUID.
        session: Async database session.

    Returns:
        A ChecklistProgress object with item-level detail and summary counts.
    """
    checklist_result = await session.execute(
        select(ChecklistItem)
        .where(ChecklistItem.permit_type_id == permit_type_id)
        .order_by(ChecklistItem.sort_order)
    )
    checklist_items = checklist_result.scalars().all()

    documents_result = await session.execute(
        select(Document).where(Document.application_id == application_id)
    )
    documents = documents_result.scalars().all()

    doc_by_checklist = {}
    for doc in documents:
        if doc.checklist_item_id:
            if doc.checklist_item_id not in doc_by_checklist:
                doc_by_checklist[doc.checklist_item_id] = []
            doc_by_checklist[doc.checklist_item_id].append(doc)

    items: List[ChecklistProgressItem] = []
    total_required = 0
    satisfied = 0
    pending_processing = 0
    missing = 0

    for ci in checklist_items:
        if ci.is_required:
            total_required += 1

        docs_for_item = doc_by_checklist.get(ci.id, [])

        if not docs_for_item:
            item_status = "missing"
            doc_id = None
            if ci.is_required:
                missing += 1
        else:
            latest_doc = max(docs_for_item, key=lambda d: d.uploaded_at)
            doc_id = latest_doc.id

            if latest_doc.processing_status == "completed":
                validation = latest_doc.ai_validation_result
                if validation and validation.get("is_valid", False):
                    item_status = "satisfied"
                    if ci.is_required:
                        satisfied += 1
                else:
                    item_status = "rejected"
                    if ci.is_required:
                        missing += 1
            elif latest_doc.processing_status in ("pending", "processing"):
                item_status = "pending_processing"
                if ci.is_required:
                    pending_processing += 1
            elif latest_doc.processing_status == "failed":
                item_status = "failed"
                if ci.is_required:
                    missing += 1
            else:
                item_status = "uploaded"
                if ci.is_required:
                    pending_processing += 1

        checklist_item_resp = ChecklistItemResponse.model_validate(ci)

        items.append(
            ChecklistProgressItem(
                checklist_item=checklist_item_resp,
                status=item_status,
                document_id=doc_id,
            )
        )

    return ChecklistProgress(
        total_required=total_required,
        satisfied=satisfied,
        pending_processing=pending_processing,
        missing=missing,
        items=items,
    )
