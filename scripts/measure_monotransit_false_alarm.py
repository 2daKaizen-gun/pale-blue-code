"""Measure the false-alarm rate of the full monotransit chain — the scoreboard.

sub-11-3 Light 2. sub-11-2 measured where to cut *significance* (the null tops out
at 2.86, `_SIG_MIN_MONO = 5.0` sits above it). This measures the whole chain — search
+ significance + discriminators — because the hunt promotes a survivor only when all
three agree, and a "candidate" claim is only as honest as the chance a survivor appears
on noise alone. Two nulls, both on real TESS data:

  cross-star significance null
      significance_red at random non-transit epochs, on the *single-sector* cached
      curves (the population the hunt actually targets — one sector, one possible
      transit). sub-11-2 calibrated the 5.0 floor on one star; this checks the floor
      holds across more than the calibration star.

  full-chain inversion test
      flip each light curve upside down (flux -> 2*median - flux). A real transit is a
      dip; inverted it becomes a bump the dip-search cannot see, so every real dip and
      every downward glitch is removed — but the noise, the red-noise wobble, and the
      segment structure are preserved exactly. Any survivor the full chain still finds
      in an inverted curve is a false alarm from noise shape alone. This is the honest
      null: same star, same noise, no planet.

Run from backend/:  python ../scripts/measure_monotransit_false_alarm.py
"""

import json
import sys
from pathlib import Path

import numpy as np

try:
    sys.stdout.reconfigure(encoding="utf-8")   # Windows console defaults to cp949
except (AttributeError, ValueError):
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import bls as bls_service      # noqa: E402
from services import monotransit as mt       # noqa: E402

_CACHE = Path(__file__).resolve().parent.parent / "backend" / "cache"
_DUR = 0.3                     # control-window duration for the significance null, days
_NULL_EPOCHS = 200

# every cached TESS star; the two single-sector ones (span ~25 d) are the honest
# population for the significance null, the rest are multi-sector concatenations.
_STARS = ["tic-7318157", "tic-7187543", "tic-102029734", "tic-253825414", "tic-469906369"]
_SINGLE_SECTOR_MAX_SPAN = 40.0   # d — tells single-sector curves from multi-sector caches


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
    """Random epochs at least `margin` days from either end and from any >0.5 d gap."""
    gaps = np.where(np.diff(time) > 0.5)[0]
    bad_edges = np.concatenate([[time[0]], time[gaps], time[gaps + 1], [time[-1]]])
    out = []
    while len(out) < n:
        t = rng.uniform(time[0] + margin, time[-1] - margin)
        if np.min(np.abs(bad_edges - t)) > margin:
            out.append(t)
    return out


def _full_chain(time, flux):
    """Run search + significance + discriminators; return (survivors, max_significance)."""
    sigma = mt.estimate_noise(flux)
    survivors = []
    max_sig = None
    for e in mt.search(time, flux, sigma=sigma):
        z = mt.significance_red(time, flux, e["t0"], e["duration"])
        disc = mt.discriminators(time, flux, e, sigma=sigma)
        if z is not None and (max_sig is None or z > max_sig):
            max_sig = z
        if z is not None and z >= mt._SIG_MIN_MONO and disc["passed"]:
            survivors.append((round(e["t0"], 3), round(z, 2)))
    return survivors, max_sig


def main():
    rng = np.random.default_rng(0)

    # --- cross-star significance null (single-sector curves) ------------------
    print("CROSS-STAR SIGNIFICANCE NULL  (significance_red at non-transit epochs)")
    print(f"  {'star':>16} {'span':>7} {'N':>7} {'95th':>7} {'99th':>7} {'max':>7}")
    curves = {}
    for slug in _STARS:
        time, flux = _load_detrended(slug)
        curves[slug] = (time, flux)
        span = time[-1] - time[0]
        if span > _SINGLE_SECTOR_MAX_SPAN:
            print(f"  {slug:>16} {span:7.1f} {len(time):7d}   (multi-sector -- skipped for the null)")
            continue
        null = []
        for t0 in _clean_epochs(time, rng, _NULL_EPOCHS):
            z = mt.significance_red(time, flux, t0, _DUR)
            if z is not None:
                null.append(z)
        null = np.array(null)
        print(f"  {slug:>16} {span:7.1f} {len(time):7d} "
              f"{np.percentile(null,95):7.2f} {np.percentile(null,99):7.2f} {null.max():7.2f}")

    # --- full-chain inversion test (all cached curves) -----------------------
    print("\nFULL-CHAIN INVERSION TEST  (flux -> 2*median - flux; no real dip remains)")
    print(f"  {'star':>16} {'span':>7} {'max sig':>8} {'survivors':>10}")
    total_survivors = 0
    for slug in _STARS:
        time, flux = curves[slug]
        inv = 2.0 * float(np.median(flux)) - flux
        survivors, max_sig = _full_chain(time, inv)
        total_survivors += len(survivors)
        span = time[-1] - time[0]
        ms = f"{max_sig:8.2f}" if max_sig is not None else "     nan"
        print(f"  {slug:>16} {span:7.1f} {ms} {len(survivors):10d}  {survivors if survivors else ''}")

    print(f"\nFALSE ALARMS (full chain, inverted nulls): {total_survivors} "
          f"survivor(s) across {len(_STARS)} curves.")
    print("A survivor here is a candidate produced by noise shape alone — the chance the")
    print("hunt cries wolf. Record it in docs/checks/phase-11/sub-11-3.md (Light 5).")


if __name__ == "__main__":
    main()
