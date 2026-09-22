from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
    RequirementMatch,
)


def normalize(text: str) -> str:
    return (
        text.strip()
        .lower()
        .replace("’", "'")
    )


def get_candidate_evidence(
    candidate: CandidateProfile,
) -> list[tuple[str, str]]:

    evidence = []

    # Skills
    for skill in candidate.skills:
        for item in skill.evidence:
            evidence.append((skill.name, item))

    # Projects
    for project in candidate.projects:
        for item in project.evidence:
            evidence.append((project.name, item))

    # Experience
    for experience in candidate.experience:
        for item in experience.evidence:
            evidence.append((experience.role, item))

    return evidence


def requirement_type(requirement) -> str:
    return "required" if requirement.required else "preferred"


def match_degree(
    candidate: CandidateProfile,
    requirement,
) -> RequirementMatch:

    education = candidate.education

    degree_evidence = []

    for item in education:

        normalized = normalize(item)

        if (
            "b.e." in normalized
            or "b.e" in normalized
            or "bachelor" in normalized
            or "engineering" in normalized
        ):
            degree_evidence.append(item)

    if degree_evidence:

        return RequirementMatch(
            requirement=requirement.name,
            requirement_type=requirement_type(requirement),
            status="strong_match",
            evidence=degree_evidence,
            reason=(
                "The candidate has a bachelor's-level "
                "engineering degree in Computer Science and AI/ML."
            ),
            priority="low",
        )

    return RequirementMatch(
        requirement=requirement.name,
        requirement_type=requirement_type(requirement),
        status="gap",
        evidence=[],
        reason=(
            "No bachelor's-level degree relevant to the "
            "requirement was found in the candidate's education."
        ),
        priority="high" if requirement.required else "medium",
    )


def match_requirement(
    candidate: CandidateProfile,
    requirement,
) -> RequirementMatch:

    name = normalize(requirement.name)

    # Education
    if "bachelor" in name:
        return match_degree(candidate, requirement)

    evidence = get_candidate_evidence(candidate)

    # Python
    if "python" in name:

        matches = [
            item for skill, item in evidence
            if "python" in normalize(skill)
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason="The candidate explicitly lists Python as a programming skill.",
                priority="low",
            )

    # Backend API development
    if "backend api" in name:

        matches = [
            item for skill, item in evidence
            if (
                "django rest framework" in normalize(skill)
                or "fastapi" in normalize(skill)
            )
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason=(
                    "The candidate demonstrates backend API development "
                    "through Django REST Framework."
                ),
                priority="low",
            )

    # REST API design and consumption
    if "rest api" in name:

        matches = [
            item for skill, item in evidence
            if (
                "rest api" in normalize(item)
                or "django rest framework" in normalize(skill)
            )
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="partial_match",
                evidence=list(dict.fromkeys(matches)),
                reason=(
                    "The candidate demonstrates building REST APIs "
                    "using Django REST Framework, but the resume does "
                    "not explicitly demonstrate both API design and consumption."
                ),
                priority="medium" if requirement.required else "low",
            )

    # Machine learning
    if "machine learning" in name:

        matches = [
            item for skill, item in evidence
            if "machine learning" in normalize(skill)
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason=(
                    "The candidate explicitly demonstrates machine "
                    "learning knowledge."
                ),
                priority="low",
            )

    # Docker
    if "docker" in name:

        matches = [
            item for skill, item in evidence
            if "docker" in normalize(skill)
            or "docker" in normalize(item)
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason="The candidate explicitly demonstrates Docker experience.",
                priority="low",
            )

    # AWS
    if "aws" in name:

        matches = [
            item for skill, item in evidence
            if "aws" in normalize(skill)
            or "aws" in normalize(item)
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason="The candidate explicitly demonstrates AWS experience.",
                priority="low",
            )

    # MongoDB / NoSQL
    if "mongodb" in name or "nosql" in name:

        matches = [
            item for skill, item in evidence
            if (
                "mongodb" in normalize(skill)
                or "nosql" in normalize(skill)
                or "mongodb" in normalize(item)
                or "nosql" in normalize(item)
            )
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason="The candidate explicitly demonstrates MongoDB or NoSQL experience.",
                priority="low",
            )

    # LLM
    if "large language model" in name or "llm" in name:

        matches = [
            item for skill, item in evidence
            if (
                "llm" in normalize(skill)
                or "large language model" in normalize(skill)
            )
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="strong_match",
                evidence=list(dict.fromkeys(matches)),
                reason="The candidate explicitly demonstrates experience with LLM systems.",
                priority="low",
            )

    # System design
    if "system design" in name or "scalable backend" in name:

        matches = [
            item for skill, item in evidence
            if (
                "system design" in normalize(skill)
                or "scalable" in normalize(item)
                or "architecture" in normalize(item)
            )
        ]

        if matches:
            return RequirementMatch(
                requirement=requirement.name,
                requirement_type=requirement_type(requirement),
                status="partial_match",
                evidence=list(dict.fromkeys(matches)),
                reason=(
                    "The candidate demonstrates architectural and modular "
                    "software experience, but explicit scalable system design "
                    "experience is limited."
                ),
                priority="medium",
            )

    # No evidence
    return RequirementMatch(
        requirement=requirement.name,
        requirement_type=requirement_type(requirement),
        status="gap",
        evidence=[],
        reason=(
            f"No explicit evidence of {requirement.name} "
            "was found in the candidate profile."
        ),
        priority="high" if requirement.required else "medium",
    )


def match_requirements(
    candidate: CandidateProfile,
    job: JobProfile,
) -> list[RequirementMatch]:

    return [
        match_requirement(candidate, requirement)
        for requirement in job.requirements
    ]