"""Rank searched pool stars by the ACHIEVED sensitivity on their real curves.

completeness_hunt.py reports the pool's sensitivity in aggregate (best / median / worst, and how
many curves were clean enough for each planet size). This is its per-star companion, and the first
tool of path A (raise sensitivity toward Earth-size, `docs/vision/finding-our-own-planet.md` §9):
before we can *deepen* the quietest stars we must first *name* them from measurement, not from
stellar radius alone.

For every searched star it reads the MEASURED ``depth_floor`` from the mono cache (the same valid,
versioned read completeness_hunt uses), joins the star's radius, and converts the pair into the
smallest planet that curve could have revealed — ``R_planet = sqrt(depth_floor) * R_star``. Sorting
that ascending puts the sharpest curves — the real targets for a deeper look — at the top, and shows
exactly which stars already reach Earth size and which do not.

It never fetches and never recomputes a search — it only reads existing results, exactly like
tally_hunt.py and completeness_hunt.py. Accepts one or more pools (the mono cache is keyed by TIC,
so a star shared across sector pools is ranked once).

Run from anywhere:
    python scripts/rank_by_sensitivity.py --pool backend/data/pool_s0103.json --top 20
    python scripts/rank_by_sensitivity.py --pool backend/data/pool_s0103.json ... --earth-only
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from services import pool_assessment as pa   # noqa: E402
from completeness_hunt import _measured_floor, POOL   # noqa: E402

# Upper edge of the "Earth-size" bin, matching completeness_hunt's Earth label.
_EARTH_MAX_REARTH = 1.25


def rank_by_sensitivity(rows):
    """rows: iterable of ``(tic, radius_rsun, depth_floor)``.

    Return a list of ``{tic, radius, floor, min_rearth}`` sorted by ``min_rearth`` ascending —
    the smallest planet each curve could have revealed, best (sharpest) first. A star with no
    radius or a non-physical floor gets ``min_rearth=None`` and sorts last (unknown, not best).
    """
    ranked = []
    for tic, radius, floor in rows:
        min_rearth = None
        if radius and radius > 0 and floor and floor > 0:
            min_rearth = pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))
        ranked.append({"tic": tic, "radius": radius, "floor": floor, "min_rearth": min_rearth})
    ranked.sort(key=lambda r: (r["min_rearth"] is None,
                               r["min_rearth"] if r["min_rearth"] is not None else 0.0))
    return ranked


def _collect_rows(pool_paths):
    """Union the searched stars across the given pools (deduped by TIC), with their measured floor."""
    radius_by_tic = {}
    for path in pool_paths:
        pool = json.loads(Path(path).read_text(encoding="utf-8"))
        for s in pool["stars"]:
            tic = int(s["tic"])
            radius_by_tic.setdefault(tic, s.get("radius"))
    rows = []
    for tic, radius in radius_by_tic.items():
        floor = _measured_floor("tic-%s" % tic)
        if floor is not None:
            rows.append((tic, radius, floor))
    return rows, len(radius_by_tic)


def main() -> None:
    ap = argparse.ArgumentParser(description="Rank searched stars by achieved (measured) sensitivity.")
    ap.add_argument("--pool", nargs="+", default=[str(POOL)],
                    help="one or more pool JSONs to rank (default: the tracked frontier)")
    ap.add_argument("--top", type=int, default=20, help="how many of the sharpest stars to list")
    ap.add_argument("--earth-only", action="store_true",
                    help="list only stars whose curve reaches Earth size (<= 1.25 R_earth)")
    args = ap.parse_args()

    rows, n_pool = _collect_rows(args.pool)
    ranked = rank_by_sensitivity(rows)
    measured = [r for r in ranked if r["min_rearth"] is not None]
    earth = [r for r in measured if r["min_rearth"] <= _EARTH_MAX_REARTH]

    print("pools: %s  (%d stars, %d searched with a measured floor)"
          % (", ".join(Path(p).name for p in args.pool), n_pool, len(measured)))
    print("-" * 64)
    if not measured:
        print("no searched stars with a measured floor yet.")
        return
    print("smallest planet each curve could have shown (sharpest first):")
    print("  %-14s %8s %10s %10s" % ("TIC", "R_star", "floor", "min R_earth"))

    shown = earth if args.earth_only else ranked
    limit = len(shown) if args.earth_only else args.top
    for r in shown[:limit]:
        rad = "%.3f" % r["radius"] if r["radius"] else "   ?  "
        floor = "%.4f" % r["floor"] if r["floor"] else "   ?  "
        mre = "%.2f" % r["min_rearth"] if r["min_rearth"] is not None else "  ?  "
        mark = "  <- Earth-size" if (r["min_rearth"] is not None
                                     and r["min_rearth"] <= _EARTH_MAX_REARTH) else ""
        print("  %-14s %8s %10s %10s%s" % (r["tic"], rad, floor, mre, mark))
    print("-" * 64)
    print("%d of %d searched curves reach Earth size (<= %.2f R_earth) -- path A's first targets."
          % (len(earth), len(measured), _EARTH_MAX_REARTH))


if __name__ == "__main__":
    main()
