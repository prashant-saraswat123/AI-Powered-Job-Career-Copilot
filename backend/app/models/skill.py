"""Models representing skills, candidate profiles, and standardized skill IDs."""

from typing import Literal
from pydantic import BaseModel, Field

ProficiencyLevel = Literal["beginner", "intermediate", "advanced"]


class SkillItem(BaseModel):
    """Represents a specific candidate skill with proficiency."""

    skill_id: str = Field(..., description="Standardized lowercase slug ID (e.g. 'python_async')")
    skill_name: str = Field(..., description="Human-readable name of the skill")
    proficiency_level: ProficiencyLevel = Field(default="intermediate")


class CandidateProfile(BaseModel):
    """Profile of the candidate entering the interview."""

    candidate_id: str = Field(..., description="Unique ID of the candidate")
    name: str = Field(..., description="Candidate's full name")
    target_role: str = Field(..., description="Target role (e.g. 'Backend Software Engineer')")
    years_of_experience: float = Field(default=1.0, ge=0.0)
    skills: list[SkillItem] = Field(default_factory=list, description="Claimed candidate skills")
    known_skill_gaps: list[str] = Field(
        default_factory=list,
        description="List of standardized skill_ids pre-identified as potential gaps",
    )
