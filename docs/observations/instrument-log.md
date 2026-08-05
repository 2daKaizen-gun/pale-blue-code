# Instrument log — the monotransit detector on real plausible dwarfs

> A running, honest record of what our single-transit detector actually does when it is pointed at
> real starlight. Not a feature log — an *observation* log. Started 2026-08-05, when we finally
> crossed the network boundary and fetched the first plausible dwarf's real light curve from MAST.
>
> **What this is for.** For most of Phase 11 we built machinery for describing a survivor we had
> never actually produced from real data. This document is the turn described in
> `docs/vision/finding-our-own-planet.md` §8: point the forged tool at the sky and write down,
> without spin, exactly what it does — every empty result, every candidate, every place it breaks.
> A quiet star is a result, not a failure. That is the whole discipline.

## The targets

The 16 plausible dwarfs from the frontier-pool triage (`fetch_plan`) — stars where a *detectable*
single transit could be a planet, not a star. Best (smallest detectable planet) first.

| # | star | min planet (R♃) | fetched | events | disposition |
|---|------|-----------------|---------|--------|-------------|
| 1 | TIC 156004112 | ≥ 0.60 | yes (2026-08-05) | 1 | insignificant (blip, sig 0.06 « 4.0) |
| 2 | TIC 231631019 | ≥ 0.61 | yes (2026-08-05) | 2 | 0 candidates (symmetry + insignificant) |
| 3 | TIC 352402781 | ≥ 0.65 | yes (2026-08-05) | **0** | no single transit |
| 4 | TIC 365725318 | ≥ 0.71 | yes (prior) | **0** | no single transit |
| 5 | TIC 219990936 | ≥ 1.06 | yes (2026-08-05) | *running* | — |
| 6 | TIC 404034859 | ≥ 1.09 | yes (2026-08-05) | *not run* | — |
| 7 | TIC 156016697 | ≥ 1.10 | yes (2026-08-05) | *not run* | — |
| 8 | TIC 219306160 | ≥ 1.17 | yes (2026-08-05) | *not run* | — |
| 9 | TIC 396167830 | ≥ 1.34 | — | — | — |
| 10 | TIC 156084350 | ≥ 1.35 | — | — | — |
| 11 | TIC 372203352 | ≥ 1.38 | — | — | — |
| 12 | TIC 372066117 | ≥ 1.43 | — | — | — |
| 13 | TIC 341460220 | ≥ 1.51 | — | — | — |
| 14 | TIC 352404492 | ≥ 1.54 | — | — | — |
| 15 | TIC 374347620 | ≥ 1.71 | — | — | — |
| 16 | TIC 382252939 | ≥ 1.95 | — | — | — |

## Runs

### TIC 365725318 — 2026-08-05 — 0 events (quiet)

```
depth_floor: 0.51%   (a single transit shallower than this could not clear the significance cut)
events found: 0
```

The first real plausible dwarf we ran. The detector found no single-transit event and said so —
it invented nothing. This is the expected texture of the search: most stars are quiet, and that
quiet is the ground a real detection would stand on. Honest outcome, recorded as a result.

### TIC 156004112 — 2026-08-05 — 1 event, insignificant (the best target)

```
depth_floor:  0.046%   (a very clean curve — sensitive to a transit as shallow as ~0.05%)
events found: 1
  event: t0 = 2106.91 (BTJD), depth ~0.000%, duration 2.4 h, significance 0.06  ->  NOT a candidate
```

Our smallest-planet target, and its light curve is the cleanest yet (floor 0.046%). The search
surfaced one event, but it is essentially zero depth with significance 0.06 — far below the
`_SIG_MIN = 4.0` detection floor — so the sub-11-1 significance precondition rejected it before the
shape gates. The tool did exactly what it was built to do on real data: it declined to call a blip
a candidate. A sensitive look, and an honest nothing. (~30% of cadences were masked by the SPOC
quality flags — real data is not clean, and the loader honours the mask.)

*What the readout should say in one line:* **"Sensitive to 0.05%. One blip, correctly rejected as
insignificant. Quiet."** — the current hunt page makes a human assemble that from five scattered
panels; the redesign's job is to say it in one honest sentence, with the evidence one click below.

---

### TIC 231631019 — 2026-08-05 — 2 events, 0 candidates

```
depth_floor:  2.80%   (a noisier curve — only a deep transit could have cleared here)
events found: 2
  ev0: t0 = 4183.70, depth 0.011%, dur 19.2 h, sig 0.07  ->  failed the symmetry gate
  ev1: t0 = 4194.63, depth 0.004%, dur  2.4 h, sig 0.007 ->  insignificant
```

Two events surfaced, both killed honestly: the first — a broad 19-hour dip — failed the *symmetry*
discriminator (an asymmetric ramp, the signature of a systematic, not a transit), and the second
was far below the significance floor. The gate we nearly deleted did its job on real data again.

### TIC 352402781 — 2026-08-05 — 0 events (quiet)

```
depth_floor:  0.040%   (a very clean curve)
events found: 0
```

A clean, sensitive look and nothing there. Quiet, recorded as a result.

---

**Running tally (4 of 16 searched):** every one quiet — zero candidates so far. The dominant
outcome of a real single-transit search is *nothing*, and that nothing is the whole point: it is
the noise floor a real detection would have to rise above. Four more curves fetched and searching;
eight still pending a fetch.

*More runs appended as targets are fetched and searched.*
