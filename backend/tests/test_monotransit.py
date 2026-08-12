"""sub-11-2 single-transit search — TDD.

Light 1 targets the pure primitive: the trapezoidal transit template and the
matched-filter single-event statistic. A synthetic single dip in white noise
drives it — no folding, no repetition, one event.
"""

import json
import math

import numpy as np
import pytest

from services import bls as bls_service
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


# ---- the hunt: many stars, one honest ledger (sub-11-3 Light 1) --------------

def _cand(candidate=False, significant=False, significance=1.0, failed=()):
    """A minimal run_monotransit-style event, for the pure classifier tests."""
    checks = [{"name": n, "passed": n not in failed, "value": 0.0}
              for n in ("edge", "coherence", "flare", "symmetry")]
    return {"t0": _T0, "duration": _DURATION, "depth": _DEPTH, "ses": 10.0,
            "significance": significance, "significant": significant,
            "checks": checks, "passed": not failed, "candidate": candidate}


def test_event_disposition_reads_each_outcome():
    assert mt._event_disposition(_cand(candidate=True, significant=True, significance=9.0)) == "candidate"
    assert mt._event_disposition(_cand(significant=True, significance=9.0, failed={"edge"})) == "rejected"
    assert mt._event_disposition(_cand(significance=None)) == "held"
    assert mt._event_disposition(_cand(significance=1.0)) == "insignificant"


def test_classify_star_takes_the_furthest_reaching_event():
    # a star with a rejected event and an insignificant one is reported "rejected",
    # naming the discriminator that caught it — the more informative outcome wins
    result = {"planet_name": "x", "candidates": [
        _cand(significance=0.5),                                  # insignificant
        _cand(significant=True, significance=8.0, failed={"edge"}),  # rejected
    ]}
    entry = mt._classify_star(result)
    assert entry["disposition"] == "rejected"
    assert entry["failed"] == ["edge"]
    assert entry["n_events"] == 2


def test_classify_star_with_no_events_is_no_event():
    entry = mt._classify_star({"planet_name": "y", "candidates": []})
    assert entry["disposition"] == "no_event" and entry["n_events"] == 0


def _write_lc(slug, time, flux):
    cache = bls_service._CACHE_DIR
    (cache / f"bls_lc_{slug}.json").write_text(
        json.dumps({"time": time.tolist(), "flux": flux.tolist()}), encoding="utf-8")
    (cache / f"lc_{slug}_tess.json").write_text(
        json.dumps({"hostname": slug, "mission": "tess"}), encoding="utf-8")


def test_hunt_promotes_a_survivor_and_ledgers_every_star(tmp_path):
    # three stars: one with a real injected transit (survives), one flat (no candidate),
    # one never fetched. The hunt must promote the survivor and account for all three.
    rng = np.random.default_rng(40)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)

    _write_lc("hunt-real", time, dip)
    _write_lc("hunt-flat", time, flat)
    try:
        out = mt.hunt_monotransit(["hunt-real", "hunt-flat", "hunt-missing"])
    finally:
        for slug in ("hunt-real", "hunt-flat"):
            (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
            (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)

    ledger = {e["planet_name"]: e for e in out["ledger"]}
    assert len(out["ledger"]) == 3
    assert ledger["hunt-missing"]["disposition"] == "not_fetched"
    assert ledger["hunt-real"]["disposition"] == "candidate"

    assert len(out["survivors"]) == 1
    assert out["survivors"][0]["planet_name"] == "hunt-real"
    assert out["survivors"][0]["candidate"] is True


def test_hunt_stamps_the_size_verdict_onto_ledger_and_survivors(tmp_path):
    # sub-11-6: a size_index (from pool_assessment) stamps each ledger entry and survivor with
    # what a detection there would MEAN. The survivor on a plausible star carries that class and
    # its minimum planet radius; a star absent from the index carries nulls, not a guess.
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("sized-real", time, dip)
    size_index = {"sized-real": {"size_class": "plausible", "min_planet_rjup": 0.6,
                                 "min_planet_rearth": 6.6}}
    try:
        out = mt.hunt_monotransit(["sized-real", "sized-unlisted"], size_index=size_index)
    finally:
        (bls_service._CACHE_DIR / "bls_lc_sized-real.json").unlink(missing_ok=True)
        (bls_service._CACHE_DIR / "lc_sized-real_tess.json").unlink(missing_ok=True)

    ledger = {e["planet_name"]: e for e in out["ledger"]}
    assert ledger["sized-real"]["size_class"] == "plausible"
    assert ledger["sized-real"]["min_planet_rjup"] == 0.6
    # a star not in the index carries nulls, never a guessed class
    assert ledger["sized-unlisted"]["size_class"] is None
    assert ledger["sized-unlisted"]["min_planet_rjup"] is None

    assert out["survivors"][0]["planet_name"] == "sized-real"
    assert out["survivors"][0]["size_class"] == "plausible"
    assert out["survivors"][0]["min_planet_rjup"] == 0.6


def test_hunt_stamps_the_min_period_bound_onto_survivors(tmp_path):
    # sub-11-8: when the size index carries the star's radius, a survivor gets its minimum
    # orbital period — the shortest orbit its own transit could belong to. A star whose radius
    # is unknown carries None: the tool never invents a bound it cannot stand on.
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("period-real", time, dip)
    _write_lc("period-noradius", time, dip.copy())
    size_index = {
        "period-real": {"size_class": "plausible", "min_planet_rjup": 0.6,
                        "min_planet_rearth": 6.6, "stellar_radius": 0.9},
        "period-noradius": {"size_class": "unknown", "min_planet_rjup": None,
                            "min_planet_rearth": None, "stellar_radius": None},
    }
    try:
        out = mt.hunt_monotransit(["period-real", "period-noradius"], size_index=size_index)
    finally:
        for slug in ("period-real", "period-noradius"):
            (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
            (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)

    surv = {s["planet_name"]: s for s in out["survivors"]}
    # the radius'd star gets a real, positive lower bound consistent with the physics
    assert surv["period-real"]["min_period_days"] is not None
    assert surv["period-real"]["min_period_days"] > 0.0
    expected = mt.min_orbital_period_days(
        surv["period-real"]["duration"], surv["period-real"]["depth"], 0.9)
    assert surv["period-real"]["min_period_days"] == pytest.approx(expected)
    # no radius -> no bound, not a guess
    assert surv["period-noradius"]["min_period_days"] is None


def test_hunt_stamps_the_max_equilibrium_temp_onto_survivors(tmp_path):
    # sub-11-9: with the star's radius AND effective temperature on file, a survivor gets the
    # warmest it could run — the closest orbit (from its own min period) at zero albedo, an
    # upper bound. A star with no Teff carries None: no temperature invented without one.
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("temp-real", time, dip)
    _write_lc("temp-noteff", time, dip.copy())
    size_index = {
        "temp-real": {"size_class": "plausible", "min_planet_rjup": 0.6,
                      "min_planet_rearth": 6.6, "stellar_radius": 0.9, "teff": 5200.0},
        "temp-noteff": {"size_class": "plausible", "min_planet_rjup": 0.6,
                        "min_planet_rearth": 6.6, "stellar_radius": 0.9, "teff": None},
    }
    try:
        out = mt.hunt_monotransit(["temp-real", "temp-noteff"], size_index=size_index)
    finally:
        for slug in ("temp-real", "temp-noteff"):
            (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
            (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)

    surv = {s["planet_name"]: s for s in out["survivors"]}
    # the temperature is exactly the bound from this survivor's own minimum period and its star
    real = surv["temp-real"]
    assert real["max_eq_temp_k"] is not None and real["max_eq_temp_k"] > 0.0
    expected = mt.max_equilibrium_temp_k(real["min_period_days"], 5200.0, 0.9)
    assert real["max_eq_temp_k"] == pytest.approx(expected)
    # no effective temperature -> no bound, not a guess (even though the radius is known)
    assert surv["temp-noteff"]["max_eq_temp_k"] is None


def test_hunt_stamps_the_earliest_recurrence_date_onto_survivors(tmp_path):
    # sub-11-10: with a radius (hence a minimum period), a survivor gets the earliest a second
    # transit could appear — its own t0 plus that period, as a calendar date. A star with no
    # radius (no period bound) carries None: no date invented without a bound to stand on.
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("recur-real", time, dip)
    _write_lc("recur-noradius", time, dip.copy())
    size_index = {
        "recur-real": {"size_class": "plausible", "min_planet_rjup": 0.6,
                       "min_planet_rearth": 6.6, "stellar_radius": 0.9},
        "recur-noradius": {"size_class": "unknown", "min_planet_rjup": None,
                           "min_planet_rearth": None, "stellar_radius": None},
    }
    try:
        out = mt.hunt_monotransit(["recur-real", "recur-noradius"], size_index=size_index)
    finally:
        for slug in ("recur-real", "recur-noradius"):
            (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
            (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)

    surv = {s["planet_name"]: s for s in out["survivors"]}
    # the date is exactly t0 + this survivor's own minimum period, converted from BTJD
    real = surv["recur-real"]
    assert real["earliest_recurrence"] is not None
    expected = mt.earliest_recurrence_date(real["t0"], real["min_period_days"])
    assert real["earliest_recurrence"] == expected
    # no radius -> no period bound -> no date, not a guess
    assert surv["recur-noradius"]["earliest_recurrence"] is None


def test_hunt_stamps_the_observer_frame_numbers_onto_survivors(tmp_path):
    # sub-11-11: every survivor carries its epoch in BJD_TDB and its depth in millimagnitudes —
    # the same numbers translated into a follow-up observer's frame, from its own t0 and depth.
    # These need no radius (a frame change, not a bound), so they are present even with no triage.
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("brief-noradius", time, dip)
    size_index = {
        "brief-noradius": {"size_class": "unknown", "min_planet_rjup": None,
                           "min_planet_rearth": None, "stellar_radius": None},
    }
    try:
        out = mt.hunt_monotransit(["brief-noradius"], size_index=size_index)
    finally:
        (bls_service._CACHE_DIR / "bls_lc_brief-noradius.json").unlink(missing_ok=True)
        (bls_service._CACHE_DIR / "lc_brief-noradius_tess.json").unlink(missing_ok=True)

    s = {sv["planet_name"]: sv for sv in out["survivors"]}["brief-noradius"]
    # the epoch is t0 shifted into BJD_TDB; the depth is its millimagnitude drop
    assert s["epoch_bjd_tdb"] == mt.epoch_bjd_tdb(s["t0"])
    assert s["depth_mmag"] == mt.depth_to_millimag(s["depth"])
    # present without a radius: a translation of numbers already in hand, not a bound
    assert s["epoch_bjd_tdb"] is not None and s["depth_mmag"] is not None


def test_hunt_ranks_plausible_star_survivors_ahead_of_star_sized_ones(tmp_path):
    # sub-11-6 Light 2: a candidate where a detection could be a PLANET leads one where it could
    # only be a star, even when the star-sized one is the louder signal. A giant's deeper dip does
    # not outrank a dwarf's shallower one — the ranking points where a planet is possible.
    rng = np.random.default_rng(44)
    time = np.arange(0.0, _SPAN, _CADENCE)
    loud = mt.transit_model(time, 13.0, 0.3, 0.03) + rng.normal(0.0, 3e-4, size=time.shape)
    quiet = mt.transit_model(time, 13.0, 0.3, 0.005) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("rank-giant", time, loud)     # deep + quiet -> higher significance, but too_big
    _write_lc("rank-dwarf", time, quiet)    # shallow + noisier -> lower significance, but plausible
    size_index = {
        "rank-giant": {"size_class": "too_big", "min_planet_rjup": 8.0, "min_planet_rearth": 90.0},
        "rank-dwarf": {"size_class": "plausible", "min_planet_rjup": 0.6, "min_planet_rearth": 6.6},
    }
    try:
        out = mt.hunt_monotransit(["rank-giant", "rank-dwarf"], size_index=size_index)
    finally:
        for slug in ("rank-giant", "rank-dwarf"):
            (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
            (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)

    assert len(out["survivors"]) == 2
    # the louder giant would win a significance-only sort; here the plausible dwarf leads
    assert out["survivors"][0]["planet_name"] == "rank-dwarf"
    assert out["survivors"][0]["size_class"] == "plausible"
    assert out["survivors"][1]["planet_name"] == "rank-giant"
    assert out["survivors"][1]["significance"] > out["survivors"][0]["significance"]


def test_hunt_without_a_size_index_carries_null_size(tmp_path):
    # back-compatible: no size_index -> every star carries a null size verdict, not an error
    rng = np.random.default_rng(43)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("nosize-flat", time, flat)
    try:
        out = mt.hunt_monotransit(["nosize-flat"])
    finally:
        (bls_service._CACHE_DIR / "bls_lc_nosize-flat.json").unlink(missing_ok=True)
        (bls_service._CACHE_DIR / "lc_nosize-flat_tess.json").unlink(missing_ok=True)
    assert out["ledger"][0]["size_class"] is None
    assert out["ledger"][0]["min_planet_rjup"] is None


# ---- completeness: injection + full-hunt recovery (sub-11-4 Light 1) ----------

def test_inject_transit_presses_a_known_depth_and_leaves_input_untouched():
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = np.ones_like(time)
    out = mt.inject_transit(time, flux, _T0, 0.01, _DURATION)
    # the floor of the injected dip reaches the depth, the baseline is untouched
    assert abs((1.0 - out[np.argmin(np.abs(time - _T0))]) - 0.01) < 1e-9
    assert out[0] == 1.0
    assert flux[np.argmin(np.abs(time - _T0))] == 1.0   # input array not mutated


def test_recover_promotes_a_clean_injected_transit():
    rng = np.random.default_rng(3)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = mt.inject_transit(time, 1.0 + rng.normal(0.0, 5e-4, size=time.shape),
                             _T0, 0.01, _DURATION)
    out = mt.recover_through_hunt(time, flux, _T0, _DURATION)
    assert out["recovered"] is True
    assert out["stage"] == "promoted"
    assert out["significance"] >= mt._SIG_MIN_MONO


def test_recover_reports_search_miss_when_far_below_the_noise():
    # a transit far shallower than the scatter is not a promoted candidate; the chain
    # drops it early (no dip surfaces near t0, or it is judged insignificant)
    rng = np.random.default_rng(4)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = mt.inject_transit(time, 1.0 + rng.normal(0.0, 1e-3, size=time.shape),
                             _T0, 1e-5, _DURATION)
    out = mt.recover_through_hunt(time, flux, _T0, _DURATION)
    assert out["recovered"] is False
    assert out["stage"] != "promoted"


def test_recover_names_the_edge_that_kills_a_transit_beside_a_gap():
    # the completeness cost of the edge discriminator: a real, deep, significant transit
    # planted just past a segment join is rejected for sitting on the edge — the same rule
    # that catches the loudest false alarm also costs us this one.
    rng = np.random.default_rng(5)
    seg1 = np.arange(0.0, 13.0, _CADENCE)
    seg2 = np.arange(15.0, 27.0, _CADENCE)          # a 2-day gap at 13 -> 15
    time = np.concatenate([seg1, seg2])
    t0 = 15.0 + 0.1                                 # just past the gap edge, within 1*dur
    flux = mt.inject_transit(time, 1.0 + rng.normal(0.0, 3e-4, size=time.shape),
                             t0, 0.02, _DURATION)
    out = mt.recover_through_hunt(time, flux, t0, _DURATION)
    assert out["recovered"] is False
    assert out["stage"] == "edge"
    assert out["significance"] >= mt._SIG_MIN_MONO   # it WAS significant; the edge cost it


# ---- per-star sensitivity floor (sub-11-4 Light 3) ----------------------------

def test_sensitivity_floor_is_a_positive_depth_on_a_noisy_curve():
    rng = np.random.default_rng(6)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flux = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    floor = mt.sensitivity_depth_floor(time, flux)
    assert floor is not None and floor > 0.0


def test_sensitivity_floor_rises_with_noise():
    # a noisier curve admits only deeper transits: its floor is higher
    time = np.arange(0.0, _SPAN, _CADENCE)
    quiet = 1.0 + np.random.default_rng(7).normal(0.0, 3e-4, size=time.shape)
    loud = 1.0 + np.random.default_rng(7).normal(0.0, 1.2e-3, size=time.shape)
    assert mt.sensitivity_depth_floor(time, loud) > mt.sensitivity_depth_floor(time, quiet)


def test_sensitivity_floor_held_when_baseline_too_short():
    # a curve far shorter than one control window has no null to form → None (held)
    time = np.arange(0.0, 0.5, _CADENCE)
    flux = 1.0 + np.random.default_rng(8).normal(0.0, 5e-4, size=time.shape)
    assert mt.sensitivity_depth_floor(time, flux) is None


def test_hunt_ledger_carries_a_depth_floor_per_star(tmp_path):
    rng = np.random.default_rng(41)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("floor-flat", time, flat)
    try:
        out = mt.hunt_monotransit(["floor-flat", "floor-missing"])
    finally:
        (bls_service._CACHE_DIR / "bls_lc_floor-flat.json").unlink(missing_ok=True)
        (bls_service._CACHE_DIR / "lc_floor-flat_tess.json").unlink(missing_ok=True)

    ledger = {e["planet_name"]: e for e in out["ledger"]}
    # a searched star reports a real floor; an unfetched one reports None
    assert ledger["floor-flat"]["depth_floor"] is not None
    assert ledger["floor-flat"]["depth_floor"] > 0.0
    assert ledger["floor-missing"]["depth_floor"] is None


# --- sub-11-8: the minimum orbital period from one transit ---------------------

def _central_transit_duration_days(period_days, depth, radius_rsun):
    """Forward central-transit (b=0) duration — the relation min_orbital_period inverts."""
    rho = mt.stellar_density_solar(radius_rsun)
    k = np.sqrt(depth)
    p_s = period_days * 86400.0
    t14_s = (1.0 + k) / np.pi * (3.0 * np.pi / (mt._G_SI * rho)) ** (1 / 3) * p_s ** (1 / 3)
    return t14_s / 86400.0


def test_min_period_inverts_the_central_transit_relation_exactly():
    # press a known b=0 period through the forward duration, then invert: we get it back
    for period, depth, radius in [(15.0, 0.01, 0.9), (260.0, 0.02, 0.75), (3.5, 0.005, 1.1)]:
        dur = _central_transit_duration_days(period, depth, radius)
        assert mt.min_orbital_period_days(dur, depth, radius) == pytest.approx(period, rel=1e-9)


def test_min_period_is_a_lower_bound_grazing_needs_longer():
    # b=0 gives the LONGEST duration a period can make, so inverting an observed duration as if
    # b=0 gives the SHORTEST period — a grazing transit of the SAME duration means a longer period.
    radius, depth = 0.9, 0.01
    p_central = 40.0
    dur_central = _central_transit_duration_days(p_central, depth, radius)
    # a shorter observed duration (what a grazing geometry leaves) yields a shorter min period,
    # confirming the returned value is the floor: the true period is never below it
    p_from_shorter = mt.min_orbital_period_days(0.5 * dur_central, depth, radius)
    assert p_from_shorter < p_central


def test_min_period_a_long_single_transit_implies_a_long_period():
    # the whole point: a half-day central transit on a dwarf is a hundreds-of-days orbit —
    # exactly the long-period world BLS discards for want of a repeat
    p = mt.min_orbital_period_days(0.5, 0.01, 0.9)
    assert p is not None and p > 100.0


def test_min_period_monotonic_in_duration_density_and_depth():
    base = mt.min_orbital_period_days(0.4, 0.01, 0.9)
    assert mt.min_orbital_period_days(0.8, 0.01, 0.9) > base       # longer transit -> longer period
    assert mt.min_orbital_period_days(0.4, 0.01, 0.6) > base       # denser star -> longer period
    assert mt.min_orbital_period_days(0.4, 0.04, 0.9) < base       # deeper (bigger k) -> shorter


def test_min_period_guards_non_physical_input():
    assert mt.min_orbital_period_days(0.0, 0.01, 0.9) is None      # no duration, no bound
    assert mt.min_orbital_period_days(0.4, 0.01, 0.0) is None      # no radius, no density
    assert mt.min_orbital_period_days(0.4, -0.5, 0.9) is not None  # negative depth -> treated as 0
    with pytest.raises(ValueError):
        mt.stellar_density_solar(0.0)


def test_stellar_density_a_smaller_dwarf_is_denser_sun_is_solar():
    assert mt.stellar_density_solar(1.0) == pytest.approx(1408.0)
    assert mt.stellar_density_solar(0.5) > mt.stellar_density_solar(1.0)


# --- sub-11-9: the warmest a survivor's world could be ------------------------

def test_stellar_mass_is_solar_at_one_rsun_and_scales_with_radius():
    # the same main-sequence relation as the density: ~1 solar mass at 1 R_sun, M ~ R^1.25
    assert mt.stellar_mass_kg(1.0) == pytest.approx(1.989e30, rel=2e-3)
    assert mt.stellar_mass_kg(0.5) < mt.stellar_mass_kg(1.0)
    with pytest.raises(ValueError):
        mt.stellar_mass_kg(0.0)


def test_semi_major_axis_earth_period_is_one_au():
    # Kepler III with a solar-mass star and a one-year period returns ~1 AU
    assert mt.semi_major_axis_m(365.25, 1.0) == pytest.approx(1.496e11, rel=3e-3)
    with pytest.raises(ValueError):
        mt.semi_major_axis_m(0.0, 1.0)


def test_equilibrium_temp_earth_around_the_sun_is_the_known_zero_albedo_value():
    # Earth's zero-albedo equilibrium temperature is ~278 K — the constant is anchored
    t = mt.max_equilibrium_temp_k(365.25, 5772.0, 1.0)
    assert t == pytest.approx(278.0, abs=2.0)


def test_equilibrium_temp_is_an_upper_bound_a_longer_period_only_cools():
    # the number descends from the MINIMUM period; a longer real period sits farther out
    # and can only be cooler, so a longer period bound must return a lower temperature
    warm = mt.max_equilibrium_temp_k(20.0, 5000.0, 0.8)
    cool = mt.max_equilibrium_temp_k(200.0, 5000.0, 0.8)
    assert warm is not None and cool is not None and cool < warm


def test_equilibrium_temp_is_hotter_for_a_hotter_star():
    cooler = mt.max_equilibrium_temp_k(30.0, 4000.0, 0.8)
    hotter = mt.max_equilibrium_temp_k(30.0, 6500.0, 0.8)
    assert hotter > cooler


def test_equilibrium_temp_guards_missing_and_non_physical_input():
    assert mt.max_equilibrium_temp_k(None, 5000.0, 0.8) is None   # no period bound, no temp
    assert mt.max_equilibrium_temp_k(30.0, None, 0.8) is None     # no effective temperature
    assert mt.max_equilibrium_temp_k(30.0, 5000.0, None) is None  # no radius
    assert mt.max_equilibrium_temp_k(0.0, 5000.0, 0.8) is None    # non-physical period
    assert mt.max_equilibrium_temp_k(30.0, -1.0, 0.8) is None     # non-physical temperature


# --- sub-11-10: the earliest a second transit could recur ---------------------

def test_jd_to_calendar_date_on_known_anchors():
    # the Meeus JD->Gregorian conversion, pinned on dates whose Julian Date is textbook
    assert mt.jd_to_calendar_date(2451545.0) == "2000-01-01"   # J2000.0
    assert mt.jd_to_calendar_date(2440587.5) == "1970-01-01"   # the Unix epoch
    assert mt.jd_to_calendar_date(2457000.0) == "2014-12-08"   # the TESS BTJD reference epoch
    # the time-of-day fraction is floored to the civil day: still Jan 1, not Jan 2
    assert mt.jd_to_calendar_date(2451545.0 + 0.4) == "2000-01-01"


def test_earliest_recurrence_is_t0_plus_min_period_as_a_calendar_date():
    # a transit at t0 (BTJD) with a minimum period P_min cannot recur before t0 + P_min;
    # that BTJD, shifted to JD and converted, is the earliest-recurrence date
    t0, p_min = 10.0, 100.0
    got = mt.earliest_recurrence_date(t0, p_min)
    assert got == mt.jd_to_calendar_date(t0 + p_min + mt._BTJD_OFFSET)
    # BTJD 110 = JD 2457110 -> a date in early 2015, well after the BTJD epoch
    assert got == "2015-03-28"


def test_earliest_recurrence_a_longer_period_pushes_the_date_later():
    # the whole honesty of the bound: a longer minimum period can only move the earliest
    # possible recurrence later (ISO dates sort chronologically), never earlier
    near = mt.earliest_recurrence_date(0.0, 40.0)
    far = mt.earliest_recurrence_date(0.0, 400.0)
    assert near is not None and far is not None
    assert far > near


def test_earliest_recurrence_guards_a_missing_or_non_physical_period():
    assert mt.earliest_recurrence_date(10.0, None) is None    # no period bound -> no date
    assert mt.earliest_recurrence_date(10.0, 0.0) is None     # non-physical period
    assert mt.earliest_recurrence_date(10.0, -5.0) is None    # non-physical period


# sub-11-11: the follow-up brief — a survivor's numbers in an observer's frame

def test_epoch_bjd_tdb_adds_the_btjd_offset_back():
    # BTJD is BJD_TDB - 2457000; the published/ExoFOP frame is BJD_TDB, so the epoch adds it back
    assert mt.epoch_bjd_tdb(1500.0) == 1500.0 + mt._BTJD_OFFSET
    assert mt.epoch_bjd_tdb(1500.0) == 2458500.0
    assert mt.epoch_bjd_tdb(0.0) == mt._BTJD_OFFSET   # BTJD 0 is the reference epoch itself


def test_depth_to_millimag_is_the_logarithmic_magnitude_drop():
    # a photometrist reads depth as Delta_mag = -2.5 log10(1 - depth), times 1000 for mmag
    assert mt.depth_to_millimag(0.01) == pytest.approx(10.912, abs=1e-3)   # 1% -> ~10.9 mmag
    assert mt.depth_to_millimag(0.001) == pytest.approx(1.086, abs=1e-3)
    # logarithmic, not a linear rescale: doubling depth does NOT double the mmag
    assert mt.depth_to_millimag(0.02) != pytest.approx(2 * mt.depth_to_millimag(0.01), abs=1e-2)


def test_depth_to_millimag_is_monotonic_in_depth():
    # a deeper transit is always a larger magnitude drop
    assert mt.depth_to_millimag(0.03) > mt.depth_to_millimag(0.01) > mt.depth_to_millimag(0.001)


def test_depth_to_millimag_guards_a_non_physical_depth():
    # the magnitude is undefined for a depth that is not a fractional flux drop in (0, 1)
    assert mt.depth_to_millimag(0.0) is None
    assert mt.depth_to_millimag(-0.01) is None
    assert mt.depth_to_millimag(1.0) is None


# --- sub-11-12: memoizing the search on disk -----------------------------------


def _clean_cache(slug):
    for name in (f"bls_lc_{slug}.json", f"lc_{slug}_tess.json", f"mono_{slug}.json"):
        (bls_service._CACHE_DIR / name).unlink(missing_ok=True)


def _counting_spy(monkeypatch):
    """Replace run_monotransit with a counting wrapper over the real one."""
    real = mt.run_monotransit
    calls = {"n": 0}

    def spy(name):
        calls["n"] += 1
        return real(name)

    monkeypatch.setattr(mt, "run_monotransit", spy)
    return calls


def test_cached_result_matches_the_uncached_search():
    # the memo must never change the answer — same events, same dispositions
    rng = np.random.default_rng(41)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("cache-match", time, dip)
    try:
        direct = mt.run_monotransit("cache-match")
        cached = mt.run_monotransit_cached("cache-match")
    finally:
        _clean_cache("cache-match")
    assert cached == direct


def test_cached_hit_skips_the_recompute(monkeypatch):
    # once warm, a second call reads the stored result — run_monotransit is not run again
    rng = np.random.default_rng(42)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("cache-hit", time, flat)
    try:
        first = mt.run_monotransit_cached("cache-hit")   # computes + stores
        calls = _counting_spy(monkeypatch)
        second = mt.run_monotransit_cached("cache-hit")   # must be a pure read
        assert calls["n"] == 0
        assert second == first
    finally:
        _clean_cache("cache-hit")


def test_cached_invalidates_when_the_curve_changes(monkeypatch):
    # a re-fetch rewrites the light curve (new mtime) — the stale result must be recomputed
    import os

    rng = np.random.default_rng(43)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("cache-mtime", time, flat)
    try:
        mt.run_monotransit_cached("cache-mtime")          # warm
        calls = _counting_spy(monkeypatch)
        mt.run_monotransit_cached("cache-mtime")          # hit — no recompute
        assert calls["n"] == 0
        # bump the source mtime the way a re-fetch would
        src = bls_service._CACHE_DIR / "bls_lc_cache-mtime.json"
        st = src.stat()
        os.utime(src, ns=(st.st_atime_ns, st.st_mtime_ns + 10_000_000_000))
        mt.run_monotransit_cached("cache-mtime")          # miss — recompute
        assert calls["n"] == 1
    finally:
        _clean_cache("cache-mtime")


def test_cached_invalidates_on_a_version_bump(monkeypatch):
    # a changed pipeline bumps _MONO_CACHE_VERSION; every stored result must be recomputed
    rng = np.random.default_rng(44)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("cache-ver", time, flat)
    try:
        mt.run_monotransit_cached("cache-ver")            # stored under mono-v1
        calls = _counting_spy(monkeypatch)
        monkeypatch.setattr(mt, "_MONO_CACHE_VERSION", "mono-v2-test")
        mt.run_monotransit_cached("cache-ver")            # version mismatch — recompute
        assert calls["n"] == 1
    finally:
        _clean_cache("cache-ver")


def test_cached_falls_back_on_a_corrupt_file(monkeypatch):
    # a half-written or garbage cache must never crash the search — recompute and heal
    rng = np.random.default_rng(45)
    time = np.arange(0.0, _SPAN, _CADENCE)
    flat = 1.0 + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("cache-corrupt", time, flat)
    (bls_service._CACHE_DIR / "mono_cache-corrupt.json").write_text("{not json", encoding="utf-8")
    try:
        calls = _counting_spy(monkeypatch)
        result = mt.run_monotransit_cached("cache-corrupt")
        assert calls["n"] == 1                            # recomputed past the garbage
        assert "candidates" in result and "depth_floor" in result
        # and the corrupt file was healed into a valid hit
        again = mt.run_monotransit_cached("cache-corrupt")
        assert calls["n"] == 1                            # now a clean read
        assert again == result
    finally:
        _clean_cache("cache-corrupt")


def test_cached_falls_through_for_an_unfetched_star():
    # no cached curve — the honest FileNotFoundError from run_monotransit still surfaces
    _clean_cache("cache-absent")
    with pytest.raises(FileNotFoundError):
        mt.run_monotransit_cached("cache-absent")
    assert mt.depth_to_millimag(1.5) is None


# --- the drilldown curve (sub-11-13) -------------------------------------------

def test_curve_decimates_and_stays_json_finite():
    # a long curve is decimated to the display cap, and every sample is finite (strict JSON)
    rng = np.random.default_rng(51)
    time = np.arange(0.0, _SPAN, _CADENCE)          # ~1900 pts < cap, so no decimation here
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("curve-real", time, dip)
    try:
        out = mt.monotransit_curve("curve-real", max_points=500)
    finally:
        _clean_cache("curve-real")
    assert out["point_count"] == 500 and out["original_count"] == len(time)
    assert len(out["time"]) == 500 and len(out["flux"]) == 500
    assert all(math.isfinite(x) for x in out["time"])
    assert all(math.isfinite(x) for x in out["flux"])
    json.dumps(out)  # must not raise (no NaN/Inf)


def test_curve_carries_the_events_the_search_found():
    # the injected dip surfaces as an event the view can mark, in the curve's own time frame
    rng = np.random.default_rng(52)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("curve-event", time, dip)
    try:
        out = mt.monotransit_curve("curve-event")
    finally:
        _clean_cache("curve-event")
    assert len(out["events"]) >= 1
    ev = out["events"][0]
    assert abs(ev["t0"] - 13.0) < 1.0           # near the injected epoch
    assert set(ev) == {"t0", "duration", "depth", "significance", "significant",
                       "passed", "candidate", "failed_checks"}
    # a clean central candidate passed every gate, so nothing failed
    assert ev["failed_checks"] == []


def test_curve_matches_the_searched_events_exactly():
    # the curve view's events must be the SAME the hunt records — never a re-derived answer
    rng = np.random.default_rng(53)
    time = np.arange(0.0, _SPAN, _CADENCE)
    dip = mt.transit_model(time, 13.0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)
    _write_lc("curve-same", time, dip)
    try:
        curve = mt.monotransit_curve("curve-same")
        search = mt.run_monotransit_cached("curve-same")
    finally:
        _clean_cache("curve-same")
    assert len(curve["events"]) == len(search["candidates"])
    for ce, sc in zip(curve["events"], search["candidates"]):
        assert ce["t0"] == sc["t0"] and ce["candidate"] == sc["candidate"]
        # the failed-gate list is read off the SAME checks, not re-derived — for every event
        assert ce["failed_checks"] == [ch["name"] for ch in sc["checks"] if not ch["passed"]]


def test_curve_raises_for_an_unfetched_star():
    # never draw a curve we have not searched — the honest 424 signal
    _clean_cache("curve-absent")
    with pytest.raises(FileNotFoundError):
        mt.monotransit_curve("curve-absent")
