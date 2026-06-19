# routers/assessment.py | backend | v1.0
# owner: Backend Engineer
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
import models.pg as aiosqlite
from dotenv import load_dotenv
from services.llm_service import generate_assessment_result

load_dotenv()
router = APIRouter(prefix="/api/assessment", tags=["assessment"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


@router.post("/start")
async def start_assessment():
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sessions (id, scene, status, created_at, difficulty) VALUES (?, 'assessment', 'active', ?, 'medium')",
            (session_id, now),
        )
        await db.commit()
    return {"session_id": session_id, "created_at": now}


@router.get("/{session_id}/result")
async def get_assessment_result(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM sessions WHERE id = ? AND scene = 'assessment'",
            (session_id,),
        )
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Assessment session not found")

        cursor = await db.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [dict(m) for m in await cursor.fetchall()]

    result = await generate_assessment_result(messages)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET cefr_level = ?, status = 'ended' WHERE id = ?",
            (result.get("cefr_level"), session_id),
        )
        await db.commit()

    return result
