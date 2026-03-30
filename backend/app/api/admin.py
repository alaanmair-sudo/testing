import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_role
from app.models.application import Application, StatusHistory
from app.models.user import User
from app.schemas.application import ApplicationListResponse, ApplicationResponse, ReviewRequest

router = APIRouter()

admin_or_reviewer = require_role(["admin", "reviewer"])


@router.get("/applications", response_model=list[ApplicationListResponse])
async def list_all_applications(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    permit_type_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(admin_or_reviewer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Application).order_by(Application.created_at.desc())

    if status_filter:
        query = query.where(Application.status == status_filter)
    if permit_type_id:
        query = query.where(Application.permit_type_id == permit_type_id)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    applications = result.scalars().all()
    return applications


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def admin_get_application(
    application_id: uuid.UUID,
    current_user: User = Depends(admin_or_reviewer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(
            selectinload(Application.user),
            selectinload(Application.permit_type),
            selectinload(Application.documents),
            selectinload(Application.status_history),
        )
    )
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    return application


@router.post("/applications/{application_id}/review", response_model=ApplicationResponse)
async def review_application(
    application_id: uuid.UUID,
    review: ReviewRequest,
    current_user: User = Depends(admin_or_reviewer),
    db: AsyncSession = Depends(get_db),
):
    if review.action not in ("approve", "reject", "revision_requested"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be one of: approve, reject, revision_requested",
        )

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.user), selectinload(Application.permit_type))
    )
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.status not in ("submitted", "under_review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review application with status '{application.status}'",
        )

    old_status = application.status

    if review.action == "approve":
        new_status = "approved"
    elif review.action == "reject":
        new_status = "rejected"
    else:
        new_status = "revision_requested"

    application.status = new_status
    application.reviewed_by = current_user.id
    application.review_notes = review.notes
    application.decided_at = datetime.now(timezone.utc)

    history = StatusHistory(
        application_id=application.id,
        from_status=old_status,
        to_status=new_status,
        changed_by=current_user.id,
        notes=review.notes,
    )
    db.add(history)

    await db.flush()
    await db.refresh(application)
    return application


@router.get("/stats")
async def dashboard_stats(
    current_user: User = Depends(admin_or_reviewer),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(select(func.count(Application.id)))
    total = total_result.scalar_one()

    pending_result = await db.execute(
        select(func.count(Application.id)).where(
            Application.status.in_(["submitted", "under_review"])
        )
    )
    pending = pending_result.scalar_one()

    approved_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "approved")
    )
    approved = approved_result.scalar_one()

    rejected_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "rejected")
    )
    rejected = rejected_result.scalar_one()

    draft_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "draft")
    )
    draft = draft_result.scalar_one()

    revision_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "revision_requested")
    )
    revision_requested = revision_result.scalar_one()

    return {
        "total": total,
        "draft": draft,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "revision_requested": revision_requested,
    }
