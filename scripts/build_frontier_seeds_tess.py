#!/usr/bin/env python
"""Offline one-time builder for the Phase 10 TESS frontier seed pool (sub-10-1).

The TESS analogue of build_frontier_seeds.py. The TOI catalog lists only stars
that *are* TESS Objects of Interest, so it is an exclusion set but cannot answer
"pick an unrecorded TIC." Unlike Kepler, TIC numbering does not track sky
position, so the "sample near an anchor" trick does not lift the light-curve hit
rate. Instead we go straight to the source of truth for "has a real light curve":

    ask MAST for every SPOC 2-minute target in a given TESS sector.

Every TIC that comes back is guaranteed to have a real SPOC light curve. We then
keep only those that are ABSENT from toi_catalog.csv (tid membership) -> genuinely
unrecorded, and sample N of them.

Network probing happens here, once. The runtime only reads the committed JSON
(backend/data/frontier_seeds_tess.json). Honesty nail #3 (extended to TESS): the
pool is not "hidden TOIs" -- every entry is a star TESS observed at 2-min cadence
but no one filed as an object of interest.

Usage:
    python scripts/build_frontier_seeds_tess.py                 # ~50 seeds -> real path
    python scripts/build_frontier_seeds_tess.py --n 8 --sectors 1 --out /tmp/smoke.json
"""
import argparse
import csv
import json
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOI_CSV = ROOT / "backend" / "data" / "toi_catalog.csv"
DEFAULT_OUT = ROOT / "backend" / "data" / "frontier_seeds_tess.json"


def load_recorded() -> set[int]:
    with TOI_CSV.open(encoding="utf-8") as f:
        out: set[int] = set()
        for r in csv.DictReader(f):
            try:
                out.add(int(float(r["tid"])))
            except (ValueError, KeyError):
                continue
        return out


def spoc_tics_in_sector(sector: int, limit: int) -> list[int]:
    """Every SPOC 2-min target in one TESS sector -> list of TIC ids (has LC).

    A SPOC timeseries product's target_name is the bare TIC number. Rows only
    come back for stars actually observed at 2-min cadence, so membership here is
    a hard guarantee of "a real light curve exists."
    """
    from astroquery.mast import Observations

    obs = Observations.query_criteria(
        obs_collection="TESS",
        provenance_name="SPOC",
        dataproduct_type="timeseries",
        sequence_number=sector,
    )
    tics: list[int] = []
    for row in obs:
        try:
            tics.append(int(str(row["target_name"]).strip()))
        except (ValueError, KeyError):
            continue
        if len(tics) >= limit:
            break
    return tics


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50, help="target seed count")
    ap.add_argument("--sectors", type=int, nargs="+", default=[1, 2, 3],
                    help="TESS sectors to draw SPOC targets from")
    ap.add_argument("--per-sector", type=int, default=8000,
                    help="cap on TICs pulled per sector query")
    ap.add_argument("--seed", type=int, default=10, help="RNG seed for reproducibility")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    recorded = load_recorded()
    print(f"loaded {len(recorded)} TOI tids as exclusion set", flush=True)

    candidates: set[int] = set()
    t0 = time.time()
    for sector in args.sectors:
        try:
            tics = spoc_tics_in_sector(sector, args.per_sector)
        except Exception as exc:  # transient MAST error -> skip this sector
            print(f"  sector {sector} query failed ({exc}); skipping", flush=True)
            continue
        fresh = {t for t in tics if t not in recorded}
        candidates |= fresh
        print(f"  sector {sector}: {len(tics)} SPOC targets, "
              f"+{len(fresh)} unrecorded (pool now {len(candidates)})", flush=True)

    pool = sorted(candidates)
    if len(pool) > args.n:
        pool = sorted(rng.sample(pool, args.n))
    seeds = pool

    payload = {
        "schema": "pale-blue-code/frontier-seeds-tess@1",
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "criteria": "tid absent from toi_catalog AND SPOC 2-min light curve exists",
        "sectors": args.sectors,
        "count": len(seeds),
        "tics": seeds,
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"\nwrote {len(seeds)} seeds to {args.out} ({time.time() - t0:.0f}s)", flush=True)
    if len(seeds) < args.n:
        print("WARNING: fewer than requested -- add more --sectors", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
