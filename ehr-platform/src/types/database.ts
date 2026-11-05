// Database entity types matching SQLite schema

export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  date_of_birth: string;
  allergies?: string; // JSON array
  emergency_contact?: string; // JSON object
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: number;
  patient_id: number;
  visit_date: string;
  facility_name: string;
  doctor_name: string;
  visit_type?: 'general' | 'specialist' | 'emergency' | 'followup';
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: number;
  visit_id: number;
  file_name: string;
  file_hash: string;
  file_uri: string;
  file_type: string;
  file_size_bytes?: number;
  ocr_text?: string;
  ocr_metadata?: string; // JSON
  uploaded_at: string;
}

export interface MedicationItem {
  id: number;
  visit_id: number;
  source_prescription_id?: number;
  medication_name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration?: string;
  status: 'active' | 'discontinued' | 'completed';
  start_date?: string;
  end_date?: string;
  discontinuation_reason?: string;
  prescriber_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationAudit {
  id: number;
  baseline_visit_id: number;
  comparison_visit_id: number;
  reconciled_at: string;
  reconciled_by?: string;
  medications_added?: string; // JSON array
  medications_removed?: string; // JSON array
  medications_modified?: string; // JSON array
  medications_conflicting?: string; // JSON array
  conflicts_resolved: boolean;
  resolution_notes?: string;
  flagged_for_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: number;
  user_role: 'patient' | 'pharmacist' | 'doctor' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'flagged';
  old_value?: string; // JSON
  new_value?: string; // JSON
  reason?: string;
  logged_at: string;
}
