#!/usr/bin/env python
"""Offline one-time builder for the Phase 9-B frontier seed pool (sub-9B-1).

The KOI catalog only lists stars that *are* Kepler Objects of Interest, so it
works as an exclusion set but cannot answer "pick an unrecorded KIC." This script
samples KIC candidates near KOI anchors (neighbours share a sky region, so they
are far likelier to be real Kepler targets than a blind random KIC) and keeps
only those that:

    1. are ABSENT from koi_catalog.csv (kepid membership) -> genuinely unrecorded
    2. have a real Kepler long-cadence light curve (lightkurve probe)

Network probing happens here, once. The runtime only reads the committed JSON
(backend/data/frontier_seeds.json). Honesty nail #3: the pool is not "hidden
KOIs" -- every entry is a star Kepler observed but no one filed as a candidate.

Usage:
    python scripts/build_frontier_seeds.py            # ~60 seeds -> real path
    python scripts/build_frontier_seeds.py --n 2 --max-attempts 10 --out /tmp/smoke.json
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
KOI_CSV = ROOT / "backend" / "data" / "koi_catalog.csv"
DEFAULT_OUT = ROOT / "backend" / "data" / "frontier_seeds.json"

# Small offsets from a KOI anchor. Neighbours in KIC numbering tend to fall in the
# same Kepler field, lifting the "has data" hit rate far above blind random.
OFFSETS = [-50, -37, -23, -13, -7, -3, -1, 1, 3, 7, 13, 23, 37, 50]


def load_recorded() -> set[int]:
    with KOI_CSV.open(encoding="utf-8") as f:
        return {int(r["kepid"]) for r in csv.DictReader(f)}


def has_kepler_lc(kic: int) -> bool:
    import lightkurve as lk

    search = lk.search_lightcurve(
        f"KIC {kic}", mission="Kepler", author="Kepler", exptime="long"
    )
    return len(search) > 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=60, help="target seed count")
    ap.add_argument("--max-attempts", type=int, default=600)
    ap.add_argument("--seed", type=int, default=9, help="RNG seed for reproducibility")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    recorded = load_recorded()
    anchors = sorted(recorded)
    print(f"loaded {len(recorded)} KOI kepids as exclusion + anchors", flush=True)

    seeds: list[int] = []
    tried: set[int] = set()
    attempts = 0
    t0 = time.time()
    while len(seeds) < args.n and attempts < args.max_attempts:
        kic = rng.choice(anchors) + rng.choice(OFFSETS)
        if kic <= 0 or kic in recorded or kic in tried:
            continue
        tried.add(kic)
        attempts += 1
        try:
            ok = has_kepler_lc(kic)
        except Exception:  # unresolved name / transient MAST error -> treat as miss
            ok = False
        print(
            f"[{len(seeds):3d}/{args.n}] attempt {attempts:3d}: KIC {kic} "
            f"{'HIT' if ok else 'miss'}",
            flush=True,
        )
        if ok:
            seeds.append(kic)

    seeds.sort()
    payload = {
        "schema": "pale-blue-code/frontier-seeds@1",
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "criteria": "kepid absent from koi_catalog AND Kepler long-cadence LC exists",
        "count": len(seeds),
        "kics": seeds,
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"\nwrote {len(seeds)} seeds to {args.out} "
        f"({attempts} attempts, {time.time() - t0:.0f}s)",
        flush=True,
    )
    if len(seeds) < args.n:
        print("WARNING: fewer than requested -- raise --max-attempts", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
