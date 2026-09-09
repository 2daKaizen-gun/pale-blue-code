> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran on 2026-09-05 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Path A raises sensitivity by finding what actually lowers each star's measured depth floor. **Lever 1
is the flux column**, and the worry points straight at our own premise.

Our fetch has always kept SPOC's **PDCSAP** — flux the pipeline has already detrended with co-trending
basis vectors. But CBV fitting is tuned for short *repeating* transits, so it might **over-subtract the
long, lone dip of a monotransit** — the exact signal we hunt. We aim at the machine's blind spot while
feeding on flux the machine has already shaped. The hypothesis: raw **SAP** aperture flux, cleaned by
our own Savitzky-Golay detrend instead, could reach a lower floor.

Measure it rather than argue it.

## Lights

- [x] `2100ef7` — `_download_stitched_lc` gains a `flux_column` argument so SAP can be selected.
- [x] `e74cdce` — `scripts/measure_flux_choice.py`: take each target, read **both** flux columns from
      the same FITS (SAP is not a second download), and run each through the *identical* pipeline —
      stitch/normalize/5σ-clip → `bls._detrend` → baseline-1 → `sensitivity_depth_floor` → `sqrt(floor)·R★`.
      Only the flux column differs, so any gap is the flux's doing. Targets: path A's 11 Earth-size stars.
- [x] `f03e75d` — ASCII summary output; the `⊕`/`Δ` characters crashed a cp949 console.
- [x] `db8d5c6` / `9b46085` / `94ed911` — check doc, observation log, and vision §9 updated with the
      result.

## Success criteria

- [x] lever 1 (flux) measured head to head on path A's 11 targets, identical pipeline downstream
- [x] pure comparison covered by 4 tests (pytest 199 → 205)
- [x] result: **PDCSAP wins 11/11, median Δ −1.09 R⊕** → keep PDCSAP, no pipeline change
- [x] a hypothesis tested on real curves and reversed — recorded, not buried
- [x] the boundary stated: this measures the noise floor, not signal recovery
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The hypothesis reversed under measurement.** On every one of the 11, PDCSAP reaches a smaller
  planet — by a full 1.09 R⊕ at the median (best case TIC 42071226: 0.60 vs 1.45 R⊕; worst
  TIC 314017913: 1.20 vs 4.26 R⊕). Switching to SAP would have cost most of these stars their
  Earth-size reach. The systematics still riding SAP swamp the floor faster than our detrend can clean
  them, and that outweighs whatever long-signal SAP preserves.
- **So the honest outcome of the first lever is *no change*.** A worry worth having, tested on real
  starlight, and put down by the data. The null is written up, not buried.
- **The boundary is explicit.** We measured the **noise floor** — the yardstick our completeness map
  is built on, so the right one for "how small a planet could this sweep have seen." Whether PDCSAP's
  CBVs ever *erase a genuine long transit* is a separate signal-recovery question that only
  injection-recovery can close. Flagged for a later lever; it does not change today's floor result.
- Scope: small, quiet dwarfs — exactly path A's targets. Bright stars could tilt differently; that
  would be a re-measure, not a claim made here.

## References

- Retrospective: `docs/checks/phase-11/sub-11-23.md`
- Tool: `scripts/measure_flux_choice.py`
- Vision: `docs/vision/finding-our-own-planet.md` §9 (lever 1)
- Previous: `docs/checks/phase-11/sub-11-22.md`
