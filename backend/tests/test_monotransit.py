"""sub-11-2 single-transit search — TDD.

Light 1 targets the pure primitive: the trapezoidal transit template and the
matched-filter single-event statistic. A synthetic single dip in white noise
drives it — no folding, no repetition, one event.
"""

import json

import numpy as np

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
