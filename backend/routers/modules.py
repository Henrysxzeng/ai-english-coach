# routers/modules.py | backend | v1.0
# 北美秋招口语训练模块：按 track(sde/ds) x module x stage 顺序解锁。
# stage 含义： learn(背稿/背语料) -> apply(脱稿+自选题目) -> master(脱稿+AI出题/简历驱动)
from __future__ import annotations
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
import models.pg as aiosqlite
from models.db import DB_PATH
from utils.auth import get_clerk_user_id
from schemas.api_schemas import (
    ModuleProfileUpdate,
    ModuleScriptRequest,
    ModuleScriptSave,
    ModuleProblemCreate,
    ModuleAdvanceRequest,
    UserResumeCreate,
    SetActiveResume,
)
from services.llm_service import (
    generate_self_intro_script,
    generate_resume_corpus,
    generate_behavioral_corpus,
    generate_explanation_script,
)

router = APIRouter(prefix="/api/modules", tags=["modules"])

TRACKS = ("sde", "ds", "pm", "proj")

MODULE_ORDER = ["self_intro", "resume_deep_dive", "behavioral", "technical_explain", "system_design", "debug"]

MODULE_STAGES = {
    "self_intro": ["learn"],
    "resume_deep_dive": ["learn", "master"],
    "behavioral": ["learn", "master"],
    "technical_explain": ["learn", "apply", "master"],
    "system_design": ["learn", "apply", "master"],
    "debug": ["learn", "apply", "master"],
}

# 哪些模块的 learn 阶段需要一道用户自选/已上传的题目作为讲解对象
PROBLEM_BACKED_MODULES = {"technical_explain", "system_design", "debug"}

# (track, module, stage) -> 复用/新增的 llm_service.SCENE_PROMPTS 场景 key（仅 apply/master 用，learn 阶段不进行实时对话）
MODULE_SCENE_MAP = {
    ("sde", "resume_deep_dive", "master"): "sde_project",
    ("sde", "behavioral", "master"): "sde_behavioral",
    ("sde", "technical_explain", "apply"): "sde_technical_explain",
    ("sde", "technical_explain", "master"): "sde_technical_explain",
    ("sde", "system_design", "apply"): "sde_thinking",
    ("sde", "system_design", "master"): "sde_thinking",
    ("sde", "debug", "apply"): "sde_debug",
    ("sde", "debug", "master"): "sde_debug",
    ("ds", "resume_deep_dive", "master"): "ds_resume_deep_dive",
    ("ds", "behavioral", "master"): "ds_behavioral",
    ("ds", "technical_explain", "apply"): "ds_technical_explain",
    ("ds", "technical_explain", "master"): "ds_technical_explain",
    ("ds", "system_design", "apply"): "ds_system_design",
    ("ds", "system_design", "master"): "ds_system_design",
    ("ds", "debug", "apply"): "ds_debug",
    ("ds", "debug", "master"): "ds_debug",
    ("pm", "resume_deep_dive", "master"): "pm_resume_deep_dive",
    ("pm", "behavioral", "master"): "pm_behavioral",
    ("pm", "technical_explain", "apply"): "pm_product_sense",
    ("pm", "technical_explain", "master"): "pm_product_sense",
    ("pm", "system_design", "apply"): "pm_metrics_execution",
    ("pm", "system_design", "master"): "pm_metrics_execution",
    ("pm", "debug", "apply"): "pm_estimation_strategy",
    ("pm", "debug", "master"): "pm_estimation_strategy",
    ("proj", "resume_deep_dive", "master"): "proj_project_debrief",
    ("proj", "behavioral", "master"): "proj_behavioral",
    ("proj", "technical_explain", "apply"): "proj_client_comm",
    ("proj", "technical_explain", "master"): "proj_client_comm",
    ("proj", "system_design", "apply"): "proj_situational",
    ("proj", "system_design", "master"): "proj_situational",
    ("proj", "debug", "apply"): "proj_planning",
    ("proj", "debug", "master"): "proj_planning",
}


async def _require_user(request: Request) -> str:
    clerk_uid = await get_clerk_user_id(request.headers.get("Authorization"))
    if not clerk_uid:
        raise HTTPException(status_code=401, detail="Login required to use practice modules")
    return clerk_uid


def _validate_track(track: str):
    if track not in TRACKS:
        raise HTTPException(status_code=400, detail=f"Invalid track. Choose: {TRACKS}")


def _validate_track_module_stage(track: str, module: str, stage: str | None = None):
    _validate_track(track)
    if module not in MODULE_ORDER:
        raise HTTPException(status_code=400, detail=f"Invalid module. Choose: {MODULE_ORDER}")
    if stage is not None and stage not in MODULE_STAGES[module]:
        raise HTTPException(status_code=400, detail=f"Invalid stage for {module}. Choose: {MODULE_STAGES[module]}")


async def _ensure_initialized(db, clerk_uid: str, track: str):
    """首次访问某 track 时，为该用户初始化全部 module_progress 行（幂等）。"""
    for i, module in enumerate(MODULE_ORDER):
        for j, stage in enumerate(MODULE_STAGES[module]):
            status = "in_progress" if (i == 0 and j == 0) else "locked"
            await db.execute(
                """INSERT INTO module_progress (clerk_user_id, track, module, stage, status)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT (clerk_user_id, track, module, stage) DO NOTHING""",
                (clerk_uid, track, module, stage, status),
            )
    await db.commit()


@router.get("")
async def get_modules(request: Request, track: str = "sde"):
    clerk_uid = await _require_user(request)
    _validate_track(track)

    async with aiosqlite.connect(DB_PATH) as db:
        await _ensure_initialized(db, clerk_uid, track)
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT module, stage, status, completed_at FROM module_progress WHERE clerk_user_id = ? AND track = ?",
            (clerk_uid, track),
        )
        rows = [dict(r) for r in await cursor.fetchall()]

    by_module: dict[str, dict] = {}
    for row in rows:
        by_module.setdefault(row["module"], {})[row["stage"]] = row

    modules_out = []
    for module in MODULE_ORDER:
        stages_out = []
        for stage in MODULE_STAGES[module]:
            row = by_module.get(module, {}).get(stage, {"status": "locked", "completed_at": None})
            stages_out.append({"stage": stage, "status": row["status"], "completed_at": row["completed_at"]})
        modules_out.append({"module": module, "stages": stages_out})

    return {"track": track, "modules": modules_out}


@router.post("/profile")
async def update_profile(request: Request, data: ModuleProfileUpdate):
    clerk_uid = await _require_user(request)
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO user_profiles (clerk_user_id, resume_text, jd_text, track_focus, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (clerk_user_id) DO UPDATE SET
                   resume_text = excluded.resume_text,
                   jd_text = excluded.jd_text,
                   track_focus = excluded.track_focus,
                   updated_at = excluded.updated_at""",
            (clerk_uid, data.resume_text, data.jd_text, data.track_focus, now),
        )
        await db.commit()
    return {"ok": True}


async def _get_active_resume_text(db, clerk_uid: str, track: str) -> tuple[str, int | None]:
    """简历按 track 各自独立：先看这个 track 有没有显式选中的简历，没有就用这个 track 最新上传的那份。"""
    cursor = await db.execute(
        "SELECT resume_id FROM user_active_resume WHERE clerk_user_id = ? AND track = ?",
        (clerk_uid, track),
    )
    active_row = await cursor.fetchone()
    active_resume_id = active_row["resume_id"] if active_row else None

    if active_resume_id is not None:
        cursor = await db.execute(
            "SELECT id, resume_text FROM user_resumes WHERE clerk_user_id = ? AND id = ? AND track = ?",
            (clerk_uid, active_resume_id, track),
        )
    else:
        cursor = await db.execute(
            "SELECT id, resume_text FROM user_resumes WHERE clerk_user_id = ? AND track = ? ORDER BY id DESC LIMIT 1",
            (clerk_uid, track),
        )
    resume_row = await cursor.fetchone()
    if resume_row:
        return resume_row["resume_text"], resume_row["id"]
    return "", None


@router.get("/profile")
async def get_profile(request: Request, track: str = "sde"):
    clerk_uid = await _require_user(request)
    _validate_track(track)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT jd_text, track_focus FROM user_profiles WHERE clerk_user_id = ?",
            (clerk_uid,),
        )
        row = await cursor.fetchone()
        resume_text, active_resume_id = await _get_active_resume_text(db, clerk_uid, track)

    return {
        "resume_text": resume_text,
        "active_resume_id": active_resume_id,
        "jd_text": row["jd_text"] if row else "",
        "track_focus": row["track_focus"] if row else "sde",
    }


@router.get("/resumes")
async def list_resumes(request: Request, track: str = "sde"):
    clerk_uid = await _require_user(request)
    _validate_track(track)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, label, created_at FROM user_resumes WHERE clerk_user_id = ? AND track = ? ORDER BY id DESC",
            (clerk_uid, track),
        )
        resumes = [dict(r) for r in await cursor.fetchall()]
        cursor = await db.execute(
            "SELECT resume_id FROM user_active_resume WHERE clerk_user_id = ? AND track = ?",
            (clerk_uid, track),
        )
        active_row = await cursor.fetchone()
    active_id = active_row["resume_id"] if active_row else None
    if active_id is None and resumes:
        active_id = resumes[0]["id"]
    return {"resumes": resumes, "active_resume_id": active_id}


@router.post("/resumes")
async def create_resume(request: Request, data: UserResumeCreate):
    clerk_uid = await _require_user(request)
    _validate_track(data.track)
    if not data.label.strip() or not data.resume_text.strip():
        raise HTTPException(status_code=400, detail="label and resume_text are required")
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO user_resumes (clerk_user_id, track, label, resume_text, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
            (clerk_uid, data.track, data.label.strip(), data.resume_text.strip(), now),
        )
        row = await cursor.fetchone()
        new_id = row[0] if row else None
        # 新上传的简历自动设为这个 track 当前训练使用的简历
        await db.execute(
            """INSERT INTO user_active_resume (clerk_user_id, track, resume_id)
               VALUES (?, ?, ?)
               ON CONFLICT (clerk_user_id, track) DO UPDATE SET resume_id = excluded.resume_id""",
            (clerk_uid, data.track, new_id),
        )
        await db.commit()
    return {"ok": True, "id": new_id}


@router.post("/resumes/active")
async def set_active_resume(request: Request, data: SetActiveResume):
    clerk_uid = await _require_user(request)
    _validate_track(data.track)
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT id FROM user_resumes WHERE id = ? AND clerk_user_id = ? AND track = ?",
            (data.resume_id, clerk_uid, data.track),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Resume not found")
        await db.execute(
            """INSERT INTO user_active_resume (clerk_user_id, track, resume_id)
               VALUES (?, ?, ?)
               ON CONFLICT (clerk_user_id, track) DO UPDATE SET resume_id = excluded.resume_id""",
            (clerk_uid, data.track, data.resume_id),
        )
        await db.commit()
    return {"ok": True}


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: int, request: Request):
    clerk_uid = await _require_user(request)
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM user_resumes WHERE id = ? AND clerk_user_id = ? RETURNING id",
            (resume_id, clerk_uid),
        )
        deleted = await cursor.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail="Resume not found")
        await db.execute(
            "DELETE FROM user_active_resume WHERE clerk_user_id = ? AND resume_id = ?",
            (clerk_uid, resume_id),
        )
        await db.commit()
    return {"ok": True}


@router.get("/problem/latest")
async def get_latest_problem(request: Request, track: str, module: str):
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(track, module)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """SELECT id, title, description, created_at FROM user_problems
               WHERE clerk_user_id = ? AND track = ? AND module = ?
               ORDER BY id DESC LIMIT 1""",
            (clerk_uid, track, module),
        )
        row = await cursor.fetchone()
    return dict(row) if row else None


@router.post("/problem")
async def create_problem(request: Request, data: ModuleProblemCreate):
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(data.track, data.module)
    if data.module not in PROBLEM_BACKED_MODULES:
        raise HTTPException(status_code=400, detail=f"{data.module} does not take an uploaded problem")
    if not data.title.strip():
        raise HTTPException(status_code=400, detail="title is required")

    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO user_problems (clerk_user_id, track, module, title, description, created_at)
               VALUES (?, ?, ?, ?, ?, ?) RETURNING id""",
            (clerk_uid, data.track, data.module, data.title.strip(), data.description, now),
        )
        row = await cursor.fetchone()
        await db.commit()
    return {"ok": True, "problem_id": row[0] if row else None}


@router.get("/script")
async def get_cached_script(request: Request, track: str, module: str):
    """读取已缓存的稿子，不存在则返回 null（不触发 LLM 生成）。"""
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(track, module)
    async with aiosqlite.connect(DB_PATH) as db:
        await _ensure_initialized(db, clerk_uid, track)
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT content FROM study_materials WHERE clerk_user_id = ? AND track = ? AND module = ?",
            (clerk_uid, track, module),
        )
        cached = await cursor.fetchone()
    if not cached:
        return None
    return _format_script_response(module, cached["content"])


@router.post("/script")
async def get_or_generate_script(request: Request, data: ModuleScriptRequest):
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(data.track, data.module, "learn")

    async with aiosqlite.connect(DB_PATH) as db:
        await _ensure_initialized(db, clerk_uid, data.track)
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT status FROM module_progress WHERE clerk_user_id = ? AND track = ? AND module = ? AND stage = 'learn'",
            (clerk_uid, data.track, data.module),
        )
        progress = await cursor.fetchone()
        if not progress or progress["status"] == "locked":
            raise HTTPException(status_code=403, detail="This module is still locked")

        if not data.regenerate:
            cursor = await db.execute(
                "SELECT content FROM study_materials WHERE clerk_user_id = ? AND track = ? AND module = ?",
                (clerk_uid, data.track, data.module),
            )
            cached = await cursor.fetchone()
            if cached:
                return _format_script_response(data.module, cached["content"])

        resume_text, _ = await _get_active_resume_text(db, clerk_uid, data.track)

    if data.module == "behavioral" and data.track in ("sde", "ds"):
        # sde/ds 复用前端现成的题库(questions.ts)，不调用 LLM
        return {"module": data.module, "content_type": "static_question_bank", "content": None}

    if data.module == "behavioral":
        # 其他赛道(如 pm)没有现成题库，走 LLM 生成行为面试语料库
        corpus = await generate_behavioral_corpus(data.track)
        content_str = json.dumps(corpus, ensure_ascii=False)
    elif data.module == "self_intro":
        scripts = await generate_self_intro_script(resume_text, data.track)
        content_str = json.dumps(scripts, ensure_ascii=False)
    elif data.module == "resume_deep_dive":
        corpus = await generate_resume_corpus(resume_text, data.track)
        content_str = json.dumps(corpus, ensure_ascii=False)
    elif data.module in PROBLEM_BACKED_MODULES:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """SELECT title, description FROM user_problems
                   WHERE clerk_user_id = ? AND track = ? AND module = ?
                   ORDER BY id DESC LIMIT 1""",
                (clerk_uid, data.track, data.module),
            )
            problem = await cursor.fetchone()
        if not problem:
            raise HTTPException(status_code=400, detail="Submit a problem first via POST /api/modules/problem")
        problem_text = f"{problem['title']}\n{problem['description']}".strip()
        content_str = await generate_explanation_script(data.track, data.module, problem_text)
    else:
        raise HTTPException(status_code=400, detail="Unsupported module")

    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO study_materials (clerk_user_id, track, module, content, created_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (clerk_user_id, track, module) DO UPDATE SET
                   content = excluded.content, created_at = excluded.created_at""",
            (clerk_uid, data.track, data.module, content_str, now),
        )
        await db.commit()

    return _format_script_response(data.module, content_str)


@router.put("/script")
async def save_edited_script(request: Request, data: ModuleScriptSave):
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(data.track, data.module)
    if data.module != "self_intro":
        raise HTTPException(status_code=400, detail="Only self_intro scripts can be manually edited")
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="content cannot be empty")
    if data.version not in ("tech", "hr"):
        raise HTTPException(status_code=400, detail="version must be 'tech' or 'hr'")
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT content FROM study_materials WHERE clerk_user_id = ? AND track = ? AND module = ?",
            (clerk_uid, data.track, data.module),
        )
        row = await cursor.fetchone()
        try:
            existing = json.loads(row["content"]) if row else {}
            if not isinstance(existing, dict):
                existing = {"tech": existing, "hr": ""}
        except Exception:
            existing = {}
        existing[data.version] = data.content.strip()
        new_content = json.dumps(existing, ensure_ascii=False)
        await db.execute(
            """INSERT INTO study_materials (clerk_user_id, track, module, content, created_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (clerk_user_id, track, module) DO UPDATE SET
                   content = excluded.content, created_at = excluded.created_at""",
            (clerk_uid, data.track, data.module, new_content, now),
        )
        await db.commit()
    return {"ok": True}


def _format_script_response(module: str, content_str: str):
    if module == "self_intro":
        try:
            parsed = json.loads(content_str)
            if isinstance(parsed, dict) and ("tech" in parsed or "hr" in parsed):
                return {"module": module, "content_type": "self_intro_dual", "content": parsed}
        except Exception:
            pass
        return {"module": module, "content_type": "script", "content": content_str}
    if module in ("resume_deep_dive", "behavioral"):
        try:
            return {"module": module, "content_type": "corpus", "content": json.loads(content_str)}
        except Exception:
            return {"module": module, "content_type": "corpus", "content": []}
    return {"module": module, "content_type": "script", "content": content_str}


@router.post("/advance")
async def advance_stage(request: Request, data: ModuleAdvanceRequest):
    clerk_uid = await _require_user(request)
    _validate_track_module_stage(data.track, data.module, data.stage)

    now = datetime.now(timezone.utc).isoformat()
    stages = MODULE_STAGES[data.module]
    stage_idx = stages.index(data.stage)

    async with aiosqlite.connect(DB_PATH) as db:
        await _ensure_initialized(db, clerk_uid, data.track)
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT status FROM module_progress WHERE clerk_user_id = ? AND track = ? AND module = ? AND stage = ?",
            (clerk_uid, data.track, data.module, data.stage),
        )
        current = await cursor.fetchone()
        if not current or current["status"] == "locked":
            raise HTTPException(status_code=403, detail="This stage is still locked")

        await db.execute(
            "UPDATE module_progress SET status = 'completed', completed_at = ? WHERE clerk_user_id = ? AND track = ? AND module = ? AND stage = ?",
            (now, clerk_uid, data.track, data.module, data.stage),
        )

        unlocked = None
        if stage_idx + 1 < len(stages):
            next_stage = stages[stage_idx + 1]
            await db.execute(
                "UPDATE module_progress SET status = 'in_progress' WHERE clerk_user_id = ? AND track = ? AND module = ? AND stage = ? AND status = 'locked'",
                (clerk_uid, data.track, data.module, next_stage),
            )
            unlocked = {"module": data.module, "stage": next_stage}
        else:
            module_idx = MODULE_ORDER.index(data.module)
            if module_idx + 1 < len(MODULE_ORDER):
                next_module = MODULE_ORDER[module_idx + 1]
                next_module_first_stage = MODULE_STAGES[next_module][0]
                await db.execute(
                    "UPDATE module_progress SET status = 'in_progress' WHERE clerk_user_id = ? AND track = ? AND module = ? AND stage = ? AND status = 'locked'",
                    (clerk_uid, data.track, next_module, next_module_first_stage),
                )
                unlocked = {"module": next_module, "stage": next_module_first_stage}

        await db.commit()

    return {"ok": True, "completed": {"module": data.module, "stage": data.stage}, "unlocked": unlocked}


@router.get("/scene")
async def get_scene_for_stage(track: str, module: str, stage: str):
    """前端创建 apply/master 阶段的练习 session 前，查询对应的 scene key。"""
    _validate_track_module_stage(track, module, stage)
    if stage == "learn":
        raise HTTPException(status_code=400, detail="learn stage has no live conversation scene")
    scene = MODULE_SCENE_MAP.get((track, module, stage))
    if not scene:
        raise HTTPException(status_code=404, detail="No scene mapped for this combination")
    return {"scene": scene}
