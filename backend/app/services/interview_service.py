"""Interview service orchestrating question generation, answer evaluation, and adaptive flows."""

from datetime import datetime, timezone
import logging
from app.core.prompts import FOLLOW_UP_QUESTION_SYSTEM_PROMPT, QUESTION_GENERATION_SYSTEM_PROMPT
from app.models.interview import (
    EvaluationResult,
    InterviewSessionState,
    InterviewTurn,
    Question,
)
from app.models.report import InterviewReport
from app.models.skill import CandidateProfile
from app.services.adaptive_engine import AdaptiveAction, AdaptiveEngine, adaptive_engine
from app.services.evaluation_service import EvaluationService, evaluation_service
from app.services.foundry_client import FoundryClient, foundry_client
from app.services.report_service import ReportService, report_service
from app.services.skill_gap_exporter import InMemorySkillGapExporter, SkillGapExporter, skill_gap_exporter
from app.storage.session_store import InterviewSessionStore, session_store

logger = logging.getLogger(__name__)

DEFAULT_SKILLS_FALLBACK = ["python_fundamentals", "fastapi_routing", "sql_indexing"]


class InterviewService:
    """Coordinates the end-to-end interview lifecycle."""

    def __init__(
        self,
        store: InterviewSessionStore = session_store,
        foundry: FoundryClient = foundry_client,
        evaluator: EvaluationService = evaluation_service,
        adaptive: AdaptiveEngine = adaptive_engine,
        reporter: ReportService = report_service,
        exporter: SkillGapExporter = skill_gap_exporter,
    ) -> None:
        self.store = store
        self.foundry = foundry
        self.evaluator = evaluator
        self.adaptive = adaptive
        self.reporter = reporter
        self.exporter = exporter

    async def start_interview(self, candidate_profile: CandidateProfile) -> tuple[InterviewSessionState, Question]:
        """Initialize session, determine prioritized skills, and generate the initial question."""
        # Prioritize known skill gaps first, followed by other candidate skills
        skills_to_test: list[str] = []
        for gap in candidate_profile.known_skill_gaps:
            if gap and gap not in skills_to_test:
                skills_to_test.append(gap)

        for skill in candidate_profile.skills:
            if skill.skill_id and skill.skill_id not in skills_to_test:
                skills_to_test.append(skill.skill_id)

        if not skills_to_test:
            skills_to_test = DEFAULT_SKILLS_FALLBACK.copy()

        first_skill_id = skills_to_test[0]
        first_question = await self._generate_primary_question(
            skill_id=first_skill_id,
            target_role=candidate_profile.target_role,
            difficulty="intermediate",
        )

        initial_turn = InterviewTurn(
            turn_number=1,
            question=first_question,
        )

        session = InterviewSessionState(
            candidate_profile=candidate_profile,
            status="IN_PROGRESS",
            turns=[initial_turn],
            skills_to_test=skills_to_test,
            current_skill_index=0,
            current_skill_followups=0,
            confirmed_skill_gaps=[],
        )

        self.store.create(session)
        logger.info("Started interview %s for candidate %s", session.interview_id, candidate_profile.name)
        return session, first_question

    async def submit_answer(
        self,
        interview_id: str,
        answer_text: str,
    ) -> tuple[InterviewSessionState, EvaluationResult, Question | None]:
        """Evaluate submitted answer, update state, and generate the next question adaptively."""
        session = self.store.get(interview_id)
        if not session:
            raise ValueError(f"Interview session '{interview_id}' not found.")
        if session.status != "IN_PROGRESS":
            raise ValueError(f"Interview session '{interview_id}' is already {session.status}.")

        current_turn = session.turns[-1]
        if current_turn.answer is not None:
            raise ValueError(f"Turn {current_turn.turn_number} already has an answer submitted.")

        # 1. Evaluate the answer
        evaluation = await self.evaluator.evaluate_answer(
            question=current_turn.question,
            answer_text=answer_text,
            target_role=session.candidate_profile.target_role,
        )

        # Update current turn
        current_turn.answer = answer_text
        current_turn.evaluation = evaluation
        current_turn.answered_at = datetime.now(timezone.utc)

        # Record any identified gap IDs
        for gap_id in evaluation.detected_gap_ids:
            if gap_id not in session.confirmed_skill_gaps:
                session.confirmed_skill_gaps.append(gap_id)

        # 2. Consult Adaptive Engine for next action
        decision = self.adaptive.evaluate_next_step(session, evaluation)
        logger.info("Interview %s adaptive decision: %s (%s)", interview_id, decision.action, decision.reason)

        next_question: Question | None = None

        if decision.action == AdaptiveAction.FOLLOW_UP:
            session.current_skill_followups += 1
            next_question = await self._generate_follow_up_question(
                previous_question=current_turn.question,
                candidate_answer=answer_text,
                evaluation=evaluation,
            )
            session.turns.append(
                InterviewTurn(
                    turn_number=len(session.turns) + 1,
                    question=next_question,
                )
            )

        elif decision.action == AdaptiveAction.CONFIRM_GAP_AND_ADVANCE:
            # Confirm current skill as a gap
            if session.current_skill_index < len(session.skills_to_test):
                current_skill_id = session.skills_to_test[session.current_skill_index]
                if current_skill_id not in session.confirmed_skill_gaps:
                    session.confirmed_skill_gaps.append(current_skill_id)

            session.current_skill_index += 1
            session.current_skill_followups = 0

            if session.current_skill_index < len(session.skills_to_test):
                next_skill_id = session.skills_to_test[session.current_skill_index]
                next_question = await self._generate_primary_question(
                    skill_id=next_skill_id,
                    target_role=session.candidate_profile.target_role,
                    difficulty="intermediate",
                )
                session.turns.append(
                    InterviewTurn(
                        turn_number=len(session.turns) + 1,
                        question=next_question,
                    )
                )
            else:
                session.status = "COMPLETED"

        elif decision.action == AdaptiveAction.ADVANCE_NEXT_SKILL:
            session.current_skill_index += 1
            session.current_skill_followups = 0

            if session.current_skill_index < len(session.skills_to_test):
                next_skill_id = session.skills_to_test[session.current_skill_index]
                next_question = await self._generate_primary_question(
                    skill_id=next_skill_id,
                    target_role=session.candidate_profile.target_role,
                    difficulty="intermediate",
                )
                session.turns.append(
                    InterviewTurn(
                        turn_number=len(session.turns) + 1,
                        question=next_question,
                    )
                )
            else:
                session.status = "COMPLETED"

        elif decision.action == AdaptiveAction.COMPLETE_INTERVIEW:
            if not evaluation.is_satisfactory or evaluation.technical_score < 6.0:
                if session.current_skill_index < len(session.skills_to_test):
                    curr_skill = session.skills_to_test[session.current_skill_index]
                    if curr_skill not in session.confirmed_skill_gaps:
                        session.confirmed_skill_gaps.append(curr_skill)
            session.status = "COMPLETED"

        session.updated_at = datetime.now(timezone.utc)
        self.store.update(session)

        return session, evaluation, next_question

    async def end_interview(self, interview_id: str) -> InterviewReport:
        """Conclude interview session, generate final report, and export confirmed skill gaps."""
        session = self.store.get(interview_id)
        if not session:
            raise ValueError(f"Interview session '{interview_id}' not found.")

        session.status = "COMPLETED"
        session.updated_at = datetime.now(timezone.utc)

        report = await self.reporter.generate_report(session)

        # Export skill gaps via decoupled interface
        await self.exporter.export(
            candidate_id=session.candidate_profile.candidate_id,
            interview_id=session.interview_id,
            gaps=report.confirmed_skill_gaps,
        )

        self.store.update(session)
        return report

    def get_session(self, interview_id: str) -> InterviewSessionState:
        """Retrieve current session state."""
        session = self.store.get(interview_id)
        if not session:
            raise ValueError(f"Interview session '{interview_id}' not found.")
        return session

    # Helper question generation methods
    async def _generate_primary_question(
        self,
        skill_id: str,
        target_role: str,
        difficulty: str = "intermediate",
    ) -> Question:
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Target Skill ID: {skill_id}\n"
            f"Difficulty Level: {difficulty}\n\n"
            "Please generate a targeted scenario interview question in JSON."
        )

        data = await self.foundry.generate_json(
            system_prompt=QUESTION_GENERATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,
        )

        return Question(
            question_text=data.get("question_text", f"Explain how you work with {skill_id} in production."),
            target_skill_id=data.get("target_skill_id", skill_id),
            difficulty=data.get("difficulty", difficulty),
            question_type="primary",
            expected_concepts=data.get("expected_concepts", []),
        )

    async def _generate_follow_up_question(
        self,
        previous_question: Question,
        candidate_answer: str,
        evaluation: EvaluationResult,
    ) -> Question:
        missing_text = ", ".join(evaluation.missing_concepts) or "deeper technical mechanisms"
        user_prompt = (
            f"Target Skill ID: {previous_question.target_skill_id}\n"
            f"Previous Question: {previous_question.question_text}\n"
            f"Candidate Answer: {candidate_answer}\n"
            f"Missing Concepts to Probe: {missing_text}\n\n"
            "Generate a constructive follow-up probing question in JSON."
        )

        data = await self.foundry.generate_json(
            system_prompt=FOLLOW_UP_QUESTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.6,
        )

        return Question(
            question_text=data.get(
                "question_text",
                f"Could you elaborate more specifically on {missing_text}?",
            ),
            target_skill_id=previous_question.target_skill_id,
            difficulty=previous_question.difficulty,
            question_type="follow_up",
            expected_concepts=data.get("expected_concepts", evaluation.missing_concepts),
        )


interview_service = InterviewService()
