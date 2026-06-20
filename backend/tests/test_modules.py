# tests/test_modules.py | qa | v1.0
# 模块/阶段后端测试：track x module x stage 解锁逻辑 + 脚本生成 + 题目上传
import asyncio
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient, ASGITransport

from main import app

MOCK_UID = "test_clerk_user_modules"


def _run(coro):
    return asyncio.run(coro)


def _auth_patch():
    return patch("routers.modules.get_clerk_user_id", new=AsyncMock(return_value=MOCK_UID))


def test_modules_requires_auth():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.get("/api/modules", params={"track": "sde"})
            assert resp.status_code == 401
        return resp
    _run(_())


def test_modules_list_initial_state():
    async def _():
        with _auth_patch():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                resp = await c.get("/api/modules", params={"track": "sde"}, headers={"Authorization": "Bearer x"})
                assert resp.status_code == 200
                data = resp.json()
                assert data["track"] == "sde"
                modules = {m["module"]: m["stages"] for m in data["modules"]}
                assert modules["self_intro"][0]["status"] == "in_progress"
                assert modules["resume_deep_dive"][0]["status"] == "locked"
                assert modules["debug"][-1]["status"] == "locked"
        return resp
    _run(_())


def test_modules_advance_unlocks_next_stage_and_module():
    async def _():
        with _auth_patch():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                # complete self_intro/learn (its only stage) -> should unlock resume_deep_dive/learn
                resp = await c.post(
                    "/api/modules/advance",
                    json={"track": "ds", "module": "self_intro", "stage": "learn"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["unlocked"] == {"module": "resume_deep_dive", "stage": "learn"}

                # advancing a still-locked stage should 403
                resp2 = await c.post(
                    "/api/modules/advance",
                    json={"track": "ds", "module": "behavioral", "stage": "learn"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp2.status_code == 403
        return resp
    _run(_())


def test_modules_script_self_intro_generates_and_caches():
    async def _():
        with _auth_patch(), patch(
            "routers.modules.generate_self_intro_script", new=AsyncMock(return_value="Hi, I'm a mock script.")
        ) as mock_gen:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                resp = await c.post(
                    "/api/modules/script",
                    json={"track": "sde", "module": "self_intro"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["content_type"] == "script"
                assert data["content"] == "Hi, I'm a mock script."

                # second call should hit the cache, not call the LLM again
                resp2 = await c.post(
                    "/api/modules/script",
                    json={"track": "sde", "module": "self_intro"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp2.status_code == 200
                assert resp2.json()["content"] == "Hi, I'm a mock script."
                assert mock_gen.call_count == 1
        return resp
    _run(_())


def test_modules_behavioral_returns_static_marker():
    async def _():
        with _auth_patch():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                # unlock through to behavioral/learn
                await c.post("/api/modules/advance", json={"track": "sde", "module": "self_intro", "stage": "learn"}, headers={"Authorization": "Bearer x"})
                await c.post("/api/modules/advance", json={"track": "sde", "module": "resume_deep_dive", "stage": "learn"}, headers={"Authorization": "Bearer x"})
                await c.post("/api/modules/advance", json={"track": "sde", "module": "resume_deep_dive", "stage": "master"}, headers={"Authorization": "Bearer x"})

                resp = await c.post(
                    "/api/modules/script",
                    json={"track": "sde", "module": "behavioral"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp.status_code == 200
                assert resp.json()["content_type"] == "static_question_bank"
        return resp
    _run(_())


def test_modules_problem_backed_script_requires_problem_first():
    async def _():
        with _auth_patch():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                for module, stage in [
                    ("self_intro", "learn"),
                    ("resume_deep_dive", "learn"), ("resume_deep_dive", "master"),
                    ("behavioral", "learn"), ("behavioral", "master"),
                ]:
                    await c.post("/api/modules/advance", json={"track": "ds", "module": module, "stage": stage}, headers={"Authorization": "Bearer x"})

                # technical_explain/learn should now be in_progress, but no problem submitted yet
                resp = await c.post(
                    "/api/modules/script",
                    json={"track": "ds", "module": "technical_explain"},
                    headers={"Authorization": "Bearer x"},
                )
                assert resp.status_code == 400

                # submit a problem, then script generation should succeed
                prob_resp = await c.post(
                    "/api/modules/problem",
                    json={"track": "ds", "module": "technical_explain", "title": "Find top 3 customers by revenue", "description": "Given orders table..."},
                    headers={"Authorization": "Bearer x"},
                )
                assert prob_resp.status_code == 200
                assert prob_resp.json()["ok"] is True

                with patch("routers.modules.generate_explanation_script", new=AsyncMock(return_value="mock walkthrough")):
                    resp2 = await c.post(
                        "/api/modules/script",
                        json={"track": "ds", "module": "technical_explain"},
                        headers={"Authorization": "Bearer x"},
                    )
                    assert resp2.status_code == 200
                    assert resp2.json()["content"] == "mock walkthrough"
        return resp
    _run(_())


def test_modules_scene_mapping():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.get("/api/modules/scene", params={"track": "sde", "module": "behavioral", "stage": "master"})
            assert resp.status_code == 200
            assert resp.json()["scene"] == "sde_behavioral"

            resp2 = await c.get("/api/modules/scene", params={"track": "ds", "module": "debug", "stage": "apply"})
            assert resp2.status_code == 200
            assert resp2.json()["scene"] == "ds_debug"
        return resp
    _run(_())


def test_session_create_accepts_new_module_scenes():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.post("/api/session/create", json={"scene": "ds_technical_explain", "problem_context": "Find top customers"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["scene"] == "ds_technical_explain"
            assert data["problem_context"] == "Find top customers"
        return resp
    _run(_())


def test_resumes_crud_and_active_selection():
    async def _():
        with _auth_patch():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
                headers = {"Authorization": "Bearer x"}

                # no resumes yet
                empty = await c.get("/api/modules/resumes", headers=headers)
                assert empty.status_code == 200
                assert empty.json()["resumes"] == []
                assert empty.json()["active_resume_id"] is None

                # upload first resume -> auto-becomes active
                r1 = await c.post("/api/modules/resumes", json={"label": "SDE Resume", "resume_text": "Built things with Python."}, headers=headers)
                assert r1.status_code == 200
                id1 = r1.json()["id"]

                listing = await c.get("/api/modules/resumes", headers=headers)
                assert listing.json()["active_resume_id"] == id1
                assert len(listing.json()["resumes"]) == 1

                # profile should now resolve resume_text from the active resume
                profile = await c.get("/api/modules/profile", headers=headers)
                assert profile.json()["resume_text"] == "Built things with Python."
                assert profile.json()["active_resume_id"] == id1

                # upload second resume -> becomes the new active one
                r2 = await c.post("/api/modules/resumes", json={"label": "DS Resume", "resume_text": "Did data science things."}, headers=headers)
                id2 = r2.json()["id"]
                profile2 = await c.get("/api/modules/profile", headers=headers)
                assert profile2.json()["resume_text"] == "Did data science things."

                # switch active back to the first resume
                switch = await c.post("/api/modules/resumes/active", json={"resume_id": id1}, headers=headers)
                assert switch.status_code == 200
                profile3 = await c.get("/api/modules/profile", headers=headers)
                assert profile3.json()["resume_text"] == "Built things with Python."

                # delete the active resume -> falls back gracefully (no crash)
                deleted = await c.delete(f"/api/modules/resumes/{id1}", headers=headers)
                assert deleted.status_code == 200
                listing2 = await c.get("/api/modules/resumes", headers=headers)
                assert len(listing2.json()["resumes"]) == 1
                assert listing2.json()["resumes"][0]["id"] == id2
        return r1
    _run(_())


def test_resumes_require_auth():
    async def _():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.get("/api/modules/resumes")
            assert resp.status_code == 401
        return resp
    _run(_())
