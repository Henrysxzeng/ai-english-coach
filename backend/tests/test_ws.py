# tests/test_ws.py | qa | v2.0
# TASK-016: WebSocket 集成测试
# 依赖 conftest.py 在 import 前设置好 DATABASE_URL 环境变量
# ws.py v1.2：流式协议（stream_start → stream_chunk* → stream_end），需 mock
# get_ai_response_stream（async generator）+ evaluate_correction + evaluate_upgrade
from contextlib import ExitStack
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

MOCK_UPGRADE = {"has_suggestion": False, "better": "", "reason": "", "style_tags": []}

USER_MSG = {"type": "user_message", "text": "Hello, I am here for a job interview"}


async def _mock_stream(*args, **kwargs):
    for chunk in ["Great! ", "Tell me about your experience."]:
        yield chunk


def test_websocket_response_fields():
    # Step 1: create a valid session via HTTP
    create_resp = client.post("/api/session/create", json={"scene": "interview"})
    assert create_resp.status_code == 200
    session_id = create_resp.json()["session_id"]

    # Step 2: mock LLM services so no real API calls are made
    # Use ExitStack for Python 3.8 compatibility (parenthesized `with` requires 3.10+)
    with ExitStack() as stack:
        stack.enter_context(patch("routers.ws.evaluate_correction", new=AsyncMock(return_value=MOCK_CORRECTION)))
        stack.enter_context(patch("routers.ws.evaluate_upgrade", new=AsyncMock(return_value=MOCK_UPGRADE)))
        stack.enter_context(patch("routers.ws.get_ai_response_stream", new=_mock_stream))

        with client.websocket_connect(f"/ws/{session_id}") as ws:
            ws.send_json(USER_MSG)
            # Drain the stream until the final summary message.
            data = ws.receive_json()
            assert data["type"] == "stream_start"
            while data["type"] != "stream_end":
                data = ws.receive_json()

    # Step 3: verify top-level response fields on the final summary message
    assert data["type"] == "stream_end"
    assert data["ai_text"] == "Great! Tell me about your experience."
    assert "correction" in data
    assert "turn_id" in data

    # Step 4: verify correction sub-object fields
    correction = data["correction"]
    assert "has_error" in correction
    assert "original" in correction
    assert "corrected" in correction
    assert "explanation" in correction
