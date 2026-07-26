"""Measure the single-transit significance threshold — injection-recovery.

sub-11-2 Light 3. The monotransit significance (`significance_red`) normalizes a
dip's depth against the empirical scatter of same-duration matched-filter depths
elsewhere in the light curve — red noise and all. This script measures where to
cut it, on *real* single-sector TESS data, so the threshold is read from the gap
between noise and signal rather than asserted.

  null      : significance at random non-transit epochs on TIC 7318157, the
              sub-10-3 noise case (BLS power 0.0004, no real planet). This is what
              correlated noise alone can manufacture at the transit timescale.
  recovered : inject one trapezoidal transit of known depth at a random clean epoch
              into that same detrended light curve, run the search, and read the
              significance of the recovered event. Swept over depth.

Run from backend/:  python ../scripts/measure_monotransit_significance.py
"""

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import bls as bls_service      # noqa: E402
from services import monotransit as mt       # noqa: E402

_CACHE = Path(__file__).resolve().parent.parent / "backend" / "cache"
_NOISE_TIC = "tic-7318157"        # sub-10-3 noise case → the null
_DUR = 0.3                        # injected transit duration, days
_DEPTHS = [0.001, 0.002, 0.004, 0.008, 0.016]
_TRIALS = 40
_NULL_SAMPLES = 300


def _load_detrended(slug):
    data = json.loads((_CACHE / f"bls_lc_{slug}.json").read_text(encoding="utf-8"))
    time = np.asarray(data["time"], float)
    flux = np.asarray(data["flux"], float)
    ok = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[ok], flux[ok]
    order = np.argsort(time)
    time, flux = time[order], flux[order]
    flat = bls_service._detrend(time, flux)
    flat = flat / np.median(flat)
    return time, flat


def _clean_epochs(time, rng, n, margin=1.0):
    """Random epochs at least `margin` days from either end and from any >0.5d gap."""
    gaps = np.where(np.diff(time) > 0.5)[0]
    bad_edges = np.concatenate([[time[0]], time[gaps], time[gaps + 1], [time[-1]]])
    out = []
    while len(out) < n:
        t = rng.uniform(time[0] + margin, time[-1] - margin)
        if np.min(np.abs(bad_edges - t)) > margin:
            out.append(t)
    return out


def main():
    rng = np.random.default_rng(0)
    time, flux = _load_detrended(_NOISE_TIC)
    print(f"null light curve: {_NOISE_TIC}  N={len(time)}  span={time[-1]-time[0]:.1f}d")

    # --- null: significance at random non-transit epochs ---------------------
    null = []
    for t0 in _clean_epochs(time, rng, _NULL_SAMPLES):
        z = mt.significance_red(time, flux, t0, _DUR)
        if z is not None:
            null.append(z)
    null = np.array(null)
    print(f"\nNULL (noise only, {null.size} epochs):")
    for q in (50, 95, 99):
        print(f"  {q}th pct : {np.percentile(null, q):6.2f}")
    print(f"  max      : {null.max():6.2f}")

    # --- recovered: inject one transit of known depth ------------------------
    print(f"\nRECOVERED (inject depth D at a clean epoch, {_TRIALS} trials each):")
    print(f"  {'depth':>7} {'recov%':>7} {'z p10':>7} {'z p50':>7} {'z p90':>7}")
    for depth in _DEPTHS:
        zs = []
        for _ in range(_TRIALS):
            (t0,) = _clean_epochs(time, rng, 1)
            inj = flux * mt.transit_model(time, t0, _DUR, depth)
            events = mt.search(time, inj)
            hit = [e for e in events if abs(e["t0"] - t0) < 0.15]
            if not hit:
                continue
            z = mt.significance_red(time, inj, hit[0]["t0"], hit[0]["duration"])
            if z is not None:
                zs.append(z)
        zs = np.array(zs)
        if zs.size:
            print(f"  {depth:7.3f} {100*zs.size/_TRIALS:6.0f}% "
                  f"{np.percentile(zs,10):7.2f} {np.percentile(zs,50):7.2f} {np.percentile(zs,90):7.2f}")
        else:
            print(f"  {depth:7.3f}    0%   (nothing recovered)")

    print("\nThreshold: pick a cut above the null max and below the z of the")
    print("shallowest depth we want to keep. Record it in _SIG_MIN_MONO.")


if __name__ == "__main__":
    main()
