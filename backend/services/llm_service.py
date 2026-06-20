# services/llm_service.py | backend | v2.0
from __future__ import annotations
import os
import json
import asyncio
import models.pg as aiosqlite
from datetime import datetime, timezone
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")

_HUMAN_STYLE = (
    "Speak like a real American — use contractions (I'm, you're, that's, it's), "
    "natural filler transitions (Sure, Got it, Absolutely, Nice), and vary how you open sentences. "
    "Never sound scripted or robotic. React to what the person actually said before asking the next question. "
    "Never repeat a question you've already asked. "
    "If their answer is vague, generic, or evasive (e.g. 'it was good', 'because it's healthy'), "
    "don't just accept it — ask ONE pointed follow-up that pushes them to back it up with a concrete "
    "detail, example, or reason, like a sharp but fair interviewer would. "
    "If the user mixes in some Chinese because they don't know the English, infer what they mean, "
    "keep the conversation flowing in English, and naturally show them how to say that part in natural "
    "English (e.g. 'In English you'd say ...'), then continue."
)

SCENE_PROMPTS = {
    "interview": (
        "You're a recruiter at a top US tech company doing a casual but professional interview over video call. "
        "You're warm, encouraging, and genuinely curious about the candidate. "
        "Ask one question at a time, react briefly to their answer (1 sentence), then move on. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "restaurant": (
        "You're a friendly server at a busy American bistro. "
        "You're upbeat, a little chatty, and helpful. "
        "Take the customer's order naturally, make a quick suggestion if it fits, and keep things moving. "
        "Keep your response to 1-2 sentences max. "
        + _HUMAN_STYLE
    ),
    "meeting": (
        "You're a project lead running a quick team sync over Slack huddle. "
        "You're direct but friendly — you want updates without wasting anyone's time. "
        "Ask one thing at a time, acknowledge what they said in one short sentence, then ask the next thing. "
        "Keep your response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "hospital": (
        "You are a friendly doctor or nurse at a US clinic. The patient is describing symptoms or asking health questions. "
        "Be clear, warm, and professional. Ask one question at a time. Keep responses under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "phone_call": (
        "You are on a business phone call in the US. Stay professional and natural. "
        "Listen carefully and respond to what's being discussed. Keep responses under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "customer_service": (
        "You are a friendly customer service representative for a US tech company. "
        "The customer may have a complaint or question. Acknowledge their concern, then help resolve it. "
        "Keep responses under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "assessment": (
        "You are conducting a friendly English speaking proficiency test. Ask open-ended questions "
        "to assess the user's vocabulary range, grammar accuracy, and fluency. "
        "Start with: 'Tell me about yourself — what do you do and what are your hobbies?' "
        "Then ask 2-3 natural follow-up questions based on their answers. "
        "Be warm and encouraging. Keep each response under 2 sentences."
    ),
    "sde_behavioral": (
        "You are a Senior Software Engineer interviewer at a top US tech company conducting a behavioral interview. "
        "Use the STAR framework (Situation, Task, Action, Result) to evaluate answers. "
        "Ask ONE behavioral question at a time. Topics: teamwork, conflict resolution, failure/learning, leadership, time pressure. "
        "If candidate context is provided, reference it to make questions more personalized. "
        "After each answer, ask ONE brief follow-up (e.g. 'What would you do differently?'). "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "sde_project": (
        "You are a technical interviewer conducting a project deep-dive interview. "
        "Ask the candidate about architecture decisions, technology choices, trade-offs, and hard problems they solved. "
        "One question at a time. React briefly to their answer (1 sentence), then probe deeper. "
        "If a resume is provided, ask specifically about the projects listed. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "sde_thinking": (
        "You are a CS fundamentals interviewer assessing conceptual knowledge — no coding required. "
        "Ask about system design concepts, data structure trade-offs, distributed systems basics, or scalability thinking. "
        "Keep questions conversational — you want to understand how they think, not test memorization. "
        "One question at a time. Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "sde_technical_explain": (
        "You are a technical interviewer running a live coding interview. "
        "If a specific problem is given in [Problem Context] below, use that one. "
        "If no problem is given, invent a new, realistic coding/algorithm problem yourself (appropriate "
        "difficulty for a software engineering interview) and present it to the candidate first in 1-2 sentences. "
        "Either way, the candidate must talk through it OUT LOUD as if thinking step by step — restating the "
        "problem, discussing edge cases, walking through their approach, and stating time/space complexity at the end. "
        "Ask sharp clarifying follow-ups like a real interviewer would: 'What's the time complexity of that?', "
        "'What if the input is empty?', 'Can you walk me through that loop?'. One prompt at a time. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "sde_debug": (
        "You are a senior engineer pair-debugging with the candidate. "
        "If a specific buggy scenario is given in [Problem Context] below, use that one. "
        "If none is given, invent a realistic buggy-code scenario yourself (e.g. an off-by-one bug, a race "
        "condition, a null pointer) and describe it to the candidate first in 1-2 sentences. "
        "Either way, ask them to walk through their debugging process OUT LOUD: what they'd check first, how "
        "they'd narrow down the root cause, what tools or logs they'd reach for. "
        "Push for specifics — 'How would you confirm that's actually the issue?'. One prompt at a time. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "ds_resume_deep_dive": (
        "You are a technical interviewer for a Data Scientist role conducting a project deep-dive interview. "
        "Ask about modeling choices, feature engineering, data pipeline design, metric selection, and "
        "trade-offs in past projects. One question at a time. React briefly (1 sentence), then probe deeper. "
        "If a resume is provided, ask specifically about the projects listed. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "ds_behavioral": (
        "You are a Senior Data Scientist interviewer at a top US tech company conducting a behavioral interview. "
        "Use the STAR framework (Situation, Task, Action, Result) to evaluate answers. "
        "Ask ONE behavioral question at a time. Topics: teamwork, conflict resolution, failure/learning, leadership, time pressure. "
        "If candidate context is provided, reference it to make questions more personalized. "
        "After each answer, ask ONE brief follow-up (e.g. 'What would you do differently?'). "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "ds_technical_explain": (
        "You are a technical interviewer for a Data Scientist role. "
        "If a specific SQL/analytical case is given in [Problem Context] below, use that one. "
        "If none is given, invent a new, realistic SQL or analytical case yourself (appropriate for a data "
        "scientist interview) and present it to the candidate first in 1-2 sentences. "
        "Either way, the candidate must talk through their approach OUT LOUD — restating the question, stating "
        "assumptions, walking through their query logic or statistical method, and explaining why. Ask clarifying "
        "follow-ups like 'What if there are duplicate rows?', 'Why a LEFT JOIN there?', 'How would you validate "
        "that result?'. One prompt at a time. Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "ds_system_design": (
        "You are a technical interviewer for a Data Scientist role assessing experiment design and data "
        "pipeline thinking. Ask about A/B test design, sample size reasoning, metric trade-offs, or how "
        "they'd design a data pipeline or feature store for a given scenario. Keep questions conversational "
        "— you want to understand how they think, not test memorization. One question at a time. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "ds_debug": (
        "You are a senior data scientist pair-debugging with the candidate. "
        "If a specific broken model/data pipeline scenario is given in [Problem Context] below, use that one. "
        "If none is given, invent a realistic one yourself (e.g. silent data drift, a leakage bug, a broken "
        "feature pipeline) and describe it to the candidate first in 1-2 sentences. "
        "Either way, ask them to walk through their debugging process OUT LOUD: what they'd check first (data "
        "drift? leakage? a pipeline bug?), how they'd narrow down the root cause, what they'd look at in the "
        "logs or metrics. Push for specifics. One prompt at a time. Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "pm_resume_deep_dive": (
        "You are a senior PM interviewer conducting a project deep-dive interview. "
        "Ask about a product/feature the candidate shipped: the problem, their decision process, trade-offs, "
        "and the measurable outcome. One question at a time. React briefly (1 sentence), then probe deeper — "
        "push for specifics like 'what data backed that decision?' or 'what would you do differently?'. "
        "If a resume is provided, ask specifically about the projects listed. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "pm_behavioral": (
        "You are a Senior Product Manager interviewer at a top US tech company conducting a behavioral interview. "
        "Use the STAR framework (Situation, Task, Action, Result) to evaluate answers. "
        "Ask ONE behavioral question at a time, focused on PM-flavored scenarios: leading without formal "
        "authority, conflict with a stakeholder or engineer, prioritization under pressure, driving something "
        "end-to-end, influencing without a title. "
        "If candidate context is provided, reference it to make questions more personalized. "
        "After each answer, ask ONE brief follow-up (e.g. 'What would you do differently?'). "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "pm_product_sense": (
        "You are a PM interviewer running a product sense / product design round. "
        "If a specific product design prompt is given in [Problem Context] below, use that one. "
        "If none is given, invent a realistic 'design/improve a product for X user group' prompt yourself "
        "and present it to the candidate first in 1-2 sentences. "
        "Either way, the candidate must talk through their approach OUT LOUD — clarifying the target user and "
        "goal, brainstorming solutions, picking one with reasoning, and defining how they'd measure success. "
        "Ask sharp follow-ups like a real interviewer would: 'Why that user segment?', 'What's the trade-off "
        "there?', 'How would you validate that before building it?'. One prompt at a time. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "pm_metrics_execution": (
        "You are a PM interviewer running a metrics & execution round. "
        "If a specific scenario is given in [Problem Context] below, use that one. "
        "If none is given, invent a realistic one yourself (e.g. 'engagement on feature X dropped 10% last "
        "week', or 'define the north star metric for product Y') and present it first in 1-2 sentences. "
        "Either way, the candidate must talk through their approach OUT LOUD — defining the right metrics, "
        "how they'd set up an A/B test or root-cause a metric drop, and what trade-offs they'd weigh. "
        "Ask clarifying follow-ups like 'What's your null hypothesis?', 'What else could explain that drop?'. "
        "One prompt at a time. Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
    "pm_estimation_strategy": (
        "You are a PM interviewer running an estimation & prioritization round. "
        "If a specific scenario is given in [Problem Context] below, use that one. "
        "If none is given, invent a realistic market-sizing or feature-prioritization scenario yourself "
        "(e.g. 'estimate daily active users for X', or 'you have 3 features and one quarter, which do you "
        "ship first and why') and present it first in 1-2 sentences. "
        "Either way, ask the candidate to talk through their structured reasoning OUT LOUD — stating "
        "assumptions explicitly, breaking the problem into parts, and sanity-checking the result. "
        "Push for specifics — 'Where did that number come from?'. One prompt at a time. "
        "Keep your total response under 3 sentences. "
        + _HUMAN_STYLE
    ),
}

DIFFICULTY_SUFFIX = {
    "easy": " Use simple vocabulary (A2 level). Keep sentences short. Be very patient and encouraging.",
    "medium": "",
    "hard": " Use advanced vocabulary, idioms, and natural fast speech (C1 level). Challenge the user with complex questions.",
}

PERSONALITY_STYLES = {
    "friendly": "",  # 默认：温和鼓励
    "strict": (
        " Adopt a strict, demanding persona like a tough interviewer at a top tech company. "
        "Be direct, hold a high bar, and push hard on weak or vague answers. Stay professional, never rude."
    ),
    "tough": (
        " Adopt a cold, impatient persona. Keep replies short and a little blunt, show mild skepticism, "
        "and challenge the user to be precise. Do not hand out praise easily."
    ),
}

EMPTY_CORRECTION = {
    "has_error": False,
    "original": "",
    "corrected": "",
    "explanation": "",
    "error_type": "",
}

VALID_WEAK_AREAS = {"grammar", "clarity", "structure", "vocabulary", "response_completeness"}


async def get_ai_response(
    scene: str,
    messages: list[dict],
    difficulty: str = "medium",
    resume_context: str = "",
    jd_context: str = "",
) -> str:
    system_prompt = SCENE_PROMPTS.get(scene, SCENE_PROMPTS["interview"]) + DIFFICULTY_SUFFIX.get(difficulty, "")
    context_parts = []
    if resume_context:
        context_parts.append(f"Resume: {resume_context}")
    if jd_context:
        context_parts.append(f"Job Description: {jd_context}")
    if context_parts:
        system_prompt += "\n\n[Candidate Context]\n" + "\n".join(context_parts) + "\nUse this context to make your questions more personalized and relevant."
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=150,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


async def get_ai_response_stream(
    scene: str,
    messages: list[dict],
    difficulty: str = "medium",
    resume_context: str = "",
    jd_context: str = "",
    personality: str = "friendly",
    vocab_hints: list | None = None,
    problem_context: str = "",
):
    """流式生成 AI 回复，逐块 yield，降低首字延迟。"""
    system_prompt = (
        SCENE_PROMPTS.get(scene, SCENE_PROMPTS["interview"])
        + DIFFICULTY_SUFFIX.get(difficulty, "")
        + PERSONALITY_STYLES.get(personality, "")
    )
    context_parts = []
    if resume_context:
        context_parts.append(f"Resume: {resume_context}")
    if jd_context:
        context_parts.append(f"Job Description: {jd_context}")
    if context_parts:
        system_prompt += "\n\n[Candidate Context]\n" + "\n".join(context_parts) + "\nUse this context to make your questions more personalized and relevant."
    if problem_context:
        system_prompt += f"\n\n[Problem Context]\n{problem_context}\nThe candidate is working through this specific problem — keep your questions grounded in it."

    # 自适应难度：根据用户最近一次回答的长度动态微调（最近发展区 i+1）
    last_user = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    wc = len(last_user.split())
    if 0 < wc < 5:
        system_prompt += " The user gave a very short answer — keep your reply simple and warm, and gently encourage them to say a little more."
    elif wc > 20:
        system_prompt += " The user is speaking fluently and at length — feel free to use richer, more idiomatic vocabulary and raise the challenge a notch."

    if vocab_hints:
        system_prompt += (
            " The learner is studying these words: " + ", ".join(vocab_hints[:5]) + ". "
            "If it fits naturally, weave ONE of them into your reply to reinforce it — never force it."
        )

    stream = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=150,
        temperature=0.7,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def evaluate_correction(user_text: str) -> dict:
    prompt = (
        f'Analyze this English sentence for grammar correctness: "{user_text}"\n\n'
        "Reply ONLY with a JSON object, no other text:\n"
        '{"has_error": bool, "original": str, "corrected": str, "explanation": str, "error_type": str}\n\n'
        "Set has_error to TRUE ONLY for clear, unambiguous grammatical errors:\n"
        "  - Wrong verb form: 'I goes' (→ I go), 'she goed' (→ went), 'have went' (→ have gone)\n"
        "  - Subject-verb agreement: 'she don't' (→ doesn't), 'he have' (→ has), 'I goes' (→ I go)\n"
        "  - Redundant or wrong preposition: 'discussed about X' (→ discussed X), 'since 3 years' (→ for 3 years)\n"
        "  - Wrong form after fixed phrases: 'look forward to hear' (→ look forward to hearing)\n"
        "  - Article with uncountable nouns: 'a feedback' (→ feedback), 'a information' (→ information)\n\n"
        "Set has_error to FALSE for:\n"
        "  - Informal but grammatically acceptable speech: 'gonna', 'wanna', 'kinda', 'gotta', contractions\n"
        "  - Simple sentences that are grammatically correct even if informal or short\n"
        "  - Colloquialisms and natural spoken English\n"
        "  - Sentences that sound unusual but are grammatically valid\n\n"
        "Be conservative: when in doubt, set has_error=False. Only flag clear, unambiguous errors.\n\n"
        "Fields (all required):\n"
        "- has_error: true or false\n"
        "- original: exact problematic phrase only (empty string if no error)\n"
        "- corrected: corrected version of that phrase (empty string if no error)\n"
        "- explanation: one sentence in English (empty string if no error)\n"
        '- error_type: exactly one of "grammar", "vocabulary", "fluency" (empty string if no error)\n'
        "Output only the JSON, nothing else."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.1,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        for key in EMPTY_CORRECTION:
            if key not in result:
                result[key] = EMPTY_CORRECTION[key]
        if result.get("has_error") and result.get("error_type") not in ("grammar", "vocabulary", "fluency"):
            result["error_type"] = "grammar"
        return result
    except Exception:
        return EMPTY_CORRECTION.copy()


async def evaluate_upgrade(user_text: str) -> dict:
    """对语法正确但生硬/中式的表达，给出更地道的母语说法（不止纠错）。"""
    prompt = (
        f'A learner said: "{user_text}"\n\n'
        "If this is grammatically acceptable but sounds unnatural, stiff, or like a direct translation "
        "from Chinese, suggest how a native American speaker would more naturally say it in everyday conversation.\n"
        "IMPORTANT: focus on NATURALNESS / idiomatic phrasing, NOT fancy or advanced vocabulary. "
        "If it already sounds natural and native, set has_suggestion to false.\n"
        "Be conservative — only suggest when it genuinely sounds non-native.\n\n"
        "Also tag the speaker's delivery style.\n"
        "Reply ONLY with JSON:\n"
        '{"has_suggestion": bool, "better": str, "reason": str, "style_tags": [str]}\n'
        "- better: the more natural native version (empty string if none)\n"
        "- reason: one short sentence in Chinese explaining why it's more natural (empty string if none)\n"
        "- style_tags: 1-2 short English labels for how they came across, chosen ONLY from: "
        "Confident, Hesitant, Too generic, Too brief, Clear, Natural, Unnatural. Empty array if unsure.\n"
        "Output only the JSON, nothing else."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        tags = result.get("style_tags", [])
        if not isinstance(tags, list):
            tags = []
        return {
            "has_suggestion": bool(result.get("has_suggestion", False)),
            "better": str(result.get("better", "")),
            "reason": str(result.get("reason", "")),
            "style_tags": [str(t) for t in tags][:2],
        }
    except Exception:
        return {"has_suggestion": False, "better": "", "reason": "", "style_tags": []}


async def _get_real_pronunciation(session_id: str):
    """读取本次会话练习中 Azure 真实发音评测的平均准确度；无记录返回 None。"""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(
                "SELECT accuracy FROM pronunciation_scores WHERE session_id = ? AND accuracy > 0",
                (session_id,),
            )
            rows = await cursor.fetchall()
        accs = [r[0] for r in rows]
        if accs:
            return round(sum(accs) / len(accs), 1)
    except Exception:
        pass
    return None


async def generate_report_scores(session_id: str, messages: list, corrections: list) -> dict:
    user_messages = [m["content"] for m in messages if m["role"] == "user"]

    if not user_messages:
        return {
            "pronunciation_score": 0.0,
            "grammar_errors": 0,
            "fluency_score": 0.0,
            "vocabulary_score": 0.0,
            "overall_score": 0.0,
            "topic": "",
            "clarity_score": 0.0,
            "structure_score": 0.0,
            "ambiguous_expressions": [],
            "weak_areas": [],
            "key_vocabulary": [],
            "suggestions": ["Complete a conversation session first."],
            "highlights": [],
        }

    conversation_text = "\n".join(f"- {m}" for m in user_messages)
    grammar_errors = len(corrections)

    # Estimate pronunciation_score from text quality since no real audio is available
    total_words = sum(len(m.split()) for m in user_messages)
    avg_words_per_turn = total_words / len(user_messages)
    unique_words = len(set(w.lower().strip(".,!?") for m in user_messages for w in m.split()))
    vocab_ratio = unique_words / max(total_words, 1)

    if avg_words_per_turn >= 8 and vocab_ratio > 0.5:
        pronunciation_base = 82
    elif avg_words_per_turn >= 5 or vocab_ratio > 0.35:
        pronunciation_base = 68
    else:
        pronunciation_base = 57

    # 优先使用练习时 Azure 真实发音评测的平均分；无记录则回退到文本估算
    real_pron = await _get_real_pronunciation(session_id)
    if real_pron is not None:
        pronunciation_score = real_pron
    else:
        variance = (sum(ord(c) for c in session_id) % 11) - 5
        pronunciation_score = round(max(50.0, min(95.0, pronunciation_base + variance)), 1)

    prompt = (
        "You are an English speaking coach. Analyze this practice session and provide honest scores.\n\n"
        f"User sentences:\n{conversation_text}\n\n"
        f"Grammar errors detected: {grammar_errors}\n\n"
        "SCORING RULES — apply strictly:\n"
        "  overall_score band based on grammar_errors:\n"
        "    0-2 errors with fluent sentences  → 85-95\n"
        "    3-5 errors with basic sentences   → 65-80\n"
        "    6+ errors                         → 50-65\n"
        "  fluency_score: sentence length, variety, natural flow (0-100)\n"
        "  vocabulary_score: word variety and appropriateness (0-100)\n"
        "  clarity_score: 90-100 every sentence clear; 70-89 occasional vagueness; "
        "50-69 multiple unclear expressions; <50 severely unclear\n"
        "  structure_score: 90-100 complete logical answers; 70-89 mostly complete; "
        "50-69 mostly short fragments; <50 almost no structure\n\n"
        "Reply ONLY with a JSON object:\n"
        '{"topic": str, "fluency_score": float, "vocabulary_score": float, "overall_score": float, '
        '"clarity_score": float, "structure_score": float, '
        '"ambiguous_expressions": [{"original": str, "better": str, "explanation": str}], '
        '"weak_areas": [str], '
        '"key_vocabulary": [{"word": str, "definition": str, "example": str}], '
        '"pronunciation_tips": [{"word": str, "ipa": str, "tip": str}], '
        '"suggestions": [str, str, str], "highlights": [str, str]}\n\n'
        "Requirements:\n"
        "- topic: 1 sentence describing what the conversation was about\n"
        "- All scores between 0.0 and 100.0, differentiated and realistic\n"
        "- overall_score MUST fall in the band above\n"
        "- ambiguous_expressions: max 3, only expressions that would genuinely confuse a native speaker\n"
        "- weak_areas: max 3, only from: grammar, clarity, structure, vocabulary, response_completeness\n"
        "- key_vocabulary: 3-5 useful words or phrases for this scene. Include words the user used well AND important vocabulary they missed. Keep definitions under 10 words. Use a real example sentence.\n"
        "- pronunciation_tips: identify 2-3 words from the user's speech that Chinese speakers commonly mispronounce. "
        "For each word include: 'word' (the exact word), 'ipa' (IPA phonetic like /prəˌnʌnsiˈeɪʃən/), "
        "'tip' (1 sentence: what Chinese speakers typically get wrong and what to focus on). "
        "Return empty array [] if user spoke fewer than 15 words or all words are simple monosyllables. "
        "Examples of common issues: th→d/f, l/r confusion, word-final consonant dropping, stress on wrong syllable.\n"
        "- suggestions: 3 specific tips referencing actual phrases from the user's sentences\n"
        "- highlights: 2 genuine strengths from actual sentences; if none, note their effort\n"
        "Output only the JSON, nothing else."
    )

    result = None
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=950,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        result["grammar_errors"] = grammar_errors
        result["pronunciation_score"] = pronunciation_score
        for key in ("fluency_score", "vocabulary_score", "overall_score", "clarity_score", "structure_score"):
            if key in result:
                result[key] = round(max(0.0, min(100.0, float(result[key]))), 1)
        result["weak_areas"] = [a for a in result.get("weak_areas", []) if a in VALID_WEAK_AREAS][:3]
        if not isinstance(result.get("ambiguous_expressions"), list):
            result["ambiguous_expressions"] = []
        result["ambiguous_expressions"] = result["ambiguous_expressions"][:3]
        result.setdefault("topic", "General English practice")
        result.setdefault("clarity_score", 70.0)
        result.setdefault("structure_score", 70.0)
        result.setdefault("ambiguous_expressions", [])
        result.setdefault("weak_areas", [])
        result.setdefault("key_vocabulary", [])
        result["key_vocabulary"] = result["key_vocabulary"][:5]
        result.setdefault("pronunciation_tips", [])
        result["pronunciation_tips"] = result["pronunciation_tips"][:3]
    except Exception:
        result = {
            "pronunciation_score": pronunciation_score,
            "grammar_errors": grammar_errors,
            "fluency_score": 70.0,
            "vocabulary_score": 70.0,
            "overall_score": 70.0,
            "topic": "General English practice",
            "clarity_score": 70.0,
            "structure_score": 70.0,
            "ambiguous_expressions": [],
            "weak_areas": ["grammar"] if grammar_errors > 2 else [],
            "key_vocabulary": [],
            "pronunciation_tips": [],
            "suggestions": [
                "Practice using more varied sentence structures.",
                "Expand your vocabulary with topic-specific words.",
                "Work on smoother transitions between ideas.",
            ],
            "highlights": [
                "Maintained conversation throughout the session.",
                "Responded to all prompts appropriately.",
            ],
        }

    # Save analysis to session_analyses for memory greeting feature (non-critical)
    try:
        scene_val = "interview"
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("SELECT scene FROM sessions WHERE id = ?", (session_id,))
            row = await cursor.fetchone()
            if row:
                scene_val = row[0]

        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """INSERT INTO session_analyses
                (session_id, scene, topic, clarity_score, structure_score,
                 weak_areas, ambiguous_expressions,
                 overall_score, grammar_errors, vocabulary_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (session_id) DO UPDATE SET
                    scene = excluded.scene,
                    topic = excluded.topic,
                    clarity_score = excluded.clarity_score,
                    structure_score = excluded.structure_score,
                    weak_areas = excluded.weak_areas,
                    ambiguous_expressions = excluded.ambiguous_expressions,
                    overall_score = excluded.overall_score,
                    grammar_errors = excluded.grammar_errors,
                    vocabulary_score = excluded.vocabulary_score,
                    created_at = excluded.created_at""",
                (
                    session_id,
                    scene_val,
                    result.get("topic", ""),
                    result.get("clarity_score", 0.0),
                    result.get("structure_score", 0.0),
                    json.dumps(result.get("weak_areas", [])),
                    json.dumps(result.get("ambiguous_expressions", [])),
                    result.get("overall_score", 0.0),
                    result.get("grammar_errors", 0),
                    result.get("vocabulary_score", 0.0),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            await db.commit()
    except Exception:
        pass  # DB save is non-critical; report still returns successfully

    return result


async def generate_memory_greeting(scene: str, previous_analysis: dict) -> str:
    """
    根据上次分析生成有记忆感的开场白。
    previous_analysis 包含：topic, weak_areas, ambiguous_expressions, clarity_score, structure_score
    """
    weak_areas = previous_analysis.get("weak_areas", [])
    topic = previous_analysis.get("topic", "general conversation")
    ambiguous = previous_analysis.get("ambiguous_expressions", [])

    weak_desc = ", ".join(weak_areas) if weak_areas else "general improvement"
    ambig_example = (
        f'For example, "{ambiguous[0]["original"]}" could be said as "{ambiguous[0]["better"]}".'
        if ambiguous else ""
    )

    system = SCENE_PROMPTS.get(scene, SCENE_PROMPTS["interview"])
    recap_instruction = (
        f"Start by briefly recapping the student's last session: they practiced {topic}. "
        f"Their main areas to improve were: {weak_desc}. {ambig_example} "
        f"Tell them you'll focus on these areas today. Then ask your first question. "
        f"Keep the entire opening under 4 sentences."
    )

    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system + "\n\n" + recap_instruction},
            {"role": "user", "content": "Hello, I'm ready to start."},
        ],
        max_tokens=200,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


async def generate_assessment_result(messages: list[dict]) -> dict:
    """根据5轮对话估算用户 CEFR 口语水平。"""
    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    if not user_messages:
        return {
            "cefr_level": "B1",
            "level_label": "Intermediate",
            "strengths": ["Willing to practice"],
            "areas_to_improve": ["Keep practicing"],
            "recommended_difficulty": "medium",
        }

    conversation = "\n".join(f"- {m}" for m in user_messages)
    prompt = (
        "You are an English proficiency examiner. Analyze these speaking samples:\n\n"
        f"{conversation}\n\n"
        "Rate the speaker's CEFR level based on:\n"
        "A2: Simple sentences, many grammar errors, very limited vocabulary\n"
        "B1: Can communicate basic ideas, grammar errors present, moderate vocabulary\n"
        "B2: Generally correct grammar, varied vocabulary, occasional mistakes\n"
        "C1: Fluent, rich vocabulary, complex structures, rare errors\n\n"
        "Reply ONLY with JSON:\n"
        '{"cefr_level": "A2"|"B1"|"B2"|"C1", "level_label": str, '
        '"strengths": [str, str], "areas_to_improve": [str, str], '
        '"recommended_difficulty": "easy"|"medium"|"hard"}\n\n'
        "level_label examples: Beginner, Elementary, Intermediate, Upper-Intermediate, Advanced\n"
        "recommended_difficulty: easy for A2, medium for B1-B2, hard for C1\n"
        "Output only the JSON."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.2,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        result.setdefault("cefr_level", "B1")
        result.setdefault("level_label", "Intermediate")
        result.setdefault("strengths", ["Good effort"])
        result.setdefault("areas_to_improve", ["Keep practicing"])
        result.setdefault("recommended_difficulty", "medium")
        return result
    except Exception:
        return {
            "cefr_level": "B1",
            "level_label": "Intermediate",
            "strengths": ["Willing to practice English"],
            "areas_to_improve": ["Work on grammar accuracy"],
            "recommended_difficulty": "medium",
        }


async def generate_interview_feedback(
    messages: list[dict],
    resume_context: str = "",
    jd_context: str = "",
) -> dict:
    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    if len(user_messages) < 2:
        return {
            "communication_score": 0,
            "star_coverage": {"situation": False, "task": False, "action": False, "result": False},
            "star_feedback": "Not enough conversation to evaluate.",
            "strengths": [],
            "improvements": ["Complete at least 2 turns to receive feedback."],
            "sample_rewrite": "",
        }

    conversation = "\n".join(f"Candidate: {m}" for m in user_messages)
    context_note = ""
    if resume_context:
        context_note += f"\nResume provided: {resume_context[:500]}"
    if jd_context:
        context_note += f"\nJob Description: {jd_context[:300]}"

    prompt = (
        f"You are an interview coach evaluating a software engineer's behavioral interview answers.{context_note}\n\n"
        f"Conversation:\n{conversation}\n\n"
        "Analyze the candidate's answers and reply ONLY with a JSON object:\n"
        '{"communication_score": <int 0-100>, '
        '"star_coverage": {"situation": <bool>, "task": <bool>, "action": <bool>, "result": <bool>}, '
        '"star_feedback": "<1-2 sentences on STAR quality>", '
        '"strengths": ["<str>", "<str>"], '
        '"improvements": ["<str>", "<str>"], '
        '"sample_rewrite": "<suggested rewrite of the weakest answer>"}\n\n'
        "communication_score: 0-100 based on clarity, structure, and conciseness.\n"
        "star_coverage: true if the candidate clearly addressed each element across their answers.\n"
        "Output only the JSON, no other text."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.2,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        result.setdefault("communication_score", 60)
        result.setdefault("star_coverage", {"situation": False, "task": False, "action": False, "result": False})
        result.setdefault("star_feedback", "")
        result.setdefault("strengths", [])
        result.setdefault("improvements", [])
        result.setdefault("sample_rewrite", "")
        return result
    except Exception:
        return {
            "communication_score": 60,
            "star_coverage": {"situation": True, "task": True, "action": True, "result": False},
            "star_feedback": "Good effort. Try to quantify your results more clearly.",
            "strengths": ["Clear communication"],
            "improvements": ["Add quantifiable results to your answers"],
            "sample_rewrite": "",
        }


ROLE_LABEL = {"sde": "software engineer", "ds": "data scientist", "pm": "product manager"}


async def generate_self_intro_script(resume_text: str = "", track: str = "sde") -> str:
    """生成一份可背诵的自我介绍稿（自我介绍模块 learn 阶段用）。"""
    role = ROLE_LABEL.get(track, "software engineer")
    prompt = (
        f"Write a natural, spoken-style self-introduction script (60-90 seconds when read aloud, "
        f"~150-180 words) for a {role} candidate to memorize for English interviews. "
        + (f"Base it on this resume: {resume_text}" if resume_text else
           "No resume was provided — write a solid generic template the candidate can personalize.")
        + " Structure: who you are + background (1-2 sentences) -> most relevant experience/projects "
        "(2-3 sentences with specifics) -> what you're looking for / why this kind of role (1 sentence). "
        "Sound like natural spoken English, not a written bio — use contractions, vary sentence length. "
        "Output ONLY the script text, no labels or markdown."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.6,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return (
            f"Hi, I'm [Your Name], a {role} with a background in [your domain]. "
            "Most recently, I worked on [a project] where I [your specific contribution and a measurable result]. "
            "I'm looking for a role where I can [what you're looking for next]."
        )


async def generate_resume_corpus(resume_text: str = "", track: str = "sde") -> list[dict]:
    """生成简历深挖语料库（简历深挖模块 learn 阶段用）：常见追问 + 建议答法。"""
    role = ROLE_LABEL.get(track, "software engineer")
    prompt = (
        f"You are prepping a {role} candidate for a resume/project deep-dive interview.\n"
        f"Resume: {resume_text or '(no resume provided — use generic but realistic example projects)'}\n\n"
        "Generate 5-6 likely deep-dive questions an interviewer would ask about this resume's projects, "
        "each with a suggested model answer (2-3 sentences, specific, quantified where possible). "
        'Reply ONLY with JSON: [{"question": str, "suggested_answer": str}, ...]'
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,
            temperature=0.5,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        return result[:8]
    except Exception:
        return [{
            "question": "Walk me through one of your recent projects.",
            "suggested_answer": "Describe the problem, your specific contribution, and a measurable result.",
        }]


async def generate_behavioral_corpus(track: str = "pm") -> list[dict]:
    """生成行为面试(STAR)语料库：常见追问 + 建议答法。SDE/DS 复用前端现成题库，这个函数目前只给没有现成题库的赛道(如 pm)用。"""
    role = ROLE_LABEL.get(track, "product manager")
    prompt = (
        f"You are prepping a {role} candidate for a behavioral interview (STAR framework).\n"
        "Generate 6 common behavioral questions for this role — covering leading without authority, "
        "conflict with a stakeholder, prioritization under pressure, driving something end-to-end, and "
        "failure/learning — each with a suggested model answer (2-3 sentences, specific, using STAR shape, "
        "quantified where possible). "
        'Reply ONLY with JSON: [{"question": str, "suggested_answer": str}, ...]'
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,
            temperature=0.5,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        return result[:8]
    except Exception:
        return [{
            "question": "Tell me about a time you had to lead without formal authority.",
            "suggested_answer": "Describe the situation, your specific actions to build buy-in, and the measurable outcome.",
        }]


async def generate_explanation_script(track: str, module: str, problem_text: str) -> str:
    """生成技术模块(technical_explain/system_design/debug) learn 阶段的口头讲解示范稿。"""
    role = ROLE_LABEL.get(track, "software engineer")
    topic_label = {
        "sde": {
            "technical_explain": "a coding/algorithm problem",
            "system_design": "a system design problem",
            "debug": "a debugging scenario",
        },
        "ds": {
            "technical_explain": "a SQL or analytical case",
            "system_design": "an experiment or data-pipeline design problem",
            "debug": "a debugging scenario",
        },
        "pm": {
            "technical_explain": "a product sense / product design case",
            "system_design": "a metrics & execution case",
            "debug": "an estimation or feature-prioritization case",
        },
    }.get(track, {}).get(module, "a technical problem")
    prompt = (
        f"You are coaching a {role} candidate on how to TALK THROUGH {topic_label} out loud in an interview.\n"
        f"Problem: {problem_text}\n\n"
        "Write a model spoken-style walkthrough script (200-280 words) that:\n"
        "- restates the problem/goal in their own words\n"
        "- states assumptions or asks clarifying questions\n"
        "- explains the approach step by step\n"
        "- ends with complexity/trade-offs or how they'd validate the result\n"
        "Sound like natural spoken English (contractions, thinking-out-loud phrasing like 'so my first "
        "thought is...'), not a written essay. Output ONLY the script text."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.6,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return (
            f"Let's think through this together: first, restate the problem in your own words, then talk "
            f"through your approach for {problem_text[:80]}, and finish with the complexity and any trade-offs."
        )


async def generate_module_feedback(track: str, module: str, messages: list[dict]) -> dict:
    """泛化版的模块练习反馈（technical_explain/system_design/debug 等模块的模拟结束总结）。"""
    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    if len(user_messages) < 2:
        return {
            "communication_score": 0,
            "clarity_score": 0,
            "strengths": [],
            "improvements": ["Complete at least 2 turns to receive feedback."],
            "sample_rewrite": "",
        }
    conversation = "\n".join(f"Candidate: {m}" for m in user_messages)
    prompt = (
        f"You are an interview coach evaluating a candidate's spoken answers for the '{module}' practice "
        f"module ({track} track).\n\nConversation:\n{conversation}\n\n"
        "Reply ONLY with JSON:\n"
        '{"communication_score": <int 0-100>, "clarity_score": <int 0-100>, '
        '"strengths": ["<str>", "<str>"], "improvements": ["<str>", "<str>"], '
        '"sample_rewrite": "<suggested rewrite of the weakest answer>"}\n'
        "Output only the JSON."
    )
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.2,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        result.setdefault("communication_score", 60)
        result.setdefault("clarity_score", 60)
        result.setdefault("strengths", [])
        result.setdefault("improvements", [])
        result.setdefault("sample_rewrite", "")
        return result
    except Exception:
        return {
            "communication_score": 60,
            "clarity_score": 60,
            "strengths": ["Clear communication"],
            "improvements": ["Add more specific detail"],
            "sample_rewrite": "",
        }


if __name__ == "__main__":
    result = asyncio.run(evaluate_correction("I goes to school every day"))
    print("纠错测试:", result)
    result2 = asyncio.run(evaluate_correction("I go to school every day"))
    print("正确句测试:", result2)  # 应该 has_error=False
