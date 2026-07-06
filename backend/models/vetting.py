from typing import Literal

from pydantic import BaseModel

CheckName = Literal["odd_even", "secondary", "shape", "size"]


class VettingCheck(BaseModel):
    name: CheckName
    passed: bool
    hard: bool                 # True: strong EB indicator — a single fail collapses trust
    metrics: dict[str, float]  # evidence numbers; the frontend renders them as sentences


class VettingReport(BaseModel):
    kic_id: int
    period: float              # de-aliased true period the gates were run at
    bls_period: float          # raw BLS peak (may be a ½×/2×/4× alias)
    alias_factor: float        # period / bls_period (1.0 = BLS was already true)
    checks: list[VettingCheck]
    passed_count: int
    total: int                 # == 4
    trust: Literal["strong", "weak", "unlikely"]
