from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.hunt import (
    HuntTarget,
    KOIMatch,
    HuntLCResponse,
    FrontierPick,
    FrontierStar,
    FrontierPool,
    RecordedCheck,
)
from models.bls import BLSResponse
from models.vetting import VettingReport
from services import hunt as hunt_service
from services import bls as bls_service
from services import vetting as vetting_service

router = APIRouter()


@router.get("/hunt/targets", response_model=list[HuntTarget])
async def get_hunt_targets():
    return hunt_service.get_targets()


@router.get("/hunt/lc/{kic_id}", response_model=HuntLCResponse)
async def get_hunt_lc(kic_id: int, mission: str = Query("kepler")):
    fetch = (
        hunt_service.fetch_lc_by_tic
        if mission.lower() == "tess"
        else hunt_service.fetch_lc_by_kic
    )
    try:
        data = await run_in_threadpool(fetch, kic_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    # `if k in data` keeps pre-Phase-10 cached payloads valid: they predate
    # baseline_days/sector_count/mission, so those fall back to model defaults.
    return HuntLCResponse(**{k: data[k] for k in HuntLCResponse.model_fields if k in data})


@router.get("/hunt/bls/{kic_id}", response_model=BLSResponse)
async def get_hunt_bls(kic_id: int, mission: str = Query("kepler")):
    planet_name = hunt_service.star_name(kic_id, mission)
    try:
        data = await run_in_threadpool(bls_service.run_bls, planet_name)
    except FileNotFoundError:
        raise HTTPException(
            status_code=424,
            detail={
                "message": f"Light curve not cached for KIC {kic_id}. "
                           f"Fetch via GET /api/hunt/lc/{kic_id} first.",
                "kic_id": kic_id,
            },
        )
    return BLSResponse(**data)


@router.get("/hunt/vet/{kic_id}", response_model=VettingReport)
async def get_hunt_vet(kic_id: int, mission: str = Query("kepler")):
    try:
        report = await run_in_threadpool(vetting_service.vet, kic_id, mission)
    except FileNotFoundError:
        raise HTTPException(
            status_code=424,
            detail={
                "message": f"BLS not cached for KIC {kic_id}. "
                           f"Run GET /api/hunt/bls/{kic_id} first.",
                "kic_id": kic_id,
            },
        )
    return report


@router.get("/hunt/koi-check", response_model=list[KOIMatch])
async def koi_check(
    kic_id: int = Query(...),
    period: float = Query(..., gt=0),
):
    matches = hunt_service.koi_check(kic_id, period)
    return [KOIMatch(**m) for m in matches]


@router.get("/hunt/frontier/random", response_model=FrontierPick)
async def get_frontier_random(mission: str = Query("kepler")):
    """Draw one unrecorded star from the pre-verified frontier seed pool.

    Kepler -> unrecorded KIC; TESS -> unrecorded TIC. The pool holds only
    unrecorded stars by construction, so recorded is always False. For TESS the
    pick is returned enriched (its place in the sky) so the UI can play a first-look
    reveal; Kepler has no dated enrichment and returns a bare id.
    """
    if mission.lower() == "tess":
        star = hunt_service.pick_frontier_tess_star()
        return FrontierPick(
            kic_id=int(star["tic"]), recorded=False, star=FrontierStar(**star)
        )
    return FrontierPick(kic_id=hunt_service.pick_frontier(), recorded=False)


@router.get("/hunt/frontier/pool", response_model=FrontierPool)
async def get_frontier_pool(
    mission: str = Query("tess"),
    limit: int = Query(60, ge=1, le=200),
):
    """The frontier feed — the freshest unrecorded stars, newest-observed first.

    A recency-sorted window over the seed pool: each card is a real star (where it
    sits, how bright, how long ago TESS saw it), so a hunter browses a place in the
    sky instead of typing a number. TESS only — Kepler has no dated pool, so it
    returns an empty feed (the feed is a Phase 10 "fresh sky" feature).
    """
    if mission.lower() != "tess":
        return FrontierPool(mission="kepler", count=0, stars=[])
    raw = hunt_service.frontier_tess_stars()
    meta = hunt_service.frontier_tess_meta()
    # Newest observation first; undated records (schema @1) sink to the bottom.
    ordered = sorted(raw, key=lambda s: s.get("observed_at") or "", reverse=True)
    stars = [FrontierStar(**s) for s in ordered[:limit]]
    return FrontierPool(
        mission="tess",
        latest_sector=meta["latest_sector"],
        built_at=meta["built_at"],
        count=len(raw),
        stars=stars,
    )


@router.get("/hunt/recorded/{kic_id}", response_model=RecordedCheck)
async def get_recorded(kic_id: int, mission: str = Query("kepler")):
    """Is this star already on file? Period-independent catalog membership check.

    Kepler -> KOI membership (by kepid); TESS -> TOI membership (by tid). Either
    way, a star with any catalog entry is not undiscovered hunting ground.
    """
    if mission.lower() == "tess":
        entries = [
            {"kepoi_name": f"TOI {e['toi']}", "disposition": e["tfopwg_disp"]}
            for e in hunt_service.toi_entries(kic_id)
        ]
    else:
        entries = [
            {"kepoi_name": e["kepoi_name"], "disposition": e["koi_disposition"]}
            for e in hunt_service.koi_entries(kic_id)
        ]
    return RecordedCheck(kic_id=kic_id, recorded=len(entries) > 0, entries=entries)
