import asyncio

from app.ai.mock_ai import MockAIService
from app.services.matcher import match_requirements
from app.services.gap_analyzer import extract_skill_gaps


async def test_gap_analyzer():

    ai = MockAIService()

    candidate = await ai.analyze_resume("test resume")
    job = await ai.analyze_job("test job")

    matches = match_requirements(candidate, job)

    result = extract_skill_gaps(matches)

    print("\nSkill Gaps:")

    for gap in result.skill_gaps:
        print("\nSkill:", gap.skill)
        print("Priority:", gap.priority)
        print("Required Level:", gap.required_level)
        print("Reason:", gap.reason)


if __name__ == "__main__":
    asyncio.run(test_gap_analyzer())