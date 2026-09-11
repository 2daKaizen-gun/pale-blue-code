## Plan

Continue the sector-102 widening sweep that sub-11-27 opened (10 of 100 searched, one new
Earth-size-sensitive target). Fetch and search the next batch of 8 dwarfs through the unchanged
`mono-v2` pipeline, from the pool's own file (`--pool data/pool_s0102.json`), leaving the tracked
frontier (sector 105) untouched.

**Which 8, and why not the predictor's order.** sub-11-27 wrote "continue predictor-guided". Re-run
today on 188 searched stars, `predict_earth_reach.py` predicts **zero** Earth-size positives among the
90 unsearched, and its held-out recall has fallen to **0.20** (from 0.25). With no positive to act on,
its ranking of the non-positives (in-sample R² 0.17) is not guidance: its top picks are bright
Tmag ~6.4 stars at R★ ~1.1, predicted ~3.3 R⊕. So this batch follows the fetch plan's own order —
smallest achievable planet first — the order that produced most of the 12 Earth-size-sensitive
targets, including TIC 107548305, which the predictor had called non-Earth. The predictor stays a
pre-filter for *positives*; with none, it steps aside.

This is an observation sub-phase that may run across several sessions. Per the tracking rule adopted
alongside it, **each batch is recorded as a comment on this issue**, and the issue closes when the
sweep (or the session's decision to stop) closes.

## Lights

- [ ] Batch 1 — next 8 smallest-achievable dwarfs fetched (`fetch_plausible.py --pool`) and searched
      (`search_pending.py --pool`); tally recomputed from the caches, never by hand
- [ ] Every significant event named by the gate that rejected it; any candidate inspected against
      the raw curve before it is believed
- [ ] Achieved completeness and the Earth-size dossier recomputed across the three pools
- [ ] Instrument log + check doc (`docs/checks/phase-11/sub-11-28.md`)

## Success criteria

- [ ] 8 more sector-102 dwarfs searched; cumulative tally for the pool from `tally_hunt.py --pool`
- [ ] frontier pool (sector 105, 100/100) untouched — every command carries `--pool`
- [ ] MAST failures retried or left `not_fetched`, never counted as verdicts
- [ ] the predictor's zero-positive state and the ordering decision recorded honestly
- [ ] pytest + vitest + `npm run build` green

## Key decisions

- Fetch-plan order over predictor order while the predictor has no positives (above).
- One issue for the whole sweep; batches as comments — the rule this sweep is the first to follow.

## References

- Previous: `docs/checks/phase-11/sub-11-27.md` (#75)
- Vision: `docs/vision/finding-our-own-planet.md` §9-3
- Observation log: `docs/observations/instrument-log.md`
