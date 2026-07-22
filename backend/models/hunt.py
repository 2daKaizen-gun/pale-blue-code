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


class FrontierStar(BaseModel):
    """One enriched frontier target — a real place in the sky, not a bare number.

    Populated from the @2 TESS seed pool (Phase 10 sub-10-4). Every field is
    *stellar* (brightness, temperature, distance, where it sits, when TESS saw it) —
    never planetary — so browsing the feed never leaks whether a planet is there
    (honesty nail #3). Fields are nullable because TIC coverage is uneven.
    """
    tic: int
    observed_at: str | None = None       # YYYY-MM-DD TESS observed it (freshness)
    constellation: str | None = None     # where in the sky
    tmag: float | None = None            # TESS-band brightness (smaller = brighter)
    teff: float | None = None            # effective temperature (K) -> "sun-like"
    radius: float | None = None          # stellar radius (R_sun)
    distance_pc: float | None = None     # distance (parsecs)


class FrontierPick(BaseModel):
    kic_id: int
    recorded: bool = False  # the pool holds only unrecorded KICs (invariant)
    # Enriched identity of the pick, so the UI can play a "first look" reveal.
    # Present for the TESS pool (@2); None for Kepler, which has no dated enrichment.
    star: FrontierStar | None = None


class FrontierPool(BaseModel):
    """The frontier feed — the freshest unrecorded stars, plus how fresh the pool is.

    A recency-sorted window over the seed pool (newest-observed first). `latest_sector`
    and `built_at` let the UI say how current the sky is; `count` is the full pool size
    even when `stars` is a limited window.
    """
    mission: str
    latest_sector: int | None = None
    built_at: str | None = None          # when the pool was built (freshness)
    count: int
    stars: list[FrontierStar]


class RecordedEntry(BaseModel):
    kepoi_name: str
    disposition: str


class RecordedCheck(BaseModel):
    kic_id: int
    recorded: bool
    entries: list[RecordedEntry]
