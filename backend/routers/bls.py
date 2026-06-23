from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from models.bls import BLSResponse
from services import bls as bls_service

router = APIRouter()


@router.get("/bls/{planet_name}", response_model=BLSResponse)
async def get_bls(planet_name: str):
    try:
        data = await run_in_threadpool(bls_service.run_bls, planet_name)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=424,
            detail={"message": "Light curve not found. Fetch it first via /api/lightcurve/{planet_name}", "planet": planet_name},
        )
    return BLSResponse(**data, best=data["best"])
