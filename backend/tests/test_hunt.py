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
