## Plan

Close the first movement: embed the vetting evidence into the exported discovery record. A "discovery" stops being a bare claim and becomes **a record that carries its own evidence** — the four gate results and the trust level travel with it.

See `docs/specs/phase-9/PRD.md` §5 and `docs/specs/phase-9/TECHSPEC.md` §5.

## Lights (expected commit order)

1. `frontend/src/lib/discovery.ts` — extend schema `discovery@1` → `@2`: add `vetting` field (checks + trust), keep backward-compatible read
2. `frontend/src/components/hunt/DiscoveryActions.tsx` — assemble v2 record + JSON export
3. Report links copy — conditional on trust (if `unlikely`, warn "re-examine before reporting")
4. `docs/checks/phase-9/sub-9-3.md` check doc + final mobile pass
5. `npm run build` passes

## Success criteria

- Exported JSON contains the four gate results + trust, schema `pale-blue-code/discovery@2`
- A `discovery@1` record still parses (version-tag branch, no crash)
- Report-link section adapts to trust level (no "report this" nudge on `unlikely`)
- `npm run build` passes

## Key decisions

- Schema versioning via the existing `pale-blue-code/discovery@N` tag; readers branch on version
- Vetting evidence is copied into the record at export time (frontend assembly, no new backend contract) — consistent with Phase 8 `discovery@1`
- Honesty rule extends to export: an `unlikely` record is still exportable, but the UI does not encourage citizen-science reporting of it

## References

- `docs/specs/phase-9/PRD.md` (§3 nail 1 candidate-not-confirmed, §5 scope)
- `docs/specs/phase-9/TECHSPEC.md` (§5 sub-9-3)
- Reused: `lib/discovery.ts` (`discovery@1` builder), `lib/reportLinks.ts`
- Depends on: #9-1, #9-2 — final commit closes this issue and the Phase 9 milestone's first movement
