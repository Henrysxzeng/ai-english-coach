# AI English Coach — Development Progress
> Manager: Claude (Manager AI) | Updated: 2026-06-05

## Project Info
- **Deadline**: 2026-06-07 23:59 (七牛云 × XEngineer 暑期实训营 第三批次)
- **Frontend**: Vercel (auto-deploy from main branch)
- **Backend**: Railway (auto-deploy, root dir: backend)
- **Repo**: GitHub (main branch)

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: FastAPI + Python 3.11 + aiosqlite + SQLite
- AI: DeepSeek API (`deepseek-chat`)
- Voice: Browser SpeechRecognition (Chrome only) + Browser speechSynthesis

## Commit Convention
```
feat(frontend): <description>
feat(backend): <description>
feat: <description>          ← full-stack change
fix(frontend/backend): <description>
```
**Rule: commit + push after EVERY completed subtask.**

---

## Phase 1 — Parallel (E1 + E2 + E3 run simultaneously)

### Engineer 1: Frontend — Practice Page
File: `frontend/src/app/practice/[scene]/page.tsx`

| # | Task | Status | Commit |
|---|------|--------|--------|
| E1-1 | Microphone sound wave animation | ⬜ pending | — |
| E1-2 | Two recording modes (Manual / Auto toggle) | ⬜ pending | — |
| E1-3 | Hint button (💡) for stuck users | ⬜ pending | — |
| E1-4 | Recording duration tracking (send `duration_ms` via WebSocket) | ⬜ pending | — |

---

### Engineer 2: Frontend — Homepage + Report
Files: `frontend/src/app/page.tsx`, `frontend/src/app/report/[sessionId]/page.tsx`

| # | Task | Status | Commit |
|---|------|--------|--------|
| E2-1 | Add 3 new scene cards (hospital / phone_call / customer_service) | ⬜ pending | — |
| E2-2 | Homepage "How to Use" guide section (4 steps) | ⬜ pending | — |
| E2-3 | Homepage hero redesign (gradient + heading + CTA) | ⬜ pending | — |
| E2-4 | Report — Key Vocabulary section | ⬜ pending | — |
| E2-5 | Report — Print / Export PDF button | ⬜ pending | — |

---

### Engineer 3: Backend — Core Enhancements
Files: `backend/services/llm_service.py`, `backend/routers/ws.py`, `backend/routers/report.py`, `backend/models/db.py`

| # | Task | Status | Commit |
|---|------|--------|--------|
| E3-1 | Add hospital / phone_call / customer_service to SCENE_PROMPTS | ⬜ pending | — |
| E3-2 | DB schema: add `recording_duration_ms` to messages table | ⬜ pending | — |
| E3-3 | WebSocket: accept + store `duration_ms` from client | ⬜ pending | — |
| E3-4 | Report: WPM calculation + filler word detection + interpretation labels | ⬜ pending | — |
| E3-5 | Report prompt: add `key_vocabulary` field to LLM output | ⬜ pending | — |

> **⚠️ E4 must NOT start until E3 pushes all tasks. E4: run `git pull` first.**

---

## Phase 2 — Sequential (E4 starts AFTER E3 is fully pushed)

### Engineer 4: Full Stack — New Features
Files: both frontend and backend (see task details)

| # | Task | Status | Commit |
|---|------|--------|--------|
| E4-1 | Difficulty levels (Easy / Medium / Hard) — full stack | ⬜ pending | — |
| E4-2 | Oral proficiency assessment feature — full stack | ⬜ pending | — |

---

## Completion Log
_(Engineers append here when done with their phase)_

| Engineer | Completed At | Notes |
|----------|-------------|-------|
| — | — | — |
