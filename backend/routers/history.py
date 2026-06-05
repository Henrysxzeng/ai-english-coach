# routers/history.py | backend | v1.0
import json
import os
from fastapi import APIRouter, HTTPException
import aiosqlite
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/api/history", tags=["history"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


@router.get("")
async def get_history():
    """返回所有场景的历史记录，按时间倒序。"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT session_id, scene, topic, clarity_score, structure_score,
                   overall_score, grammar_errors, vocabulary_score, created_at
            FROM session_analyses
            ORDER BY created_at DESC
            LIMIT 50
        """)
        rows = [dict(r) for r in await cursor.fetchall()]
    return rows


@router.get("/{scene}")
async def get_history_by_scene(scene: str):
    """返回指定场景的历史记录。"""
    valid = {"interview", "restaurant", "meeting", "hospital", "phone_call", "customer_service"}
    if scene not in valid:
        raise HTTPException(status_code=400, detail="Invalid scene")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT session_id, scene, topic, clarity_score, structure_score,
                   overall_score, grammar_errors, vocabulary_score, created_at
            FROM session_analyses
            WHERE scene = ?
            ORDER BY created_at DESC
            LIMIT 20
        """, (scene,))
        rows = [dict(r) for r in await cursor.fetchall()]
    return rows
