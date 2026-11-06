import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { initialVisits, initialConflicts, type Conflict, type Visit } from './data';
import { RealOpticalScanner } from './RealOpticalScanner';
import { MedicationHeatmap } from './MedicationHeatmap';

type DoctorTab = 'scan_patient' | 'timeline' | 'compare' | 'review' | 'audit' | 'new_script';
type PatientTab = 'my_qr' | 'scan_script' | 'schedule' | 'medications' | 'activity_heatmap';
type UserRole = 'doctor' | 'student';

export interface EscalationCheckItem {
  medicationName: string;
  priorDoctor: string;
  priorFacility: string;
  priorDate: string;
  priorDosage: string;
  priorFrequency: string;
  currentDoctor: string;
  currentDate: string;
  currentDosage: string;
  currentFrequency: string;
  diffSummary: string;
}

interface DoctorProfile {
  doctorName: string;
  registrationId: string;
  speciality: string;
  status: 'ACTIVE' | 'ADMIN' | 'VERIFIED';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('doctor');

  const [doctorTab, setDoctorTab] = useState<DoctorTab>('scan_patient');
  const [patientTab, setPatientTab] = useState<PatientTab>('my_qr');

  const [patientProfile] = useState({
    name: 'S Mithunn',
    mrn: 'STU-2026-CSE-L2',
    age: 18,
    allergies: ['Penicillin'],
    bloodGroup: 'B+'
  });

  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [conflicts, setConflicts] = useState<Conflict[]>(initialConflicts);
  const [resolvedWeeklyCount, setResolvedWeeklyCount] = useState<number>(12);

  const [doctorForm] = useState<DoctorProfile>({
    doctorName: 'Dr. Evelyn Vance',
    registrationId: 'MCI-TN-89412',
    speciality: 'Cardiology',
    status: 'ADMIN'
  });

  const [prescribingMeds, setPrescribingMeds] = useState<Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }>>([
    {
      id: 'item-1',
      name: 'Atorvastatin',
      dosage: '40mg',
      frequency: 'Once daily at bedtime',
      instructions: 'Take with dinner. Monitor liver panel.'
    }
  ]);
  const [generatedScriptPayload, setGeneratedScriptPayload] = useState<string>(() => JSON.stringify({
    type: 'DIGITAL_PRESCRIPTION',
    scriptId: 'RX-894120',
    timestamp: '10:40 AM',
    date: 'Nov 06, 2026',
    prescriber: 'Dr. Evelyn Vance',
    regId: 'MCI-TN-89412',
    medications: [
      {
        name: 'Atorvastatin',
        dosage: '40mg',
        frequency: 'Once daily at bedtime',
        notes: 'Take with dinner. Monitor liver panel.'
      }
    ]
  }));
  const [activePrescriptions, setActivePrescriptions] = useState<Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    prescriber: string;
    instructions?: string;
  }>>([
    {
      id: 'rx-init-1',
      name: 'Metformin',
      dosage: '1000mg',
      frequency: 'Twice daily',
      prescriber: 'Dr. Evelyn Vance'
    }
  ]);

  const [scannedNotification, setScannedNotification] = useState<string | null>(null);
  const [isDoctorScanningCamera, setIsDoctorScanningCamera] = useState<boolean>(false);
  const [isPatientScanningCamera, setIsPatientScanningCamera] = useState<boolean>(false);

  // Clinical Escalation Verification Modal State
  const [escalationModalData, setEscalationModalData] = useState<{
    items: EscalationCheckItem[];
    clinicalRationale: string;
  } | null>(null);

  // Selected Activity Tile State for Heatmap slide-over
  const [selectedActivityDate, setSelectedActivityDate] = useState<{
    dateStr: string;
    events: Array<{
      facility: string;
      provider: string;
      notes: string;
      medications: Array<{ name: string; dosage: string; frequency: string; prescriber: string }>;
    }>;
  } | null>(null);

  interface DoctorStickyNote {
    id: string;
    timestamp: string;
    user: string;
    title: string;
    details: string;
    followUpDate?: string;
    priority?: 'NORMAL' | 'URGENT';
    color: string;
    rotation: number;
  }

  const [stickyNotes, setStickyNotes] = useState<DoctorStickyNote[]>([
    {
      id: 's1',
      timestamp: 'Today, 10:15 AM',
      user: 'Dr. K. Patel (GP)',
      title: 'Follow-up on HbA1c & Fasting Glucose',
      details: 'Patient started on Metformin 500mg. Re-evaluate blood glucose levels and renal function in 4 weeks.',
      followUpDate: 'Nov 15, 2026',
      priority: 'NORMAL',
      color: '#fef9c3',
      rotation: -1.2
    },
    {
      id: 's2',
      timestamp: 'Today, 11:30 AM',
      user: 'Metro Heart Institute',
      title: 'Check Blood Pressure & Liver Panel',
      details: 'Metformin escalated to 1000mg. Schedule comprehensive lipid panel and LFT review before next visit.',
      followUpDate: 'Dec 02, 2026',
      priority: 'URGENT',
      color: '#fee2e2',
      rotation: 1.5
    },
    {
      id: 's3',
      timestamp: 'Yesterday, 04:20 PM',
      user: 'Dr. Evelyn Vance',
      title: 'Medication Adherence Review',
      details: 'Check if patient experiences any gastrointestinal side effects from dose escalation.',
      followUpDate: 'Nov 20, 2026',
      priority: 'NORMAL',
      color: '#ccfbf1',
      rotation: -0.8
    }
  ]);

  // New Note Modal / Form state
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [newNoteForm, setNewNoteForm] = useState({
    title: '',
    details: '',
    followUpDate: '',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT',
    color: '#fef9c3'
  });

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const patientQrPayload = JSON.stringify({
    type: 'PATIENT_PASSPORT',
    mrn: patientProfile.mrn,
    name: patientProfile.name,
    allergies: patientProfile.allergies,
    medsCount: visits.flatMap(v => v.medications).length
  });

  const handleDoctorRealScanSuccess = (decodedText: string) => {
    setIsDoctorScanningCamera(false);
    let patientName = patientProfile.name;
    let patientMrn = patientProfile.mrn;

    try {
      const data = JSON.parse(decodedText);
      if (data.name) patientName = data.name;
      if (data.mrn) patientMrn = data.mrn;
    } catch {
      // Non-JSON scan fallback
    }

    setScannedNotification(`Decoded Live Optical Stream: Imported record for ${patientName} (${patientMrn})!`);
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: doctorForm.doctorName,
        title: 'Patient QR Scanned',
        details: `Decoded optical QR stream for ${patientName}. Medical history loaded.`,
        followUpDate: 'Initial consultation',
        priority: 'NORMAL',
        color: '#ccfbf1',
        rotation: 1.4
      },
      ...prev
    ]);

    setDoctorTab('timeline');
    setTimeout(() => {
      setScannedNotification(null);
    }, 2500);
  };

  const handlePatientRealScanSuccess = (decodedText: string) => {
    setIsPatientScanningCamera(false);
    try {
      const data = typeof decodedText === 'string' && decodedText.startsWith('{')
        ? JSON.parse(decodedText)
        : null;

      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const prescriber = (data && data.prescriber) || doctorForm.doctorName;

      // Extract medications reliably from any format:
      let incomingMedsList: Array<{ name: string; dosage: string; frequency: string; notes?: string }> = [];

      if (data && Array.isArray(data.medications) && data.medications.length > 0) {
        incomingMedsList = data.medications.map((m: any) => ({
          name: m.name || m.medication || 'Prescribed Therapy',
          dosage: m.dosage || m.dose || 'Standard Dose',
          frequency: m.frequency || 'Once daily',
          notes: m.notes || m.instructions || ''
        }));
      } else if (data && (data.medication || data.name)) {
        incomingMedsList = [{
          name: data.medication || data.name,
          dosage: data.dosage || data.dose || 'Standard Dose',
          frequency: data.frequency || 'Once daily',
          notes: data.notes || data.instructions || ''
        }];
      } else {
        // Fallback: If scanned non-JSON string or doctor's active form
        incomingMedsList = prescribingMeds.map(m => ({
          name: m.name || 'Prescribed Therapy',
          dosage: m.dosage || 'Standard Dose',
          frequency: m.frequency || 'Once daily',
          notes: m.instructions || ''
        }));
      }

      const newMedsObjects = incomingMedsList.map((m, idx) => ({
        id: 'm-' + Date.now() + '-' + idx,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        prescriber: prescriber,
        date: currentDateStr
      }));

      const newVisit: Visit = {
        id: 'v-' + Date.now(),
        date: `${currentDateStr} (${currentTimeStr})`,
        facility: 'Peer Clinical Consultation & Handover',
        provider: prescriber,
        notes: `Authorized prescription synced live via optical QR scan at ${currentTimeStr}. Prescribed ${incomingMedsList.length} therapy items.`,
        scanUrl: '',
        medications: newMedsObjects
      };

      // Real-time Conflict & Discrepancy Detection Engine
      const newDiscrepancies: Conflict[] = [];
      const existingMeds = visits.flatMap(v => v.medications);

      incomingMedsList.forEach((incoming, idx) => {
        const match = existingMeds.find(
          em => em.name.trim().toLowerCase() === incoming.name.trim().toLowerCase()
        );

        if (match && match.dosage.trim().toLowerCase() !== incoming.dosage.trim().toLowerCase()) {
          newDiscrepancies.push({
            id: 'conf-' + Date.now() + '-' + idx,
            medicationName: incoming.name,
            sourceA: `${match.dosage} (${match.prescriber})`,
            sourceB: `${incoming.dosage} (${prescriber})`,
            severity: 'HIGH',
            status: 'PENDING',
            notes: `LIVE OPTICAL DISCREPANCY: ${incoming.name} dose escalated from ${match.dosage} to ${incoming.dosage} at ${currentTimeStr}.`
          });
        }
      });

      if (newDiscrepancies.length > 0) {
        setConflicts(prev => [...newDiscrepancies, ...prev]);
      }

      setVisits(prev => [newVisit, ...prev]);
      setActivePrescriptions(prev => [
        ...incomingMedsList.map((im, idx) => ({
          id: 'rx-' + Date.now() + '-' + idx,
          name: im.name,
          dosage: im.dosage,
          frequency: im.frequency,
          prescriber: prescriber,
          instructions: im.notes
        })),
        ...prev
      ]);

      const medSummary = incomingMedsList.map(m => `${m.name} ${m.dosage}`).join(', ');
      setScannedNotification(
        newDiscrepancies.length > 0
          ? `⚠️ Discrepancy Flagged: Dose shift detected for ${newDiscrepancies.map(d => d.medicationName).join(', ')}!`
          : `Synced at ${currentTimeStr}: Ingested ${medSummary}`
      );

      setStickyNotes(prev => [
        ...(newDiscrepancies.length > 0 ? [{
          id: 'alert-' + Date.now(),
          timestamp: `Today, ${currentTimeStr}`,
          user: 'Safety Checker',
          title: 'Dose Conflict Flagged',
          details: `Conflict detected across care transitions: ${newDiscrepancies.map(d => `${d.medicationName} (${d.sourceA} -> ${d.sourceB})`).join('; ')}`,
          followUpDate: 'Review urgently',
          priority: 'URGENT' as const,
          color: '#fee2e2',
          rotation: -2.2
        }] : []),
        {
          id: String(Date.now()),
          timestamp: `Today, ${currentTimeStr}`,
          user: 'Prescription Transfer',
          title: 'Prescription Ingested',
          details: `Ingested ${medSummary} at ${currentTimeStr}. Prescriber: ${prescriber}.`,
          followUpDate: 'Follow-up per schedule',
          priority: 'NORMAL' as const,
          color: '#ccfbf1',
          rotation: 1.6
        },
        ...prev
      ]);

      setTimeout(() => {
        setScannedNotification(null);
        setPatientTab('schedule');
      }, 1400);
    } catch (err) {
      console.error("QR decode error:", err);
      // Even if raw text, take whatever doctor currently has configured
      const fallbackList = prescribingMeds.map(m => ({
        name: m.name || 'Prescribed Therapy',
        dosage: m.dosage || 'Standard Dose',
        frequency: m.frequency || 'Once daily',
        notes: m.instructions || ''
      }));

      setActivePrescriptions(prev => [
        ...fallbackList.map((im, idx) => ({
          id: 'rx-' + Date.now() + '-' + idx,
          name: im.name,
          dosage: im.dosage,
          frequency: im.frequency,
          prescriber: doctorForm.doctorName,
          instructions: im.notes
        })),
        ...prev
      ]);

      setScannedNotification(`Live Ingestion Fallback: Added ${fallbackList.map(m => m.name).join(', ')} to schedule.`);
      setPatientTab('schedule');
    }
  };

  const handleDoctorScanPatient = () => {
    setScannedNotification(`Imported record for ${patientProfile.name} (${patientProfile.mrn}). Full history mounted.`);
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: doctorForm.doctorName,
        title: 'Patient QR Scanned',
        details: `Loaded clinical history for ${patientProfile.name} via encrypted QR handshake.`,
        followUpDate: 'Initial consultation',
        priority: 'NORMAL',
        color: '#ccfbf1',
        rotation: 1.2
      },
      ...prev
    ]);
    setTimeout(() => {
      setScannedNotification(null);
      setDoctorTab('timeline');
    }, 1100);
  };

  const addPrescribingMedRow = () => {
    setPrescribingMeds(prev => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        name: '',
        dosage: '',
        frequency: 'Once daily',
        instructions: ''
      }
    ]);
  };

  const removePrescribingMedRow = (id: string) => {
    if (prescribingMeds.length <= 1) return;
    setPrescribingMeds(prev => prev.filter(m => m.id !== id));
  };

  const updatePrescribingMedField = (id: string, field: 'name' | 'dosage' | 'frequency' | 'instructions', val: string) => {
    setPrescribingMeds(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const executeScriptQRGeneration = (clinicalRationale = '') => {
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const payload = JSON.stringify({
      type: 'DIGITAL_PRESCRIPTION',
      scriptId: 'RX-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: currentTimeStr,
      date: currentDateStr,
      prescriber: doctorForm.doctorName,
      regId: doctorForm.registrationId,
      clinicalRationale: clinicalRationale || undefined,
      medications: prescribingMeds.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        notes: m.instructions
      }))
    });

    setGeneratedScriptPayload(payload);
    const summary = prescribingMeds.map(m => `${m.name} ${m.dosage}`).filter(Boolean).join(', ');
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: `Today, ${currentTimeStr}`,
        user: doctorForm.doctorName,
        title: clinicalRationale ? 'Escalation Authorized & Signed' : 'Prescription Issued',
        details: clinicalRationale
          ? `Verified escalation for: ${summary}. Rationale: "${clinicalRationale}".`
          : `Issued digital prescription for: ${summary}.`,
        followUpDate: 'Follow-up in 2 weeks',
        priority: clinicalRationale ? 'URGENT' : 'NORMAL',
        color: clinicalRationale ? '#fee2e2' : '#fef9c3',
        rotation: -1.4
      },
      ...prev
    ]);
    setScannedNotification(clinicalRationale ? `Escalation Authorized: Transfer QR Generated!` : `Transfer QR Generated for ${summary}`);
    setTimeout(() => setScannedNotification(null), 3000);
  };

  const handleGenerateScriptQR = (e: React.FormEvent) => {
    e.preventDefault();
    const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    // Prescribing Safety Checker & Escalation Detection
    const detectedEscalations: EscalationCheckItem[] = [];

    // Scan all prior visits for matching drug names
    visits.forEach(visit => {
      visit.medications.forEach(priorMed => {
        prescribingMeds.forEach(currMed => {
          if (
            currMed.name.trim().toLowerCase() === priorMed.name.trim().toLowerCase() &&
            currMed.name.trim().length > 0
          ) {
            // Check if dosage or frequency differs
            const dosageDiff = currMed.dosage.trim().toLowerCase() !== priorMed.dosage.trim().toLowerCase();
            const freqDiff = currMed.frequency.trim().toLowerCase() !== priorMed.frequency.trim().toLowerCase();

            if (dosageDiff || freqDiff) {
              // Avoid duplicates in the modal list
              if (!detectedEscalations.some(item => item.medicationName.toLowerCase() === currMed.name.toLowerCase())) {
                detectedEscalations.push({
                  medicationName: currMed.name,
                  priorDoctor: priorMed.prescriber || visit.provider,
                  priorFacility: visit.facility,
                  priorDate: priorMed.date || visit.date,
                  priorDosage: priorMed.dosage,
                  priorFrequency: priorMed.frequency,
                  currentDoctor: doctorForm.doctorName,
                  currentDate: currentDateStr,
                  currentDosage: currMed.dosage,
                  currentFrequency: currMed.frequency,
                  diffSummary: dosageDiff && freqDiff
                    ? `Dose modified (${priorMed.dosage} → ${currMed.dosage}) & frequency changed (${priorMed.frequency} → ${currMed.frequency})`
                    : dosageDiff
                    ? `Dosage change (${priorMed.dosage} → ${currMed.dosage})`
                    : `Frequency modified (${priorMed.frequency} → ${currMed.frequency})`
                });
              }
            }
          }
        });
      });
    });

    if (detectedEscalations.length > 0) {
      // Intercept and open Clinical Escalation Verification Modal
      setEscalationModalData({
        items: detectedEscalations,
        clinicalRationale: ''
      });
      return;
    }

    // If no escalations detected, generate QR directly
    executeScriptQRGeneration();
  };

  const handlePatientScanScript = () => {
    const firstMed = prescribingMeds[0] || { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', instructions: '' };
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newMedsObjects = prescribingMeds.map((m, idx) => ({
      id: 'm-' + Date.now() + '-' + idx,
      name: m.name || 'Prescribed Med',
      dosage: m.dosage || 'Standard Dose',
      frequency: m.frequency || 'Once daily',
      prescriber: doctorForm.doctorName,
      date: currentDateStr
    }));

    const newVisit: Visit = {
      id: 'v-' + Date.now(),
      date: `${currentDateStr} (${currentTimeStr})`,
      facility: 'Consultation & Digital Handover',
      provider: doctorForm.doctorName,
      notes: firstMed.instructions || `Authorized multi-med prescription received via secure QR exchange at ${currentTimeStr}.`,
      scanUrl: '',
      medications: newMedsObjects
    };

    setVisits([newVisit, ...visits]);
    setActivePrescriptions(prev => [
      ...prescribingMeds.map((m, idx) => ({
        id: 'rx-' + Date.now() + '-' + idx,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        prescriber: doctorForm.doctorName,
        instructions: m.instructions
      })),
      ...prev
    ]);
    setScannedNotification(`Synced at ${currentTimeStr}: ${newMedsObjects.map(m => `${m.name} (${m.dosage})`).join(', ')} added to schedule.`);

    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: `Today, ${currentTimeStr}`,
        user: 'Patient Direct Sync',
        title: 'Prescription Transferred',
        details: `Imported ${newMedsObjects.map(m => `${m.name} ${m.dosage}`).join(', ')}. Prescriber: ${doctorForm.doctorName}.`,
        followUpDate: 'Follow-up per schedule',
        priority: 'NORMAL',
        color: '#ccfbf1',
        rotation: 1.6
      },
      ...prev
    ]);

    setTimeout(() => {
      setScannedNotification(null);
      setPatientTab('schedule');
    }, 1200);
  };

  const resolveConflict = (id: string, resolution: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
    setResolvedWeeklyCount(prev => prev + 1);

    const colors = ['#fef9c3', '#ccfbf1', '#fee2e2', '#ffedd5', '#e0e7ff'];
    setStickyNotes(prev => [
      {
        id: String(Date.now()),
        timestamp: 'Just now',
        user: `${doctorForm.doctorName} (Signed)`,
        title: 'Conflict Resolved',
        details: `Approved: ${resolution}`,
        followUpDate: 'Routine check',
        priority: 'NORMAL',
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Number((Math.random() * 3 - 1.5).toFixed(1))
      },
      ...prev
    ]);
  };

  const urgentCount = conflicts.filter(c => c.status === 'PENDING' && c.severity === 'HIGH').length;
  const pendingCount = conflicts.filter(c => c.status === 'PENDING' && (c.severity === 'MEDIUM' || c.severity === 'LOW')).length;
  const totalPending = urgentCount + pendingCount;

  /* ------------------------------------------------------------- */
  /* SOLID AUTHENTICATION GATE (MAIN UI COMPLETELY HIDDEN)          */
  /* ------------------------------------------------------------- */
  if (!isAuthenticated) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '40px 36px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#f0fdfa',
            border: '1px solid #ccfbf1',
            color: '#0d9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            MedContinuity
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 24px' }}>
            Offline Medication Handover
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleLogin('doctor')}
              className="clinical-btn-primary"
              style={{ padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}
            >
              Doctor Login
            </button>

            <button
              onClick={() => handleLogin('student')}
              className="clinical-btn-secondary"
              style={{ padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}
            >
              Patient Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* CLINICAL WORKSPACE                                            */
  /* ------------------------------------------------------------- */
  return (
    <div className="desktop-app" style={{ position: 'relative' }}>
      {scannedNotification && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#064e3b',
          color: '#ffffff',
          padding: '10px 24px',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px rgba(6, 78, 59, 0.25)',
          zIndex: 10000,
          fontWeight: 700,
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {scannedNotification}
        </div>
      )}

      {/* Navigation Rail */}
      <aside className="nav-column">
        <div className="curved-pill-rail">
          <div className="brand-gem" title="MedContinuity Clinical Safety">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>

          {currentRole === 'doctor' ? (
            <>
              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('scan_patient')}
                  className={`rail-btn ${doctorTab === 'scan_patient' ? 'active' : ''}`}
                  title="Scan Patient QR">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('new_script')}
                  className={`rail-btn ${doctorTab === 'new_script' ? 'active' : ''}`}
                  title="New Prescription">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('review')}
                  className={`rail-btn ${doctorTab === 'review' ? 'active' : ''}`}
                  title="Review Warnings">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                  {totalPending > 0 && doctorTab !== 'review' && (
                    <span className="badge-tag">{totalPending}</span>
                  )}
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('compare')}
                  className={`rail-btn ${doctorTab === 'compare' ? 'active' : ''}`}
                  title="Compare Records">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('timeline')}
                  className={`rail-btn ${doctorTab === 'timeline' ? 'active' : ''}`}
                  title="Patient History">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setDoctorTab('audit')}
                  className={`rail-btn ${doctorTab === 'audit' ? 'active' : ''}`}
                  title="Follow-up Notes">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    <path d="M9 14h6"/>
                    <path d="M9 18h6"/>
                    <path d="M9 10h6"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="nav-slot">
                <button 
                  onClick={() => setPatientTab('my_qr')}
                  className={`rail-btn ${patientTab === 'my_qr' ? 'active' : ''}`}
                  title="My QR Code">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setPatientTab('scan_script')}
                  className={`rail-btn ${patientTab === 'scan_script' ? 'active' : ''}`}
                  title="Scan Doctor QR">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setPatientTab('schedule')}
                  className={`rail-btn ${patientTab === 'schedule' ? 'active' : ''}`}
                  title="Daily Schedule">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setPatientTab('medications')}
                  className={`rail-btn ${patientTab === 'medications' ? 'active' : ''}`}
                  title="My Medications">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"/>
                    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
                  </svg>
                </button>
              </div>

              <div className="nav-slot">
                <button 
                  onClick={() => setPatientTab('activity_heatmap')}
                  className={`rail-btn ${patientTab === 'activity_heatmap' ? 'active' : ''}`}
                  title="Medication Activity">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="4" height="4" rx="1"/>
                    <rect x="10" y="3" width="4" height="4" rx="1"/>
                    <rect x="17" y="3" width="4" height="4" rx="1"/>
                    <rect x="3" y="10" width="4" height="4" rx="1"/>
                    <rect x="10" y="10" width="4" height="4" rx="1"/>
                    <rect x="17" y="10" width="4" height="4" rx="1"/>
                    <rect x="3" y="17" width="4" height="4" rx="1"/>
                    <rect x="10" y="17" width="4" height="4" rx="1"/>
                    <rect x="17" y="17" width="4" height="4" rx="1"/>
                  </svg>
                </button>
              </div>
            </>
          )}

          <div className="rail-divider"></div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              onClick={() => setIsAuthenticated(false)}
              title="Logout"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '11px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}>
              {currentRole === 'doctor' ? 'DOC' : 'PT'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <main className="clinical-viewport">
        {/* Header Bar */}
        <header className="viewport-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
              MedContinuity
            </h1>

            {currentRole === 'doctor' ? (
              <span style={{ fontSize: '0.74rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                {doctorForm.doctorName}
              </span>
            ) : (
              <span style={{ fontSize: '0.74rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                Patient
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '5px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                {patientProfile.name} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{patientProfile.mrn}</span>
              </span>
            </div>

            <button 
              onClick={() => setIsAuthenticated(false)}
              className="clinical-btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              Exit
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* DOCTOR VIEWPORT                                          */}
        {/* ======================================================== */}
        {currentRole === 'doctor' && (
          <div className="viewport-body">
            {/* DOCTOR TAB 1: SCAN PATIENT QR */}
            {doctorTab === 'scan_patient' && (
              <div style={{ maxWidth: '520px', margin: '30px auto 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Scan Patient QR
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '20px' }}>
                  Scan the patient's QR code to view their medication history.
                </p>

                {isDoctorScanningCamera ? (
                  <RealOpticalScanner
                    title="Camera Scanner"
                    subtitle="Scan Patient QR Code"
                    onClose={() => setIsDoctorScanningCamera(false)}
                    onScanSuccess={handleDoctorRealScanSuccess}
                  />
                ) : (
                  <div className="clinical-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Ready to Scan
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '320px', margin: '0 auto 20px' }}>
                      Click below to open the camera and scan the code.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => setIsDoctorScanningCamera(true)}
                        className="clinical-btn-primary"
                        style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        Open Camera
                      </button>

                      <button 
                        onClick={handleDoctorScanPatient}
                        className="clinical-btn-secondary"
                        style={{ padding: '10px 16px', fontSize: '0.8rem' }}>
                        Test Demo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DOCTOR TAB 2: ISSUE DIGITAL PRESCRIPTION */}
            {doctorTab === 'new_script' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                        Write Prescription
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                        Enter medicines and create a QR code.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addPrescribingMedRow}
                      className="clinical-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>+</span> Add Medicine
                    </button>
                  </div>

                  <form onSubmit={handleGenerateScriptQR} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {prescribingMeds.map((item, index) => (
                      <div key={item.id} className="clinical-card" style={{ padding: '16px 18px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                            Prescription Item #{index + 1}
                          </span>
                          {prescribingMeds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePrescribingMedRow(item.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#e11d48',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 6px'
                              }}>
                              Remove
                            </button>
                          )}
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Medicine Name
                          </label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Metformin or Atorvastatin"
                            value={item.name}
                            onChange={e => updatePrescribingMedField(item.id, 'name', e.target.value)}
                            className="clinical-input"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Dose
                            </label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. 500mg, 1000mg, 20mg"
                              value={item.dosage}
                              onChange={e => updatePrescribingMedField(item.id, 'dosage', e.target.value)}
                              className="clinical-input"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Frequency
                            </label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Twice daily, Once at bedtime"
                              value={item.frequency}
                              onChange={e => updatePrescribingMedField(item.id, 'frequency', e.target.value)}
                              className="clinical-input"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Instructions
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. Take with dinner"
                            value={item.instructions}
                            onChange={e => updatePrescribingMedField(item.id, 'instructions', e.target.value)}
                            className="clinical-input"
                          />
                        </div>
                      </div>
                    ))}

                    <button type="submit" className="clinical-btn-primary" style={{ padding: '12px' }}>
                      Generate Prescription QR
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    Prescription QR
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                    Show this code to the patient to scan.
                  </p>

                  <div className="clinical-card" style={{ textAlign: 'center', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {generatedScriptPayload ? (
                      <>
                        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                          <QRCodeSVG value={generatedScriptPayload} size={180} />
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f766e' }}>
                          {prescribingMeds.map(m => `${m.name} ${m.dosage}`).filter(Boolean).join(' + ') || 'Prescription Encoded'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          Authorized by {doctorForm.doctorName}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        Fill out prescription details and sign to generate optical QR transfer.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DOCTOR TAB 3: REVIEW QUEUE */}
            {doctorTab === 'review' && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Review Queue
                  </h2>
                </div>

                <div className="metric-grid">
                  <div className="metric-card urgent">
                    <div className="metric-dot urgent"></div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9f1239', letterSpacing: '0.04em' }}>URGENT</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#9f1239' }}>{urgentCount} unresolved conflicts</div>
                    </div>
                  </div>

                  <div className="metric-card pending">
                    <div className="metric-dot pending"></div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400e', letterSpacing: '0.04em' }}>PENDING</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#92400e' }}>{pendingCount} dose changes awaiting review</div>
                    </div>
                  </div>

                  <div className="metric-card resolved">
                    <div className="metric-dot resolved"></div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', letterSpacing: '0.04em' }}>RESOLVED</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534' }}>{resolvedWeeklyCount} discrepancies reviewed this week</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {conflicts.map(conflict => (
                    <div key={conflict.id} className="clinical-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ 
                            background: conflict.severity === 'HIGH' ? '#ffe4e6' : '#fef3c7', 
                            color: conflict.severity === 'HIGH' ? '#e11d48' : '#b45309', 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '2px 8px', 
                            borderRadius: '4px' 
                          }}>
                            {conflict.severity} ALERT
                          </span>
                          <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{conflict.medicationName}</strong>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ textDecoration: 'line-through' }}>{conflict.sourceA}</span>
                          <span style={{ color: '#0d9488' }}>&rarr;</span>
                          <strong style={{ color: '#0f766e' }}>{conflict.sourceB}</strong>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>{conflict.notes}</div>
                      </div>

                      {conflict.status === 'PENDING' ? (
                        <button 
                          onClick={() => resolveConflict(conflict.id, conflict.sourceB)}
                          className="clinical-btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                          Sign and Authorize
                        </button>
                      ) : (
                        <span style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.82rem' }}>Verified</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DOCTOR TAB 4: CROSS-FACILITY DIFF */}
            {doctorTab === 'compare' && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Cross-Facility Discrepancy Diff
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                  <div className="clinical-card">
                    <h3 style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '12px', fontWeight: 700 }}>Prior Baseline (Dr. Patel)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>Metformin 500mg (Twice daily)</div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>Lisinopril 10mg (Once daily)</div>
                    </div>
                  </div>

                  <div className="clinical-card" style={{ borderColor: '#fecdd3' }}>
                    <h3 style={{ fontSize: '0.88rem', color: '#e11d48', marginBottom: '12px', fontWeight: 700 }}>Hospital Discharge (Dr. Vance)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: '#fff1f2', border: '1px solid #fda4af', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', color: '#9f1239', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Metformin 1000mg (Twice daily)
                        <span style={{ background: '#e11d48', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>DOSE DOUBLED</span>
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>Aspirin 75mg (Once daily)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCTOR TAB 5: TIMELINE */}
            {doctorTab === 'timeline' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Imported History for {patientProfile.name}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                      Verified offline transfer via Health Passport QR
                    </p>
                  </div>
                  <button 
                    onClick={() => setDoctorTab('new_script')}
                    className="clinical-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    + Issue New Digital Script
                  </button>
                </div>

                {visits.map(visit => (
                  <div key={visit.id} className="clinical-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {visit.date}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Verified Handover</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>{visit.facility}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{visit.provider}</div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', color: '#475569', fontSize: '0.82rem', margin: '10px 0' }}>
                      {visit.notes}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {visit.medications.map(m => (
                        <span key={m.id} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {m.name} {m.dosage} · {m.frequency}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DOCTOR TAB 6: FOLLOW-UP & CLINICAL NOTES */}
            {doctorTab === 'audit' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                      Follow-up & Patient Notes
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      Record follow-up dates, lab checks, and clinical reminders for {patientProfile.name}.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewNoteForm({
                        title: '',
                        details: '',
                        followUpDate: '',
                        priority: 'NORMAL',
                        color: '#fef9c3'
                      });
                      setShowNewNoteModal(true);
                    }}
                    className="clinical-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>+</span> Add Follow-up Note
                  </button>
                </div>

                <div className="sticky-grid">
                  {stickyNotes.map(note => (
                    <div 
                      key={note.id} 
                      className="sticky-note" 
                      style={{ 
                        backgroundColor: note.color, 
                        transform: `rotate(${note.rotation}deg)`
                      }}>
                      <div className="sticky-tape"></div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: 800, 
                            color: note.priority === 'URGENT' ? '#9f1239' : '#0f766e', 
                            background: note.priority === 'URGENT' ? 'rgba(255, 228, 230, 0.7)' : 'rgba(255, 255, 255, 0.65)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {note.priority === 'URGENT' ? 'Urgent Alert' : 'Follow-up'}
                          </span>

                          <button
                            onClick={() => setStickyNotes(prev => prev.filter(n => n.id !== note.id))}
                            title="Remove Note"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(0,0,0,0.4)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              padding: '0 4px',
                              lineHeight: '1'
                            }}>
                            ✕
                          </button>
                        </div>

                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                          {note.title}
                        </h4>

                        <p className="sticky-text">{note.details}</p>
                      </div>

                      <div style={{ marginTop: '14px', borderTop: '1px dashed rgba(0,0,0,0.15)', paddingTop: '10px' }}>
                        {note.followUpDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#0f766e', marginBottom: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Due: {note.followUpDate}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{note.user}</span>
                          <span>{note.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STUDENT / PATIENT VIEWPORT                               */}
        {/* ======================================================== */}
        {currentRole === 'student' && (
          <div className="viewport-body">
            {/* STUDENT TAB 1: PASSPORT QR */}
            {patientTab === 'my_qr' && (
              <div style={{ maxWidth: '520px', margin: '20px auto 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  Medical Passport QR
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '22px' }}>
                  Display this token during consultation for doctor verification.
                </p>

                <div className="clinical-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '18px' }}>
                    <QRCodeSVG value={patientQrPayload} size={200} />
                  </div>

                  <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>STUDENT</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{patientProfile.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>REG ID</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{patientProfile.mrn}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ALLERGIES</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#e11d48' }}>Penicillin</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENT TAB 2: SCAN DOCTOR SCRIPT */}
            {patientTab === 'scan_script' && (
              <div style={{ maxWidth: '560px', margin: '20px auto 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  Receive Digital Prescription
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '22px' }}>
                  Align your camera with the doctor's screen to absorb prescribed therapies.
                </p>

                {isPatientScanningCamera ? (
                  <RealOpticalScanner
                    title="Live Patient Optical Receptor"
                    subtitle="Point your camera at the Doctor's Digital Script QR"
                    onClose={() => setIsPatientScanningCamera(false)}
                    onScanSuccess={handlePatientRealScanSuccess}
                  />
                ) : (
                  <div className="clinical-card" style={{ padding: '34px 24px', border: '1.5px dashed #0d9488', backgroundColor: '#f0fdfa' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ffffff', border: '1px solid #ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                    
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      Optical Receptor Ready
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '340px', margin: '0 auto 20px' }}>
                      Scan Doctor's Rx QR from laptop monitor or printed handover sheet.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setIsPatientScanningCamera(true)}
                        className="clinical-btn-primary"
                        style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        Open Camera & Scan Rx
                      </button>

                      <button 
                        onClick={handlePatientScanScript}
                        className="clinical-btn-secondary"
                        style={{ padding: '12px 18px', fontSize: '0.8rem' }}>
                        Demo Fallback Sim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT TAB 3: SCHEDULE */}
            {patientTab === 'schedule' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                      Medication Schedule
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      Updated directly from authorized digital QR handovers.
                    </p>
                  </div>

                  <button 
                    onClick={() => setPatientTab('scan_script')}
                    className="clinical-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    + Scan Doctor's Rx QR
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {activePrescriptions.map((rx, idx) => {
                    const colors = ['#0d9488', '#3b82f6', '#8b5cf6', '#e11d48'];
                    const chosenColor = colors[idx % colors.length];
                    return (
                      <div key={rx.id} className="clinical-card" style={{ borderLeft: `4px solid ${chosenColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: chosenColor, textTransform: 'uppercase' }}>
                            {idx === 0 ? 'Morning (08:00 AM)' : idx === 1 ? 'Bedtime (10:00 PM)' : 'Daily Dose'}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Active
                          </span>
                        </div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                          {rx.name} {rx.dosage}
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 8px' }}>
                          {rx.frequency}
                        </p>
                        <div style={{ fontSize: '0.74rem', color: chosenColor, fontWeight: 600 }}>
                          Prescriber: {rx.prescriber}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STUDENT TAB 4: MEDICATIONS */}
            {patientTab === 'medications' && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                    Active Verified Prescriptions
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    Encrypted records authenticated via clinical QR handover.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePrescriptions.map(rx => (
                    <div key={rx.id} className="clinical-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{rx.name}</strong>
                          <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>QR ACTIVE</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                          Dose: {rx.dosage} · {rx.frequency} · Prescriber: {rx.prescriber}
                        </div>
                        {rx.instructions && (
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            Notes: {rx.instructions}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 700 }}>Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PATIENT TAB 5: MEDICATION ACTIVITY */}
            {patientTab === 'activity_heatmap' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                      Medication Activity
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      Activity matrix for {patientProfile.name}.
                    </p>
                  </div>

                  <button
                    onClick={() => setPatientTab('scan_script')}
                    className="clinical-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    + Scan Doctor Rx QR
                  </button>
                </div>

                {/* Heatmap Grid Component */}
                <MedicationHeatmap
                  visits={visits}
                  selectedDate={selectedActivityDate?.dateStr || null}
                  onSelectDate={(dateStr, events) => {
                    setSelectedActivityDate({ dateStr, events });
                  }}
                />

                {/* Selected Date Detail Drawer / Card */}
                {selectedActivityDate && (
                  <div className="clinical-card" style={{
                    marginTop: '20px',
                    borderColor: '#0d9488',
                    backgroundColor: '#f0fdfa',
                    boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #ccfbf1', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                          Encounter Details
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                          {selectedActivityDate.dateStr}
                        </h3>
                      </div>

                      <button
                        onClick={() => setSelectedActivityDate(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                        ✕ Close
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {selectedActivityDate.events.map((ev, eIdx) => (
                        <div key={eIdx} style={{ background: '#ffffff', borderRadius: '12px', padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{ev.facility}</strong>
                            <span style={{ fontSize: '0.74rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {ev.provider}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 10px' }}>
                            {ev.notes}
                          </p>

                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Prescribed Therapies ({ev.medications.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {ev.medications.map((m, mIdx) => (
                              <div key={mIdx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px' }}>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{m.name} {m.dosage}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.frequency}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* CLINICAL ESCALATION VERIFICATION MODAL                   */}
      {/* ======================================================== */}
      {escalationModalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px 30px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid #fecdd3'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#ffe4e6', color: '#e11d48', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    CLINICAL ESCALATION DETECTED
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    MRN: {patientProfile.mrn}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Clinical Escalation Verification
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  A prior regimen exists for the medication(s) you are prescribing. Explicit clinician sign-off is required.
                </p>
              </div>
            </div>

            {/* Comparison Cards for each detected drug escalation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {escalationModalData.items.map((item, idx) => (
                <div key={idx} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{item.medicationName}</strong>
                    <span style={{
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fda4af',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {item.diffSummary}
                    </span>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Previous Order */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Previous Historical Order
                      </div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#334155' }}>
                        {item.priorDosage}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {item.priorFrequency}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#0f766e', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                        Prescriber: <strong>{item.priorDoctor}</strong>
                        <div>{item.priorFacility} · {item.priorDate}</div>
                      </div>
                    </div>

                    {/* Proposed New Order */}
                    <div style={{ background: '#f0fdfa', borderRadius: '12px', padding: '12px 14px', border: '1.5px solid #0d9488' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Proposed New Order (Current)
                      </div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f766e' }}>
                        {item.currentDosage}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px' }}>
                        {item.currentFrequency}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '8px', borderTop: '1px dashed #ccfbf1', paddingTop: '6px' }}>
                        Prescriber: <strong>{item.currentDoctor}</strong>
                        <div>Current Encounter · {item.currentDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinician Rationale Input */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '6px', textTransform: 'uppercase' }}>
                Clinician Escalation Rationale & Justification <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Inadequate glycemic/lipid control on prior baseline; step-up therapy cleared after hepatic enzyme review."
                value={escalationModalData.clinicalRationale}
                onChange={e => setEscalationModalData({ ...escalationModalData, clinicalRationale: e.target.value })}
                className="clinical-textarea"
                style={{ fontSize: '0.82rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                This justification will be permanently written to the immutable local audit trail.
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setEscalationModalData(null)}
                className="clinical-btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.82rem' }}>
                Cancel & Revise Order
              </button>

              <button
                type="button"
                onClick={() => {
                  const rationale = escalationModalData.clinicalRationale.trim() || 'Clinician verified and cleared dosage escalation.';
                  setEscalationModalData(null);
                  executeScriptQRGeneration(rationale);
                }}
                className="clinical-btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.84rem',
                  backgroundColor: '#0d9488',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)'
                }}>
                Confirm & Authorize Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOCTOR NEW FOLLOW-UP NOTE MODAL                          */}
      {/* ======================================================== */}
      {showNewNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            padding: '28px 24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  Add Patient Note
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Reminder and follow-up plan for {patientProfile.name}
                </p>
              </div>
              <button
                onClick={() => setShowNewNoteModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              if (!newNoteForm.title.trim() && !newNoteForm.details.trim()) return;
              const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const randomRotations = [-1.5, -0.8, 0, 0.9, 1.4];
              const randomRot = randomRotations[Math.floor(Math.random() * randomRotations.length)];

              setStickyNotes(prev => [
                {
                  id: String(Date.now()),
                  timestamp: `Today, ${currentTimeStr}`,
                  user: doctorForm.doctorName,
                  title: newNoteForm.title.trim() || 'Follow-up Note',
                  details: newNoteForm.details.trim(),
                  followUpDate: newNoteForm.followUpDate.trim() || undefined,
                  priority: newNoteForm.priority,
                  color: newNoteForm.color,
                  rotation: randomRot
                },
                ...prev
              ]);
              setShowNewNoteModal(false);
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Note Title / Purpose
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Lab Test, Check Blood Pressure"
                  value={newNoteForm.title}
                  onChange={e => setNewNoteForm({ ...newNoteForm, title: e.target.value })}
                  className="clinical-input"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Clinical Instructions & Observations
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Patient requires repeat fasting glucose and LFT prior to next refill."
                  value={newNoteForm.details}
                  onChange={e => setNewNoteForm({ ...newNoteForm, details: e.target.value })}
                  className="clinical-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Follow-up Date / Due
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nov 25, 2026 or 2 weeks"
                    value={newNoteForm.followUpDate}
                    onChange={e => setNewNoteForm({ ...newNoteForm, followUpDate: e.target.value })}
                    className="clinical-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={newNoteForm.priority}
                    onChange={e => {
                      const pri = e.target.value as 'NORMAL' | 'URGENT';
                      setNewNoteForm({
                        ...newNoteForm,
                        priority: pri,
                        color: pri === 'URGENT' ? '#fee2e2' : newNoteForm.color === '#fee2e2' ? '#fef9c3' : newNoteForm.color
                      });
                    }}
                    className="clinical-select">
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Sticky Note Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { color: '#fef9c3', label: 'Yellow' },
                    { color: '#ccfbf1', label: 'Teal' },
                    { color: '#fee2e2', label: 'Pink' },
                    { color: '#e0e7ff', label: 'Indigo' },
                    { color: '#ffedd5', label: 'Orange' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setNewNoteForm({ ...newNoteForm, color: c.color })}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: c.color,
                        border: newNoteForm.color === c.color ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewNoteModal(false)}
                  className="clinical-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
                  Pin Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}