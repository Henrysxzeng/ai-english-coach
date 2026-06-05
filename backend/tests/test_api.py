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


# ── v2.0 新增测试用例 ────────────────────────────────────────────────────────


def test_create_session_with_difficulty():
    """测试创建 session 时传入 difficulty 参数"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.post("/api/session/create", json={"scene": "interview", "difficulty": "hard"})
            assert resp.status_code == 200
            data = resp.json()
            assert "session_id" in data
            assert data.get("difficulty") == "hard"
        return resp
    _run(_())


def test_create_session_hospital():
    """测试 hospital 场景创建"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.post("/api/session/create", json={"scene": "hospital"})
            assert resp.status_code == 200
            assert resp.json()["scene"] == "hospital"
        return resp
    _run(_())


def test_create_session_phone_call():
    """测试 phone_call 场景创建"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.post("/api/session/create", json={"scene": "phone_call"})
            assert resp.status_code == 200
        return resp
    _run(_())


def test_assessment_start():
    """测试口语测评开始接口"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.post("/api/assessment/start")
            assert resp.status_code == 200
            data = resp.json()
            assert "session_id" in data
        return resp
    _run(_())


def test_assessment_result_no_messages():
    """测试0轮对话时获取测评结果（不崩溃，返回默认值）"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            start = await c.post("/api/assessment/start")
            session_id = start.json()["session_id"]
            resp = await c.get(f"/api/assessment/{session_id}/result")
            assert resp.status_code == 200
            data = resp.json()
            assert "cefr_level" in data
            assert data["cefr_level"] in ("A2", "B1", "B2", "C1")
            assert "recommended_difficulty" in data
        return resp
    _run(_())


def test_report_includes_wpm_fields():
    """测试报告包含 wpm 相关字段"""
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            create_resp = await c.post("/api/session/create", json={"scene": "meeting"})
            session_id = create_resp.json()["session_id"]
            await c.post(f"/api/session/{session_id}/end")
            resp = await c.get(f"/api/report/{session_id}")
            assert resp.status_code == 200
            data = resp.json()
            assert "filler_count" in data
            assert "filler_words" in data
            assert isinstance(data["filler_count"], int)
        return resp
    _run(_())
