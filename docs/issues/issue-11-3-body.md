## 11-3: Point it at the sky — the live monotransit hunt

sub-11-2 built the single-transit primitive and proved it stays quiet: run over five
real TESS stars, zero candidates survived, and the one dip loud enough to clear the
significance cut (`TIC 102029734`, sig 14.23) was caught as a segment-edge artifact by
the `edge` discriminator — not by significance. Depth of defense, not depth of
significance.

sub-11-3 points that primitive at the **frontier pool** — the freshest SPOC stars absent
from the TOI catalog (`frontier_seeds_tess@2`, the same pool sub-10-4 surfaces) — and turns
one-star `run_monotransit` into a **hunt** across many, with an **honest scoreboard**: every
star gets a disposition, "searched, nothing survived" is a first-class result, and the
false-alarm rate of the full chain is measured, not assumed. The north star is a real
single-transit candidate of our own; the discipline that keeps that claim honest is knowing
exactly how often the chain fires on noise.

### Plan

Hunt only over stars whose light curve is already cached (local-first, offline). Fetching
50 curves live is a separate concern; an uncached star is reported `not_fetched`, never
silently dropped. Reuse `run_monotransit` verbatim — the hunt is orchestration and
disposition, no new physics.

Per-star disposition:

- `not_fetched` — no light curve cached (nothing hunted, honestly said)
- `no_event` — search found nothing clearing the structural floors
- `held` — an event, but significance held (too little baseline to judge)
- `insignificant` — an event below the measured significance floor
- `rejected` — significant, but failed a discriminator (which one is named)
- `candidate` — cleared significance **and** every discriminator

### Lights

- [ ] Light 1 — the hunt engine: `hunt_monotransit(stars)` iterates a star list, runs
      `run_monotransit` on each cached light curve, classifies each into a disposition, and
      returns a ranked survivor list plus the full per-star ledger. No new physics; pure
      orchestration over the sub-11-2 brick, tested with a synthetic multi-star cache.
- [ ] Light 2 — the false-alarm audit: `scripts/measure_monotransit_false_alarm.py` runs the
      **full chain** (search + significance + discriminators) over control epochs on real
      light curves with no injection, and reports how often a survivor appears by chance.
      The scoreboard behind any future "candidate" claim; the number recorded in the Check.
- [ ] Light 3 — reachability: `GET /api/monotransit/hunt` (mission=tess) runs the engine
      over the frontier pool and returns the ranked survivors and the per-star ledger; a
      `MonotransitHunt` response model.
- [ ] Light 4 — the surface: a minimal, honest frontend panel that shows the hunt result —
      survivors framed as *light-curve single-transit candidates*, and "searched, none
      survived" as a first-class outcome, not an empty error. Does **not** add a frontier
      route to `phases.ts`.
- [ ] Light 5 — Check doc `docs/checks/phase-11/sub-11-3.md`: the live hunt over the pool,
      the measured false-alarm rate, and the honest boundary. (Deferred one session, as
      sub-11-2's Check was.)

### Success criteria

- [ ] the hunt runs over the frontier pool and returns a ranked survivor list plus a
      per-star disposition ledger
- [ ] "searched, nothing survived" is a first-class reported outcome, not an error or an
      empty body
- [ ] the false-alarm rate of the full chain is measured on real data and recorded
- [ ] a survivor is reported as a candidate only when it clears significance **and** every
      discriminator
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **Local-first hunt.** Only cached light curves are searched; uncached pool stars are
  reported `not_fetched`. The tool never pretends to have looked where it did not.
- **No new physics.** The hunt reuses `run_monotransit` and its measured threshold and
  discriminators unchanged; sub-11-3 is the orchestration and the scoreboard.
- **The scoreboard is the point.** The false-alarm audit is not optional polish — it is what
  lets a future real candidate be stated with a known chance-of-noise, the difference between
  a discovery and a guess.

### References

- `docs/vision/finding-our-own-planet.md` — path B, the gap the machines miss
- `docs/checks/phase-11/sub-11-2.md` — the primitive, the measured threshold, the live sweep
- `backend/services/monotransit.py` — `run_monotransit`, `significance_red`, `discriminators`
- `backend/services/hunt.py` — `frontier_tess_stars()`, the pool this hunt points at
