# Check: sub-9B-3 — Hunt log + frontier discovery export

**Date:** 2026-07-16
**Branch:** main
**Verdict:** PASS

---

## Scope

The closing movement of the frontier track (Phase 9-B). sub-9B-2 gave the frontier
a face — pick an unrecorded star, gate on recorded status, run the reused 9-A vetter,
frame the verdict. sub-9B-3 makes it honest **over time** and lets a real find be kept.

- `lib/huntLog.ts` — append-only outcome log in localStorage, split into a pure
  aggregation core (`computeStats` / `appendEntry` / `parseLog` / `serializeLog`)
  and a thin storage wrapper (`loadHuntLog` / `recordHunt` / `clearHuntLog`).
- `lib/huntLog.test.ts` — 8 tests pinning the two things that make the tally honest.
- `components/hunt/HuntLog.tsx` — the "N번 사냥, 후보 M" panel; empty hands as fact.
- `pages/FrontierHuntPage.tsx` — records every terminal outcome, shows the panel,
  and surfaces `DiscoveryActions` **only** for a strong + unrecorded verdict.

No new vetting logic and no new backend — the data chain is sub-9B-1/2, unchanged.

---

## Build & tests

```
npm run build   →  ✓ built (tsc -b clean); FrontierHuntPage stays a lazy chunk (13.6 kB)
npx vitest run  →  14 files, 145 passed  (huntLog: 8 new)
```

The hunt-log aggregation is a pure core so it tests under the `node` vitest env
(no jsdom). The two honest invariants it pins:

- **`hunts` counts only vetter-run outcomes.** A star turned away at the gate
  (`recorded` / `no_lc`) is *not* a hunt, so it never inflates the "N번 사냥"
  denominator — the honest majority "37 hunts, 0 candidates" stays truthful.
- **A corrupt store degrades to an empty log, never a crash.** `null`, `''`,
  non-JSON, wrong-shape, and per-entry malformed values are all tolerated; valid
  entries survive, bad ones are dropped.

---

## Live verification (real backend, real MAST data)

Backend up (`uvicorn main:app`, :8001). The wiring must not disturb the data chain
the page drives; re-confirmed end-to-end:

```
GET /api/hunt/frontier/random   → {"kic_id":6195632,"recorded":false}
GET /api/hunt/recorded/11446443 → {"recorded":true, entries:[K00001.01 CONFIRMED]}
GET /api/hunt/recorded/2557393  → {"recorded":false, entries:[]}

Full hunt of a pool seed (KIC 2557393):
  lc  → 469 pts
  bls → best period 1.3072 d, depth 0.00178
  vet → trust=unlikely  3/4  [odd_even HARD-FAIL, secondary✓ shape✓ size✓]
```

Mapped through the new wiring, that verdict logs as one **`unlikely`** outcome →
`hunts +1`, `emptyHands +1`, `candidates 0`; the panel reads "1번 사냥, 후보 0 —
개척은 원래 이렇습니다", and `DiscoveryActions` does **not** render (trust ≠ strong).
This is the honest empty-hands path exercised against live data.

The strong-find branch (rare by construction) is verified by composition, not a
live strong hit: `DiscoveryActions` renders iff `vetReport.trust === 'strong'`, and
`buildDiscoveryRecord(kic, bls, [], strongReport)` is a pure function that yields
`koi_cross_check.in_catalog: false`, `disposition: null`, and the four-gate
`vetting` evidence — the earned discovery@2 record (9B-PLAN §6).

---

## Honesty audit (nail #3)

The final read against 9B-PLAN §3-3 ("발견"은 strong+미기록일 때만; 빈손은 결과):

- **"발견/후보" is gated to the earned place.** The candidate count is the only
  figure the panel lets celebrate, and only because a frontier `strong` is strong
  **and** unrecorded. `DiscoveryActions` (header "발견 기록", report links) appears
  only for that verdict — weak and empty hands are tallied, never offered for export
  or citizen-science report.
- **Empty hands is a result, not a failure.** The panel states "개척은 원래
  이렇습니다" and `FrontierVerdict.unlikely` reads "빈손 — 그것도 답입니다"; neither
  uses error styling.
- **The denominator is honest.** Gate rejections (recorded / no-lc) are shown apart
  from the hunt count, so "N번 사냥" only ever means hunts that actually ran.

---

## Findings

- **The log is the frontier's memory of its own honesty.** A single empty hand is
  easy to accept; the tally is where the honest texture ("mostly empty") becomes
  undeniable over a session. Persisting it in localStorage — never leaving the
  browser — keeps that memory without a backend or an account (9-C's concern).
- **Reuse held.** `DiscoveryActions` and `buildDiscoveryRecord` are the sub-9-3
  components unchanged; the frontier passes `matches=[]` and the discovery@2 record
  reads `in_catalog: false` for free. No new vetting, no new export path.
- **strong-only export is the spec, not a tightening.** 9B-PLAN §6 scopes the
  discovery record to strong + unrecorded; gating on trust makes that the *only*
  way the export can appear, so the honest rule can't be sidestepped by the UI.

## Verification boundary (honest note)

The data chain and the empty-hands path were exercised end-to-end against the live
backend. The React render and the strong-find export were verified by `tsc -b`,
the 145-test suite, and pure-function composition — not by a live strong hit (rare
by design) or a headless-browser click-through. Interactive confirmation in a browser
is the natural next step when the dev server is up.

---

## Result

The frontier now keeps an honest, persistent tally of its hunts — "N번 사냥, 후보 M"
— with empty hands presented as a result, and it exports a discovery@2 record with
vetting evidence for the one earned case: a strong verdict on a star no one filed.
The four honesty nails hold. Phase 9-B — opening the gate — is complete; the far
future (accounts, a discovery repository, community) is Phase 9-C.

Closes #44.
