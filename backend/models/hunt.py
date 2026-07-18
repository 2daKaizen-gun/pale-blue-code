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
    kic_id: int                       # generic star id — KIC for Kepler, TIC for TESS
    time: list[float]
    flux: list[float]
    flux_err: list[float]
    point_count: int
    original_count: int
    # Phase 10, honesty nail 4 — how much sky-time this curve actually covers.
    mission: str = "kepler"
    baseline_days: float = 0.0        # observed span (undecimated); short = blunt vetter
    sector_count: int | None = None   # TESS sectors stitched (None for Kepler)


class FrontierPick(BaseModel):
    kic_id: int
    recorded: bool = False  # the pool holds only unrecorded KICs (invariant)


class RecordedEntry(BaseModel):
    kepoi_name: str
    disposition: str


class RecordedCheck(BaseModel):
    kic_id: int
    recorded: bool
    entries: list[RecordedEntry]
