# routers/ws.py | backend | v1.2
import os
import json
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import aiosqlite
from dotenv import load_dotenv
from services.llm_service import get_ai_response, get_ai_response_stream, evaluate_correction, evaluate_upgrade, generate_memory_greeting

load_dotenv()

router = APIRouter(tags=["websocket"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")
AI_RESPONSE_TIMEOUT = 15


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT scene, status, difficulty, resume_context, jd_context FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()

    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    if session["status"] == "ended":
        await websocket.send_json({"type": "error", "message": "Session already ended"})
        await websocket.close()
        return

    scene = session["scene"]
    difficulty = session["difficulty"] or "medium"
    resume_context = session["resume_context"] or ""
    jd_context = session["jd_context"] or ""
    turn_id = 1

    # Query previous analysis for memory-aware greeting
    prev_row = None
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """SELECT topic, weak_areas, ambiguous_expressions, clarity_score, structure_score
                FROM session_analyses
                WHERE scene = ? AND session_id != ?
                ORDER BY created_at DESC LIMIT 1""",
                (scene, session_id),
            )
            prev_row = await cursor.fetchone()
    except Exception:
        pass

    if prev_row and json.loads(prev_row["weak_areas"] or "[]"):
        previous_analysis = {
            "topic": prev_row["topic"],
            "weak_areas": json.loads(prev_row["weak_areas"] or "[]"),
            "ambiguous_expressions": json.loads(prev_row["ambiguous_expressions"] or "[]"),
            "clarity_score": prev_row["clarity_score"],
            "structure_score": prev_row["structure_score"],
        }
        try:
            greeting = await generate_memory_greeting(scene, previous_analysis)
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute(
                    "UPDATE messages SET content = ? WHERE session_id = ? AND role = 'assistant' AND turn_id = 0",
                    (greeting, session_id),
                )
                await db.commit()
            await websocket.send_json({
                "type": "greeting",
                "ai_text": greeting,
                "has_memory": True,
            })
        except Exception:
            pass  # 生成失败则静默，用默认开场白

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            if msg.get("type") != "user_message":
                continue

            user_text = (msg.get("text") or "").strip()
            if not user_text:
                continue

            personality = msg.get("personality", "friendly")

            duration_ms = int(msg.get("duration_ms") or 0)
            now = datetime.now(timezone.utc).isoformat()

            # Load message history
            async with aiosqlite.connect(DB_PATH) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(
                    "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
                    (session_id,),
                )
                history = [dict(r) for r in await cursor.fetchall()]

            messages = history + [{"role": "user", "content": user_text}]

            # 并行启动纠错与表达升级（不阻塞流式回复）
            correction_task = asyncio.create_task(evaluate_correction(user_text))
            upgrade_task = asyncio.create_task(evaluate_upgrade(user_text))

            # 通知前端显示用户消息并准备接收流式回复
            await websocket.send_json({"type": "stream_start", "user_text": user_text, "turn_id": turn_id})

            # 流式生成 AI 回复，逐块下发，降低首字延迟
            ai_text = ""
            try:
                async for delta in get_ai_response_stream(
                    scene, messages, difficulty, resume_context=resume_context, jd_context=jd_context, personality=personality
                ):
                    ai_text += delta
                    await websocket.send_json({"type": "stream_chunk", "delta": delta})
            except Exception:
                if not ai_text:
                    ai_text = "Sorry, I had trouble responding. Could you say that again?"

            correction = await correction_task
            upgrade = await upgrade_task

            # Verify session still exists, then persist
            async with aiosqlite.connect(DB_PATH) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,))
                if not await cursor.fetchone():
                    await websocket.send_json({"type": "error", "message": "Session no longer exists"})
                    await websocket.close()
                    return

                await db.execute(
                    "INSERT INTO messages (session_id, role, content, turn_id, created_at, recording_duration_ms) VALUES (?, 'user', ?, ?, ?, ?)",
                    (session_id, user_text, turn_id, now, duration_ms),
                )
                await db.execute(
                    "INSERT INTO messages (session_id, role, content, turn_id, created_at) VALUES (?, 'assistant', ?, ?, ?)",
                    (session_id, ai_text, turn_id, now),
                )
                if correction.get("has_error"):
                    await db.execute(
                        "INSERT INTO corrections (session_id, turn_id, original, corrected, explanation, error_type) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            session_id,
                            turn_id,
                            correction["original"],
                            correction["corrected"],
                            correction["explanation"],
                            correction.get("error_type", "grammar"),
                        ),
                    )
                await db.commit()

            await websocket.send_json({
                "type": "stream_end",
                "ai_text": ai_text,
                "correction": correction,
                "upgrade": upgrade,
                "turn_id": turn_id,
            })

            turn_id += 1

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
