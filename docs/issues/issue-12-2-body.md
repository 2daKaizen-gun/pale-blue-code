## Plan

Hunt **sector 106**, the newest sky. The 2026-09-15 refresh Action rolled the tracked frontier pool
(`backend/data/frontier_seeds_tess.json`) to it: 100 planet-size dwarfs, R★ 0.18–0.93 R☉ (median
0.68), none of them searched yet.

**Freeze first.** The refresh runs on the 1st and 15th; the moment MAST serves sector 107 the tracked
file rolls forward and 106's star list is gone from it. So the first step copies the pool to its own
file, `backend/data/pool_s0106.json` (the `--pool` pattern of sectors 103 and 102), and every fetch,
search, tally and completeness command runs against that file.

Stars already searched in earlier sectors share their TIC-keyed cache and are counted honestly as
already searched, as in 11-21.

## Lights

- [ ] `pool_s0106.json` frozen from the tracked pool (same stars, same order, sector 106 recorded)
- [ ] Batches of ~8 fetched and searched with `--pool data/pool_s0106.json`; each batch a comment here
- [ ] Every significant event named by its gate; any candidate read against the raw curve first
- [ ] Achieved completeness + Earth-size dossier recomputed across all pools
- [ ] Instrument log + check doc (`docs/checks/phase-12/sub-12-2.md`)

## Success criteria

- [ ] Sector 106: 100 of 100 searched (or the stopping point stated with its reason)
- [ ] Achieved sensitivity stated per star
- [ ] Tracked frontier file untouched by the hunt; the Action keeps rolling it independently
- [ ] pytest + eslint + vitest + `npm run build` green

## Key decisions

- Freeze-then-hunt, so the biweekly refresh and the hunt never fight over one file.
- Runs after or alongside 12-1; both feed the final report (12-3).

## References

- `--pool` infrastructure: `docs/checks/phase-11/sub-11-21.md`
- Refresh workflow: `.github/workflows/frontier-refresh.yml`
- Handoff: `docs/phase-handoffs/phase-11-to-12.md`
