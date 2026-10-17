"""Assemble the honest Earth-size-sensitivity dossier (decision D).

Path A's sensitivity levers are all measured (flux, detrend, multi-sector, binning — vision
§9-1/§9-2): pipeline tuning cannot lower these floors further. Decision D reframes the goal
accordingly — not "we discovered a planet" (beyond our reach without a telescope, §9), but
"here are the quiet dwarfs where our search actually reaches Earth size, with the measured
sensitivity and the search's honest disposition, in a state a follow-up program could pick up."

This joins three existing reads into one deliverable, and it *only reads caches* — it never
fetches or re-runs a search:
  * rank_by_sensitivity  -> each star's measured depth floor and the smallest planet it could reveal
  * inspect_target_sectors -> the sectors and baseline behind that floor
  * tally_hunt's disposition read -> what the monotransit search actually found (or did not)

Every target here has Earth-size *sensitivity*; today every disposition is "no_event", so the
dossier is an honest completeness statement — a real null at Earth size — not a candidate list.
The moment a search yields a surviving candidate, this is the file that carries it, unexaggerated,
to the ExoFOP-TESS / TFOP follow-up bridge (§6).

Run from the backend/ dir, e.g.:
    python ../scripts/earth_size_dossier.py --pool data/pool_s0103.json data/frontier_seeds_tess.json
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from services import pool_assessment as pa   # noqa: E402

from rank_by_sensitivity import rank_by_sensitivity, _collect_rows, _EARTH_MAX_REARTH   # noqa: E402
from inspect_target_sectors import _coverage_row   # noqa: E402
from tally_hunt import _disposition_from_cache   # noqa: E402

# What each search disposition honestly means for a follow-up reader. Kept here (not prose in
# main) so the dossier's claims are pinned and testable — never softer than the search found.
_DISPOSITION_MEANING = {
    "no_event": "searched; no single-transit event — a real null at Earth-size sensitivity",
    "insignificant": "an event below the detection-significance floor (not a detection)",
    "rejected": "an event the five shape gates flagged as an instrument artifact",
    "held": "a lone event whose significance is held — too little baseline to judge",
    "candidate": "a candidate that survived every gate — ready for follow-up",
    None: "not searched yet",
}

_FOLLOW_UP = ("ExoFOP-TESS / TFOP: ground-based photometry + spectroscopy to confirm or reject. "
              "We cannot confirm from a light curve alone (vision §6).")


def assemble_dossier(rows, earth_max=_EARTH_MAX_REARTH):
    """rows: iterable of ``{tic, radius, floor, min_rearth, sectors, baseline_days, disposition}``.

    Keep only targets whose curve reaches Earth size (``min_rearth <= earth_max``), sort sharpest
    first, and attach the honest meaning of each search disposition. Return
    ``{n_targets, n_candidates, earth_max, follow_up, targets}``. A star missing ``min_rearth`` is
    dropped (unknown sensitivity is not an Earth-size claim). ``n_candidates`` counts targets whose
    disposition is a surviving candidate — today zero, and the dossier says so plainly.
    """
    kept = [r for r in rows if r.get("min_rearth") is not None and r["min_rearth"] <= earth_max]
    kept.sort(key=lambda r: r["min_rearth"])
    targets = []
    for r in kept:
        disp = r.get("disposition")
        targets.append({
            "tic": r["tic"],
            "radius": r.get("radius"),
            "floor": r.get("floor"),
            "min_rearth": r["min_rearth"],
            "sectors": r.get("sectors"),
            "baseline_days": r.get("baseline_days"),
            "disposition": disp,
            "meaning": _DISPOSITION_MEANING.get(disp, _DISPOSITION_MEANING[None]),
        })
    return {
        "n_targets": len(targets),
        "n_candidates": sum(1 for t in targets if t["disposition"] == "candidate"),
        "earth_max": earth_max,
        "follow_up": _FOLLOW_UP,
        "targets": targets,
    }


def _rows_from_pools(pool_paths):
    """Build dossier rows from the caches: measured floor + sensitivity, sector coverage, disposition."""
    collected, _ = _collect_rows(pool_paths)
    ranked = {r["tic"]: r for r in rank_by_sensitivity(collected)}
    rows = []
    for tic, r in ranked.items():
        cov = _coverage_row(tic)
        disp = _disposition_from_cache("tic-%s" % tic)
        rows.append({
            "tic": tic,
            "radius": r.get("radius"),
            "floor": r.get("floor"),
            "min_rearth": r.get("min_rearth"),
            "sectors": cov.get("sector_count"),
            "baseline_days": cov.get("baseline_days"),
            "disposition": disp[0] if disp else None,
        })
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Assemble the honest Earth-size-sensitivity dossier (D).")
    ap.add_argument("--pool", nargs="+",
                    default=[str(ROOT / "backend" / "data" / "frontier_seeds_tess.json")])
    ap.add_argument("--earth-max", type=float, default=_EARTH_MAX_REARTH)
    ap.add_argument("--json", type=str, help="also write the dossier to this JSON path")
    args = ap.parse_args()

    rows = _rows_from_pools(args.pool)
    dossier = assemble_dossier(rows, earth_max=args.earth_max)

    print("Earth-size-sensitivity dossier (decision D) -- caches only, no fetch")
    print("pools: %s" % ", ".join(Path(p).name for p in args.pool))
    print("targets reaching Earth size (<= %.2f R_earth): %d   surviving candidates: %d"
          % (dossier["earth_max"], dossier["n_targets"], dossier["n_candidates"]))
    print("-" * 78)
    print("  %-13s %7s %9s %8s %9s  %s" % ("TIC", "R_star", "min R_e", "sectors", "base(d)", "disposition"))
    for t in dossier["targets"]:
        rad = "%.3f" % t["radius"] if t["radius"] else "  ?  "
        mre = "%.2f" % t["min_rearth"]
        sec = str(t["sectors"]) if t["sectors"] is not None else "?"
        base = "%.0f" % t["baseline_days"] if t["baseline_days"] is not None else "?"
        print("  %-13s %7s %9s %8s %9s  %s" % (t["tic"], rad, mre, sec, base, t["disposition"] or "unsearched"))
    print("-" * 78)
    if dossier["n_candidates"] == 0:
        n_rejected = sum(1 for t in dossier["targets"] if t["disposition"] == "rejected")
        print("No surviving candidate today. This is a completeness statement, not a discovery:")
        print("our search reached Earth size on these quiet dwarfs and no single-transit event survived")
        print("(%d of them had a significant event, each rejected by a named gate)." % n_rejected)
    print("follow-up path: %s" % dossier["follow_up"])

    if args.json:
        Path(args.json).write_text(json.dumps(dossier, indent=2), encoding="utf-8")
        print("wrote %s" % args.json)


if __name__ == "__main__":
    main()
