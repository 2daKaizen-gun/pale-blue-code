"""sub-9B-1 frontier hunt service — TDD.

Covers the "unrecorded target" primitives that Phase 9-B is built on:
  * koi_entries / is_recorded — period-independent KOI membership (honesty nail #3:
    a star with ANY KOI entry is already recorded, so it is not hunting ground).
  * the frontier seed pool invariant — every seeded KIC must be unrecorded, or the
    "pick a star no one filed" promise is a lie.
  * pick_frontier — deterministic given an injected RNG, always returns a pool KIC.
"""
import json
import random

import numpy as np

from services import hunt

# A known catalogued star: KIC 11446443 = Kepler-1b / TrES-2b = KOI K00001.
_KNOWN_KOI_KIC = 11446443


def test_koi_entries_returns_all_entries_for_a_recorded_star():
    entries = hunt.koi_entries(_KNOWN_KOI_KIC)
    assert len(entries) > 0
    for e in entries:
        assert int(e["kepid"]) == _KNOWN_KOI_KIC
        assert e["kepoi_name"]
        assert e["koi_disposition"]


def test_is_recorded_true_for_known_koi():
    assert hunt.is_recorded(_KNOWN_KOI_KIC) is True


def test_is_recorded_false_for_absent_kic():
    # A KIC nowhere near the catalogued range → no KOI entry.
    assert hunt.is_recorded(1) is False
    assert hunt.koi_entries(1) == []


def test_koi_entries_is_period_independent():
    # Membership is by kepid alone, regardless of any period — distinct from
    # koi_check, which matches a period harmonic. Every returned row is this star.
    entries = hunt.koi_entries(_KNOWN_KOI_KIC)
    assert {int(e["kepid"]) for e in entries} == {_KNOWN_KOI_KIC}


# A known catalogued TESS star: TIC 50365310 = TOI 1000.01.
_KNOWN_TOI_TIC = 50365310


def test_toi_entries_returns_all_entries_for_a_recorded_star():
    entries = hunt.toi_entries(_KNOWN_TOI_TIC)
    assert len(entries) > 0
    for e in entries:
        assert int(float(e["tid"])) == _KNOWN_TOI_TIC
        assert e["toi"]
        assert e["tfopwg_disp"] is not None


def test_is_recorded_tess_true_for_known_toi():
    assert hunt.is_recorded_tess(_KNOWN_TOI_TIC) is True


def test_is_recorded_tess_false_for_absent_tic():
    # A TIC nowhere near any TOI → no TOI entry.
    assert hunt.is_recorded_tess(1) is False
    assert hunt.toi_entries(1) == []


def test_toi_entries_is_membership_by_tid():
    # Membership is by TIC id alone — every returned row is this star.
    entries = hunt.toi_entries(_KNOWN_TOI_TIC)
    assert {int(float(e["tid"])) for e in entries} == {_KNOWN_TOI_TIC}


# --- Light 2: TESS light-curve fetch (fetch_lc_by_tic) --------------------------

def test_tic_lc_cache_path_naming():
    p = hunt._tic_lc_cache_path(12345678)
    assert p.name == "lc_tic-12345678_tess.json"


def test_build_tess_payload_records_baseline_and_sectors():
    # A single 27-day sector: three points spanning day 100 -> 127.
    time = np.array([100.0, 101.0, 127.0])
    flux = np.array([1.0, 0.99, 1.0])
    err = np.array([0.0, 0.0, 0.0])
    payload = hunt._build_tess_payload(42, time, flux, err, sector_count=1)
    assert payload["mission"] == "TESS"
    assert payload["author"] == "SPOC"          # BLS re-search depends on this
    assert payload["hostname"] == "TIC 42"
    assert payload["baseline_days"] == 27.0      # last - first, undecimated
    assert payload["sector_count"] == 1
    assert payload["original_count"] == 3


def test_build_tess_payload_empty_series_is_zero_baseline():
    empty = np.array([])
    payload = hunt._build_tess_payload(1, empty, empty, empty, sector_count=0)
    assert payload["baseline_days"] == 0.0
    assert payload["sector_count"] == 0
    assert payload["original_count"] == 0


def test_fetch_lc_by_tic_returns_cache_without_network():
    tic = 999000111
    p = hunt._tic_lc_cache_path(tic)
    sentinel = {"kic_id": tic, "mission": "TESS", "sentinel": True}
    p.write_text(json.dumps(sentinel), encoding="utf-8")
    try:
        got = hunt.fetch_lc_by_tic(tic)   # cache hit → must never touch the network
        assert got == sentinel
    finally:
        p.unlink(missing_ok=True)


# --- Light 3: mission wiring (star_name) ----------------------------------------

def test_star_name_switches_on_mission():
    assert hunt.star_name(123, "kepler") == "KIC 123"
    assert hunt.star_name(123, "tess") == "TIC 123"
    assert hunt.star_name(123, "TESS") == "TIC 123"   # case-insensitive
    assert hunt.star_name(123) == "KIC 123"           # default is Kepler


def test_frontier_pool_invariant_all_unrecorded():
    """The core promise: every seeded KIC is genuinely unrecorded."""
    kics = hunt._load_frontier()
    assert len(kics) > 0
    for kic in kics:
        assert hunt.is_recorded(kic) is False, f"KIC {kic} is actually recorded"


def test_frontier_pool_matches_committed_json():
    kics = hunt._load_frontier()
    assert len(kics) == len(set(kics))            # unique
    assert kics == sorted(kics)                    # sorted
    assert all(isinstance(k, int) and k > 0 for k in kics)


def test_pick_frontier_returns_unrecorded_pool_member():
    kic = hunt.pick_frontier(random.Random(0))
    assert kic in hunt._load_frontier()
    assert hunt.is_recorded(kic) is False


def test_pick_frontier_is_deterministic_with_seeded_rng():
    a = hunt.pick_frontier(random.Random(42))
    b = hunt.pick_frontier(random.Random(42))
    assert a == b
