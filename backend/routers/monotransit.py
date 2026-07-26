from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from models.monotransit import MonotransitResponse
from services import monotransit as mono_service

router = APIRouter()


@router.get("/monotransit/{planet_name}", response_model=MonotransitResponse)
async def get_monotransit(planet_name: str):
    """Single-transit search: dips that appear once, which a folded search discards."""
    try:
        data = await run_in_threadpool(mono_service.run_monotransit, planet_name)
    except FileNotFoundError:
        raise HTTPException(
            status_code=424,
            detail={
                "message": "Light curve not found. Fetch it first via /api/lightcurve/{planet_name}",
                "planet": planet_name,
            },
        )
    return MonotransitResponse(**data)
