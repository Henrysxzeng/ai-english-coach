import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
import aiosqlite
from dotenv import load_dotenv
from services.llm_service import generate_report_scores

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

    duration = 0
    if session["created_at"] and session["ended_at"]:
        try:
            start = datetime.fromisoformat(session["created_at"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(session["ended_at"].replace("Z", "+00:00"))
            duration = int((end - start).total_seconds())
        except Exception:
            pass

    user_turns = sum(1 for m in messages if m["role"] == "user")
    scores = await generate_report_scores(session_id, messages, corrections_raw)

    return {
        "session_id": session_id,
        "scene": session["scene"],
        "duration_seconds": duration,
        "total_turns": user_turns,
        **scores,
        "corrections": corrections_raw,
    }
