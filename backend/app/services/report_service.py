"""Report service for synthesizing complete interview scorecards and confirmed skill gaps."""

import logging
from app.core.prompts import FINAL_REPORT_SYSTEM_PROMPT
from app.models.interview import InterviewSessionState
from app.models.report import ConfirmedSkillGap, InterviewReport
from app.services.foundry_client import FoundryClient, foundry_client

logger = logging.getLogger(__name__)


class ReportService:
    """Compiles session transcripts into an executive report with confirmed standardized skill gaps."""

    def __init__(self, client: FoundryClient = foundry_client) -> None:
        self.client = client

    async def generate_report(self, session: InterviewSessionState) -> InterviewReport:
        """Synthesize overall performance, strengths, growth areas, and confirmed skill gaps."""
        answered_turns = [turn for turn in session.turns if turn.answer is not None]

        # Build human-readable transcript for the LLM
        transcript_lines: list[str] = []
        for turn in answered_turns:
            eval_info = ""
            if turn.evaluation:
                eval_info = (
                    f"  - Technical Score: {turn.evaluation.technical_score}/10\n"
                    f"  - Communication Score: {turn.evaluation.communication_score}/10\n"
                    f"  - Missing Concepts: {', '.join(turn.evaluation.missing_concepts) or 'None'}\n"
                    f"  - Detected Gaps: {', '.join(turn.evaluation.detected_gap_ids) or 'None'}"
                )
            transcript_lines.append(
                f"Turn {turn.turn_number} [Skill: {turn.question.target_skill_id}, Type: {turn.question.question_type}]:\n"
                f"Question: {turn.question.question_text}\n"
                f"Answer: {turn.answer}\n"
                f"{eval_info}"
            )

        transcript_text = "\n\n".join(transcript_lines)
        user_prompt = (
            f"Candidate Name: {session.candidate_profile.name}\n"
            f"Target Role: {session.candidate_profile.target_role}\n"
            f"Pre-identified Skill Gaps: {', '.join(session.candidate_profile.known_skill_gaps) or 'None'}\n"
            f"Confirmed Skill Gaps during interview: {', '.join(session.confirmed_skill_gaps) or 'None'}\n\n"
            f"Interview Transcript:\n{transcript_text}\n\n"
            "Generate the final executive report and confirmed skill gaps in strict JSON."
        )

        data = await self.client.generate_json(
            system_prompt=FINAL_REPORT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.4,
        )

        # Parse confirmed skill gaps from output
        raw_gaps = data.get("confirmed_skill_gaps", [])
        confirmed_gaps: list[ConfirmedSkillGap] = []
        for gap in raw_gaps:
            confirmed_gaps.append(
                ConfirmedSkillGap(
                    skill_id=gap.get("skill_id", "unknown_skill"),
                    skill_name=gap.get("skill_name", "Technical Skill"),
                    proficiency_level=gap.get("proficiency_level", "beginner"),
                    evidence=gap.get("evidence", "Demonstrated gaps during questioning"),
                    recommended_focus=gap.get("recommended_focus", "Focus on practical exercises"),
                )
            )

        return InterviewReport(
            interview_id=session.interview_id,
            candidate_id=session.candidate_profile.candidate_id,
            candidate_name=session.candidate_profile.name,
            target_role=session.candidate_profile.target_role,
            total_questions_answered=len(answered_turns),
            overall_technical_score=float(data.get("overall_technical_score", 6.0)),
            overall_communication_score=float(data.get("overall_communication_score", 6.0)),
            executive_summary=str(data.get("executive_summary", "Interview concluded successfully.")),
            strengths=data.get("strengths", []),
            growth_areas=data.get("growth_areas", []),
            confirmed_skill_gaps=confirmed_gaps,
        )


report_service = ReportService()
