from fastapi import APIRouter

from services.archive import fetch_planets
from models.planet import Planet

router = APIRouter()

_cache: list[Planet] = []


async def load_cache() -> None:
    global _cache
    _cache = await fetch_planets()


@router.get("/planets", response_model=list[Planet])
async def get_planets():
    return _cache


@router.get("/planets/{pl_name}", response_model=Planet)
async def get_planet(pl_name: str):
    for p in _cache:
        if p.pl_name.lower() == pl_name.lower():
            return p
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Planet not found")
