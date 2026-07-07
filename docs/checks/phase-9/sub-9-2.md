# Check: sub-9-2 — Vetting Report (frontend)

**Date:** 2026-07-07
**Branch:** main
**Verdict:** PASS

---

## Scope

New files: `components/hunt/VettingReport.tsx`, `components/ui/Reveal.tsx`;
modified `lib/api/hunt.ts` (+`fetchVetting`, `VettingReport`/`VettingCheck`/`CheckName`
types), `pages/HuntPage.tsx` (vet state + parallel fetch + card), `index.css`
(reveal keyframe).

The four-gate `VettingReport` from 9-1 is now fetched, rendered in plain Korean,
wired into the hunt flow, and animated.

---

## Lights

1. `fetchVetting` client + types mirroring the backend `VettingReport` (incl.
   `bls_period` + `alias_factor` for the teaching window). (27bb73b)
2. `VettingReportCard` — per-gate labels/copy, ✓/✗ badges, HARD marker,
   metric hints, trust card (strong/weak/unlikely), and the "주기 교정" alias note.
   Honesty rule enforced: never asserts "confirmed planet". (6e25b96)
3. HuntPage wiring — after BLS resolves, vetting runs **in parallel** with the KOI
   cross-check; vet failure is isolated to `vetError` so it never blanks BLS/KOI.
   Card renders below `BLSResultCard` with its own inline loading state. (605154c)
4. Sequential-reveal animation — each result card fades + slides up on mount;
   plain-CSS keyframe (never silently no-ops) respecting `prefers-reduced-motion`. (0cd655d)

---

## Build gate

```
npm run build → ✓ built in ~2–4s   (tsc -b clean, 0 type errors)
```

Run at every commit.

---

## Live end-to-end verification

Card renders correctly (confirmed visually by user): header, "주기 교정" alias box,
per-gate ✓/✗ badges, and the trust summary card all paint — including custom cosmos
tokens and standard-palette opacity classes (the "빌드 통과 ≠ 클래스 유효" invariant
held because the card uses solid custom tokens + standard-palette opacity only).

**Anchor (cached), KIC 11446443:** `strong 4/4`, BLS 1.235 d → true 2.471 d (×2) —
alias teaching note visible.

**Live virgin hunt, KIC 10583180** (previously uncached — closes the HANDOFF §4
"cache-miss E2E unverified" item for this target):
- LC 64,722 → 5,394 pts (55 s cold) · BLS P = 2.696 d, depth 280 ppm · vet 3/4
- **Independent verdict: UNLIKELY — secondary-eclipse HARD fail (eclipsing binary).**
- KOI cross-check: **K00748.01 → FALSE POSITIVE.**
- → Our engine, on a target never used for calibration, reached NASA's disposition
  from the light curve alone. Independent agreement = the engine is trustworthy.

---

## Honesty finding → Phase 9-B

The live hunt exposed a real honesty debt: the five curated hunt targets are all
**known KOIs dressed up as mysteries** ("suspected", "contested"). The vetting is
honest, but the *targets* are theater — a genuine "we found it ourselves" requires
stars with **no KOI entry at all**. Recorded, with the real-solo-hunt design, in
`docs/specs/phase-9/9B-PLAN.md` (못 3 — "the hunting ground must be honest too").

---

## Result

Vetting report is fetched, rendered, wired, and animated; build passes at every
commit; the card is confirmed rendering in the browser; and the engine was validated
live on a non-anchor target against NASA's catalog. Sub-9-2 frontend is complete.
The remaining 9-A light is sub-9-3 (discovery record v2).
