from datetime import date as _date
from fastapi import APIRouter, Request, UploadFile, File, HTTPException
import aiosqlite
from models.db import DB_PATH
from services.pronunciation_service import assess_pronunciation
from utils.auth import get_clerk_user_id, get_admin_user_ids, get_pro_user_ids
import os

router = APIRouter()

FREE_DAILY_LIMIT = int(os.environ.get("FREE_DAILY_LIMIT", "10"))
ANON_DAILY_LIMIT = 3


async def _get_usage(user_id: str, today: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        row = await db.execute(
            "SELECT count FROM pronunciation_usage WHERE user_id=? AND date=?",
            (user_id, today),
        )
        result = await row.fetchone()
        return result[0] if result else 0


async def _increment_usage(user_id: str, today: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO pronunciation_usage (user_id, date, count) VALUES (?,?,1)
               ON CONFLICT(user_id, date) DO UPDATE SET count=count+1""",
            (user_id, today),
        )
        await db.commit()


async def _is_db_pro(clerk_user_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        row = await db.execute(
            "SELECT 1 FROM pro_users WHERE clerk_user_id=?",
            (clerk_user_id,),
        )
        return (await row.fetchone()) is not None


@router.post("/api/pronunciation-assess")
async def pronunciation_assess(
    request: Request,
    audio: UploadFile = File(...),
):
    today = str(_date.today())
    auth_header = request.headers.get("Authorization")
    clerk_uid = await get_clerk_user_id(auth_header)

    if clerk_uid:
        user_id = clerk_uid
    else:
        user_id = "ip:" + (request.client.host if request.client else "unknown")

    if clerk_uid and clerk_uid in get_admin_user_ids():
        pass  # 不限速
    else:
        is_pro = False
        if clerk_uid:
            is_pro = (clerk_uid in get_pro_user_ids()) or (await _is_db_pro(clerk_uid))

        limit = 999999 if is_pro else (FREE_DAILY_LIMIT if clerk_uid else ANON_DAILY_LIMIT)
        usage = await _get_usage(user_id, today)
        if usage >= limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_limit_reached",
                    "limit": limit,
                    "used": usage,
                    "is_pro": is_pro,
                },
            )
        await _increment_usage(user_id, today)

    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm;codecs=opus"
    result = await assess_pronunciation(audio_bytes, content_type)
    return result


@router.get("/api/user/status")
async def user_status(request: Request):
    today = str(_date.today())
    auth_header = request.headers.get("Authorization")
    clerk_uid = await get_clerk_user_id(auth_header)

    if clerk_uid:
        user_id = clerk_uid
        is_admin = clerk_uid in get_admin_user_ids()
        is_pro = is_admin or (clerk_uid in get_pro_user_ids()) or (await _is_db_pro(clerk_uid))
        limit = 999999 if (is_admin or is_pro) else FREE_DAILY_LIMIT
    else:
        user_id = "ip:" + (request.client.host if request.client else "unknown")
        is_admin = False
        is_pro = False
        limit = ANON_DAILY_LIMIT

    used = await _get_usage(user_id, today)
    return {
        "clerk_user_id": clerk_uid,
        "is_pro": is_pro,
        "is_admin": is_admin,
        "daily_limit": limit,
        "used_today": used,
        "remaining": max(0, limit - used) if limit < 999999 else 999,
    }
