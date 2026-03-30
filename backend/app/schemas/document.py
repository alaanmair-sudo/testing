import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.schemas.checklist import ChecklistItemResponse


class DocumentResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    checklist_item_id: Optional[uuid.UUID] = None
    original_filename: str
    file_type: str
    file_size_bytes: int
    processing_status: str
    extracted_data: Optional[Dict[str, Any]] = None
    ai_validation_result: Optional[Dict[str, Any]] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ChecklistProgressItem(BaseModel):
    checklist_item: ChecklistItemResponse
    status: str  # satisfied, pending_processing, missing
    document_id: Optional[uuid.UUID] = None


class ChecklistProgress(BaseModel):
    total_required: int
    satisfied: int
    pending_processing: int
    missing: int
    items: List[ChecklistProgressItem]
