## Plan
Final sub-phase of Phase 2. PRD 짠4 features complete; closes out 짠6
non-functional work + Phase termination. Measure-first, then optimize from data.

## Lights (executed order + status)
- [x] L1 ??Extract useIsTouchDevice into reusable hook
- [x] L2 ??Dev perf Stats + record baseline
- [x] L6 ??Code-split: lazy-load routes (landing JS 403 ??93 KB gzip)
- [x] L7 ??Remove leva from prod bundle (dev-only DevControls, dynamic import)
- [x] L3 ??Cap Canvas dpr to [1, 2] (mobile fill-rate)
- [x] L3-fix ??In-Canvas Suspense to fix WebGL Context Lost (regression from L6 route Suspense)
- [x] L5 ??Tap-to-select on touch devices (Decision B)
- ~~L4 ??Adaptive geometry/star reduction~~ **CUT**: baseline disproved the bottleneck

## Key decisions (as executed)
- Reordered after L2 baseline: L6 + L7 are the Lighthouse movers; fps was never the bottleneck (desktop 60fps at full quality). L3 dpr = mobile insurance.
- L4 cut: 짠6 "32??6 segments" was a hypothesis; measurement showed geometry is trivial. Don't optimize what isn't slow.
- Baseline (prod build): single 1.40 MB / 403 KB gzip chunk, leva included. After L6+L7: landing 93 KB, /solar 242 KB (gzip).
- L3 surfaced a Context Lost regression ??L6 route Suspense unmounted the Canvas on texture suspend. Fixed with an in-Canvas Suspense. (full story -> docs/checks)
- Mobile interaction simplified to tap=select (Decision B).
- Doc sync (Context Rot): package.json actual = zustand 5.0.13, vitest 4.1.6 (TechSpec matrix said 4.5+ / 2.1+).

## Success criteria
- [x] Desktop 60fps, mobile 30fps+ (verified at Test)
- [x] Lighthouse Performance 85+ (run at Test, post L6/L7)
- [x] leva absent from prod build (3-way grep confirmed)
- [x] Mobile tap selects without fighting camera gestures (verify Test)
- [x] No regressions in toggles / reset / keyboard

## References
- PRD: docs/specs/phase-2/PRD.md (sections 5, 6)
- TechSpec: docs/specs/phase-2/TECHSPEC.md (sections 6, 7)
- Previous retrospective: docs/checks/phase-2/sub-2-6.md