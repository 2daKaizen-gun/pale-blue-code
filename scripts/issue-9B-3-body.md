## Phase 9-B / sub-9B-3 — Hunt log + frontier discovery export

The closing movement of the frontier track. The hunt page can already pick an
unrecorded star, gate on recorded status, run the reused 9-A vetter, and frame the
verdict by trust. This sub-phase makes the frontier honest *over time* and lets a
real find be kept with its evidence.

### Scope
- **Hunt log (localStorage)** — an append-only tally of outcomes, aggregated into
  the honest counts "N hunts, M candidates". A star turned away at the gate
  (recorded / no light curve) is counted apart from the hunt total. The pure
  aggregation core is unit-tested; a corrupt store degrades to an empty log.
- **Hunt log panel** — surfaces the tally under the header; empty hands is stated
  as a fact ("this is what the frontier is like"), never a failure.
- **Discovery export (strong-only)** — DiscoveryActions renders only for a
  strong + unrecorded verdict (the earned find, honesty nail #3), exporting a
  discovery@2 record with in_catalog:false and the four-gate vetting evidence.
  Weak / empty-hands verdicts are tallied in the log, never dressed up as a find.

### Success criteria
- [ ] Each terminal outcome (verdict / recorded / no-lc) updates a persistent tally.
- [ ] The panel shows "N hunts, M candidates" and persists across reloads.
- [ ] Discovery export appears only for strong + unrecorded; weak/empty hands do not.
- [ ] Empty hands reads as a result, not an error (wording audit).
- [ ] npm run build and vitest pass.

Closed by docs/checks/phase-9B/sub-9B-3.md.
