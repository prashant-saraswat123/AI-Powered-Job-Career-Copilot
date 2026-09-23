"""Microsoft Foundry client wrapper using Azure identity authentication."""

import json
import logging
from typing import Any

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class FoundryClient:
    """Client for Microsoft Foundry using the project's Azure identity."""

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazily initialize the Foundry OpenAI client."""
        if self._client is None:
            credential = DefaultAzureCredential()

            project = AIProjectClient(
                endpoint=settings.FOUNDRY_PROJECT_ENDPOINT,
                credential=credential,
            )

            self._client = project.get_openai_client()

        return self._client

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
    ) -> dict[str, Any]:
        """Request structured JSON from the configured Foundry model."""
        try:
            response = self.client.chat.completions.create(
                model=settings.FOUNDRY_MODEL_DEPLOYMENT,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
            )

            raw_content = response.choices[0].message.content or "{}"
            return json.loads(raw_content)

        except json.JSONDecodeError as err:
            logger.error("Failed to parse model response as JSON: %s", err)
            raise RuntimeError(
                f"Invalid JSON returned by Foundry model: {err}"
            ) from err

        except Exception as err:
            logger.error("Microsoft Foundry model inference error: %s", err)
            raise RuntimeError(f"Foundry API error: {err}") from err


foundry_client = FoundryClient()