> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran on 2026-09-06 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Lever 1 is settled — PDCSAP wins (sub-11-23). **Lever 2 is the detrend window.**

`bls._detrend` uses a 30-day Savitzky-Golay window, fixed in sub-10-3 by **transit-depth
preservation** (96% depth kept at 5 d, 82% at 2 d). But the **noise floor** is a second, independent
question: too short a window eats long signal and adds noise, too long a window leaves red noise that
raises the floor. The window that minimises the floor need not be the one that best preserves depth,
so measure it rather than assume sub-10-3's answer carries over.

Then open **lever 3** — more baseline via multi-sector stitching — by first asking its precondition:
do these targets even *have* multiple sectors?

## Lights

- [x] `b27f4be` — `bls._detrend` takes a `window_days` override; production never passes it (the
      module constant stays the default), so the pipeline is unchanged by the capability.
- [x] `4a5dccc` — `scripts/measure_detrend_floor.py`: download each target's PDCSAP curve once
      (lever-1 winner), detrend at 10 / 20 / 30 / 50 days through the *identical* rest of the pipeline,
      convert each floor to `sqrt(floor)·R★`. Only the window differs. 4 tests.
- [x] `6451e16` / `39af4f2` — check doc + observation log.
- [x] `28014e2` — `scripts/inspect_target_sectors.py`: cache-only recon reporting the sector coverage
      behind each target's floor (lever 3's precondition).
- [x] `e64924d` — vision §9-1: pipeline levers exhausted; path A's weight shifts to widening + D.

## Success criteria

- [x] lever 2 swept 10/20/30/50 d on path A's 11 targets; pure comparison tested (4)
- [x] result: **median gain +0.000 R⊕, largest +0.03** → keep 30 days, no pipeline change
- [x] the flatness explained: these targets are already systematics-quiet, so there is little red
      noise for any window to add or remove
- [x] lever 3 precondition measured by recon, not assumed
- [x] vision §9-1 records that pipeline tuning is exhausted
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The window barely moves the floor.** Best-window tally 10d ×5, 20d ×4, 30d ×2 — a shorter window
  nominally wins on 5 of 11, but by 0.01–0.03 R⊕, which is measurement noise, and sub-10-3 already
  showed it costs real transit depth. Nothing to trade for. **Keep 30 days.**
- **The null points somewhere.** Lever 2 being flat says the detrend is not what caps sensitivity
  here: the floor is set by per-point scatter, and the one knob that can lower *that* is more
  baseline.
- **★ And lever 3 turned out already pulled.** The recon found **all 11 targets are already
  multi-sector** — median 6 sectors, median baseline 2551 days — and `_download_stitched_lc` already
  does `download_all().stitch()`. The floors we had measured were *already* computed on stitched,
  multi-sector curves. There is no gain to fetch; the baseline is as long as the mission has made it.
- **So pipeline tuning is exhausted.** Three levers, three "keep what we have". Path A's weight shifts
  from squeezing sensitivity to **widening the target set** and **honest presentation (D)** — recorded
  in vision §9-1. That reframing is this sub-phase's real output.
- pytest 205 → 214.

## References

- Retrospective: `docs/checks/phase-11/sub-11-24.md`
- Tools: `scripts/measure_detrend_floor.py` · `scripts/inspect_target_sectors.py`
- Vision: `docs/vision/finding-our-own-planet.md` §9-1
- Previous: `docs/checks/phase-11/sub-11-23.md`
