"""Evaluation service for scoring candidate answers using gpt-4.1-mini."""

import logging
from app.core.prompts import ANSWER_EVALUATION_SYSTEM_PROMPT
from app.models.interview import EvaluationResult, Question
from app.services.foundry_client import FoundryClient, foundry_client

logger = logging.getLogger(__name__)


class EvaluationService:
    """Evaluates candidate answers for technical depth, communication, and missing concepts."""

    def __init__(self, client: FoundryClient = foundry_client) -> None:
        self.client = client

    async def evaluate_answer(
        self,
        question: Question,
        answer_text: str,
        target_role: str,
    ) -> EvaluationResult:
        """Score candidate answer and detect missing concepts."""
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Target Skill ID: {question.target_skill_id}\n"
            f"Difficulty: {question.difficulty}\n"
            f"Interview Question: {question.question_text}\n"
            f"Expected Key Concepts: {', '.join(question.expected_concepts) if question.expected_concepts else 'N/A'}\n"
            f"Candidate's Answer: {answer_text}\n\n"
            "Please evaluate this answer according to your criteria and return JSON."
        )

        data = await self.client.generate_json(
            system_prompt=ANSWER_EVALUATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,  # Lower temperature for consistent, objective grading
        )

        # Enforce score boundaries
        tech_score = max(0.0, min(10.0, float(data.get("technical_score", 5.0))))
        comm_score = max(0.0, min(10.0, float(data.get("communication_score", 5.0))))

        return EvaluationResult(
            technical_score=tech_score,
            communication_score=comm_score,
            missing_concepts=data.get("missing_concepts", []),
            strengths=data.get("strengths", []),
            is_satisfactory=bool(data.get("is_satisfactory", tech_score >= 6.0)),
            feedback_summary=str(data.get("feedback_summary", "")),
            detected_gap_ids=data.get("detected_gap_ids", []),
        )


evaluation_service = EvaluationService()
