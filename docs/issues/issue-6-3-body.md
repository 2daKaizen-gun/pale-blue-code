## Plan

Add TransitInfo panel (depth, estimated radius, orbital period), wire ExoplanetPage -> DataPage navigation via `?planet=` URL param, run Lighthouse, and close Phase 6.

**Goal**: Clicking a planet in ExoplanetPage opens its light curve in DataPage with full transit details shown.

## Lights (commit checklist)

- [x] D-1: `TransitInfo` — transit depth %, estimated radius (Rp = R* x sqrt(delta)), known catalog radius
- [x] D-2: `PlanetDetail` — add "광도곡선 보기" link to `/data?planet=...`
- [x] D-3: `DataPage` — read `?planet=` on mount via `useSearchParams`, resolve planet from catalog for TransitInfo
- [x] D-4: Lighthouse run — /data page >= 85 mobile
- [x] D-5: Phase 6 close — handoff doc + Milestone close + Release tag v0.6.0

## Success Criteria

- [x] ExoplanetPage planet click -> "광도곡선 보기" -> DataPage loads that planet's light curve
- [x] TransitInfo shows transit depth, estimated radius, known radius side by side
- [x] Lighthouse Performance >= 85 on /data (mobile)
- [x] `docs/phase-handoffs/phase-6-to-7.md` written
- [x] GitHub Release v0.6.0 tagged

## Key Decisions

- Radius estimate uses R* = 1 R_sun assumption with explicit disclaimer — accurate enough for transit photometry intuition
- `useSearchParams` (react-router-dom) for URL reading — no extra state management needed

## References

- PRD §4 scope: TransitInfo + Planet linkage
- TechSpec §4 PhaseFoldResponse model (transit_depth field)
- Phase 5 `PlanetDetail.tsx` Row component pattern
