# main.py | backend | v1.0
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.db import init_db
from routers import session, ws, report, history, assessment
from routers.parse_pdf import router as parse_pdf_router
from routers.pronunciation import router as pronunciation_router
from routers.afdian import router as afdian_router


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


@app.get("/health")
async def health():
    return {"status": "ok"}
