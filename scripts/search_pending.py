"""Search the pool's fetched-but-unsearched dwarfs — the missing middle of the hunt loop.

The real single-transit hunt over the frontier pool is three local steps:

    fetch_plausible.py   pull a pending star's light curve from MAST     (the network step)
    search_pending.py    run the monotransit search on the fetched ones  (this script)
    tally_hunt.py        recompute the count from the caches             (the honest counter)

fetch and count already had scripts; the search in between was run by hand each batch. This
script closes that gap. It reads the pool, finds every star whose raw light curve is cached but
whose monotransit result is *not* (or is stale), and runs ``run_monotransit_cached`` on them,
bounded by ``--limit`` so a run does a handful. It never fetches — a star with no curve on disk
is left for fetch_plausible.py — and it never re-searches a star that already has a valid result.

The selection (``pending_to_search``) is a pure read over the caches, reusing the same fetch and
disposition signals ``tally_hunt`` uses, so the two scripts can never disagree about what "searched"
means.

Run from anywhere:
    python scripts/search_pending.py              # search up to 8 fetched-not-searched stars
    python scripts/search_pending.py --limit 4    # fewer this run
    python scripts/search_pending.py --plan       # list what would be searched, run nothing
"""

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from services import monotransit as mt  # noqa: E402

import tally_hunt  # noqa: E402  (reuse _is_fetched / _disposition_from_cache — one source of truth)

POOL = ROOT / "backend" / "data" / "frontier_seeds_tess.json"


def pending_to_search(stars: list[dict]) -> list[str]:
    """Names of pool stars whose curve is fetched but not yet validly searched — pure, no compute.

    A star qualifies iff its raw light curve is on disk (``_is_fetched``) and it has no valid
    cached monotransit result (``_disposition_from_cache`` is None, which also covers a stale
    memo). Already-searched stars and not-fetched stars are both skipped.
    """
    out = []
    for s in stars:
        name = "tic-%s" % s["tic"]
        if tally_hunt._is_fetched(name) and tally_hunt._disposition_from_cache(name) is None:
            out.append(name)
    return out


def _verdict_line(name: str, res: dict) -> str:
    cands = res.get("candidates", [])
    if not cands:
        return "%s -> quiet (no single transit)" % name
    top = min(cands, key=lambda c: mt._DISPOSITION_ORDER.index(mt._event_disposition(c)))
    disp = mt._event_disposition(top)
    sig = top.get("significance")
    failed = [ch["name"] for ch in top.get("checks", []) if not ch["passed"]]
    tail = ("  failed: %s" % ", ".join(failed)) if failed else ""
    return "%s -> %s  sig %s%s" % (name, disp, round(sig, 2) if sig else sig, tail)


def main() -> None:
    ap = argparse.ArgumentParser(description="Search the pool's fetched-but-unsearched dwarfs.")
    ap.add_argument("--limit", type=int, default=8, help="max stars to search this run")
    ap.add_argument("--plan", action="store_true", help="list what would be searched, run nothing")
    args = ap.parse_args()

    stars = json.loads(POOL.read_text(encoding="utf-8"))["stars"]
    pending = pending_to_search(stars)
    print("fetched, not searched: %d  (searching up to %d)" % (len(pending), args.limit), flush=True)
    for name in pending:
        print("  PENDING %s" % name, flush=True)

    if args.plan:
        return

    batch = pending[: args.limit]
    print("-" * 60, flush=True)
    for i, name in enumerate(batch, 1):
        t0 = time.time()
        try:
            res = mt.run_monotransit_cached(name)
            print("[%d/%d] %s  (%.0fs)" % (i, len(batch), _verdict_line(name, res), time.time() - t0),
                  flush=True)
        except Exception as e:  # a single bad curve must not abort the batch
            print("[%d/%d] %s -> ERROR %r  (%.0fs)" % (i, len(batch), name, e, time.time() - t0),
                  flush=True)
    print("-" * 60, flush=True)
    print("searched %d this run; run tally_hunt.py for the cumulative count." % len(batch), flush=True)


if __name__ == "__main__":
    main()
