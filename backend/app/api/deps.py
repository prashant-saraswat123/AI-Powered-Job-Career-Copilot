"""FastAPI dependency injection providers."""

from app.services.interview_service import InterviewService, interview_service
from app.services.skill_gap_exporter import InMemorySkillGapExporter, skill_gap_exporter
from app.storage.session_store import InterviewSessionStore, session_store


def get_session_store() -> InterviewSessionStore:
    """Provide the active session storage instance."""
    return session_store


def get_interview_service() -> InterviewService:
    """Provide the interview service instance."""
    return interview_service


def get_skill_gap_exporter() -> InMemorySkillGapExporter:
    """Provide the skill gap exporter instance."""
    return skill_gap_exporter
