## Plan

Implement the Hunt backend for Phase 8 — Hunt.
Download NASA KOI catalog snapshot and build hunt-specific endpoints:
`GET /api/hunt/targets`, `GET /api/hunt/lc/{kic_id}`, `GET /api/hunt/bls/{kic_id}`, `GET /api/hunt/koi-check`.
Reuse `bls_service.run_bls` directly -- KIC slugs (`kic-XXXXXXX`) are compatible with existing cache pattern.

## Lights

- [ ] `scripts/download_koi_catalog.py` -- one-time script to fetch NASA KOI table as CSV
- [ ] `backend/data/koi_catalog.csv` -- NASA cumulative KOI snapshot (kepid, kepoi_name, koi_disposition, koi_period)
- [ ] `backend/models/hunt.py` -- HuntTarget, KOIMatch, HuntLCResponse Pydantic models
- [ ] `backend/services/hunt.py` -- `get_targets()` (curated KIC list) + `fetch_lc_by_kic(kic_id)` + `koi_check(kic_id, period)`
- [ ] `backend/routers/hunt.py` + register in `main.py` -- 4 endpoints
- [ ] Manual verification: curated CANDIDATE target BLS peak within +/-5% of KOI recorded period
- [ ] `npm run build` passes

## Success Criteria

- `GET /api/hunt/targets` returns 5-7 curated KIC targets
- `GET /api/hunt/lc/{kic_id}` returns decimated light curve for a valid KIC
- `GET /api/hunt/bls/{kic_id}` returns periodogram + best candidate (reuses bls_service)
- `GET /api/hunt/koi-check?kic_id={id}&period={p}` returns CANDIDATE/CONFIRMED/empty list
- CANDIDATE target: BLS peak period within +/-5% of KOI koi_period
- Missing LC -> HTTP 424 with clear message
- `npm run build` passes on every commit

## Key Decisions

- KIC numbers passed as `"KIC XXXXXXX"` to bls_service -- slug becomes `kic-XXXXXXX`, cache-compatible
- LC cache must include `hostname = "KIC XXXXXXX"` so BLS `_get_full_lc` can re-search via lightkurve
- KOI catalog: local CSV snapshot, no NASA API calls at runtime (network-free cross-check)
- KOI cross-check tolerance: +/-5% of BLS peak period
- Curated target mix: 2-3 CANDIDATE KOI hosts + 1-2 unregistered stars + 1 CONFIRMED (BLS sanity check)
- `lk.search_lightcurve("KIC XXXXXXX", mission="Kepler", author="Kepler", exptime="long")`

## References

- PRD: `docs/specs/phase-8/PRD.md`
- TechSpec: `docs/specs/phase-8/TECHSPEC.md` ss2, ss5
- BLS service: `backend/services/bls.py` (run_bls, _get_full_lc)
- Phase 7 cache pattern: `backend/cache/bls_*.json`, `bls_lc_*.json`
