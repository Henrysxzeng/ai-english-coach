# tests/test_api.py | qa | v1.0
# TASK-015: Backend HTTP 接口测试
# 依赖 conftest.py 在 import 前设置好 DATABASE_URL 环境变量
import asyncio

from httpx import AsyncClient, ASGITransport

from main import app


def _run(coro):
    """Run an async coroutine in a fresh event loop."""
    return asyncio.run(coro)


def test_health():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            return await c.get("/health")

    resp = _run(_())
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_session_interview():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            return await c.post("/api/session/create", json={"scene": "interview"})

    resp = _run(_())
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert data["scene"] == "interview"
    assert "system_prompt" in data


def test_create_session_invalid():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            return await c.post("/api/session/create", json={"scene": "invalid"})

    resp = _run(_())
    assert resp.status_code == 400


def test_get_session():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            create_resp = await c.post("/api/session/create", json={"scene": "interview"})
            session_id = create_resp.json()["session_id"]
            return await c.get(f"/api/session/{session_id}")

    resp = _run(_())
    assert resp.status_code == 200
    data = resp.json()
    assert "messages" in data
    assert isinstance(data["messages"], list)
    assert len(data["messages"]) >= 1  # opener message is inserted on create


def test_end_session():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            create_resp = await c.post("/api/session/create", json={"scene": "restaurant"})
            session_id = create_resp.json()["session_id"]
            return await c.post(f"/api/session/{session_id}/end")

    resp = _run(_())
    assert resp.status_code == 200
    assert resp.json()["status"] == "ended"


def test_get_report_empty_session():
    """测试0轮对话的报告接口是否正常返回（不崩溃）"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            create_resp = await c.post("/api/session/create", json={"scene": "meeting"})
            session_id = create_resp.json()["session_id"]
            await c.post(f"/api/session/{session_id}/end")
            return await c.get(f"/api/report/{session_id}")

    resp = _run(_())
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data
    assert isinstance(data["overall_score"], (int, float))
