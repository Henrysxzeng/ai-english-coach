# routers/report.py | backend | v1.2
import os
import re
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
import models.pg as aiosqlite
from dotenv import load_dotenv
from services.llm_service import generate_report_scores, generate_interview_feedback, generate_module_feedback

STAR_FEEDBACK_SCENES = {"sde_behavioral", "sde_project", "sde_thinking", "ds_behavioral", "ds_resume_deep_dive", "pm_behavioral", "pm_resume_deep_dive"}
MODULE_FEEDBACK_SCENES = {
    "sde_technical_explain", "sde_debug",
    "ds_technical_explain", "ds_system_design", "ds_debug",
    "pm_product_sense", "pm_metrics_execution", "pm_estimation_strategy",
}
SCENE_TO_MODULE = {
    "sde_technical_explain": ("sde", "technical_explain"),
    "sde_debug": ("sde", "debug"),
    "ds_technical_explain": ("ds", "technical_explain"),
    "ds_system_design": ("ds", "system_design"),
    "ds_debug": ("ds", "debug"),
    "pm_product_sense": ("pm", "technical_explain"),
    "pm_metrics_execution": ("pm", "system_design"),
    "pm_estimation_strategy": ("pm", "debug"),
}

FILLER_RE = r'\b(um+|uh+|hmm+|like|you know|sort of|kind of|basically|literally|i mean)\b'

load_dotenv()

router = APIRouter(prefix="/api/report", tags=["report"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


@router.get("/{session_id}")
async def get_report(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        cursor = await db.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [dict(m) for m in await cursor.fetchall()]

        cursor = await db.execute(
            "SELECT original, corrected, explanation FROM corrections WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        corrections_raw = [dict(c) for c in await cursor.fetchall()]

        cursor = await db.execute(
            "SELECT content, recording_duration_ms FROM messages WHERE session_id = ? AND role = 'user' ORDER BY id",
            (session_id,),
        )
        user_msg_rows = [dict(r) for r in await cursor.fetchall()]

    duration = 0
    if session["created_at"] and session["ended_at"]:
        try:
            start = datetime.fromisoformat(session["created_at"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(session["ended_at"].replace("Z", "+00:00"))
            duration = int((end - start).total_seconds())
        except Exception:
            pass

    user_turns = sum(1 for m in messages if m["role"] == "user")

    # WPM calculation
    total_words = sum(len(r["content"].split()) for r in user_msg_rows)
    total_min = sum(r["recording_duration_ms"] for r in user_msg_rows) / 60000
    wpm = round(total_words / total_min) if total_min > 0.05 else None
    wpm_label = (
        "Above average" if wpm and wpm >= 140
        else "Average" if wpm and wpm >= 110
        else "Below average" if wpm
        else None
    )
    wpm_context = "Normal conversational pace is 110–140 WPM"

    # Filler word detection
    all_text = " ".join(r["content"].lower() for r in user_msg_rows)
    filler_count = len(re.findall(FILLER_RE, all_text))
    filler_words = list(set(re.findall(FILLER_RE, all_text)))[:5]

    if user_turns == 0:
        return {
            "session_id": session_id,
            "scene": session["scene"],
            "duration_seconds": duration,
            "total_turns": 0,
            "pronunciation_score": 0.0,
            "grammar_errors": 0,
            "fluency_score": 0.0,
            "vocabulary_score": 0.0,
            "overall_score": 0.0,
            "corrections": [],
            "suggestions": ["Please complete at least one conversation turn"],
            "highlights": [],
            "wpm": None,
            "wpm_label": None,
            "wpm_context": wpm_context,
            "filler_count": 0,
            "filler_words": [],
            "interview_feedback": None,
            "module_feedback": None,
        }

    scores = await generate_report_scores(session_id, messages, corrections_raw)

    interview_feedback = None
    if session["scene"] in STAR_FEEDBACK_SCENES:
        resume_ctx = session["resume_context"] or ""
        jd_ctx = session["jd_context"] or ""
        try:
            interview_feedback = await generate_interview_feedback(messages, resume_ctx, jd_ctx)
        except Exception:
            interview_feedback = None

    module_feedback = None
    if session["scene"] in MODULE_FEEDBACK_SCENES:
        track, module = SCENE_TO_MODULE[session["scene"]]
        try:
            module_feedback = await generate_module_feedback(track, module, messages)
        except Exception:
            module_feedback = None

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO session_analyses
            (session_id, scene, topic, clarity_score, structure_score,
             ambiguous_expressions, weak_areas, overall_score, grammar_errors,
             vocabulary_score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (session_id) DO UPDATE SET
                scene = excluded.scene,
                topic = excluded.topic,
                clarity_score = excluded.clarity_score,
                structure_score = excluded.structure_score,
                ambiguous_expressions = excluded.ambiguous_expressions,
                weak_areas = excluded.weak_areas,
                overall_score = excluded.overall_score,
                grammar_errors = excluded.grammar_errors,
                vocabulary_score = excluded.vocabulary_score,
                created_at = excluded.created_at
        """, (
            session_id,
            session["scene"],
            scores.get("topic", ""),
            scores.get("clarity_score", 0),
            scores.get("structure_score", 0),
            json.dumps(scores.get("ambiguous_expressions", []), ensure_ascii=False),
            json.dumps(scores.get("weak_areas", []), ensure_ascii=False),
            scores.get("overall_score", 0),
            scores.get("grammar_errors", 0),
            scores.get("vocabulary_score", 0),
            datetime.utcnow().isoformat(),
        ))
        await db.commit()

    return {
        "session_id": session_id,
        "scene": session["scene"],
        "duration_seconds": duration,
        "total_turns": user_turns,
        **scores,
        "corrections": corrections_raw,
        "wpm": wpm,
        "wpm_label": wpm_label,
        "wpm_context": wpm_context,
        "filler_count": filler_count,
        "filler_words": filler_words,
        "interview_feedback": interview_feedback,
        "module_feedback": module_feedback,
    }
