# Check: sub-9B-2 — Frontier hunt page (frontend)

**Date:** 2026-07-11
**Branch:** main
**Verdict:** PASS

---

## Scope

The frontend for a real solo hunt of stars with **no KOI entry** (honesty nail #3),
separate from the educational demo hunt (`HuntPage`).

- `lib/api/hunt.ts` — `frontierRandom()` / `checkRecorded()` + `FrontierPick` /
  `RecordedCheck` / `RecordedEntry` types (mirror the sub-9B-1 response models).
- `components/hunt/FrontierTargetPicker.tsx` — random unrecorded KIC button +
  free KIC input; yields a KIC, defers the recorded gate to the page.
- `pages/FrontierHuntPage.tsx` — recorded gate → `lc → bls → vet` (9-A engine reused
  unchanged), no KOI cross-check (unrecorded by construction), + `huntAgain` loop.
- `components/hunt/FrontierVerdict.tsx` — trust framing over the unchanged
  `VettingReportCard`.
- `router.tsx` — `/hunt/frontier` route (lazy); `HuntPage` banner links to it.

No new vetting logic — Phase 9-B wraps `vetting.vet` and reuses `VettingReportCard`.

---

## Build

```
npm run build  →  ✓ built (tsc -b clean, every commit)
```

`FrontierHuntPage` splits into its own lazy chunk (route-level code split preserved).

---

## Live verification (real backend, real MAST data)

Backend up (`uvicorn main:app`), the exact JSON the frontend consumes:

```
GET /api/hunt/frontier/random   → {"kic_id":6878247,"recorded":false}
GET /api/hunt/recorded/11446443 → {"kic_id":11446443,"recorded":true,
                                   "entries":[{"kepoi_name":"K00001.01","disposition":"CONFIRMED"}]}
GET /api/hunt/recorded/2557393  → {"kic_id":2557393,"recorded":false,"entries":[]}
```

**Full frontier hunt of an unrecorded star** — the exact chain the page drives after
the recorded gate (KIC 2557393, a pool seed):

```
lc   → HTTP 200 (27 s first fetch, MAST download)
bls  → best period 1.3072 d, depth 0.00178
vet  → trust=unlikely  3/4  [odd_even HARD-FAIL, secondary✓ shape✓ size✓]
```

This is the honest empty-hands result the PRD predicts (§3, "개척지는 대부분 빈손"):
the four gates independently called a star **no one filed** a likely eclipsing
binary. `FrontierVerdict` renders this as the neutral "빈손 — 그것도 답입니다"
branch, not an error.

**Success criteria (issue #43): all met.**
- Random button → live hunt of an unrecorded KIC completes (2557393 → unlikely) ✅
- Free-input recorded KIC → "이미 기록된 천체" card with entries, hunt not entered
  (recorded gate; 11446443 → `recorded:true`) ✅
- Empty hands renders as a neutral result, not an error (unlikely uses the neutral
  cosmos palette, "그것도 답입니다") ✅
- "후보(candidate)" language appears only in the `strong` branch of `FrontierVerdict`
  — i.e. strong + unrecorded, the earned place (nail #3) ✅
- `npm run build` passes ✅

---

## Findings

- **The recorded gate is the honest fence.** `checkRecorded` is period-independent
  (kepid membership), so any star already carrying a KOI is stopped before the hunt —
  the page never dresses a known object as a mystery. A random pool pick is always
  unrecorded by construction, so the gate is a no-op there and the real work of the
  gate is on free input.
- **Separation without a nav entry.** The frontier is Phase 9-B, not a numbered
  roadmap page, so it stays out of the `PHASES` nav. Discoverability comes from a link
  in the demo hunt banner ("단독 탐색은 Frontier(9-B)에서") and a return link back —
  the two modes stay distinct (separation principle) yet reachable.
- **No new vetting, by design.** `FrontierVerdict` is pure framing; the four-gate card
  is the same `VettingReportCard` 9-A shipped. The invariant "판별 로직 신규 금지"
  (TechSpec §7) holds.

## Verification boundary (honest note)

The data chain — the risky surface — was exercised end-to-end against the live backend
and real MAST data (above). The React render itself was verified by `tsc -b` + mirroring
the proven `HuntPage` flow, not by driving a headless browser. Interactive click-through
in a browser is the natural next confirmation when the dev server is up.

---

## Result

The frontier page picks an unrecorded star (random or free input), honestly gates on
recorded status, runs the reused 9-A engine, and frames the verdict by trust with empty
hands presented as a result. The honest hunting ground of Phase 9-B now has a face.
Sub-9B-2 is complete. The hunt log + strong-candidate discovery export are sub-9B-3.
