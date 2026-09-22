import os

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

from app.ai.base import AIService
from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
)


class FoundryAIService(AIService):

    def __init__(self):
        self.endpoint = os.getenv("FOUNDRY_PROJECT_ENDPOINT")
        self.model = os.getenv("FOUNDRY_MODEL")

        if not self.endpoint:
            raise ValueError("FOUNDRY_PROJECT_ENDPOINT is not set")

        if not self.model:
            raise ValueError("FOUNDRY_MODEL is not set")

        credential = DefaultAzureCredential()

        self.project = AIProjectClient(
            endpoint=self.endpoint,
            credential=credential,
        )

        self.client = self.project.get_openai_client()

    async def analyze_resume(
        self,
        text: str
    ) -> CandidateProfile:

        system_prompt = """
You are CareerForge AI, a career analysis system.

Analyze the candidate's resume and extract structured information.

Return ONLY valid JSON matching this structure:

{
  "name": "string or null",
  "skills": [
    {
      "name": "string",
      "category": "string or null",
      "evidence": ["exact or closely paraphrased evidence from the resume"]
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "description": "string",
      "skills": ["string"],
      "evidence": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "skills": ["string"],
      "evidence": ["string"]
    }
  ],
  "education": ["string"],
  "certifications": ["string"],
  "achievements": ["string"]
}

Rules:
- Only extract information supported by the resume.
- Do not invent skills, experience, projects, certifications, or achievements.
- Evidence should explain where the extracted information came from.
- Keep the output concise.
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

    async def analyze_job(
        self,
        text: str
    ) -> JobProfile:

        system_prompt = """
You are CareerForge AI, a career analysis system.

Analyze the job description and extract the structured requirements.

Return ONLY valid JSON matching this structure:

{
  "title": "string",
  "requirements": [
    {
      "name": "string",
      "category": "string or null",
      "required": true,
      "description": "string"
    }
  ],
  "responsibilities": ["string"],
  "experience_requirements": ["string"],
  "education_requirements": ["string"],
  "certifications": ["string"]
}

Rules:
- Extract requirements explicitly stated or clearly implied by the job description.
- Mark a requirement as required only when the job description presents it as required, essential, mandatory, or equivalent.
- Mark preferred or nice-to-have skills as required=false.
- Do not invent requirements.
- Keep requirement names concise.
- Preserve the meaning of the original job description.
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