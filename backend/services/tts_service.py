# services/tts_service.py | backend | v1.0
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def text_to_speech(text: str) -> bytes:
    """Convert text to MP3 audio bytes via OpenAI TTS."""
    if not text:
        raise ValueError("Text is empty")

    try:
        response = await _client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text,
            response_format="mp3",
        )
        return response.content
    except Exception as e:
        raise ValueError(f"TTS synthesis failed: {e}") from e
