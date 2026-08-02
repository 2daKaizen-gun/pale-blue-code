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


# ---- assess_pool -------------------------------------------------------------

_FAKE_POOL = [
    {"tic": 1, "tmag": 8.0, "constellation": "Pavo", "radius": 1.0},      # dwarf -> plausible
    {"tic": 2, "tmag": 5.0, "constellation": "Tucana", "radius": 40.0},   # giant -> too_big
    {"tic": 3, "tmag": 7.0, "constellation": "Indus", "radius": None},    # no radius -> unknown
    {"tic": 4, "tmag": 8.1, "constellation": "Phoenix", "radius": 0.8},   # dwarf -> plausible
]


def test_assess_pool_classifies_and_ranks_plausible_first():
    out = pa.assess_pool(stars=_FAKE_POOL)
    targets, summary = out["targets"], out["summary"]
    # ranked: the two dwarfs (smallest planet first), then the giant, then the unknown
    assert [t["tic"] for t in targets] == [4, 1, 2, 3]
    assert [t["classification"] for t in targets] == ["plausible", "plausible", "too_big", "unknown"]
    assert summary["total"] == 4
    assert summary["plausible"] == 2 and summary["too_big"] == 1 and summary["unknown"] == 1
    # a missing radius yields no planet radius, not a fabricated one
    assert targets[-1]["min_planet_rjup"] is None


def test_assess_pool_summary_accounts_for_every_star():
    out = pa.assess_pool(stars=_FAKE_POOL)
    s = out["summary"]
    assert s["plausible"] + s["too_big"] + s["unknown"] == s["total"]


def test_assess_pool_on_the_real_pool_is_mostly_giants():
    # the honest finding: the fresh-sky pool is bright because it is full of giants, so most
    # stars are too_big — a detection there would be a star, not a planet
    out = pa.assess_pool()
    s = out["summary"]
    assert s["total"] == 50
    assert s["plausible"] + s["too_big"] + s["unknown"] == 50
    assert s["too_big"] > s["plausible"]          # the majority cannot host a detectable planet
    assert out["targets"][0]["classification"] == "plausible"   # best target leads


def test_size_class_by_name_keys_the_verdict_for_the_hunt():
    # sub-11-6 Light 1: the triage keyed by the hunt's star name, so hunt_monotransit can join it
    from services import hunt as hunt_service
    index = pa.size_class_by_name(stars=_FAKE_POOL)
    dwarf = hunt_service.star_name(1, "tess")     # radius 1.0 -> plausible
    giant = hunt_service.star_name(2, "tess")     # radius 40 -> too_big
    assert index[dwarf]["size_class"] == "plausible"
    assert index[dwarf]["min_planet_rjup"] is not None
    assert index[giant]["size_class"] == "too_big"
    # sub-11-8: the radius rides along so the hunt can bound the period
    assert index[dwarf]["stellar_radius"] == 1.0
    # every pool star with a TIC is keyed
    assert len(index) == 4
