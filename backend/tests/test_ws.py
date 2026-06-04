# tests/test_ws.py | qa | v1.0
# TASK-016: WebSocket 集成测试
# 依赖 conftest.py 在 import 前设置好 DATABASE_URL 环境变量
# 外部 API（ASR / LLM / TTS）全部 mock，不需要真实网络或麦克风
import io
import struct
import wave
from unittest.mock import AsyncMock, patch

from starlette.testclient import TestClient

from main import app

client = TestClient(app)

MOCK_CORRECTION = {
    "has_error": True,
    "original": "I goes to school",
    "corrected": "I go to school",
    "explanation": "Subject-verb agreement: use 'go' with first-person singular 'I'.",
    "error_type": "grammar",
}


def _make_silent_wav(duration_secs: int = 1, sample_rate: int = 44100) -> bytes:
    """Generate a silent WAV (1 s, 44100 Hz, mono, 16-bit) without hardware."""
    num_samples = sample_rate * duration_secs
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack("<" + "h" * num_samples, *([0] * num_samples)))
    return buf.getvalue()


def test_websocket_response_fields():
    # Step 1: create a valid session via HTTP
    create_resp = client.post("/api/session/create", json={"scene": "interview"})
    assert create_resp.status_code == 200
    session_id = create_resp.json()["session_id"]

    # Step 2: mock all external service calls so no real APIs are hit
    with (
        patch(
            "routers.ws.transcribe_audio",
            new=AsyncMock(return_value="Hello, I am here for a job interview"),
        ),
        patch(
            "routers.ws.evaluate_correction",
            new=AsyncMock(return_value=MOCK_CORRECTION),
        ),
        patch(
            "routers.ws.get_ai_response",
            new=AsyncMock(return_value="Great! Could you tell me about your strengths?"),
        ),
        patch(
            "routers.ws.text_to_speech",
            new=AsyncMock(return_value=b"\xff\xfb" + b"\x00" * 100),
        ),
    ):
        with client.websocket_connect(f"/ws/{session_id}") as ws:
            ws.send_bytes(_make_silent_wav())
            data = ws.receive_json()

    # Step 3: verify top-level response fields
    assert data["type"] == "response"
    assert "user_text" in data
    assert "ai_text" in data
    assert "audio_base64" in data
    assert "turn_id" in data
    assert "correction" in data

    # Step 4: verify correction sub-object fields
    correction = data["correction"]
    assert "has_error" in correction
    assert "original" in correction
    assert "corrected" in correction
    assert "explanation" in correction
