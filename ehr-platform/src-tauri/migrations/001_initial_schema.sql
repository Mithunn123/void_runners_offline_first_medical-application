-- EHR Platform - Initial Database Schema
-- Phase 1: Core entities for medication tracking and reconciliation

-- Table 1: Patients
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  allergies TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Visits
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  facility_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  visit_type TEXT,
  clinical_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON visits(patient_id, visit_date DESC);

-- Table 3: Prescriptions (Document Storage)
CREATE TABLE IF NOT EXISTS prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  ocr_text TEXT,
  ocr_metadata TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON prescriptions(visit_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prescriptions_hash ON prescriptions(file_hash);

-- Table 4: Medication Items (Structured Medication Records)
CREATE TABLE IF NOT EXISTS medication_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  source_prescription_id INTEGER,
  medication_name TEXT NOT NULL,
  strength TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  discontinuation_reason TEXT,
  prescriber_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (source_prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_medications_visit ON medication_items(visit_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medication_items(status);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medication_items(medication_name);

-- Table 5: Reconciliation Audit (Diff Results & Conflict Resolution)
CREATE TABLE IF NOT EXISTS reconciliation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baseline_visit_id INTEGER NOT NULL,
  comparison_visit_id INTEGER NOT NULL,
  reconciled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reconciled_by TEXT,
  medications_added TEXT,
  medications_removed TEXT,
  medications_modified TEXT,
  medications_conflicting TEXT,
  conflicts_resolved BOOLEAN DEFAULT 0,
  resolution_notes TEXT,
  flagged_for_review BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (baseline_visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (comparison_visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_visits ON reconciliation_audit(baseline_visit_id, comparison_visit_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_unresolved ON reconciliation_audit(conflicts_resolved, flagged_for_review);

-- Table 6: Audit Log (Immutable Change History)
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(logged_at DESC);
