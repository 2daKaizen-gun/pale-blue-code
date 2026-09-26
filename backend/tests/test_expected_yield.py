"""Pure-part tests for scripts/expected_yield.py (the Phase 12 expected-yield estimate)."""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import expected_yield as ey  # noqa: E402


def test_transit_probability_matches_earth_around_the_sun():
    # R_sun / 1 AU ~= 0.00465 for a one-year orbit around a solar-mass, solar-radius star.
    p = ey.transit_probability(365.25, 1.0, 1.0)
    assert math.isclose(p, ey.RSUN_AU, rel_tol=1e-6)


def test_transit_probability_falls_with_period():
    # a ~ P^(2/3), so p ~ P^(-2/3): eight times the period is a quarter the probability.
    p1 = ey.transit_probability(30.0, 0.3, 0.3)
    p8 = ey.transit_probability(240.0, 0.3, 0.3)
    assert math.isclose(p8 / p1, 0.25, rel_tol=1e-9)


def test_window_probability_saturates_at_one():
    assert ey.window_probability(20.0, 50.0) == 1.0
    assert math.isclose(ey.window_probability(200.0, 50.0), 0.25)


def test_a_star_that_cannot_see_planets_expects_none():
    # a curve too noisy to show anything under 30 R_earth is blind to every band
    assert ey.star_yield(0.3, 30.0, 100.0) == 0.0
    # and unusable inputs contribute nothing rather than crashing
    assert ey.star_yield(None, 1.0, 100.0) == 0.0
    assert ey.star_yield(0.3, None, 100.0) == 0.0
    assert ey.star_yield(0.3, 1.0, 0.0) == 0.0


def test_sharper_curves_and_longer_coverage_expect_more():
    base = ey.star_yield(0.3, 3.0, 50.0)
    assert ey.star_yield(0.3, 1.0, 50.0) > base       # smaller detectable planet
    assert ey.star_yield(0.3, 3.0, 150.0) > base      # more observed time
    assert base > 0


def test_band_below_its_floor_counts_whole_band():
    # a floor below the small band's lower edge counts the band from its edge, not from the floor
    assert math.isclose(ey.star_yield(0.3, 0.5, 50.0), ey.star_yield(0.3, 1.0, 50.0))


def test_poisson_zero():
    assert ey.poisson_zero(0.0) == 1.0
    assert math.isclose(ey.poisson_zero(1.0), math.exp(-1.0))
