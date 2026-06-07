# routers/tts.py | 拟真音色 TTS 端点
from fastapi import APIRouter
from fastapi.responses import Response
from services.tts_service import synthesize

router = APIRouter()


@router.get("/api/tts")
async def tts(text: str, voice: str = "en-US-AriaNeural"):
    if not text or len(text) > 1000:
        return Response(status_code=400)
    audio = await synthesize(text, voice)
    if not audio:
        return Response(status_code=502)
    return Response(content=audio, media_type="audio/mpeg")
