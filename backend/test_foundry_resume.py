import asyncio
from dotenv import load_dotenv
from app.ai.foundry_ai import FoundryAIService

load_dotenv()

async def main():

    print("Starting Foundry resume test...")

    resume_text = """
    John Doe

    Skills:
    Python, FastAPI, MongoDB, Docker

    Projects:
    CareerForge AI
    Built a FastAPI backend for a career analysis application.
    Used Python, FastAPI and MongoDB.

    Education:
    B.E. Computer Science
    """

    service = FoundryAIService()

    print("Calling Foundry...")

    profile = await service.analyze_resume(resume_text)

    print("Foundry response received:")
    print(profile.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())