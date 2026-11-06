# MedContinuity — Offline-First Clinical Handover & Medication Continuity

> **Hackathon Track:** Offline-First Healthcare / Clinical Medication Safety  
> **Team:** Void Runners (PS4-10)

MedContinuity is an enterprise-grade, zero-cloud, offline-first clinical reconciliation and prescription exchange platform. Designed for environments with intermittent or non-existent connectivity, it enables secure, peer-to-peer clinical data exchange between healthcare providers and patients entirely using **optical QR codes** and local device cameras.

---

## The Problem: The "Forgotten Prescription"

When patients move between care settings (clinics, hospitals, specialty consultations), critical prescription changes are lost or delayed due to incompatible EHRs or lack of internet connectivity. This results in:
- Unintentional duplicate therapies and dangerous dosage escalations.
- Medication non-adherence due to confusing schedules.
- Doctors prescribing without immediate visibility into prior regimens.

## Our Solution

MedContinuity establishes an offline bridge between clinicians and patients:
1. **Live Optical Exchange:** Real camera scanning (`html5-qrcode` over HTTPS) enables mobile phones and laptops to exchange encrypted clinical payloads without a central server or Wi-Fi.
2. **Clinical Escalation Safety Gate:** When a doctor prescribes a medication previously taken by the patient at a different dose or frequency, the platform intercepts submission and triggers an explicit clinical escalation review modal before issuing the prescription.
3. **Interactive Medication Activity Heatmap:** A 52-week calendar heat grid gives patients and providers instant visibility into their historical consultation and prescription timeline.
4. **Follow-up & Patient Notes:** A tactile, sticky-note board allows clinicians to pin important follow-up dates, reminders, and lab tests directly on the patient's record.

---

## Key Features

### For Doctors
- **Optical Patient Ingestion:** Point laptop or mobile webcam at the patient's QR code to import full verified medical history and allergies instantly.
- **Multi-Medication Prescribing:** Prescribe multiple medications in a single encounter with custom dosages, frequencies, and administration instructions.
- **Escalation Verification Modal:** Automatic discrepancy detector flags dose changes across transitions, requiring clinician rationale before generating the transfer QR.
- **Cross-Facility Comparison:** Side-by-side reconciliation between prior baseline clinics and current hospital regimens.
- **Follow-up Notes Board:** Visual sticky notes with custom due dates, urgency flags, and color coding for continuous care tracking.

### For Patients
- **Patient Passport QR:** Generates a lightweight, instant-lock QR code encoding allergies and medication summaries for doctor review.
- **Prescription Ingestion:** Scan the doctor's screen using your mobile camera to sync new medicines into your local schedule.
- **Daily Medication Schedule:** Time-slotted daily view (Morning, Bedtime, Daily Dose) with active medication badges.
- **Medication Activity Heatmap:** GitHub-style 52-week horizontal calendar with month/day labels, hover tooltips, and click-to-view visit details.

---

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Custom Clinical Design Tokens, Plus Jakarta Sans, JetBrains Mono
- **Computer Vision / Scanning:** `html5-qrcode` with auto-framing, environment camera auto-selection, and graceful teardown
- **QR Encoding:** `qrcode.react` (SVG rendering optimized for low-resolution camera capture)
- **Local Security & Offline Transport:** HTTPS via `@vitejs/plugin-basic-ssl` to ensure full WebRTC/`getUserMedia` access across local networks and mobile browsers.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation & Run

1. Navigate to the application directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server with HTTPS:
   ```bash
   npm run dev
   ```

4. Open your browser:
   - On desktop: `https://localhost:5173`
   - On mobile phone (same Wi-Fi network): `https://<YOUR-LOCAL-IP>:5173` *(accept the self-signed local SSL certificate to permit camera access)*.

### Production Build
```bash
npm run build
```

---

## Team Void Runners
Built with clinical rigor and minimalist ergonomics for hackathon evaluation.
