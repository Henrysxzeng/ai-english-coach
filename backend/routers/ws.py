# routers/ws.py | backend | v1.0
import os
import base64
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import aiosqlite
from dotenv import load_dotenv
from services.asr_service import transcribe_audio
from services.llm_service import get_ai_response, evaluate_correction
from services.tts_service import text_to_speech

load_dotenv()

router = APIRouter(tags=["websocket"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT scene FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()

    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    scene = session["scene"]
    turn_id = 1

    try:
        while True:
            # Receive binary audio (WAV, 16kHz, mono)
            audio_bytes = await websocket.receive_bytes()

            now = datetime.now(timezone.utc).isoformat()

            # ASR: audio bytes → text
            try:
                user_text = await transcribe_audio(audio_bytes)
            except ValueError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
                continue

            # Load message history for LLM context
            async with aiosqlite.connect(DB_PATH) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(
                    "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
                    (session_id,),
                )
                history = [dict(r) for r in await cursor.fetchall()]

            messages = history + [{"role": "user", "content": user_text}]

            # Parallel: grammar correction + AI reply
            correction, ai_text = await asyncio.gather(
                evaluate_correction(user_text),
                get_ai_response(scene, messages),
            )

            # TTS: AI text → audio bytes → base64
            try:
                tts_bytes = await text_to_speech(ai_text)
                audio_base64 = base64.b64encode(tts_bytes).decode("utf-8")
            except ValueError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
                continue

            # Persist messages and corrections
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute(
                    "INSERT INTO messages (session_id, role, content, turn_id, created_at) VALUES (?, 'user', ?, ?, ?)",
                    (session_id, user_text, turn_id, now),
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
                "type": "response",
                "user_text": user_text,
                "ai_text": ai_text,
                "audio_base64": audio_base64,
                "correction": correction,
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
