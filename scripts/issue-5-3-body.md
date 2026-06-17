# Sub-5-3: Timeline Animation + Lighthouse + Phase 5 Close

**Phase 5 — Exoplanet | Milestone: Phase 5 — Exoplanet | Label: phase-5**

> *"The one second when Kepler launches in 2009 and the dots explode — that's the soul of this sub-phase."*

---

## Plan

PCTC: Plan → Code → Test → Check

Sub-5-1 (backend) and sub-5-2 (table + scatter) are done.
This sub-phase completes Phase 5: the timeline animation that shows
how Kepler changed everything in 2009, a Lighthouse pass, and closing
the phase.

---

## Lights (implementation steps)

### A — TimelineView component
- `frontend/src/components/exoplanet/TimelineView.tsx`
- Data: compute client-side from already-loaded `planets[]` (no new API endpoint)
  - Group by `disc_year`, stack by `discoverymethod`, cumulative sum
- D3 stacked bar chart — x: year (1992–present), y: cumulative planet count
- Color by discovery method (reuse `getMethodColor` from FilterPanel)
- **Play/Pause animation**: bars grow year-by-year, ~200ms per year
- **Milestone markers**: vertical dashed lines at 2009 (Kepler launch) and 2018 (TESS launch)
- Tooltip on hover: year + count breakdown by method

### B — Wire TimelineView into ExoplanetPage
- Add `'timeline'` to `View` type
- View toggle becomes `[SCATTER] [TABLE] [TIMELINE]`
- TimelineView receives full `planets[]` (unfiltered — timeline shows all discoveries)

### C — Lighthouse run
- Run Lighthouse on `/exoplanet` (mobile preset)
- Target: Performance 85+
- Fix anything below threshold (likely: image sizing, unused JS, LCP)
- Document score in PR

### D — Phase 5 close
- Update `frontend/src/constants/phases.ts`: Exoplanet status `'in-progress'` → `'done'`
- Close GitHub Milestone `Phase 5 — Exoplanet`
- Update `docs/handoff.md` with Phase 5 summary
- Final commit: `chore(phase-5): close Phase 5 Exoplanet`

---

## Success criteria

- [ ] TimelineView renders cumulative discovery bars from 1992 to present
- [ ] Play animation shows year-by-year growth — Kepler 2009 spike is clearly visible
- [ ] Kepler (2009) and TESS (2018) marker lines labeled on chart
- [ ] TIMELINE tab appears in ExoplanetPage view toggle
- [ ] Lighthouse Performance >= 85 on `/exoplanet` (mobile)
- [ ] `phases.ts` Exoplanet status updated to `'done'`
- [ ] Milestone closed, handoff updated

---

## Key decisions

- **Client-side stats**: Timeline data computed from already-loaded `planets[]` —
  no new backend endpoint. 6,298 rows is trivial to aggregate in the browser.
  Backend `/api/planets/stats` deferred (YAGNI for this phase).
- **Stacked bars over animated dots**: PRD soul describes year-by-year dot animation
  but stacked bars are clearer for cumulative counts and more performant.
- **Full dataset for timeline**: Timeline ignores FilterPanel selection — it shows
  all discoveries ever, to preserve the Kepler 2009 spike regardless of method filter.
- **`getMethodColor` reuse**: Imported from FilterPanel to keep color encoding consistent
  across scatter, table badges, and timeline bars.

---

## References

- PRD §3: soul moment = Kepler 2009 launch spike in the timeline animation
- PRD §5 success criteria: Lighthouse Performance 85+
- TECHSPEC §8: sub-5-3 = D3 discovery timeline + Lighthouse + phase close
- Related issues: #28 (sub-5-1, closed), #29 (sub-5-2, closed)
