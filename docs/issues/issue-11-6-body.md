## 11-6: The hunt honors the triage — every star carries what a detection would mean

sub-11-5 turned the flat 50-star frontier pool into a ranked target list: on 16 stars a
detectable dip could be a planet, on 34 giants it would be a star. But the hunt itself does not
yet know this. `GET /api/monotransit/hunt` still searches all 50 stars and ranks its survivors by
significance alone — so a loud dip on a 10 R_sun giant would be promoted and top-ranked exactly
like a dip on a dwarf, even though sub-11-5 already proved that dip cannot be a planet. The two
scoreboards (specificity, sensitivity) and the sky triage are built but not yet wired together.

sub-11-6 wires them: the hunt carries each star's size verdict, so a survivor is ranked and
labeled by whether a detection there could be a planet at all. A "candidate" on a too_big star is
still reported honestly — the tool never hides what it saw — but named as star-sized and sorted
below the plausible-star candidates, so the ranking points where a real planet is possible. No
new physics and no new fetch: a pure join of the sub-11-5 catalog geometry into the existing
hunt ledger and survivor list.

### Plan

Reuse `pool_assessment.assess_pool` (sub-11-5) as the source of each star's `classification` and
`min_planet_rjup`, keyed by star name. Stamp every ledger entry and every survivor with its size
class. Re-rank survivors so plausible-star candidates lead, star-sized ones follow (significance
breaking ties within a class). Surface it: the monotransit hunt page labels each star's size
class and flags a survivor on a giant as "would be a star." Offline, deterministic, tested — no
network, no new light-curve fetch.

### Lights

- [ ] Light 1 — the join: a pure `size_class_by_name()` (in `pool_assessment`) mapping each pool
      star's name to `{classification, min_planet_rjup, min_planet_rearth}`; `hunt_monotransit`
      accepts an optional size index and stamps each ledger entry and survivor with it, defaulting
      to no size info (back-compatible). Pure, tested.
- [ ] Light 2 — the ranking: survivors sorted plausible-star first, then significance; the hunt
      response carries the size verdict per survivor and per ledger entry. Model fields added;
      `GET /api/monotransit/hunt` reflects it. Endpoint tested.
- [ ] Light 3 — the surface: the monotransit hunt page shows each searched star's size class and
      labels a survivor on a too_big star as star-sized (a candidate there is not a planet).
      Copy pure-tested; **not** added to `phases.ts`.
- [ ] Light 4 — Check doc `docs/checks/phase-11/sub-11-6.md`: the join, the re-ranking, and what
      it means — the hunt now points where a detection could be a world.

### Success criteria

- [ ] every hunt ledger entry and survivor carries its star's size classification and minimum
      detectable planet radius
- [ ] survivors are ranked so plausible-star candidates lead star-sized ones
- [ ] a survivor on a too_big star is reported honestly but named as star-sized, not a planet
- [ ] `GET /api/monotransit/hunt` returns the size verdict per star
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **Report, do not hide.** A dip on a giant is still recorded and still a `candidate` if it clears
  the gates — the tool never suppresses what it saw. The size verdict changes the *ranking* and
  the *label*, not whether the event is reported.
- **Reuse the triage, do not re-derive.** The size class comes from sub-11-5's `assess_pool`,
  keyed by name, so there is exactly one definition of plausible / too_big in the codebase.
- **Size, not mass, still.** A plausible-star survivor is planet-*sized*; confirming a planet
  still needs a mass. This sub-phase points the hunt, it does not certify a discovery.

### References

- `docs/checks/phase-11/sub-11-5.md` — the triage this sub-phase makes the hunt honor
- `backend/services/pool_assessment.py` — `assess_pool`, the size classification source
- `backend/services/monotransit.py` — `hunt_monotransit`, the ledger + survivor list to stamp
