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

**All 16 fetched and searched (2026-08-07).** Zero candidates. Best (smallest detectable planet) first.

| # | star | min planet (R♃) | events | disposition |
|---|------|-----------------|--------|-------------|
| 1 | TIC 156004112 | ≥ 0.60 | 1 | insignificant (blip, sig 0.06 « 4.0) |
| 2 | TIC 231631019 | ≥ 0.61 | 2 | insignificant (both events far below floor) |
| 3 | TIC 352402781 | ≥ 0.65 | **0** | no single transit (quiet) |
| 4 | TIC 365725318 | ≥ 0.71 | **0** | no single transit (quiet) |
| 5 | TIC 219990936 | ≥ 1.06 | 3 | insignificant (sig ≈ 0) |
| 6 | TIC 404034859 | ≥ 1.09 | **0** | no single transit (quiet) |
| 7 | TIC 156016697 | ≥ 1.10 | **0** | no single transit (quiet) |
| 8 | TIC 219306160 | ≥ 1.17 | 1 | insignificant (sig 0.00) |
| 9 | TIC 396167830 | ≥ 1.34 | 1 | insignificant (sig 0.08) |
| 10 | TIC 156084350 | ≥ 1.35 | **0** | no single transit (quiet) |
| 11 | TIC 372203352 | ≥ 1.38 | 1 | insignificant (sig 0.02) |
| 12 | TIC 372066117 | ≥ 1.43 | **0** | no single transit (quiet) |
| 13 | TIC 341460220 | ≥ 1.51 | **0** | no single transit (quiet) |
| 14 | TIC 352404492 | ≥ 1.54 | 1 | **rejected — sig 74, killed by edge + symmetry** |
| 15 | TIC 374347620 | ≥ 1.71 | 1 | insignificant (sig 0.03) |
| 16 | TIC 382252939 | ≥ 1.95 | **0** | no single transit (quiet) |

**Tally of the 16 planet-size targets:** 8 quiet (no event) · 7 insignificant blips · 1 rejected · **0 candidates.**
Three giants (`too_big`) that happened to be cached were also swept: TIC 469906369 (sig 11.7 → edge+symmetry),
TIC 102029734 (sig 14.2 → edge), TIC 253825414 (insignificant). Their dips, correctly, never became candidates.

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

### TIC 352404492 — 2026-08-07 — 1 event, sig 74, REJECTED (the discriminators earn their keep)

```
depth_floor:  0.03%   (a clean, very sensitive curve)
events found: 1
  event: sig 74.30  ->  FAILED edge + symmetry  ->  NOT a candidate
```

The most important run in this log. A *planet-size target* — one of the 16 dwarfs where a real
transit could be a planet — produced a genuinely huge single event: significance **74**, far above
the `_SIG_MIN = 4.0` floor. On significance alone it would have sailed through. But the shape gates
caught it: it failed **edge** (the dip sits on a segment boundary, where the spacecraft's own
systematics live) *and* **symmetry** (an asymmetric ramp, not a transit's clean U). These are the
exact discriminators sub-10-3 nearly deleted as over-engineering. On real starlight they just
stopped a significance-74 artifact from being called a candidate. That is the whole reason the
shape gates exist, demonstrated on real data: significance is necessary, never sufficient.

(Two cached giants told the same story: TIC 102029734 at sig 14 and TIC 469906369 at sig 12, both
killed by edge — deep systematics on bright stars, correctly refused.)

---

## Tally — the bright pool's dwarfs searched (2026-08-07)

**16 planet-size targets, every one fetched and searched. Zero candidates.**

- **8 quiet** (no single-transit event at all),
- **7 insignificant** (a blip surfaced, but below the significance floor — noise),
- **1 rejected** (TIC 352404492: a significance-74 event, refused by the shape discriminators).

Zero survivors. This is the honest, expected texture of a real single-transit search: the sky is
mostly quiet, and the one loud thing was an instrument artifact the gates caught. Nothing was
invented, nothing was dressed up. The empty hands *are* the result — they are the noise floor a
real detection would have to clear, and the proof that the tool declines to lie when there is
nothing there. If a real world is hiding in these curves, it is shallower than these floors or
buried in a gap; finding it would take deeper data, not a louder claim.

---

## The pool grew up — 50 dwarfs, and a first M-dwarf batch (2026-08-11)

The bright pool searched above was mostly the wrong stars. It was ranked by *brightness*, and bright
TESS stars are giants, so only 16 of 50 were planet-size targets. sub-11-14 rebuilt the selection
for the hunt (`select_for_hunt`): smallest stars first, bright enough to search. The same sector 104
now yields **50 planet-size targets out of 50** — 0 giants — and the smallest are real **M dwarfs**
(R ~0.15–0.30 R_sun), where the detection floor implies a planet as small as ~0.09–0.16 R_jup,
roughly **1–2 Earth radii**. The bright pool's best target bottomed out at 0.60 R_jup (~7 Earth
radii); this reaches Earth-size. For the first time the pool is pointed where a small planet could
actually show.

**First batch: the 10 smallest M dwarfs fetched and searched.** (37 targets still pending a fetch —
stated `not_fetched`, never faked.)

| star | R (R_sun) | events | disposition |
|------|-----------|--------|-------------|
| TIC 469981019 | 0.15 | 0 | no single transit (quiet) |
| TIC 120506718 | 0.19 | 0 | no single transit (quiet) |
| TIC 352438054 | 0.19 | 0 | no single transit (quiet) |
| TIC 370142187 | 0.22 | 1 | **rejected — sig 13.6, killed by edge + symmetry** |
| TIC 142216895 | 0.25 | 1 | insignificant (sig −0.02) |
| TIC 394481268 | 0.26 | 0 | no single transit (quiet) |
| TIC 322051865 | 0.29 | 0 | no single transit (quiet) |
| TIC 79491341  | 0.29 | 0 | no single transit (quiet) |
| TIC 49594649  | 0.30 | 0 | no single transit (quiet) |
| TIC 77111302  | 0.56 | 1 | insignificant (sig 0.06) |

**Tally of the 10 M dwarfs:** 7 quiet · 2 insignificant · 1 rejected · **0 candidates.**

The rejection tells the same story a third time. TIC 370142187 — an R=0.22 M dwarf, one of the
tiniest targets — produced a **significance-13.6** single event, well past the floor. The shape
gates caught it: **edge + symmetry**, an asymmetric ramp on a segment boundary — a systematic, not a
transit. On the smallest, most planet-friendly stars we have yet searched, the loudest thing was
still an instrument artifact, and the tool still refused it. Zero candidates, honestly. The search
has finally reached Earth-size sensitivity on real M dwarfs; the sky there, so far, is quiet.

### Second batch — 10 more dwarfs (2026-08-12)

Fetched and searched the next 10 planet-size dwarfs. Same texture: **3 quiet, 6 insignificant, 1
rejected, 0 candidates.**

- **TIC 100918677 — sig 20.6, REJECTED** (edge + symmetry). A second loud artifact caught by the
  shape gates in the dwarf pool. Significance well past the floor; shape betrayed it as a systematic.
- **TIC 91636864 — sig 4.98, insignificant.** The closest call in the whole search: the mono
  significance floor is `_SIG_MIN_MONO = 5.0`, and this event landed at **4.98** — a hair *under* the
  line, so it was not promoted. Exactly the discipline the floor is for: a threshold only means
  something if the tool honours it when the number is close. It did.
- The other eight: quiet or blips far below the floor.

**Cumulative dwarf-pool tally (20 of 50 searched):** 10 quiet · 8 insignificant · 2 rejected
(sig 13.6, sig 20.6, both edge+symmetry) · **0 candidates.** Thirty targets still pending a fetch,
stated `not_fetched`. Twenty real M/K dwarfs searched at Earth-to-Neptune sensitivity, and the sky
is quiet — the loud things were instrument artifacts, the closest real-looking event fell 0.02
under the floor. The empty hands are honest, and they are exactly what a real search mostly returns.

*More runs appended as the remaining 30 dwarfs are fetched and searched, and as the biweekly
GitHub Action refreshes the pool (now dwarf-selected) with each new sector.*
