> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran on 2026-09-04 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Three sectors are swept end to end — ~300 smallest-first dwarfs, zero candidates, every loud dip
caught by the five gates as an instrumental artefact. But the honest reading of that zero is in the
completeness: **median 4–7 R⊕**, only ~6% of curves clean enough to have shown an Earth. Our eye sees
large planets, and large single transits are largely catalogued already. The real blind spot — a small
planet's lone transit — is below where we can currently see.

So the direction turns (`docs/vision/finding-our-own-planet.md` §9, decision **A**): stop widening,
start deepening. But "quietest" must be **measured**, not assumed — stellar radius alone is a poor
proxy. The first tool must name, from measurement, which searched curves already reach Earth size.

## Lights

- [x] `ca877a3` / `0de6838` — sector 103 completed (100/100), the sweep that made sensitivity the
      visible wall.
- [x] `f26a48c` — **vision §9**: decision A (raise sensitivity toward Earth size) and decision D
      (reset the goal honestly — no telescope, so confirmation belongs to TFOP; our reachable target
      is an Earth-size candidate presented with its measured sensitivity).
- [x] `6392ccb` — housekeeping: remove stale `docs/cc` duplicates, top-level `docs/` canonical.
- [x] `323c1c8` — `scripts/rank_by_sensitivity.py`: rank searched stars by the sensitivity they
      *actually achieved*. Reads each star's measured `depth_floor` from its mono cache (never a fetch,
      never a recompute) and converts it with the radius: `R_planet = sqrt(depth_floor) × R★`. Accepts
      multiple pools and de-duplicates by TIC. Pure `rank_by_sensitivity()` covered by 4 tests
      (pytest 195 → 199).
- [x] `20e5b82` — check doc: path A opens with the Earth-size leaderboard.

## Success criteria

- [x] the wall is identified from measurement (median 4–7 R⊕ across three swept sectors), not asserted
- [x] vision §9 records decisions A and D
- [x] a tool ranks searched stars by achieved sensitivity, from cached measured floors only
- [x] multi-pool input de-duplicates a star shared across sectors (the mono cache is TIC-keyed)
- [x] the pure ranking function is unit-tested (4)
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **Measurement names the target, not radius.** Of 197 searched stars, **11 already reach Earth size
  (≤ 1.25 R⊕)** — path A's first targets. Most are the small M dwarfs one would expect, but
  TIC 389198736 (R★ 0.686, roughly Sun-fraction) reaches 1.18 R⊕ because its curve is exceptionally
  quiet (floor 0.0002). A small star with a noisy curve is not a sharp target; a larger star with a
  clean one can be.
- **"Reaches Earth size" is a sensitivity statement, nothing more.** All 11 were searched and came
  back quiet or insignificant. It means the curve *could have shown* an Earth — never that a planet
  is there.
- **Verdict left IN PROGRESS.** The leaderboard names the targets; the deepening itself — measuring,
  one lever at a time, what actually lowers the floor — is the next work, not this sub-phase's.

## References

- Retrospective: `docs/checks/phase-11/sub-11-22.md`
- Vision: `docs/vision/finding-our-own-planet.md` §9 (decisions A + D)
- Tool: `scripts/rank_by_sensitivity.py`
- Previous: `docs/checks/phase-11/sub-11-21.md`
