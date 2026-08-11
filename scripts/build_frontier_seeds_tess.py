#!/usr/bin/env python
"""Offline builder for the Phase 10 TESS frontier seed pool — the *fresh sky*.

The TESS analogue of build_frontier_seeds.py, rebuilt for Phase 10's "time
frontier" (sub-10-4). The whole point is freshness: TESS releases a brand-new
sector of the sky roughly every ~27 days, and a star observed in the *newest*
sector that is still ABSENT from the TOI catalog is the closest an amateur can get
to genuinely un-picked-over data. So this builder does not take a fixed sector —
it finds the newest sector MAST is serving and draws from it.

Pipeline (all network probing happens here, offline; the runtime only ever reads
the committed JSON):

    1. estimate the current sector from the date, then probe downward until we hit
       the newest sector that actually has SPOC 2-min timeseries products;
    2. pull every SPOC target in that sector (each is a guaranteed real light
       curve) and keep only TICs ABSENT from toi_catalog.csv -> genuinely
       unrecorded (honesty nail #3, extended to TESS);
    3. sample N, and enrich each with human-readable identity — brightness (Tmag),
       temperature (Teff, -> "sun-like"), radius, distance, constellation, and the
       date TESS observed it — so the UI can show a *place in the sky*, not a bare
       number.

Schema @2 carries per-star objects plus freshness (built_at, latest_sector). A
scheduled routine reruns this every ~2 weeks so the pool tracks the newest sky.

Usage:
    python scripts/build_frontier_seeds_tess.py                 # newest sector -> real path
    python scripts/build_frontier_seeds_tess.py --n 8 --out /tmp/smoke.json
    python scripts/build_frontier_seeds_tess.py --sectors 90    # pin a sector (testing)
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

# TESS sector 1 midpoint and mean sector length — used only to *estimate* a
# starting point for the downward probe; the truth is whatever MAST serves.
_S1_EPOCH_MJD = 58335.0   # ~2018-07-25, middle of sector 1
_SECTOR_DAYS = 27.4
_MJD_UNIX_EPOCH = 40587   # MJD of 1970-01-01

# A frontier target must be bright enough for a transit to register, and the feed's
# "sun-like" line needs a real Teff. Faint TESS 2-min targets (Tmag > ~13) mostly
# lack stellar params in TIC, so they make a poor, empty feed. Keep the bright end.
_TMAG_MAX = 13.0


def _now_mjd() -> float:
    return _MJD_UNIX_EPOCH + time.time() / 86400.0


def estimate_current_sector() -> int:
    """Rough sector number for today (+buffer), the top of the downward probe."""
    return int((_now_mjd() - _S1_EPOCH_MJD) / _SECTOR_DAYS) + 3


def load_recorded() -> set[int]:
    with TOI_CSV.open(encoding="utf-8") as f:
        out: set[int] = set()
        for r in csv.DictReader(f):
            try:
                out.add(int(float(r["tid"])))
            except (ValueError, KeyError):
                continue
        return out


def spoc_targets_in_sector(sector: int) -> dict[int, float]:
    """Every SPOC 2-min target in one sector -> {TIC: earliest t_min (MJD)}.

    Rows only come back for stars actually observed at 2-min cadence, so a key
    here is a hard guarantee of "a real light curve exists." t_min gives the
    observation date, which drives the "N days ago" freshness in the UI.
    """
    from astroquery.mast import Observations

    obs = Observations.query_criteria(
        obs_collection="TESS",
        provenance_name="SPOC",
        dataproduct_type="timeseries",
        sequence_number=sector,
    )
    out: dict[int, float] = {}
    for row in obs:
        try:
            tic = int(str(row["target_name"]).strip())
            tmin = float(row["t_min"])
        except (ValueError, KeyError, TypeError):
            continue
        if tic not in out or tmin < out[tic]:
            out[tic] = tmin
    return out


def find_latest_sector(start: int, floor: int = 60) -> tuple[int, dict[int, float]]:
    """Probe downward from `start` to the newest sector with SPOC data.

    Empty (future) sectors return instantly, so this costs a handful of fast
    misses then one real pull. Returns (sector, {tic: t_min}).
    """
    for sector in range(start, floor, -1):
        targets = spoc_targets_in_sector(sector)
        print(f"  probe sector {sector}: {len(targets)} SPOC targets", flush=True)
        if targets:
            return sector, targets
    raise RuntimeError(f"no SPOC sector with data found in [{floor}, {start}]")


def _num(row, key):
    """A catalog cell as float, or None if masked/absent/non-finite."""
    try:
        v = row[key]
        if v is None or (hasattr(v, "mask") and v.mask):
            return None
        f = float(v)
        return f if f == f else None  # drop NaN
    except (KeyError, ValueError, TypeError):
        return None


def enrich(tics: list[int], obs_mjd: dict[int, float]) -> list[dict]:
    """Attach human-readable identity to each TIC (one batched TIC-catalog query)."""
    from astroquery.mast import Catalogs
    from astropy.coordinates import SkyCoord, get_constellation
    from astropy.time import Time
    import astropy.units as u

    rows = Catalogs.query_criteria(catalog="TIC", ID=tics)
    by_id = {int(r["ID"]): r for r in rows}

    stars: list[dict] = []
    for tic in tics:
        r = by_id.get(tic)
        ra = _num(r, "ra") if r is not None else None
        dec = _num(r, "dec") if r is not None else None
        constellation = None
        if ra is not None and dec is not None:
            constellation = str(get_constellation(SkyCoord(ra * u.deg, dec * u.deg)))
        observed_at = None
        if tic in obs_mjd:
            observed_at = Time(obs_mjd[tic], format="mjd").iso[:10]
        stars.append({
            "tic": tic,
            "observed_at": observed_at,               # YYYY-MM-DD TESS saw it
            "constellation": constellation,           # where in the sky
            "tmag": _num(r, "Tmag") if r is not None else None,   # brightness
            "teff": _num(r, "Teff") if r is not None else None,   # temperature (K)
            "radius": _num(r, "rad") if r is not None else None,  # stellar radius (R_sun)
            "distance_pc": _num(r, "d") if r is not None else None,
        })
    return stars


def select_bright(stars: list[dict], n: int) -> list[dict]:
    """Keep the N most observable stars: bright first, characterized first.

    Ranks by (has a usable Tmag <= _TMAG_MAX, has a real Teff, then brightest).
    Deterministic — same enriched input always yields the same pick. The stored
    order is brightest-first, which also gives the recency feed a sensible tiebreak
    when many stars share one sector's observation date.
    """
    def key(s):
        tmag = s.get("tmag")
        bright = tmag is not None and tmag <= _TMAG_MAX
        characterized = s.get("teff") is not None
        # sort ASC: False (0) before True (1), so `not flag` puts good stars first;
        # brighter = smaller Tmag, missing Tmag sinks to the bottom.
        return (not bright, not characterized, tmag if tmag is not None else 99.0)
    return sorted(stars, key=key)[:n]


def select_for_hunt(stars: list[dict], n: int) -> list[dict]:
    """Keep the N best *single-transit hunt* targets: small stars, bright enough to search.

    select_bright ranks by brightness, and bright TESS stars are mostly giants — which is
    exactly why the frontier pool came out ~2/3 too_big, with only a handful of stars where a
    detectable dip could be a planet (sub-11-5). The hunt wants the opposite: SMALL stars. A
    transit depth fixes companion radius (R_planet = sqrt(depth) * R_star), so the smaller the
    star, the smaller — and more planet-like — a detectable dip.

    So this ranks the hunt's real targets first: bright ENOUGH to register a transit
    (Tmag <= _TMAG_MAX) and characterized (a real Teff AND radius), then SMALLEST radius first
    (dwarfs), with brightness only as the final tiebreak. A star with no radius cannot be called
    a dwarf, so it sinks below every measured one. Deterministic, like select_bright.
    """
    def key(s):
        tmag = s.get("tmag")
        radius = s.get("radius")
        bright = tmag is not None and tmag <= _TMAG_MAX
        characterized = s.get("teff") is not None and radius is not None
        return (
            not bright,                                  # observable stars first
            not characterized,                           # ones we can size first
            radius if radius is not None else 99.0,      # smallest (dwarfs) first
            tmag if tmag is not None else 99.0,          # brightest as the tiebreak
        )
    return sorted(stars, key=key)[:n]


_SELECTORS = {"hunt": select_for_hunt, "bright": select_bright}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50, help="target seed count")
    ap.add_argument("--sectors", type=int, nargs="+", default=None,
                    help="pin specific sectors (default: auto-detect newest)")
    ap.add_argument("--seed", type=int, default=10, help="RNG seed for the sample")
    ap.add_argument("--select", choices=sorted(_SELECTORS), default="hunt",
                    help="'hunt' = smallest stars first (planet-size targets); "
                         "'bright' = brightest first (the old Phase-10 feed order)")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    recorded = load_recorded()
    print(f"loaded {len(recorded)} TOI tids as exclusion set", flush=True)
    t0 = time.time()

    if args.sectors:
        latest = max(args.sectors)
        obs_mjd: dict[int, float] = {}
        for s in args.sectors:
            obs_mjd.update(spoc_targets_in_sector(s))
        used_sectors = sorted(args.sectors)
    else:
        latest, obs_mjd = find_latest_sector(estimate_current_sector())
        used_sectors = [latest]
    print(f"newest sector = {latest} ({len(obs_mjd)} SPOC targets)", flush=True)

    unrecorded = sorted(t for t in obs_mjd if t not in recorded)
    print(f"  {len(unrecorded)} unrecorded (absent from TOI)", flush=True)

    # Enrich a larger candidate pool, then keep only the brightest, well-characterized
    # stars (see select_bright). We over-sample because most faint targets carry no
    # stellar params, and a bare, dim feed would betray the "come look" promise.
    pool_size = min(len(unrecorded), max(args.n * 8, 300))
    candidates = (sorted(rng.sample(unrecorded, pool_size))
                  if len(unrecorded) > pool_size else unrecorded)
    selector = _SELECTORS[args.select]
    print(f"enriching {len(candidates)} candidates, keeping {args.n} by '{args.select}'...",
          flush=True)
    enriched = enrich(candidates, obs_mjd)
    stars = selector(enriched, args.n)

    payload = {
        "schema": "pale-blue-code/frontier-seeds-tess@2",
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "criteria": ("newest SPOC sector; tid absent from toi_catalog; 2-min light curve exists; "
                     f"selected by '{args.select}'"
                     + (" (smallest stars first — planet-size hunt targets)"
                        if args.select == "hunt" else " (brightest first)")),
        "latest_sector": latest,
        "sectors": used_sectors,
        "count": len(stars),
        "stars": stars,
        # Flat, sorted id list kept for backward-compatible readers (`stars` itself
        # is ordered brightest-first, so this is sorted separately).
        "tics": sorted(s["tic"] for s in stars),
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"\nwrote {len(stars)} seeds (sector {latest}) to {args.out} "
          f"({time.time() - t0:.0f}s)", flush=True)
    if len(stars) < args.n:
        print("WARNING: fewer than requested -- newest sector thin; widen --sectors",
              file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
