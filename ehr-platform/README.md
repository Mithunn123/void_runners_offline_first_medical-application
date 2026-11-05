# EHR Platform - The Forgotten Prescription

> **PS4 Hackathon Submission**: Offline-first medication reconciliation & handover platform

## 🎯 Problem Statement

Medication information becomes fragmented when patients move between healthcare facilities, leading to dangerous errors (wrong doses, missed medications, conflicting instructions). This platform provides a 100% offline-first solution with:

- ✅ **Chronological visit timeline** with scanned prescription attachments
- ✅ **Medication reconciliation diff engine** detecting conflicts between visits
- ✅ **Auditable conflict resolution** with professional review queue
- ✅ **100% local-first storage** - zero server dependencies

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Desktop Runtime**: Tauri 2.12 (Rust backend)
- **Database**: SQLite via tauri-plugin-sql
- **UI**: Lucide React icons + Glass morphism design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## 📁 Project Structure

```
ehr-platform/
├── src/                      # React frontend
│   ├── components/
│   │   ├── Timeline/        # Visit timeline UI
│   │   ├── Documents/       # Prescription viewer
│   │   ├── Reconciliation/  # Diff view
│   │   ├── ReviewQueue/     # Conflict resolution
│   │   └── Audit/           # Audit log
│   ├── lib/
│   │   ├── reconciliation/  # Diff engine
│   │   └── files/           # File handling
│   ├── types/               # TypeScript definitions
│   └── db/                  # Database queries
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── commands/        # Tauri commands
│   │   └── main.rs
│   └── migrations/          # SQL schema
└── docs/                    # Documentation
```

## 🔒 Safety & Compliance

**Operational Boundaries:**
- ✅ Read-only assistance (no autonomous prescription modifications)
- ✅ Synthetic data only for demo
- ✅ All medication decisions require qualified professional review
- ✅ GDPR/HIPAA-friendly architecture (data never leaves device)

## 📊 Current Status

**Phase 0: Project Setup** ✅ **COMPLETE**
- [x] Tauri + React + TypeScript configuration
- [x] Tailwind CSS setup
- [x] Database schema (6 tables)
- [x] TypeScript types
- [x] Basic UI shell

**Next Steps:**
- Phase 1: Database Layer (Tauri SQL commands)
- Phase 2: Reconciliation Engine
- Phase 4: Timeline UI
- Phase 6: Diff View

## 🎨 Features

### 1. Visit Timeline
- Chronological view of all patient visits
- Medication count badges
- Prescription attachment indicators
- Expandable medication lists

### 2. Medication Reconciliation
- Side-by-side visit comparison
- Color-coded changes (added/removed/modified/conflicting)
- Conflict severity classification (high/medium/low)
- Automated diff detection

### 3. Review Queue
- Unresolved conflicts dashboard
- Professional approval workflow
- Note-taking capability
- Role-based actions (patient/pharmacist/doctor)

### 4. Audit Trail
- Immutable change history
- Filterable by date, user role, action type
- CSV export functionality

## 📝 License

Demo project for hackathon submission. Not for production medical use without proper regulatory approval.

---

**Built for PS4**: *The Forgotten Prescription - Medication Continuity & Safe Handover*
