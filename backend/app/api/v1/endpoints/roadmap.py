from fastapi import APIRouter, HTTPException

from app.schemas.roadmap import (
    RoadmapRequest,
    RoadmapResponse,
)
from app.services.roadmap_generator import generate_roadmap


router = APIRouter(
    prefix="/roadmap",
    tags=["Roadmap"],
)


@router.post(
    "/generate",
    response_model=RoadmapResponse,
)
def generate(payload: RoadmapRequest):
    if not payload.gaps:
        raise HTTPException(
            status_code=422,
            detail="At least one skill gap is required.",
        )

    try:
        return generate_roadmap(payload)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Roadmap generation failed: {error}",
        ) from error