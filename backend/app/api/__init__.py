from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.applications import router as applications_router
from app.api.documents import router as documents_router
from app.api.checklists import router as checklists_router
from app.api.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(applications_router, prefix="/applications", tags=["Applications"])
api_router.include_router(documents_router, prefix="", tags=["Documents"])
api_router.include_router(checklists_router, prefix="/checklists", tags=["Checklists"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])


from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.checklist import PermitType
from app.schemas.checklist import PermitTypeResponse


@api_router.get("/permit-types", response_model=list[PermitTypeResponse], tags=["Permit Types"])
async def list_permit_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PermitType).where(PermitType.is_active == True).order_by(PermitType.code)
    )
    return result.scalars().all()
