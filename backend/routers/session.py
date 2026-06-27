# routers/session.py | backend | v1.1
import os
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
import models.pg as aiosqlite
from dotenv import load_dotenv
from schemas.api_schemas import SessionCreate, SessionResponse

load_dotenv()

router = APIRouter(prefix="/api/session", tags=["session"])
DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")

SCENE_OPENERS = {
    "interview": "Hello! Welcome, please take a seat. To start, could you tell me a little about yourself and why you are interested in this position?",
    "restaurant": "Hi there, welcome to The Golden Fork! I will be your server today. Can I start you off with something to drink, or are you ready to order?",
    "meeting": "Good morning everyone, let us get started. Could you give me a quick status update on where things stand with the project this week?",
    "hospital": "Good morning! I'm Dr. Smith. Please take a seat. What brings you in today? Could you describe your main symptoms?",
    "phone_call": "Hello! Thank you for calling. How can I help you today?",
    "customer_service": "Thank you for calling customer support. My name is Alex. How can I assist you today?",
    "assessment": "Welcome to the speaking assessment! I'll ask you a few questions to understand your English level. Let's start: could you please tell me a bit about yourself and your English learning journey?",
    "sde_behavioral": "Welcome! Let's get started with some behavioral questions. Could you begin by telling me about yourself and what drew you to software engineering?",
    "sde_project": "Thanks for joining! I'd love to dive into your technical background. Could you walk me through a recent project you're most proud of — what it did and your role in it?",
    "sde_thinking": "Great, let's begin! I'll ask questions to explore your technical reasoning. First — can you explain the difference between a stack and a queue, and describe a scenario where you'd choose one over the other?",
    "sde_technical_explain": "Alright, let's go through this problem together. Why don't you start by restating it in your own words, and walk me through how you'd approach it?",
    "sde_debug": "Take a look at this code with me. Can you start by telling me what you'd check first?",
    "ds_resume_deep_dive": "Thanks for joining! I'd love to dive into your data science background. Could you walk me through a recent project you're most proud of — what it did and your role in it?",
    "ds_behavioral": "Welcome! Let's get started with some behavioral questions. Could you begin by telling me about yourself and what drew you to data science?",
    "ds_technical_explain": "Alright, let's go through this case together. Why don't you start by restating the question in your own words, and walk me through your approach?",
    "ds_system_design": "Let's talk through an experiment or pipeline design problem. Can you start by telling me what questions you'd ask before designing it?",
    "ds_debug": "Take a look at this issue with me. Can you start by telling me what you'd check first?",
    "pm_resume_deep_dive": "Thanks for joining! I'd love to dive into your product background. Could you walk me through a product or feature you're most proud of — the problem, your decisions, and the outcome?",
    "pm_behavioral": "Welcome! Let's get started with some behavioral questions. Could you begin by telling me about yourself and what drew you to product management?",
    "pm_product_sense": "Let's dive into a product sense question. Why don't you start by clarifying who the user is and what problem we're solving?",
    "pm_metrics_execution": "Let's talk through a metrics and execution scenario. Can you start by telling me what metrics you'd look at first?",
    "pm_estimation_strategy": "Let's work through an estimation problem together. Can you start by telling me what assumptions you'd make?",
    "self_intro_recall": "Alright, let's see if you've got it down. Go ahead — tell me about yourself!",
    "proj_project_debrief": "Thanks for joining! I'd love to hear about a project you were involved in. Could you walk me through your role, the scope, and the main challenges you faced?",
    "proj_behavioral": "Welcome! Let's get started with some behavioral questions. Could you begin by telling me about yourself and what drew you to project management and IT consulting?",
    "proj_client_comm": "Good afternoon! I'm the client for today's session. I'd like to hear how things are going with the project. Can you give me a quick status update?",
    "proj_situational": "I want to test how you handle pressure. Here's the situation: the project is two weeks behind schedule and the client just escalated. Walk me through what you'd do.",
    "proj_planning": "Let's talk about planning and process. Could you walk me through how you'd kick off a three-month IT consulting project from scratch?",
}

VALID_SCENES = set(SCENE_OPENERS.keys())


@router.post("/create", response_model=SessionResponse)
async def create_session(data: SessionCreate):
    if data.scene not in VALID_SCENES:
        raise HTTPException(status_code=400, detail=f"Invalid scene. Choose: {sorted(VALID_SCENES)}")

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    opener = SCENE_OPENERS[data.scene]
    difficulty = data.difficulty if data.difficulty in ("easy", "medium", "hard") else "medium"
    resume_context = data.resume_context or ""
    jd_context = data.jd_context or ""
    problem_context = data.problem_context or ""

    previous_analysis = None
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sessions (id, scene, status, created_at, difficulty, resume_context, jd_context, problem_context) VALUES (?, ?, 'active', ?, ?, ?, ?, ?)",
            (session_id, data.scene, now, difficulty, resume_context, jd_context, problem_context),
        )
        await db.execute(
            "INSERT INTO messages (session_id, role, content, turn_id, created_at) VALUES (?, 'assistant', ?, 0, ?)",
            (session_id, opener, now),
        )
        await db.commit()

        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT topic, weak_areas, ambiguous_expressions, clarity_score, structure_score, created_at
            FROM session_analyses
            WHERE scene = ?
            ORDER BY created_at DESC LIMIT 1
        """, (data.scene,))
        prev = await cursor.fetchone()
        if prev:
            previous_analysis = {
                "topic": prev["topic"],
                "weak_areas": json.loads(prev["weak_areas"] or "[]"),
                "ambiguous_expressions": json.loads(prev["ambiguous_expressions"] or "[]"),
                "clarity_score": prev["clarity_score"],
                "structure_score": prev["structure_score"],
                "session_date": prev["created_at"],
            }

    return SessionResponse(
        session_id=session_id,
        scene=data.scene,
        system_prompt=opener,
        created_at=now,
        difficulty=difficulty,
        resume_context=resume_context,
        jd_context=jd_context,
        problem_context=problem_context,
        previous_analysis=previous_analysis,
    )


@router.get("/{session_id}")
async def get_session(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        cursor = await db.execute(
            "SELECT role, content, turn_id, created_at FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [dict(m) for m in await cursor.fetchall()]

    return {
        "session_id": session_id,
        "scene": session["scene"],
        "status": session["status"],
        "difficulty": session["difficulty"],
        "resume_context": session["resume_context"] or "",
        "jd_context": session["jd_context"] or "",
        "problem_context": session["problem_context"] or "",
        "messages": messages,
        "created_at": session["created_at"],
    }


@router.post("/{session_id}/end")
async def end_session(session_id: str):
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")
        await db.execute(
            "UPDATE sessions SET status='ended', ended_at=? WHERE id=?",
            (now, session_id),
        )
        await db.commit()
    return {"session_id": session_id, "status": "ended"}
