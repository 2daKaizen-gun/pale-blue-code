## Plan
Integrate Lightkurve (NASA's MAST client library) into the existing FastAPI backend.
Add two new endpoints that fetch, normalize, and cache Kepler/TESS light curve data
for any planet in the Phase 5 catalog. The file-based cache ensures MAST is only
called once per planet; subsequent requests return in <500ms.

## Lights
- [x] Light A — add lightkurve to requirements.txt, create backend/cache/.gitkeep, models/lightcurve.py (LightCurveResponse + PhaseFoldResponse)
- [x] Light B — services/mast.py: Lightkurve wrapper + file cache (load/save) + decimation (max 5000 pts)
- [x] Light C — routers/lightcurves.py: GET /api/lightcurve/{planet_name} + GET /api/lightcurve/{planet_name}/folded
- [x] Light D — register router in main.py, local curl smoke test, commit

## Success criteria
- [x] curl /api/lightcurve/Kepler-452 b returns time[] and flux[] arrays
- [x] curl /api/lightcurve/Kepler-452 b/folded returns phase[] and flux[] arrays
- [x] Second call hits file cache and returns in <500ms
- [x] Nonexistent planet returns HTTP 404

## Key decisions
- PDCSAP_FLUX (pre-conditioned) over SAP_FLUX (raw)
- Kepler mission first, TESS fallback
- Hostname resolved from existing planets cache (app.state.planets DataFrame)
- backend/cache/ is gitignored (generated data)

## References
- PRD: docs/specs/phase-6/PRD.md
- TechSpec: docs/specs/phase-6/TECHSPEC.md