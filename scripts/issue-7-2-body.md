## Plan

Implement the SignalPage frontend for Phase 7 — Signal.
Connect the BLS backend (`GET /api/bls/{planet_name}`) to a D3 periodogram chart and result card.
Build on Phase 6 patterns: `useRef + useEffect + ResizeObserver` for D3, `useSearchParams` for URL params.

## Lights

- [x] `frontend/src/lib/api/bls.ts` -- BLSData type + fetchBLS API client
- [x] `frontend/src/components/signal/PeriodogramChart.tsx` -- D3 log-scale periodogram (single path line, peak marker)
- [x] `frontend/src/components/signal/BLSResultCard.tsx` -- best candidate card (period, duration, depth, power)
- [x] `frontend/src/pages/SignalPage.tsx` -- replace placeholder: PlanetSearchBar + "Find Period" button + chart + card
- [x] `frontend/src/pages/DataPage.tsx` -- add "Signal" link in tab bar (navigates to /signal?planet=...)
- [x] `frontend/src/constants/phases.ts` -- Phase 7 status: planned -> in-progress
- [x] `npm run build` pass

## Success Criteria

- `/signal?planet=Kepler-7+b` auto-triggers BLS search
- "Find Period" button -> loading message -> PeriodogramChart renders
- Peak marker lands near 4.886 days
- BLSResultCard shows period ~4.88 days, depth ~2.46%, duration in hours
- DataPage PHASE FOLD tab bar includes "Signal" link
- `npm run build` passes on every commit

## Key Decisions

- Duration display: `best.duration * 24` hours (duration is in days -- service uses [0.1, 0.3, 0.5] days candidates)
- D3 periodogram: single path line render (NOT circles -- 10,000 points)
- x-axis: `d3.scaleLog()` domain [1, 500 days]
- Peak marker: vertical dashed line + label at `best.period`
- Loading message warns of up to 60s on first run (full-resolution LC download + BLS)

## References

- PRD: `docs/specs/phase-7/PRD.md`
- TechSpec: `docs/specs/phase-7/TECHSPEC.md` ss3, ss4, ss5
- Backend endpoint: `GET /api/bls/{planet_name}` (sub-7-1, Issue #34)
