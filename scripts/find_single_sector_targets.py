#!/usr/bin/env python
"""Find genuinely SINGLE-SECTOR unrecorded TESS targets — calibration hunting ground.

Why this exists (sub-10-3, Light 4): the frontier pool built by
build_frontier_seeds_tess.py ranks by brightness, and the brightest unrecorded stars
sit near the ecliptic poles where TESS stares for many sectors in a row. The live E2E
in sub-10-4 landed on such a star: 9 sectors, 2850 d of baseline. That is the *easy*
regime — long baseline, dozens of transits, provisional never fires.

The short-baseline machinery we shipped is therefore untested against the case it was
written for: one ~27-day sector. Both numbers that govern it are still guesses —
`_N_MIN_TRANSITS` (vetting.py) and the Savitzky-Golay window in `bls._detrend`, which
is expressed in *points* derived from Kepler's 29.4-min cadence. This script finds
real targets in that regime so the numbers can be measured instead of assumed
(honesty nail #3: no undefendable number on screen).

A target qualifies when it is:
    1. observed by SPOC at 2-min cadence in the newest sector (a real light curve),
    2. absent from toi_catalog.csv (unrecorded — same honesty gate as the pool),
    3. observed in EXACTLY ONE sector across the whole mission so far, and
    4. bright, so a transit would actually register above the noise.

Condition 3 is what the pool cannot give us, and it needs a mission-wide lookup per
star. That is done with the same batched MAST trick as the Kepler seed builder: one
query per ~100 TICs rather than one per star, so cost stays flat.

Usage:
    python scripts/find_single_sector_targets.py                 # newest sector
    python scripts/find_single_sector_targets.py --sector 90 --n 5
    python scripts/find_single_sector_targets.py --out probe.json
"""
import argparse
import json
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# Reuse the pool builder's MAST/TOI plumbing verbatim — this script only adds the
# mission-wide sector count on top of it.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_frontier_seeds_tess import (  # noqa: E402
    enrich,
    estimate_current_sector,
    find_latest_sector,
    load_recorded,
    select_bright,
    spoc_targets_in_sector,
)


def sectors_per_tic(tics: list[int], batch_size: int = 100) -> dict[int, list[int]]:
    """Mission-wide SPOC sector list for each TIC, via batched MAST queries.

    One query per batch instead of per star: MAST accepts a list of target_names, and
    stars with no further observations simply do not come back with extra rows, so
    there is no per-star timeout to pay (the lesson from build_frontier_seeds.py).
    """
    from astroquery.mast import Observations

    out: dict[int, set[int]] = defaultdict(set)
    for i in range(0, len(tics), batch_size):
        batch = tics[i:i + batch_size]
        obs = Observations.query_criteria(
            obs_collection="TESS",
            provenance_name="SPOC",
            dataproduct_type="timeseries",
            target_name=[str(t) for t in batch],
        )
        for row in obs:
            try:
                tic = int(str(row["target_name"]).strip())
                sector = int(row["sequence_number"])
            except (ValueError, KeyError, TypeError):
                continue
            out[tic].add(sector)
        print(f"  batch {i // batch_size + 1}: {len(batch)} TICs probed", flush=True)
    return {t: sorted(s) for t, s in out.items()}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=10, help="how many targets to report")
    ap.add_argument("--sector", type=int, default=None,
                    help="pin a sector (default: auto-detect newest)")
    ap.add_argument("--candidates", type=int, default=400,
                    help="how many unrecorded TICs to probe for sector count")
    ap.add_argument("--batch-size", type=int, default=100)
    ap.add_argument("--out", type=Path, default=None, help="optional JSON output path")
    args = ap.parse_args()

    t0 = time.time()
    recorded = load_recorded()
    print(f"loaded {len(recorded)} TOI tids as exclusion set", flush=True)

    if args.sector:
        sector, obs_mjd = args.sector, spoc_targets_in_sector(args.sector)
    else:
        sector, obs_mjd = find_latest_sector(estimate_current_sector())
    print(f"sector {sector}: {len(obs_mjd)} SPOC targets", flush=True)

    unrecorded = sorted(t for t in obs_mjd if t not in recorded)
    print(f"  {len(unrecorded)} unrecorded (absent from TOI)", flush=True)

    # Probing every unrecorded star would be needlessly slow; a few hundred is plenty
    # to surface single-sector ones. Take the head of the sorted list so the run is
    # deterministic and re-runnable.
    candidates = unrecorded[:args.candidates]
    print(f"probing mission-wide sector counts for {len(candidates)} TICs...", flush=True)
    counts = sectors_per_tic(candidates, args.batch_size)

    single = sorted(t for t in candidates if len(counts.get(t, [])) == 1)
    multi = len(candidates) - len(single)
    print(f"  {len(single)} single-sector, {multi} multi-sector", flush=True)
    if not single:
        print("no single-sector target found -- widen --candidates", file=sys.stderr)
        return 1

    # Bright first: a shallow transit on a faint star is noise-dominated, which would
    # confound a detrend measurement with a photometry problem.
    stars = select_bright(enrich(single, obs_mjd), args.n)
    for s in stars:
        s["sectors"] = counts[s["tic"]]

    print(f"\n{'TIC':>12}  {'Tmag':>5}  {'Teff':>6}  {'sector':>6}  observed")
    for s in stars:
        tmag = f"{s['tmag']:.2f}" if s["tmag"] is not None else "  -  "
        teff = f"{s['teff']:.0f}" if s["teff"] is not None else "  -  "
        print(f"{s['tic']:>12}  {tmag:>5}  {teff:>6}  "
              f"{str(s['sectors'][0]):>6}  {s['observed_at']}")
    print(f"\n({time.time() - t0:.0f}s)", flush=True)

    if args.out:
        args.out.write_text(json.dumps({
            "schema": "pale-blue-code/single-sector-probe@1",
            "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sector": sector,
            "probed": len(candidates),
            "single_sector_found": len(single),
            "stars": stars,
        }, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {args.out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
