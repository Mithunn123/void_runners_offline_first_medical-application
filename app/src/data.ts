export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  date: string;
}

export interface Visit {
  id: string;
  date: string;
  facility: string;
  provider: string;
  notes: string;
  scanUrl: string;
  medications: Medication[];
}

export interface Conflict {
  id: string;
  medicationName: string;
  sourceA: string;
  sourceB: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'RESOLVED';
  notes: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export const initialVisits: Visit[] = [
  {
    id: 'v1',
    date: 'Oct 15, 2026',
    facility: 'Green Valley Clinic',
    provider: 'Dr. K. Patel (GP)',
    notes: 'Initial consultation for type 2 diabetes and dyslipidemia management.',
    scanUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    medications: [
      { id: 'm1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescriber: 'Dr. K. Patel', date: 'Oct 15, 2026' },
      { id: 'm2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', prescriber: 'Dr. K. Patel', date: 'Oct 15, 2026' },
      { id: 'm0', name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', prescriber: 'Dr. K. Patel', date: 'Oct 15, 2026' }
    ]
  },
  {
    id: 'v2',
    date: 'Nov 02, 2026',
    facility: 'Metro Heart Institute',
    provider: 'Dr. Khan (Cardiology)',
    notes: 'Post-admission follow-up. Adjusted diabetic regimen.',
    scanUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
    medications: [
      { id: 'm3', name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', prescriber: 'Dr. Khan', date: 'Nov 02, 2026' },
      { id: 'm4', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', prescriber: 'Dr. Khan', date: 'Nov 02, 2026' }
    ]
  }
];

export const initialConflicts: Conflict[] = [
  {
    id: 'c1',
    medicationName: 'Metformin',
    sourceA: '500mg twice daily (Dr. Patel)',
    sourceB: '1000mg twice daily (Dr. Khan)',
    severity: 'HIGH',
    status: 'PENDING',
    notes: 'Dosage discrepancy across recent transfers.'
  },
  {
    id: 'c2',
    medicationName: 'Lisinopril',
    sourceA: '10mg once daily (Dr. Patel)',
    sourceB: 'Missing from Metro Heart Discharge',
    severity: 'MEDIUM',
    status: 'PENDING',
    notes: 'Potential unrecorded discontinuation.'
  }
];