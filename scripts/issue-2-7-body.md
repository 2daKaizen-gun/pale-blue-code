## Plan
Finish Phase 2's non-functional requirements (PRD §6) and close the phase.
Measure first (fps + Lighthouse), then optimize from data rather than
assumptions. Hold desktop 60fps / mobile 30fps+, reach Lighthouse
Performance 85+ and time-to-interactive < 3s, add mobile touch selection,
and actually remove leva from the production bundle. Then run the Phase 2
close ceremony (handoff doc, milestone close, release tag).

## Lights
- [ ] L1 - Extract `useIsTouchDevice` into reusable `hooks/useIsTouchDevice.ts` (currently inlined in ControlPanel; foundation for adaptive quality)
- [ ] L2 - Add dev-only perf stats (drei `<Stats>`) and record Lighthouse/fps baseline
- [ ] L3 - Cap Canvas `dpr={[1, 2]}` and tune `gl` settings (expected biggest mobile win)
- [ ] L4 - Adaptive quality: `lib/quality.ts` single source ({ sphereSegments, starCount }), computed once in Scene, passed to Planet/Starfield as props
- [ ] L5 - Mobile touch: tap a body to select+track (decision B). Prevent drag-to-rotate from mis-firing selection; skip the mouse-only hover-preview path on coarse pointers
- [ ] L6 - Lazy-load the `/solar` route to defer three.js/R3F off the landing bundle
- [ ] L7 - Separate leva into a dev-only dynamic import so `useControls` leaves the prod module graph; tidy the Time(dev) dropdown

## Success criteria
- [ ] Desktop 60fps, mobile real-device 30fps+ (confirmed via Stats)
- [ ] Lighthouse Performance 85+
- [ ] Time-to-interactive < 3s
- [ ] leva absent from prod bundle (verified in build output)
- [ ] Mobile tap selects+tracks a body without conflicting with camera gestures
- [ ] No regressions in toggles / reset / keyboard shortcuts

## Key decisions
- Measure-first. TechSpec §6's "sphere 32 to 16 segments" is a hypothesis to validate against Stats/Lighthouse, not applied blindly. The likely primary culprit on mobile is device pixel ratio, not polygon count.
- Mobile interaction = single tap to select (decision B), consciously overriding TechSpec §1 ("short-tap = hover / long-press = click"). Reason: hover preview is a mouse affordance; on a cursor-less touch device a two-stage gesture is unnatural. TechSpec §1 to be updated at Check.
- Adaptive quality computed once in Scene (single matchMedia subscription via the extracted hook) and passed down as props; the 8 planets do not each subscribe.
- leva real separation: `useControls` runs unconditionally, so env-flag value-swapping does not tree-shake it out. A dev-only dynamic import is required, not just `<Leva hidden>`.
- Dependency doc fix: actual package.json has zustand 5.0.13 and vitest 4.1.6 (TechSpec matrix says 4.x / 2.1+). Correct in the Phase 2-to-3 handoff §2 (no behavior impact; doc-only).

## References
- PRD: `docs/specs/phase-2/PRD.md` (§6 non-functional, §5 quantitative targets)
- TechSpec: `docs/specs/phase-2/TECHSPEC.md` (§6 risks, §1 hover-panel row)
- Previous retrospective: `docs/checks/phase-2/sub-2-6.md`