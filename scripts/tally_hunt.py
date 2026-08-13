"""Recompute the dwarf-pool hunt tally from the on-disk caches — the honest counter.

The instrument log's cumulative tally (N of 50 searched: quiet / insignificant / rejected /
candidates) is hand-maintained, and a hand count is exactly what went wrong once already: a
sub-threshold edge blip got written up as a near-miss because nobody re-derived its disposition
(see docs/checks/phase-11/sub-11-15.md). This script removes the hand from the count.

It reads the frontier pool, and for each star reports what the *caches on disk* actually say:

    searched      a mono search result is cached  -> its top-event disposition
    fetched       the light curve is cached but not yet searched
    not_fetched   no light curve on disk (never faked, never counted as searched)

It never fetches and never recomputes: it only reads existing ``mono_*.json`` results, so a
disagreement between this output and the instrument log means the *log* is stale, not the sky.

Run from anywhere:
    python scripts/tally_hunt.py
    python scripts/tally_hunt.py --rejected   # also list every rejected event's sig + failed gates
"""

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services import bls as bls_service  # noqa: E402
from services import monotransit as mt  # noqa: E402

POOL = ROOT / "backend" / "data" / "frontier_seeds_tess.json"


def _is_fetched(planet_name: str) -> bool:
    """True once the raw MAST light curve is on disk (lc_<slug>_<mission>.json).

    This is the fetch artifact ``fetch_lc_by_tic`` writes — the same file the search
    reads first — so it is the honest 'a curve exists to search' signal. The derived
    ``bls_lc_*`` / ``mono_*`` caches only appear once a search has actually run.
    """
    return bls_service._find_lc_cache(planet_name) is not None


def _disposition_from_cache(planet_name: str):
    """Read a cached search result and return (disposition, top_event) — or None if not searched.

    Pure read: honours the same version + lc-mtime validity the memo uses, so a stale cache
    (older pipeline, or a curve re-fetched since) counts as *not searched* rather than lying.
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
    cands = stored.get("result", {}).get("candidates", [])
    if not cands:
        return ("no_event", None)
    top = min(cands, key=lambda c: mt._DISPOSITION_ORDER.index(mt._event_disposition(c)))
    return (mt._event_disposition(top), top)


def main() -> None:
    ap = argparse.ArgumentParser(description="Recompute the dwarf-pool hunt tally from the caches.")
    ap.add_argument("--rejected", action="store_true", help="list each rejected event's sig + gates")
    args = ap.parse_args()

    pool = json.loads(POOL.read_text(encoding="utf-8"))
    stars = pool["stars"]

    tally = Counter()
    fetched_pending = 0
    not_fetched = 0
    rejected_rows = []

    for s in stars:
        name = "tic-%s" % s["tic"]
        res = _disposition_from_cache(name)
        if res is None:
            if _is_fetched(name):
                fetched_pending += 1  # raw curve on disk, not searched yet (or stale mono cache)
            else:
                not_fetched += 1
            continue
        disp, top = res
        tally[disp] += 1
        if disp == "rejected" and top is not None:
            failed = [ch["name"] for ch in top.get("checks", []) if not ch["passed"]]
            rejected_rows.append((s["tic"], top.get("significance"), failed))

    searched = sum(tally.values())
    quiet = tally.get("no_event", 0)
    insignificant = tally.get("insignificant", 0)
    held = tally.get("held", 0)
    rejected = tally.get("rejected", 0)
    candidates = tally.get("candidate", 0)

    print("pool: %d stars  (sector %s, %s)" % (len(stars), pool.get("latest_sector"), pool.get("schema")))
    print("-" * 64)
    print("searched     : %d of %d" % (searched, len(stars)))
    print("  quiet        : %d" % quiet)
    print("  insignificant: %d" % insignificant)
    if held:
        print("  held         : %d" % held)
    print("  rejected     : %d" % rejected)
    print("  CANDIDATES   : %d" % candidates)
    print("fetched, not searched: %d" % fetched_pending)
    print("not fetched          : %d" % not_fetched)
    print("-" * 64)
    line = "TALLY (%d of %d searched): %d quiet / %d insignificant / %d rejected / %d candidates" % (
        searched, len(stars), quiet, insignificant, rejected, candidates)
    print(line)

    if args.rejected and rejected_rows:
        print("-" * 64)
        print("rejected events (loudest first):")
        for tic, sig, failed in sorted(rejected_rows, key=lambda r: -(r[1] or 0)):
            print("  TIC %-11s sig %-7s failed: %s" % (tic, round(sig, 2) if sig else sig, ", ".join(failed)))


if __name__ == "__main__":
    main()
