from abc import ABC, abstractmethod

from app.schemas.analysis import CandidateProfile, JobProfile


class AIService(ABC):

    @abstractmethod
    async def analyze_resume(self, text: str) -> CandidateProfile:
        pass

    @abstractmethod
    async def analyze_job(self, text: str) -> JobProfile:
        pass