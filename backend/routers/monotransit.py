from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.monotransit import MonotransitResponse, MonotransitHunt, PoolAssessment, FetchPlan
from services import monotransit as mono_service
from services import hunt as hunt_service
from services import pool_assessment as pool_service
from services import fetch_plan as fetch_plan_service

router = APIRouter()


# Declared before /monotransit/{planet_name} so "pool" is not swallowed as a star name.
@router.get("/monotransit/pool", response_model=PoolAssessment)
async def assess_the_pool():
    """Rank the frontier pool by what a detectable dip would MEAN on each star.

    A transit depth maps to a companion radius (R_planet = sqrt(depth) * R_star), so the
    detection floor becomes a minimum detectable planet radius per star. Most of the pool
    is bright giants where that floor implies a star-sized object, not a planet — this
    endpoint says so honestly and ranks the few real targets first. Pure catalog geometry,
    no fetch.
    """
    result = await run_in_threadpool(pool_service.assess_pool)
    return PoolAssessment(**result)


# Declared before /monotransit/{planet_name} so "fetch-plan" is not swallowed as a star name.
@router.get("/monotransit/fetch-plan", response_model=FetchPlan)
async def get_fetch_plan():
    """Which plausible dwarfs are worth fetching — cached or pending, best target first.

    The deterministic half of the fetch bridge (sub-11-7): the sub-11-5 triage keeps only the
    stars where a detectable dip could be a planet, tagged by whether their light curve is
    already on disk. No network, no fetch — a slow MAST download never masquerades as this
    request. The fetch itself runs from the local ``scripts/fetch_plausible.py``.
    """
    result = await run_in_threadpool(fetch_plan_service.fetch_plan)
    return FetchPlan(**result)


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
    # sub-11-6: carry the sub-11-5 size triage into the hunt, so every star and survivor says
    # what a detection there would MEAN and plausible-star candidates rank ahead of star-sized ones
    size_index = await run_in_threadpool(pool_service.size_class_by_name)
    result = await run_in_threadpool(mono_service.hunt_monotransit, names, size_index)
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
