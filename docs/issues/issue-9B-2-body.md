## Plan
Build the frontend for a real solo hunt of stars with no KOI entry
(honesty nail #3), separate from the educational demo hunt (HuntPage).
Pick an unrecorded KIC (random from the seed pool, or free input), gate
on recorded status, then reuse the 9-A lc -> bls -> vet contract and the
vetting report card. Branch the result by trust, and present empty hands
as a result, not a failure.

## Lights
- [ ] lib/api/hunt.ts — frontierRandom / checkRecorded + types
- [ ] FrontierTargetPicker — random button + free-input KIC
- [ ] FrontierHuntPage — recorded gate -> lc->bls->vet flow + /hunt/frontier route
- [ ] FrontierVerdict — trust branching wrapping VettingReportCard
- [ ] Honest empty-hands framing + mobile + npm run build

## Success criteria
- [ ] Random button -> live hunt of an unrecorded KIC completes (mostly empty)
- [ ] Free-input recorded KIC -> "already on file" card, hunt not entered
- [ ] Empty hands renders as a neutral result, not an error
- [ ] "discovery" wording appears only for strong + unrecorded
- [ ] npm run build passes

## Key decisions
- Separate route from the demo hunt (separation principle, nail #3)
- No new vetting — wrap vetting.vet / VettingReportCard from 9-A
- Discovery export + hunt log deferred to sub-9B-3

## References
- PRD docs/specs/phase-9B/PRD.md, TechSpec §3 / §5
- Backend sub-9B-1: /hunt/frontier/random, /hunt/recorded/{kic}

