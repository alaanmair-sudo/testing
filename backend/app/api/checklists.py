from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.checklist import ChecklistItem, PermitType
from app.schemas.checklist import ChecklistItemResponse, PermitTypeResponse

router = APIRouter()


@router.get("/", response_model=list[PermitTypeResponse])
async def list_permit_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PermitType).where(PermitType.is_active == True).order_by(PermitType.code)
    )
    permit_types = result.scalars().all()
    return permit_types


@router.get("/{permit_type_code}", response_model=list[ChecklistItemResponse])
async def get_checklist_items(
    permit_type_code: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PermitType)
        .where(PermitType.code == permit_type_code, PermitType.is_active == True)
        .options(selectinload(PermitType.checklist_items))
    )
    permit_type = result.scalar_one_or_none()

    if permit_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permit type '{permit_type_code}' not found",
        )

    return permit_type.checklist_items
