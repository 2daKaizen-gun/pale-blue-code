> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-17 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Searching the second extension batch, **TIC 326691903** surfaced the hunt's first event ever to
clear all four discriminators *and* the significance floor: sig 10.86, `candidate = True`. Radical
honesty demands it be inspected before it is believed.

The raw curve settles it. The observation **opens** ~6% below baseline and climbs back to 1.0 over
~0.15 d — a textbook TESS segment-start thermal-recovery ramp. The deep spike at the start dies to
**edge**; its neighbour one duration later sits 0.15 d from the boundary, just past the 0.1 d
clearance, and rides the recovering ramp to a 1.1% apparent "dip". Same systematic, not a transit.

None of the four gates asks the decisive question: *do the two out-of-transit shoulders sit at the
same flux?* Build the fifth discriminator, measure its threshold on real curves, and invalidate the
cache so nothing stale is trusted.

## Lights

- [x] `0f58494` — `scripts/measure_baseline_step.py`: measure the ramp/transit gap on real curves.
      Clean transits injected into quiet TESS curves (kept only if the full chain recovers them and
      they pass the other four gates) step by at most **0.32 × depth** (n=38, p99 0.31); the recovery
      ramp steps by **4.67 × depth**.
- [x] `0f265f9` — the `baseline` discriminator:
      `step_ratio = |median(left shoulder) − median(right shoulder)| / depth`, shoulders at
      `t0 ± [0.75, 1.75] × duration`, reject at `>= _BASELINE_STEP_MAX = 1.0` — in the empty gap,
      ~3× above the loudest clean transit and ~4.7× below the artifact. `_MONO_CACHE_VERSION`
      bumped `mono-v1 → mono-v2`.
- [x] `238b79d` — tests: the gate catches a step-riding dip and spares a flat-baseline transit.
- [x] `641a722` — surface the baseline gate in the drilldown (sub-11-15's failed-gate line).
- [x] `8d5dc6f` — second extension batch logged, the first candidate self-corrected.
- [x] `f00b3d8` / `22c3c46` — check doc + README.

## Success criteria

- [x] the first candidate was inspected against the raw curve before being believed
- [x] identified as a segment-start recovery ramp, not a planet (edge caught the spike, not its tail)
- [x] a fifth discriminator (`baseline`) added, its threshold measured on real curves (gap 0.32..4.67)
- [x] `_BASELINE_STEP_MAX = 1.0` sits in the empty gap; clean transits pass, the ramp fails
- [x] `_MONO_CACHE_VERSION` bumped so every stored result recomputes under the new gate
- [x] TIC 326691903 flips candidate → rejected; the hunt is back to zero candidates
- [x] pytest green
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The threshold was measured, not asserted** — the same discipline that set `_SIG_MIN_MONO`. A
  gate whose number comes from a guess is a gate we cannot defend.
- **The cache had to be invalidated.** A stale derived result passes the schema and lies (the vet
  cache taught this in sub-11-1). The discriminator set changed, so every stored result across the
  pool is recomputed under `mono-v2`, and `tally_hunt` honours the same version tag. The old 56 keep
  their dispositions exactly — the new gate changes only the star it was built for.
- **Shoulders in a data gap yield no test and pass.** The edge gate already guards true segment
  boundaries; a second guard there would double-count.
- **Cumulative: 76 of 100 — 33 quiet · 31 insignificant · 12 rejected · 0 candidates.**
- **The lesson:** the first object to pass every gate was an artifact, and the pipeline learned a new
  gate from it — the way it is supposed to work.

## References

- Retrospective: `docs/checks/phase-11/sub-11-18.md`
- Measurement: `scripts/measure_baseline_step.py`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-17.md`
