import asyncio

from dotenv import load_dotenv

from app.ai.foundry_ai import FoundryAIService


load_dotenv()


async def main():

    print("Starting Foundry job test...")

    job_text = """
    AI/ML Engineer

    We are looking for an AI/ML Engineer to build AI-powered applications.

    Requirements:
    - Strong Python programming experience
    - Experience with FastAPI
    - Experience with Docker
    - Experience with REST APIs
    - AWS experience is preferred
    - Knowledge of system design is preferred

    Responsibilities:
    - Build and deploy AI/ML applications
    - Develop backend APIs
    - Work with cloud technologies

    Education:
    Bachelor's degree in Computer Science or a related field.
    """

    service = FoundryAIService()

    print("Calling Foundry...")

    profile = await service.analyze_job(job_text)

    print("Foundry response received:")
    print(profile.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())