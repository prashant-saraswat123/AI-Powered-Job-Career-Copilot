from app.schemas.analysis import (
    RequirementMatch,
    SkillGap,
    SkillGapResult,
)


def extract_skill_gaps(
    matches: list[RequirementMatch],
) -> SkillGapResult:

    gaps = []

    for match in matches:

        if match.status in ["gap", "partial_match"]:

            gaps.append(
                SkillGap(
                    skill=match.requirement,
                    priority=match.priority,
                    required_level=match.required_level,
                    reason=match.reason,
                )
            )

    return SkillGapResult(skill_gaps=gaps)