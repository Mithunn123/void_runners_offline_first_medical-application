// Reconciliation engine types

import { MedicationItem } from './database';

export interface MedicationChange {
  baseline: MedicationItem;
  comparison: MedicationItem;
  changes: string[];
}

export interface MedicationConflict {
  medication_name: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  baseline: MedicationItem;
  comparison: MedicationItem;
}

export interface ReconciliationResult {
  added: MedicationItem[];
  removed: MedicationItem[];
  modified: MedicationChange[];
  conflicting: MedicationConflict[];
  unchanged: MedicationItem[];
}
