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

def test_observed_transits_counts_epochs_with_data():
    """Continuous coverage: every epoch in the span really is observed."""
    time, _, best = make_planet()                 # 60 d at P=3 d
    assert vet.observed_transits(time, best) == 20
    assert vet.observed_transits(np.array([]), best) == 0
    assert vet.observed_transits(time, {**best, "period": 0.0}) == 0


def test_observed_transits_ignores_epochs_that_fell_in_gaps():
    """The distinction TESS forces: a long span is not the same as long coverage.

    Two short visits far apart span 40 days — floor(40/3) would claim 13 transits —
    but the star was only watched across four of those epochs. Counting the other
    nine, which happened where no data exists, is how a verdict resting on almost
    nothing called itself well-supported.
    """
    time, _, best = make_planet()
    visit_a = time[time < 6.0]                    # 2 transits
    visit_b = time[(time > 33.5) & (time < 39.0)] # 2 more, a month later
    sparse = np.concatenate([visit_a, visit_b])
    assert sparse.max() - sparse.min() > 34.0
    assert vet.observed_transits(sparse, best) == 4


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


# ── detection significance (nail 5) ──────────────────────────────────────────

def make_noise(seed=1):
    """Flat curve, no transit injected — BLS latched onto nothing real. `best` still
    points at a period, as it would after run_bls picked a spurious peak."""
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = np.ones_like(time) + rng.normal(0.0, _NOISE, size=time.shape)
    best = {"period": _PERIOD, "duration": _DURATION, "depth": 0.005, "transit_time": _T0}
    return time, flux, best


def make_single_transit(seed=0):
    """A span holding exactly one transit — no transit-to-transit scatter to measure."""
    rng = np.random.default_rng(seed)
    time = np.arange(0.0, 2.5, _CADENCE)          # < 2 periods → one transit at _T0
    flux = np.ones_like(time)
    flux[np.abs(_phase(time, _T0, _PERIOD)) < _DURATION / 2] -= 0.01
    flux += rng.normal(0.0, _NOISE, size=time.shape)
    best = {"period": _PERIOD, "duration": _DURATION, "depth": 0.01, "transit_time": _T0}
    return time, flux, best


def test_significance_high_for_coherent_planet():
    # Every transit dims by the same amount → the between-transit statistic is large.
    time, flux, best = make_planet()
    sig = vet.detection_significance(time, flux, best)
    assert sig is not None and sig >= vet._SIG_MIN


def test_significance_low_for_noise():
    # No real signal → per-transit "depths" are just scatter, statistic near zero.
    time, flux, best = make_noise()
    sig = vet.detection_significance(time, flux, best)
    assert sig is not None and sig < vet._SIG_MIN


def test_significance_held_on_single_transit():
    # One transit has no transit-to-transit scatter — judgment is held, not made.
    time, flux, best = make_single_transit()
    assert vet.detection_significance(time, flux, best) is None


def test_insignificant_report_skips_the_four_gates():
    # A signal below the bar never reaches the gates: nothing is vetted, no trust claimed.
    time, flux, best = make_noise()
    report = vet.build_report(7318157, time, flux, best, mission="tess", sector_count=1)
    assert report.trust == "insignificant"
    assert report.checks == []                      # no gate ran
    assert report.passed_count == 0 and report.total == 0
    assert report.significant is False
    assert report.significance is not None and report.significance < vet._SIG_MIN
    assert report.provisional is False              # never invents confidence


def test_significant_report_still_runs_the_gates():
    # A real detection passes the precondition and is vetted exactly as before.
    time, flux, best = make_planet()
    report = vet.build_report(11446443, time, flux, best)
    assert report.trust == "strong"
    assert len(report.checks) == 4
    assert report.significant is True
    assert report.significance is not None and report.significance >= vet._SIG_MIN


def test_single_transit_is_vetted_not_gated_out():
    # Held significance (k<2) must not be mistaken for a failure — the gates still run,
    # and single-event significance is deferred to sub-11-2+ (monotransits).
    time, flux, best = make_single_transit()
    report = vet.build_report(102029734, time, flux, best, mission="tess", sector_count=1)
    assert report.trust != "insignificant"
    assert report.significance is None
    assert report.significant is True
    assert len(report.checks) == 4


def test_legacy_vetting_report_defaults_to_significant():
    # A vet_*.json written before nail 5 has neither field — it must still validate,
    # defaulting to significant so old caches are not silently voided.
    from models.vetting import VettingReport
    legacy = VettingReport(
        kic_id=1, period=3.0, bls_period=3.0, alias_factor=1.0, checks=[],
        passed_count=4, total=4, trust="strong",
    )
    assert legacy.significant is True
    assert legacy.significance is None
