"""Measure where the baseline-step discriminator's threshold belongs, on real curves.

The hunt's first "candidate" (TIC 326691903, sub-11-18) was not a planet: it was the tail
of a segment-start thermal recovery ramp, one duration past the edge gate's reach. The dip
rode a monotonic step — its flux just before ingress sat well below its flux just after
egress — while a real transit rests on a FLAT local baseline, the two shoulders agreeing.

This script sets the threshold the honest way, the same discipline as _SIG_MIN_MONO: it does
not assert a number, it measures the empty gap between what noise produces and what the
artifact produces, and reports it so a human can place the cut in between.

  null  (clean transits) : inject a recoverable transit at many mid-segment positions into
                           real quiet TESS curves, keep only those the full chain recovers,
                           passes on significance, and clears the OTHER four discriminators,
                           and record each one's baseline-step ratio |b_left - b_right| / depth.
  signal (the artifact)  : the same ratio at the real ramp event on TIC 326691903.

A clean transit's shoulders agree to a small fraction of the depth; the ramp's differ by
several times it. The gap between the two is where the threshold lives.

Run from backend/:  python ../scripts/measure_baseline_step.py
"""

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services import bls as b            # noqa: E402
from services import monotransit as mt   # noqa: E402

# quiet dwarfs from the sub-11-17/18 batches whose curves are cached — the clean-null hosts
_QUIET_HOSTS = ["tic-213475170", "tic-469319692", "tic-381093768",
                "tic-79248089", "tic-469940956"]
# the first "candidate": a segment-start recovery ramp, the signal case
_RAMP = ("tic-326691903", 1657.2770491661536, 0.1, 0.01132755256039483)

_POSITIONS = 20          # injection sites per curve
_DURATIONS = [0.2, 0.4]


def _load(name):
    p = b._CACHE_DIR / ("bls_lc_%s.json" % b._slug(name))
    if not p.exists():
        return None
    d = json.loads(p.read_text(encoding="utf-8"))
    t, f = np.array(d["time"]), np.array(d["flux"])
    f = b._detrend(t, f)
    f = f / np.median(f)
    return t, f


def _step_ratio(t, f, t0, dur, depth):
    left = f[(t > t0 - 1.75 * dur) & (t < t0 - 0.75 * dur)]
    right = f[(t > t0 + 0.75 * dur) & (t < t0 + 1.75 * dur)]
    if left.size < mt._MIN_IN_TRANSIT or right.size < mt._MIN_IN_TRANSIT or depth <= 0:
        return None
    return abs(float(np.median(left)) - float(np.median(right))) / depth


def measure_null():
    rng = np.random.default_rng(3)
    ratios = []
    for name in _QUIET_HOSTS:
        lc = _load(name)
        if lc is None:
            print("  (no cache) %s" % name)
            continue
        t, f = lc
        floor = mt.sensitivity_depth_floor(t, f) or 0.01
        depth = max(2.0 * floor, 0.006)
        lo, hi = float(np.percentile(t, 10)), float(np.percentile(t, 90))
        kept = 0
        for _ in range(_POSITIONS):
            t0 = float(rng.uniform(lo, hi))
            for dur in _DURATIONS:
                fi = mt.inject_transit(t, f, t0, depth, dur)
                z = mt.significance_red(t, fi, t0, dur)
                if z is None or z < mt._SIG_MIN_MONO:
                    continue
                disc = mt.discriminators(t, fi, {"t0": t0, "duration": dur, "depth": depth})
                # only count events the OTHER gates already pass — we are characterizing
                # the baseline ratio of otherwise-clean recovered transits
                others_ok = all(c["passed"] for c in disc["checks"] if c["name"] != "baseline")
                if not others_ok:
                    continue
                r = _step_ratio(t, fi, t0, dur, depth)
                if r is not None:
                    ratios.append(r)
                    kept += 1
        print("  %-16s recovered clean events: %d" % (name, kept))
    return np.array(sorted(ratios))


def main():
    print("=== null: clean injected transits into real quiet curves ===")
    null = measure_null()
    if null.size:
        print("clean baseline-step ratio  n=%d  min=%.2f median=%.2f p90=%.2f p95=%.2f p99=%.2f max=%.2f"
              % (null.size, null.min(), np.median(null), np.percentile(null, 90),
                 np.percentile(null, 95), np.percentile(null, 99), null.max()))

    print("=== signal: the first-candidate recovery ramp ===")
    name, t0, dur, depth = _RAMP
    lc = _load(name)
    if lc is not None:
        t, f = lc
        r = _step_ratio(t, f, t0, dur, depth)
        print("  %-16s baseline-step ratio = %.2f" % (name, r))

    if null.size:
        gap_lo, gap_hi = float(null.max()), r
        print("--- empty gap: clean max %.2f ..  ramp %.2f ;  _BASELINE_STEP_MAX = %.1f sits between ---"
              % (gap_lo, gap_hi, mt._BASELINE_STEP_MAX))


if __name__ == "__main__":
    main()
