from pydantic import BaseModel
from typing import Literal

class Project(BaseModel):
    name: str
    description: str = ""
    skills: list[str] = []
    evidence: list[str] = []


class Experience(BaseModel):
    company: str
    role: str
    description: str = ""
    skills: list[str] = []
    evidence: list[str] = []


class Skill(BaseModel):
    name: str
    category: str | None = None
    evidence: list[str] = []


class CandidateProfile(BaseModel):
    name: str | None = None

    skills: list[Skill] = []

    experience: list[Experience] = []
    projects: list[Project] = []

    education: list[str] = []
    certifications: list[str] = []
    achievements: list[str] = []

class JobRequirement(BaseModel):
    name: str
    category: str | None = None
    required: bool = True
    description: str = ""


class JobProfile(BaseModel):
    title: str = ""

    requirements: list[JobRequirement] = []

    responsibilities: list[str] = []
    experience_requirements: list[str] = []
    education_requirements: list[str] = []

    certifications: list[str] = []


MatchStatus = Literal[
    "strong_match",
    "partial_match",
    "gap"
]

Priority = Literal[
    "high",
    "medium",
    "low"
]


class RequirementMatch(BaseModel):
    requirement: str
    requirement_type: Literal["required", "preferred"]

    status: MatchStatus

    evidence: list[str] = []

    reason: str

    priority: Priority

    required_level: str | None = None


class SkillGap(BaseModel):
    skill: str
    priority: Priority
    required_level: str | None = None
    reason: str


class SkillGapResult(BaseModel):
    skill_gaps: list[SkillGap] = []


class LearningResource(BaseModel):
    title: str
    url: str
    type: str = "resource"
    description: str = ""


class RoadmapItem(BaseModel):
    skill: str
    priority: Priority
    required_level: str | None = None
    reason: str
    learning_sequence: list[str] = []
    resources: list[LearningResource] = []
    practice_tasks: list[str] = []


class LearningRoadmap(BaseModel):
    roadmap: list[RoadmapItem] = []


class AnalysisResult(BaseModel):
    candidate_profile: CandidateProfile
    job_profile: JobProfile
    requirement_analysis: list[RequirementMatch]
    skill_gaps: SkillGapResult
    learning_roadmap: LearningRoadmap | None = None