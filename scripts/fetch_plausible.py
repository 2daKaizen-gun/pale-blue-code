"""Fetch the plausible dwarfs' light curves — the real, local, network step (sub-11-7 Light 2).

The fetch plan (`services.fetch_plan.fetch_plan`) names which frontier-pool stars are worth a
fetch: the plausible dwarfs where a detectable single transit could be a planet, best target
first. This script wires that plan to the *real* MAST download (`hunt.fetch_lc_by_tic`) and runs
it, bounded by a limit so a run pulls a handful. It is deliberately a local script, not an API
endpoint — a MAST download is slow and fallible, and must never masquerade as an instant request.

Once a plausible dwarf's curve is on disk, `GET /api/monotransit/hunt` will finally search it.

Run from backend/:
    python ../scripts/fetch_plausible.py            # fetch up to 4 pending targets
    python ../scripts/fetch_plausible.py --limit 8  # more of the budget in one go
    python ../scripts/fetch_plausible.py --plan     # show the plan only, fetch nothing
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import fetch_plan as fp  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description="Fetch the plausible dwarfs' light curves.")
    ap.add_argument("--limit", type=int, default=4, help="max curves to fetch this run")
    ap.add_argument("--plan", action="store_true", help="print the plan and fetch nothing")
    ap.add_argument("--pool", default=None,
                    help="pool JSON to hunt (default: the tracked frontier). Lets an older "
                         "sector be hunted from its own file without disturbing the frontier.")
    args = ap.parse_args()

    # A chosen pool feeds its stars into the (already stars-parameterized) plan; the default
    # None lets fetch_plan load the tracked frontier itself, so existing runs are unchanged.
    stars = json.loads(Path(args.pool).read_text(encoding="utf-8"))["stars"] if args.pool else None
    plan = fp.fetch_plan(stars=stars)
    s = plan["summary"]
    print(f"plausible targets: {s['plausible']}  cached: {s['cached']}  pending: {s['pending']}")
    print(f"best target: {s['best_target']}  (>= {s['best_min_planet_rjup']:.2f} R_jup)")
    print("-" * 60)
    for t in plan["targets"]:
        mark = "cached " if t["cached"] else "PENDING"
        print(f"  [{mark}] {t['star_name']:<16} >= {t['min_planet_rjup']:.2f} R_jup")

    if args.plan:
        return

    print("-" * 60)
    print(f"fetching up to {args.limit} pending target(s) from MAST (slow)...")
    result = fp.fetch_targets(plan, limit=args.limit)
    for o in result["outcomes"]:
        if o["outcome"] in ("fetched", "failed"):
            detail = f" -- {o['detail']}" if o["detail"] else ""
            print(f"  {o['outcome']:<14} {o['star_name']}{detail}")
    rs = result["summary"]
    print("-" * 60)
    print(f"fetched: {rs['fetched']}  failed: {rs['failed']}  "
          f"already_cached: {rs['already_cached']}  deferred: {rs['deferred']}")


if __name__ == "__main__":
    main()
