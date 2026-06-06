# routers/vocab.py | backend
from datetime import datetime, timezone
from fastapi import APIRouter, Request
import aiosqlite
from models.db import DB_PATH
from utils.auth import get_clerk_user_id

router = APIRouter(prefix="/api/vocab", tags=["vocab"])


async def _uid(request: Request) -> str:
    clerk = await get_clerk_user_id(request.headers.get("Authorization"))
    return clerk if clerk else "ip:" + (request.client.host if request.client else "unknown")


@router.post("")
async def add_vocab(request: Request):
    """收藏一个生词。"""
    body = await request.json()
    word = (body.get("word") or "").strip().lower()
    definition = (body.get("definition") or "").strip()
    if not word or len(word) > 50:
        return {"ok": False}
    uid = await _uid(request)
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT 1 FROM vocabulary WHERE user_id=? AND word=?", (uid, word))
        if not await cur.fetchone():
            await db.execute(
                "INSERT INTO vocabulary (user_id, word, definition, created_at) VALUES (?,?,?,?)",
                (uid, word, definition, datetime.now(timezone.utc).isoformat()),
            )
            await db.commit()
    return {"ok": True}


@router.get("")
async def list_vocab(request: Request):
    """返回用户的生词本（最新在前）。"""
    uid = await _uid(request)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT word, definition, created_at FROM vocabulary WHERE user_id=? ORDER BY id DESC LIMIT 100",
            (uid,),
        )
        rows = [dict(r) for r in await cur.fetchall()]
    return rows
