"""Measure whether SAP flux lowers the monotransit depth floor vs PDCSAP (path A, lever 1).

Path A raises sensitivity by finding what actually lowers each star's measured depth floor
(`docs/vision/finding-our-own-planet.md` §9). The first lever is the flux column. Our fetch has
always kept SPOC's PDCSAP, whose CBV detrending is tuned for short repeating transits and can
over-subtract the long, lone dip of a monotransit — the exact signal we hunt. SAP (raw aperture
flux) keeps that long signal but carries more instrumental trend, which our own Savitzky-Golay
detrend then removes. Which wins is an empirical question, so we measure it head to head.

For each target star this downloads both flux columns from the same FITS, runs each through the
*identical* pipeline (stitch/normalize/outlier-clip -> bls._detrend -> baseline-1 ->
sensitivity_depth_floor), and converts each floor to the smallest planet that curve could reveal
(sqrt(floor)*R_star, in R_earth). A star is "SAP-better" when SAP's curve reaches a smaller planet.

Targets default to the sharpest stars by achieved sensitivity (rank_by_sensitivity) — path A's
first targets — or an explicit --tic list. Downloads are slow; run in the background.

Run from the backend/ dir (for the caches), e.g.:
    python ../scripts/measure_flux_choice.py --pool data/pool_s0103.json data/frontier_seeds_tess.json --top 11
"""

import argparse
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

_EARTH_MAX_REARTH = 1.25


def _min_rearth(radius, floor):
    """Smallest planet (R_earth) a curve with this depth floor could reveal, or None."""
    if radius and radius > 0 and floor and floor > 0:
        return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))
    return None


def compare_flux_floors(rows):
    """rows: iterable of ``{tic, radius, pdcsap_floor, sap_floor}``.

    Return ``{stars, n_compared, n_sap_better, median_delta_rearth}``. Per star, the min planet
    radius under each flux and ``delta_rearth = pdcsap_rearth - sap_rearth`` (POSITIVE = SAP reaches
    a smaller planet, i.e. a lower floor is better). A star missing either floor or a radius is kept
    in ``stars`` with ``delta_rearth=None`` and excluded from the summary — an honest "no comparison"
    rather than a fabricated tie.
    """
    per = []
    deltas = []
    for r in rows:
        pr = _min_rearth(r.get("radius"), r.get("pdcsap_floor"))
        sr = _min_rearth(r.get("radius"), r.get("sap_floor"))
        delta = (pr - sr) if (pr is not None and sr is not None) else None
        if delta is not None:
            deltas.append(delta)
        per.append({**r, "pdcsap_rearth": pr, "sap_rearth": sr, "delta_rearth": delta})
    return {
        "stars": per,
        "n_compared": len(deltas),
        "n_sap_better": sum(1 for d in deltas if d > 0),
        "median_delta_rearth": statistics.median(deltas) if deltas else None,
    }


def _floor_for_flux(search, flux_column):
    """Run one flux column through the full pipeline and return its measured depth floor."""
    lc = hunt._download_stitched_lc(search, flux_column=flux_column)
    time = np.asarray(lc.time.value, dtype=float)
    flux = np.asarray(lc.flux.value, dtype=float)
    flux = bls_service._detrend(time, flux)
    med = float(np.median(flux))
    if med != 0:
        flux = flux / med
    return mt.sensitivity_depth_floor(time, flux)


def _targets(args):
    """The stars to measure: an explicit --tic list, else the sharpest --top by achieved floor."""
    if args.tic:
        # radius from the pools if present, so the R_earth conversion still works
        _, _ = _collect_rows(args.pool)
        import json
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

    ap = argparse.ArgumentParser(description="Measure SAP vs PDCSAP depth floor on the sharpest stars.")
    ap.add_argument("--pool", nargs="+", default=[str(ROOT / "backend" / "data" / "frontier_seeds_tess.json")])
    ap.add_argument("--top", type=int, default=11, help="how many sharpest stars to measure")
    ap.add_argument("--tic", type=int, nargs="*", help="explicit TICs instead of the leaderboard")
    args = ap.parse_args()

    targets = _targets(args)
    print("measuring SAP vs PDCSAP floor on %d star(s)..." % len(targets))
    rows = []
    for tic, radius in targets:
        try:
            search = lk.search_lightcurve("TIC %d" % tic, mission="TESS", author="SPOC", exptime="short")
            pdcsap = _floor_for_flux(search, None)
            sap = _floor_for_flux(search, "sap_flux")
        except Exception as exc:   # a network/parse failure is not a verdict — say so, skip
            print("  TIC %-12d ERROR %s" % (tic, exc))
            continue
        rows.append({"tic": tic, "radius": radius, "pdcsap_floor": pdcsap, "sap_floor": sap})
        print("  TIC %-12d pdcsap=%s sap=%s" % (tic, pdcsap, sap))

    result = compare_flux_floors(rows)
    print("-" * 72)
    print("  %-12s %8s %11s %11s %11s %11s"
          % ("TIC", "R_star", "pdcsap Re", "sap Re", "d Re", "flux"))
    for s in result["stars"]:
        pr = "%.2f" % s["pdcsap_rearth"] if s["pdcsap_rearth"] is not None else "  ?  "
        sr = "%.2f" % s["sap_rearth"] if s["sap_rearth"] is not None else "  ?  "
        d = s["delta_rearth"]
        dstr = ("%+.2f" % d) if d is not None else "  ?  "
        winner = "SAP" if (d is not None and d > 0) else ("PDCSAP" if (d is not None and d < 0) else "-")
        rad = "%.3f" % s["radius"] if s.get("radius") else "  ?  "
        print("  %-12s %8s %11s %11s %11s %11s" % (s["tic"], rad, pr, sr, dstr, winner))
    print("-" * 72)
    md = result["median_delta_rearth"]
    print("compared %d stars: SAP lowered the floor on %d, PDCSAP on %d; median d = %s Re"
          % (result["n_compared"], result["n_sap_better"],
             result["n_compared"] - result["n_sap_better"],
             ("%+.3f" % md) if md is not None else "n/a"))
    print("(positive d = SAP reaches a smaller planet; the winner is what path A should fetch)")


if __name__ == "__main__":
    main()
