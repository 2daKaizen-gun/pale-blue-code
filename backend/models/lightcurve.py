from pydantic import BaseModel
from typing import Optional


class LightCurveResponse(BaseModel):
    planet_name: str
    hostname: str
    mission: str
    time: list[float]
    flux: list[float]
    flux_err: list[float]
    period: Optional[float]
    point_count: int
    original_count: int


class PhaseFoldResponse(BaseModel):
    planet_name: str
    period: float
    phase: list[float]
    flux: list[float]
    flux_err: list[float]
    transit_depth: Optional[float]
    transit_duration: Optional[float]
