> ⚠️ **Filed retroactively on 2026-09-11.** This sub-phase ran on 2026-09-07 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Levers 1–3 are settled (sub-11-23/24): PDCSAP wins, the detrend window is flat against the floor, and
the targets are already multi-sector so stitching is on. The one knob left touches the noise
directly — **lever 4, binning the per-point scatter**. The naive premise is the strongest of the four:
bin N adjacent cadences and white noise averages down by √N, so a 30-minute bin (~15 two-minute
cadences) should cut the scatter to ~¼.

But the floor is not the raw per-point scatter — `sensitivity_depth_floor` reads the scatter of
**matched-filter depths** already integrated over ~288 cadences of the 0.4-day template. The prediction
is that binning is redundant. Measure it rather than rest on the argument, and guard its cost.

Then, with the eye as sharp as the pipeline can make it, ship decision **D**'s first artifact.

## Lights

- [x] `7e7bb55` — `bls._bin_curve`: bin a light curve into fixed-width time bins. 4 tests.
- [x] `9eef41e` — `scripts/measure_binning_floor.py`: bin the raw curve at 0 / 5 / 10 / 20 / 30 min and
      run the *identical* rest of the pipeline (detrend 30 d → baseline-1 → floor → `sqrt(floor)·R★`).
      Plus an independent **cost guard**: how much of a synthetic transit's depth survives each bin.
      6 tests.
- [x] `f7f2883` — `scripts/earth_size_dossier.py` (decision D): cache-only, gathers the
      Earth-size-sensitive targets with measured floor, sectors, baseline, and verdict, and names the
      ExoFOP/TFOP follow-up path.
- [x] `e67adc1` / `1730d55` — check doc + instrument log (levers 3 and 4, and the boundary).
- [x] `8a34f27` — vision §9-2: the last lever is null too; the sensitivity chapter is closed.

## Success criteria

- [x] lever 4 swept 0/5/10/20/30 min on path A's 11 targets; pure comparison + cost guard tested (6)
- [x] `_bin_curve` capability added to bls with tests (4)
- [x] result: **median gain +0.001 R⊕, direction scattered** → keep the unbinned pipeline, no change
- [x] the mechanism stated: the floor already integrates over the transit window
- [x] **all four sensitivity levers measured and null**, recorded as a boundary in vision §9-2
- [x] decision D's first artifact shipped: the Earth-size dossier (11 targets, 0 surviving candidates)
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The floor does not move.** A bin "beat" unbinned on 6 of 11, but by +0.01–0.04 R⊕ — and on 5
  stars binning made it *worse* (TIC 62020444, 0.66 → 0.68). A real √N gain would fall monotonically
  with bin width on every star; this jitters both ways, the signature of measurement noise, not
  sensitivity.
- **And binning is not free.** A 30-min bin already smears a 2-hour dip by 8%. It would trade real
  transit depth for no floor gain.
- **★ Four levers, four nulls — a boundary, not four failures.** Flux, detrend window, multi-sector
  stitching, binning: on these already-quiet, already-stitched dwarfs the depth floor is what it is,
  and no knob in the pipeline lowers it. The search for sensitivity ends here.
- **So the value moves to D.** Not a *lower* floor but the *honest present* one: 11 stars reach Earth
  size, 0 surviving candidates — a completeness statement, not a discovery, with the follow-up path
  written down for the day a candidate does survive.
- pytest 214 → 229.

## References

- Retrospective: `docs/checks/phase-11/sub-11-25.md`
- Tools: `scripts/measure_binning_floor.py` · `scripts/earth_size_dossier.py`
- Vision: `docs/vision/finding-our-own-planet.md` §9-2
- Previous: `docs/checks/phase-11/sub-11-24.md`
