"""Sub-9-1 vetting engine — TDD.

Synthetic light curves drive the four gates:
  * a model planet   → equal odd/even depths, no secondary, flat (U) bottom,
                       planet-range size  → all four pass → trust "strong"
  * a model eclipsing binary → odd/even depth mismatch + secondary eclipse
                       → two hard fails → trust "unlikely"

The curves are already flat (baseline 1.0), so no detrending is applied here —
these tests target the pure check functions, not the cache loader.
"""

import numpy as np
import pytest

from services import vetting as vet

_CADENCE = 0.0204          # Kepler long-cadence, days
_SPAN = 60.0               # days → ~20 transits at P=3d
_T0 = 1.0
_PERIOD = 3.0
_DURATION = 0.2
_NOISE = 5e-4


def _phase(time, t0, period):
    """Signed phase in [-P/2, P/2)."""
    return ((time - t0 + 0.5 * period) % period) - 0.5 * period


def make_planet(depth=0.01, seed=0):
    """Box transit, equal depth every period, no secondary, flat bottom."""
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = np.ones_like(time)
    in_transit = np.abs(_phase(time, _T0, _PERIOD)) < _DURATION / 2
    flux[in_transit] -= depth
    flux += rng.normal(0.0, _NOISE, size=time.shape)
    best = {
        "period": _PERIOD,
        "duration": _DURATION,
        "depth": depth,
        "transit_time": _T0,
    }
    return time, flux, best


def make_eclipsing_binary(depth_odd=0.05, depth_even=0.03, sec_depth=0.02, seed=1):
    """Odd/even depth mismatch (BLS locked on half the true period) plus a
    secondary eclipse at phase 0.5 — two independent hard EB signatures."""
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = np.ones_like(time)

    n = np.round((time - _T0) / _PERIOD).astype(int)
    in_primary = np.abs(_phase(time, _T0, _PERIOD)) < _DURATION / 2
    flux[in_primary & (n % 2 == 1)] -= depth_odd
    flux[in_primary & (n % 2 == 0)] -= depth_even

    # secondary eclipse half a period after each primary
    phase_from_t0 = (time - _T0) % _PERIOD
    in_secondary = np.abs(phase_from_t0 - 0.5 * _PERIOD) < _DURATION / 2
    flux[in_secondary] -= sec_depth

    flux += rng.normal(0.0, _NOISE, size=time.shape)
    best = {
        "period": _PERIOD,
        "duration": _DURATION,
        "depth": depth_odd,
        "transit_time": _T0,
    }
    return time, flux, best


# ── individual gates ────────────────────────────────────────────────────────

def test_planet_odd_even_passes():
    time, flux, best = make_planet()
    c = vet.check_odd_even(time, flux, best)
    assert c.name == "odd_even"
    assert c.passed is True
    assert c.hard is False


def test_eb_odd_even_fails_hard():
    time, flux, best = make_eclipsing_binary()
    c = vet.check_odd_even(time, flux, best)
    assert c.passed is False
    assert c.hard is True
    assert c.metrics["sigma"] > 3.0


def test_odd_even_error_scales_with_transits_not_samples():
    """A planet on a spotted star must survive (sub-10-3 L4d regression).

    Each transit sits on its own local flux level, as stellar variability makes it.
    The depths differ from transit to transit but not systematically between odd and
    even, so this is a planet and the gate must say so.

    The old code divided the in-transit scatter by sqrt(number of samples), treating
    108 correlated points inside one transit as 108 independent measurements. That
    shrank the claimed error until ordinary variability read as a hard binary
    signature — measured at up to 83% false rejection on real TESS data. Sampling
    finer must not manufacture confidence, so the same curve is checked at Kepler
    and TESS cadence: the verdict has to be the same.
    """
    for cadence in (_CADENCE, 2.0 / 60 / 24):
        rng = np.random.default_rng(7)
        time = np.arange(0.0, _SPAN, cadence)
        flux = np.ones_like(time)
        in_transit = np.abs(_phase(time, _T0, _PERIOD)) < _DURATION / 2
        epoch = np.round((time - _T0) / _PERIOD).astype(int)
        # per-transit offsets: same size as the transit itself, no odd/even pattern
        for e in np.unique(epoch[in_transit]):
            flux[in_transit & (epoch == e)] -= 0.01 * (1.0 + rng.normal(0.0, 0.15))
        flux += rng.normal(0.0, _NOISE, size=time.shape)
        best = {"period": _PERIOD, "duration": _DURATION, "depth": 0.01,
                "transit_time": _T0}

        c = vet.check_odd_even(time, flux, best)
        assert c.passed is True, f"clean planet rejected at cadence {cadence}"
        assert c.metrics["transits_odd"] >= 2


def test_odd_even_holds_judgment_on_one_transit_per_side():
    """Two transits cannot reveal transit-to-transit scatter — so do not rule."""
    time, flux, best = make_planet()
    keep = time < _T0 + 1.5 * _PERIOD          # one odd + one even transit
    c = vet.check_odd_even(time[keep], flux[keep], best)
    assert c.passed is True
    assert c.hard is False
    assert c.metrics["sigma"] == 0.0           # explicitly held, not measured


def test_planet_secondary_passes():
    time, flux, best = make_planet()
    c = vet.check_secondary(time, flux, best)
    assert c.name == "secondary"
    assert c.passed is True


def test_eb_secondary_fails_hard():
    time, flux, best = make_eclipsing_binary()
    c = vet.check_secondary(time, flux, best)
    assert c.passed is False
    assert c.hard is True


def test_planet_shape_passes():
    time, flux, best = make_planet()
    c = vet.check_shape(time, flux, best)
    assert c.name == "shape"
    assert c.hard is False          # shape is a soft indicator
    assert c.passed is True
    assert c.metrics["flat_frac"] >= 0.2


def test_planet_size_passes():
    time, flux, best = make_planet()
    c = vet.check_size(time, flux, best)
    assert c.name == "size"
    assert c.passed is True
    assert c.metrics["snr"] >= 7.0
    assert c.metrics["rp_rs"] <= 0.25


def test_oversized_depth_size_fails_hard():
    # depth 0.09 → Rp/Rs = 0.30 > 0.25 → stellar-sized companion
    time, flux, best = make_planet(depth=0.09)
    c = vet.check_size(time, flux, best)
    assert c.passed is False
    assert c.hard is True
    assert c.metrics["rp_rs"] > 0.25


# ── synthesis ───────────────────────────────────────────────────────────────

def test_planet_report_strong():
    time, flux, best = make_planet()
    report = vet.build_report(11446443, time, flux, best)
    assert report.total == 4
    assert report.passed_count == 4
    assert report.trust == "strong"
    assert report.kic_id == 11446443
    assert report.period == pytest.approx(_PERIOD)
    assert report.bls_period == pytest.approx(_PERIOD)
    assert report.alias_factor == pytest.approx(1.0)


# ── de-aliasing (recover the fundamental period BLS aliased away) ─────────────

def test_dealias_noop_when_period_is_true():
    time, flux, best = make_planet()
    corrected, factor = vet._dealias(time, flux, best)
    assert factor == pytest.approx(1.0)
    assert corrected["period"] == pytest.approx(_PERIOD)


def test_dealias_recovers_from_half_period_alias():
    # BLS locked onto half the true period (the KIC 11446443 pattern)
    time, flux, best = make_planet()
    aliased = dict(best, period=_PERIOD / 2)
    corrected, factor = vet._dealias(time, flux, aliased)
    assert factor == pytest.approx(2.0, rel=0.02)
    assert corrected["period"] == pytest.approx(_PERIOD, rel=0.02)


def test_dealias_recovers_from_double_period_superharmonic():
    # BLS locked onto twice the true period → two dips per fold
    time, flux, best = make_planet()
    aliased = dict(best, period=_PERIOD * 2)
    corrected, factor = vet._dealias(time, flux, aliased)
    assert factor == pytest.approx(0.5, rel=0.02)
    assert corrected["period"] == pytest.approx(_PERIOD, rel=0.02)


def test_dealiased_planet_reports_true_period_and_factor():
    time, flux, best = make_planet()
    aliased = dict(best, period=_PERIOD / 2)
    report = vet.build_report(11446443, time, flux, aliased)
    assert report.bls_period == pytest.approx(_PERIOD / 2)
    assert report.period == pytest.approx(_PERIOD, rel=0.02)
    assert report.alias_factor == pytest.approx(2.0, rel=0.02)
    assert report.trust == "strong"


def test_eb_report_unlikely():
    time, flux, best = make_eclipsing_binary()
    report = vet.build_report(9999999, time, flux, best)
    assert report.trust == "unlikely"
    assert any(c.hard and not c.passed for c in report.checks)


def _check(name, passed, hard):
    from models.vetting import VettingCheck
    return VettingCheck(name=name, passed=passed, hard=hard, metrics={})


def test_synthesize_hard_fail_is_unlikely():
    checks = [
        _check("odd_even", False, True),   # single hard fail
        _check("secondary", True, True),
        _check("shape", True, False),
        _check("size", True, False),
    ]
    assert vet.synthesize(checks) == "unlikely"


def test_synthesize_all_pass_is_strong():
    checks = [
        _check("odd_even", True, True),
        _check("secondary", True, True),
        _check("shape", True, False),
        _check("size", True, False),
    ]
    assert vet.synthesize(checks) == "strong"


def test_synthesize_one_soft_fail_is_weak():
    checks = [
        _check("odd_even", True, True),
        _check("secondary", True, True),
        _check("shape", False, False),     # soft fail only
        _check("size", True, False),
    ]
    assert vet.synthesize(checks) == "weak"


def test_synthesize_two_soft_fails_is_unlikely():
    checks = [
        _check("odd_even", True, True),
        _check("secondary", True, True),
        _check("shape", False, False),
        _check("size", False, False),
    ]
    assert vet.synthesize(checks) == "unlikely"   # n_pass == 2


# ── honesty nail 4 (Phase 10): confidence scales with how much we watched ──────

def test_transit_count_is_floor_baseline_over_period():
    assert vet.transit_count(27.0, 3.0) == 9      # a hot Jupiter in one TESS sector
    assert vet.transit_count(27.0, 13.0) == 2     # a longer period → only 2 epochs
    assert vet.transit_count(0.0, 3.0) == 0
    assert vet.transit_count(27.0, 0.0) == 0      # guards against divide-by-zero


def test_is_provisional_only_downgrades_thin_strong():
    assert vet.is_provisional("strong", vet._N_MIN_TRANSITS - 1) is True
    assert vet.is_provisional("strong", vet._N_MIN_TRANSITS) is False
    assert vet.is_provisional("weak", 1) is False        # never invents concern
    assert vet.is_provisional("unlikely", 0) is False


def test_long_baseline_strong_is_not_provisional():
    # Kepler-length span (~60 d, ~20 transits at P=3d): a strong verdict stands.
    time, flux, best = make_planet()
    report = vet.build_report(11446443, time, flux, best)
    assert report.trust == "strong"
    assert report.transit_count >= vet._N_MIN_TRANSITS
    assert report.provisional is False
    assert report.mission == "kepler"               # default
    assert report.sector_count is None              # not TESS
    assert report.baseline_days == pytest.approx(_SPAN, abs=_CADENCE)


def test_short_baseline_strong_is_provisional():
    # The same clean planet, but observed for only ~13 days → ~4 transits
    # (< _N_MIN_TRANSITS). The gate math is untouched, so trust stays "strong";
    # provisional is the honest flag that the base is thin (nail 4).
    time, flux, best = make_planet()
    m = time < 13.0
    report = vet.build_report(42, time[m], flux[m], best, mission="tess", sector_count=1)
    assert report.trust == "strong"
    assert report.transit_count < vet._N_MIN_TRANSITS
    assert report.provisional is True
    assert report.mission == "tess"
    assert report.sector_count == 1
    assert report.baseline_days == pytest.approx(time[m][-1] - time[m][0])
