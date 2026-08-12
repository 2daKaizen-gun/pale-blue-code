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


# sub-11-13: the light curve behind a verdict, for the drilldown. The decimated, detrended
# curve the search actually saw, plus the events it found so the view can mark each dip.
class MonotransitCurveEvent(BaseModel):
    t0: float                          # event center, days (same frame as the curve's time)
    duration: float                    # first-to-last contact, days
    depth: float                       # fitted trapezoid depth
    significance: float | None         # red-noise significance; None = held
    significant: bool                  # cleared the significance floor
    passed: bool                       # passed every discriminator
    candidate: bool                    # significant AND passed
    # which shape gates this event failed, if any — reported for EVERY event, even below the
    # significance floor. A quiet blip that also sits on a segment edge is more clearly an
    # instrument artifact than a bare "insignificant"; showing the failed gate keeps a reader
    # (or a future me) from romanticizing a sub-threshold edge blip as a near-candidate.
    failed_checks: list[str] = []      # subset of edge | coherence | flare | symmetry


class MonotransitCurve(BaseModel):
    planet_name: str
    mission: str
    time: list[float]                  # display-decimated time samples
    flux: list[float]                  # normalized flux, baselined to 1 (as the search sees it)
    point_count: int                   # samples sent
    original_count: int                # samples before decimation
    depth_floor: float | None = None   # shallowest transit this curve's noise would admit
    events: list[MonotransitCurveEvent]


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
    # sub-11-10: earliest calendar date (YYYY-MM-DD) a second transit could appear — t0 + min
    # period, in BTJD. The earliest edge of the follow-up window, None when no period bound.
    earliest_recurrence: str | None = None
    # sub-11-11: the same numbers in an observer's frame, so the flag can be handed off — the epoch
    # in BJD_TDB (t0 + 2457000, the published/ExoFOP frame) and the depth in millimagnitudes (what
    # a follow-up photometrist measures). depth_mmag is None only for a non-physical depth.
    epoch_bjd_tdb: float | None = None
    depth_mmag: float | None = None


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
