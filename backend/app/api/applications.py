import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.application import Application, StatusHistory
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.checklist_service import get_checklist_progress

router = APIRouter()


async def _generate_reference_number(db: AsyncSession) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"GAM-{year}-"
    result = await db.execute(
        select(func.count(Application.id)).where(
            Application.reference_number.like(f"{prefix}%")
        )
    )
    count = result.scalar_one()
    sequence = count + 1
    return f"{prefix}{sequence:05d}"


@router.get("/", response_model=list[ApplicationListResponse])
async def list_applications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    applications = result.scalars().all()
    return applications


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reference_number = await _generate_reference_number(db)

    application = Application(
        reference_number=reference_number,
        user_id=current_user.id,
        permit_type_id=data.permit_type_id,
        property_address_en=data.property_address_en,
        property_address_ar=data.property_address_ar,
        plot_number=data.plot_number,
        district=data.district,
        project_description_en=data.project_description_en,
        project_description_ar=data.project_description_ar,
        status="draft",
    )
    db.add(application)

    history = StatusHistory(
        application_id=application.id,
        from_status=None,
        to_status="draft",
        changed_by=current_user.id,
        notes="Application created",
    )
    db.add(history)

    await db.flush()

    result = await db.execute(
        select(Application)
        .where(Application.id == application.id)
        .options(selectinload(Application.user), selectinload(Application.permit_type))
    )
    application = result.scalar_one()
    return application


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
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

    if application.user_id != current_user.id and current_user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return application


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: uuid.UUID,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.user), selectinload(Application.permit_type))
    )
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if application.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft applications can be updated",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)

    await db.flush()
    await db.refresh(application)
    return application


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.user), selectinload(Application.permit_type))
    )
    application = result.scalar_one_or_none()

    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if application.status not in ("draft", "revision_requested"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit application with status '{application.status}'",
        )

    old_status = application.status
    application.status = "submitted"
    application.submitted_at = datetime.now(timezone.utc)

    history = StatusHistory(
        application_id=application.id,
        from_status=old_status,
        to_status="submitted",
        changed_by=current_user.id,
        notes="Application submitted for review",
    )
    db.add(history)

    await db.flush()
    await db.refresh(application)
    return application
