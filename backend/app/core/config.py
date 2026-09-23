"""Application configuration settings using Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment configuration settings for the Interview AI module."""

    # Microsoft Foundry Configuration
    FOUNDRY_PROJECT_ENDPOINT: str = (
        "https://careerforge-foundry-korea.services.ai.azure.com/api/projects/careerforge"
    )
    FOUNDRY_API_KEY: str = ""
    FOUNDRY_MODEL_DEPLOYMENT: str = "gpt-4.1-mini"
    FOUNDRY_PROJECT_NAME: str = "careerforge"

    # Azure Speech Configuration
    AZURE_SPEECH_KEY: str = ""
    AZURE_SPEECH_REGION: str = "koreacentral"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def foundry_base_url(self) -> str:
        """Construct the Microsoft Foundry project OpenAI v1-compatible endpoint URL.

        Target: https://careerforge-foundry-korea.services.ai.azure.com/api/projects/careerforge/openai/v1
        """
        endpoint = self.FOUNDRY_PROJECT_ENDPOINT.rstrip("/")
        if "/api/projects" in endpoint:
            return f"{endpoint}/openai/v1"
        return f"{endpoint}/api/projects/{self.FOUNDRY_PROJECT_NAME}/openai/v1"


settings = Settings()
