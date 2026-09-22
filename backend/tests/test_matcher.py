import asyncio

from app.ai.mock_ai import MockAIService
from app.services.matcher import match_requirements


async def test_matcher():

    ai = MockAIService()

    candidate = await ai.analyze_resume("test resume")
    job = await ai.analyze_job("test job")

    matches = match_requirements(candidate, job)

    for match in matches:
        print("\nRequirement:", match.requirement)
        print("Status:", match.status)
        print("Priority:", match.priority)
        print("Evidence:", match.evidence)
        print("Reason:", match.reason)


if __name__ == "__main__":
    asyncio.run(test_matcher())