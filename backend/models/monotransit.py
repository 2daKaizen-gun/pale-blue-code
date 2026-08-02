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


# sub-11-6: what a detection on this star would MEAN (from the sub-11-5 pool triage). A survivor
# on a too_big star is still reported, but named star-sized and ranked below plausible ones.
class SizeVerdict(BaseModel):
    size_class: str | None = None          # plausible | too_big | unknown | None (no triage)
    min_planet_rjup: float | None = None   # smallest planet a detection here could reveal
    min_planet_rearth: float | None = None


class MonotransitSurvivor(MonotransitCandidate, SizeVerdict):
    planet_name: str               # which star this survivor came from
    # sub-11-8: shortest orbital period this one transit's duration+depth allows on this star
    # (a b=0 lower bound), or None when the star's radius is unknown. "at least", never "is".
    min_period_days: float | None = None
    # sub-11-9: warmest equilibrium temperature (K) this world could run — the closest orbit
    # (from min_period_days) at zero albedo, an upper bound. None when Teff/radius/period unknown.
    max_eq_temp_k: float | None = None


class MonotransitLedgerEntry(SizeVerdict):
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


# sub-11-7: the fetch plan — which plausible dwarfs to fetch, cached or pending, best target
# first. Deterministic (catalog geometry + a cache check); no network in the request path.
class FetchTarget(BaseModel):
    tic: int
    star_name: str
    min_planet_rjup: float | None      # smallest planet a detection here could reveal
    min_planet_rearth: float | None
    cached: bool                       # its light curve is already on disk (the hunt can search it)


class FetchPlanSummary(BaseModel):
    plausible: int                     # plausible dwarfs worth a fetch
    cached: int                        # already searchable
    pending: int                       # still waiting on their light
    best_target: str | None            # the smallest-planet target, or None if the pool is empty
    best_min_planet_rjup: float | None


class FetchPlan(BaseModel):
    targets: list[FetchTarget]
    summary: FetchPlanSummary
