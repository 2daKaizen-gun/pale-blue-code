# Check: sub-9-3 — Trust synthesis + discovery record v2

**Date:** 2026-07-08
**Branch:** main
**Verdict:** PASS

---

## Scope

Close the first movement (9-A): the exported discovery record stops being a bare
claim and becomes **a record that carries its own evidence**. The four gate
results and the trust level travel with it.

Modified: `frontend/src/lib/discovery.ts` (schema `@1` → `@2`, embedded vetting,
backward-compatible reader), `frontend/src/components/hunt/DiscoveryActions.tsx`
(assemble v2 + trust-aware UI), `frontend/src/pages/HuntPage.tsx` (thread vetReport).

---

## Lights

1. **Schema `@1` → `@2` + embed vetting** (2da7dba) — `DiscoveryRecord.vetting:
   DiscoveryVetting | null` carries trust, de-aliased period, alias factor, and
   the four gate results. `vetReport` param is optional/nullable so a vet miss is
   recorded honestly as `vetting: null`, never a fabricated verdict.
2. **Thread vetReport through export** (3dedf75) — HuntPage → DiscoveryActions →
   builder, nullable end-to-end.
3. **Backward-compatible reader** (9f26fc1) — `parseDiscoveryRecord` branches on
   the schema tag: `@2` passes through, `@1` upgrades in place to `vetting: null`
   (no crash on the missing key), anything else throws. The single normalized
   read path a future discovery repository (9-C) imports through.
4. **Surface evidence in the export card** (1082654) — trust badge (mirroring the
   vetting card palette) + gate count, so the download is not a black box; plain
   "판별 근거 없음" line when vetting missed.
5. **Trust-aware report links** (b69db3d) — honesty rule: an `unlikely` verdict is
   still exportable, but the UI drops the citizen-science report nudge and shows a
   re-examination notice instead. strong/weak/no-vetting keep the links.
6. This check doc + build gate + issue close.

---

## Build gate

```
npm run build → ✓ built in ~2–3s   (tsc -b clean, 0 type errors)
```

Run at every commit (six green builds).

---

## Success criteria (issue #41) — all met

Verified by running the real `discovery.ts` under `tsx` (its runtime imports are
all `import type`, erased — the module runs standalone):

- ✅ **Exported JSON carries the four gate results + trust, schema
  `pale-blue-code/discovery@2`** — `schema: pale-blue-code/discovery@2`,
  `vetting.trust: strong`, `gates: 4`, `alias_factor: 2`.
- ✅ **A `discovery@1` record still parses** — legacy record with no `vetting` key
  upgrades to `@2` with `vetting: null`, no crash (`legacy upgraded schema:
  pale-blue-code/discovery@2 | vetting: null`).
- ✅ **Vet miss is honest, not fabricated** — `buildDiscoveryRecord(..., null)` →
  `vetting: null`, export still works.
- ✅ **`@2` round-trips through parse** — `roundtrip trust: strong`.
- ✅ **Garbage rejected** — `parseDiscoveryRecord({nope:true})` throws
  "Not a discovery record: missing schema tag".
- ✅ **Report-link section adapts to trust** — `discourageReport = trust ===
  'unlikely'` hides the report links + drops the "보고하세요" nudge, showing a
  re-examination notice instead (honesty rule, PRD nail 1).
- ✅ **`npm run build` passes.**

---

## Honesty note

The export path now honors the same nail the rest of Phase 9 does: an `unlikely`
signal (probable eclipsing binary / false positive) is yours to keep, but the UI
will not push you to report it to citizen science. And a record whose vetting
never ran says so — `vetting: null` — rather than inventing a verdict. Evidence
travels with the claim; absence of evidence is stated, not hidden.

---

## Result

Discovery record v2 embeds the vetting evidence, reads old records without
crashing, surfaces the verdict before export, and adapts reporting to trust.
Build passes at every commit. **Sub-9-3 is complete — this closes issue #41 and
the first movement (9-A Vetting) of the "모두의 하늘" track.** Next: Phase 9-B
(울타리 열기) — the real solo hunt, now that discoveries carry their own proof.
