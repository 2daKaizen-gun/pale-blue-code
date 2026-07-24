#!/usr/bin/env python
"""Measure what the Savitzky-Golay detrend window does to a transit — on real data.

Why (sub-10-3, Light 4): `bls._detrend` fixes its SG window in *points*:

    win = int(_DETREND_WINDOW_DAYS / _KEPLER_CADENCE_DAYS)   # 30.0 / 0.0204 = 1470

1470 points is 30 days only at Kepler's 29.4-min long cadence. TESS SPOC 2-min data
has ~14x finer sampling, so the same 1470 points span roughly 2 days instead — a
detrend an order of magnitude more aggressive than the docstring claims. A window
that approaches the transit duration stops being a trend and starts being the
transit: SG follows the dip and divides it out.

Rather than argue about it, this measures it. We take a real single-sector TESS light
curve, inject a box transit of known depth, detrend, and measure how much depth
survives (injection-recovery, the standard way to characterise a detrending
pipeline). Sweeping the window in days shows where the knee is, so the window rule in
_detrend can be chosen from evidence rather than inherited from Kepler.

Usage:
    python scripts/measure_detrend_window.py --tic 7318157
    python scripts/measure_detrend_window.py --tic 7318157 --period 6.0 --depth 0.005
"""
import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

# What _detrend used to assume for every mission, kept here purely so the report can
# show the size of the old mistake at the cadence actually in hand.
_LEGACY_KEPLER_CADENCE = 0.0204

from services import bls as bls_service  # noqa: E402
from services import hunt as hunt_service  # noqa: E402


def load_full_lc(tic: int) -> tuple[np.ndarray, np.ndarray]:
    """Real full-resolution light curve, through the exact path BLS uses."""
    star = f"TIC {tic}"
    hunt_service.fetch_lc_by_tic(tic)          # populates lc_tic-*_tess.json
    meta = bls_service._find_lc_cache(star)
    if meta is None:
        raise SystemExit(f"no light curve cache for {star}")
    return bls_service._get_full_lc(star, meta)


def inject_transit(time, flux, period, depth, duration, epoch=None):
    """Multiply in a box transit of known depth. Returns (flux, in_transit_mask)."""
    epoch = time.min() + period / 2 if epoch is None else epoch
    phase = np.abs((time - epoch + period / 2) % period - period / 2)
    in_transit = phase < duration / 2
    out = flux.copy()
    out[in_transit] *= 1.0 - depth
    return out, in_transit


def detrend_with_window(time, flux, window_days, cadence):
    """bls._detrend, but with the SG window expressed in days.

    Deliberately mirrors the real function (same gap split, same polyorder, same
    skip-short-segments rule) so the only variable is the window.
    """
    from scipy.signal import savgol_filter

    win = int(window_days / cadence)
    if win % 2 == 0:
        win += 1

    sort_idx = np.argsort(time)
    t, f = time[sort_idx], flux[sort_idx]
    gap_idx = np.where(np.diff(t) > 1.0)[0] + 1
    segments = np.split(np.arange(len(t)), gap_idx)

    flat = f.copy()
    applied = 0
    for seg in segments:
        if len(seg) < win:
            continue
        trend = savgol_filter(f[seg], window_length=win, polyorder=2)
        flat[seg] = np.where(np.abs(trend) > 1e-9, f[seg] / trend, f[seg])
        applied += 1
    return flat, win, applied, len(segments)


def measured_depth(flux, in_transit) -> float:
    """Depth as the vetter would see it: in-transit vs out-of-transit median."""
    oot = np.median(flux[~in_transit])
    itr = np.median(flux[in_transit])
    return float(1.0 - itr / oot) if oot != 0 else float("nan")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tic", type=int, required=True)
    ap.add_argument("--period", type=float, default=6.0, help="injected period (d)")
    ap.add_argument("--depth", type=float, default=0.005, help="injected depth (frac)")
    ap.add_argument("--duration", type=float, default=0.15, help="injected duration (d)")
    args = ap.parse_args()

    time, flux = load_full_lc(args.tic)
    cadence = float(np.median(np.diff(np.sort(time))))
    baseline = float(time.max() - time.min())
    gaps = int((np.diff(np.sort(time)) > 1.0).sum())

    print(f"TIC {args.tic}")
    print(f"  points        {len(time)}")
    print(f"  baseline      {baseline:.2f} d")
    print(f"  cadence       {cadence * 24 * 60:.2f} min  ({cadence:.6f} d)")
    print(f"  segments      {gaps + 1} (split at gaps > 1 d)")

    legacy_win = int(bls_service._DETREND_WINDOW_DAYS / _LEGACY_KEPLER_CADENCE)
    derived_win = int(bls_service._DETREND_WINDOW_DAYS / cadence)
    print(f"\n  legacy fixed window   {legacy_win} points"
          f" = {legacy_win * cadence:.2f} d at this cadence  (the bug)")
    print(f"  cadence-derived       {derived_win} points"
          f" = {bls_service._DETREND_WINDOW_DAYS:.1f} d, clamped to segment length")
    print(f"  floor                 {bls_service._MIN_WINDOW_DAYS:.1f} d"
          f"  (below this a segment is left undetrended)")

    injected, in_transit = inject_transit(
        time, flux, args.period, args.depth, args.duration)
    n_transits = int(baseline // args.period)
    print(f"\ninjected: P={args.period} d, depth={args.depth * 100:.2f}%, "
          f"dur={args.duration} d -> {in_transit.sum()} in-transit points, "
          f"~{n_transits} transits")

    raw = measured_depth(injected, in_transit)
    print(f"\n{'window':>10}  {'points':>7}  {'segs':>7}  {'depth':>8}  {'kept':>6}")
    print(f"{'(none)':>10}  {'-':>7}  {'-':>7}  {raw * 100:>7.3f}%  {100.0:>5.1f}%")

    # The real function first, then a sweep in days to expose the knee.
    flat = bls_service._detrend(time, injected)
    d = measured_depth(flat, in_transit)
    print(f"{'SHIPPED':>10}  {'auto':>7}  {'-':>7}  {d * 100:>7.3f}%  "
          f"{d / raw * 100:>5.1f}%   <- bls._detrend as it stands")

    for wd in (0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 15.0, 20.0, 30.0):
        flat, win, applied, total = detrend_with_window(time, injected, wd, cadence)
        d = measured_depth(flat, in_transit)
        note = "  <- SKIPPED (segment shorter than window)" if applied == 0 else ""
        print(f"{wd:>9.1f}d  {win:>7}  {applied:>3}/{total:<3}  {d * 100:>7.3f}%  "
              f"{d / raw * 100:>5.1f}%{note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
