## Plan

sub-10-2 delivers honesty nail 4 for Phase 10 — *a wide sky is seen shallowly*.
TESS watches ~85% of the sky but only ~27 days per sector, so the four gates
(which rest on repeated transits) can be blunt. Rather than hide this, the
backend **measures** the baseline and **downgrades confidence** to match, without
touching a single line of the gate math or the `trust` verdict.

## Lights

- [x] Light 1 — provisional-strong core (`d85bf36`): `build_report` records
  `baseline_days = time[-1]-time[0]` (mission-agnostic), `transit_count =
  floor(baseline/period)`, `mission`; sets `provisional = strong AND transit_count
  < _N_MIN_TRANSITS`. Pure helpers `transit_count()` / `is_provisional()`.
  `VettingReport` gains `mission`, `baseline_days`, `transit_count`,
  `sector_count`, `provisional` (all defaulted → backward compatible).
- [x] Light 2 — sector threading (`04fb973`): `hunt.lc_sector_count` reads the
  sectors recorded at fetch time from the cached TESS payload; `vet()` threads it
  into the report. Kepler → None; missing/corrupt cache → None (never guesses).
- [x] Light 3 — LC-response exposure (`a6212bd`): `HuntLCResponse` carries
  `mission`/`baseline_days`/`sector_count`; the Kepler payload is extracted into
  `_build_kepler_payload` (sibling of `_build_tess_payload`) so both missions
  record baseline; the router maps only present keys so pre-Phase-10 caches fall
  back to defaults.

## Success criteria

- [x] A clean planet over ~60 d (~20 transits) → `strong`, `provisional == False`.
- [x] The same planet truncated to ~13 d (~4 transits) → still `strong` (gate math
  unchanged) but `provisional == True`, `mission == "tess"`, `sector_count == 1`.
- [x] `is_provisional` never downgrades `weak`/`unlikely` — only a thin `strong`.
- [x] `lc_sector_count`: Kepler → None; missing cache → None; cached payload → value.
- [x] `pytest` green (54 passed); zero change to the four-gate computation or `trust`.

## Key decisions

- `provisional` is a **separate flag**, not a new verdict — `weak`/`unlikely` are
  never touched. Confidence is scaled to evidence; the gate math and verdict stand.
- The physically honest driver is `floor(baseline / period)` — the number of
  transit epochs the gates actually saw — not a raw day count.
- `_N_MIN_TRANSITS = 5` is deliberately conservative and **provisional**: a hot
  Jupiter in one sector stays fully `strong`; a P≈7 d planet becomes provisional.
  It (and the detrend SG window's Kepler-cadence assumption) will be calibrated
  against a real TESS light curve in sub-10-3's live E2E.
- Baseline is mission-agnostic, so the Kepler path records it too (symmetric
  payloads); legacy caches without the fields still map via model defaults.

## Verification boundary

Backend + pure boundary, verified by `pytest` over synthetic curves and payload
fixtures. The `provisional`-strong UI wording, the baseline/sector badges, and the
live fetch → BLS → vet on a real TIC are **sub-10-3**.

## References

- Check: `docs/checks/phase-10/sub-10-2.md` (PASS)
- Commits: `d85bf36`, `04fb973`, `a6212bd`, `db575f2` (retrospective)
- PRD/TechSpec: `docs/specs/phase-10/`
- Milestone: Phase 10 — Skyward (#11)
