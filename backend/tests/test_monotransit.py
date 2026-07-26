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


# ---- search: isolated single-transit recovery --------------------------------

def test_finds_the_single_injected_dip():
    time, flux = _lc(depth=_DEPTH, seed=10)
    events = mt.search(time, flux)
    assert len(events) >= 1
    top = events[0]                      # strongest single event
    assert abs(top["t0"] - _T0) < 0.1    # located to within a fraction of a day
    assert abs(top["depth"] - _DEPTH) < 0.3 * _DEPTH
    assert top["ses"] > 20.0


def test_excludes_a_repeating_pair():
    # two dips of equal depth, half a sector apart — a folded search would catch
    # this, so the monotransit list must not claim it as a single event
    rng = np.random.default_rng(11)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = mt.transit_model(time, 8.0, _DURATION, _DEPTH)
    flux *= mt.transit_model(time, 20.0, _DURATION, _DEPTH)
    flux = flux + rng.normal(0.0, _NOISE, size=time.shape)
    events = mt.search(time, flux)
    # neither equal-depth dip survives as a "single" transit
    assert not any(
        abs(e["t0"] - 8.0) < 0.5 or abs(e["t0"] - 20.0) < 0.5 for e in events
    )


def test_lone_dip_survives_among_shallow_noise():
    # one real dip; the rest is noise. The dip has no comparable-depth twin, so it
    # is not mistaken for a repeating series and remains the top candidate.
    time, flux = _lc(depth=_DEPTH, seed=12)
    events = mt.search(time, flux)
    assert events and abs(events[0]["t0"] - _T0) < 0.1


# ---- significance_red: red-noise-aware single-event significance --------------

def test_clean_dip_clears_threshold():
    time, flux = _lc(depth=_DEPTH, seed=20)
    z = mt.significance_red(time, flux, _T0, _DURATION)
    assert z is not None and z > mt._SIG_MIN_MONO


def test_noise_epoch_stays_below_threshold():
    rng = np.random.default_rng(21)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = 1.0 + rng.normal(0.0, _NOISE, size=time.shape)
    z = mt.significance_red(time, flux, _T0, _DURATION)   # no dip here
    assert z is not None and z < mt._SIG_MIN_MONO


def test_red_noise_deflates_significance():
    # the same dip, same depth, on a flat star vs a slowly wobbling (red) one. The
    # wobble makes same-duration control windows scatter wider, so the honest
    # significance is lower on the restless star even though the dip is identical.
    rng = np.random.default_rng(22)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, _T0, _DURATION, _DEPTH)

    white = dip + rng.normal(0.0, _NOISE, size=time.shape)
    wobble = 0.003 * np.sin(2 * np.pi * time / 2.5)       # ~2.5-day correlated drift
    red = dip + wobble + rng.normal(0.0, _NOISE, size=time.shape)

    z_white = mt.significance_red(time, white, _T0, _DURATION)
    z_red = mt.significance_red(time, red, _T0, _DURATION)
    assert z_white > z_red


def test_too_short_baseline_is_held():
    # only a couple of days: not enough control windows to form a null → held (None)
    time = np.arange(0.0, 2.0, _CADENCE)
    flux = mt.transit_model(time, 1.0, _DURATION, _DEPTH)
    z = mt.significance_red(time, flux, 1.0, _DURATION)
    assert z is None


# ---- discriminators: the lone-event guard ------------------------------------

def _check(result, name):
    return next(c for c in result["checks"] if c["name"] == name)


def _event(t0=_T0, depth=_DEPTH, duration=_DURATION):
    return {"t0": t0, "duration": duration, "depth": depth}


def test_real_transit_passes_every_discriminator():
    time, flux = _lc(depth=_DEPTH, seed=30)
    res = mt.discriminators(time, flux, _event())
    assert res["passed"]
    assert all(c["passed"] for c in res["checks"])


def test_momentum_dump_fails_coherence():
    # a single-cadence downward spike: the deficit is dumped into one point
    rng = np.random.default_rng(31)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = 1.0 + rng.normal(0.0, _NOISE, size=time.shape)
    flux[np.argmin(np.abs(time - _T0))] -= 0.05
    res = mt.discriminators(time, flux, _event())
    assert not _check(res, "coherence")["passed"]
    assert not res["passed"]


def test_stellar_flare_fails_flare_check():
    # a bright spike beside the dip — a flare, not a body
    rng = np.random.default_rng(32)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = mt.transit_model(time, _T0, _DURATION, _DEPTH) + rng.normal(0.0, _NOISE, size=time.shape)
    flux[np.abs(time - (_T0 + 0.15)) < 0.02] += 0.03
    res = mt.discriminators(time, flux, _event())
    assert not _check(res, "flare")["passed"]
    assert not res["passed"]


def test_one_sided_ramp_fails_symmetry():
    # deficit on the ingress side only — no real central transit looks like this
    rng = np.random.default_rng(33)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = 1.0 + rng.normal(0.0, _NOISE, size=time.shape)
    left = (time < _T0) & (time > _T0 - _DURATION / 2)
    flux[left] -= _DEPTH
    res = mt.discriminators(time, flux, _event())
    assert not _check(res, "symmetry")["passed"]


def test_event_on_a_segment_edge_fails_edge():
    time, flux = _lc(depth=_DEPTH, seed=34)
    res = mt.discriminators(time, flux, _event(t0=float(time[-1]) - 0.1))
    assert not _check(res, "edge")["passed"]
