import { useState, useRef } from 'react';
import { initialVisits, initialConflicts, type Conflict, type AuditEntry, type Visit } from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'compare' | 'review' | 'audit'>('timeline');
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [conflicts, setConflicts] = useState<Conflict[]>([
    ...initialConflicts,
    {
      id: 'c3',
      medicationName: 'Atorvastatin',
      sourceA: '20mg once daily (Dr. Patel)',
      sourceB: '40mg once daily (Metro Heart)',
      severity: 'HIGH',
      status: 'PENDING',
      notes: 'Unconfirmed statin dose doubling.'
    },
    {
      id: 'c4',
      medicationName: 'Clopidogrel',
      sourceA: 'Not on patient record',
      sourceB: '75mg once daily (Metro Heart)',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'New antiplatelet added without bleed history verification.'
    },
    {
      id: 'c5',
      medicationName: 'Amlodipine',
      sourceA: '5mg once daily',
      sourceB: '10mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'Blood pressure escalation awaiting clearance.'
    },
    {
      id: 'c6',
      medicationName: 'Omeprazole',
      sourceA: '20mg once daily',
      sourceB: '40mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'GI protection adjustment pending confirmation.'
    },
    {
      id: 'c7',
      medicationName: 'Hydrochlorothiazide',
      sourceA: '25mg once daily',
      sourceB: '12.5mg once daily',
      severity: 'MEDIUM',
      status: 'PENDING',
      notes: 'Dose step-down protocol awaiting review.'
    }
  ]);

  const [resolvedWeeklyCount, setResolvedWeeklyCount] = useState<number>(12);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sticky Notes Audit Trail (all emojis removed)
  const [stickyNotes, setStickyNotes] = useState<Array<AuditEntry & { color: string; rotation: number }>>([
    {
      id: 's1',
      timestamp: 'Today, 10:15 AM',
      user: 'Dr. K. Patel (GP)',
      action: 'Baseline Regimen',
      details: 'Patient John Doe started on Metformin 500mg twice daily and Lisinopril 10mg once daily.',
      color: '#fef08a',
      rotation: -1.5
    },
    {
      id: 's2',
      timestamp: 'Today, 11:30 AM',
      user: 'Metro Heart Admin',
      action: 'Discharge Ingestion',
      details: 'Patient presented discharge paper: Metformin increased to 1000mg. Lisinopril omitted.',
      color: '#bbf7d0',
      rotation: 1.8
    },
    {
      id: 's3',
      timestamp: 'Today, 12:40 PM',
      user: 'Safety Engine',
      action: 'Alert Flagged',
      details: 'Dosage discrepancy (+500mg escalation) detected without primary care confirmation.',
      color: '#fecdd3',
      rotation: -2.0
    }
  ]);

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const dateStr = '2026-11-05';

    const newVisit: Visit = {
      id: 'v-' + Date.now(),
      date: dateStr,
      facility: 'City Urgent Care and Surgical Ingest',
      provider: 'Dr. Evelyn Vance, MD (Cardiology)',
      notes: `Ingested receipt "${file.name}". Client-side OCR extracted revised cardiac and glycemic therapy.`,
      scanUrl: fileUrl,
      medications: [
        { id: 'm-new-1', name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', prescriber: 'Dr. Vance', date: dateStr },
        { id: 'm-new-2', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', prescriber: 'Dr. Vance', date: dateStr }
      ]
    };

    setVisits([newVisit, ...visits]);

    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: 'OCR Parser',
        action: 'Prescription Digitalized',
        details: `Digitalized document "${file.name}". Committed to offline SQLite store.`,
        color: '#ddd6fe',
        rotation: 1.5
      },
      ...prev
    ]);

    setActiveTab('timeline');
  };

  // Conflict Resolution
  const resolveConflict = (id: string, resolution: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
    setResolvedWeeklyCount(prev => prev + 1);

    const colors = ['#fef08a', '#bbf7d0', '#fecdd3', '#fed7aa', '#ddd6fe'];
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: 'Lead Pharmacist (Verified)',
        action: 'Discrepancy Approved',
        details: `Approved: ${resolution}. Regimen locked with zero unverified contradictions.`,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Number((Math.random() * 4 - 2).toFixed(1))
      },
      ...prev
    ]);
  };

  // Metrics for Healthcare Professionals
  const urgentCount = conflicts.filter(c => c.status === 'PENDING' && c.severity === 'HIGH').length;
  const pendingCount = conflicts.filter(c => c.status === 'PENDING' && (c.severity === 'MEDIUM' || c.severity === 'LOW')).length;
  const totalPending = urgentCount + pendingCount;

  return (
    <div className="ehr-container">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,.pdf" 
        style={{ display: 'none' }} 
      />

      {/* Sidebar Rail */}
      <aside className="ehr-sidebar">
        <div className="brand-gem" title="MedContinuity">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20"/>
          </svg>
        </div>
        
        <button 
          title="Chronological Encounters" 
          onClick={() => setActiveTab('timeline')} 
          className={`sidebar-btn ${activeTab === 'timeline' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>

        <button 
          title="Cross-Visit Diff" 
          onClick={() => setActiveTab('compare')} 
          className={`sidebar-btn ${activeTab === 'compare' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
        </button>

        <button 
          title="Review Queue" 
          onClick={() => setActiveTab('review')} 
          className={`sidebar-btn ${activeTab === 'review' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          {totalPending > 0 && <span className="notification-pill">{totalPending}</span>}
        </button>

        <button 
          title="Audit Corkboard" 
          onClick={() => setActiveTab('audit')} 
          className={`sidebar-btn ${activeTab === 'audit' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </button>
      </aside>

      {/* Main Viewport */}
      <main className="ehr-main">
        {/* Top Header */}
        <header className="ehr-topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                The Forgotten Prescription
              </h1>
              <span style={{ fontSize: '0.72rem', background: '#172033', color: '#94a3b8', border: '1px solid #1e293b', padding: '4px 10px', borderRadius: '8px' }}>
                PS4 Continuity and Safe Handover
              </span>
              <span style={{ fontSize: '0.75rem', background: '#032c25', color: '#34d399', border: '1px solid #065f46', padding: '4px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
                Encrypted Local Storage (Zero Cloud Servers)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Offline Handover and Discrepancy Prevention System
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#0e172a', border: '1px solid #1e293b', padding: '6px 14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Patient: <strong style={{ color: '#fff' }}>John Doe</strong> (MRN-914208-D)</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="ehr-scrollable">

          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    CHRONOLOGICAL ENCOUNTERS
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Past hospital visits and discharge orders
                  </p>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#06b6d4',
                    color: '#041c2c',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                  }}>
                  + Encounter
                </button>
              </div>

              {visits.map((visit) => (
                <div key={visit.id} className="encounter-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="encounter-tag">{visit.date}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>11:30 AM</span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: '6px 0 2px' }}>
                    {visit.facility}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Prescriber:</span> {visit.provider}
                  </div>

                  <div className="encounter-quote">
                    "{visit.notes}"
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontSize: '0.82rem' }}>
                      <span style={{ fontFamily: 'monospace' }}>Rx_{visit.facility.replace(/\s+/g, '')}.pdf</span>
                    </div>

                    <button 
                      onClick={() => setSelectedScan(visit.scanUrl)}
                      className="view-rx-btn">
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
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  CROSS-FACILITY DISCREPANCY DIFF
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Comparing primary outpatient baseline against acute discharge orders
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#090f1e', border: '1px solid #131c31', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontSize: '0.92rem', color: '#94a3b8', marginBottom: '14px' }}>Prior Baseline (Dr. Patel)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#0c1527', border: '1px solid #1a2942', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Metformin 500mg (Twice daily)</div>
                    <div style={{ background: '#0c1527', border: '1px solid #1a2942', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Lisinopril 10mg (Once daily)</div>
                  </div>
                </div>

                <div style={{ background: '#090f1e', border: '1px solid #881337', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontSize: '0.92rem', color: '#fb7185', marginBottom: '14px' }}>Discharge Orders (Dr. Vance)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#1c0d18', border: '1px solid #e11d48', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Metformin 1000mg (Twice daily)
                      <span style={{ background: '#e11d48', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>DOSE DOUBLED</span>
                    </div>
                    <div style={{ background: '#0c1527', border: '1px solid #1a2942', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>Aspirin 75mg (Once daily)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEW QUEUE (WITH METRIC DASHBOARD) */}
          {activeTab === 'review' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  REVIEW QUEUE (FOR HEALTHCARE PROFESSIONALS)
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Clinical oversight dashboard showing real-time medication safety verification
                </p>
              </div>

              {/* Requirement Metric Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {/* URGENT CARD */}
                <div style={{ background: '#1c0a0e', border: '1px solid #881337', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f87171', letterSpacing: '0.05em' }}>URGENT</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fecdd3' }}>{urgentCount} unresolved conflicts</div>
                  </div>
                </div>

                {/* PENDING CARD */}
                <div style={{ background: '#1c1608', border: '1px solid #78350f', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>PENDING</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fef3c7' }}>{pendingCount} dose changes awaiting review</div>
                  </div>
                </div>

                {/* RESOLVED CARD */}
                <div style={{ background: '#041c14', border: '1px solid #065f46', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>RESOLVED</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#d1fae5' }}>{resolvedWeeklyCount} discrepancies reviewed this week</div>
                  </div>
                </div>
              </div>

              {/* Conflict Action List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="encounter-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ 
                          background: conflict.severity === 'HIGH' ? '#881337' : '#78350f', 
                          color: conflict.severity === 'HIGH' ? '#fda4af' : '#fde68a', 
                          border: conflict.severity === 'HIGH' ? '1px solid #e11d48' : '1px solid #d97706', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: '4px' 
                        }}>
                          {conflict.severity} ALERT
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{conflict.medicationName}</strong>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ textDecoration: 'line-through' }}>{conflict.sourceA}</span>
                        <span style={{ color: '#06b6d4' }}>&rarr;</span>
                        <strong style={{ color: '#34d399' }}>{conflict.sourceB}</strong>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>{conflict.notes}</div>
                    </div>

                    {conflict.status === 'PENDING' ? (
                      <button 
                        onClick={() => resolveConflict(conflict.id, conflict.sourceB)}
                        style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Sign and Authorize
                      </button>
                    ) : (
                      <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.84rem' }}>Verified by Pharmacist</span>
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
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  CLINICAL AUDIT CORKBOARD
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Sticky note paper trail of every scan, OCR parse, and pharmacist sign-off
                </p>
              </div>

              <div className="sticky-grid">
                {stickyNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="sticky-note" 
                    style={{ backgroundColor: note.color, transform: `rotate(${note.rotation}deg)` }}>
                    <div className="sticky-tape"></div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {note.action}
                      </div>
                      <p className="sticky-text">{note.details}</p>
                    </div>
                    <div style={{ borderTop: '1px dashed rgba(0,0,0,0.15)', paddingTop: '10px', fontSize: '0.72rem', color: 'rgba(0,0,0,0.6)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>User: {note.user}</span>
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
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#090e1a', border: '1px solid #155e75', borderRadius: '20px', padding: '24px', maxWidth: '540px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '14px' }}>Original Handover Prescription Document</h3>
            <img src={selectedScan} alt="Document Scan" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #1e293b' }} />
            <button 
              onClick={() => setSelectedScan(null)}
              style={{ marginTop: '16px', background: '#0e7490', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Close Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}