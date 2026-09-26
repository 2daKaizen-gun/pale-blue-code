## Plan

First movement of the new "Everyone's Sky" track. Build the **vetting engine**: after BLS finds a period, decide whether the signal is a plausible planet or a false positive (eclipsing binary, stellar variability, noise) — using only the cached light curve, no new external API.

The engine computes four standard diagnostics (the light-curve-only subset of what NASA Robovetter / DAVE use) and synthesizes a trust level. This is a pure, deterministic calculation on top of the existing BLS result, so it is built TDD-first with synthetic light curves.

See `docs/specs/phase-9/PRD.md` §5 and `docs/specs/phase-9/TECHSPEC.md` §2, §5.

## Lights (expected commit order)

1. `backend/models/vetting.py` — `VettingCheck`, `VettingReport` Pydantic models
2. `backend/tests/test_vetting.py` — synthetic light curves (model planet vs model eclipsing binary with odd/even mismatch and secondary eclipse), **failing tests first**
3. `backend/services/vetting.py` — `check_odd_even` + `check_secondary` (hard EB indicators)
4. `backend/services/vetting.py` — `check_shape` + `check_size` (soft indicators) + `synthesize`
5. Threshold calibration against anchors (confirmed planet KIC 11446443 = 4/4 pass; false-positive anchor = ≥1 hard fail)
6. `backend/routers/hunt.py` — `GET /api/hunt/vet/{kic_id}` (424 when BLS not cached) + register in `main.py`

## Success criteria

- Synthetic planet → trust `strong`; synthetic eclipsing binary (secondary eclipse / odd-even mismatch) → trust `unlikely`
- Confirmed planet KIC 11446443 (real data) → 4/4 checks pass
- False-positive anchor (real data) → at least one hard check fails
- `pytest` passes; vetting computation < 1s on cached input

## Key decisions

- Input = cached `bls_lc_{slug}.json` (full-resolution time+flux) + `bls_{slug}.json` `best` block; reuse `bls_service._detrend` so vetting sees the same curve BLS did
- Four gates: odd/even depth, secondary eclipse, transit shape (U vs V trapezoid flat fraction), size (S/N + Rp/Rs = √depth)
- Plain-language explanation lives in the frontend (9-2), not the backend — backend returns numbers + pass/fail + `hard` flag only
- `Rp/Rs = √depth` judged without stellar radius (LC-only for v1); oversized depth alone implies an EB
- Thresholds (3σ / 0.25 / 0.2 / 7.0) are provisional, calibrated in Light 5 against anchors

## References

- `docs/specs/phase-9/PRD.md` (§3 two honest nails, §5 scope, §8 astronomy)
- `docs/specs/phase-9/TECHSPEC.md` (§2 backend, §5 sub-phase split, §6 risks)
- Reused: `backend/services/bls.py` (`run_bls`, `_detrend`), `backend/services/hunt.py` (`fetch_lc_by_kic`)
