# Sub-5-2: ExoplanetPage — Table + D3 Scatter Plot

**Phase 5 — Exoplanet | Milestone: Phase 5 — Exoplanet | Label: phase-5**

> *"5,000 dots appear on screen — that's the win."*

---

## Plan

PCTC: Plan → Code → Test → Check

Backend is done (sub-5-1: 6,298 planets cached, `/api/planets` live).
This sub-phase focuses entirely on the frontend: install D3, build the
table UI, and render a scatter plot. Sub-5-3 adds the timeline animation.

---

## Lights (implementation steps)

### A — D3 install + vendor chunk
- `npm install d3 @types/d3` inside `frontend/`
- Add `vendor-d3` manualChunks entry in `vite.config.ts` (same pattern as `vendor-three`)
- Verify `npm run build` still passes

### B — ExoplanetPage data layer
- Replace `ExoplanetPage.tsx` placeholder with real component shell
- `useState<Planet[]>`, `useState<boolean>` (loading), `useState<string | null>` (error)
- `useEffect` → `fetchPlanets()` on mount
- Loading spinner + error message while fetching

### C — FilterPanel component
- `frontend/src/components/exoplanet/FilterPanel.tsx`
- Discovery method checkboxes (Transit / Radial Velocity / Imaging / Microlensing / Astrometry / Other)
- Derive available methods from loaded data (no hardcoded list)
- Props: `methods: string[]`, `selected: Set<string>`, `onChange: (methods: Set<string>) => void`

### D — PlanetTable component
- `frontend/src/components/exoplanet/PlanetTable.tsx`
- Columns: `pl_name`, `hostname`, `discoverymethod`, `disc_year`, `pl_rade`, `pl_masse`, `pl_orbper`
- Client-side search (filter by `pl_name` or `hostname`)
- Client-side sort (click column header — asc/desc toggle)
- Pagination: 50 rows per page

### E — ScatterPlot component
- `frontend/src/components/exoplanet/ScatterPlot.tsx`
- D3 SVG: x = log₁₀(pl_orbper [days]), y = pl_rade [Earth radii]
- Color encode by `discoverymethod`
- Skip rows where `pl_orbper` or `pl_rade` is null
- `useRef<SVGSVGElement>` + `useEffect` (D3 owns the DOM inside)
- Cleanup: `return () => d3.select(ref.current).selectAll('*').remove()`
- Tooltip on hover (planet name + values)
- Click a dot → select planet (lift state up to ExoplanetPage)

### F — PlanetDetail side panel
- `frontend/src/components/exoplanet/PlanetDetail.tsx`
- Shown when a planet is selected (click in scatter or row click in table)
- Display all 12 fields; null values shown as `—`
- Close button (sets selected planet to null)

### G — Wire everything + build pass
- `ExoplanetPage.tsx`: integrate FilterPanel + PlanetTable + ScatterPlot + PlanetDetail
- View toggle: `[Scatter] [Table]` (timeline is sub-5-3)
- Apply FilterPanel selection to both table and scatter
- `npm run build` must pass with zero TS errors

---

## Success criteria

- [ ] `npm install d3` done, `vendor-d3` chunk appears in build output
- [ ] ExoplanetPage loads 6,298 planets from `http://localhost:8000/api/planets`
- [ ] PlanetTable shows paginated rows; search and sort work
- [ ] ScatterPlot renders 4,000+ colored dots (planets with valid orbper + rade)
- [ ] Clicking a dot opens PlanetDetail side panel
- [ ] FilterPanel checkboxes filter both table and scatter in sync
- [ ] `npm run build` passes (tsc + vite) — zero TS errors

---

## Key decisions

- **D3 pattern**: `useRef<SVGSVGElement>` + `useEffect` — D3 owns DOM inside `<svg>`;
  React only holds the ref. Cleanup removes all D3 children on unmount.
- **Client-side filter**: 6,298 rows is manageable in-browser. Backend filter params
  (TECHSPEC §2) deferred to sub-5-3 if needed.
- **Pagination over virtual scroll**: 50 rows/page keeps DOM small without complexity.
  Virtual scroll would be YAGNI here.
- **SVG over Canvas**: ~4,000 dots is fine for SVG. Canvas upgrade only if Lighthouse
  flags it in sub-5-3 perf pass (measurement-first).
- **Column `sy_dist`**: TECHSPEC §4 shows `st_dist` but the actual NASA API column is
  `sy_dist` (fixed in sub-5-1). Frontend type already uses `sy_dist`.

---

## References

- TECHSPEC §5 folder structure: `frontend/src/components/exoplanet/`
- TECHSPEC §2 architecture: D3 React integration pattern
- D3 React pattern: `useRef` + `useEffect` (TECHSPEC §5 note)
- NASA Exoplanet Archive — `sy_dist` is the correct system-distance column (not `st_dist`)
- Related issue: #28 (sub-5-1, completed)
