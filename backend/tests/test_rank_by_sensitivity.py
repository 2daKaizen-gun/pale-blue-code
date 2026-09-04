"""rank_by_sensitivity ranks stars by the smallest planet their real curve could have shown.

This is path A's first tool (sub §9): naming the sharpest curves from measurement, not from
stellar radius alone. These tests pin the pure ranking — the sqrt(floor)*R_star physics via
pool_assessment, the ascending sort, and the honest handling of a star with no radius (unknown,
sorts last, never mistaken for the best) — so a future change cannot silently reorder the targets.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import pool_assessment as pa   # noqa: E402

import rank_by_sensitivity as rbs   # noqa: E402


def test_sorted_by_min_rearth_ascending():
    # Same floor, three radii: the smallest star yields the smallest detectable planet, so it ranks first.
    rows = [(1, 0.8, 0.004), (2, 0.2, 0.004), (3, 0.5, 0.004)]
    ranked = rbs.rank_by_sensitivity(rows)
    assert [r["tic"] for r in ranked] == [2, 3, 1]
    assert ranked[0]["min_rearth"] < ranked[1]["min_rearth"] < ranked[2]["min_rearth"]


def test_min_rearth_matches_pool_assessment_physics():
    row = (7, 0.3, 0.0025)
    (ranked,) = rbs.rank_by_sensitivity([row])
    expected = pa.rjup_to_rearth(pa.min_detectable_planet_radius(0.3, 0.0025))
    assert ranked["min_rearth"] == expected


def test_star_without_radius_sorts_last_as_unknown():
    rows = [(1, None, 0.004), (2, 0.3, 0.01)]
    ranked = rbs.rank_by_sensitivity(rows)
    assert ranked[0]["tic"] == 2 and ranked[0]["min_rearth"] is not None
    assert ranked[-1]["tic"] == 1 and ranked[-1]["min_rearth"] is None


def test_non_physical_floor_is_unknown_not_best():
    # A zero/negative floor has no radius to report; it must not sort ahead of a real measurement.
    rows = [(1, 0.3, 0.0), (2, 0.3, 0.01)]
    ranked = rbs.rank_by_sensitivity(rows)
    assert ranked[0]["tic"] == 2
    assert ranked[-1]["tic"] == 1 and ranked[-1]["min_rearth"] is None
