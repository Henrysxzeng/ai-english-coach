# routers/session.py | backend | v1.0
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
import aiosqlite
from dotenv import load_dotenv
from schemas.api_schemas import SessionCreate, SessionResponse

load_dotenv()

router = APIRouter(prefix="/api/session", tags=["session"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")

SCENE_OPENERS = {
    "interview": "Hello! Welcome, please take a seat. To start, could you tell me a little about yourself and why you are interested in this position?",
    "restaurant": "Hi there, welcome to The Golden Fork! I will be your server today. Can I start you off with something to drink, or are you ready to order?",
    "meeting": "Good morning everyone, let us get started. Could you give me a quick status update on where things stand with the project this week?",
}


@router.post("/create", response_model=SessionResponse)
async def create_session(data: SessionCreate):
    if data.scene not in SCENE_OPENERS:
        raise HTTPException(status_code=400, detail=f"Invalid scene. Choose: {list(SCENE_OPENERS.keys())}")

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    opener = SCENE_OPENERS[data.scene]

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sessions (id, scene, status, created_at) VALUES (?, ?, 'active', ?)",
            (session_id, data.scene, now),
        )
        await db.execute(
            "INSERT INTO messages (session_id, role, content, turn_id, created_at) VALUES (?, 'assistant', ?, 0, ?)",
            (session_id, opener, now),
        )
        await db.commit()

    return SessionResponse(session_id=session_id, scene=data.scene, system_prompt=opener, created_at=now)


@router.get("/{session_id}")
async def get_session(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        cursor = await db.execute(
            "SELECT role, content, turn_id, created_at FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [dict(m) for m in await cursor.fetchall()]

    return {
        "session_id": session_id,
        "scene": session["scene"],
        "status": session["status"],
        "messages": messages,
        "created_at": session["created_at"],
    }


@router.post("/{session_id}/end")
async def end_session(session_id: str):
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")
        await db.execute(
            "UPDATE sessions SET status='ended', ended_at=? WHERE id=?",
            (now, session_id),
        )
        await db.commit()
    return {"session_id": session_id, "status": "ended"}
