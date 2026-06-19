from fastapi import APIRouter, Request
from datetime import datetime
import models.pg as aiosqlite
from models.db import DB_PATH

router = APIRouter()


@router.post("/api/afdian/webhook")
async def afdian_webhook(request: Request):
    """接收爱发电订单通知，自动标记付款用户为 Pro。"""
    try:
        body = await request.json()
        order = body.get("data", {}).get("order", {})
        status = order.get("status")
        afdian_uid = order.get("user_id", "").strip()

        if status == 2 and afdian_uid:
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute(
                    """INSERT INTO afdian_orders (afdian_user_id, paid_at, linked)
                       VALUES (?, ?, 0)
                       ON CONFLICT(afdian_user_id) DO UPDATE SET paid_at=excluded.paid_at""",
                    (afdian_uid, datetime.utcnow().isoformat()),
                )
                await db.commit()
    except Exception:
        pass  # 任何错误都不影响响应

    return {"ec": 200}


@router.post("/api/user/link-pro")
async def link_pro(request: Request):
    """用户输入爱发电 user_id，验证付款后激活 Pro。"""
    auth_header = request.headers.get("Authorization")
    from utils.auth import get_clerk_user_id
    clerk_uid = await get_clerk_user_id(auth_header)
    if not clerk_uid:
        return {"success": False, "error": "not_logged_in"}

    body = await request.json()
    afdian_uid = body.get("afdian_user_id", "").strip()
    if not afdian_uid:
        return {"success": False, "error": "missing_afdian_user_id"}

    async with aiosqlite.connect(DB_PATH) as db:
        row = await db.execute(
            "SELECT 1 FROM afdian_orders WHERE afdian_user_id=?",
            (afdian_uid,),
        )
        found = await row.fetchone()
        if not found:
            return {"success": False, "error": "no_order_found"}

        await db.execute(
            """INSERT INTO pro_users (clerk_user_id, afdian_user_id, created_at)
               VALUES (?, ?, NOW())
               ON CONFLICT (clerk_user_id) DO UPDATE
               SET afdian_user_id = excluded.afdian_user_id, created_at = excluded.created_at""",
            (clerk_uid, afdian_uid),
        )
        await db.execute(
            "UPDATE afdian_orders SET linked=1 WHERE afdian_user_id=?",
            (afdian_uid,),
        )
        await db.commit()

    return {"success": True}
