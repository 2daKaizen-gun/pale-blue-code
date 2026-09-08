"""predict_earth_reach pins path A's widening predictor over the caches.

The fit + ranking is fed by slow cache reads; these tests pin the pure math — the log-linear floor
fit recovers a known relation and drops degenerate floors, the predicted reach converts correctly,
the ranking is sharpest-first with unknowns last, and the held-out validation reports the honest
precision/recall shape — so the "weak, one-sided predictor" conclusion the check doc reports cannot
drift.
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import pool_assessment as pa   # noqa: E402

import predict_earth_reach as per   # noqa: E402


def test_fit_recovers_a_known_log_linear_relation():
    a, b = -9.5, 0.35
    # 21 points over Tmag 5..15 (floors stay below the degenerate cap), enough to fit honestly
    rows = [{"tmag": 5.0 + 0.5 * i, "floor": math.exp(a + b * (5.0 + 0.5 * i))} for i in range(21)]
    model = per.fit_floor_model(rows)
    assert model is not None
    assert abs(model["a"] - a) < 1e-6
    assert abs(model["b"] - b) < 1e-6
    assert model["r2"] > 0.999          # perfect relation


def test_fit_drops_degenerate_floors_and_missing_values():
    rows = [{"tmag": tm, "floor": 0.001} for tm in range(5, 26)]   # 21 clean points
    rows.append({"tmag": 12.0, "floor": 0.38})   # degenerate (>= cap) — must be excluded
    rows.append({"tmag": None, "floor": 0.001})  # missing tmag — excluded
    model = per.fit_floor_model(rows)
    assert model["n"] == 21                       # only the clean points fit


def test_fit_returns_none_when_too_few_points():
    rows = [{"tmag": 10.0, "floor": 0.001} for _ in range(5)]
    assert per.fit_floor_model(rows) is None


def test_predict_min_rearth_matches_the_floor_conversion():
    model = {"a": -9.5, "b": 0.35, "n": 30, "r2": 0.2}
    floor = per.predict_floor(10.0, model)
    expected = pa.rjup_to_rearth(pa.min_detectable_planet_radius(0.2, floor))
    assert per.predict_min_rearth(0.2, 10.0, model) == expected


def test_predict_min_rearth_is_none_without_radius_or_tmag():
    model = {"a": -9.5, "b": 0.35, "n": 30, "r2": 0.2}
    assert per.predict_min_rearth(None, 10.0, model) is None
    assert per.predict_min_rearth(0.2, None, model) is None


def test_rank_is_sharpest_first_with_unknowns_last():
    model = {"a": -9.5, "b": 0.35, "n": 30, "r2": 0.2}
    rows = [
        {"tic": 1, "tmag": 13.0, "radius": 0.5},   # faint + larger -> worse reach
        {"tic": 2, "tmag": 8.0, "radius": 0.2},    # bright + tiny -> best reach
        {"tic": 3, "tmag": None, "radius": 0.2},   # no prediction -> last
    ]
    ranked = per.rank_candidates(rows, model)
    assert [r["tic"] for r in ranked] == [2, 1, 3]
    assert ranked[0]["pred_min_rearth"] < ranked[1]["pred_min_rearth"]
    assert ranked[-1]["pred_min_rearth"] is None
    assert ranked[-1]["earth_size"] is False


def test_earth_size_flag_respects_the_threshold():
    model = {"a": -9.5, "b": 0.35, "n": 30, "r2": 0.2}
    # a tiny bright dwarf should clear Earth-size; a larger faint one should not
    tiny = per.rank_candidates([{"tic": 1, "tmag": 6.0, "radius": 0.15}], model)[0]
    big = per.rank_candidates([{"tic": 2, "tmag": 13.0, "radius": 1.0}], model)[0]
    assert tiny["earth_size"] is True
    assert big["earth_size"] is False


def test_validate_reports_precision_recall_on_a_held_out_half():
    # A clean, brightness-driven world: floor = exp(a+b*tmag), radius fixed, so a Tmag threshold
    # separates Earth-size perfectly -> precision and recall both 1.0 on the held-out half.
    a, b = -9.5, 0.35
    # 60 stars over Tmag 5.0..16.8 (floors below the cap), radius fixed so a Tmag threshold
    # separates Earth-size cleanly; even/odd split gives 30 train / 30 test.
    rows = [{"tmag": 5.0 + 0.2 * i, "radius": 0.2, "floor": math.exp(a + b * (5.0 + 0.2 * i))}
            for i in range(60)]
    out = per.validate_reach_prediction(rows)
    assert out is not None
    assert out["precision"] == 1.0
    assert out["recall"] == 1.0
    assert out["median_abs_err_rearth"] < 0.05    # near-perfect on synthetic data
