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
