## Plan

Set up the FastAPI backend from scratch and wire it to the NASA Exoplanet Archive public TAP API. The server caches 5,000+ planet records on startup and serves them via `/api/planets`. Deploy to Railway. Add a typed frontend API client so sub-5-2 can start building UI immediately.

This sub-phase is the foundation for all Phase 5–8 Python work: a stable, deployed backend that returns real astronomy data.

## Lights

- [ ] A — `backend/` scaffold: `requirements.txt` + `main.py` FastAPI skeleton (`/api/health`)
- [ ] B — `services/archive.py`: async httpx client for NASA TAP API, raw fetch verified
- [ ] C — Pandas preprocessing: column selection, null handling, `default_flag=1` filter
- [ ] D — `models/planet.py` Pydantic + `routers/planets.py` `/api/planets` endpoint
- [ ] E — `lifespan` event: cache full archive data on server startup
- [ ] F — CORS middleware + `.env.example` + Railway deployment
- [ ] G — Frontend `lib/api/exoplanet.ts`: fetch wrapper + Planet type + `npm run build` passes

## Success criteria

- [ ] `GET /api/planets` returns 5,000+ planet records as JSON
- [ ] `GET /api/health` returns `{"status": "ok"}`
- [ ] Railway deployment live and reachable from the Vercel frontend origin
- [ ] `npm run build` passes with the new API client types
- [ ] `/exoplanet` page logs planet data to console on load (UI deferred to 5-2)

## Key decisions

- **httpx (async)** over requests (sync) — matches FastAPI async event loop in lifespan
- **In-memory cache via `lifespan`** — 5,000 rows ~500 KB; Redis is YAGNI for this scale
- **Direct NASA TAP HTTP** over AstroQuery — fewer dependencies, same underlying API, more transparent
- **No Dockerfile** — Railway nixpacks auto-detects Python + `requirements.txt`

## References

- PRD: `docs/specs/phase-5/PRD.md`
- TechSpec: `docs/specs/phase-5/TECHSPEC.md`
- NASA TAP API: `https://exoplanetarchive.ipac.caltech.edu/TAP/sync`
