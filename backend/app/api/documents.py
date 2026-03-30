import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.models.application import Application
from app.models.document import Document
from app.models.user import User
from app.schemas.document import ChecklistProgress, DocumentResponse
from app.services.checklist_service import get_checklist_progress

router = APIRouter()


@router.post(
    "/applications/{app_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    checklist_item_id: uuid.UUID | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if application.status not in ("draft", "revision_requested"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload documents for this application status",
        )

    app_upload_dir = Path(settings.UPLOAD_DIR) / str(app_id)
    app_upload_dir.mkdir(parents=True, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    stored_filename = f"{uuid.uuid4()}{file_ext}"
    stored_path = app_upload_dir / stored_filename

    content = await file.read()
    file_size = len(content)

    async with aiofiles.open(stored_path, "wb") as f:
        await f.write(content)

    file_type = file_ext.lstrip(".").lower() if file_ext else "unknown"

    document = Document(
        application_id=app_id,
        checklist_item_id=checklist_item_id,
        original_filename=file.filename or "unnamed",
        stored_path=str(stored_path),
        file_type=file_type,
        file_size_bytes=file_size,
        processing_status="pending",
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)

    try:
        from app.tasks.process_document import process_document_task

        process_document_task.delay(str(document.id))
    except Exception:
        document.processing_status = "queued_failed"
        await db.flush()

    return document


@router.get("/applications/{app_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.user_id != current_user.id and current_user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(
        select(Document)
        .where(Document.application_id == app_id)
        .order_by(Document.uploaded_at.desc())
    )
    documents = result.scalars().all()
    return documents


@router.get("/applications/{app_id}/checklist-progress", response_model=ChecklistProgress)
async def checklist_progress(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.user_id != current_user.id and current_user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    progress = await get_checklist_progress(application.id, application.permit_type_id, db)
    return progress


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.id == doc_id)
        .options(selectinload(Document.application))
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if (
        document.application.user_id != current_user.id
        and current_user.role not in ("admin", "reviewer")
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return document


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.id == doc_id)
        .options(selectinload(Document.application))
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if document.application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if document.application.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete documents from draft applications",
        )

    file_path = Path(document.stored_path)
    if file_path.exists():
        file_path.unlink()

    await db.delete(document)
    await db.flush()


@router.post("/documents/{doc_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.id == doc_id)
        .options(selectinload(Document.application))
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if (
        document.application.user_id != current_user.id
        and current_user.role not in ("admin", "reviewer")
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    document.processing_status = "pending"
    document.ocr_text = None
    document.extracted_data = None
    document.ai_validation_result = None
    await db.flush()

    try:
        from app.tasks.process_document import process_document_task

        process_document_task.delay(str(document.id))
    except Exception:
        document.processing_status = "queued_failed"
        await db.flush()

    await db.refresh(document)
    return document
