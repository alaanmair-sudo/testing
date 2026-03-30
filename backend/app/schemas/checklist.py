import uuid
from typing import List, Optional

from pydantic import BaseModel


class PermitTypeResponse(BaseModel):
    id: uuid.UUID
    code: str
    name_en: str
    name_ar: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None

    model_config = {"from_attributes": True}


class ChecklistItemResponse(BaseModel):
    id: uuid.UUID
    permit_type_id: uuid.UUID
    name_en: str
    name_ar: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    document_category: str
    accepted_formats: List[str]
    is_required: bool
    sort_order: int

    model_config = {"from_attributes": True}
