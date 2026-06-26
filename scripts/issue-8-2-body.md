## Plan

Implement the HuntPage frontend for Phase 8 — Hunt.
Replace the placeholder at `/hunt` with a full hunt flow:
target selection -> LC fetch -> BLS run -> KOI cross-check -> result reveal.
Reuse `PeriodogramChart.tsx` and `BLSResultCard.tsx` from Phase 7 unchanged.

## Lights

- [ ] `frontend/src/lib/api/hunt.ts` -- fetchHuntTargets, fetchHuntLC, fetchHuntBLS, fetchKOICheck
- [ ] `frontend/src/components/hunt/HuntTargetCard.tsx` -- target selection card (kic_id, label, description, hint)
- [ ] `frontend/src/components/hunt/KOIMatchCard.tsx` -- KOI result card (CANDIDATE amber / CONFIRMED green / unregistered red)
- [ ] `frontend/src/pages/HuntPage.tsx` -- replace placeholder: target grid + sequential LC->BLS->KOI flow
- [ ] `frontend/src/constants/phases.ts` -- Phase 8 status: planned -> done
- [ ] `npm run build` passes

## Success Criteria

- `/hunt` loads target grid (5-7 cards from `GET /api/hunt/targets`)
- Card click -> LC loading -> BLS loading -> KOI check -> result render
- CANDIDATE target: PeriodogramChart peak near KOI period, KOIMatchCard shows amber "CANDIDATE" badge
- Unregistered target: KOIMatchCard shows "not in catalog" state + Planet Hunters link
- KIC manual input field works (valid KIC -> full hunt flow, invalid -> error message)
- `PeriodogramChart` and `BLSResultCard` reused from Phase 7 with zero modifications
- `npm run build` passes on every commit

## Key Decisions

- Sequential async flow: LC fetch completes first, then BLS, then KOI check (each has own loading state)
- Loading messages per step: "Downloading Kepler data..." -> "Running BLS analysis..." -> "Cross-referencing KOI catalog..."
- KOIMatchCard disposition variants: CANDIDATE (amber), CONFIRMED (green), FALSE POSITIVE (gray), empty (red/purple)
- No phase-fold view -- Hunt focuses on periodogram signal only
- External report links: Planet Hunters TESS (https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess)

## References

- PRD: `docs/specs/phase-8/PRD.md`
- TechSpec: `docs/specs/phase-8/TECHSPEC.md` ss3, ss4, ss5
- Phase 7 reuse: `components/signal/PeriodogramChart.tsx`, `components/signal/BLSResultCard.tsx`
- Backend: Issue #36 (sub-8-1)
