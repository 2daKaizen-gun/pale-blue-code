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
    harmonic: float = 1.0  # bls_period / koi_period: 1.0 exact, 4.0 = 4x alias, 0.5 = half-period


class HuntLCResponse(BaseModel):
    kic_id: int
    time: list[float]
    flux: list[float]
    flux_err: list[float]
    point_count: int
    original_count: int
