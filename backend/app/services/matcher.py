from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
    RequirementMatch,
)


def normalize(text: str) -> str:
    return text.strip().lower()


def get_candidate_skills(candidate: CandidateProfile) -> dict[str, list[str]]:
    skills = {}

    for skill in candidate.skills:
        skills[normalize(skill.name)] = skill.evidence

    return skills


def match_requirements(
    candidate: CandidateProfile,
    job: JobProfile
) -> list[RequirementMatch]:

    candidate_skills = get_candidate_skills(candidate)

    matches = []

    for requirement in job.requirements:

        requirement_name = normalize(requirement.name)

        if requirement_name in candidate_skills:

            matches.append(
                RequirementMatch(
                    requirement=requirement.name,
                    requirement_type=(
                        "required" if requirement.required else "preferred"
                    ),
                    status="strong_match",
                    evidence=candidate_skills[requirement_name],
                    reason=(
                        f"The candidate explicitly demonstrates "
                        f"{requirement.name}."
                    ),
                    priority="low"
                )
            )

        else:

            priority = (
                "high" if requirement.required else "medium"
            )

            matches.append(
                RequirementMatch(
                    requirement=requirement.name,
                    requirement_type=(
                        "required" if requirement.required else "preferred"
                    ),
                    status="gap",
                    evidence=[],
                    reason=(
                        f"No explicit evidence of "
                        f"{requirement.name} was found."
                    ),
                    priority=priority
                )
            )

    return matches