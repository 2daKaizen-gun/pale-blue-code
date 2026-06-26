from pydantic import BaseModel


class HuntTarget(BaseModel):
    kic_id: int
    label: str
    description: str
    hint: str


class KOIMatch(BaseModel):
    kepoi_name: str
    disposition: str
    koi_period: float


class HuntLCResponse(BaseModel):
    kic_id: int
    time: list[float]
    flux: list[float]
    flux_err: list[float]
    point_count: int
    original_count: int
