# routers/parse_pdf.py | backend | v1.0
from fastapi import APIRouter, UploadFile, File, HTTPException
import pdfplumber
import io

router = APIRouter()


@router.post("/api/parse-resume-pdf")
async def parse_resume_pdf(file: UploadFile = File(...)):
    if "pdf" not in (file.content_type or "").lower() and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = len(pdf.pages)
            text = "\n".join(
                page.extract_text() or "" for page in pdf.pages
            ).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. Try pasting your resume manually.")

    return {"text": text, "pages": pages}
