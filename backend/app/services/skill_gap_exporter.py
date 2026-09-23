"""Standardized interface and default exporter for confirmed skill gaps."""

import logging
from typing import Protocol, runtime_checkable
from app.models.report import ConfirmedSkillGap

logger = logging.getLogger(__name__)


@runtime_checkable
class SkillGapExporter(Protocol):
    """Protocol for delivering confirmed skill gaps to external consumers (e.g. Roadmap team)."""

    async def export(
        self,
        candidate_id: str,
        interview_id: str,
        gaps: list[ConfirmedSkillGap],
    ) -> bool:
        """Export confirmed skill gaps for downstream roadmap generation."""
        ...


class InMemorySkillGapExporter:
    """Default non-blocking in-memory exporter ready to be swapped for the Roadmap team API."""

    def __init__(self) -> None:
        self.exported_batches: list[dict] = []

    async def export(
        self,
        candidate_id: str,
        interview_id: str,
        gaps: list[ConfirmedSkillGap],
    ) -> bool:
        payload = {
            "candidate_id": candidate_id,
            "interview_id": interview_id,
            "confirmed_skill_gaps": [gap.model_dump() for gap in gaps],
        }
        self.exported_batches.append(payload)
        logger.info(
            "Exported %d confirmed skill gaps for candidate %s in interview %s",
            len(gaps),
            candidate_id,
            interview_id,
        )
        return True


skill_gap_exporter = InMemorySkillGapExporter()
