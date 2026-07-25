from typing import Literal

from pydantic import BaseModel

CheckName = Literal["odd_even", "secondary", "shape", "size"]


class VettingCheck(BaseModel):
    name: CheckName
    passed: bool
    hard: bool                 # True: strong EB indicator — a single fail collapses trust
    metrics: dict[str, float]  # evidence numbers; the frontend renders them as sentences


class VettingReport(BaseModel):
    kic_id: int                # generic star id — KIC for Kepler, TIC for TESS
    period: float              # de-aliased true period the gates were run at
    bls_period: float          # raw BLS peak (may be a ½×/2×/4× alias)
    alias_factor: float        # period / bls_period (1.0 = BLS was already true)
    checks: list[VettingCheck]
    passed_count: int
    total: int                 # gates actually run — 4 normally, 0 when the
                               # significance precondition stopped before vetting
    trust: Literal["strong", "weak", "unlikely", "insignificant"]
    # Phase 11, honesty nail 5 — looking planetary is not the same as being a real
    # detection. A precondition runs before the four gates; if the folded signal is
    # not significant, "insignificant" is reported and no gate runs (a distinct axis:
    # not a lower rung of the planet verdict, but "there was nothing worth vetting").
    significance: float | None = None  # transit S/N between transits; None = held (k<2)
    significant: bool = True           # False only when the precondition actively failed
                                       #   (default True keeps legacy vet caches valid)
    # Phase 10, honesty nail 4 — confidence must scale with how much we watched.
    mission: str = "kepler"           # which survey named the star
    baseline_days: float = 0.0        # observed span (max-min) the gates saw
    transit_count: int = 0            # transit epochs actually carrying data — NOT
                                      # floor(baseline/period), which counts epochs
                                      # that fell in gaps (see observed_transits)
    sector_count: int | None = None   # TESS sectors stitched (None for Kepler)
    provisional: bool = False         # strong, but on too few transits → "provisional strong"
