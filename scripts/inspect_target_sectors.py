"""Report how many TESS sectors path A's targets already carry (lever 3 reconnaissance).

Levers 1 (flux) and 2 (detrend window) are both null on the Earth-size targets — PDCSAP already wins,
and the window barely moves the floor (sub-11-23/24). Lever 2's null pointed at the one knob that can
lower these floors: more baseline, the same star across several sectors, stitched. Before building
anything for that, measure the precondition — do these targets even *have* multiple sectors?

This reads it from what is already on disk: `fetch_lc_by_tic` records `sector_count` and
`baseline_days` in each star's LC cache, and `_download_stitched_lc` already does
`download_all().stitch()`, so the floor we measured was computed on the *stitched* multi-sector curve.
This tool makes that visible — per target the sectors and baseline behind its floor, and a summary of
how many targets are single- vs multi-sector, so path A can see whether stitching is an unspent lever
or one already pulled.

Reads caches only, never fetches. Targets default to path A's sharpest stars or an explicit --tic list.

Run from the backend/ dir, e.g.:
    python ../scripts/inspect_target_sectors.py --pool data/pool_s0103.json data/frontier_seeds_tess.json --top 11
"""

import argparse
import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from services import hunt   # noqa: E402

from rank_by_sensitivity import rank_by_sensitivity, _collect_rows   # noqa: E402


def summarize_sector_coverage(rows):
    """rows: iterable of ``{tic, sector_count, baseline_days}``.

    Return ``{n, n_multi_sector, n_single_sector, n_unknown, median_sectors, median_baseline_days}``.
    A target is multi-sector when ``sector_count >= 2`` — the condition under which stitching has
    already lengthened its baseline. A target with no cached count (never fetched) is counted as
    unknown, excluded from the medians, rather than guessed at.
    """
    rows = list(rows)
    counts = [r.get("sector_count") for r in rows]
    known = [c for c in counts if c is not None]
    baselines = [r.get("baseline_days") for r in rows if r.get("baseline_days") is not None]
    return {
        "n": len(rows),
        "n_multi_sector": sum(1 for c in known if c >= 2),
        "n_single_sector": sum(1 for c in known if c == 1),
        "n_unknown": len(counts) - len(known),
        "median_sectors": statistics.median(known) if known else None,
        "median_baseline_days": statistics.median(baselines) if baselines else None,
    }


def _targets(args):
    if args.tic:
        return list(args.tic)
    rows, _ = _collect_rows(args.pool)
    return [r["tic"] for r in rank_by_sensitivity(rows)[:args.top]]


def _coverage_row(tic):
    """Read one target's sector_count + baseline_days from its LC cache (None if absent)."""
    path = hunt._tic_lc_cache_path(tic)
    if not path.exists():
        return {"tic": tic, "sector_count": None, "baseline_days": None}
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"tic": tic, "sector_count": None, "baseline_days": None}
    return {"tic": tic, "sector_count": d.get("sector_count"), "baseline_days": d.get("baseline_days")}


def main() -> None:
    ap = argparse.ArgumentParser(description="Report the sector coverage behind path A's target floors.")
    ap.add_argument("--pool", nargs="+", default=[str(ROOT / "backend" / "data" / "frontier_seeds_tess.json")])
    ap.add_argument("--top", type=int, default=11)
    ap.add_argument("--tic", type=int, nargs="*")
    args = ap.parse_args()

    rows = [_coverage_row(t) for t in _targets(args)]
    print("sector coverage behind %d target floor(s):" % len(rows))
    print("  %-14s %8s %14s" % ("TIC", "sectors", "baseline (d)"))
    for r in rows:
        sc = r["sector_count"] if r["sector_count"] is not None else "?"
        bl = "%.0f" % r["baseline_days"] if r["baseline_days"] is not None else "?"
        print("  %-14s %8s %14s" % (r["tic"], sc, bl))
    s = summarize_sector_coverage(rows)
    print("-" * 40)
    print("multi-sector: %d  single-sector: %d  unknown: %d  (of %d)"
          % (s["n_multi_sector"], s["n_single_sector"], s["n_unknown"], s["n"]))
    ms = ("%.0f" % s["median_sectors"]) if s["median_sectors"] is not None else "n/a"
    mb = ("%.0f" % s["median_baseline_days"]) if s["median_baseline_days"] is not None else "n/a"
    print("median sectors: %s   median baseline: %s d" % (ms, mb))
    print("(multi-sector floors are already stitched -- lever 3 is pulled, not unspent)")


if __name__ == "__main__":
    main()
