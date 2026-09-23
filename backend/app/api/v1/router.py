"""Aggregates all API v1 routers."""

from fastapi import APIRouter
from app.api.v1.endpoints.interviews import router as interviews_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(interviews_router)
