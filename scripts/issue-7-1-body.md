## Plan

Implement the BLS (Box Least Squares) period-search backend for Phase 7 — Signal.
Reuse Phase 6 PDCSAP_FLUX cache (`lc_*.json`) as BLS input — no MAST re-fetch.
`astropy.timeseries.BoxLeastSquares` is already installed via `lightkurve==2.4.2`.

## Lights

- [x] `backend/models/bls.py` — `BLSBest` + `BLSResponse` Pydantic models
- [x] `backend/services/bls.py` — BLS execution + `bls_*.json` file cache
- [x] `backend/routers/bls.py` + register in `main.py` — `GET /api/bls/{planet_name}`
- [x] Manual verification: `GET /api/bls/Kepler-452%20b` → `best.period` within ±1d of 384.84d

## Success Criteria

- `GET /api/bls/Kepler-452%20b` returns HTTP 200
- `best.period` is within ±1 day of 384.84 days (known Kepler-452 b orbital period)
- Missing light curve cache → HTTP 424 with clear message
- `npm run build` passes on every commit

## Key Decisions

- Period grid: `np.geomspace(1, 500, 10_000)` (log-uniform, covers hot Jupiters to Earth-like)
- Duration candidates: `[0.05, 0.1, 0.2]` (phase fraction, astropy BLS recommended)
- Cache key: `bls_{slug}.json` (no mission suffix — BLS is derived from already-cached lc data)
- lc cache lookup order: `lc_{slug}_kepler.json` → `lc_{slug}_tess.json` → HTTP 424

## References

- PRD: `docs/specs/phase-7/PRD.md`
- TechSpec: `docs/specs/phase-7/TECHSPEC.md` §2, §5
- Phase 6 cache pattern: `backend/services/mast.py`
