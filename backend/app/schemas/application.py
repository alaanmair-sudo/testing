import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse
from app.schemas.checklist import PermitTypeResponse


class ApplicationCreate(BaseModel):
    permit_type_id: uuid.UUID
    property_address_en: str
    property_address_ar: Optional[str] = None
    plot_number: str
    district: str
    project_description_en: str
    project_description_ar: Optional[str] = None


class ApplicationUpdate(BaseModel):
    permit_type_id: Optional[uuid.UUID] = None
    property_address_en: Optional[str] = None
    property_address_ar: Optional[str] = None
    plot_number: Optional[str] = None
    district: Optional[str] = None
    project_description_en: Optional[str] = None
    project_description_ar: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    status: str
    permit_type_id: uuid.UUID
    property_address_en: str
    property_address_ar: Optional[str] = None
    plot_number: str
    district: str
    project_description_en: str
    project_description_ar: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_by: Optional[uuid.UUID] = None
    review_notes: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    permit_type: Optional[PermitTypeResponse] = None

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    status: str
    permit_type_id: uuid.UUID
    property_address_en: str
    plot_number: str
    district: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    action: str  # approve, reject, revision_requested
    notes: Optional[str] = None
