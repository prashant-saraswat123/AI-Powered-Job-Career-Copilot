import json
import os

os.environ["PATH"] += os.pathsep + r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"

from azure.ai.projects import AIProjectClient
from azure.identity import AzureCliCredential

from app.ai.base import AIService
from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
    RequirementMatch,
)


class FoundryAIService(AIService):

    def __init__(self):
        self.endpoint = os.getenv("FOUNDRY_PROJECT_ENDPOINT")
        self.model = os.getenv("FOUNDRY_MODEL")

        if not self.endpoint:
            raise ValueError("FOUNDRY_PROJECT_ENDPOINT is not set")

        if not self.model:
            raise ValueError("FOUNDRY_MODEL is not set")

        credential = AzureCliCredential(
            process_timeout=30
        )

        self.project = AIProjectClient(
            endpoint=self.endpoint,
            credential=credential,
        )

        self.client = self.project.get_openai_client()

    async def analyze_resume(self, text: str) -> CandidateProfile:

        system_prompt = """
You are CareerForge AI, a career analysis system.

Your task is to extract a structured candidate profile ONLY from the
candidate's resume text provided by the user.

The input is a RESUME, not a job description.

Return ONLY valid JSON matching this structure:

{
  "name": "string or null",
  "skills": [
    {
      "name": "string",
      "category": "string or null",
      "evidence": ["evidence directly supported by the resume"]
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "description": "string",
      "skills": ["skills demonstrated in this experience"],
      "evidence": ["evidence directly supported by the resume"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "skills": ["skills demonstrated in this project"],
      "evidence": ["evidence directly supported by the resume"]
    }
  ],
  "education": ["education explicitly listed on the resume"],
  "certifications": ["certifications explicitly listed on the resume"],
  "achievements": ["achievements explicitly listed on the resume"]
}

CRITICAL RULES:

1. Extract information ONLY from the supplied resume text.

2. NEVER extract requirements, skills, responsibilities, qualifications,
   or other information from a job description.

3. Do not invent candidate information.

4. A skill should be included only when the resume provides evidence
   that the candidate possesses, studied, practiced, or used that skill.

5. Preserve concrete evidence from:
   - work experience
   - internships
   - projects
   - technical implementations
   - education
   - coursework
   - certifications
   - training

6. Use the complete resume. Do not omit relevant information simply
   because it does not fit naturally into the skills list.

7. EDUCATION PRESERVATION:

   Preserve all explicit education information from the resume.

   This includes:
   - degree or program name
   - field of study
   - institution
   - start and end dates
   - current or pursuing status
   - expected graduation
   - CGPA
   - GPA
   - grades
   - academic performance
   - relevant coursework
   - ongoing academic programs
   - academic cohorts or formal training programs

   Do not omit a degree, institution, CGPA, or coursework.

8. ACADEMIC KNOWLEDGE:

   If the resume explicitly lists a subject as coursework, education,
   training, or an academic area of study, preserve it as evidence.

   For example, if the resume states:

   "Computer Networks fundamentals"

   retain that information in the candidate profile.

   Do not invent practical experience from coursework, but do not discard
   the coursework either.

9. Preserve the candidate's actual projects and experience.

10. Do not replace real projects or experience with generic descriptions.

11. Do not turn generic job-description-style statements into candidate
    evidence.

12. Evidence must be directly supported by the resume.

13. You may closely paraphrase resume content, but do not add new claims.

14. Do not copy job-description wording into the candidate profile.

15. If information is not present in the resume, leave it out or return
    an empty list.

16. Do not infer years of experience, seniority, professional experience,
    leadership, or practical expertise unless supported by the resume.

17. Coursework can demonstrate academic knowledge, but coursework alone
    must not be represented as professional work experience.

18. Return exactly one candidate profile and nothing else.

DEGREE EXTRACTION IS MANDATORY:

If the resume contains a formal degree, you MUST include it in
candidate.education.

Preserve:
- exact degree name
- field/major
- institution
- start year
- expected graduation year
- current/pursuing status
- CGPA/GPA if provided

A formal degree must not be omitted merely because other education,
coursework, cohorts, or training programs are also present.

Do not replace a formal degree with coursework or training.

If multiple education entries exist, preserve all of them.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            response_format={
                "type": "json_object"
            },
        )

        content = response.choices[0].message.content

        return CandidateProfile.model_validate_json(content)

    async def analyze_job(self, text: str) -> JobProfile:

        system_prompt = """
You are CareerForge AI, a career analysis system.

Analyze the job description and extract its structured requirements.

Return ONLY valid JSON matching this structure:

{
  "title": "string",
  "requirements": [
    {
      "name": "string",
      "category": "string or null",
      "required": true,
      "description": "string",
      "requirement_type":
        "skill | qualification | experience | certification | other"
    }
  ],
  "responsibilities": ["string"],
  "experience_requirements": ["string"],
  "education_requirements": ["string"],
  "certifications": ["string"]
}

REQUIREMENT EXTRACTION RULES:

1. Extract requirements explicitly stated or clearly implied by the
   job description.

2. Mark required=true only when the job description presents the
   requirement as required, essential, mandatory, or equivalent.

3. Mark preferred, desirable, nice-to-have, or bonus requirements
   as required=false.

4. Do not invent requirements.

5. Keep requirement names concise while preserving their meaning.

6. Preserve the meaning of the original job description.

7. Do not combine unrelated requirements into one requirement.

8. Preserve important technical or qualification details when they
   affect what the candidate is expected to demonstrate.

REQUIREMENT TYPE:

For every requirement, determine what kind of requirement it represents.

Use exactly one:

- "skill"
  A learnable or demonstrable skill, capability, competency,
  knowledge area, technology, tool, method, or professional capability.

- "qualification"
  A formal educational or professional qualification.

- "experience"
  A requirement primarily about previous work experience,
  years of experience, role experience, industry experience,
  or professional exposure.

- "certification"
  A specific professional certification, license, or credential.

- "other"
  A requirement that does not reasonably fit the categories above.

Determine the type from the meaning and context.

Do NOT classify based only on the section/category name.

A formal degree is a qualification.

Years of professional experience are experience.

A specific certification is certification.

A technical capability or knowledge area is a skill.

FINAL VALIDATION:

Before returning:

- Every requirement has exactly one requirement_type.
- requirement_type is one of:
  skill, qualification, experience, certification, other.
- Do not create unsupported requirements.
- Do not omit important requirements.
- Preserve required/preferred classification.
- Return valid JSON only.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            response_format={
                "type": "json_object"
            },
        )

        content = response.choices[0].message.content

        return JobProfile.model_validate_json(content)

    async def match_requirements(
        self,
        candidate: CandidateProfile,
        job: JobProfile,
    ) -> list[RequirementMatch]:

        system_prompt = """
You are the semantic requirement-matching engine for CareerForge AI.

Compare the candidate profile against every job requirement.

Return ONLY valid JSON:

{
  "matches": [
    {
      "requirement": "string",
      "requirement_type": "required | preferred",
      "requirement_kind":
        "skill | qualification | experience | certification | other",
      "status": "strong_match | partial_match | gap",
      "evidence": ["string"],
      "reason": "string",
      "priority": "high | medium | low",
      "required_level": "string or null"
    }
  ]
}

MATCHING RULES:

1. Evaluate every job requirement independently.

2. Return exactly one match for every job requirement.

3. Use the complete CandidateProfile:
   - skills
   - skill evidence
   - projects
   - project descriptions
   - project evidence
   - experience
   - experience descriptions
   - experience evidence
   - education
   - certifications
   - achievements

4. Do not rely on exact keyword matching.

5. Use semantic reasoning to determine whether the candidate evidence
   genuinely demonstrates the requirement.

6. Related technologies or concepts are NOT automatically equivalent.

7. Never invent candidate experience.

8. Every evidence item must be directly supported by the candidate profile.

9. If there is insufficient evidence, use an empty evidence list.

STATUS DEFINITIONS:

strong_match:
The candidate has clear and direct evidence demonstrating the requirement.

partial_match:
The candidate has meaningful related evidence, but an important part
of the requirement is not sufficiently demonstrated.

gap:
The candidate profile does not provide sufficient evidence that the
candidate has demonstrated the requirement.

A gap means "not sufficiently demonstrated by the provided resume".
It does NOT mean that the candidate definitely lacks the capability.

EDUCATION:

For qualification requirements, inspect candidate.education carefully.

If the job says the candidate must be pursuing a degree and the candidate
is explicitly pursuing a matching degree, that is a strong_match.

If the job requires a completed degree, distinguish that from a currently
pursuing degree.

Do not treat an incomplete degree as completed.

Do not infer a degree that is not explicitly present.

ACADEMIC KNOWLEDGE:

For skill requirements asking for:
- fundamentals
- understanding
- concepts
- academic knowledge
- theoretical knowledge

relevant coursework in candidate.education is valid evidence.

For example:

Job requirement:
"Computer Networks fundamentals"

Candidate education:
"Computer Networks fundamentals"

This is valid direct evidence.

However, coursework alone must NOT be treated as professional,
production, project, or work experience when the requirement explicitly
asks for such experience.

EXPERIENCE:

Do not infer:
- years of experience
- seniority
- production experience
- leadership
- management
- responsibility level

unless supported by the candidate profile.

PROJECTS:

Project experience can demonstrate a capability when the project
description or evidence clearly shows the candidate actually used
or implemented it.

SKILLS:

A skill listed in the candidate profile is valid evidence that the
candidate claims the skill.

Concrete project or experience evidence provides stronger support for
practical capability.

Use all relevant evidence rather than ignoring education or coursework.

REQUIREMENT KIND:

For every output match, copy the exact semantic classification of the
corresponding JobRequirement:

skill
qualification
experience
certification
other

Do not infer a different requirement_kind during matching.

PRIORITY:

For required requirements:
- strong_match -> high
- partial_match -> high
- gap -> high

For preferred requirements:
- strong_match -> low
- partial_match -> medium
- gap -> low

Priority represents job importance, not difficulty.

REASON:

Explain briefly:
- what the requirement asks for
- what candidate evidence is relevant
- why the selected status follows

Do not invent facts.

FINAL VALIDATION:

Before returning:

- Every job requirement appears exactly once.
- No requirements are added.
- No requirements are omitted.
- Required/preferred classification is preserved.
- requirement_kind exactly matches the corresponding JobRequirement.
- Evidence comes only from CandidateProfile.
- Missing evidence is not converted into an unsupported conclusion.
- Job-description text is never used as candidate evidence.
- No duplicate requirements.
"""

        candidate_json = candidate.model_dump_json(indent=2)
        job_json = job.model_dump_json(indent=2)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": (
                        f"CANDIDATE PROFILE:\n"
                        f"{candidate_json}\n\n"
                        f"JOB PROFILE:\n"
                        f"{job_json}"
                    ),
                },
            ],
            response_format={
                "type": "json_object"
            },
        )

        content = response.choices[0].message.content

        data = json.loads(content)

        matches = [
            RequirementMatch.model_validate(match)
            for match in data["matches"]
        ]

        return matches