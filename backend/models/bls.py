from pydantic import BaseModel


class BLSBest(BaseModel):
    period: float
    duration: float
    depth: float
    transit_time: float
    power: float


class BLSResponse(BaseModel):
    planet_name: str
    periods: list[float]
    powers: list[float]
    best: BLSBest
