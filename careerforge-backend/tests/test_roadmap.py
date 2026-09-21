from app.schemas.analysis import SkillGap, SkillGapResult
from app.schemas.roadmap import SkillGapPayload
from app.services.roadmap_service import (
    generate_learning_roadmap,
    generate_skill_gap_roadmap,
)


def test_generate_skill_gap_roadmap_contract():
    payload = SkillGapPayload(
        skillGaps=[
            {
                "skill": "Docker",
                "priority": "HIGH",
                "requiredLevel": "working_knowledge",
            },
            {
                "skill": "AWS",
                "priority": "MEDIUM",
                "requiredLevel": "basic",
            },
        ]
    )

    roadmap = generate_skill_gap_roadmap(payload)

    assert len(roadmap.roadmap) == 2
    assert roadmap.roadmap[0].skill == "Docker"
    assert roadmap.roadmap[0].topics
    assert roadmap.roadmap[0].resources
    assert roadmap.roadmap[0].practice


def test_generate_learning_roadmap_from_skill_gaps():
    skill_gaps = SkillGapResult(
        skill_gaps=[
            SkillGap(
                skill="Docker",
                priority="high",
                required_level="Intermediate",
                reason="No explicit evidence of Docker was found.",
            ),
            SkillGap(
                skill="FastAPI",
                priority="high",
                required_level="Intermediate",
                reason="No explicit evidence of FastAPI was found.",
            ),
        ]
    )

    roadmap = generate_learning_roadmap(skill_gaps)

    assert len(roadmap.roadmap) >= 2
    assert {item.skill for item in roadmap.roadmap} >= {"Docker", "FastAPI"}
    assert all(item.resources for item in roadmap.roadmap)
    assert all(item.practice_tasks for item in roadmap.roadmap)
    assert all(item.learning_sequence for item in roadmap.roadmap)


def test_generate_skill_gap_roadmap_accepts_user_snake_case_payload():
    payload = SkillGapPayload.model_validate(
        {
            "skill_gaps": [
                {
                    "skill": "Docker",
                    "priority": "high",
                    "required_level": "intermediate",
                },
                {
                    "skill": "AWS",
                    "priority": "medium",
                    "required_level": "basic",
                },
            ]
        }
    )

    roadmap = generate_skill_gap_roadmap(payload)

    assert len(roadmap.roadmap) == 2
    assert roadmap.roadmap[0].skill == "Docker"
    assert roadmap.roadmap[0].priority == "HIGH"
    assert roadmap.roadmap[0].requiredLevel == "intermediate"
