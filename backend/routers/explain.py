# routers/explain.py | 查词义 / 查句意接口
from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import client

router = APIRouter()


class ExplainRequest(BaseModel):
    text: str          # selected word or phrase
    context: str = ""  # surrounding sentence for better accuracy


@router.post("/api/explain")
async def explain_phrase(data: ExplainRequest):
    phrase = data.text.strip()[:300]
    ctx = data.context.strip()[:600]
    if not phrase:
        return {"explanation": ""}

    context_line = f'\nSurrounding sentence: "{ctx}"' if ctx else ""
    prompt = (
        f'Explain the following English word or phrase in Chinese, concisely (2-4 lines max):{context_line}\n'
        f'Word/phrase: "{phrase}"\n\n'
        "Format:\n"
        "【中文含义】一句话解释\n"
        "【用法提示】简短说明语境或搭配（如有必要）\n"
        "【例句】一个自然的英文例句（如果原词不是完整句子）\n\n"
        "Only output the above format, nothing else."
    )
    try:
        res = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return {"explanation": res.choices[0].message.content.strip()}
    except Exception:
        return {"explanation": "查询失败，请稍后再试"}
