from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.hunt import (
    HuntTarget,
    KOIMatch,
    HuntLCResponse,
    FrontierPick,
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
async def get_hunt_lc(kic_id: int):
    try:
        data = await run_in_threadpool(hunt_service.fetch_lc_by_kic, kic_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return HuntLCResponse(**{k: data[k] for k in HuntLCResponse.model_fields})


@router.get("/hunt/bls/{kic_id}", response_model=BLSResponse)
async def get_hunt_bls(kic_id: int):
    planet_name = f"KIC {kic_id}"
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
async def get_hunt_vet(kic_id: int):
    try:
        report = await run_in_threadpool(vetting_service.vet, kic_id)
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
async def get_frontier_random():
    """Draw one unrecorded KIC from the pre-verified frontier seed pool."""
    kic_id = hunt_service.pick_frontier()
    return FrontierPick(kic_id=kic_id, recorded=False)


@router.get("/hunt/recorded/{kic_id}", response_model=RecordedCheck)
async def get_recorded(kic_id: int):
    """Is this star already on file? Period-independent KOI membership check."""
    entries = hunt_service.koi_entries(kic_id)
    return RecordedCheck(
        kic_id=kic_id,
        recorded=len(entries) > 0,
        entries=[
            {"kepoi_name": e["kepoi_name"], "disposition": e["koi_disposition"]}
            for e in entries
        ],
    )
