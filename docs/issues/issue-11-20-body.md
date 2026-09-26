> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran from 2026-08-19 to 2026-08-28 without
> a GitHub issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped
> it for sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the
> commits so the tracker matches the work; it is not a record written before the work.

## Plan

sub-11-19 closed sector 104 as a complete, bounded null and named the only honest next sky: a **new
TESS sector**. A read-only MAST probe found sector 105 live — 10,985 SPOC targets, **10,761 absent
from the TOI catalog**. Roll the frontier pool to it with the same smallest-first selection, and
sweep it end to end.

This is not a bigger pool; it is a genuinely different, un-picked-over patch of sky. No pipeline code
should change — the roll is a data + observation step under the existing `mono-v2` pipeline.

## Lights

Thirteen batches across several sessions (per-star detail in `docs/observations/instrument-log.md`):

- [x] `c292e84` — roll the pool to sector 105: 100 smallest-first dwarfs, R★ 0.165–0.884 R☉
      (median 0.623), the smallest an R★ 0.165 M dwarf in Grus (Teff 3008 K). Seed file the only change;
      full backend suite green on the new pool with no test edits.
- [x] `2d008e5` … `f4c994a` — batches 1–5 (8 → 40 of 100), opened by TIC 42071226 (sig 25.0) turning
      on edge + symmetry, the same signature sector 104 taught.
- [x] `bb29383` … `9ec05eb` — batches 6–10 (48 → 80 of 100); batch 6 brings the sweep's first **flare**
      flag, batch 7 a four-gate rejection.
- [x] `28a0456` … `1c5fe69` — batches 11–13 (88 → 96 → **100 of 100**). A corrupt leftover s0104 cache
      (TIC 219987192) was cleared and re-fetched clean rather than counted.
- [x] `59e25b5` — check doc: sector 105 swept in full.
- [x] `5c0531c` / `5c9b99f` — alongside the sweep, the copy layer drops jargon (plain 밝기 꺼짐 /
      목성 반지름 배) on every rendered hunt surface.

## Success criteria

- [x] sector 105 confirmed live on MAST (read-only probe; 10,985 SPOC targets, 10,761 unrecorded)
- [x] pool rebuilt from 105, smallest-first, 100 dwarfs; seed file the only change
- [x] full backend suite green on the new pool — no test changes needed
- [x] all thirteen batches fetched and searched, every verdict recorded honestly
- [x] final ledger: 42 quiet / 36 insignificant / 22 rejected / 0 candidates
- [x] every significant event named by its gates (edge / symmetry / flare / baseline)
- [x] achieved completeness computed from measured floors (best 0.6 / median 4.1 R⊕ over 100)
- [x] observation log and check doc record the opening and the completion honestly

## Key decisions

- **A new sector is a new sky, not a bigger pool.** Sector 105 shares no selection with 104; its
  dwarfs are stars we had never looked at.
- **Final ledger: 100 of 100 — 42 quiet · 36 insignificant · 22 rejected · 0 candidates.** Not one
  loud event survived all five shape gates: edge + symmetry is the sector's signature, with one late
  flare + baseline pairing.
- **The null is exactly as strong as the floor.** Measured completeness over the full hundred is best
  0.6 · median 4.1 R⊕ — **5 of 100** curves clean enough for an Earth, 14 for a super-Earth, 47 for a
  sub-Neptune. Stated so the null is never read as stronger than the data supports.
- **A corrupt cache is a data problem, not a verdict.** The one unreadable curve was cleared and
  re-fetched; nothing was counted on a broken file.

## References

- Retrospective: `docs/checks/phase-11/sub-11-20.md`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-19.md`
