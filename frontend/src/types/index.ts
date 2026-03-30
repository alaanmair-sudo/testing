export interface User {
  id: string;
  email: string;
  full_name_en: string;
  full_name_ar: string;
  phone: string | null;
  national_id: string | null;
  role: "citizen" | "staff" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface PermitType {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
}

export interface ChecklistItem {
  id: string;
  permit_type_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  document_category: string;
  accepted_formats: string[];
  is_required: boolean;
  sort_order: number;
}

export interface Application {
  id: string;
  reference_number: string;
  user_id: string;
  permit_type_id: string;
  status: ApplicationStatus;
  property_address_en: string | null;
  property_address_ar: string | null;
  plot_number: string | null;
  district: string | null;
  project_description_en: string | null;
  project_description_ar: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  permit_type?: PermitType;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface ApplicationCreate {
  permit_type_id: string;
  property_address_en: string;
  property_address_ar?: string;
  plot_number: string;
  district: string;
  project_description_en: string;
  project_description_ar?: string;
}

export interface Document {
  id: string;
  application_id: string;
  checklist_item_id: string | null;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  processing_status: "pending" | "processing" | "completed" | "failed";
  extracted_data: Record<string, unknown> | null;
  ai_validation_result: Record<string, unknown> | null;
  uploaded_at: string;
}

export interface ChecklistProgressItem {
  checklist_item: ChecklistItem;
  status: "satisfied" | "processing" | "missing";
  document_id: string | null;
}

export interface ChecklistProgress {
  total_required: number;
  satisfied: number;
  pending_processing: number;
  missing: number;
  items: ChecklistProgressItem[];
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ReviewRequest {
  action: "approve" | "reject" | "revision_requested";
  notes?: string;
}
