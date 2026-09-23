"""Models for interview sessions, questions, answers, and evaluations."""

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, Field

from app.models.skill import CandidateProfile, ProficiencyLevel

QuestionType = Literal["primary", "follow_up"]
InterviewStatus = Literal["IN_PROGRESS", "COMPLETED"]


class Question(BaseModel):
    """An interview question generated for the candidate."""

    question_id: str = Field(default_factory=lambda: str(uuid4()))
    question_text: str = Field(..., description="The textual prompt or question")
    target_skill_id: str = Field(..., description="Standardized skill ID being tested")
    difficulty: ProficiencyLevel = Field(default="intermediate")
    question_type: QuestionType = Field(default="primary")
    expected_concepts: list[str] = Field(
        default_factory=list,
        description="Key technical concepts expected in a complete answer",
    )


class AnswerSubmission(BaseModel):
    """Payload submitted by the candidate for the current question."""

    answer_text: str = Field(..., min_length=1, description="Candidate's typed answer")


class EvaluationResult(BaseModel):
    """Evaluation of candidate's answer produced by gpt-4.1-mini."""

    technical_score: float = Field(..., ge=0.0, le=10.0, description="Technical accuracy (1-10)")
    communication_score: float = Field(..., ge=0.0, le=10.0, description="Clarity and articulation (1-10)")
    missing_concepts: list[str] = Field(default_factory=list, description="Omitted or incorrect concepts")
    strengths: list[str] = Field(default_factory=list, description="Demonstrated strengths in answer")
    is_satisfactory: bool = Field(..., description="True if answer meets technical expectations (score >= 6)")
    feedback_summary: str = Field(default="", description="Constructive feedback summary")
    detected_gap_ids: list[str] = Field(
        default_factory=list,
        description="Standardized skill IDs where deficiency was noted",
    )


class InterviewTurn(BaseModel):
    """A single turn in the interview (question + answer + evaluation)."""

    turn_id: str = Field(default_factory=lambda: str(uuid4()))
    turn_number: int = Field(..., ge=1)
    question: Question
    answer: str | None = None
    evaluation: EvaluationResult | None = None
    answered_at: datetime | None = None


class InterviewSessionState(BaseModel):
    """Complete state of an ongoing or completed interview session."""

    interview_id: str = Field(default_factory=lambda: str(uuid4()))
    candidate_profile: CandidateProfile
    status: InterviewStatus = Field(default="IN_PROGRESS")
    turns: list[InterviewTurn] = Field(default_factory=list)
    skills_to_test: list[str] = Field(default_factory=list)
    current_skill_index: int = Field(default=0)
    current_skill_followups: int = Field(default=0, ge=0)
    confirmed_skill_gaps: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
