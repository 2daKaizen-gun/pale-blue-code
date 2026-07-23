import json

import pandas as pd

from services.archive import _frame_to_planets


# The regression this guards: the deployed /api/planets list 500'd because NaN
# floats leaked into the response and Starlette's JSONResponse renders with
# allow_nan=False. Individual planets (no NaN) served fine, hiding it. These tests
# pin that missing numbers come out as JSON null and the payload is allow_nan-safe.


def _frame(rows):
    return pd.DataFrame(rows)


def test_missing_floats_become_none_not_nan():
    df = _frame([
        {"pl_name": "X b", "hostname": "X", "discoverymethod": "Transit",
         "pl_masse": None, "pl_eqt": float("nan"), "pl_orbper": 3.5},
    ])
    p = _frame_to_planets(df)[0]
    assert p.pl_orbper == 3.5
    assert p.pl_masse is None
    assert p.pl_eqt is None  # NaN, not a NaN float


def test_result_is_json_serializable_with_allow_nan_false():
    # Exactly the condition Starlette imposes on the response.
    df = _frame([
        {"pl_name": "A b", "hostname": "A", "discoverymethod": "Transit", "pl_masse": float("nan")},
        {"pl_name": "B c", "hostname": "B", "discoverymethod": "RV", "pl_eqt": float("inf")},
        {"pl_name": "C d", "hostname": "C", "discoverymethod": "Transit", "pl_orbper": 12.0},
    ])
    planets = _frame_to_planets(df)
    payload = [p.model_dump() for p in planets]
    # Must not raise "Out of range float values are not JSON compliant".
    json.dumps(payload, allow_nan=False)


def test_non_finite_floats_are_scrubbed():
    df = _frame([
        {"pl_name": "Inf b", "hostname": "Inf", "discoverymethod": "Transit",
         "pl_orbper": float("inf"), "pl_rade": float("-inf")},
    ])
    p = _frame_to_planets(df)[0]
    assert p.pl_orbper is None
    assert p.pl_rade is None


def test_rows_without_name_or_host_are_dropped():
    df = _frame([
        {"pl_name": "Good b", "hostname": "Good", "discoverymethod": "Transit"},
        {"pl_name": None, "hostname": "NoName", "discoverymethod": "Transit"},
        {"pl_name": "NoHost b", "hostname": None, "discoverymethod": "Transit"},
    ])
    names = [p.pl_name for p in _frame_to_planets(df)]
    assert names == ["Good b"]


def test_nullable_ints_survive_as_ints_or_none():
    df = _frame([
        {"pl_name": "I b", "hostname": "I", "discoverymethod": "Transit",
         "disc_year": 2019, "sy_pnum": None},
    ])
    p = _frame_to_planets(df)[0]
    assert p.disc_year == 2019
    assert p.sy_pnum is None
