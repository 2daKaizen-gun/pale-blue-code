#!/usr/bin/env python
"""Offline one-time builder for the Phase 9-B frontier seed pool (sub-9B-1).

The KOI catalog only lists stars that *are* Kepler Objects of Interest, so it
works as an exclusion set but cannot answer "pick an unrecorded KIC." This script
samples KIC candidates near KOI anchors (neighbours share a sky region, so they
are far likelier to be real Kepler targets than a blind random KIC) and keeps
only those that:

    1. are ABSENT from koi_catalog.csv (kepid membership) -> genuinely unrecorded
    2. have a real Kepler light curve (MAST timeseries probe)

Network probing happens here, once. The runtime only reads the committed JSON
(backend/data/frontier_seeds.json). Honesty nail #3: the pool is not "hidden
KOIs" -- every entry is a star Kepler observed but no one filed as a candidate.

Probing is BATCHED: instead of resolving each "KIC n" name individually (a
non-existent KIC triggers a slow sky-position resolver timeout), we ask MAST once
per batch which `kplr` target_names have timeseries products. Non-existent KICs
simply do not come back -- no per-target timeout, ~1s per 100 candidates.

Usage:
    python scripts/build_frontier_seeds.py            # ~50 seeds -> real path
    python scripts/build_frontier_seeds.py --n 4 --max-candidates 20 --out /tmp/smoke.json
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


def probe_has_lc(kics: list[int]) -> set[int]:
    """One batched MAST call -> subset of `kics` that have a Kepler light curve.

    Kepler MAST target_name is 'kplr' + zero-padded 9-digit KIC. Querying a list
    of names returns rows only for targets that actually have timeseries data, so
    absent/unobserved KICs cost nothing (no name-resolution timeout).
    """
    from astroquery.mast import Observations

    names = {f"kplr{k:09d}": k for k in kics}
    obs = Observations.query_criteria(
        obs_collection="Kepler",
        target_name=list(names),
        dataproduct_type="timeseries",
    )
    hits: set[int] = set()
    for row in obs:
        tn = str(row["target_name"])
        if tn in names:
            hits.add(names[tn])
    return hits


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50, help="target seed count")
    ap.add_argument("--max-candidates", type=int, default=1000,
                    help="cap on unique KICs probed before giving up")
    ap.add_argument("--batch-size", type=int, default=100,
                    help="candidates per MAST query")
    ap.add_argument("--seed", type=int, default=9, help="RNG seed for reproducibility")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    recorded = load_recorded()
    anchors = sorted(recorded)
    print(f"loaded {len(recorded)} KOI kepids as exclusion + anchors", flush=True)

    seeds: list[int] = []
    tried: set[int] = set()
    probed = 0
    t0 = time.time()
    while len(seeds) < args.n and probed < args.max_candidates:
        # Assemble a fresh batch of unique, unrecorded candidate KICs.
        batch: list[int] = []
        guard = 0
        while len(batch) < args.batch_size and probed + len(batch) < args.max_candidates:
            guard += 1
            if guard > args.batch_size * 50:
                break  # anchor+offset space near-exhausted
            kic = rng.choice(anchors) + rng.choice(OFFSETS)
            if kic <= 0 or kic in recorded or kic in tried:
                continue
            tried.add(kic)
            batch.append(kic)
        if not batch:
            break
        probed += len(batch)
        try:
            hits = probe_has_lc(batch)
        except Exception as exc:  # transient MAST error -> skip this batch
            print(f"  batch query failed ({exc}); skipping", flush=True)
            hits = set()
        for kic in sorted(batch):
            if kic in hits:
                seeds.append(kic)
        print(
            f"[{len(seeds):3d}/{args.n}] probed {probed:4d} "
            f"(+{len(hits)} hits this batch of {len(batch)})",
            flush=True,
        )

    seeds = sorted(set(seeds))[: args.n]
    payload = {
        "schema": "pale-blue-code/frontier-seeds@1",
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "criteria": "kepid absent from koi_catalog AND Kepler light curve exists",
        "count": len(seeds),
        "kics": seeds,
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"\nwrote {len(seeds)} seeds to {args.out} "
        f"({probed} probed, {time.time() - t0:.0f}s)",
        flush=True,
    )
    if len(seeds) < args.n:
        print("WARNING: fewer than requested -- raise --max-candidates", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
