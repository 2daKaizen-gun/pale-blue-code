from pydantic import BaseModel


class DiscriminatorCheck(BaseModel):
    name: str          # edge | coherence | flare | symmetry
    passed: bool
    value: float


class MonotransitCandidate(BaseModel):
    t0: float                      # event center, days
    duration: float                # first-to-last contact, days
    depth: float                   # fitted trapezoid depth
    ses: float                     # matched-filter single-event statistic (white)
    significance: float | None     # red-noise significance; None = held (too little baseline)
    significant: bool              # significance >= measured floor
    checks: list[DiscriminatorCheck]
    passed: bool                   # all discriminators passed
    candidate: bool                # significant AND passed — a monotransit candidate


class MonotransitResponse(BaseModel):
    planet_name: str
    candidates: list[MonotransitCandidate]
    depth_floor: float | None = None   # shallowest transit this curve's noise would admit


class MonotransitSurvivor(MonotransitCandidate):
    planet_name: str               # which star this survivor came from


class MonotransitLedgerEntry(BaseModel):
    planet_name: str
    # candidate | rejected | held | insignificant | no_event | not_fetched
    disposition: str
    n_events: int
    significance: float | None
    failed: list[str]              # discriminators that caught a rejected event
    depth_floor: float | None = None   # shallowest transit this star's curve could have shown


class MonotransitHunt(BaseModel):
    mission: str
    searched: int                  # stars with a cached light curve actually searched
    survivors: list[MonotransitSurvivor]
    ledger: list[MonotransitLedgerEntry]


class PoolTarget(BaseModel):
    tic: int
    tmag: float | None
    constellation: str | None
    stellar_radius: float | None       # R_sun
    min_planet_rjup: float | None      # smallest planet a detection here could reveal
    min_planet_rearth: float | None
    classification: str                # plausible | too_big | unknown


class PoolSummary(BaseModel):
    total: int
    plausible: int                     # a detection could be a planet
    too_big: int                       # a detection would be a star
    unknown: int                       # no stellar radius on file
    depth_floor: float                 # fiducial detection floor used
    planet_max_rjup: float             # the planet / star size boundary


class PoolAssessment(BaseModel):
    targets: list[PoolTarget]
    summary: PoolSummary
