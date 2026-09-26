> ⚠️ **Filed retroactively on 2026-09-11.** This sub-phase ran on 2026-09-08 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Decision D reframes the goal: not "we discovered a planet" — beyond reach without a telescope — but
"here are the quiet stars where our search *reaches* Earth size, with the measured sensitivity and the
honest disposition, in a follow-up-ready form." Yesterday D shipped as `scripts/earth_size_dossier.py`,
a terminal artifact. **A goal the product does not show is only half-adopted.** Surface D where a
person actually looks — the hunt front door — and strip the last "discovery" overclaim left in the UI.

## Lights

- [x] `e6920c9` — the pure copy layer, built from the hunt ledger the API already returns
      (`min_planet_rearth`, `depth_floor`, `disposition`): selects Earth-size-sensitive targets
      sharpest-first, counts surviving candidates, pins the honest wording. 14 vitest cases.
- [x] `032bb73` — `EarthSizeDossier.tsx`, mounted inline in `SingleTransitHunt` between the survivor
      cards and the full pool ("여기까지 우리 눈이 닿았다 — 지구크기 감도"). No extra fetch; renders
      nothing when no target reaches Earth size.
- [x] `0aabb05` — `FrontierVerdict.tsx`: the repeated-signal verdict read "★ 우리가 찾은 신뢰 후보 …
      드문 순간입니다". A repeated signal is exactly what the automated pipelines already catch well, so
      that overclaimed. Now: still a candidate, named as the machine's own territory, confirmation left
      to ExoFOP/TFOP, false positives called out.
- [x] `5d7ce70` — **fix, found later in the 2026-09-08 docs audit:** `032bb73` put
      `earthSizeDossier.ts` and `EarthSizeDossier.tsx` in the same folder. On a case-insensitive
      filesystem tsc resolved `./EarthSizeDossier` to the `.ts` module, so **`npm run build` was broken
      on main** (TS1149 / TS1192 / TS1261) while vitest stayed green. Renamed the copy module to
      `earthSizeCopy.ts` (the `monotransitCopy` / `poolCopy` convention).
- [x] `b590cda` — the check doc's "tsc clean" claim retracted in place, not quietly edited away.

## Success criteria

- [x] D surfaced in the product: the Earth-size dossier inline on the hunt front door
- [x] a target is presented as Earth-size *sensitivity*, never a claimed planet; "0 candidates" reads as
      a completeness statement; the ExoFOP/TFOP follow-up path is named
- [x] the copy that carries every claim is unit-tested (14)
- [x] the last "discovery" overclaim on the repeated-signal verdict reworded to match D
- [x] no new backend surface, no new dependency — pure copy over the existing ledger
- [x] ~~tsc clean~~ — **was not**; the build break was caught and fixed (`5d7ce70`), the claim retracted
      (`b590cda`). Build clean since.

## Key decisions

- **Presentation, not measurement.** The floors and dispositions are the ones the search already
  computed; nothing here re-derives sensitivity.
- **Narrower scope, stated.** The in-product dossier reads the *current frontier pool's* ledger (what
  the live hunt searched), not the cross-sector union the terminal script assembles from all cached
  pools. Same honest framing, and the product shows only what this hunt actually saw.
- **Renders nothing rather than overclaim.** With no Earth-size target, the section is absent — it
  never claims a reach the search has not measured.
- **★ The lesson from the retraction:** vitest passing is not a build passing. The sub-phase claimed a
  clean type-check its own commit had broken; it was caught by an audit, not by the check. Run
  `npm run build`, not just the tests, before writing "clean".

## References

- Retrospective: `docs/checks/phase-11/sub-11-26.md` (with the correction at the top)
- Code: `frontend/src/components/hunt/earthSizeCopy.ts` · `EarthSizeDossier.tsx` · `FrontierVerdict.tsx`
- Vision: `docs/vision/finding-our-own-planet.md` §9 (decision D)
- Previous: `docs/checks/phase-11/sub-11-25.md`
