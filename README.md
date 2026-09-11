# CURA — Voice-First, Stage-Adaptive AI Companion for Dementia Patients

CURA is a non-medical voice companion built specifically for individuals living with dementia. CURA is a **SUPPORT companion, never a medical device**. This boundary is deterministically enforced in code before any text is synthesized or rendered.

---

## Technical Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons + Zustand State Management + Web Speech API (with text input fallback).
- **Backend**: Python FastAPI + SQLite3 + Pydantic models.
- **Deterministic Cognitive Engines**:
  - `stage_engine.py`: Single source of truth stage configuration for EARLY (≤20 words/sentence), MID (≤10 words/sentence), LATE (≤6 words/sentence).
  - `repetition_engine.py`: Cosine/token-overlap similarity detection (≥0.85), anti-mechanical paraphrase banks, 4-tier strategy escalation (`direct_answer` → `comforting_context` → `validate_emotion` → `gentle_redirection`).
  - `distress_engine.py`: 5-state emotion classification (`calm`, `anxious`, `confused`, `distressed`, `emergency`) + trigger phrase matching + Sundowning window sensitivity (default 16:00–19:00).
  - `hallucination_engine.py`: 3-branch handling (Branch A: Benign false belief; Branch B: Fear-based; Branch C: Risk-related).
  - `escalation_engine.py`: De-escalation voice rate/scripts, real-time alert generation, timeout handling (5 min), contact escalation, and audit logging.
  - `guardrails.py`: Output filter enforcing medical boundary, identity honesty, forbidden phrase filter, and stage word limits.
  - `memory_engine.py`: Verified memory context builder and semantic retrieval.

---

## How to Run CURA

### 1. Start the Backend Server (Terminal 1)
```bash
cd backend
python main.py
```
*Backend runs on `http://localhost:8000`*

### 2. Start the Frontend Server (Terminal 2)
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## Demo Passcode & Routes

- **Patient Mode**: `http://localhost:5173/` (Voice-first full-screen interface)
- **Caregiver Dashboard**: `http://localhost:5173/caregiver` (Password: `cura123`)
- **Family Portal**: `http://localhost:5173/family` (Memory submission & guide)
- **Consent Onboarding**: `http://localhost:5173/onboarding` (Plain-language disclaimer & authorization)
