# schemas/api_schemas.py | backend | v1.0
from pydantic import BaseModel
from typing import Optional, List, Any


class SessionCreate(BaseModel):
    scene: str  # interview | restaurant | meeting
    difficulty: str = "medium"


class SessionResponse(BaseModel):
    session_id: str
    scene: str
    system_prompt: str
    created_at: str
    difficulty: str = "medium"
    previous_analysis: Optional[Any] = None


class MessageResponse(BaseModel):
    role: str
    content: str
    turn_id: int
    created_at: str


class CorrectionItem(BaseModel):
    original: str
    corrected: str
    explanation: str


class ReportResponse(BaseModel):
    session_id: str
    scene: str
    duration_seconds: int
    total_turns: int
    pronunciation_score: float
    grammar_errors: int
    fluency_score: float
    vocabulary_score: float
    overall_score: float
    corrections: List[CorrectionItem]
    suggestions: List[str]
    highlights: List[str]


class WSMessage(BaseModel):
    type: str
    text: Optional[str] = None


class WSCorrectionDetail(BaseModel):
    has_error: bool
    original: str
    corrected: str
    explanation: str
    error_type: str


class WSResponse(BaseModel):
    type: str
    user_text: str
    ai_text: str
    audio_base64: str
    correction: WSCorrectionDetail
    turn_id: int
