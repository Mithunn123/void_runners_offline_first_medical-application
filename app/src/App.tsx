import { useState, useRef, useEffect } from 'react';
import { initialVisits, initialConflicts, type Conflict, type AuditEntry, type Visit } from './data';

type TabKey = 'timeline' | 'compare' | 'review' | 'audit';
type UserRole = 'doctor' | 'patient';

interface DoctorProfile {
  doctorName: string;
  registrationId: string;
  registrationDate: string;
  qualification: string;
  issuingYear: string;
  speciality: string;
  status: 'ACTIVE' | 'PROVISIONAL' | 'VERIFIED';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [conflicts, setConflicts] = useState<Conflict[]>([
    ...initialConflicts,
    {
      id: 'c3',
      medicationName: 'Atorvastatin',
      sourceA: '20mg once daily',
      sourceB: '40mg once daily',
      severity: 'HIGH',
      status: 'PENDING',
      notes: 'Statin dose doubled.'
    },
    {
      id: 'c4',
      medicationName: 'Clopidogrel',
      sourceA: 'Not on record',
      sourceB: '75mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'New antiplatelet added.'
    },
    {
      id: 'c5',
      medicationName: 'Amlodipine',
      sourceA: '5mg once daily',
      sourceB: '10mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'Dose adjustment awaiting clearance.'
    },
    {
      id: 'c6',
      medicationName: 'Omeprazole',
      sourceA: '20mg once daily',
      sourceB: '40mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'GI protection adjustment.'
    },
    {
      id: 'c7',
      medicationName: 'Hydrochlorothiazide',
      sourceA: '25mg once daily',
      sourceB: '12.5mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'Dose step-down protocol.'
    }
  ]);

  const [resolvedWeeklyCount, setResolvedWeeklyCount] = useState<number>(12);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication & Login Modal State
  const [authStep, setAuthStep] = useState<'prompt' | 'doctor_form' | 'authenticated'>('prompt');
  const [currentRole, setCurrentRole] = useState<UserRole>('doctor');

  // Doctor Form Fields
  const [doctorForm, setDoctorForm] = useState<DoctorProfile>({
    doctorName: '',
    registrationId: '',
    registrationDate: '',
    qualification: '',
    issuingYear: '',
    speciality: '',
    status: 'VERIFIED'
  });

  const [stickyNotes, setStickyNotes] = useState<Array<AuditEntry & { color: string; rotation: number }>>([
    {
      id: 's1',
      timestamp: 'Today, 10:15 AM',
      user: 'Dr. K. Patel',
      action: 'Baseline Regimen',
      details: 'Prescribed Metformin 500mg twice daily and Lisinopril 10mg once daily.',
      color: '#fef9c3',
      rotation: -1.2
    },
    {
      id: 's2',
      timestamp: 'Today, 11:30 AM',
      user: 'Clinic Intake',
      action: 'Discharge Ingestion',
      details: 'Discharge record: Metformin increased to 1000mg. Lisinopril omitted.',
      color: '#ccfbf1',
      rotation: 1.5
    },
    {
      id: 's3',
      timestamp: 'Today, 12:40 PM',
      user: 'Safety Check',
      action: 'Discrepancy Flagged',
      details: 'Unverified dosage increase across facility transfer.',
      color: '#fee2e2',
      rotation: -1.8
    }
  ]);

  // Demo auto-fill helper for lightning-fast demo pitch
  const handleAutoFill = () => {
    setDoctorForm({
      doctorName: 'Dr. Evelyn Vance',
      registrationId: 'MCI-TN-89412',
      registrationDate: '2019-06-15',
      qualification: 'MBBS, MD (Cardiology)',
      issuingYear: '2019',
      speciality: 'Interventional Cardiology',
      status: 'VERIFIED'
    });
  };

  const handlePatientSelect = () => {
    setCurrentRole('patient');
    setAuthStep('authenticated');
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.doctorName || !doctorForm.registrationId) return;

    setCurrentRole('doctor');
    setAuthStep('authenticated');

    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: doctorForm.doctorName,
        action: 'Doctor Verified',
        details: `Doctor signed in with Registration ID: ${doctorForm.registrationId} (${doctorForm.speciality}). Status: ${doctorForm.status}.`,
        color: '#ccfbf1',
        rotation: 1.2
      },
      ...prev
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const dateStr = '2026-11-05';

    const newVisit: Visit = {
      id: 'v-' + Date.now(),
      date: dateStr,
      facility: 'Specialty Care Ingestion',
      provider: currentRole === 'doctor' && doctorForm.doctorName ? `${doctorForm.doctorName} (${doctorForm.speciality || 'Cardiology'})` : 'Patient Upload Portal',
      notes: `Ingested document: ${file.name}`,
      scanUrl: fileUrl,
      medications: [
        { id: 'm-new-1', name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', prescriber: doctorForm.doctorName || 'Dr. Vance', date: dateStr },
        { id: 'm-new-2', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', prescriber: doctorForm.doctorName || 'Dr. Vance', date: dateStr }
      ]
    };

    setVisits([newVisit, ...visits]);

    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: currentRole === 'doctor' && doctorForm.doctorName ? doctorForm.doctorName : 'Patient Ingest',
        action: 'Prescription Added',
        details: `Digitalized document: ${file.name}`,
        color: '#e0e7ff',
        rotation: 1.2
      },
      ...prev
    ]);

    setActiveTab('timeline');
  };

  const resolveConflict = (id: string, resolution: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
    setResolvedWeeklyCount(prev => prev + 1);

    const colors = ['#fef9c3', '#ccfbf1', '#fee2e2', '#ffedd5', '#e0e7ff'];
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: currentRole === 'doctor' && doctorForm.doctorName ? `${doctorForm.doctorName} (Signed)` : 'Clinical Verifier',
        action: 'Conflict Resolved',
        details: `Approved: ${resolution}`,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Number((Math.random() * 3 - 1.5).toFixed(1))
      },
      ...prev
    ]);
  };

  const urgentCount = conflicts.filter(c => c.status === 'PENDING' && c.severity === 'HIGH').length;
  const pendingCount = conflicts.filter(c => c.status === 'PENDING' && (c.severity === 'MEDIUM' || c.severity === 'LOW')).length;
  const totalPending = urgentCount + pendingCount;

  return (
    <div className="desktop-app" style={{ position: 'relative' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,.pdf" 
        style={{ display: 'none' }} 
      />

      {/* --- 1. POPUP LOGIN MODAL (STEP 1: SELECT ROLE) --- */}
      {authStep === 'prompt' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '36px 32px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#ccfbf1',
              color: '#0f766e',
              fontSize: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontWeight: 800
            }}>
              ✦
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Welcome to MedContinuity
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 28px' }}>
              Are you a licensed healthcare professional or a patient?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setAuthStep('doctor_form')}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                }}>
                I am a Doctor / Clinician
              </button>
              
              <button 
                type="button"
                onClick={handlePatientSelect}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}>
                I am a Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. POPUP DOCTOR REGISTRATION FORM (STEP 2: CREDENTIALS) --- */}
      {authStep === 'doctor_form' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Doctor Authentication
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                  Please verify your medical license credentials
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleAutoFill}
                style={{
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  color: '#0f766e',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                ⚡ Auto-Fill Demo
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Doctor Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Evelyn Vance"
                  value={doctorForm.doctorName}
                  onChange={e => setDoctorForm({ ...doctorForm, doctorName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Registration ID *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MCI-TN-89412"
                  value={doctorForm.registrationId}
                  onChange={e => setDoctorForm({ ...doctorForm, registrationId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Registration Date *
                </label>
                <input 
                  type="date" 
                  required
                  value={doctorForm.registrationDate}
                  onChange={e => setDoctorForm({ ...doctorForm, registrationDate: e.target.value })}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Qualification *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MBBS, MD"
                  value={doctorForm.qualification}
                  onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Issuing Year *
                </label>
                <input 
                  type="number" 
                  min="1960" 
                  max="2026"
                  required
                  placeholder="e.g. 2019"
                  value={doctorForm.issuingYear}
                  onChange={e => setDoctorForm({ ...doctorForm, issuingYear: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Speciality *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cardiology"
                  value={doctorForm.speciality}
                  onChange={e => setDoctorForm({ ...doctorForm, speciality: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Status
                </label>
                <select 
                  value={doctorForm.status}
                  onChange={e => setDoctorForm({ ...doctorForm, status: e.target.value as DoctorProfile['status'] })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROVISIONAL">PROVISIONAL</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setAuthStep('prompt')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>
                  Back
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#0d9488', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}>
                  Verify & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Teal Navigation Rail --- */}
      <aside className="nav-column">
        <div className="curved-pill-rail">
          <div className="brand-gem">✦</div>

          <div className="nav-slot">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`rail-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              title="Encounters">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
          </div>

          <div className="nav-slot">
            <button 
              onClick={() => setActiveTab('compare')}
              className={`rail-btn ${activeTab === 'compare' ? 'active' : ''}`}
              title="Discrepancies">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
              </svg>
            </button>
          </div>

          <div className="nav-slot">
            <button 
              onClick={() => setActiveTab('review')}
              className={`rail-btn ${activeTab === 'review' ? 'active' : ''}`}
              title="Review Queue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              {totalPending > 0 && activeTab !== 'review' && (
                <span className="badge-tag">{totalPending}</span>
              )}
            </button>
          </div>

          <div className="nav-slot">
            <button 
              onClick={() => setActiveTab('audit')}
              className={`rail-btn ${activeTab === 'audit' ? 'active' : ''}`}
              title="Audit Corkboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </button>
          </div>

          <div className="rail-divider"></div>

          <div className="nav-slot">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="rail-btn"
              title="Upload Document">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
          </div>

          <div className="nav-slot">
            <button 
              onClick={() => window.print()}
              className="rail-btn"
              title="Print">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>

          {/* Profile & Switch Role */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              onClick={() => setAuthStep('prompt')}
              title="Click to Switch Role or Re-Login"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                cursor: 'pointer'
              }}>
              {currentRole === 'doctor' ? 'DR' : 'PT'}
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Viewport --- */}
      <main className="light-viewport">
        <header className="viewport-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              The Forgotten Prescription
            </h1>
            {currentRole === 'doctor' && doctorForm.doctorName ? (
              <span style={{ fontSize: '0.78rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '9999px', fontWeight: 700 }}>
                {doctorForm.doctorName} · {doctorForm.qualification} · Reg: {doctorForm.registrationId}
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '9999px', fontWeight: 600 }}>
                Patient Access Mode
              </span>
            )}
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: '9999px' }}>
            <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
              John Doe <span style={{ color: '#86efac' }}>|</span> MRN-914208-D
            </span>
          </div>
        </header>

        <div className="viewport-body">
          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Encounters
                </h2>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)'
                  }}>
                  + Encounter
                </button>
              </div>

              {visits.map((visit) => (
                <div key={visit.id} className="clean-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                      {visit.date}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>11:30 AM</span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '6px 0 2px' }}>
                    {visit.facility}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {visit.provider}
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', color: '#475569', fontSize: '0.86rem', margin: '14px 0' }}>
                    {visit.notes}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#0d9488', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      Rx_{visit.facility.replace(/\s+/g, '')}.pdf
                    </span>

                    <button 
                      onClick={() => setSelectedScan(visit.scanUrl)}
                      style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#0f766e', fontSize: '0.8rem', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>
                      View Prescription
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DIFF */}
          {activeTab === 'compare' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Discrepancy Diff
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="clean-card">
                  <h3 style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '14px', fontWeight: 700 }}>Dr. Patel (Outpatient)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Metformin 500mg (Twice daily)</div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Lisinopril 10mg (Once daily)</div>
                  </div>
                </div>

                <div className="clean-card" style={{ borderColor: '#fecdd3' }}>
                  <h3 style={{ fontSize: '0.92rem', color: '#e11d48', marginBottom: '14px', fontWeight: 700 }}>Dr. Vance (Hospital Discharge)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#fff1f2', border: '1px solid #fda4af', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#9f1239', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Metformin 1000mg (Twice daily)
                      <span style={{ background: '#e11d48', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>DOSE DOUBLED</span>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Aspirin 75mg (Once daily)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEW QUEUE */}
          {activeTab === 'review' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Review Queue
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e11d48' }}>URGENT</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9f1239' }}>{urgentCount} unresolved conflicts</div>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706' }}>PENDING</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>{pendingCount} dose changes awaiting review</div>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>RESOLVED</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>{resolvedWeeklyCount} discrepancies reviewed this week</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="clean-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ 
                          background: conflict.severity === 'HIGH' ? '#ffe4e6' : '#fef3c7', 
                          color: conflict.severity === 'HIGH' ? '#e11d48' : '#b45309', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          padding: '3px 8px', 
                          borderRadius: '6px' 
                        }}>
                          {conflict.severity} ALERT
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{conflict.medicationName}</strong>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ textDecoration: 'line-through' }}>{conflict.sourceA}</span>
                        <span style={{ color: '#0d9488' }}>&rarr;</span>
                        <strong style={{ color: '#0f766e' }}>{conflict.sourceB}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>{conflict.notes}</div>
                    </div>

                    {conflict.status === 'PENDING' ? (
                      <button 
                        onClick={() => resolveConflict(conflict.id, conflict.sourceB)}
                        style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Sign and Authorize
                      </button>
                    ) : (
                      <span style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.84rem' }}>Verified</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT CORKBOARD */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Audit Corkboard
                </h2>
              </div>

              <div className="sticky-grid">
                {stickyNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="sticky-note" 
                    style={{ backgroundColor: note.color, transform: `rotate(${note.rotation}deg)` }}>
                    <div className="sticky-tape"></div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {note.action}
                      </div>
                      <p className="sticky-text">{note.details}</p>
                    </div>
                    <div style={{ borderTop: '1px dashed rgba(0,0,0,0.15)', paddingTop: '10px', fontSize: '0.74rem', color: 'rgba(0,0,0,0.5)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{note.user}</span>
                      <span>{note.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Prescription Viewer Modal */}
      {selectedScan && (
        <div 
          onClick={() => setSelectedScan(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '520px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '14px', fontWeight: 700 }}>Prescription Document</h3>
            <img src={selectedScan} alt="Document Scan" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            <button 
              onClick={() => setSelectedScan(null)}
              style={{ marginTop: '16px', background: '#0d9488', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}