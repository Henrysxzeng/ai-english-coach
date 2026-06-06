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
            f'Rate this English spoken response on Expression (vocabulary richness + naturalness).\n'
            f'Transcript: "{transcript}"\n'
            f'Reply ONLY with valid JSON: {{"score": <0-100 integer>, "comment": "<one short encouraging tip in Chinese, max 20 chars>"}}\n'
            f'Scoring: 90-100=excellent varied & natural; 70-89=good; 50-69=basic but clear; <50=very simple/unnatural.'
        )
        resp = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=80,
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
