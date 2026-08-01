"""Which plausible dwarfs to fetch, and in what order (sub-11-7 Light 1).

sub-11-5 named the reach worth spending: of the frontier pool, only a handful of stars
are small enough that a detectable single transit could be a *planet* rather than a
star. sub-11-6 taught the hunt to honor that. But the hunt searches only cached light
curves, and those plausible dwarfs have never been fetched — the instrument is aimed
right and pointed at empty air.

This module is the bridge's deterministic half: the *plan*. Given the pool triage and a
way to ask whether a star's curve is already on disk, it lists the plausible dwarfs,
tags each cached or pending, and orders them best-target-first — the smallest planet we
could catch leads, so a bounded fetch budget is spent where the smallest world could
hide. It touches no network; the cache check is injectable. The fetch itself (Light 2)
is a separate, explicit step, so a slow MAST download never masquerades as an instant
plan.
"""

from services import hunt as hunt_service
from services import pool_assessment as pool_service


def _default_is_cached(star_name: str) -> bool:
    """True if the star's light curve is already on disk — the same check the hunt uses.

    Imported lazily so the plan does not drag in the BLS/numpy stack until asked, and so
    there is one definition of "searchable" (a cached curve) shared with ``run_monotransit``.
    """
    from services import bls as bls_service

    return bls_service._find_lc_cache(star_name) is not None


def fetch_plan(
    is_cached=None,
    stars: list[dict] | None = None,
    depth_floor: float = pool_service._FIDUCIAL_DEPTH_FLOOR,
) -> dict:
    """The plausible dwarfs to fetch, tagged cached/pending, best-target-first. No network.

    Reads the sub-11-5 triage (``assess_pool``), keeps only the ``plausible`` stars — the
    ones where a detectable dip could be a planet — and asks ``is_cached`` whether each
    already has a curve on disk. ``assess_pool`` already orders plausible stars by smallest
    detectable planet radius, so the list leads with the best target. Returns::

        {
          "targets": [{tic, star_name, min_planet_rjup, min_planet_rearth, cached}, ...],
          "summary": {plausible, cached, pending, best_target, best_min_planet_rjup},
        }

    ``is_cached`` defaults to the on-disk cache check; inject a fake for tests. Pure geometry
    plus that check — no fetch happens here.
    """
    is_cached = is_cached or _default_is_cached
    assessment = pool_service.assess_pool(depth_floor=depth_floor, stars=stars)
    plausible = [t for t in assessment["targets"] if t["classification"] == "plausible"]

    targets = []
    for t in plausible:
        tic = t.get("tic")
        if tic is None:
            continue                       # no TIC -> no name to fetch by; skip, never guess
        name = hunt_service.star_name(int(tic), "tess")
        targets.append({
            "tic": int(tic),
            "star_name": name,
            "min_planet_rjup": t["min_planet_rjup"],
            "min_planet_rearth": t["min_planet_rearth"],
            "cached": bool(is_cached(name)),
        })

    n_cached = sum(1 for t in targets if t["cached"])
    best = targets[0] if targets else None   # already best-target-first from assess_pool
    summary = {
        "plausible": len(targets),
        "cached": n_cached,
        "pending": len(targets) - n_cached,
        "best_target": best["star_name"] if best else None,
        "best_min_planet_rjup": best["min_planet_rjup"] if best else None,
    }
    return {"targets": targets, "summary": summary}
