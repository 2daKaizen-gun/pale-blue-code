## Problem

The four vetting gates ask *does this shape look planetary* — odd/even depth,
secondary eclipse, U-vs-V shape, planet-range size. None of them asks *is there a
real detection here at all*. Nothing in the pipeline gates on the significance of the
BLS peak itself, so a marginal peak can pass all four and be reported as
`trust = strong`.

Surfaced by the live single-sector run in sub-10-3 (see
`docs/checks/phase-10/sub-10-3.md`):

```
TIC 7318157  (sector 104, unrecorded, Tmag 8.57)
  bls : P = 1.5212 d, depth 0.038%, power 0.0004
  vet : strong 4/4, 14 observed transits, provisional = False
        odd_even  pass   depth_odd = -1.0e-07   depth_even = 3.7e-04   sigma = 1.83
        secondary pass · shape pass (flat_frac 0.21) · size pass (S/N 32.6)
```

Two things stand out. The peak is 0.038% deep with a BLS power of 0.0004, and the
depth lives almost entirely in the even epochs — `depth_odd` is essentially zero
while `depth_even` carries the whole signal. A dip that appears on alternating
epochs and nowhere else is far more typical of noise than of a body, yet odd/even
passes it, because with scatter that wide the difference is only 1.83 sigma.

This is a pre-existing Phase 9 limit (light-curve-only vetting), but single-sector
TESS data makes it much easier to hit: short baselines mean shallow, low-power peaks
are common, and a `strong` verdict on one is exactly the overstatement honesty nail 3
exists to prevent.

## Why it matters for what comes next

`docs/vision/finding-our-own-planet.md` points the project at monotransits — single
transit events from long-period planets that repeat-search pipelines discard. A
monotransit has no repetition at all, so *every* judgement about it is a
significance judgement. A vetter that cannot tell a real detection from a noise peak
cannot be pointed at that problem. This is a prerequisite, not a polish item.

## Proposed direction (to be designed, not assumed)

- Decide what significance means here: BLS power against the periodogram's own noise
  floor, transit S/N computed against *correlated* rather than white noise, or both.
  The odd/even fix in sub-10-3 already showed that dividing by sample count
  manufactures confidence, so any S/N used here must not repeat that.
- Decide where it belongs: a fifth gate, or a precondition that runs before the four
  and can stop a report from claiming any trust at all. A gate implies the signal is
  worth vetting; a precondition says it is not.
- Keep the existing four gates' math untouched, as sub-10-2 through sub-10-3 have.
- Re-run all three anchors (KIC 11446443, KIC 7340288, TIC 102029734) plus the
  TIC 7318157 case above; the last one should stop reading as `strong`.

## Success criteria

- [ ] A marginal BLS peak no longer produces a `strong` verdict, with the threshold
      chosen from measurement rather than assertion (as `_N_MIN_TRANSITS` now is).
- [ ] The three existing anchors keep their recorded verdicts.
- [ ] The report exposes the significance figure, so the "window into the vetting"
      shows *why* a signal was or was not worth judging.
- [ ] `pytest` and `vitest` green; a Check doc records the calibration run.

## References

- `docs/checks/phase-10/sub-10-3.md` — the run above, and the four denominator
  defects that preceded it
- `docs/vision/finding-our-own-planet.md` — monotransit direction
- `backend/services/vetting.py` — the four gates and `synthesize`
- `backend/services/bls.py` — where the peak and its power come from
