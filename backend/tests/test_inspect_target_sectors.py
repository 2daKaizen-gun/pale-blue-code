"""summarize_sector_coverage counts the sectors behind path A's target floors (lever 3 recon).

Levers 1-2 were null; lever 2's null pointed at baseline (multi-sector stitching) as the one knob
that can lower these floors. This tool reads how many sectors each target already carries. The pure
summary is pinned here — the multi- vs single-sector split (>=2 = already stitched), the honest
"unknown" bucket for a target with no cached count, and the medians over known targets — so the
"lever 3 is already pulled" reading the check doc reports cannot drift.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

import inspect_target_sectors as its   # noqa: E402


def test_multi_and_single_are_split_at_two_sectors():
    rows = [
        {"tic": 1, "sector_count": 6, "baseline_days": 2000.0},
        {"tic": 2, "sector_count": 1, "baseline_days": 24.0},
        {"tic": 3, "sector_count": 2, "baseline_days": 300.0},
    ]
    out = its.summarize_sector_coverage(rows)
    assert out["n"] == 3
    assert out["n_multi_sector"] == 2      # 6 and 2
    assert out["n_single_sector"] == 1     # 1


def test_unknown_count_is_excluded_from_medians():
    rows = [
        {"tic": 1, "sector_count": 5, "baseline_days": 1000.0},
        {"tic": 2, "sector_count": None, "baseline_days": None},   # never fetched
        {"tic": 3, "sector_count": 3, "baseline_days": 500.0},
    ]
    out = its.summarize_sector_coverage(rows)
    assert out["n_unknown"] == 1
    assert out["median_sectors"] == 4          # median of [5, 3], the known ones
    assert out["median_baseline_days"] == 750.0


def test_all_unknown_yields_none_medians():
    rows = [{"tic": 1, "sector_count": None, "baseline_days": None}]
    out = its.summarize_sector_coverage(rows)
    assert out["n_multi_sector"] == 0
    assert out["n_single_sector"] == 0
    assert out["n_unknown"] == 1
    assert out["median_sectors"] is None
    assert out["median_baseline_days"] is None
