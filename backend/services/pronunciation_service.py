import base64
import json
import os
import httpx

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")


async def assess_pronunciation(
    audio_bytes: bytes,
    content_type: str = "audio/webm;codecs=opus",
) -> dict:
    """
    调用 Azure Speech REST API 评估发音。
    audio_bytes: 浏览器 MediaRecorder 录制的音频（webm/opus 格式）
    返回: 总分 + 逐词评分
    """
    if not AZURE_KEY:
        return _fallback()

    url = (
        f"https://{AZURE_REGION}.stt.speech.microsoft.com"
        "/speech/recognition/conversation/cognitiveservices/v1"
        "?language=en-US&format=detailed"
    )

    # Pronunciation Assessment 配置（空 ReferenceText = 评测实际说出的词）
    pa_config = {
        "ReferenceText": "",
        "GradingSystem": "HundredMark",
        "Granularity": "Word",
        "EnableMiscue": False,
    }
    pa_header = base64.b64encode(json.dumps(pa_config).encode()).decode()

    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": content_type,
        "Pronunciation-Assessment": pa_header,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, content=audio_bytes, headers=headers)
            if resp.status_code != 200:
                return _fallback(f"azure_{resp.status_code}: {resp.text[:200]}")
            data = resp.json()
    except Exception as e:
        return _fallback(str(e)[:200])

    # 解析结果
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
        "transcript": nbest.get("Lexical", ""),
    }


def _fallback(error: str = "") -> dict:
    return {
        "overall": {"accuracy": 0, "fluency": 0, "completeness": 0, "pron_score": 0},
        "words": [],
        "transcript": "",
        "error": error,
    }
