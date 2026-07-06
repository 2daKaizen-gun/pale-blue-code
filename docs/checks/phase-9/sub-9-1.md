# Check: sub-9-1 — Vetting Engine (backend)

**Date:** 2026-07-06
**Branch:** main
**Verdict:** PASS

---

## Scope

New files: `models/vetting.py`, `services/vetting.py`, `tests/test_vetting.py`,
`requirements-dev.txt`; modified `routers/hunt.py`.
Endpoint: `GET /api/hunt/vet/{kic_id}` → `VettingReport` (424 when BLS not cached).

Four light-curve gates + trust synthesis, plus a **de-aliasing** step that recovers
the fundamental period before vetting (added mid-sub-phase — see Findings).

---

## Tests (`pytest`)

```
17 passed in 0.29s
```

Synthetic anchors (deterministic, seeded):
- model planet (equal odd/even depth, no secondary, flat bottom, planet-range size) → `strong` 4/4
- model eclipsing binary (odd/even mismatch + secondary eclipse) → `unlikely`, ≥1 hard fail
- de-alias: half-period alias → ×2 recovered; double-period superharmonic → ×0.5 recovered; true period → no-op

Vetting computation time: **57 ms** on cached input (well under the 1 s target).
End-to-end first call ~1.5 s is dominated by `_detrend` (676 ms) + BLS cache parse
(324 ms), both inherited from BLS; the report is memoized as `vet_{slug}.json`.

---

## Real-data anchor calibration

Run over all cached targets. `BLS→P (×factor)` shows de-aliasing.

| Target | BLS → P | trust | Note |
|--------|---------|-------|------|
| **KIC 11446443** (confirmed, TrES-2b) | 1.235 → **2.471** (×2) | **strong 4/4** | ✅ success criterion: confirmed planet passes |
| **KIC 9140402** (KOI CANDIDATE K00928.01) | 9.977 → **2.494** (×0.25) | **strong 4/4** | ✅ recovered true KOI period from a 4× superharmonic |
| KIC 11442793 | 331.6 (×1) | strong 4/4 | |
| Kepler-6b | 3.235 (×1) | strong 4/4 | hot Jupiter |
| Kepler-7b | 4.885 (×1) | strong 4/4 | hot Jupiter |
| Kepler-32c | 384.2 (×1) | strong 4/4 | |
| Kepler-259c | 16.23 → 8.115 (×0.5) | strong 4/4 | |
| **KIC 7340288** | 26.84 (×1) | **unlikely 3/4** | ✅ false-positive anchor: secondary eclipse HARD fail (sec S/N 7.8) |
| Kepler-452b | 428.8 (×1) | weak 3/4 | shallow grazing Earth-size — honest "candidate, needs review" |
| Kepler-22b | 336.1 (×1) | unlikely 3/4 | see Limitations |

**Success criteria (issue #39): all met.**
- Synthetic planet → strong; synthetic EB → unlikely ✅
- Confirmed KIC 11446443 → 4/4 ✅
- False-positive anchor (KIC 7340288) → ≥1 hard fail ✅
- `pytest` passes; vetting computation < 1 s ✅

---

## Endpoint

```
GET /api/hunt/vet/11446443 → 200
  trust=strong  P=2.4706  BLS=1.2353 (×2)  4/4  [odd_even✓ secondary✓ shape✓ size✓]
GET /api/hunt/vet/9999999 → 424
  detail.message: "BLS not cached for KIC 9999999. Run GET /api/hunt/bls/9999999 first."
```

---

## Findings

- **De-aliasing was necessary, not optional.** Applied at the raw BLS period, the
  odd/even gate fails the confirmed anchor KIC 11446443 (unlikely 2/4): BLS locks
  onto the ½× alias (1.235 d), so the real transits fall on odd cycles only and the
  empty even cycles read as a 36σ odd/even mismatch. The gate is correct; the period
  it was fed was not. `_dealias` recovers the fundamental period first (approved
  design decision), and the report carries `bls_period` + `alias_factor` so the
  frontend can teach it ("BLS said 1.235 d; the structure reveals 2.471 d").
- **Two discriminators, two alias directions.** Superharmonics (BLS too long, k×) are
  caught by `extra_ratio` (multiple dips per fold). Subharmonics (BLS too short, 1/k×)
  are caught by a folded mod-2 **and** mod-3 depth balance (empty cycle groups),
  which stays reliable for shallow transits where per-cycle detection fails
  (this was the KIC 9140402 lesson — a per-cycle occupancy metric wrongly rejected
  its true period because the transit is too shallow to see in one cycle).
- **Shape gate measures width ratio, not a trapezoid fit against BLS duration.**
  BLS duration is quantized to {0.1, 0.3, 0.5} d; fitting a trapezoid with `t_full =
  dur/2` made real U-shaped hot Jupiters read as V (flat_frac ≈ 0). Measuring
  `t_flat/t_total` directly from the folded profile fixed all three (Kepler-6b/7b,
  KIC 11446443).

## Limitations (documented, not blockers)

- **Kepler-22b** stays unlikely: BLS period 336 d is a non-harmonic error vs the true
  289.9 d (ratio 1.16, not an integer factor), so `_dealias` cannot reach it. This is
  a BLS period-quality limit, not a vetting-logic error.
- **Kepler-452b** is `weak`, not `strong`: a shallow, grazing, Earth-size signal whose
  flat-bottom fraction is genuinely marginal. Honest — archive-only data should call
  this a candidate needing review, consistent with PRD honest-nail #1.
- Thresholds (3σ / 0.25 / 0.2 / 7.0; de-alias 5.0 / 0.5 / 0.5) are provisional,
  calibrated against the anchors above.

---

## Result

All four gates + de-aliasing produce correct trust levels on synthetic and real
anchors. The confirmed planet passes 4/4; false positives hard-fail; a KOI candidate's
true period is recovered from a 4× alias. Endpoint contracts (200 / 424) verified.
Sub-9-1 backend is complete.
