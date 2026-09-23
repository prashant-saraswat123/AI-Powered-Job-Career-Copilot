import azure.cognitiveservices.speech as speechsdk

from app.core.config import settings


class SpeechService:
    """Azure Speech-to-Text service."""

    def __init__(self):
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION,
        )

        self.speech_config.speech_recognition_language = "en-US"

    def transcribe_audio(self, audio_file_path: str) -> str:
        """Convert an audio file into text."""

        audio_config = speechsdk.audio.AudioConfig(
            filename=audio_file_path
        )

        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config,
            audio_config=audio_config,
        )

        result = recognizer.recognize_once()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text

        if result.reason == speechsdk.ResultReason.NoMatch:
            raise ValueError("No speech could be recognized.")

        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            raise RuntimeError(
                f"Speech recognition cancelled: {cancellation.reason}"
            )

        raise RuntimeError("Speech recognition failed.")