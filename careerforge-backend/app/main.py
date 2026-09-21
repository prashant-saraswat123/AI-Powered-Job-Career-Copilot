from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.services.document_parser import extract_text
from app.ai.mock_ai import MockAIService
from app.services.analysis_service import analyze_candidate
from app.services.roadmap_service import (
    generate_learning_roadmap,
    generate_skill_gap_roadmap,
)
from app.schemas.analysis import SkillGapResult
from app.schemas.roadmap import SkillGapPayload

app = FastAPI(
    title="CareerForge AI",
    description="AI-powered career readiness and interview preparation platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = MockAIService()

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
    job_description: UploadFile = File(...)
):

    allowed_extensions = {".pdf", ".docx"}

    resume_extension = Path(resume.filename).suffix.lower()
    job_extension = Path(job_description.filename).suffix.lower()

    if resume_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF or DOCX file."
        )

    if job_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Job description must be a PDF or DOCX file."
        )

    resume_path = Path("uploads") / resume.filename
    job_path = Path("uploads") / job_description.filename

    resume_contents = await resume.read()
    job_contents = await job_description.read()

    with open(resume_path, "wb") as f:
        f.write(resume_contents)

    with open(job_path, "wb") as f:
        f.write(job_contents)

    try:

        resume_text = extract_text(str(resume_path))
        job_text = extract_text(str(job_path))

        result = await analyze_candidate(
            resume_text=resume_text,
            job_text=job_text,
            ai_service=ai_service,
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/api/roadmap")
async def roadmap(payload: SkillGapPayload):
    return generate_skill_gap_roadmap(payload)


@app.post("/api/roadmap/legacy")
async def roadmap_legacy(skill_gaps: SkillGapResult):
    return generate_learning_roadmap(skill_gaps)