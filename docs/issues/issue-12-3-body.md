## Plan

Write the **final report** of the hunt: one document that someone who never saw this repository
could read and check. It states what was searched, how, what came back, and — most importantly —
what that result does and does not rule out.

A null result with its sensitivity stated is a result. The report says "here, at this sensitivity,
there is nothing", star by star, and no more than that.

### Sections

1. **Question** — single transits (monotransits) are where automated periodic searches are blind;
   can two people with public data find a real long-period planet there?
2. **Method** — the pipeline as built: matched filter, the significance precondition, the five
   measured discriminators (edge, coherence, flare, symmetry, baseline), each with the
   measurement that set its threshold.
3. **Data** — sectors 104, 105, 103, 102, 106; pool selection (smallest stars first); counts,
   de-duplicated across pools.
4. **Result** — dispositions per sector; every significant event and the gate that rejected it;
   candidates: the number, stated plainly.
5. **Sensitivity** — measured depth floor per star → smallest detectable planet; best / median R⊕;
   how many stars reached Earth size. The four sensitivity levers (flux, detrend, multi-sector,
   binning) and why all four were null.
6. **Expected yield** — a real calculation, not a guess: planet occurrence around M dwarfs × transit
   probability × the chance a single transit lands in one ~27-day sector × our measured sensitivity.
   Was zero the likely answer before we started? Say so either way.
7. **Limits** — what we cannot do (no telescope, no radial velocities, no confirmation) and what a
   single transit can at most be (a candidate).
8. **The open door** — the tools keep running (biweekly frontier refresh); what a future hit would go
   through (the Earth-size dossier, ExoFOP/TFOP).

## Lights

- [ ] Report drafted from the caches and check docs, every number recomputed by script
      (`tally_hunt.py`, `completeness_hunt.py`, `earth_size_dossier.py`), none typed by hand
- [ ] Expected-yield estimate as a small script with its assumptions and sources written out
- [ ] Figures only where they carry a result (sensitivity distribution, dispositions)
- [ ] Check doc (`docs/checks/phase-12/sub-12-3.md`)

## Success criteria

- [ ] `docs/report/` (or equivalent) holds the report; README links it
- [ ] No claim stronger than the data: every "nothing here" carries its sensitivity
- [ ] The expected-yield number reproduces from its script
- [ ] Decide, with reasons recorded, whether the report is also worth submitting anywhere (e.g. a
      short research note) — optional, not a success condition

## Key decisions

- Depends on 12-1 and 12-2 for final counts; can be drafted in parallel and finalized last.
- Numbers come from code, not memory — the lesson of `tally_hunt.py` (11-16).

## References

- Vision: `docs/vision/finding-our-own-planet.md` (§9 ceilings, decision D)
- Checks: `docs/checks/phase-11/` · Observation log: `docs/observations/instrument-log.md`
