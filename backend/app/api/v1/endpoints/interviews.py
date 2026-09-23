"""Interview management API endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
import gc
import os
import tempfile
import uuid
import time

from app.api.deps import get_interview_service
from app.models.interview import (
    AnswerSubmission,
    EvaluationResult,
    InterviewSessionState,
    Question,
)
from app.models.report import InterviewReport
from app.models.skill import CandidateProfile
from app.services.interview_service import InterviewService
from app.services.speech_service import SpeechService

router = APIRouter(prefix="/interviews", tags=["Interviews"])
@router.post(
    "/transcribe",
    summary="Transcribe audio using Azure Speech-to-Text",
)
async def transcribe_audio(
    audio: UploadFile = File(...),
) -> dict[str, str]:
    """Convert uploaded audio into text using Azure Speech."""

    speech_service = None

    temp_dir = tempfile.gettempdir()

    temp_path = os.path.join(
        temp_dir,
        f"careerforge_audio_{uuid.uuid4().hex}.wav",
    )

    try:
        contents = await audio.read()

        with open(temp_path, "wb") as file:
            file.write(contents)

        print(f"🎙️ Audio saved: {temp_path}")

        speech_service = SpeechService()

        text = speech_service.transcribe_audio(temp_path)

        print("📝 Transcription completed.")

        return {"text": text}

    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err

    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {err}",
        ) from err

    finally:
        # Release Azure Speech resources
        if speech_service is not None:
            try:
                del speech_service
            except Exception:
                pass

        gc.collect()

        # Delete temporary audio file
        if os.path.exists(temp_path):

            for attempt in range(5):
                try:
                    os.remove(temp_path)

                    print(
                        f"🗑️ Temporary audio file deleted "
                        f"(attempt {attempt + 1})"
                    )

                    break

                except PermissionError as cleanup_error:

                    if attempt < 4:
                        print(
                            f"⚠️ Audio file still locked. "
                            f"Retrying... ({attempt + 1}/5)"
                        )

                        time.sleep(0.2)

                    else:
                        print(
                            f"❌ Could not delete temporary audio file "
                            f"after 5 attempts: {cleanup_error}"
                        )

        # Close uploaded file
        try:
            await audio.close()
        except Exception:
            pass

class StartInterviewResponse(BaseModel):
    """Response returned when a new interview session is successfully started."""

    interview_id: str
    candidate_name: str
    target_role: str
    first_question: Question


class SubmitAnswerResponse(BaseModel):
    """Response returned after candidate submits an answer."""

    interview_id: str
    evaluation: EvaluationResult
    next_question: Question | None
    is_completed: bool


@router.post(
    "/start",
    response_model=StartInterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new interview session",
)
async def start_interview(
    candidate_profile: CandidateProfile,
    service: InterviewService = Depends(get_interview_service),
) -> Any:
    """Initialize candidate context, prioritize skills, and generate the first question."""
    try:
        session, first_question = await service.start_interview(candidate_profile)
        return StartInterviewResponse(
            interview_id=session.interview_id,
            candidate_name=session.candidate_profile.name,
            target_role=session.candidate_profile.target_role,
            first_question=first_question,
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start interview: {err}",
        ) from err


@router.post(
    "/{interview_id}/answer",
    response_model=SubmitAnswerResponse,
    summary="Submit an answer for the current question",
)
async def submit_answer(
    interview_id: str,
    submission: AnswerSubmission,
    service: InterviewService = Depends(get_interview_service),
) -> Any:
    """Submit candidate answer, run evaluation via gpt-4.1-mini, and adaptively decide the next question."""
    try:
        session, evaluation, next_question = await service.submit_answer(
            interview_id=interview_id,
            answer_text=submission.answer_text,
        )
        return SubmitAnswerResponse(
            interview_id=session.interview_id,
            evaluation=evaluation,
            next_question=next_question,
            is_completed=(session.status == "COMPLETED"),
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing answer: {err}",
        ) from err


@router.post(
    "/{interview_id}/end",
    response_model=InterviewReport,
    summary="Conclude the interview and generate final report",
)
async def end_interview(
    interview_id: str,
    service: InterviewService = Depends(get_interview_service),
) -> Any:
    """Finish the interview, generate executive scorecard, and export confirmed skill gaps."""
    try:
        return await service.end_interview(interview_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finalize report: {err}",
        ) from err


@router.get(
    "/{interview_id}/state",
    response_model=InterviewSessionState,
    summary="Get current interview session state and history",
)
async def get_interview_state(
    interview_id: str,
    service: InterviewService = Depends(get_interview_service),
) -> Any:
    """Inspect full turn history and state of an interview."""
    try:
        return service.get_session(interview_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        ) from err
