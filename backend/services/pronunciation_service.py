import asyncio
import base64
import json
import os
import re
import httpx
from openai import AsyncOpenAI

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
STT_URL = (
    f"https://{AZURE_REGION}.stt.speech.microsoft.com"
    "/speech/recognition/conversation/cognitiveservices/v1"
    "?language=en-US&format=detailed"
)


async def assess_pronunciation(
    audio_bytes: bytes,
    content_type: str = "audio/wav",
    duration_ms: int = 0,
) -> dict:
    if not AZURE_KEY:
        return _fallback("no_azure_key")

    transcript = await _get_transcript(audio_bytes, content_type)
    if not transcript:
        return _fallback("no_transcript_detected")

    word_count = len(transcript.split())

    # Run Azure scoring and DeepSeek expression eval in parallel
    azure_result, expression = await asyncio.gather(
        _score_with_reference(audio_bytes, content_type, transcript),
        _expression_score(transcript),
    )

    fluency = _fluency_from_wpm(word_count, duration_ms)

    azure_result["overall"]["fluency"] = fluency
    azure_result["overall"]["expression"] = expression["score"]
    azure_result["expression_comment"] = expression["comment"]
    return azure_result


async def transcribe_only(audio_bytes: bytes, content_type: str = "audio/wav") -> str:
    """对话快速通道：仅转写，不评分、不计额度，降低对话延迟。"""
    if not AZURE_KEY:
        return ""
    return await _get_transcript(audio_bytes, content_type)


async def assess_shadowing(audio_bytes: bytes, content_type: str, reference_text: str) -> dict:
    """影子跟读：目标句已知，直接按 ReferenceText 评分（无需先转写）。"""
    if not AZURE_KEY:
        return _fallback("no_azure_key")
    if not reference_text or not reference_text.strip():
        return _fallback("no_reference")
    return await _score_with_reference(audio_bytes, content_type, reference_text.strip())


async def _get_transcript(audio_bytes: bytes, content_type: str) -> str:
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": content_type,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(STT_URL, content=audio_bytes, headers=headers)
            if resp.status_code != 200:
                return ""
            data = resp.json()
            if data.get("RecognitionStatus") != "Success":
                return ""
            nbest = data.get("NBest", [{}])[0]
            return nbest.get("Lexical", "").strip()
    except Exception:
        return ""


async def _score_with_reference(
    audio_bytes: bytes, content_type: str, reference_text: str
) -> dict:
    pa_config = {
        "ReferenceText": reference_text,
        "GradingSystem": "HundredMark",
        "Granularity": "Word",
        "EnableMiscue": True,
    }
    pa_header = base64.b64encode(json.dumps(pa_config).encode()).decode()
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": content_type,
        "Pronunciation-Assessment": pa_header,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(STT_URL, content=audio_bytes, headers=headers)
            if resp.status_code != 200:
                return _fallback(f"score_azure_{resp.status_code}")
            data = resp.json()
            if data.get("RecognitionStatus") != "Success":
                return _fallback(f"score_status={data.get('RecognitionStatus')}")
    except Exception as e:
        return _fallback(str(e)[:200])

    nbest = data.get("NBest", [{}])[0]
    words_raw = nbest.get("Words", [])

    words = [
        {
            "word": w.get("Word", ""),
            "accuracy": round(w.get("AccuracyScore", 0), 1),
            "error_type": "None" if w.get("AccuracyScore", 100) >= 60 else "Mispronunciation",
        }
        for w in words_raw
    ]

    word_scores = [w["accuracy"] for w in words]
    avg_acc = round(sum(word_scores) / len(word_scores), 1) if word_scores else 0
    nbest_acc = round(nbest.get("AccuracyScore", avg_acc), 1)

    return {
        "overall": {
            "accuracy": nbest_acc,
            "fluency": 0,       # filled in by caller
            "expression": 0,    # filled in by caller
        },
        "words": words,
        "transcript": reference_text,
    }


def _fluency_from_wpm(word_count: int, duration_ms: int) -> float:
    if duration_ms < 500 or word_count == 0:
        return 0
    wpm = word_count / (duration_ms / 60000)
    # Ideal range for English conversation: 110-170 WPM
    if wpm < 40:
        score = 20
    elif wpm < 90:
        score = 20 + (wpm - 40) / 50 * 40       # 20→60
    elif wpm < 140:
        score = 60 + (wpm - 90) / 50 * 30       # 60→90
    elif wpm <= 190:
        score = 90 + (wpm - 140) / 50 * 10      # 90→100
    elif wpm <= 250:
        score = 100 - (wpm - 190) / 60 * 25     # 100→75
    else:
        score = max(40, 75 - (wpm - 250) / 50 * 35)
    return round(min(100, max(0, score)), 1)


async def _expression_score(transcript: str) -> dict:
    try:
        client = AsyncOpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com",
        )
        prompt = (
            'You are an American English speaking coach. Judge how NATURAL and IDIOMATIC '
            'this SPOKEN sentence sounds, like a native American speaker in everyday conversation.\n'
            f'Spoken text: "{transcript}"\n\n'
            'Scoring principles (IMPORTANT):\n'
            '- Spoken English is NOT a written essay. Do NOT reward fancy or advanced vocabulary.\n'
            '- Reward natural, idiomatic, everyday American phrasing. Simple but native-sounding = HIGH score.\n'
            '- Penalize ONLY awkward phrasing, Chinglish, or wording a native speaker would not use.\n'
            'Score: 90-100 fully native; 75-89 mostly natural; 60-74 understandable but stiff/non-native; '
            'below 60 unnatural or Chinglish.\n\n'
            'Reply ONLY with JSON: {"score": <int 0-100>, "comment": "<中文建议>"}\n'
            'comment 必须具体：明确指出把哪个词或句子改成什么更地道（用箭头，例如 把 X 改成 Y）。'
            '注意是更地道、更像美国人日常说法，不是更高级的词汇。若已经很地道就简短肯定。50字以内。'
        )
        resp = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=160,
            temperature=0.3,
        )
        text = resp.choices[0].message.content.strip()
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            data = json.loads(m.group())
            return {"score": int(data.get("score", 0)), "comment": str(data.get("comment", ""))}
    except Exception:
        pass
    return {"score": 0, "comment": ""}


def _fallback(error: str = "") -> dict:
    return {
        "overall": {"accuracy": 0, "fluency": 0, "expression": 0},
        "words": [],
        "transcript": "",
        "error": error,
    }
