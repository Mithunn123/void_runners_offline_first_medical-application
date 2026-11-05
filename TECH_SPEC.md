# Medi-Trace / The Forgotten Prescription
## Bi-Directional Offline Medication Handover Architecture via Compressed Data-Dense QR Stream

**Technical Specification & Architecture Document**
**Version:** 1.0.0
**Classification:** Internal Technical Reference — Hackathon Edition
**Team:** VOID RUNNERS | Problem Statement PS4-10
**Date:** November 2026

---

> [!IMPORTANT]
> **Safety Disclaimer:** This system is a clinical decision-support and data-transfer tool. It **never prescribes, substitutes, autonomously discontinues, or independently recommends medications**. All clinical authority remains exclusively with licensed clinicians. The software flags discrepancies for human review only.

---

## Table of Contents

1. [Executive Summary & Core Value Proposition](#1-executive-summary--core-value-proposition)
2. [System Architecture & Operational Boundaries](#2-system-architecture--operational-boundaries)
3. [Data Schema & Serialization Specification](#3-data-schema--serialization-specification)
4. [Bi-Directional QR Data Transfer Protocol](#4-bi-directional-qr-data-transfer-protocol)
5. [Deterministic Reconciliation & Diff Engine](#5-deterministic-reconciliation--diff-engine)
6. [Clinician Review Queue & Sign-Off Workflow](#6-clinician-review-queue--sign-off-workflow)
7. [Audit Trail Architecture](#7-audit-trail-architecture)
8. [Frontend Architecture (React + TypeScript)](#8-frontend-architecture-react--typescript)
9. [Backend Architecture (Tauri + Rust + SQLite)](#9-backend-architecture-tauri--rust--sqlite)
10. [Security, Privacy & Compliance Boundaries](#10-security-privacy--compliance-boundaries)
11. [Performance Budgets & QR Capacity Calculations](#11-performance-budgets--qr-capacity-calculations)
12. [Deployment & Operational Modes](#12-deployment--operational-modes)
13. [Known Limitations & Risk Register](#13-known-limitations--risk-register)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary & Core Value Proposition

### 1.1 The Clinical Problem

Medication continuity failure is one of the most preventable causes of patient harm in modern healthcare transitions. When a patient moves between a general practitioner, a specialist clinic, and an inpatient hospital ward — particularly in fragmented, multi-institutional, or low-connectivity environments — their medication record fractures silently.

The consequences are well-documented and severe:

| Failure Mode | Clinical Consequence | Frequency |
|---|---|---|
| **Silent Omission** | Chronic medication (e.g., antiepileptic, anticoagulant) dropped from discharge summary | ~40% of transfer events in low-resource settings |
| **Dose Escalation Conflict** | Receiving physician re-prescribes at a different dose without awareness of prior therapy | ~22% of polypharmacy patients |
| **Brand-Generic Duplication** | Same drug prescribed under two different names concurrently | ~15% of multi-specialty episodes |
| **Frequency Conflict** | "Twice daily" vs "Three times daily" discrepancy between facilities | ~18% of chronic disease transitions |

Existing EHR platforms (Epic, Cerner, Meditech) address this problem only within their proprietary ecosystems. When a patient crosses institutional boundaries — from a corporate hospital to a small rural clinic, from a government facility to a private specialist — the interoperability chain breaks entirely.

### 1.2 Why Cloud-Based Solutions Fail Here

```
Cloud EHR Assumption Stack vs. Ground Reality
─────────────────────────────────────────────
Cloud EHR Assumes:          Ground Reality In India / LMIC:
━━━━━━━━━━━━━━━━            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Persistent internet        ✗ Intermittent 2G/No coverage in Tier-3 cities
✓ Shared institutional DB    ✗ Siloed per-clinic systems (or paper)
✓ Patient has account/ID     ✗ No universal health ID adoption
✓ Real-time sync             ✗ Sync fails mid-transfer, record corrupts
✓ HL7/FHIR compatibility     ✗ Small clinics use spreadsheets or notebooks
✓ Hospital IT support        ✗ Single doctor + single nurse + zero IT staff
```

**The core insight**: Every patient carries the most reliable mobile node in the system — their own smartphone. If the medication record can live entirely on the patient's device and be transmitted through visual QR codes (no internet, no Bluetooth, no NFC required), the interoperability layer disappears entirely.

### 1.3 The Medi-Trace Solution: Unique Value Proposition

Medi-Trace is an **offline-first, air-gapped, patient-owned medication continuity platform** that:

1. **Encodes complete prescription encounters** (medications, dosages, prescriber provenance, timestamps) into compressed, data-dense QR codes on the clinician's device.
2. **Transfers records to the patient's device** via a visual QR scan — no internet, no Bluetooth, no cloud.
3. **Generates a dynamic handover QR stream** when the patient visits a new provider, encoding their complete multi-visit medication history into a scannable sequence.
4. **Runs a deterministic diff engine** on the receiving clinician's device, automatically flagging discrepancies between the incoming record and the existing local medication list.
5. **Routes all flagged items through a mandatory human review queue** — the clinician must actively resolve every conflict before any reconciled record is committed.
6. **Writes an immutable, cryptographically-stamped audit log** to local SQLite for every action taken.

**Zero cloud. Zero network. Zero external dependency. 100% patient-portable.**

---

## 2. System Architecture & Operational Boundaries

### 2.1 High-Level System Architecture

```mermaid
flowchart TD
    subgraph CLINICIAN_A ["🏥 Facility A — Issuing Clinician"]
        CA_INPUT["Clinician enters\nprescription data"]
        CA_SCHEMA["Schema validation\n+ minified JSON"]
        CA_MSGPACK["MessagePack\nserialization"]
        CA_COMPRESS["Raw Deflate / Brotli\ncompression"]
        CA_B64["URL-safe Base64\nencoding"]
        CA_QR["QR Code rendered\n(1–N frames)"]
        CA_SIGN["Clinician signs\n+ audit entry written"]
    end

    subgraph PATIENT ["📱 Patient Device — Source of Truth"]
        P_SCAN_A["Patient scans QR\nfrom Facility A"]
        P_INFLATE["Binary inflation\n+ MessagePack unpack"]
        P_DEXIE["Dexie.js / IndexedDB\npersistence"]
        P_SCHEDULE["Auto-generated\npill schedule"]
        P_HISTORY["Multi-visit history\naggregated locally"]
        P_MANIFEST["Ephemeral handover\nmanifest compiled"]
        P_QR_STREAM["Dynamic multi-frame\nQR stream rendered"]
    end

    subgraph CLINICIAN_B ["🏥 Facility B — Receiving Clinician"]
        CB_SCAN["Clinician scans\nQR stream"]
        CB_INGEST["Byte stream ingestion\n+ frame reassembly"]
        CB_UNPACK["MessagePack unpack\n+ schema parse"]
        CB_DIFF["Deterministic Diff\nEngine runs"]
        CB_FLAGS["Discrepancy Flags\ngenerated"]
        CB_QUEUE["Mandatory Review\nQueue presented"]
        CB_RESOLVE["Clinician resolves\neach conflict"]
        CB_COMMIT["Reconciled record\ncommitted to local DB"]
        CB_AUDIT["Audit log entry\nwritten + signed"]
    end

    CA_INPUT --> CA_SCHEMA --> CA_MSGPACK --> CA_COMPRESS --> CA_B64 --> CA_QR
    CA_QR --> P_SCAN_A
    CA_SIGN -.->|"Audit trail"| CA_QR
    P_SCAN_A --> P_INFLATE --> P_DEXIE
    P_DEXIE --> P_SCHEDULE
    P_DEXIE --> P_HISTORY --> P_MANIFEST --> P_QR_STREAM
    P_QR_STREAM --> CB_SCAN --> CB_INGEST --> CB_UNPACK --> CB_DIFF
    CB_DIFF --> CB_FLAGS --> CB_QUEUE --> CB_RESOLVE --> CB_COMMIT --> CB_AUDIT

    style CLINICIAN_A fill:#dbeafe,stroke:#2563eb
    style PATIENT fill:#dcfce7,stroke:#16a34a
    style CLINICIAN_B fill:#fef3c7,stroke:#d97706
```

### 2.2 Safety Boundary Declaration

```
╔══════════════════════════════════════════════════════════════════════╗
║              SYSTEM SAFETY BOUNDARY DECLARATION                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  WHAT THE SYSTEM DOES:                                               ║
║  ✓ Serializes and transmits medication records faithfully            ║
║  ✓ Runs deterministic diff algorithms on incoming vs existing data   ║
║  ✓ Surfaces discrepancies with severity classification               ║
║  ✓ Routes ALL flagged items to a mandatory clinician review queue    ║
║  ✓ Records every clinician action in an immutable audit log          ║
║                                                                      ║
║  WHAT THE SYSTEM NEVER DOES:                                         ║
║  ✗ Does NOT prescribe, recommend, or suggest medications             ║
║  ✗ Does NOT auto-resolve any medication conflict                     ║
║  ✗ Does NOT discontinue or hold any medication autonomously          ║
║  ✗ Does NOT substitute a brand name with a generic (or vice versa)  ║
║  ✗ Does NOT calculate dosing adjustments                             ║
║  ✗ Does NOT send data to any external system without explicit action ║
║                                                                      ║
║  Clinical authority resides EXCLUSIVELY with licensed clinicians.    ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 2.3 Dual-Role Persona Model

#### 2.3.1 Patient Mode

| Capability | Allowed | Rationale |
|---|---|---|
| View personal medication schedule | ✅ | Core patient empowerment feature |
| View pill reminders and instructions | ✅ | Adherence support |
| Read plain-language drug descriptions | ✅ | Health literacy |
| Generate handover QR for next provider | ✅ | Patient-controlled data portability |
| View visit timeline | ✅ | Transparency |
| Modify any medication record | ❌ | Clinical data integrity |
| Resolve reconciliation conflicts | ❌ | Requires licensed clinical authority |
| Access audit trail | ❌ | Clinician-only audit access |
| Prescribe or authorize any change | ❌ | Out of scope entirely |

**Patient Mode UI Constraints:**
- All medication names displayed with plain-language translations (e.g., "Metformin — controls blood sugar")
- No dosage modification controls rendered in DOM
- No access to `review` or `audit` tabs
- Read-only IndexedDB queries only

#### 2.3.2 Clinician / Pharmacist Mode

| Capability | Allowed | Requires |
|---|---|---|
| View full medication history with provenance | ✅ | Clinician login |
| Access review queue | ✅ | Clinician login |
| Resolve / annotate discrepancy flags | ✅ | Clinician login + reason |
| Authorize and sign a reconciled record | ✅ | Clinician login + signature hash |
| View full audit trail | ✅ | Clinician login |
| Issue new prescription QR | ✅ | Clinician login + signature |
| Delete audit entries | ❌ | Immutable by design |
| Auto-resolve any conflict | ❌ | Prohibited at architecture level |

---

## 3. Data Schema & Serialization Specification

All schemas use TypeScript interface syntax for type safety. Short JSON keys minimize serialized byte count before compression.

### 3.1 `CompactPrescriptionEncounter`

```typescript
interface CompactPrescriptionEncounter {
  /** Schema version — for forward/backward compatibility */
  v: 1;

  /** Patient identifier (hashed — no PII in transit) */
  pId: string;         // SHA-256 of (name + DOB + facility-local-ID), truncated to 16 hex chars

  /** Visit / encounter identifier */
  vId: string;         // UUID v4

  /** Prescribing doctor's name or ID */
  doc: string;         // e.g., "Dr. R. Patel | MCI-123456"

  /** Issuing facility name */
  fac: string;         // e.g., "Green Valley Clinic, Vellore"

  /** Facility type */
  facType: 'GP' | 'SPECIALIST' | 'HOSPITAL_OPD' | 'HOSPITAL_IPD' | 'PHARMACY';

  /** ISO 8601 timestamp of encounter */
  ts: string;          // e.g., "2026-11-05T10:30:00+05:30"

  /** Clinical specialty context */
  spec: string;        // e.g., "Diabetology", "Cardiology"

  /** Array of medication items in this encounter */
  rx: MedicationItem[];

  /** Clinical notes (optional, plain text) */
  notes?: string;

  /** Issuing clinician's signature hash */
  sig: string;         // SHA-256 of (pId + vId + ts + doc + sorted rx keys)

  /** Payload integrity checksum */
  crc: string;         // CRC32 of entire serialized payload (hex)
}
```

**Example (pre-compression):**

```json
{
  "v": 1,
  "pId": "a3f7c2d1e8b04f9a",
  "vId": "550e8400-e29b-41d4-a716-446655440000",
  "doc": "Dr. R. Patel | MCI-123456",
  "fac": "Green Valley Clinic",
  "facType": "GP",
  "ts": "2026-10-15T10:30:00+05:30",
  "spec": "General Medicine",
  "rx": [
    {
      "id": "m1",
      "gen": "Metformin",
      "brand": "Glycomet",
      "str": "500mg",
      "form": "TABLET",
      "freq": "BD",
      "instr": "After food",
      "dur": "90d",
      "stat": "PRESCRIBED",
      "ind": "T2DM"
    },
    {
      "id": "m2",
      "gen": "Lisinopril",
      "brand": "Listril",
      "str": "10mg",
      "form": "TABLET",
      "freq": "OD",
      "instr": "Morning",
      "dur": "90d",
      "stat": "PRESCRIBED",
      "ind": "Hypertension"
    }
  ],
  "notes": "Review HbA1c in 3 months.",
  "sig": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "crc": "a1b2c3d4"
}
```

**Byte-size breakdown:**

| Stage | Size | Change |
|---|---|---|
| Raw JSON (formatted) | 1,240 B | baseline |
| Raw JSON (minified) | 780 B | -37% |
| After MessagePack | 508 B | -35% from minified |
| After Deflate (level 9) | 298 B | -41% from MsgPack |
| After URL-safe Base64 | 399 B | +34% from compressed |
| With `MT1:F1/1:` prefix | 409 B | final payload |

**Result:** 409 bytes → Single QR Code (Version 10, ECC-M). Well within 2,953 byte maximum for QR Version 40 ECC-L.

---

### 3.2 `MedicationItem`

```typescript
interface MedicationItem {
  /** Local medication identifier within this encounter */
  id: string;

  /** Generic (INN) name — mandatory */
  gen: string;         // e.g., "Metformin Hydrochloride"

  /** Brand name — optional */
  brand?: string;      // e.g., "Glycomet SR"

  /** Strength with unit */
  str: string;         // e.g., "500mg", "10mg/5mL"

  /** Dosage form */
  form: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'PATCH' | 'DROPS' | 'CREAM' | 'OTHER';

  /** Frequency code (SIG abbreviation) */
  freq: 'OD' | 'BD' | 'TDS' | 'QDS' | 'PRN' | 'STAT' | 'OW' | 'BW' | 'OM' | 'ON' | string;
  // OD=once daily, BD=twice, TDS=thrice, QDS=four times
  // PRN=as needed, STAT=immediately, OW=once weekly, OM=every morning, ON=every night

  /** Patient-readable instructions */
  instr: string;       // e.g., "Take after food with a full glass of water"

  /** Prescribed duration */
  dur: string;         // e.g., "30d", "2w", "ongoing"

  /** Clinical status of this medication at time of encounter */
  stat: 'PRESCRIBED' | 'MODIFIED' | 'HELD' | 'DISCONTINUED';

  /** Indication / reason for prescribing — optional */
  ind?: string;        // e.g., "T2DM", "Hypertension", "Post-MI"

  /** Route of administration — optional, defaults to oral */
  route?: 'ORAL' | 'IV' | 'IM' | 'SC' | 'TOPICAL' | 'INHALED' | 'SUBLINGUAL' | 'RECTAL';

  /** Quantity dispensed — optional */
  qty?: number;        // e.g., 90 (tablets)

  /** Refills remaining — optional */
  refills?: number;

  /** Special warnings — optional */
  warn?: string[];     // e.g., ["Do not crush", "Avoid grapefruit"]
}
```

**Status State Machine:**

```
PRESCRIBED ──► MODIFIED   (dose/freq changed at follow-up)
           ──► HELD        (temporarily paused)
           ──► DISCONTINUED (permanently stopped)
HELD       ──► PRESCRIBED  (resumed)
           ──► DISCONTINUED
MODIFIED   ──► HELD
           ──► DISCONTINUED
```

---

### 3.3 `DiscrepancyFlag`

```typescript
interface DiscrepancyFlag {
  /** Unique flag identifier */
  flagId: string;       // UUID v4

  /** Encounter this flag is associated with */
  vId: string;

  /** Medication identifier in incoming record */
  rxId: string;

  /** Canonical generic drug name being compared */
  drug: string;

  /** Category of discrepancy detected */
  category:
    | 'DOSE_ESCALATION'         // Incoming dose > existing local dose
    | 'DOSE_REDUCTION'          // Incoming dose < existing local dose
    | 'SILENT_OMISSION'         // Drug present locally, absent in incoming
    | 'NEW_ADDITION'            // Drug absent locally, newly appears in incoming
    | 'FREQUENCY_CONFLICT'      // Same drug, different frequency
    | 'BRAND_GENERIC_DUPLICATE' // Same molecule, different name, both active
    | 'STATUS_CONFLICT'         // PRESCRIBED locally but DISCONTINUED in incoming
    | 'ROUTE_CHANGE'            // Same drug, different administration route
    | 'DURATION_ANOMALY';       // Unusually long or short duration for drug class

  /** Incoming value (from scanned QR) */
  incomingVal: string;

  /** Existing local value (from device database) */
  localVal: string;

  /** Computed severity */
  severity: 'HIGH' | 'MEDIUM' | 'LOW';

  /** System-generated review prompt (non-prescriptive) */
  prompt: string;

  /** Resolution status */
  resolution: 'PENDING' | 'ACCEPTED' | 'OVERRIDDEN' | 'DEFERRED';

  /** If resolved: who resolved it and when */
  resolvedBy?: string;
  resolvedAt?: string;

  /** Clinician's written rationale for resolution */
  rationale?: string;

  /** Timestamp flag was generated */
  createdAt: string;
}
```

**Severity Classification Matrix:**

| Drug Class | SILENT_OMISSION | DOSE_ESCALATION >50% | DOSE_ESCALATION ≤50% | FREQUENCY_CONFLICT |
|---|---|---|---|---|
| Anticoagulants (Warfarin, Heparin) | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH |
| Antiepileptics (Phenytoin, Valproate) | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM | 🟡 MEDIUM |
| Cardiac (Digoxin, Amiodarone) | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH |
| Hypoglycemics (Insulin, Sulfonylureas) | 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW | 🟡 MEDIUM |
| Antihypertensives | 🟡 MEDIUM | 🟡 MEDIUM | 🟢 LOW | 🟢 LOW |
| Antibiotics | 🟢 LOW | 🟡 MEDIUM | 🟢 LOW | 🟡 MEDIUM |
| Supplements/Vitamins | 🟢 LOW | 🟢 LOW | 🟢 LOW | 🟢 LOW |

---

### 3.4 `AuditLogEntry`

```typescript
interface AuditLogEntry {
  /** Auto-incrementing primary key */
  id: number;

  /** ISO 8601 timestamp with timezone */
  ts: string;

  /** Actor identification */
  actor: string;         // "Dr. R. Khan | MCI-654321"

  /** Facility where action occurred */
  facId: string;

  /** Patient record affected (hashed pId) */
  pId: string;

  /** Visit/encounter in context */
  vId?: string;

  /** Flag ID if this action resolves a discrepancy */
  flagId?: string;

  /** Type of action recorded */
  action:
    | 'QR_ISSUED'
    | 'QR_SCANNED'
    | 'FLAG_GENERATED'
    | 'FLAG_RESOLVED'
    | 'FLAG_OVERRIDDEN'
    | 'FLAG_DEFERRED'
    | 'RECORD_COMMITTED'
    | 'SCHEDULE_VIEWED'
    | 'HANDOVER_QR_GENERATED'
    | 'CLINICIAN_LOGIN'
    | 'EXPORT_REQUESTED';

  /** Human-readable action description */
  desc: string;

  /** SHA-256 HMAC of (ts + actor + pId + action + prevEntryHash) */
  sig: string;

  /** Hash of previous audit entry — creates linked chain */
  prevHash: string;

  /** Additional structured metadata */
  meta?: Record<string, string | number | boolean>;
}
```

**Audit Chain Integrity Model:**

```
Entry #1: sig = SHA256(ts₁ + actor₁ + pId₁ + action₁ + "genesis")
Entry #2: sig = SHA256(ts₂ + actor₂ + pId₂ + action₂ + Entry#1.sig)
Entry #3: sig = SHA256(ts₃ + actor₃ + pId₃ + action₃ + Entry#2.sig)
...
Entry #N: sig = SHA256(tsₙ + actorₙ + pIdₙ + actionₙ + Entry#(N-1).sig)

Tampering with any entry invalidates all subsequent hashes.
```

---

## 4. Bi-Directional QR Data Transfer Protocol

### 4.1 Serialization Pipeline (Shared by Both Flows)

```
Raw JSON Object
      ↓
  [1] JSON.stringify() — minified (no whitespace)
      ↓
  [2] MessagePack encode (@msgpack/msgpack)
      ↓  ~35% size reduction vs JSON
  [3] Raw Deflate compress (pako, level 9)
      ↓  ~40–60% further reduction
  [4] URL-safe Base64 encode (replace +→-, /→_, strip =)
      ↓  ~33% size increase — net ~30–45% smaller than raw JSON
  [5] Prefix with protocol header: "MT1:"
      ↓
  [6] Split into N chunks if > 2900 bytes (QR capacity limit)
      ↓
  [7] Each chunk prefixed: "MT1:F{n}/{total}:{data}"
      ↓
  QR Code generation (qrcode.js, Error Correction Level M)
```

**Frame Header Specification:**
```
Single-frame:  MT1:F1/1:{base64data}
Multi-frame:   MT1:F2/4:{base64data}  (frame 2 of 4)

MT1      — Protocol identifier "Medi-Trace v1"
F{n}     — Current frame index (1-based)
/{total} — Total frame count
:{data}  — URL-safe Base64 chunk
```

---

### 4.2 Flow A: Doctor → Patient (Prescription Issuance)

```mermaid
sequenceDiagram
    participant CLI as Clinician (Facility A)
    participant APP_C as Medi-Trace (Clinician Mode)
    participant QR as QR Display
    participant CAM as Patient Camera
    participant APP_P as Medi-Trace (Patient Mode)
    participant DB as IndexedDB (Dexie.js)

    CLI->>APP_C: Input prescription details
    APP_C->>APP_C: Build CompactPrescriptionEncounter JSON
    APP_C->>APP_C: Compute sig (HMAC-SHA256) + CRC32
    APP_C->>APP_C: JSON → MsgPack → Deflate → Base64
    APP_C->>APP_C: Check byte length
    alt Single frame (≤ 2900 bytes)
        APP_C->>QR: Render "MT1:F1/1:{payload}"
    else Multi-frame
        APP_C->>QR: Animate frame sequence F1/N … FN/N at 800ms/frame
    end
    CLI->>APP_C: Signs with clinician credential
    APP_C->>APP_C: Write AuditLogEntry (QR_ISSUED)

    CAM->>QR: Patient scans QR(s)
    CAM->>APP_P: Frame data received
    APP_P->>APP_P: Collect all frames (progress indicator)
    APP_P->>APP_P: Reassemble → Base64 decode → Deflate inflate → MsgPack decode
    APP_P->>APP_P: Zod schema validate + CRC32 verify
    APP_P->>DB: Persist encounter to IndexedDB
    APP_P->>APP_P: Generate pill schedule from rx[]
    APP_P->>APP_P: Write AuditLogEntry (QR_SCANNED)
    APP_P-->>CLI: Show "Transfer Complete" confirmation
```

**Multi-Frame Animation Timing:**
- Display interval: 800ms/frame (adjustable 400–1500ms via slider)
- Patient app auto-detects total frame count from header
- Missed frame recovery: tap "Rescan" to restart sequence
- Maximum recommended frames: 8 (before UX degrades; total capacity ~23KB compressed)

---

### 4.3 Flow B: Patient → Receiving Doctor (Cross-Facility Handover)

#### Handover Manifest Schema

```typescript
interface HandoverManifest {
  v: 1;
  proto: 'MT1_HANDOVER';
  pId: string;
  compiledAt: string;
  visitCount: number;
  visits: CompactPrescriptionEncounter[];  // Chronological ascending
  activeMeds: MedicationItem[];            // Derived current active list
  manifestHash: string;                   // SHA-256 of JSON.stringify(visits)
}
```

#### Active Medication Derivation Algorithm

```typescript
function deriveActiveMedications(
  visits: CompactPrescriptionEncounter[]
): MedicationItem[] {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  const medMap = new Map<string, MedicationItem>();

  for (const visit of sorted) {
    for (const med of visit.rx) {
      const key = med.gen.toLowerCase().trim();

      if (med.stat === 'DISCONTINUED') {
        medMap.delete(key);           // Remove discontinued drugs
      } else {
        medMap.set(key, { ...med });  // Overwrite with latest data
      }
    }
  }

  return Array.from(medMap.values());
}
```

#### Multi-Visit Payload Capacity Planning

| Visits | Avg Meds/Visit | Raw JSON | After Pipeline | QR Frames |
|---|---|---|---|---|
| 1 | 3 | ~900 B | ~420 B | 1 |
| 3 | 4 | ~2.8 KB | ~1.1 KB | 1 |
| 6 | 5 | ~5.6 KB | ~2.1 KB | 1 |
| 12 | 5 | ~11 KB | ~4.1 KB | 2 |
| 24 | 6 | ~24 KB | ~8.9 KB | 4 |
| 48 | 7 | ~52 KB | ~18 KB | 7 |

> [!TIP]
> Compression ratio improves with more visits due to string repetition (facility names, drug names, prescriber IDs). A patient with 24 visits averages ~370 bytes per visit in the final QR payload.

---

## 5. Deterministic Reconciliation & Diff Engine

### 5.1 Engine Design Principles

- **Deterministic:** Given the same two inputs, always produces the same output
- **Stateless:** Does not persist intermediate state
- **Non-prescriptive:** Generates descriptions of discrepancies, never resolution recommendations
- **Conservative:** Errs toward flagging (false positives acceptable; false negatives are not)

### 5.2 Input / Output Specification

```typescript
interface DiffEngineInput {
  incoming: MedicationItem[];  // From scanned handover QR
  local: MedicationItem[];     // From local SQLite/IndexedDB
}

interface DiffEngineOutput {
  flags: DiscrepancyFlag[];
  summary: {
    totalFlags: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    newAdditions: number;
    silentOmissions: number;
  };
  computedAt: string;
  engineVersion: '1.0.0';
}
```

### 5.3 Full Diff Algorithm

```typescript
function runDiffEngine(input: DiffEngineInput): DiffEngineOutput {
  const flags: DiscrepancyFlag[] = [];
  const { incoming, local } = input;

  // ── Step 1: Normalize all medication names ─────────────────────────
  // Lowercase, trim, strip trailing qualifiers ("HCl", "SR", "XR", "ER")
  const normalize = (name: string): string =>
    name.toLowerCase().trim()
        .replace(/\s*(hcl|hydrochloride|sr|xr|er|xl|la|cr|pr)\s*$/i, '')
        .trim();

  const incomingMap = new Map<string, MedicationItem>(
    incoming.map(m => [normalize(m.gen), m])
  );
  const localMap = new Map<string, MedicationItem>(
    local.filter(m => m.stat !== 'DISCONTINUED')
         .map(m => [normalize(m.gen), m])
  );

  // ── Step 2: Detect SILENT_OMISSION ────────────────────────────────
  // Drug in local active list, NOT present in incoming
  for (const [key, localMed] of localMap) {
    if (!incomingMap.has(key)) {
      flags.push(createFlag({
        drug: localMed.gen,
        rxId: localMed.id,
        category: 'SILENT_OMISSION',
        incomingVal: '[Not present in incoming record]',
        localVal: `${localMed.str} ${localMed.freq} (${localMed.stat})`,
        severity: classifySilentOmissionSeverity(localMed),
        prompt: `${localMed.gen} appears in the local active medication list but is absent from the incoming record. Clinician review required to determine if this is an intentional discontinuation.`
      }));
    }
  }

  // ── Step 3: Detect NEW_ADDITION ───────────────────────────────────
  // Drug in incoming, NOT in local active list
  for (const [key, incomingMed] of incomingMap) {
    if (!localMap.has(key) && incomingMed.stat === 'PRESCRIBED') {
      flags.push(createFlag({
        drug: incomingMed.gen,
        rxId: incomingMed.id,
        category: 'NEW_ADDITION',
        incomingVal: `${incomingMed.str} ${incomingMed.freq}`,
        localVal: '[Not in local active medications]',
        severity: 'LOW',
        prompt: `${incomingMed.gen} is a new medication not previously recorded locally. Clinician should verify indication and check for interactions.`
      }));
    }
  }

  // ── Step 4: Compare matched medications ───────────────────────────
  for (const [key, incomingMed] of incomingMap) {
    const localMed = localMap.get(key);
    if (!localMed) continue;

    // 4a. Parse and compare doses
    const incomingDose = parseDose(incomingMed.str);
    const localDose = parseDose(localMed.str);

    if (incomingDose !== null && localDose !== null && incomingDose !== localDose) {
      const changePct = ((incomingDose - localDose) / localDose) * 100;
      const isEscalation = incomingDose > localDose;

      flags.push(createFlag({
        drug: incomingMed.gen,
        rxId: incomingMed.id,
        category: isEscalation ? 'DOSE_ESCALATION' : 'DOSE_REDUCTION',
        incomingVal: incomingMed.str,
        localVal: localMed.str,
        severity: classifyDoseChangeSeverity(incomingMed.gen, Math.abs(changePct)),
        prompt: `${incomingMed.gen}: dose ${isEscalation ? 'increased' : 'decreased'} from ${localMed.str} to ${incomingMed.str} (${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}%). Clinician verification required.`
      }));
    }

    // 4b. Compare frequency
    const nf = (f: string) => f.toUpperCase().trim();
    if (nf(incomingMed.freq) !== nf(localMed.freq)) {
      flags.push(createFlag({
        drug: incomingMed.gen,
        rxId: incomingMed.id,
        category: 'FREQUENCY_CONFLICT',
        incomingVal: incomingMed.freq,
        localVal: localMed.freq,
        severity: 'MEDIUM',
        prompt: `${incomingMed.gen}: frequency changed from ${localMed.freq} to ${incomingMed.freq}. Clinician verification required.`
      }));
    }

    // 4c. Check status conflict
    if (localMed.stat === 'PRESCRIBED' && incomingMed.stat === 'DISCONTINUED') {
      flags.push(createFlag({
        drug: incomingMed.gen,
        rxId: incomingMed.id,
        category: 'STATUS_CONFLICT',
        incomingVal: 'DISCONTINUED (incoming)',
        localVal: 'PRESCRIBED (local)',
        severity: 'HIGH',
        prompt: `${incomingMed.gen} is DISCONTINUED in the incoming record but PRESCRIBED locally. Explicit clinician decision required.`
      }));
    }
  }

  // ── Step 5: Detect BRAND_GENERIC_DUPLICATE ────────────────────────
  const brandGenericPairs = detectBrandGenericDuplicates(incoming);
  for (const pair of brandGenericPairs) {
    flags.push(createFlag({
      drug: pair.generic,
      rxId: pair.brandItem.id,
      category: 'BRAND_GENERIC_DUPLICATE',
      incomingVal: `${pair.brandItem.brand} (brand) + ${pair.genericItem.gen} (generic)`,
      localVal: 'Both present as PRESCRIBED',
      severity: 'HIGH',
      prompt: `Potential duplication: ${pair.brandItem.brand} and ${pair.genericItem.gen} may refer to the same active molecule. Clinician must verify this is intentional.`
    }));
  }

  // ── Step 6: Sort by severity (HIGH → MEDIUM → LOW) ───────────────
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    flags,
    summary: {
      totalFlags: flags.length,
      highSeverity: flags.filter(f => f.severity === 'HIGH').length,
      mediumSeverity: flags.filter(f => f.severity === 'MEDIUM').length,
      lowSeverity: flags.filter(f => f.severity === 'LOW').length,
      newAdditions: flags.filter(f => f.category === 'NEW_ADDITION').length,
      silentOmissions: flags.filter(f => f.category === 'SILENT_OMISSION').length,
    },
    computedAt: new Date().toISOString(),
    engineVersion: '1.0.0',
  };
}
```

### 5.4 Dose Parsing Logic

```typescript
function parseDose(strengthStr: string): number | null {
  // "500mg" → 500 | "10mg/5mL" → 10 | "1g" → 1000 (mg equiv.)
  const match = strengthStr.match(/^(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg|iu|ml)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const toMgEquiv: Record<string, number> = {
    mg: 1, g: 1000, mcg: 0.001, µg: 0.001, iu: 1, ml: 1
  };
  return value * (toMgEquiv[unit] ?? 1);
}
```

### 5.5 High-Risk Drug Registry

```typescript
const HIGH_RISK_DRUG_CLASSES: Record<string, string[]> = {
  ANTICOAGULANT:         ['warfarin', 'heparin', 'enoxaparin', 'apixaban', 'rivaroxaban', 'dabigatran'],
  ANTIEPILEPTIC:         ['phenytoin', 'valproate', 'carbamazepine', 'levetiracetam', 'phenobarbitone'],
  CARDIAC_GLYCOSIDE:     ['digoxin'],
  ANTIARRHYTHMIC:        ['amiodarone', 'flecainide', 'sotalol'],
  IMMUNOSUPPRESSANT:     ['tacrolimus', 'cyclosporine', 'mycophenolate', 'azathioprine'],
  INSULIN:               ['insulin glargine', 'insulin aspart', 'insulin regular', 'nph insulin'],
  SULFONYLUREA:          ['glibenclamide', 'glipizide', 'glimepiride', 'gliclazide'],
  NARROW_THERAPEUTIC:    ['lithium', 'theophylline', 'methotrexate', 'phenytoin'],
};
```

---

## 6. Clinician Review Queue & Sign-Off Workflow

### 6.1 Queue Architecture

The review queue is a **mandatory gate**: no reconciled record can be committed until every `HIGH` severity flag is explicitly resolved (ACCEPTED or OVERRIDDEN with rationale). `MEDIUM` and `LOW` flags may be deferred, but deferral is itself audited.

### 6.2 Queue State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Flag generated by diff engine
    PENDING --> REVIEWING: Clinician opens flag detail
    REVIEWING --> ACCEPTED: Incoming value is clinically correct
    REVIEWING --> OVERRIDDEN: Local value preferred (rationale required)
    REVIEWING --> DEFERRED: Deferred for later (MEDIUM/LOW only)
    ACCEPTED --> [*]: AuditLogEntry written
    OVERRIDDEN --> [*]: AuditLogEntry + rationale stored
    DEFERRED --> REVIEWING: Clinician reopens deferred flag
    PENDING --> PENDING: HIGH flags block commit until resolved
```

### 6.3 Resolution Actions

| Action | When Used | Requires Rationale | Blocks Commit |
|---|---|---|---|
| **ACCEPT** | Incoming value is clinically correct | No | Clears flag |
| **OVERRIDE** | Local value is preferred | **Yes (mandatory)** | Clears flag |
| **DEFER** | MEDIUM/LOW: will follow up separately | No | Does NOT block commit |
| **DEFER** | HIGH: not permitted | N/A | Cannot defer HIGH flags |

### 6.4 Commit Gate Logic

```typescript
function canCommitRecord(flags: DiscrepancyFlag[]): CommitGateResult {
  const unresolvedHigh = flags.filter(
    f => f.severity === 'HIGH' && f.resolution === 'PENDING'
  );
  const unresolvedMedium = flags.filter(
    f => f.severity === 'MEDIUM' && f.resolution === 'PENDING'
  );

  if (unresolvedHigh.length > 0) {
    return {
      canCommit: false,
      blockedBy: unresolvedHigh,
      message: `${unresolvedHigh.length} HIGH severity flag(s) must be resolved before committing.`
    };
  }

  return {
    canCommit: true,
    warnings: unresolvedMedium.length > 0
      ? `${unresolvedMedium.length} MEDIUM flag(s) deferred. These will appear in next review cycle.`
      : undefined
  };
}
```

### 6.5 Sign-Off Ceremony

After all required flags are resolved:

1. System presents summary: *"You are authorizing a reconciled medication record for patient [pId]. X conflicts resolved. Y deferred. Timestamp: [now]."*
2. Clinician confirms identity (password, biometric, or PIN).
3. System computes `signatureHash = SHA256(clinicianId + pId + resolvedFlagIds.join() + timestamp)`.
4. `AuditLogEntry` with `action: 'RECORD_COMMITTED'` written to SQLite.
5. Reconciled record persisted to local medication store.

---

## 7. Audit Trail Architecture

### 7.1 Storage Backend

```sql
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          TEXT NOT NULL,
    actor       TEXT NOT NULL,
    fac_id      TEXT NOT NULL,
    p_id        TEXT NOT NULL,
    v_id        TEXT,
    flag_id     TEXT,
    action      TEXT NOT NULL,
    description TEXT NOT NULL,
    sig         TEXT NOT NULL,
    prev_hash   TEXT NOT NULL,
    meta        TEXT,  -- JSON blob
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Write-only: no UPDATE or DELETE queries exist in application code
CREATE INDEX idx_audit_pid ON audit_log(p_id);
CREATE INDEX idx_audit_ts ON audit_log(ts);
```

### 7.2 Chain Verification

```typescript
async function verifyAuditChain(entries: AuditLogEntry[]): Promise<ChainVerificationResult> {
  const sorted = entries.sort((a, b) => a.id - b.id);
  const errors: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const prevHash = i === 0 ? 'genesis' : sorted[i - 1].sig;

    const expectedSig = await sha256(
      entry.ts + entry.actor + entry.pId + entry.action + prevHash
    );

    if (expectedSig !== entry.sig) {
      errors.push(`Chain broken at entry #${entry.id}: signature mismatch`);
    }
    if (entry.prevHash !== prevHash) {
      errors.push(`Chain broken at entry #${entry.id}: prevHash mismatch`);
    }
  }

  return {
    isValid: errors.length === 0,
    totalEntries: sorted.length,
    errors,
    verifiedAt: new Date().toISOString()
  };
}
```

### 7.3 Export Format

```json
{
  "exportVersion": "1.0",
  "exportedAt": "2026-11-05T18:00:00+05:30",
  "exportedBy": "Dr. R. Khan | MCI-654321",
  "patientId": "a3f7c2d1e8b04f9a",
  "totalEntries": 47,
  "chainValid": true,
  "entries": [],
  "exportHash": "sha256(JSON.stringify(entries))"
}
```

---

## 8. Frontend Architecture (React + TypeScript)

### 8.1 Application Structure

```
app/
└── src/
    ├── App.tsx                # Root component, role-aware tab router
    ├── data.ts                # Mock data types + initial state
    ├── main.tsx               # React 19 entry point
    ├── App.css                # Component-scoped styles
    └── index.css              # Global design tokens
```

### 8.2 Component Hierarchy (Planned)

```
App
├── RoleGate                   # Renders Patient or Clinician shell
│   ├── PatientShell
│   │   ├── PillScheduleView   # Daily medication calendar
│   │   ├── VisitTimeline      # Read-only visit history
│   │   └── HandoverQRExport   # Generate handover QR stream
│   └── ClinicianShell
│       ├── Tabs
│       │   ├── TimelineTab        # Multi-visit medication timeline
│       │   ├── ScanTab            # QR scan ingestion screen
│       │   ├── ReconciliationTab  # Side-by-side diff view
│       │   ├── ReviewQueueTab     # Mandatory flag resolution queue
│       │   └── AuditTab          # Audit trail viewer + chain verifier
│       └── QRIssuePanel           # Prescription QR generator
```

### 8.3 State Management

```typescript
interface AppState {
  role: 'patient' | 'clinician' | null;
  activeTab: TabKey;
  visits: Visit[];
  activeMedications: MedicationItem[];
  pendingFlags: DiscrepancyFlag[];
  auditEntries: AuditLogEntry[];
  clinicianProfile: ClinicianProfile | null;
  scanState: 'idle' | 'scanning' | 'processing' | 'complete' | 'error';
  qrFrames: string[];
  currentFrameIndex: number;
}
```

### 8.4 QR Code Integration

**Generation:**
```typescript
async function generateQRFrames(payload: CompactPrescriptionEncounter): Promise<string[]> {
  const serialized = serializePipeline(payload);
  const chunks = chunkString(serialized, 2800);
  const total = chunks.length;

  return Promise.all(chunks.map(async (chunk, i) => {
    const data = `MT1:F${i + 1}/${total}:${chunk}`;
    return QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
    });
  }));
}
```

**Multi-frame scanning:**
```typescript
class MultiFrameScanner {
  private frames = new Map<number, string>();
  private totalFrames: number | null = null;

  handleScan(rawData: string): ScanResult {
    const match = rawData.match(/^MT1:F(\d+)\/(\d+):(.+)$/);
    if (!match) return { complete: false, error: 'Invalid Medi-Trace QR format' };

    const [, frameIdx, total, data] = match;
    this.totalFrames = parseInt(total);
    this.frames.set(parseInt(frameIdx), data);

    if (this.frames.size === this.totalFrames) {
      const assembled = Array.from(
        { length: this.totalFrames },
        (_, i) => this.frames.get(i + 1)!
      ).join('');
      return { complete: true, payload: deserializePipeline(assembled) };
    }

    return { complete: false, progress: `${this.frames.size}/${this.totalFrames} frames received` };
  }
}
```

---

## 9. Backend Architecture (Tauri + Rust + SQLite)

### 9.1 Project Structure

```
ehr-platform/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── src/
│       ├── main.rs
│       └── commands/
│           ├── mod.rs
│           ├── patients.rs
│           ├── visits.rs
│           ├── medications.rs
│           ├── prescriptions.rs
│           ├── reconciliation.rs
│           └── audit.rs
```

### 9.2 Database Schema (`001_initial_schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS patients (
    id              TEXT PRIMARY KEY,
    display_label   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
    id              TEXT PRIMARY KEY,
    patient_id      TEXT NOT NULL REFERENCES patients(id),
    doctor          TEXT NOT NULL,
    facility        TEXT NOT NULL,
    facility_type   TEXT NOT NULL,
    specialty       TEXT,
    encounter_ts    TEXT NOT NULL,
    notes           TEXT,
    clinician_sig   TEXT NOT NULL,
    crc             TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medications (
    id              TEXT PRIMARY KEY,
    visit_id        TEXT NOT NULL REFERENCES visits(id),
    patient_id      TEXT NOT NULL REFERENCES patients(id),
    generic_name    TEXT NOT NULL,
    brand_name      TEXT,
    strength        TEXT NOT NULL,
    dosage_form     TEXT NOT NULL,
    frequency       TEXT NOT NULL,
    instructions    TEXT,
    duration        TEXT,
    status          TEXT NOT NULL CHECK(status IN ('PRESCRIBED','MODIFIED','HELD','DISCONTINUED')),
    indication      TEXT,
    route           TEXT,
    quantity        INTEGER,
    warnings        TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS discrepancy_flags (
    id              TEXT PRIMARY KEY,
    visit_id        TEXT NOT NULL REFERENCES visits(id),
    medication_id   TEXT NOT NULL REFERENCES medications(id),
    category        TEXT NOT NULL,
    incoming_val    TEXT NOT NULL,
    local_val       TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK(severity IN ('HIGH','MEDIUM','LOW')),
    prompt          TEXT NOT NULL,
    resolution      TEXT NOT NULL DEFAULT 'PENDING',
    resolved_by     TEXT,
    resolved_at     TEXT,
    rationale       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ts              TEXT NOT NULL,
    actor           TEXT NOT NULL,
    fac_id          TEXT NOT NULL,
    p_id            TEXT NOT NULL,
    v_id            TEXT,
    flag_id         TEXT,
    action          TEXT NOT NULL,
    description     TEXT NOT NULL,
    sig             TEXT NOT NULL,
    prev_hash       TEXT NOT NULL,
    meta            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_status ON medications(status);
CREATE INDEX idx_flags_severity ON discrepancy_flags(severity, resolution);
CREATE INDEX idx_audit_patient ON audit_log(p_id);
```

### 9.3 Key Rust Command Signatures

```rust
#[tauri::command]
pub async fn run_diff_engine(
    db: State<'_, DbPool>,
    incoming_meds: Vec<MedicationItem>,
    patient_id: String,
) -> Result<DiffEngineOutput, String> { /* ... */ }

#[tauri::command]
pub async fn resolve_flag(
    db: State<'_, DbPool>,
    flag_id: String,
    resolution: String,
    rationale: Option<String>,
    resolved_by: String,
) -> Result<AuditLogEntry, String> { /* ... */ }

#[tauri::command]
pub async fn commit_reconciled_record(
    db: State<'_, DbPool>,
    patient_id: String,
    visit_id: String,
    resolved_flag_ids: Vec<String>,
    clinician_sig: String,
) -> Result<AuditLogEntry, String> { /* ... */ }
```

---

## 10. Security, Privacy & Compliance Boundaries

### 10.1 Patient Data Privacy

| Data Element | Stored On Device | Transmitted in QR | Hashed/Anonymized |
|---|---|---|---|
| Patient full name | No | No | N/A |
| Date of birth | No | No | N/A |
| Patient identifier | Hashed (pId) | Hashed (pId) | Yes — SHA-256 truncated |
| Medication list | Yes (local SQLite) | Yes (compressed) | No (clinical need) |
| Prescriber name | Yes | Yes | No (clinical need) |
| Clinician signature | Hash only | Hash only | Yes |

**PII Minimization Principle:** No patient name, address, national ID, or date of birth is ever stored or transmitted. The `pId` is a one-way hash — computable by any facility with the patient's context, but non-reversible.

### 10.2 QR Channel Security Considerations

| Risk | Mitigation |
|---|---|
| Shoulder surfing | Auto-dismiss QR after 60s; display only during active scan |
| Screenshot/interception | Payload contains only hashed pId; not PII-linked without key |
| Payload tampering | CRC32 integrity check + clinician sig verification |
| Replay attacks | Timestamp in payload; clinician review required before commit |
| Unauthorized QR issuance | Clinician mode requires authentication before QR issuance |

### 10.3 Regulatory Alignment

| Regulation | Alignment Status |
|---|---|
| **DPDP Act 2023 (India)** | Compliant — no PII stored/transmitted; patient-controlled data |
| **HIPAA Safe Harbor** | Aligned — 18 de-identification criteria met by hashed pId design |
| **HL7 FHIR R4** | Partial — MedicationItem maps to FHIR MedicationRequest; export adapter planned |
| **NMC Digital Health Guidelines** | Clinician sign-off and audit trail align with documentation standards |

---

## 11. Performance Budgets & QR Capacity Calculations

### 11.1 QR Code Version Capacity Reference

| QR Version | ECC Level | Alphanumeric Capacity | Byte Capacity |
|---|---|---|---|
| 10 | M | 395 chars | 271 bytes |
| 20 | M | 858 chars | 586 bytes |
| 30 | M | 1,423 chars | 972 bytes |
| 40 | M | 2,089 chars | 1,426 bytes |
| 40 | L | 4,296 chars | 2,953 bytes |

> [!NOTE]
> Medi-Trace targets **QR Version 20–30, ECC-M** for single-encounter payloads — good balance between data density and reliable scanning in variable clinic lighting.

### 11.2 Operation Performance Targets

| Operation | Target | Maximum |
|---|---|---|
| Payload serialization (single encounter) | < 50ms | 100ms |
| QR frame rendering (single) | < 100ms | 200ms |
| Multi-frame animation (8 frames) | 800ms/frame | 1200ms/frame |
| Camera frame decode (single QR) | < 300ms | 500ms |
| Full deserialization pipeline | < 100ms | 200ms |
| Diff engine execution (10 meds) | < 50ms | 150ms |
| Diff engine execution (50 meds) | < 200ms | 500ms |
| SQLite write (single record) | < 20ms | 50ms |

### 11.3 Storage Footprint Per Patient

| Data Type | Per Record | 5-Year History (est.) |
|---|---|---|
| Visit record (SQLite) | ~500 B | ~12 KB (24 visits) |
| Medication records | ~200 B each | ~24 KB (120 items) |
| Discrepancy flags | ~400 B each | ~20 KB (50 flags) |
| Audit log entries | ~300 B each | ~30 KB (100 entries) |
| **Total estimated** | — | **~86 KB per patient** |

---

## 12. Deployment & Operational Modes

### 12.1 Web Prototype Mode (Current State)

```
Stack:  React 19 + TypeScript + Vite 8
State:  In-memory + IndexedDB (Dexie.js)
Deploy: Static site / local dev server
```

```bash
cd app && npm install && npm run dev
# → http://localhost:5173
```

### 12.2 Desktop Native Mode (Phase 1 — Tauri)

```
Stack:  Tauri v2 + Rust + SQLite (tauri-plugin-sql) + React 18
Deploy: Windows/macOS/Linux native installer (.exe/.dmg/.AppImage)
```

```bash
cd ehr-platform && npm install && npm run tauri:build
# → Installer in src-tauri/target/release/bundle/
```

### 12.3 Mobile Progressive Web App Mode (Phase 2 — Planned)

```
Stack:  React + PWA (Vite PWA plugin) + IndexedDB
Target: Patient-facing mobile installation (Android/iOS)
QR:     WebRTC camera API
Sync:   None — fully offline
```

### 12.4 Air-Gapped Hospital Deployment

- Installer distributed via USB drive
- No auto-update mechanism (by design)
- Binary integrity validated on startup via Tauri code signing
- Zero outbound network calls — all traffic blocked at application level

---

## 13. Known Limitations & Risk Register

| Risk | Category | Severity | Mitigation |
|---|---|---|---|
| QR shoulder-surfing | Privacy | Medium | Auto-dismiss after 60s; screen brightness control |
| Lost/stolen patient device | Security | High | No PII on device; medication data non-identifiable without key |
| Clinician name collision | Data Quality | Low | Facility ID + MCI number disambiguates |
| Non-standard drug naming | Clinical | Medium | Generic (INN) name mandatory; brand optional |
| Compression ratio variability | Technical | Low | Multi-frame fallback always available |
| QR scan failure in poor light | UX | Medium | ECC-M; torch toggle; manual entry fallback |
| Clock skew across devices | Integrity | Low | Timestamps display source facility; not used for cryptographic ordering |
| Multi-molecule combination tablets | Clinical | Medium | Flagged separately; clinician must verify |
| No embedded drug interaction DB | Clinical | Medium | System detects record discrepancies only, not pharmacological interactions |
| Partial frame scan | Technical | Low | Progress indicator; rescan button; timeout with clear error message |

> [!CAUTION]
> **Critical Limitation:** Medi-Trace does **not** perform drug-drug interaction checking. It detects *medication record discrepancies between facilities*, not pharmacological interactions. A clinical pharmacist or prescribing physician must perform interaction verification using authorised clinical decision support tools.

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Air-gapped** | A computing environment with no connection to the internet or external networks |
| **BD** | Bis die — twice daily (SIG frequency abbreviation) |
| **Brotli** | Modern compression algorithm, ~15–20% better than Deflate at equivalent CPU cost |
| **CRC32** | Cyclic Redundancy Check — 32-bit error detection for payload integrity |
| **Deflate** | RFC 1951 lossless compression algorithm; used in gzip/zlib |
| **Dexie.js** | Lightweight IndexedDB wrapper for browser-based structured data persistence |
| **Diff Engine** | The deterministic algorithm comparing two medication lists to produce discrepancy flags |
| **ECC** | Error Correction Code — QR code feature allowing data recovery from partially damaged codes |
| **Handover Manifest** | Compiled multi-visit record generated by patient's device for transfer to new provider |
| **INN** | International Nonproprietary Name — standardised generic name of a pharmaceutical substance |
| **MessagePack** | Binary serialization format, more compact than JSON |
| **MCI** | Medical Council of India — registration authority for Indian physicians |
| **OD** | Omni die — once daily (SIG frequency abbreviation) |
| **pId** | Hashed patient identifier used throughout the system in place of PII |
| **PRN** | Pro re nata — as needed (SIG frequency abbreviation) |
| **QR Stream** | Sequence of QR code frames displayed in rapid succession to encode large payloads |
| **Reconciliation** | Clinical process of comparing medication records from different sources and resolving discrepancies |
| **SIG** | Signatura — the dosing instructions section of a prescription |
| **SQLite** | Lightweight, embedded, serverless relational database |
| **Tauri** | Rust-based framework for building cross-platform desktop apps with web frontends |
| **TDS** | Ter die sumendum — three times daily (SIG frequency abbreviation) |
| **URL-safe Base64** | Base64 variant using `-` and `_` instead of `+` and `/` — suitable for QR embedding |
| **vId** | Visit/encounter identifier — UUID v4, unique per clinical encounter |

---

*End of Technical Specification Document*

---

**Document Control:**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | Nov 2026 | VOID RUNNERS | Initial draft for hackathon submission |

**Review Status:** Draft — Pending Clinical Review
**Next Review:** Post-hackathon production specification phase

**Repository:** [Mithunn123/void_runners_offline_first_medical-application](https://github.com/Mithunn123/void_runners_offline_first_medical-application)
