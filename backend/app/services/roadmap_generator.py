import uuid

from app.ai.foundry_ai import FoundryAIService
from app.schemas.roadmap import (
    Milestone,
    MilestoneStatus,
    Phase,
    RoadmapMeta,
    RoadmapRequest,
    RoadmapResponse,
)


ROADMAP_SCHEMA = {
    "type": "object",
    "properties": {
        "phases": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "focus": {"type": "string"},
                    "category": {"type": "string"},
                    "milestones": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "effort_hours": {"type": "number"},
                                "gap_id": {"type": "string"},
                                "gap_text": {"type": "string"},
                                "why_text": {"type": "string"},
                                "artifact_text": {"type": "string"},
                                "tags": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": [
                                "title",
                                "description",
                                "effort_hours",
                                "gap_id",
                                "gap_text",
                                "why_text",
                                "artifact_text",
                                "tags",
                            ],
                        },
                    },
                },
                "required": [
                    "title",
                    "focus",
                    "category",
                    "milestones",
                ],
            },
        }
    },
    "required": ["phases"],
}


SYSTEM_PROMPT = """
You are CareerForge's career roadmap planning engine.

Your job is to convert the candidate's PROVIDED skill gaps into a concrete,
week-by-week career action roadmap.

CRITICAL OUTPUT RULES:

1. You MUST return a JSON object containing exactly one top-level field:
   "phases".

2. "phases" MUST contain 3 to 5 phase objects.

3. EVERY phase MUST contain:
   - title
   - focus
   - category
   - milestones

4. EVERY phase MUST contain AT LEAST ONE milestone.

5. EVERY milestone MUST contain:
   - title
   - description
   - effort_hours
   - gap_id
   - gap_text
   - why_text
   - artifact_text
   - tags

6. Every milestone MUST use one of the EXACT gap_id values supplied by
   the user. Never invent a gap_id.

7. Do NOT create milestones for skills that are not in the supplied gaps.

8. Each milestone must represent a concrete action the candidate can perform.

9. artifact_text MUST describe a tangible deliverable, project, document,
   implementation, or demonstration the candidate can produce.

10. gap_text MUST explain the specific skill gap being addressed.

11. why_text MUST explain why improving that gap matters for the target role.

12. effort_hours MUST be a number between 0.5 and 6.

13. tags MUST be a list of lowercase strings.

14. Include interview practice milestones where appropriate.

15. The final phase should contain interview preparation or readiness
    activities relevant to the supplied gaps.

16. Do not invent readiness scores, percentages, rankings, or benchmarks.

17. Return ONLY valid JSON. No markdown. No explanation outside the JSON.

Example structure:

{
  "phases": [
    {
      "title": "Foundation",
      "focus": "Build the fundamentals needed to address the identified gaps.",
      "category": "technical",
      "milestones": [
        {
          "title": "Study SQL indexing fundamentals",
          "description": "Learn how indexes affect query execution.",
          "effort_hours": 3,
          "gap_id": "sql-indexing",
          "gap_text": "SQL Indexing requires stronger query optimization knowledge.",
          "why_text": "SQL optimization is relevant to backend engineering work.",
          "artifact_text": "Create a SQL optimization lab containing indexed and non-indexed queries with benchmark results.",
          "tags": ["sql", "database"]
        }
      ]
    }
  ]
}
"""


def generate_roadmap(payload: RoadmapRequest) -> RoadmapResponse:
    ai = FoundryAIService()

    gaps_text = "\n".join(
        [
            (
                f"- gap_id={gap.gap_id}, "
                f"title={gap.title}, "
                f"category={gap.category}, "
                f"priority={gap.priority}, "
                f"required_level={gap.required_level}, "
                f"reason={gap.reason}"
            )
            for gap in payload.gaps
        ]
    )

    user_prompt = f"""
Create a personalized career roadmap for this candidate.

Candidate:
{payload.candidate_name or "Unknown"}

Target role:
{payload.target_role}

Target company:
{payload.target_company or "Unknown"}

Weekly hours available:
{payload.weekly_hours_available}

Sprint length:
{payload.sprint_weeks} weeks

IMPORTANT:
The following are the ONLY skill gaps you are allowed to address.

{gaps_text}

You MUST:

- Create 3 to 5 phases.
- Put at least one milestone inside EVERY phase.
- Every milestone must reference one of the exact gap_id values above.
- Cover all important supplied gaps across the roadmap.
- Give every milestone a concrete artifact/deliverable.
- Include interview preparation in the later phases.

Return the complete roadmap JSON now.
"""

    response = ai.client.chat.completions.create(
        model=ai.model,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        response_format={
            "type": "json_object"
        },
    )

    content = response.choices[0].message.content

    import json

    raw = json.loads(content)
    if not raw.get("phases"):
        raise ValueError(
            "Foundry returned a roadmap without phases."
        )

    for phase in raw["phases"]:
        if not phase.get("milestones"):
            raise ValueError(
                f"Foundry returned a phase without milestones: "
                f"{phase.get('title', 'Unknown phase')}"
            )

    phases = []
    total_milestones = 0
    artifact_count = 0
    categories = set()

    for phase_index, raw_phase in enumerate(
        raw.get("phases", [])
    ):
        milestones = []

        for milestone_index, raw_milestone in enumerate(
            raw_phase.get("milestones", [])
        ):
            if phase_index == 0 and milestone_index == 0:
                status = MilestoneStatus.in_progress
            elif phase_index == 0:
                status = MilestoneStatus.ready
            else:
                status = MilestoneStatus.queued

            tags = [
                str(tag).lower()
                for tag in raw_milestone.get("tags", [])
            ]

            categories.update(tags)

            milestones.append(
                Milestone(
                    id=f"{phase_index + 1}-{milestone_index + 1}",
                    code=f"MILESTONE {phase_index + 1}.{milestone_index + 1}",
                    title=raw_milestone["title"],
                    description=raw_milestone["description"],
                    effort_hours=float(
                        raw_milestone.get(
                            "effort_hours",
                            1,
                        )
                    ),
                    status=status,
                    tags=tags,
                    gap_id=raw_milestone.get("gap_id"),
                    gap_text=raw_milestone.get(
                        "gap_text",
                        "",
                    ),
                    why_text=raw_milestone.get(
                        "why_text",
                        "",
                    ),
                    artifact_text=raw_milestone.get(
                        "artifact_text",
                        "",
                    ),
                )
            )

            total_milestones += 1
            artifact_count += 1

        phases.append(
            Phase(
                phase_number=phase_index + 1,
                week_label=f"W{phase_index + 1}",
                title=raw_phase.get(
                    "title",
                    f"Phase {phase_index + 1}",
                ),
                focus=raw_phase.get(
                    "focus",
                    "",
                ),
                category=raw_phase.get(
                    "category",
                    "general",
                ),
                completion_pct=0,
                milestones=milestones,
            )
        )

    return RoadmapResponse(
        roadmap_id=str(uuid.uuid4()),
        meta=RoadmapMeta(
            role_title=payload.target_role,
            tagline=(
                f"Personalized roadmap for "
                f"{payload.target_role}"
            ),
            sprint_weeks=payload.sprint_weeks,
            total_milestones=total_milestones,
            projected_artifacts=artifact_count,
            gap_categories=sorted(categories),
        ),
        phases=phases,
    )