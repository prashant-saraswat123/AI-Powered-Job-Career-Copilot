from enum import Enum
from pydantic import BaseModel, Field


class RoadmapGap(BaseModel):
    gap_id: str
    title: str
    category: str
    priority: str
    reason: str
    required_level: str | None = None


class RoadmapRequest(BaseModel):
    candidate_name: str | None = None
    target_role: str
    target_company: str | None = None
    gaps: list[RoadmapGap] = Field(default_factory=list)
    weekly_hours_available: int = 10
    sprint_weeks: int = 4


class MilestoneStatus(str, Enum):
    completed = "completed"
    in_progress = "in_progress"
    ready = "ready"
    queued = "queued"
    locked = "locked"


class Milestone(BaseModel):
    id: str
    code: str
    title: str
    description: str
    effort_hours: float
    status: MilestoneStatus
    tags: list[str] = Field(default_factory=list)
    gap_id: str | None = None
    gap_text: str
    why_text: str
    artifact_text: str
    is_done: bool = False


class Phase(BaseModel):
    phase_number: int
    week_label: str
    title: str
    focus: str
    category: str
    completion_pct: int = 0
    milestones: list[Milestone]


class RoadmapMeta(BaseModel):
    role_title: str
    tagline: str
    sprint_weeks: int
    total_milestones: int
    projected_artifacts: int
    gap_categories: list[str]


class RoadmapResponse(BaseModel):
    roadmap_id: str
    meta: RoadmapMeta
    phases: list[Phase]