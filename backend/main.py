# main.py | backend | v1.0
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from models.db import init_db
from routers import session, ws, report, history, assessment
from routers.parse_pdf import router as parse_pdf_router
from routers.pronunciation import router as pronunciation_router
from routers.afdian import router as afdian_router
from routers.vocab import router as vocab_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AI English Coach API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(ws.router)
app.include_router(report.router)
app.include_router(history.router)
app.include_router(assessment.router)
app.include_router(parse_pdf_router)
app.include_router(pronunciation_router)
app.include_router(afdian_router)
app.include_router(vocab_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/translate")
async def translate(text: str):
    if not text or len(text) > 500:
        return {"translation": ""}
    client = AsyncOpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com",
    )
    resp = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "Translate the English text to Chinese. Return only the translation, no explanation."},
            {"role": "user", "content": text},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    return {"translation": resp.choices[0].message.content.strip()}
