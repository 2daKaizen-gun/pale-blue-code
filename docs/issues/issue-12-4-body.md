## Plan

Close the project **with the door open**. After the report (12-3), cut a **v1.0** release, rewrite
the README as the description of a finished project, and switch the hunt to a documented
maintenance mode that keeps looking without anyone having to push it.

## Lights

- [ ] README: from a running diary to a finished project's front page — what it is, what it found
      (and did not), link to the report; the long per-sub-phase narrative moves to
      `docs/` (kept, not deleted)
- [ ] `v1.0` tag + GitHub release notes (what is in it, test/quality state, the result in one line)
- [ ] Maintenance mode written down (`docs/maintenance.md` or in `deploy.md`): what runs by itself
      (biweekly frontier refresh), how to sweep a new sector in one command sequence, what to do if
      a candidate ever survives (raw-curve check → dossier → ExoFOP/TFOP)
- [ ] Final state of the live site decided and documented (backend on demand vs. static)
- [ ] Phase 12 closing handoff (`docs/phase-handoffs/`) + check doc (`docs/checks/phase-12/sub-12-4.md`)

## Success criteria

- [ ] Release `v1.0` exists and its CI run is green
- [ ] A newcomer can answer "what is this, what did it find, how do I run it" from the README alone
- [ ] Maintenance steps verified by actually running them once
- [ ] Milestone "Phase 12 — Closing the Sky" closed

## Key decisions

- "The end" means a stated result plus a working instrument, not a discovery. A discovery stays
  possible — it is an open door, not the finish line.
- Nothing is deleted for the sake of looking finished; history moves, it does not vanish.

## References

- Report: 12-3 · Handoff: `docs/phase-handoffs/phase-11-to-12.md`
- Ops runbook: `docs/deploy.md`
