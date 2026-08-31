"""Report the dwarf-pool hunt's ACHIEVED completeness, from the measured floors on disk.

tally_hunt.py counts dispositions (quiet / insignificant / rejected / candidates). This is its
companion for a null result: a zero-candidate sweep is only worth the sensitivity it actually
achieved, and that sensitivity is not the planning fiducial (a uniform 0.4%) but each star's own
MEASURED depth floor -- the shallowest transit its real, noisy curve could have shown.

For every searched pool star it reads ``result["depth_floor"]`` from the mono cache, joins the
star's radius from the pool seed, and asks pool_assessment.pool_completeness the honest question:
how many stars had curves clean enough to have revealed a planet at or below each physical size?
Finding nothing rules out only the planets the data could actually have seen.

It never fetches and never recomputes a search -- it only reads existing ``mono_*.json`` results
under the current cache version, exactly like tally_hunt.py.

Run from anywhere:
    python scripts/completeness_hunt.py
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services import monotransit as mt          # noqa: E402
from services import pool_assessment as pa       # noqa: E402

POOL = ROOT / "backend" / "data" / "frontier_seeds_tess.json"

# Human labels for the size bins pool_completeness reports (Earth radii -> a name).
_BIN_LABEL = {1.25: "Earth", 2.0: "super-Earth", 4.0: "sub-Neptune",
              6.0: "Neptune", 11.2: "Saturn", 22.4: "2 R_jup (planet/star line)"}


def _measured_floor(planet_name: str):
    """The measured depth_floor stored in a star's valid mono cache, or None if not searched.

    Honours the same version + lc-mtime validity the memo uses, so a stale cache (older pipeline
    or a re-fetched curve) yields nothing rather than a floor from a search that no longer stands.
    """
    src = mt._lc_source_path(planet_name)
    cache = mt._mono_cache_path(planet_name)
    if not (src.exists() and cache.exists()):
        return None
    try:
        stored = json.loads(cache.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if stored.get("version") != mt._MONO_CACHE_VERSION:
        return None
    if stored.get("lc_mtime_ns") != src.stat().st_mtime_ns:
        return None
    return stored.get("result", {}).get("depth_floor")


def main() -> None:
    ap = argparse.ArgumentParser(description="Achieved completeness of the pool from measured floors.")
    ap.add_argument("--pool", default=str(POOL),
                    help="pool JSON to assess (default: the tracked frontier)")
    args = ap.parse_args()

    pool = json.loads(Path(args.pool).read_text(encoding="utf-8"))
    stars = pool["stars"]
    radius_by_tic = {int(s["tic"]): s.get("radius") for s in stars}

    floors = []
    for tic, radius in radius_by_tic.items():
        floor = _measured_floor("tic-%s" % tic)
        if floor is not None:
            floors.append((radius, floor))

    comp = pa.pool_completeness(floors)
    n = comp["searched"]

    print("pool: %d stars  (sector %s, %s)" % (len(stars), pool.get("latest_sector"), pool.get("schema")))
    print("-" * 64)
    print("achieved completeness over %d searched stars" % n)
    print("(from each star's MEASURED depth floor, not the planning fiducial)")
    print("-" * 64)
    if not n:
        print("no searched stars with a measured floor yet.")
        return
    print("smallest planet a curve could have shown:")
    print("  best star   : %.1f R_earth" % comp["best_rearth"])
    print("  median star : %.1f R_earth" % comp["median_rearth"])
    print("  worst star  : %.1f R_earth" % comp["worst_rearth"])
    print("-" * 64)
    print("stars that could have revealed a planet at or below each size:")
    for b in comp["bins"]:
        label = _BIN_LABEL.get(b["max_rearth"], "")
        print("  <= %5.1f R_earth  (%-25s): %3d of %d  (%2d%%)"
              % (b["max_rearth"], label, b["stars"], n, round(100 * b["stars"] / n)))
    print("-" * 64)
    print("A zero-candidate sweep rules out only the planets these curves were clean enough")
    print("to have seen. The null is exactly this strong -- no stronger.")


if __name__ == "__main__":
    main()
