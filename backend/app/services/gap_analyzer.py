from app.schemas.analysis import (
    RequirementMatch,
    SkillGap,
    SkillGapResult,
)


def extract_skill_gaps(
    requirement_analysis: list[RequirementMatch],
) -> SkillGapResult:

    skill_gaps : list[SkillGap] = []

    for match in requirement_analysis:
        if match.requirement_kind != "skill":
            continue

        if match.status not in ["gap", "partial_match"]:
            continue

        skill_gaps.append(
            SkillGap(
                skill=match.requirement,
                priority=match.priority,
                required_level=match.required_level,
                reason=match.reason,
            )
        )

    return SkillGapResult(skill_gaps=skill_gaps)