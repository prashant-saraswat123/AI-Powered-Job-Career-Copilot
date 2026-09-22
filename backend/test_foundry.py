import asyncio

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential


PROJECT_ENDPOINT = "https://careerforge-foundry-korea.services.ai.azure.com/api/projects/careerforge"


async def main():
    credential = DefaultAzureCredential()

    project = AIProjectClient(
        endpoint=PROJECT_ENDPOINT,
        credential=credential,
    )

    openai = project.get_openai_client()

    response = openai.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": "Say hello from CareerForge AI in one sentence."
            }
        ],
    )

    print(response.choices[0].message.content)


if __name__ == "__main__":
    asyncio.run(main())