from app.ai.base import AIService
from app.schemas.analysis import AnalysisResult
from app.services.matcher import match_requirements
from app.services.gap_analyzer import extract_skill_gaps
from app.services.roadmap_service import generate_learning_roadmap


async def analyze_candidate(
    resume_text: str,
    job_text: str,
    ai_service: AIService,
) -> AnalysisResult:

    candidate_profile = await ai_service.analyze_resume(resume_text)

    job_profile = await ai_service.analyze_job(job_text)

    requirement_analysis = match_requirements(
        candidate_profile,
        job_profile
    )

    skill_gaps = extract_skill_gaps(
        requirement_analysis
    )

    learning_roadmap = generate_learning_roadmap(skill_gaps)

    return AnalysisResult(
        candidate_profile=candidate_profile,
        job_profile=job_profile,
        requirement_analysis=requirement_analysis,
        skill_gaps=skill_gaps,
        learning_roadmap=learning_roadmap,
    )