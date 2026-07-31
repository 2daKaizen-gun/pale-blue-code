"""What a detectable dip would MEAN on each frontier-pool star (sub-11-5).

The hunt's scoreboards (sub-11-3 false alarms, sub-11-4 completeness) describe the
instrument. This module turns to the sky the instrument points at. A transit hides a
fraction ``depth`` of the star's disk, and that disk area is set by the star's radius, so

    R_planet = sqrt(depth) * R_star

A shallow dip on a small star is a small planet; the SAME dip on a giant is a star-sized
companion. The frontier pool is bright because many of its stars are giants, so the
detection floor (sub-11-4, ~0.40%) translates to a *minimum detectable planet radius* that,
on most of the pool, is far too large to be a planet at all. This module computes that, so
the hunt can be pointed where a detection could actually be a world.

Light 1 is the pure geometry; the pool assessment builds on it in Light 2.
"""

import math

from services import hunt as hunt_service

# Radii in kilometers, for converting a companion radius between the natural units. R_star is
# carried in solar radii (the pool metadata's unit); a planet radius reads better in R_jup /
# R_earth. Volumetric mean radii.
_RSUN_KM = 695700.0
_RJUP_KM = 69911.0
_REARTH_KM = 6371.0

RSUN_IN_RJUP = _RSUN_KM / _RJUP_KM      # ~9.95
RSUN_IN_REARTH = _RSUN_KM / _REARTH_KM  # ~109.2

# The fiducial detection floor: the depth the full hunt recovers reliably on a well-behaved
# single-sector dwarf (sub-11-4 completeness map). Applied uniformly rather than fabricated
# per star from a magnitude-noise model — stellar radius spans ~100x across the pool while
# noise spans ~10x, so the verdict is radius-dominated, and the pool's giants are measured to
# be noisier than photon-limited (158-1245 ppm), which only makes a "too big" verdict safer.
_FIDUCIAL_DEPTH_FLOOR = 0.004

# The planet / brown-dwarf SIZE boundary. Gas giants and brown dwarfs both sit near 1 R_jup
# (electron degeneracy holds the radius roughly flat across a wide mass range), and an inflated
# hot giant can reach ~2 R_jup; above that a transiting body is almost certainly stellar. A
# transit depth fixes radius, not mass, so this is a necessary *size* gate, not planethood.
_PLANET_MAX_RJUP = 2.0


def planet_radius_from_depth(depth: float, stellar_radius_rsun: float) -> float:
    """Companion radius in **R_jup** for a transit of ``depth`` on a star of the given radius.

    ``R_planet = sqrt(depth) * R_star``, then R_sun -> R_jup. Raises on non-physical input
    (a non-positive depth or radius has no radius to report).
    """
    if depth <= 0:
        raise ValueError("depth must be positive")
    if stellar_radius_rsun <= 0:
        raise ValueError("stellar_radius_rsun must be positive")
    r_star_fraction = math.sqrt(depth)          # R_planet in units of R_star
    return r_star_fraction * stellar_radius_rsun * RSUN_IN_RJUP


def rjup_to_rearth(r_jup: float) -> float:
    """Convert a radius from Jupiter radii to Earth radii."""
    return r_jup * _RJUP_KM / _REARTH_KM


def min_detectable_planet_radius(
    stellar_radius_rsun: float, depth_floor: float = _FIDUCIAL_DEPTH_FLOOR
) -> float:
    """Smallest companion (R_jup) a transit at the detection ``depth_floor`` could reveal here.

    The floor depth is the shallowest dip the hunt recovers; below it nothing is seen, so this
    is the smallest planet this star could yield a detection for. On a dwarf it is a real
    planet; on a giant it is a star.
    """
    return planet_radius_from_depth(depth_floor, stellar_radius_rsun)


# --- the pool assessment (sub-11-5 Light 2) -----------------------------------
#
# Rank the frontier pool by what a detection would MEAN on each star: the smallest planet the
# floor could reveal there. Plausible (a detection could be a planet) sorts above too_big (a
# detection would be a star), and a star with no radius sorts last as unknown rather than being
# guessed at. The point is to name honestly how few of the fresh-sky stars are worth a fetch.

# Sort key: plausible targets first, then the star-sized ones, then the unknowns.
_CLASS_ORDER = {"plausible": 0, "too_big": 1, "unknown": 2}


def _assess_star(star: dict, depth_floor: float) -> dict:
    """One pool star -> its minimum detectable planet radius and a size classification."""
    radius = star.get("radius")
    row = {
        "tic": star.get("tic"),
        "tmag": star.get("tmag"),
        "constellation": star.get("constellation"),
        "stellar_radius": radius,
    }
    if radius is None or radius <= 0:
        # no radius on file -> we cannot say what a dip would mean; do not guess
        return {**row, "min_planet_rjup": None, "min_planet_rearth": None,
                "classification": "unknown"}
    r_jup = min_detectable_planet_radius(radius, depth_floor)
    classification = "plausible" if r_jup <= _PLANET_MAX_RJUP else "too_big"
    return {**row, "min_planet_rjup": r_jup, "min_planet_rearth": rjup_to_rearth(r_jup),
            "classification": classification}


def assess_pool(
    depth_floor: float = _FIDUCIAL_DEPTH_FLOOR, stars: list[dict] | None = None
) -> dict:
    """Rank the frontier pool by minimum detectable planet radius, with an honest summary.

    Returns ``{"targets": [...], "summary": {...}}``: every pool star scored and classified
    (``plausible`` / ``too_big`` / ``unknown``), ranked so the few stars where a detection could
    be a real planet come first, and a summary counting how few those are out of the whole pool.
    """
    stars = stars if stars is not None else hunt_service.frontier_tess_stars()
    targets = [_assess_star(s, depth_floor) for s in stars]
    targets.sort(key=lambda a: (
        _CLASS_ORDER[a["classification"]],
        a["min_planet_rjup"] if a["min_planet_rjup"] is not None else math.inf,
    ))
    summary = {
        "total": len(targets),
        "plausible": sum(1 for a in targets if a["classification"] == "plausible"),
        "too_big": sum(1 for a in targets if a["classification"] == "too_big"),
        "unknown": sum(1 for a in targets if a["classification"] == "unknown"),
        "depth_floor": depth_floor,
        "planet_max_rjup": _PLANET_MAX_RJUP,
    }
    return {"targets": targets, "summary": summary}


# --- the triage, keyed for the hunt (sub-11-6 Light 1) -------------------------
#
# The hunt works in star *names* (``star_name(tic, "tess")``), not the catalog dicts the pool
# assessment scores. This maps the sub-11-5 verdict onto those names so the hunt can stamp each
# star with what a detection there would MEAN — plausible (a planet), too_big (a star), unknown —
# without re-deriving the geometry. One definition of the classification, read by two callers.


def size_class_by_name(
    depth_floor: float = _FIDUCIAL_DEPTH_FLOOR, stars: list[dict] | None = None
) -> dict:
    """``{star_name: {size_class, min_planet_rjup, min_planet_rearth}}`` over the pool.

    Wraps ``assess_pool`` and keys it by the hunt's star name so ``hunt_monotransit`` can join the
    size verdict onto its ledger and survivors. Stars with no TIC are skipped (no name to key on).
    """
    assessment = assess_pool(depth_floor=depth_floor, stars=stars)
    index: dict[str, dict] = {}
    for t in assessment["targets"]:
        tic = t.get("tic")
        if tic is None:
            continue
        name = hunt_service.star_name(int(tic), "tess")
        index[name] = {
            "size_class": t["classification"],
            "min_planet_rjup": t["min_planet_rjup"],
            "min_planet_rearth": t["min_planet_rearth"],
        }
    return index
