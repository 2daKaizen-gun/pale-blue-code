"""compare_binning_floors + the cost guard for path A's lever 4 (binning), pinned honestly.

The floor sweep is a slow MAST download; these tests pin the pure parts it feeds — picking the
smallest-floor bin per star, the gain sign convention (positive = binning reaches a smaller planet
than the unbinned curve), the best-bin tally, the honest exclusion of a star missing the unbinned
baseline or a radius, and the cost guard (a long transit survives binning, a short one is smeared) —
so the conclusion the check doc reports cannot drift.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import pool_assessment as pa   # noqa: E402

import measure_binning_floor as mbf   # noqa: E402


def _rearth(radius, floor):
    return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))


def test_unbinned_wins_when_it_has_the_smallest_floor():
    rows = [{"tic": 1, "radius": 0.3, "floors": {0.0: 0.001, 10.0: 0.002, 30.0: 0.003}}]
    out = mbf.compare_binning_floors(rows)
    star = out["stars"][0]
    assert star["best_bin"] == 0.0
    assert star["gain_rearth"] == 0.0        # best == unbinned baseline
    assert out["n_improved"] == 0
    assert out["best_bin_counts"] == {0.0: 1}


def test_a_bin_can_beat_the_unbinned_floor():
    rows = [{"tic": 2, "radius": 0.3, "floors": {0.0: 0.004, 10.0: 0.001, 30.0: 0.002}}]
    out = mbf.compare_binning_floors(rows)
    star = out["stars"][0]
    assert star["best_bin"] == 10.0
    assert star["gain_rearth"] == _rearth(0.3, 0.004) - _rearth(0.3, 0.001)
    assert star["gain_rearth"] > 0
    assert out["n_improved"] == 1


def test_missing_baseline_or_radius_is_excluded():
    rows = [
        {"tic": 3, "radius": 0.3, "floors": {10.0: 0.002}},                 # no unbinned baseline
        {"tic": 4, "radius": None, "floors": {0.0: 0.002, 10.0: 0.001}},    # no radius
        {"tic": 5, "radius": 0.3, "floors": {0.0: 0.002, 10.0: 0.001}},     # valid
    ]
    out = mbf.compare_binning_floors(rows)
    assert out["n_compared"] == 1
    assert out["stars"][0]["gain_rearth"] is None   # TIC 3
    assert out["stars"][1]["gain_rearth"] is None   # TIC 4
    assert out["stars"][2]["best_bin"] == 10.0


def test_median_gain_and_tally_over_several_stars():
    rows = [
        {"tic": 1, "radius": 0.3, "floors": {0.0: 0.004, 10.0: 0.001}},   # 10m wins, gain > 0
        {"tic": 2, "radius": 0.3, "floors": {0.0: 0.001, 10.0: 0.003}},   # unbinned wins, gain 0
        {"tic": 3, "radius": 0.3, "floors": {0.0: 0.002, 20.0: 0.001}},   # 20m wins, gain > 0
    ]
    out = mbf.compare_binning_floors(rows)
    assert out["n_compared"] == 3
    assert out["n_improved"] == 2
    assert out["best_bin_counts"] == {10.0: 1, 0.0: 1, 20.0: 1}
    gains = sorted(s["gain_rearth"] for s in out["stars"])
    assert out["median_gain_rearth"] == gains[1]


def test_cost_guard_a_long_transit_survives_binning():
    """A 12-hour transit binned at 30 min keeps almost all its depth (many bins across it)."""
    ret = mbf.depth_retained_after_binning(cadence_min=2.0, bin_min=30.0, duration_days=0.5)
    assert ret is not None
    assert ret > 0.9


def test_cost_guard_a_short_transit_is_smeared_by_a_wide_bin():
    """A 1-hour transit binned at 30 min loses depth — the honesty catch binning must respect."""
    long_dip = mbf.depth_retained_after_binning(2.0, 30.0, duration_days=0.5)    # 12 h
    short_dip = mbf.depth_retained_after_binning(2.0, 30.0, duration_days=1.0 / 24.0)  # 1 h
    assert short_dip < long_dip
