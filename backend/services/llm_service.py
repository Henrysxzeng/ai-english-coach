import os
import json
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

SCENE_PROMPTS = {
    "interview": (
        "You are an experienced HR interviewer at a top tech company. "
        "Conduct a professional job interview in English. "
        "Ask one focused question at a time. "
        "Keep each response to 2-3 sentences maximum."
    ),
    "restaurant": (
        "You are a friendly waiter at an upscale American restaurant. "
        "Help the customer order food naturally. Suggest specials when appropriate. "
        "Keep each response to 1-2 sentences maximum."
    ),
    "meeting": (
        "You are a project manager running a team status meeting. "
        "Ask about project updates, timelines, and blockers one at a time. "
        "Keep each response to 2-3 sentences maximum."
    ),
}

EMPTY_CORRECTION = {
    "has_error": False,
    "original": "",
    "corrected": "",
    "explanation": "",
    "error_type": "",
}


async def get_ai_response(scene: str, messages: list[dict]) -> str:
    system_prompt = SCENE_PROMPTS.get(scene, SCENE_PROMPTS["interview"])
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=150,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


async def evaluate_correction(user_text: str) -> dict:
    prompt = (
        f'Analyze this English sentence for errors: "{user_text}"\n\n'
        "Reply ONLY with a JSON object, no other text:\n"
        '{"has_error": bool, "original": str, "corrected": str, "explanation": str, "error_type": str}\n\n'
        "Rules:\n"
        "- has_error: true only if there is a clear grammar/vocabulary/fluency error\n"
        "- original: the exact problematic phrase (empty string if no error)\n"
        "- corrected: the corrected version (empty string if no error)\n"
        "- explanation: one sentence explanation in English (empty string if no error)\n"
        '- error_type: one of "grammar", "vocabulary", "fluency" (empty string if no error)\n'
        "- If the sentence is correct or only mildly informal, set has_error to false"
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
        return result
    except Exception:
        return EMPTY_CORRECTION.copy()


async def generate_report_scores(session_id: str, messages: list, corrections: list) -> dict:
    user_messages = [m["content"] for m in messages if m["role"] == "user"]

    if not user_messages:
        return {
            "pronunciation_score": 0.0,
            "grammar_errors": 0,
            "fluency_score": 0.0,
            "vocabulary_score": 0.0,
            "overall_score": 0.0,
            "suggestions": ["Complete a conversation session first."],
            "highlights": [],
        }

    conversation_text = "\n".join(f"- {m}" for m in user_messages)
    grammar_errors = len(corrections)

    prompt = (
        "You are an English speaking coach. Analyze this practice session.\n\n"
        f"User sentences:\n{conversation_text}\n\n"
        f"Grammar errors detected: {grammar_errors}\n\n"
        "Reply ONLY with a JSON object:\n"
        '{"pronunciation_score": float, "fluency_score": float, "vocabulary_score": float, '
        '"overall_score": float, "suggestions": [str, str, str], "highlights": [str, str]}\n\n'
        "- All scores 0.0-100.0, be realistic and calibrated\n"
        "- suggestions: 3 specific actionable improvement tips\n"
        "- highlights: 2 genuine strengths observed\n"
        "Output only the JSON."
    )

    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        result["grammar_errors"] = grammar_errors
        return result
    except Exception:
        return {
            "pronunciation_score": 70.0,
            "grammar_errors": grammar_errors,
            "fluency_score": 70.0,
            "vocabulary_score": 70.0,
            "overall_score": 70.0,
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
