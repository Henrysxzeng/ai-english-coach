# services/asr_service.py | backend | v1.0
import io
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe WAV audio bytes to English text via OpenAI Whisper."""
    if not audio_bytes:
        raise ValueError("Audio bytes are empty")

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.wav"

    try:
        result = await _client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        text = result.text.strip()
        if not text:
            raise ValueError("ASR returned empty transcript")
        return text
    except Exception as e:
        raise ValueError(f"ASR transcription failed: {e}") from e
