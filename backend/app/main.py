from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pathlib import Path

from app.services.document_parser import extract_text
from app.ai.foundry_ai import FoundryAIService
from app.services.analysis_service import analyze_candidate
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="CareerForge AI",
    description="AI-powered career readiness and interview preparation platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = FoundryAIService()


@app.get("/")
async def root():
    return {
        "message": "CareerForge AI backend is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }


@app.post("/api/documents/extract")
async def extract_document(file: UploadFile = File(...)):

    allowed_extensions = {".pdf", ".docx"}

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = Path("uploads") / file.filename

    contents = await file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        text = extract_text(str(file_path))

        return {
            "filename": file.filename,
            "fileType": file_extension.replace(".", ""),
            "text": text
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract document text: {str(e)}"
        )


@app.post("/api/analyze/resume")
async def analyze_resume(file: UploadFile = File(...)):

    allowed_extensions = {".pdf", ".docx"}

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = Path("uploads") / file.filename

    contents = await file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        text = extract_text(str(file_path))

        candidate_profile = await ai_service.analyze_resume(text)

        return candidate_profile

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not analyze resume: {str(e)}"
        )


@app.post("/api/analyze/job")
async def analyze_job(file: UploadFile = File(...)):

    allowed_extensions = {".pdf", ".docx"}

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = Path("uploads") / file.filename

    contents = await file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        text = extract_text(str(file_path))

        job_profile = await ai_service.analyze_job(text)

        return job_profile

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not analyze job description: {str(e)}"
        )


@app.post("/api/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):

    allowed_extensions = {".pdf", ".docx"}

    resume_extension = Path(resume.filename).suffix.lower()

    if resume_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF or DOCX file."
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty."
        )

    resume_path = Path("uploads") / resume.filename

    resume_contents = await resume.read()

    with open(resume_path, "wb") as f:
        f.write(resume_contents)

    try:

        resume_text = extract_text(str(resume_path))

        result = await analyze_candidate(
            resume_text=resume_text,
            job_text=job_description,
            ai_service=ai_service,
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )