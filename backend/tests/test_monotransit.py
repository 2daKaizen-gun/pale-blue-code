"""sub-11-2 single-transit search — TDD.

Light 1 targets the pure primitive: the trapezoidal transit template and the
matched-filter single-event statistic. A synthetic single dip in white noise
drives it — no folding, no repetition, one event.
"""

import numpy as np

from services import monotransit as mt

_CADENCE = 0.0139          # TESS 2-minute cadence, days
_SPAN = 27.0               # a single TESS sector
_T0 = 12.0                 # one dip, mid-sector
_DURATION = 0.4            # total first-to-last contact, days
_DEPTH = 0.01              # 1% dip
_NOISE = 5e-4


def _lc(depth=_DEPTH, seed=0, noise=_NOISE):
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = mt.transit_model(time, _T0, _DURATION, depth)
    flux = flux + rng.normal(0.0, noise, size=time.shape)
    return time, flux


# ---- transit_shape / transit_model -------------------------------------------

def test_shape_is_zero_outside_and_one_on_floor():
    time = np.linspace(_T0 - 1.0, _T0 + 1.0, 2001)
    s = mt.transit_shape(time, _T0, _DURATION)
    # dead center is on the flat floor
    assert s[np.argmin(np.abs(time - _T0))] == 1.0
    # a point well outside the transit is untouched
    assert s[np.argmin(np.abs(time - (_T0 + 1.0)))] == 0.0
    assert s.min() == 0.0 and s.max() == 1.0


def test_shape_ramps_linearly_on_ingress():
    # a point halfway along the ingress ramp should be ~0.5
    half = 0.5 * _DURATION
    flat_half = half * (1.0 - 2.0 * mt._INGRESS_FRAC)
    mid_ramp = _T0 - (flat_half + 0.5 * (half - flat_half))
    s = mt.transit_shape(np.array([mid_ramp]), _T0, _DURATION)
    assert abs(s[0] - 0.5) < 0.05


def test_model_floor_reaches_full_depth():
    flux = mt.transit_model(np.array([_T0]), _T0, _DURATION, _DEPTH)
    assert abs((1.0 - flux[0]) - _DEPTH) < 1e-12


# ---- matched_filter_score ----------------------------------------------------

def test_recovers_injected_depth():
    time, flux = _lc(depth=_DEPTH, seed=1)
    out = mt.matched_filter_score(time, flux, _T0, _DURATION)
    assert abs(out["depth"] - _DEPTH) < 0.1 * _DEPTH
    assert out["n_in"] > 0


def test_real_dip_scores_high_ses():
    time, flux = _lc(depth=_DEPTH, seed=2)
    out = mt.matched_filter_score(time, flux, _T0, _DURATION)
    assert out["ses"] > 20.0            # a clean 1% dip is a loud single event


def test_pure_noise_scores_near_zero():
    rng = np.random.default_rng(3)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = 1.0 + rng.normal(0.0, _NOISE, size=time.shape)
    out = mt.matched_filter_score(time, flux, _T0, _DURATION)
    assert abs(out["ses"]) < 5.0        # no transit here → no significant score


def test_shallower_dip_scores_lower_than_deeper():
    time_a, flux_a = _lc(depth=0.002, seed=4)
    time_b, flux_b = _lc(depth=0.01, seed=4)
    ses_a = mt.matched_filter_score(time_a, flux_a, _T0, _DURATION)["ses"]
    ses_b = mt.matched_filter_score(time_b, flux_b, _T0, _DURATION)["ses"]
    assert ses_b > ses_a


def test_template_off_the_data_scores_zero():
    time, flux = _lc()
    out = mt.matched_filter_score(time, flux, _SPAN + 5.0, _DURATION)
    assert out["ses"] == 0.0 and out["n_in"] == 0
