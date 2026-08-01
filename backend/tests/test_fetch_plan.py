"""sub-11-7 Light 1 — the fetch plan.

Deterministic and network-free: given the pool triage and an injectable cache check, list
the plausible dwarfs, tag each cached or pending, and order them best-target-first. The fake
pool mirrors test_pool_assessment: two dwarfs (plausible) and a giant and an unknown that must
never appear in a fetch plan.
"""

from services import fetch_plan as fp

# two dwarfs -> plausible (tic 4 smaller, so best target); a giant and an unknown that a fetch
# plan must exclude — we only spend fetches where a detection could be a planet.
_FAKE_POOL = [
    {"tic": 1, "tmag": 8.0, "constellation": "Pavo", "radius": 1.0},      # dwarf -> plausible
    {"tic": 2, "tmag": 5.0, "constellation": "Tucana", "radius": 40.0},   # giant -> too_big
    {"tic": 3, "tmag": 7.0, "constellation": "Indus", "radius": None},    # no radius -> unknown
    {"tic": 4, "tmag": 8.1, "constellation": "Phoenix", "radius": 0.8},   # dwarf -> plausible (best)
]

_NONE_CACHED = lambda name: False


def test_plan_lists_only_plausible_dwarfs_best_target_first():
    plan = fp.fetch_plan(is_cached=_NONE_CACHED, stars=_FAKE_POOL)
    # the giant and the unknown are excluded; the smaller dwarf (tic 4) leads
    assert [t["star_name"] for t in plan["targets"]] == ["TIC 4", "TIC 1"]
    assert plan["summary"]["plausible"] == 2
    # best-target-first: tic 4 has the smaller detectable planet radius
    assert plan["targets"][0]["min_planet_rjup"] < plan["targets"][1]["min_planet_rjup"]
    assert plan["summary"]["best_target"] == "TIC 4"


def test_plan_tags_cached_and_pending_and_counts_them():
    # tic 1 already on disk, tic 4 not
    is_cached = lambda name: name == "TIC 1"
    plan = fp.fetch_plan(is_cached=is_cached, stars=_FAKE_POOL)
    by_name = {t["star_name"]: t for t in plan["targets"]}
    assert by_name["TIC 1"]["cached"] is True
    assert by_name["TIC 4"]["cached"] is False
    assert plan["summary"]["cached"] == 1
    assert plan["summary"]["pending"] == 1
    # every target is either cached or pending — the counts account for all of them
    assert plan["summary"]["cached"] + plan["summary"]["pending"] == plan["summary"]["plausible"]


def test_plan_touches_no_network_and_does_not_fetch():
    # a cache check that would explode if the plan tried anything beyond asking cached-or-not
    calls = []

    def spy(name):
        calls.append(name)
        return False

    plan = fp.fetch_plan(is_cached=spy, stars=_FAKE_POOL)
    # asked exactly once per plausible target, nothing more
    assert sorted(calls) == ["TIC 1", "TIC 4"]
    assert plan["summary"]["pending"] == 2


def test_plan_on_the_real_pool_targets_sixteen_dwarfs():
    # the honest finding sub-11-5 measured: 16 of the 50 fresh-sky stars are worth a fetch
    plan = fp.fetch_plan(is_cached=_NONE_CACHED)
    assert plan["summary"]["plausible"] == 16
    assert plan["summary"]["pending"] == 16          # forced-uncached: all pending
    # the best target is a real planet-sized reach, not a star
    assert plan["summary"]["best_min_planet_rjup"] < 2.0
