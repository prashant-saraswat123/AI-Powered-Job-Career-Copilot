"""Models for post-interview reporting and confirmed skill gaps."""

from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.models.skill import ProficiencyLevel


class ConfirmedSkillGap(BaseModel):
    """A verified skill gap identified during the interview, using standardized skill_id."""

    skill_id: str = Field(..., description="Standardized lowercase skill identifier (e.g. 'python_async')")
    skill_name: str = Field(..., description="Human-readable skill title")
    proficiency_level: ProficiencyLevel = Field(
        default="beginner",
        description="Assessed current level in this skill area",
    )
    evidence: str = Field(..., description="Summary of specific deficiencies demonstrated in answers")
    recommended_focus: str = Field(..., description="Actionable recommendations for closing this gap")


class InterviewReport(BaseModel):
    """Comprehensive final report generated after interview conclusion."""

    interview_id: str
    candidate_id: str
    candidate_name: str
    target_role: str
    total_questions_answered: int
    overall_technical_score: float = Field(..., ge=0.0, le=10.0)
    overall_communication_score: float = Field(..., ge=0.0, le=10.0)
    executive_summary: str
    strengths: list[str] = Field(default_factory=list)
    growth_areas: list[str] = Field(default_factory=list)
    confirmed_skill_gaps: list[ConfirmedSkillGap] = Field(default_factory=list)
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
