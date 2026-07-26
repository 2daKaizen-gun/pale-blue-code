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
