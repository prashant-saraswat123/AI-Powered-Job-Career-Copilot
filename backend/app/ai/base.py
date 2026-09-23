from abc import ABC, abstractmethod

from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
    RequirementMatch,
)


class AIService(ABC):

    @abstractmethod
    async def analyze_resume(self, text: str) -> CandidateProfile:
        pass

    @abstractmethod
    async def analyze_job(self, text: str) -> JobProfile:
        pass

    @abstractmethod
    async def match_requirements(
        self,
        candidate: CandidateProfile,
        job: JobProfile,
    ) -> list[RequirementMatch]:
        pass