## Plan

Phase 12 closes the hunt honestly: finish what is open, state the result, and leave the door open.
This first sub-phase finishes the **sector-102 sweep** that #76 (11-28) carried to 18 of 100. The
remaining **82 dwarfs** are fetched and searched through the unchanged `mono-v2` pipeline from the
pool's own file (`--pool data/pool_s0102.json`), leaving the tracked frontier untouched.

Order stays the fetch plan's (smallest achievable planet first): the Earth-size predictor has zero
positives left in this pool (recall 0.20, see #76), so it steps aside. The plan has climbed into
R★ ~0.6 dwarfs, so Earth-size reach in the remainder is expected to be low — that is recorded as a
bound, not hidden.

Like #76, this is a multi-session observation sub-phase: **each batch is a comment on this issue**,
and the issue closes when the pool reaches 100 of 100.

## Lights

- [ ] Batches of ~8: `fetch_plausible.py --pool` then `search_pending.py --pool`; tally from the
      caches (`tally_hunt.py --pool`), never by hand
- [ ] MAST failures retried or left `not_fetched` — an error is never a verdict
- [ ] Every significant event named by the gate that rejected it; any candidate read against the
      raw curve before it is believed
- [ ] At 100/100: achieved completeness (`completeness_hunt.py --pool`) and the Earth-size dossier
      recomputed across all pools
- [ ] Instrument log + check doc (`docs/checks/phase-12/sub-12-1.md`)

## Success criteria

- [ ] Sector 102: 100 of 100 searched, cumulative tally recomputed from caches
- [ ] Achieved sensitivity stated per star (best / median R⊕, Earth-size count)
- [ ] Tracked frontier file untouched — every command carries `--pool`
- [ ] pytest + eslint + vitest + `npm run build` green

## Key decisions

- Continues #76 rather than reopening it: 11-28 closes at batch 1 (18/100), the rest lands here
  under the phase that ends the hunt.
- Fetch-plan order while the predictor has no positives.

## References

- Previous: `docs/checks/phase-11/sub-11-28.md` (#76), `sub-11-27.md` (#75)
- Handoff: `docs/phase-handoffs/phase-11-to-12.md`
- Vision: `docs/vision/finding-our-own-planet.md` §9
- Observation log: `docs/observations/instrument-log.md`
