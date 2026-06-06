import base64
import json
import os
import httpx

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
) -> dict:
    if not AZURE_KEY:
        return _fallback("no_azure_key")

    # Step 1: get transcript (no pronunciation header → Azure returns real words)
    transcript = await _get_transcript(audio_bytes, content_type)
    if not transcript:
        return _fallback("no_transcript_detected")

    # Step 2: score pronunciation using transcript as ReferenceText
    return await _score_with_reference(audio_bytes, content_type, transcript)


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
    pa = nbest.get("PronunciationAssessment", {})
    words_raw = nbest.get("Words", [])

    words = [
        {
            "word": w.get("Word", ""),
            "accuracy": round(w.get("PronunciationAssessment", {}).get("AccuracyScore", 0), 1),
            "error_type": w.get("PronunciationAssessment", {}).get("ErrorType", "None"),
        }
        for w in words_raw
    ]

    return {
        "overall": {
            "accuracy": round(pa.get("AccuracyScore", 0), 1),
            "fluency": round(pa.get("FluencyScore", 0), 1),
            "completeness": round(pa.get("CompletenessScore", 100), 1),
            "pron_score": round(pa.get("PronScore", 0), 1),
        },
        "words": words,
        "transcript": reference_text,
        "_debug": {
            "nbest_keys": list(nbest.keys()),
            "pa_raw": pa,
            "word0_keys": list(words_raw[0].keys()) if words_raw else [],
            "word0_raw": words_raw[0] if words_raw else {},
        },
    }


def _fallback(error: str = "") -> dict:
    return {
        "overall": {"accuracy": 0, "fluency": 0, "completeness": 0, "pron_score": 0},
        "words": [],
        "transcript": "",
        "error": error,
    }
