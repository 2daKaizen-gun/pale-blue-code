"""Sub-10-3 L4c — the SG detrend window, in days rather than points.

`_detrend` used to convert its 30-day window with a hardcoded Kepler cadence, so on
TESS 2-min data the window was really ~2 days and the filter divided away part of the
transit. These tests pin the behaviour the fix has to keep:

  * the window is derived from the cadence of the data, so 30 days means 30 days on
    any mission (Kepler's 1470 points are unchanged);
  * a segment shorter than the window shrinks the window instead of being skipped —
    the case that left a single TESS sector completely undetrended;
  * but not below _MIN_WINDOW_DAYS, where the filter would cost more transit depth
    than the trend it removes;
  * a transit survives detrending on TESS-cadence data (injection-recovery, the same
    measurement scripts/measure_detrend_window.py runs against the real sky);
  * flux comes back in the caller's ordering, since callers pair it with their own
    unsorted `time`.
"""

import numpy as np

from services import bls as bls_service

_KEPLER_CADENCE = 0.0204        # 29.4 min long cadence
_TESS_CADENCE = 2.0 / 60 / 24   # 2 min, in days


def _curve(cadence, span, period=6.0, depth=0.005, duration=0.15, slope=0.0, seed=0):
    """Flat-baseline light curve with a box transit, optional linear trend."""
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, span, cadence)
    flux = np.ones_like(time) + slope * time
    phase = np.abs((time + period / 2) % period - period / 2)
    in_transit = phase < duration / 2
    flux[in_transit] *= 1.0 - depth
    flux += rng.normal(0.0, 1e-4, size=time.shape)
    return time, flux, in_transit


def _depth(flux, in_transit):
    """Depth the vetter would measure: in-transit vs out-of-transit median."""
    return 1.0 - np.median(flux[in_transit]) / np.median(flux[~in_transit])


def test_cadence_is_measured_from_the_data():
    time = np.arange(0.0, 10.0, _TESS_CADENCE)
    assert bls_service._cadence_days(time) == float(
        np.median(np.diff(time)))


def test_cadence_survives_gaps():
    """A downlink gap must not drag the cadence estimate up (median, not mean)."""
    a = np.arange(0.0, 5.0, _TESS_CADENCE)
    b = np.arange(8.0, 13.0, _TESS_CADENCE)
    got = bls_service._cadence_days(np.concatenate([a, b]))
    assert abs(got - _TESS_CADENCE) < 1e-9


def test_kepler_window_is_unchanged():
    """The Kepler path must land on exactly the historical 1470-point window."""
    assert int(bls_service._DETREND_WINDOW_DAYS / _KEPLER_CADENCE) == 1470


def test_tess_transit_survives_detrend():
    """The regression that started this: a 0.5% transit kept most of its depth.

    The old fixed 1470-point window spanned ~2 days at this cadence and removed ~18%
    of the depth on real data; the cadence-derived window has to do far better.
    """
    time, flux, in_transit = _curve(_TESS_CADENCE, span=24.0)
    before = _depth(flux, in_transit)
    after = _depth(bls_service._detrend(time, flux), in_transit)
    assert after / before > 0.95


def test_short_segment_is_detrended_not_skipped():
    """A 24-day TESS sector is shorter than 30 days — it must still get detrended.

    With the old `if n < win: continue` this light curve came back untouched, so a
    real instrumental slope would have gone straight into BLS.
    """
    time, flux, _ = _curve(_TESS_CADENCE, span=24.0, slope=2e-3)
    flat = bls_service._detrend(time, flux)
    assert not np.allclose(flat, flux)
    # the injected slope is gone: both halves sit at the same level
    half = len(flat) // 2
    assert abs(np.median(flat[:half]) - np.median(flat[half:])) < 1e-3


def test_segment_below_floor_is_left_alone():
    """Under _MIN_WINDOW_DAYS the cure is worse than the disease — skip instead."""
    span = bls_service._MIN_WINDOW_DAYS / 2
    time, flux, _ = _curve(_TESS_CADENCE, span=span, period=1.0, duration=0.05)
    assert np.array_equal(bls_service._detrend(time, flux), flux)


def test_output_keeps_the_callers_ordering():
    """Callers keep their own `time`; returning sorted flux would mismatch them."""
    time, flux, _ = _curve(_TESS_CADENCE, span=24.0, slope=2e-3)
    shuffle = np.random.default_rng(1).permutation(len(time))
    t_shuffled, f_shuffled = time[shuffle], flux[shuffle]

    flat_shuffled = bls_service._detrend(t_shuffled, f_shuffled)
    flat_sorted = bls_service._detrend(time, flux)

    # same star, same answer, each in the order its caller supplied
    assert np.allclose(flat_shuffled, flat_sorted[shuffle])


def test_degenerate_input_is_returned_unchanged():
    """One point has no cadence to measure; must not raise."""
    time = np.array([1.0])
    flux = np.array([1.0])
    assert np.array_equal(bls_service._detrend(time, flux), flux)


def test_window_days_none_equals_the_production_constant():
    """The default (None) must reproduce the 30-day window exactly — no behaviour change."""
    time, flux, _ = _curve(_TESS_CADENCE, span=24.0, slope=2e-3)
    default = bls_service._detrend(time, flux)
    explicit = bls_service._detrend(time, flux, window_days=bls_service._DETREND_WINDOW_DAYS)
    assert np.array_equal(default, explicit)


def test_shorter_window_removes_more_transit_depth():
    """A window near the transit duration follows the dip and divides more of it away.

    This is the knob path A's lever-2 sweep turns: a smaller window is a more aggressive
    detrend, so a real transit keeps *less* depth. Pinning the direction guards the
    parameter's meaning — the measurement reads a smaller number here as 'over-detrended'.
    """
    time, flux, in_transit = _curve(_TESS_CADENCE, span=24.0)
    kept_30d = _depth(bls_service._detrend(time, flux, window_days=30.0), in_transit)
    kept_6d = _depth(bls_service._detrend(time, flux, window_days=6.0), in_transit)
    assert kept_6d < kept_30d
