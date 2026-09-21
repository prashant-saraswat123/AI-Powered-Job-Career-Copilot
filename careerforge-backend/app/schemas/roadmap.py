from typing import Literal

from pydantic import BaseModel, Field


Priority = Literal["HIGH", "MEDIUM", "LOW"]


class SkillGapInput(BaseModel):
    skill: str
    priority: Priority
    requiredLevel: str | None = None


class SkillGapPayload(BaseModel):
    skillGaps: list[SkillGapInput] = Field(default_factory=list)


class RoadmapResource(BaseModel):
    title: str
    url: str


class RoadmapItem(BaseModel):
    skill: str
    priority: Priority
    requiredLevel: str | None = None
    topics: list[str] = []
    resources: list[RoadmapResource] = []
    practice: list[str] = []


class RoadmapResponse(BaseModel):
    roadmap: list[RoadmapItem] = []
