## Plan

Build the DataPage frontend: search bar with autocomplete, D3 raw light curve chart (time series), and D3 phase-fold chart. Assemble them in DataPage with tab switching and loading UX.

**Goal**: Browser shows a Kepler-452 b transit dip in both raw and folded views.

## Lights (commit checklist)

- [x] C-1: `lib/api/lightcurve.ts` — LightCurveData / PhaseFoldData types + fetch wrappers
- [x] C-2: `PlanetSearchBar` — autocomplete from Phase 5 planets catalog
- [x] C-3: `LightCurveChart` — D3 scatter time series with zoom/pan
- [x] C-4: `PhaseFoldChart` — D3 monotone line + amber transit depth annotation
- [x] C-5: `DataPage` — assemble all components, tab toggle, loading messages, URL query param

## Success Criteria

- [x] `Kepler-452 b` search loads raw light curve showing periodic dips
- [x] PHASE FOLD tab renders U-shaped transit
- [x] Build passes (`npm run build`) — DataPage lazy chunk 10.96 kB
- [x] URL `?planet=` query param triggers auto-search (Phase 6-3 prep)

## Key Decisions

- D3 scatter (not line) for raw view — 5,000 points render faster as circles than a continuous path with gaps
- Zoom applied via `d3.zoom` on the SVG, rescaling only cx attributes (no re-render)
- Phase fold chart uses `d3.curveMonotoneX` — preserves the U-dip shape without overshoot

## References

- Phase 5 `ScatterPlot.tsx` — D3 useRef+useEffect+ResizeObserver pattern
- TechSpec §5 folder structure, §7 decimation
