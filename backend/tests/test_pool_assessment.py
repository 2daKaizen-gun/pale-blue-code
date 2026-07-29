"""sub-11-5 — what a detectable dip would mean on each pool star.

Light 1 is the pure geometry: a transit depth and a stellar radius give a companion
radius. Hand-checkable against the canonical case — a 1% dip on a Sun-like star is
~1 Jupiter — and the giant case that motivates the whole sub-phase.
"""

import math

import pytest

from services import pool_assessment as pa


# ---- planet_radius_from_depth ------------------------------------------------

def test_one_percent_dip_on_a_sun_is_about_one_jupiter():
    # sqrt(0.01) = 0.1 R_sun, and R_sun ~ 9.95 R_jup -> ~0.995 R_jup
    r_jup = pa.planet_radius_from_depth(0.01, 1.0)
    assert r_jup == pytest.approx(0.995, abs=0.02)


def test_earth_on_a_sun_reads_back_one_earth_radius():
    # an Earth-radius planet on the Sun: depth = (R_earth/R_sun)^2
    depth = (1.0 / pa.RSUN_IN_REARTH) ** 2
    r_earth = pa.rjup_to_rearth(pa.planet_radius_from_depth(depth, 1.0))
    assert r_earth == pytest.approx(1.0, abs=0.01)


def test_depth_scales_radius_as_square_root():
    # four times the depth is twice the radius (same star)
    r1 = pa.planet_radius_from_depth(0.001, 1.5)
    r4 = pa.planet_radius_from_depth(0.004, 1.5)
    assert r4 == pytest.approx(2.0 * r1, rel=1e-9)


def test_non_physical_input_raises():
    with pytest.raises(ValueError):
        pa.planet_radius_from_depth(0.0, 1.0)
    with pytest.raises(ValueError):
        pa.planet_radius_from_depth(0.01, 0.0)


# ---- min_detectable_planet_radius --------------------------------------------

def test_floor_on_a_dwarf_is_a_plausible_planet():
    # a ~1 R_sun dwarf at the 0.40% floor: sqrt(0.004) ~ 0.063 R_sun ~ 0.63 R_jup
    r_jup = pa.min_detectable_planet_radius(1.0)
    assert r_jup < pa._PLANET_MAX_RJUP
    assert r_jup == pytest.approx(math.sqrt(pa._FIDUCIAL_DEPTH_FLOOR) * pa.RSUN_IN_RJUP, rel=1e-9)


def test_floor_on_a_giant_is_a_star_sized_companion():
    # an 11 R_sun giant at the same floor implies a many-R_jup object — not a planet
    assert pa.min_detectable_planet_radius(11.0) > 5.0
