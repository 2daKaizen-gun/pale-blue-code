"""Measure which Savitzky-Golay detrend window minimises the depth floor (path A, lever 2).

Path A raises sensitivity by finding what actually lowers each star's measured depth floor
(`docs/vision/finding-our-own-planet.md` §9). Lever 1 (flux) is settled — PDCSAP wins (sub-11-23).
Lever 2 is the detrend window. `bls._detrend` uses a 30-day SG window, fixed in sub-10-3 by
*transit-depth* preservation (a window near the transit duration follows the dip and divides it out).
But the *noise floor* is a second, independent question: too short a window eats long signal and adds
noise, while too long a window leaves slow systematics (red noise) that raise the floor. The window
that minimises the floor need not be 30 days, so we measure it rather than assume it.

For each target this downloads the PDCSAP curve once, then detrends it at several windows through the
*identical* rest of the pipeline (baseline-1 -> sensitivity_depth_floor) and converts each floor to
the smallest planet that curve could reveal (sqrt(floor)*R_star, in R_earth). Per star it names the
best window and how much it beats the production 30-day window; the summary says whether 30 d already
wins (keep it) or another window consistently lowers the floor (a change worth measuring further).

Targets default to path A's sharpest stars (rank_by_sensitivity) or an explicit --tic list. Downloads
are slow; run in the background.

Run from the backend/ dir, e.g.:
    python ../scripts/measure_detrend_floor.py --pool data/pool_s0103.json data/frontier_seeds_tess.json --top 11
"""

import argparse
import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np   # noqa: E402

from services import hunt   # noqa: E402
from services import bls as bls_service   # noqa: E402
from services import monotransit as mt   # noqa: E402
from services import pool_assessment as pa   # noqa: E402

from rank_by_sensitivity import rank_by_sensitivity, _collect_rows   # noqa: E402

_DEFAULT_WINDOWS = [10.0, 20.0, 30.0, 50.0]   # days; 30 is the production window
_BASELINE_WINDOW = 30.0


def _min_rearth(radius, floor):
    if radius and radius > 0 and floor and floor > 0:
        return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))
    return None


def compare_detrend_windows(rows, baseline_window=_BASELINE_WINDOW):
    """rows: iterable of ``{tic, radius, floors: {window_days: floor}}``.

    Return ``{stars, n_compared, n_improved, best_window_counts, median_gain_rearth}``. Per star, pick
    the window with the smallest measured floor (``best_window``), convert both it and the baseline
    (30 d) floor to a planet radius, and report ``gain_rearth = baseline_rearth - best_rearth``
    (POSITIVE = the best window reaches a smaller planet than 30 d). A star missing the baseline floor
    or a radius is kept with ``gain_rearth=None`` and excluded from the summary — an honest
    "no comparison", never a fabricated tie. ``best_window_counts`` tallies which window won, so a
    result where 30 d wins most stars reads at a glance.
    """
    per = []
    gains = []
    best_counts = {}
    for r in rows:
        floors = r.get("floors", {})
        radius = r.get("radius")
        # candidate windows with a real, positive floor and a radius to convert with
        usable = {w: f for w, f in floors.items() if _min_rearth(radius, f) is not None}
        best_window = min(usable, key=lambda w: usable[w]) if usable else None
        best_rearth = _min_rearth(radius, usable[best_window]) if best_window is not None else None
        base_rearth = _min_rearth(radius, floors.get(baseline_window))
        gain = (base_rearth - best_rearth) if (base_rearth is not None and best_rearth is not None) else None
        if gain is not None:
            gains.append(gain)
            best_counts[best_window] = best_counts.get(best_window, 0) + 1
        per.append({**r, "best_window": best_window, "best_rearth": best_rearth,
                    "baseline_rearth": base_rearth, "gain_rearth": gain})
    return {
        "stars": per,
        "n_compared": len(gains),
        "n_improved": sum(1 for g in gains if g > 0),
        "best_window_counts": best_counts,
        "median_gain_rearth": statistics.median(gains) if gains else None,
    }


def _floor_at_window(time, flux, window_days):
    """Detrend the given curve at one window and return its measured depth floor."""
    f = bls_service._detrend(time, flux, window_days=window_days)
    med = float(np.median(f))
    if med != 0:
        f = f / med
    return mt.sensitivity_depth_floor(time, f)


def _targets(args):
    if args.tic:
        rad = {}
        for p in args.pool:
            for s in json.loads(Path(p).read_text(encoding="utf-8"))["stars"]:
                rad.setdefault(int(s["tic"]), s.get("radius"))
        return [(t, rad.get(t)) for t in args.tic]
    rows, _ = _collect_rows(args.pool)
    ranked = rank_by_sensitivity(rows)[:args.top]
    return [(r["tic"], r["radius"]) for r in ranked]


def main() -> None:
    import lightkurve as lk

    ap = argparse.ArgumentParser(description="Measure which detrend window minimises the depth floor.")
    ap.add_argument("--pool", nargs="+", default=[str(ROOT / "backend" / "data" / "frontier_seeds_tess.json")])
    ap.add_argument("--top", type=int, default=11)
    ap.add_argument("--tic", type=int, nargs="*")
    ap.add_argument("--windows", type=float, nargs="+", default=_DEFAULT_WINDOWS)
    args = ap.parse_args()

    targets = _targets(args)
    windows = sorted(args.windows)
    print("measuring detrend floor over windows %s d on %d star(s)..."
          % ("/".join("%g" % w for w in windows), len(targets)))
    rows = []
    for tic, radius in targets:
        try:
            search = lk.search_lightcurve("TIC %d" % tic, mission="TESS", author="SPOC", exptime="short")
            lc = hunt._download_stitched_lc(search, flux_column=None)   # PDCSAP, lever-1 winner
            time = np.asarray(lc.time.value, dtype=float)
            flux = np.asarray(lc.flux.value, dtype=float)
            floors = {w: _floor_at_window(time, flux, w) for w in windows}
        except Exception as exc:
            print("  TIC %-12d ERROR %s" % (tic, exc))
            continue
        rows.append({"tic": tic, "radius": radius, "floors": floors})
        print("  TIC %-12d %s" % (tic, "  ".join("%gd=%s" % (w, floors[w]) for w in windows)))

    result = compare_detrend_windows(rows)
    print("-" * 76)
    hdr = ["TIC", "R_star"] + ["%gd Re" % w for w in windows] + ["best", "gain Re"]
    print("  " + " ".join("%9s" % h for h in hdr))
    for s in result["stars"]:
        rad = "%.3f" % s["radius"] if s.get("radius") else "  ?  "
        cells = [str(s["tic"]), rad]
        for w in windows:
            mr = _min_rearth(s.get("radius"), s["floors"].get(w))
            cells.append("%.2f" % mr if mr is not None else " ? ")
        cells.append("%gd" % s["best_window"] if s["best_window"] is not None else " ? ")
        cells.append("%+.2f" % s["gain_rearth"] if s["gain_rearth"] is not None else " ? ")
        print("  " + " ".join("%9s" % c for c in cells))
    print("-" * 76)
    mg = result["median_gain_rearth"]
    counts = ", ".join("%gd:%d" % (w, n) for w, n in sorted(result["best_window_counts"].items()))
    print("compared %d stars; best-window tally: %s" % (result["n_compared"], counts or "n/a"))
    print("a non-30d window beat 30d on %d of %d; median gain over 30d = %s Re"
          % (result["n_improved"], result["n_compared"],
             ("%+.3f" % mg) if mg is not None else "n/a"))
    print("(positive gain = best window reaches a smaller planet than the production 30d)")


if __name__ == "__main__":
    main()
