"""compare_detrend_windows summarizes the detrend-window floor sweep honestly (path A, lever 2).

The measurement is a slow MAST download; these tests pin the pure comparison it feeds — picking the
smallest-floor window per star, the gain sign convention (positive = a non-30d window reaches a
smaller planet than the production 30d), the best-window tally, and the honest exclusion of a star
missing the baseline floor or a radius — so the conclusion the check doc reports cannot drift.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import pool_assessment as pa   # noqa: E402

import measure_detrend_floor as mdf   # noqa: E402


def _rearth(radius, floor):
    return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))


def test_thirty_day_wins_when_it_has_the_smallest_floor():
    rows = [{"tic": 1, "radius": 0.3, "floors": {10.0: 0.003, 20.0: 0.002, 30.0: 0.001, 50.0: 0.002}}]
    out = mdf.compare_detrend_windows(rows)
    star = out["stars"][0]
    assert star["best_window"] == 30.0
    assert star["gain_rearth"] == 0.0        # best == baseline
    assert out["n_improved"] == 0
    assert out["best_window_counts"] == {30.0: 1}


def test_a_shorter_window_can_beat_thirty_days():
    rows = [{"tic": 2, "radius": 0.3, "floors": {10.0: 0.001, 20.0: 0.002, 30.0: 0.004, 50.0: 0.005}}]
    out = mdf.compare_detrend_windows(rows)
    star = out["stars"][0]
    assert star["best_window"] == 10.0
    assert star["gain_rearth"] == _rearth(0.3, 0.004) - _rearth(0.3, 0.001)
    assert star["gain_rearth"] > 0
    assert out["n_improved"] == 1


def test_missing_baseline_or_radius_is_excluded():
    rows = [
        {"tic": 3, "radius": 0.3, "floors": {10.0: 0.002}},              # no 30d baseline
        {"tic": 4, "radius": None, "floors": {30.0: 0.002, 10.0: 0.001}},  # no radius
        {"tic": 5, "radius": 0.3, "floors": {30.0: 0.002, 20.0: 0.001}},   # valid
    ]
    out = mdf.compare_detrend_windows(rows)
    assert out["n_compared"] == 1
    assert out["stars"][0]["gain_rearth"] is None   # TIC 3
    assert out["stars"][1]["gain_rearth"] is None   # TIC 4
    assert out["stars"][2]["best_window"] == 20.0


def test_median_gain_and_tally_over_several_stars():
    rows = [
        {"tic": 1, "radius": 0.3, "floors": {30.0: 0.004, 10.0: 0.001}},   # 10d wins, gain > 0
        {"tic": 2, "radius": 0.3, "floors": {30.0: 0.001, 10.0: 0.003}},   # 30d wins, gain 0
        {"tic": 3, "radius": 0.3, "floors": {30.0: 0.002, 20.0: 0.001}},   # 20d wins, gain > 0
    ]
    out = mdf.compare_detrend_windows(rows)
    assert out["n_compared"] == 3
    assert out["n_improved"] == 2
    assert out["best_window_counts"] == {10.0: 1, 30.0: 1, 20.0: 1}
    gains = sorted(s["gain_rearth"] for s in out["stars"])
    assert out["median_gain_rearth"] == gains[1]
