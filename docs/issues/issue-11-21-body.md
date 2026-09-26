> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran from 2026-08-31 to 2026-09-04 without
> a GitHub issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped
> it for sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the
> commits so the tracker matches the work; it is not a record written before the work.

## Plan

Sectors 104 and 105 are swept in full — 200 smallest-first dwarfs, zero candidates. The honest next
sky is either a *newer* sector (106 has not gone live; a MAST probe found it empty) or an **older** one
already on MAST but never hunted for monotransits. A repeated-transit pipeline filed the TOIs; the
single transit it is blind to is still unspent in every sector, old or new. So: sector 103.

But hunting it cannot reuse the frontier pool file. The biweekly Action rolls
`frontier_seeds_tess.json` to the *newest* sector, so overwriting it with 103 would fight that Action
and bury the sector-105 record. The tooling needs to hunt **any** sector from its own file first.

## Lights

Twelve batches across five sessions (per-star detail in `docs/observations/instrument-log.md`):

- [x] `0f20ab4` — **`--pool PATH` flag** on all four hunt scripts (fetch / search / tally /
      completeness). Default unchanged, so sector 105 reproduces exactly; the services already took a
      star list, so the change stays clean. pytest 195.
- [x] `863ae88` — build sector 103 to its own file: 13,000 SPOC targets, 12,663 absent from TOI →
      100 smallest-first dwarfs, R★ 0.160–1.066 R☉ (median 0.809).
- [x] `c06d586` … `12292ca` — batches 1–2 (12 → 20 of 100). Four stars already carried a cached result
      (same TIC hunted in an earlier sector — the same star, honestly counted once), so the sweep opens
      at 4/100.
- [x] `d4f813d` … `970d571` — batches 3–5 (28 → 44 of 100), including the sector's loudest read
      TIC 344128619 (sig 278.55) rejected on **three** gates at once.
- [x] `891f97d` … `c45aa3e` — batches 6–8 (52 → 68 of 100).
- [x] `02f11ea` … `da9aa2a` — batches 9–11 (76 → 92 of 100).
- [x] `ca877a3` / `0de6838` — final batch and PASS: **100 of 100**.

## Success criteria

- [x] `--pool` added to all four hunt scripts; the default reproduces sector 105 exactly (pytest 195)
- [x] sector-103 pool built to its own file (100 dwarfs, R★ 0.160–1.066 R☉); frontier untouched
- [x] all twelve batches fetched and searched, every verdict recorded honestly
- [x] final: 100 of 100 — 38 quiet / 47 insignificant / 15 rejected / 0 candidates
- [x] every significant event named and gate-rejected; four pre-cached stars counted honestly once
- [x] MAST timeouts and dropped connections retried, never counted as science verdicts
- [x] final completeness recorded (best 0.7 / median 6.6 R⊕) — sensitivity identified as the next wall
- [x] frontier pool (sector 105, 100/100) confirmed untouched throughout — every command used `--pool`

## Key decisions

- **A separate pool file, not an overwrite.** The tracked frontier belongs to the Action; hunting an
  older sector must not fight it. `--pool` makes the pool an argument instead of a global.
- **A network error is not a verdict.** MAST connection-pool timeouts (batches 3, 9, 10 — some caused
  by a parallel fetch competing for connections) were re-run alone until they completed cleanly. A
  transient failure leaves a star `not_fetched`, never a disposition.
- **Not one of the sector's fifteen significant events survived the five gates** — every one a
  gap-seated instrumental step, edge + symmetry the dominant signature.
- **★ The completion turned the project's direction.** Achieved completeness over the hundred is best
  0.7 · **median 6.6 R⊕**, with only 6 of 100 curves Earth-clean. Three sectors swept, ~300 dwarfs,
  zero candidates — and the wall is plainly **sensitivity, not sky**. Sweeping more sky at the same
  floor would only fail to see the same small planets in more places. This is what opened path A
  (`docs/vision/finding-our-own-planet.md` §9).

## References

- Retrospective: `docs/checks/phase-11/sub-11-21.md`
- Vision: `docs/vision/finding-our-own-planet.md` §9 (the A + D turn this sweep triggered)
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-20.md`
