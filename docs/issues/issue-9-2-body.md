## Plan

Frontend for the vetting engine (9-1). Turn the four numeric checks into a **Vetting Report** that a person with no astronomy background can read: each gate reveals in sequence with a plain-language verdict, then a trust summary. This is the "window into the telescope" — the reasoning is made visible, not hidden in a black box.

See `docs/specs/phase-9/PRD.md` §4 (user scenario) and `docs/specs/phase-9/TECHSPEC.md` §3, §4.

## Lights (expected commit order)

1. `frontend/src/lib/api/hunt.ts` — `fetchVetting` + `VettingReport` / `VettingCheck` types
2. `frontend/src/components/hunt/VettingReport.tsx` — per-gate Korean copy, pass/fail badges, trust summary card
3. `frontend/src/pages/HuntPage.tsx` — vet state; after BLS, call vetting in parallel with KOI check; insert report
4. Sequential reveal animation + mobile layout
5. `npm run build` passes

## Success criteria

- Confirmed target → all four gates ✓ + "trustworthy candidate" summary
- False-positive target → at least one gate ✗ + "likely eclipsing binary / not a planet" summary
- A non-expert can read the report and explain in their own words *why* a signal is or isn't a planet
- `npm run build` passes

## Key decisions

- Backend returns numbers + pass/fail; the Korean explanation strings live in `VettingReport.tsx` (KOIMatchCard precedent)
- Honesty UI rule (PRD §7): never assert "confirmed planet"; always "planet-like / trustworthy / possibly ..."
- Vetting runs in parallel with KOI check after BLS completes (independent state: `vetLoading` / `vetReport` / `vetError`)
- Reuse Phase 8 `base.ts` + `getJSON` helper for the client

## References

- `docs/specs/phase-9/PRD.md` (§4 scenario, §6 success criteria, §7 honesty rule)
- `docs/specs/phase-9/TECHSPEC.md` (§3 frontend, §4 API client)
- Reused: `components/hunt/KOIMatchCard.tsx` (copy/badge pattern), `lib/api/base.ts`
- Depends on: #9-1 (vetting endpoint)
