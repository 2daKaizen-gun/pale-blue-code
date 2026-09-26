"""How many planets should this hunt have found? An expected-yield estimate, star by star.

A null result means something only against an expectation. This script asks: given the stars we
actually searched and the sensitivity each curve actually reached, how many single-transit planets
would we *expect* to have detected, if planets around these stars are as common as surveys say?
If the answer is well below one, zero candidates was the likely outcome before we began.

For each searched star (deduplicated by TIC across the pools given) it integrates

    N_star = sum over size bands of  f_band * int dlnP  p_transit(P) * p_window(P)  *  dlnR_detectable

    p_transit(P) = R_star / a(P)             geometric transit probability, a from Kepler's third law
    p_window(P)  = min(1, T_obs / P)         chance a transit lands inside the observed time
    dlnR_detectable = ln(R_hi) - ln(max(R_lo, R_min))   the part of the band this curve could see

over a "machine-blind" period window P in [P_MIN, P_MAX]. Pools exclude stars already carrying a
TESS Object of Interest, so short-period transiting planets that the SPOC pipeline catches are
mostly already catalogued and their hosts are not in our pools; what is left to find new is the
long-period, few-transit regime this hunt targets.

Assumptions, each stated so the number can be argued with rather than trusted:
- Occurrence density f (planets per star per unit lnP per unit lnR), flat in lnP and lnR:
    small planets 1-4 R_earth: 0.30  -- Dressing & Charbonneau 2015 (ApJ 807, 45) find ~2.5 such
      planets per M dwarf with P < 200 d; 2.5 / (ln(200/0.5) * ln 4) ~= 0.30. Extending it flat past
      200 d is generous (occurrence at long periods is poorly known).
    large planets 4-22.4 R_earth: 0.004 -- giant planets are rare around M dwarfs (a few percent per
      star out to ~1000 d in RV and microlensing surveys); 0.05 / (ln 1000 * ln 5.6) ~= 0.004.
  Planets under 1 R_earth are not counted (outside the cited survey range): slightly conservative.
- Stellar mass M = R (solar units), adequate for M and late-K dwarfs (+-~15%).
- Observed time T_obs = 25 d x sectors observed (a ~27 d sector minus its downlink gaps).
- Detection is a step at the measured depth floor (depth = (R_p/R_star)^2 >= floor). Real
  recovery is softer than a step, so this is an upper-leaning estimate.

It never fetches and never searches. It reads the pool files, the mono caches (measured floor,
same version + lc-mtime validity as tally_hunt / completeness_hunt) and the light-curve caches
(sector count).

    python scripts/expected_yield.py --pool backend/data/pool_s01*.json
    python scripts/expected_yield.py --pool ... --cache-dir /path/to/backend/cache
"""

import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services import monotransit as mt          # noqa: E402
from services import pool_assessment as pa       # noqa: E402

RSUN_AU = 0.00465047
DAYS_PER_SECTOR = 25.0
P_MIN, P_MAX = 27.0, 500.0

# (label, R_lo, R_hi in R_earth, planets per star per lnP per lnR)
BANDS = (
    ("small (1-4 R_earth)", 1.0, 4.0, 0.30),
    ("large (4-22.4 R_earth)", 4.0, 22.4, 0.004),
)


def transit_probability(period_days: float, r_star_rsun: float, m_star_msun: float) -> float:
    """Geometric transit probability R_star / a for a circular orbit."""
    a_au = (m_star_msun * (period_days / 365.25) ** 2) ** (1.0 / 3.0)
    return min(1.0, r_star_rsun * RSUN_AU / a_au)


def window_probability(period_days: float, t_obs_days: float) -> float:
    """Chance that at least one transit falls inside t_obs days of data (random phase)."""
    return min(1.0, t_obs_days / period_days)


def star_yield(r_star_rsun, r_min_rearth, t_obs_days, bands=BANDS,
               p_min=P_MIN, p_max=P_MAX, steps=400) -> float:
    """Expected number of planets this star's search would have detected.

    ``r_min_rearth`` is the smallest planet the curve could reveal (from its measured floor).
    Returns 0.0 for a star without a usable radius, floor or observing time.
    """
    if not r_star_rsun or r_star_rsun <= 0 or r_min_rearth is None or t_obs_days <= 0:
        return 0.0
    m_star = r_star_rsun  # M ~ R for M / late-K dwarfs
    lo, hi = math.log(p_min), math.log(p_max)
    dlnp = (hi - lo) / steps
    period_integral = 0.0
    for k in range(steps):
        p = math.exp(lo + (k + 0.5) * dlnp)
        period_integral += (transit_probability(p, r_star_rsun, m_star)
                            * window_probability(p, t_obs_days) * dlnp)
    total = 0.0
    for _, r_lo, r_hi, density in bands:
        r_eff = max(r_lo, r_min_rearth)
        if r_eff < r_hi:
            total += density * period_integral * (math.log(r_hi) - math.log(r_eff))
    return total


def poisson_zero(expected: float) -> float:
    """Probability of finding nothing when ``expected`` detections are expected."""
    return math.exp(-expected)


def _valid_floor(tic: int, cache_dir: Path):
    """(depth_floor, sector_count) from a star's valid caches, or None if it was not searched."""
    # the searched curve (validity stamp, as mt._lc_source_path) and the raw fetch (sector count)
    searched = cache_dir / ("bls_lc_tic-%d.json" % tic)
    lc = cache_dir / ("lc_tic-%d_tess.json" % tic)
    mono = cache_dir / ("mono_tic-%d.json" % tic)
    if not (searched.exists() and mono.exists()):
        return None
    try:
        stored = json.loads(mono.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if stored.get("version") != mt._MONO_CACHE_VERSION:
        return None
    if stored.get("lc_mtime_ns") != searched.stat().st_mtime_ns:
        return None
    floor = stored.get("result", {}).get("depth_floor")
    if not floor or floor <= 0:
        return None
    try:
        sectors = json.loads(lc.read_text(encoding="utf-8")).get("sector_count") or 1
    except (OSError, json.JSONDecodeError):
        sectors = 1
    return floor, sectors


def collect_stars(pool_paths, cache_dir: Path):
    """Searched stars across pools, deduped by TIC: dicts of tic, radius, min_rearth, t_obs."""
    radius_by_tic = {}
    for path in pool_paths:
        pool = json.loads(Path(path).read_text(encoding="utf-8"))
        for s in pool["stars"]:
            radius_by_tic.setdefault(int(s["tic"]), s.get("radius"))
    stars = []
    for tic, radius in sorted(radius_by_tic.items()):
        got = _valid_floor(tic, cache_dir)
        if got is None or not radius:
            continue
        floor, sectors = got
        r_min = pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))
        stars.append({"tic": tic, "radius": radius, "min_rearth": r_min,
                      "t_obs": DAYS_PER_SECTOR * sectors})
    return stars, len(radius_by_tic)


def main() -> None:
    ap = argparse.ArgumentParser(description="Expected single-transit yield of the searched stars.")
    ap.add_argument("--pool", nargs="+", required=True, help="pool JSONs (deduped by TIC)")
    ap.add_argument("--cache-dir", default=str(ROOT / "backend" / "cache"),
                    help="where the lc_/mono_ caches live (default: this checkout's backend/cache)")
    args = ap.parse_args()

    stars, n_pool = collect_stars(args.pool, Path(args.cache_dir))
    if not stars:
        print("no searched stars with a measured floor in %s" % args.cache_dir)
        return
    yields = [star_yield(s["radius"], s["min_rearth"], s["t_obs"]) for s in stars]
    total = sum(yields)
    print("expected single-transit yield -- caches only, no fetch")
    print("pools: %s  (%d stars, %d searched)" % (", ".join(Path(p).name for p in args.pool),
                                                  n_pool, len(stars)))
    print("period window %g-%g d; bands: %s" % (P_MIN, P_MAX,
          "; ".join("%s f=%g" % (b[0], b[3]) for b in BANDS)))
    print("-" * 64)
    print("expected detections : %.2f" % total)
    print("P(zero | expected)  : %.0f%%" % (100 * poisson_zero(total)))
    for label, scale in (("half as many planets", 0.5), ("twice as many planets", 2.0)):
        print("  if %-22s: expected %.2f, P(zero) %.0f%%"
              % (label, total * scale, 100 * poisson_zero(total * scale)))
    top = sorted(zip(yields, stars), key=lambda t: -t[0])[:5]
    print("stars carrying the most expectation:")
    for y, s in top:
        print("  TIC %-11d R*=%.3f  min %.2f R_earth  T_obs %4.0f d  -> %.4f"
              % (s["tic"], s["radius"], s["min_rearth"], s["t_obs"], y))
    print("-" * 64)
    print("An estimate with stated assumptions, not a measurement. It asks whether zero was")
    print("already the likely answer; the assumptions above say how it could be wrong.")


if __name__ == "__main__":
    main()
