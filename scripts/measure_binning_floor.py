"""Measure whether binning the curve lowers the depth floor (path A, lever 4).

Path A raises sensitivity by finding what actually lowers each star's measured depth floor
(`docs/vision/finding-our-own-planet.md` §9-1). Three pipeline levers are settled and null:
flux (PDCSAP wins, sub-11-23), detrend window (no effect, sub-11-24), and multi-sector
stitching (already on). The one knob left is the per-point scatter itself — bin adjacent
cadences so white noise averages down by ~sqrt(N).

But there is an honest catch to measure, not assume. The floor's noise is not the raw
per-point scatter: `sensitivity_depth_floor` reads the scatter of *matched-filter depths*
over 0.4-day control windows, a quantity already integrated over the transit duration. If
that integration has already beaten white noise down, binning the raw points first is
redundant and the floor will not move. So we sweep it.

For each target this downloads the PDCSAP curve once, then for each bin width bins the raw
curve (bin=0 is the unbinned control) and runs the *identical* rest of the pipeline
(detrend 30 d -> baseline-1 -> sensitivity_depth_floor), converting each floor to the
smallest planet that curve could reveal (sqrt(floor)*R_star, in R_earth). Per star it names
the best bin and how much it beats the unbinned floor.

A second, independent guard measures the *cost*: `depth_retained_after_binning` bins a
synthetic transit and reports how much of its depth survives, so a bin width that lowers the
floor is only endorsed if it does not smear a real long transit.

Targets default to path A's sharpest stars (rank_by_sensitivity) or an explicit --tic list.
Downloads are slow; run in the background.

Run from the backend/ dir, e.g.:
    python ../scripts/measure_binning_floor.py --pool data/pool_s0103.json data/frontier_seeds_tess.json --top 11
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

_DEFAULT_BINS = [0.0, 5.0, 10.0, 20.0, 30.0]   # minutes; 0 = unbinned control
_BASELINE_BIN = 0.0


def _min_rearth(radius, floor):
    if radius and radius > 0 and floor and floor > 0:
        return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))
    return None


def compare_binning_floors(rows, baseline_bin=_BASELINE_BIN):
    """rows: iterable of ``{tic, radius, floors: {bin_minutes: floor}}``.

    Return ``{stars, n_compared, n_improved, best_bin_counts, median_gain_rearth}``. Per star,
    pick the bin with the smallest measured floor (``best_bin``), convert both it and the
    unbinned baseline floor to a planet radius, and report ``gain_rearth = baseline_rearth -
    best_rearth`` (POSITIVE = binning reaches a smaller planet than the raw curve). A star
    missing the baseline floor or a radius is kept with ``gain_rearth=None`` and excluded from
    the summary — an honest "no comparison", never a fabricated tie. ``best_bin_counts`` tallies
    which bin won, so a result where 0 (unbinned) wins most stars reads at a glance.
    """
    per = []
    gains = []
    best_counts = {}
    for r in rows:
        floors = r.get("floors", {})
        radius = r.get("radius")
        usable = {b: f for b, f in floors.items() if _min_rearth(radius, f) is not None}
        best_bin = min(usable, key=lambda b: usable[b]) if usable else None
        best_rearth = _min_rearth(radius, usable[best_bin]) if best_bin is not None else None
        base_rearth = _min_rearth(radius, floors.get(baseline_bin))
        gain = (base_rearth - best_rearth) if (base_rearth is not None and best_rearth is not None) else None
        if gain is not None:
            gains.append(gain)
            best_counts[best_bin] = best_counts.get(best_bin, 0) + 1
        per.append({**r, "best_bin": best_bin, "best_rearth": best_rearth,
                    "baseline_rearth": base_rearth, "gain_rearth": gain})
    return {
        "stars": per,
        "n_compared": len(gains),
        "n_improved": sum(1 for g in gains if g > 0),
        "best_bin_counts": best_counts,
        "median_gain_rearth": statistics.median(gains) if gains else None,
    }


def depth_retained_after_binning(cadence_min, bin_min, duration_days, depth=0.005):
    """Fraction of a synthetic transit's depth that survives binning — the cost guard.

    Builds a flat curve at ``cadence_min`` sampling with one trapezoidal dip of ``depth``
    and total width ``duration_days``, bins it at ``bin_min``, and returns the measured
    binned depth over the true depth. A value near 1.0 means the bin is safe for a transit
    that long; well below 1.0 means the bin smears it. Pure (no I/O), so the "binning does
    not eat a long transit" claim the check doc reports is pinned by a test.
    """
    cadence = cadence_min / (60.0 * 24.0)
    span = max(4.0 * duration_days, 1.0)
    time = np.arange(0.0, span, cadence)
    t0 = span / 2.0
    flux = mt.transit_model(time, t0, duration_days, depth)
    bt, bf = bls_service._bin_curve(time, flux, bin_min)
    in_transit = np.abs(bt - t0) < duration_days / 2.0
    if not np.any(in_transit) or np.all(in_transit):
        return None
    measured = 1.0 - np.median(bf[in_transit]) / np.median(bf[~in_transit])
    return float(measured / depth)


def _floor_at_bin(time, flux, bin_min):
    """Bin the raw curve at one width, then run the identical floor pipeline."""
    bt, bf = bls_service._bin_curve(time, flux, bin_min)
    f = bls_service._detrend(bt, bf)          # 30-day production window
    med = float(np.median(f))
    if med != 0:
        f = f / med
    return bt, mt.sensitivity_depth_floor(bt, f)


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

    ap = argparse.ArgumentParser(description="Measure whether binning lowers the depth floor.")
    ap.add_argument("--pool", nargs="+", default=[str(ROOT / "backend" / "data" / "frontier_seeds_tess.json")])
    ap.add_argument("--top", type=int, default=11)
    ap.add_argument("--tic", type=int, nargs="*")
    ap.add_argument("--bins", type=float, nargs="+", default=_DEFAULT_BINS)
    args = ap.parse_args()

    targets = _targets(args)
    bins = sorted(set(args.bins))
    print("measuring binned floor over bins %s min on %d star(s)..."
          % ("/".join("%g" % b for b in bins), len(targets)))
    rows = []
    for tic, radius in targets:
        try:
            search = lk.search_lightcurve("TIC %d" % tic, mission="TESS", author="SPOC", exptime="short")
            lc = hunt._download_stitched_lc(search, flux_column=None)   # PDCSAP, lever-1 winner
            time = np.asarray(lc.time.value, dtype=float)
            flux = np.asarray(lc.flux.value, dtype=float)
            floors = {}
            npts = {}
            for b in bins:
                bt, floors[b] = _floor_at_bin(time, flux, b)
                npts[b] = bt.size
        except Exception as exc:
            print("  TIC %-12d ERROR %s" % (tic, exc))
            continue
        rows.append({"tic": tic, "radius": radius, "floors": floors, "npts": npts})
        print("  TIC %-12d %s" % (tic, "  ".join("%gm=%s" % (b, floors[b]) for b in bins)))

    result = compare_binning_floors(rows)
    print("-" * 76)
    hdr = ["TIC", "R_star"] + ["%gm Re" % b for b in bins] + ["best", "gain Re"]
    print("  " + " ".join("%9s" % h for h in hdr))
    for s in result["stars"]:
        rad = "%.3f" % s["radius"] if s.get("radius") else "  ?  "
        cells = [str(s["tic"]), rad]
        for b in bins:
            mr = _min_rearth(s.get("radius"), s["floors"].get(b))
            cells.append("%.2f" % mr if mr is not None else " ? ")
        cells.append("%gm" % s["best_bin"] if s["best_bin"] is not None else " ? ")
        cells.append("%+.2f" % s["gain_rearth"] if s["gain_rearth"] is not None else " ? ")
        print("  " + " ".join("%9s" % c for c in cells))
    print("-" * 76)
    mg = result["median_gain_rearth"]
    counts = ", ".join("%gm:%d" % (b, n) for b, n in sorted(result["best_bin_counts"].items()))
    print("compared %d stars; best-bin tally: %s" % (result["n_compared"], counts or "n/a"))
    print("binning beat the unbinned floor on %d of %d; median gain = %s Re"
          % (result["n_improved"], result["n_compared"],
             ("%+.3f" % mg) if mg is not None else "n/a"))
    print("(positive gain = binning reaches a smaller planet than the raw curve)")

    print("-" * 76)
    print("cost guard -- depth retained when binning a synthetic transit (TESS 2-min cadence):")
    for dur_h in (2.0, 6.0, 12.0):
        dur = dur_h / 24.0
        cells = ["%4.0fh dip" % dur_h]
        for b in bins:
            if b == 0.0:
                continue
            ret = depth_retained_after_binning(2.0, b, dur)
            cells.append("%gm=%.0f%%" % (b, 100.0 * ret) if ret is not None else "%gm= ?" % b)
        print("  " + "  ".join(cells))


if __name__ == "__main__":
    main()
