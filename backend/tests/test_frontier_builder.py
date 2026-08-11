"""Selection logic for the TESS frontier pool builder (scripts/build_frontier_seeds_tess.py).

The builder itself does all its MAST probing offline; only the pure, deterministic *selection*
is unit-tested here. select_for_hunt is the sub-11-14 change: rank the single-transit hunt's real
targets — the small stars where a detectable dip could be a planet — ahead of the bright giants
select_bright favoured (which was why the pool came out mostly too_big).
"""
import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent.parent.parent / "scripts"
sys.path.insert(0, str(_SCRIPTS))

import build_frontier_seeds_tess as builder  # noqa: E402


def _star(tic, tmag=10.0, teff=5500.0, radius=1.0):
    return {"tic": tic, "tmag": tmag, "teff": teff, "radius": radius}


def test_hunt_ranks_the_smallest_star_first():
    # same brightness, different sizes: the dwarf must lead the giant
    giant = _star(1, radius=8.0)
    dwarf = _star(2, radius=0.4)
    mid = _star(3, radius=1.5)
    picked = builder.select_for_hunt([giant, mid, dwarf], 3)
    assert [s["tic"] for s in picked] == [2, 3, 1]


def test_hunt_keeps_only_bright_enough_stars_ahead():
    # a faint dwarf (Tmag over the cap) sinks below a bright, larger star — SNR still gates
    faint_dwarf = _star(1, tmag=15.0, radius=0.3)
    bright_bigger = _star(2, tmag=9.0, radius=1.2)
    picked = builder.select_for_hunt([faint_dwarf, bright_bigger], 2)
    assert picked[0]["tic"] == 2  # observable first, even though it is larger


def test_hunt_sinks_a_star_with_no_radius():
    # cannot call an unsized star a dwarf — it sorts below every measured one
    sized = _star(1, radius=0.9)
    unsized = _star(2, radius=None)
    picked = builder.select_for_hunt([unsized, sized], 2)
    assert picked[0]["tic"] == 1


def test_hunt_uses_brightness_only_to_break_radius_ties():
    # identical radius: the brighter one wins the tiebreak
    dim = _star(1, tmag=12.0, radius=0.5)
    bright = _star(2, tmag=8.0, radius=0.5)
    picked = builder.select_for_hunt([dim, bright], 2)
    assert picked[0]["tic"] == 2


def test_hunt_truncates_to_n_and_is_deterministic():
    stars = [_star(i, radius=float(i)) for i in range(1, 11)]
    a = builder.select_for_hunt(stars, 4)
    b = builder.select_for_hunt(list(reversed(stars)), 4)
    assert [s["tic"] for s in a] == [1, 2, 3, 4]
    assert [s["tic"] for s in a] == [s["tic"] for s in b]  # input order does not matter


def test_bright_still_ranks_by_brightness():
    # the old selector is preserved for the Phase-10 feed order
    dwarf_dim = _star(1, tmag=12.0, radius=0.4)
    giant_bright = _star(2, tmag=8.0, radius=8.0)
    picked = builder.select_bright([dwarf_dim, giant_bright], 2)
    assert picked[0]["tic"] == 2  # brightest first, size ignored
