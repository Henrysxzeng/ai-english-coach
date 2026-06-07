# services/tts_service.py | Azure 神经网络 TTS（复用现有 Azure Speech key）
import os
from xml.sax.saxutils import escape
import httpx

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
TTS_URL = f"https://{AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"

DEFAULT_VOICE = "en-US-AriaNeural"
ALLOWED_VOICES = {
    "en-US-AriaNeural",
    "en-US-JennyNeural",
    "en-US-GuyNeural",
    "en-US-DavisNeural",
}


async def synthesize(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """用 Azure 神经语音把文本合成为 MP3；失败返回空字节。"""
    if not AZURE_KEY or not text.strip():
        return b""
    if voice not in ALLOWED_VOICES:
        voice = DEFAULT_VOICE
    ssml = (
        "<speak version='1.0' xml:lang='en-US'>"
        f"<voice name='{voice}'>{escape(text)}</voice></speak>"
    )
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ai-english-coach",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(TTS_URL, content=ssml.encode("utf-8"), headers=headers)
            if resp.status_code == 200:
                return resp.content
    except Exception:
        pass
    return b""
