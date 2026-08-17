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
- **TIC 91636864 — sig 4.98, insignificant.** On the significance number alone this looked like the
  closest call in the whole search: `_SIG_MIN_MONO = 5.0`, and the event landed at **4.98** — a hair
  under the line. But re-reading the event honestly, the number is not the interesting part. The dip
  sits **0.075 days from a segment boundary** (within one transit duration, 0.1 d), so it **fails the
  edge gate** too — the same downlink/momentum-dump boundary signature that killed the sig-13.6 and
  sig-20.6 events, only quieter. It is not a real-looking transit that merely lacked significance; it
  is a fainter edge artifact that falls short on *two independent* counts. The right reading is "an
  instrument-boundary blip, sub-threshold and shape-rejected," not a wistful near-miss. (The floor
  did honour a close number — worth noting — but that is the smaller truth here.)
- The other eight: quiet or blips far below the floor.

**Cumulative dwarf-pool tally (20 of 50 searched):** 10 quiet · 8 insignificant · 2 rejected
(sig 13.6, sig 20.6, both edge+symmetry) · **0 candidates.** Thirty targets still pending a fetch,
stated `not_fetched`. Twenty real M/K dwarfs searched at Earth-to-Neptune sensitivity, and the sky
is quiet — every loud thing was an instrument artifact. The one event that flirted with the floor
(TIC 91636864, sig 4.98) turned out, on honest re-reading, to be another edge-boundary blip rather
than a near-candidate: sub-threshold *and* shape-rejected, not a real transit 0.02 short. The empty
hands are honest, and they are exactly what a real search mostly returns.

### Third batch — 10 more dwarfs (2026-08-12)

Fetched the next 10 planet-size dwarfs from MAST (one, TIC 142169644, dropped a MAST connection
mid-fetch and was recorded `failed`, not faked — re-tried past it) and searched them. Same texture:
**5 quiet, 3 insignificant, 2 rejected, 0 candidates.** Best (smallest detectable planet) first.

| star | min planet (R♃) | events | disposition |
|------|-----------------|--------|-------------|
| TIC 158532040 | ≥ 0.42 | 1 | **rejected — sig 18.5, killed by edge** |
| TIC 370082510 | ≥ 0.43 | **0** | no single transit (quiet) |
| TIC 382523691 | ≥ 0.44 | 1 | insignificant (sig −0.03) |
| TIC 152359002 | ≥ 0.46 | 1 | insignificant (sig 0.03) |
| TIC 1988262284 | ≥ 0.46 | 1 | insignificant (sig 0.05) |
| TIC 293482838 | ≥ 0.46 | 3 | **rejected — sig 6.4, killed by edge + symmetry** |
| TIC 206598072 | ≥ 0.47 | **0** | no single transit (quiet) |
| TIC 616335579 | ≥ 0.47 | **0** | no single transit (quiet) |
| TIC 79305434 | ≥ 0.48 | **0** | no single transit (quiet) |
| TIC 220511221 | ≥ 0.49 | **0** | no single transit (quiet) |

Both loud events were edge artifacts again. TIC 158532040 produced a **sig-18.5** dip (depth 1.26%)
sitting on a segment boundary — edge refused it. TIC 293482838 surfaced three events; the loudest,
**sig 6.4** (above the floor), failed **edge + symmetry**, an asymmetric ramp on a boundary. Four
significant single events across the dwarf pool now (sig 13.6, 20.6, 18.5, 6.4) — **every one caught
by the edge gate**, and none of them a candidate. The workhorse discriminator is the boundary check.

*This batch is also the first the drilldown can fully explain: the curve view now names each dip's
fate and the gate it failed (sub-11-15), so an edge artifact reads as an edge artifact on screen —
no hand-computation needed, the way the sig-4.98 blip above once required.*

**Cumulative dwarf-pool tally (30 of 50 searched):** 15 quiet · 11 insignificant · 4 rejected
(all edge, two also symmetry) · **0 candidates.** Twenty targets still pending a fetch, stated
`not_fetched`. Thirty real M/K dwarfs searched at Earth-to-Neptune sensitivity, and the sky is
quiet — every loud thing was an instrument artifact the edge gate caught. Empty hands, honestly
kept: exactly what a real single-transit search returns most of the time.

### Fourth batch — 8 more dwarfs (2026-08-14)

Fetched the next 8 planet-size dwarfs (including TIC 142169644, whose MAST download had failed
mid-fetch in the third batch and was carried as `failed` — this time the curve came down). Searched
all eight. Same texture: **2 quiet, 4 insignificant, 2 rejected, 0 candidates.**

| star | min planet (R♃) | events | disposition |
|------|-----------------|--------|-------------|
| TIC 142169644 | ≥ 0.43 | 1 | **rejected — sig 6.02, killed by edge + coherence + symmetry** |
| TIC 464271372 | ≥ 0.49 | **0** | no single transit (quiet) |
| TIC 308240938 | ≥ 0.50 | 2 | insignificant (sig 0.11) |
| TIC 364637541 | ≥ 0.53 | 2 | insignificant (sig −0.01) |
| TIC 253690076 | ≥ 0.55 | **0** | no single transit (quiet) |
| TIC 61698163 | ≥ 0.55 | 1 | **rejected — sig 61.99, killed by edge + symmetry** |
| TIC 50869431 | ≥ 0.55 | 1 | insignificant (sig −0.05) |
| TIC 217298578 | ≥ 0.55 | 3 | insignificant (sig 0.07) |

The headline is TIC 61698163: a **sig-61.99** dip — the loudest single event the dwarf pool has
produced by a wide margin — and it is still an edge artifact, refused by edge + symmetry (an
asymmetric ramp riding a segment boundary). Loud is not the same as real; a downlink discontinuity
can dwarf any planet. TIC 142169644, back from its failed fetch, threw a sig-6.02 dip that tripped
all three shape gates at once (edge, coherence, symmetry). Six significant single events across the
dwarf pool now (sig 6.02, 6.4, 13.6, 18.5, 20.6, 61.99) — **every one caught by the edge gate**, not
one a candidate. The boundary check remains the workhorse, and it just caught the biggest fish.

**Cumulative dwarf-pool tally (41 of 50 searched):** 18 quiet · 17 insignificant · 6 rejected
(all edge; three also symmetry, one also coherence) · **0 candidates.** This count is no longer
hand-kept: `scripts/tally_hunt.py` recomputes it from the on-disk caches, and it caught a drift —
the numbered batches summed to 38, but three anchor dwarfs searched earlier during sub-11-12/13
(TIC 156004112, 231631019, 352402781) had never been added to the running total. The real count was
41. The tally now reads the sky, not my arithmetic.

### Fifth batch — the last 9 dwarfs; the pool is fully searched (2026-08-14)

Fetched and searched the final 9 pending dwarfs. The sub-11-14 dwarf pool — all 50 — is now
searched end to end. This batch: **3 quiet, 5 insignificant, 1 rejected, 0 candidates.**

| star | min planet (R♃) | events | disposition |
|------|-----------------|--------|-------------|
| TIC 143256723 | ≥ 0.57 | **0** | no single transit (quiet) |
| TIC 214013048 | ≥ 0.57 | 1 | insignificant (sig 0.05) |
| TIC 337108370 | ≥ 0.58 | 1 | insignificant (sig −0.00) |
| TIC 60299558 | ≥ 0.59 | 2 | insignificant (sig 0.02) |
| TIC 90720183 | ≥ 0.60 | **0** | no single transit (quiet) |
| TIC 469881695 | ≥ 0.63 | 1 | insignificant (sig 0.05) |
| TIC 219989145 | ≥ 0.63 | 1 | **rejected — sig 11.85, killed by edge + symmetry** |
| TIC 253697087 | ≥ 0.63 | **0** | no single transit (quiet) |
| TIC 253630444 | ≥ 0.67 | 2 | insignificant (sig 0.10) |

One more loud one, one more artifact: TIC 219989145 threw a **sig-11.85** dip on a segment boundary,
edge + symmetry. That makes seven significant single events across the whole pool.

**Final dwarf-pool tally — all 50 of 50 searched (tally_hunt.py, 2026-08-14):**
**21 quiet · 22 insignificant · 7 rejected · 0 candidates.** Every one of the seven significant
single events — sig 61.99, 20.64, 18.52, 13.59, 11.85, 6.41, 6.02 — was **caught by the edge gate**
(six of the seven also by symmetry, one also by coherence). Not one candidate. Fifty real M/K dwarfs,
selected smallest-first so an Earth-size transit could in principle register, searched at
Earth-to-Neptune sensitivity, and every loud thing up to sig 62 was an instrument artifact riding a
downlink or momentum-dump boundary. The edge gate is the workhorse of this whole search; without it,
seven systematics would have paraded as detections.

The empty hands are the result, and they are honest. A real single-transit search over fifty quiet
dwarfs returns exactly this most of the time — that is what the machines' blind spot looks like when
you actually walk it. The next real sky is not more of this pool but the *next* one: the biweekly
GitHub Action refreshes the dwarf-selected pool with each new TESS sector, and every fresh star gets
the same four gates and the same honest verdict.

*Tally verified by `scripts/tally_hunt.py`; new runs appended as each biweekly sector arrives.*

## The pool widened — 50 → 100 dwarfs of the same sky (2026-08-15)

The 50-dwarf pool was fully searched, but sector 104 was not exhausted: it holds ~12,700 un-cataloged
2-min targets, and `select_for_hunt` had kept only the 50 smallest. With no new TESS sector released
yet (sector 105 is still empty on MAST), the honest next sky was the *next-smallest* dwarfs of the
same sector. Rebuilt the pool at `--n 100`; it is still entirely planet-size (`assess_pool`: 100
plausible, 0 too big). 48 of the searched 50 survive into the wider pool (the seed-10 resample
dropped 2, whose verdicts stay recorded in sub-11-16); 52 new dwarfs are now pending.

### First extension batch — 8 new dwarfs (2026-08-15)

Fetched 9 of the new dwarfs (one MAST connection dropped: TIC 79248089, to retry) and searched the
8 that landed. This batch: **4 quiet, 3 insignificant, 1 rejected, 0 candidates.**

| star | R★ (R☉) | min planet (R♃ / R⊕) | events | disposition |
|------|---------|----------------------|--------|-------------|
| TIC 129138718 | 0.25 | ≥ 0.16 / ≥ 1.7 | **0** | no single transit (quiet) |
| TIC 16909043 | 0.30 | ≥ 0.19 / ≥ 2.1 | 1 | insignificant (sig 0.08) |
| TIC 363404040 | 0.35 | ≥ 0.22 / ≥ 2.4 | **0** | no single transit (quiet) |
| TIC 404030766 | 0.37 | ≥ 0.24 / ≥ 2.6 | 1 | **rejected — sig 41.26, killed by symmetry** |
| TIC 291319960 | 0.39 | ≥ 0.24 / ≥ 2.7 | **0** | no single transit (quiet) |
| TIC 143514367 | 0.39 | ≥ 0.25 / ≥ 2.7 | **0** | no single transit (quiet) |
| TIC 118278380 | 0.42 | ≥ 0.26 / ≥ 2.9 | 1 | insignificant (sig 0.04) |
| TIC 156002545 | 0.46 | ≥ 0.29 / ≥ 3.1 | 1 | insignificant (sig −0.02) |

The headline is **TIC 404030766, sig 41.26** — the second-loudest single event the whole pool has
produced (behind only sig 61.99), and **the first significant event not caught by the edge gate.**
Every one of the previous seven artifacts sat on a segment boundary and died to *edge*; this one is
mid-segment, an asymmetric flux ramp, and the *symmetry* gate killed it alone. The guard that earns
its keep is not always the same guard — the shape gates are a set, and a loud artifact that slips
past one is caught by another. Still no candidate.

**Cumulative tally — 56 of 100 searched (tally_hunt.py, 2026-08-15):**
**24 quiet · 24 insignificant · 8 rejected · 0 candidates.** Eight significant single events across
fifty-six real dwarfs (sig 61.99, **41.26**, 20.64, 18.52, 13.59, 11.85, 6.41, 6.02); seven caught by
edge, one — the new 41.26 — by symmetry. Zero candidates. 44 dwarfs of the widened pool remain
pending; the fetch+search continues in batches.

### Second extension batch — the first candidate, and a fifth discriminator (2026-08-17)

Fetched and searched 20 more dwarfs of the widened pool (two batches of 10; two MAST connections
dropped and were retried). This batch produced the hunt's **first-ever candidate** — and, on
inspection, its first self-corrected false positive.

**TIC 326691903** surfaced an event that cleared all four discriminators *and* the significance
floor: sig 10.86, `candidate = True`. Before believing it, we read the raw light curve. It opens at
t = 1657.127 already ~6 % below baseline and climbs monotonically back to 1.0 over ~0.15 d — a
textbook segment-start thermal-recovery ramp. The search found the deep spike at the very start
(sig 48.45, killed by **edge**) *and* its neighbour one duration later (sig 10.86), which sits 0.15 d
from the boundary — just past the edge clearance — and rides the recovering ramp to a 1.1 % apparent
"dip." The candidate was the tail of an instrument artifact, not a planet.

None of the four gates could see it: edge measures only distance to a boundary; symmetry compares
ingress to egress *within* the narrow window, where a slow ramp looks locally symmetric. So we added
a fifth, `baseline`: a real transit is a depression against a **flat** local baseline, so its two
out-of-transit shoulders must sit at the same flux. Threshold measured, not asserted — injected
clean transits step by ≤ 0.32 × depth; this ramp steps by 4.67 ×. Under the new gate (cache bumped
to `mono-v2`, whole pool re-searched) **TIC 326691903 flips candidate → rejected**, and the hunt is
back to zero candidates.

| star | R★ (R☉) | min planet (R♃ / R⊕) | disposition |
|------|---------|----------------------|-------------|
| TIC 79248089 | 0.30 | ≥ 0.19 / ≥ 2.1 | no single transit (quiet) |
| TIC 326691903 | 0.53 | ≥ 0.33 / ≥ 3.7 | **rejected — first "candidate", a start-of-segment ramp (baseline)** |
| TIC 213475170 | 0.58 | ≥ 0.36 / ≥ 4.0 | no single transit (quiet) |
| TIC 144063051 | 0.60 | ≥ 0.38 / ≥ 4.3 | insignificant (sig 0.07) |
| TIC 469319692 | 0.63 | ≥ 0.39 / ≥ 4.4 | no single transit (quiet) |
| TIC 469940956 | 0.63 | ≥ 0.40 / ≥ 4.5 | no single transit (quiet) |
| TIC 206598073 | 0.65 | ≥ 0.41 / ≥ 4.6 | insignificant (sig 0.05) |
| TIC 393483292 | 0.68 | ≥ 0.43 / ≥ 4.8 | rejected — sig 18.26 (edge, coherence, symmetry) |
| TIC 329099756 | 0.68 | ≥ 0.43 / ≥ 4.8 | rejected — sig 5.69 (edge, symmetry) |
| TIC 1989174735 | 0.69 | ≥ 0.44 / ≥ 4.9 | insignificant (sig −0.06) |
| TIC 381093768 | 0.71 | ≥ 0.45 / ≥ 5.0 | no single transit (quiet) |
| TIC 126303934 | 0.71 | ≥ 0.45 / ≥ 5.0 | no single transit (quiet) |
| TIC 331598534 | 0.73 | ≥ 0.46 / ≥ 5.2 | no single transit (quiet) |
| TIC 63028103 | 0.75 | ≥ 0.47 / ≥ 5.3 | insignificant (sig 0.05) |
| TIC 67643537 | 0.76 | ≥ 0.48 / ≥ 5.4 | no single transit (quiet) |
| TIC 253676019 | 0.76 | ≥ 0.48 / ≥ 5.4 | insignificant (sig −0.10) |
| TIC 212697670 | 0.76 | ≥ 0.48 / ≥ 5.4 | no single transit (quiet) |
| TIC 23924218 | 0.76 | ≥ 0.48 / ≥ 5.4 | **rejected — sig 24.94, killed by symmetry alone** |
| TIC 328778970 | 0.76 | ≥ 0.48 / ≥ 5.4 | insignificant (sig 0.02) |
| TIC 80430369 | 0.79 | ≥ 0.50 / ≥ 5.6 | insignificant (sig 0.01) |

Batch: **9 quiet · 7 insignificant · 4 rejected · 0 candidates.** Besides the corrected candidate,
the other headline is **TIC 23924218, sig 24.94, rejected by symmetry alone** — a second loud
mid-segment ramp off any boundary, caught not by edge but by shape. The gates keep proving they are
a *set*: edge, symmetry, and now baseline each carry rejections no other gate would.

**Cumulative tally — 76 of 100 searched (tally_hunt.py, 2026-08-17, under mono-v2):**
**33 quiet · 31 insignificant · 12 rejected · 0 candidates.** Twelve significant single events across
seventy-six real dwarfs; every one an instrument or a systematic, each named by the gate that caught
it. The first thing that ever passed all the gates was an artifact — and the pipeline learned a new
gate from it, the way it should. Zero candidates. 24 dwarfs of the widened pool remain pending.
