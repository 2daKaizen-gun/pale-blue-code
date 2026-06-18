from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.lightcurve import LightCurveResponse, PhaseFoldResponse
import routers.planets as _planets
from services import mast

router = APIRouter()


def _find_planet(planet_name: str):
    for p in _planets._cache:
        if p.pl_name.lower() == planet_name.lower():
            return p
    return None


@router.get("/lightcurve/{planet_name}", response_model=LightCurveResponse)
async def get_lightcurve(
    planet_name: str,
    mission: str = Query(default="Kepler", pattern="^(Kepler|TESS|K2)$"),
):
    planet = _find_planet(planet_name)
    if planet is None:
        raise HTTPException(status_code=404, detail=f"Planet '{planet_name}' not found in catalog")

    try:
        data = await run_in_threadpool(
            mast.fetch_lightcurve,
            planet.pl_name,
            planet.hostname,
            planet.pl_orbper,
            mission,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return LightCurveResponse(**data)


@router.get("/lightcurve/{planet_name}/folded", response_model=PhaseFoldResponse)
async def get_folded_lightcurve(
    planet_name: str,
    mission: str = Query(default="Kepler", pattern="^(Kepler|TESS|K2)$"),
    bins: int = Query(default=200, ge=50, le=1000),
):
    planet = _find_planet(planet_name)
    if planet is None:
        raise HTTPException(status_code=404, detail=f"Planet '{planet_name}' not found in catalog")

    if planet.pl_orbper is None:
        raise HTTPException(status_code=422, detail="Orbital period unknown for this planet")

    # transit duration not stored in planet model — pass None (TechSpec §8 known limit)
    try:
        data = await run_in_threadpool(
            mast.fold_lightcurve,
            planet.pl_name,
            planet.hostname,
            planet.pl_orbper,
            None,
            mission,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return PhaseFoldResponse(**data)
