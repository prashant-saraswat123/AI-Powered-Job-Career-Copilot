"""Adaptive engine for interview branching, follow-ups, and progression."""

from enum import Enum
from app.models.interview import EvaluationResult, InterviewSessionState


class AdaptiveAction(str, Enum):
    """Next action decided by the adaptive logic."""

    FOLLOW_UP = "FOLLOW_UP"
    ADVANCE_NEXT_SKILL = "ADVANCE_NEXT_SKILL"
    CONFIRM_GAP_AND_ADVANCE = "CONFIRM_GAP_AND_ADVANCE"
    COMPLETE_INTERVIEW = "COMPLETE_INTERVIEW"


class AdaptiveDecision:
    """Outcome of the adaptive engine evaluation."""

    def __init__(
        self,
        action: AdaptiveAction,
        target_skill_id: str | None = None,
        reason: str = "",
    ) -> None:
        self.action = action
        self.target_skill_id = target_skill_id
        self.reason = reason


class AdaptiveEngine:
    """Decision engine that directs interview flow based on candidate performance."""

    MAX_FOLLOWUPS_PER_SKILL: int = 2
    PASSING_TECHNICAL_SCORE: float = 6.0

    def evaluate_next_step(
        self,
        session: InterviewSessionState,
        latest_evaluation: EvaluationResult,
    ) -> AdaptiveDecision:
        """Determine whether to ask a follow-up, advance to a new skill, or finish."""
        current_skill_id = (
            session.skills_to_test[session.current_skill_index]
            if session.current_skill_index < len(session.skills_to_test)
            else None
        )

        is_weak_answer = (
            latest_evaluation.technical_score < self.PASSING_TECHNICAL_SCORE
            or not latest_evaluation.is_satisfactory
        )

        if is_weak_answer:
            if session.current_skill_followups < self.MAX_FOLLOWUPS_PER_SKILL:
                return AdaptiveDecision(
                    action=AdaptiveAction.FOLLOW_UP,
                    target_skill_id=current_skill_id,
                    reason=(
                        f"Technical score {latest_evaluation.technical_score:.1f} < {self.PASSING_TECHNICAL_SCORE}. "
                        f"Asking follow-up {session.current_skill_followups + 1}/{self.MAX_FOLLOWUPS_PER_SKILL}."
                    ),
                )
            else:
                # Max followups reached on this skill without passing -> confirm gap and move on
                next_index = session.current_skill_index + 1
                if next_index < len(session.skills_to_test):
                    return AdaptiveDecision(
                        action=AdaptiveAction.CONFIRM_GAP_AND_ADVANCE,
                        target_skill_id=session.skills_to_test[next_index],
                        reason=(
                            f"Max follow-ups reached for '{current_skill_id}'. "
                            f"Confirming skill gap and advancing to '{session.skills_to_test[next_index]}'."
                        ),
                    )
                return AdaptiveDecision(
                    action=AdaptiveAction.COMPLETE_INTERVIEW,
                    reason=f"Max follow-ups reached for final skill '{current_skill_id}'. Concluding interview.",
                )

        # Answer was satisfactory (>= 6.0)
        next_index = session.current_skill_index + 1
        if next_index < len(session.skills_to_test):
            return AdaptiveDecision(
                action=AdaptiveAction.ADVANCE_NEXT_SKILL,
                target_skill_id=session.skills_to_test[next_index],
                reason=(
                    f"Satisfactory answer (score {latest_evaluation.technical_score:.1f}). "
                    f"Advancing to next skill '{session.skills_to_test[next_index]}'."
                ),
            )

        return AdaptiveDecision(
            action=AdaptiveAction.COMPLETE_INTERVIEW,
            reason="All planned skills assessed. Concluding interview.",
        )


adaptive_engine = AdaptiveEngine()
