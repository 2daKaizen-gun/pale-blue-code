from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from models.hunt import HuntTarget, KOIMatch, HuntLCResponse
from models.bls import BLSResponse
from services import hunt as hunt_service
from services import bls as bls_service

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


@router.get("/hunt/koi-check", response_model=list[KOIMatch])
async def koi_check(
    kic_id: int = Query(...),
    period: float = Query(..., gt=0),
):
    matches = hunt_service.koi_check(kic_id, period)
    return [KOIMatch(**m) for m in matches]
