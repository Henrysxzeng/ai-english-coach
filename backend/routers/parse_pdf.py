# routers/parse_pdf.py | backend | v1.1 (PDF + DOCX)
from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
from docx import Document
import io

router = APIRouter()

MAX_SIZE = 5 * 1024 * 1024


def _parse_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def _parse_docx(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


@router.post("/api/parse-resume-pdf")
async def parse_resume_pdf(file: UploadFile = File(...)):
    """解析简历文件，支持 PDF 和 Word(.docx)。旧的 .doc（二进制格式）不支持，需要转存成 .docx 或 PDF。"""
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    is_pdf = "pdf" in content_type or filename.endswith(".pdf")
    is_docx = filename.endswith(".docx") or "wordprocessingml" in content_type
    is_legacy_doc = filename.endswith(".doc") and not is_docx

    if is_legacy_doc:
        raise HTTPException(status_code=400, detail="旧版 .doc 格式不支持，请用 Word 另存为 .docx 或导出 PDF 后重新上传。")
    if not is_pdf and not is_docx:
        raise HTTPException(status_code=400, detail="只支持 PDF 或 Word(.docx) 文件。")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    try:
        if is_pdf:
            text = _parse_pdf(content)
        else:
            text = _parse_docx(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from the file. Try pasting your resume manually.")

    return {"text": text}
