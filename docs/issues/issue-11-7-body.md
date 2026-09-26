# 11-7: Point the hunt at the plausible few — the fetch plan

## Why

sub-11-5 turned to the sky and found the reach worth spending: of the 50 fresh-sky
stars in the frontier pool, **16 are small enough that a detectable single transit
could be a planet** (`plausible`); the other 34 are giants where the same dip would
be a star. sub-11-6 taught the hunt to honor that triage in its ranking.

But the hunt still only searches **cached** light curves — and right now **none of
the 16 plausible dwarfs are cached**. The five stars with curves on disk are all
`too_big` or noise cases; the actual targets, the stars where a detection could be a
world, have never had their light fetched. The instrument is aimed correctly and
pointed at empty air.

This sub-phase builds the bridge from "we know which 16 stars to look at" to "their
light is on disk and the hunt can search them" — honestly. Fetching is a slow,
network-bound MAST download, so it must never masquerade as an instant API call. We
separate the deterministic **plan** (which stars, in what order, cached or pending —
pure catalog geometry plus a cache check, no network) from the **fetch** itself (an
explicit, injectable, local step that records what actually happened per star).

## Lights

- **L1 — the plan.** A pure function over the sub-11-5 triage: take the plausible
  dwarfs, drop the ones already cached, order the rest **best-target-first** (smallest
  detectable planet radius leads, so a limited fetch budget is spent where the smallest
  world could be caught). Every target is tagged `cached` or `pending`, and the plan
  carries a summary (how many plausible, how many already on disk, how many still to
  fetch, and the single best target). No network — the cache check is injectable.

- **L2 — the fetch runner.** Walk the pending targets and fetch each one's light curve,
  bounded by a limit so a run pulls a handful, not all sixteen at once. The fetch
  function is injectable (default `hunt.fetch_lc_by_tic`) so the orchestration is tested
  with a fake that never touches the network. Each star gets an honest outcome —
  `fetched`, `already_cached`, or `failed` with the reason — never a pretended success. A
  thin local CLI script (`scripts/fetch_plausible.py`) wires the runner to the real
  fetch for the user to run offline.

- **L3 — the plan endpoint.** `GET /api/monotransit/fetch-plan` returns the deterministic
  plan (no network, no fetch) so the surface can show which stars are the targets and
  which still need their light. A typed model mirrors the service.

- **L4 — the surface.** The hunt page names the targets: how many plausible dwarfs, how
  many already searchable, how many still waiting on a fetch, and the single best target
  with the smallest planet it could reveal. Pending stars are stated plainly as needing a
  local fetch — the tool never implies it has looked where it has not. Pure, tested copy.

## Check

`docs/checks/phase-11/sub-11-7.md` — record the real plan (16 plausible, 0 cached at
open, best target and its minimum planet radius), the plan/fetch separation and why it
keeps the tool honest, and the test counts. Name the true north-star next step: run the
real fetch and let the hunt finally search a plausible dwarf.

## Success criteria

- [ ] a deterministic fetch plan lists the plausible dwarfs, ordered best-target-first,
      each tagged cached or pending, with an honest summary — and never touches the network
- [ ] the fetch runner records a per-star outcome (fetched / already_cached / failed) and
      is bounded by a limit, with the network fetch injectable for tests
- [ ] a local CLI script runs the real fetch offline
- [ ] `GET /api/monotransit/fetch-plan` returns the plan without fetching
- [ ] the hunt page names the targets and states pending stars need a local fetch
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

## Key decisions

- **Plan, do not pretend to fetch.** The plan is pure geometry plus a cache check — no
  network in the request path. A MAST download is slow and fallible; it stays an explicit,
  separate, injectable step whose outcomes are recorded, never an instant endpoint.
- **Best target first.** Pending plausible dwarfs are ordered by smallest detectable
  planet radius, so a bounded fetch spends its budget where the smallest world could hide.
- **Report, do not hide.** Every target says cached or pending; every fetch says fetched,
  already_cached, or failed-with-reason. The tool never claims to have looked where it did not.
