from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.monotransit import MonotransitResponse, MonotransitHunt
from services import monotransit as mono_service
from services import hunt as hunt_service

router = APIRouter()


# Declared before /monotransit/{planet_name} so "hunt" is not swallowed as a star name.
@router.get("/monotransit/hunt", response_model=MonotransitHunt)
async def hunt_the_pool(mission: str = Query("tess")):
    """Point the single-transit search at the frontier pool — the freshest unrecorded
    stars — and return the ranked survivors plus a disposition for every star.

    Only stars whose light curve is already cached are searched; the rest are reported
    ``not_fetched`` (local-first, the tool never pretends to have looked where it did
    not). TESS-only for now — the frontier pool is TESS.
    """
    if mission.lower() != "tess":
        raise HTTPException(status_code=400, detail="monotransit hunt is TESS-only")
    stars = hunt_service.frontier_tess_stars()
    names = [hunt_service.star_name(int(s["tic"]), "tess") for s in stars]
    result = await run_in_threadpool(mono_service.hunt_monotransit, names)
    searched = sum(1 for e in result["ledger"] if e["disposition"] != "not_fetched")
    return MonotransitHunt(mission="tess", searched=searched, **result)


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
