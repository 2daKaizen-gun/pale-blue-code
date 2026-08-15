"""search_pending.pending_to_search selects exactly the fetched-but-unsearched pool stars.

This is the search runner's plan — which stars a run would search. It must include a star whose
curve is cached but whose monotransit result is missing or stale, and exclude both an already-
searched star and a not-fetched one, so search_pending and tally_hunt can never disagree on what
"searched" means. Same synthetic-cache pattern as test_tally_hunt.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import bls as bls_service  # noqa: E402
from services import monotransit as mt  # noqa: E402

import search_pending  # noqa: E402


def _paths(tic: int):
    name = "tic-%d" % tic
    slug = bls_service._slug(name)
    return (name,
            bls_service._CACHE_DIR / f"bls_lc_{slug}.json",   # search-derived source
            bls_service._CACHE_DIR / f"mono_{slug}.json",     # monotransit memo
            bls_service._CACHE_DIR / f"lc_{slug}_tess.json")  # raw MAST fetch


def _write_searched(tic: int) -> list[Path]:
    """Fetched AND validly searched -> must be excluded from the plan."""
    name, src, mono, lc = _paths(tic)
    lc.write_text(json.dumps({"mission": "TESS"}), encoding="utf-8")
    src.write_text(json.dumps({"time": [], "flux": []}), encoding="utf-8")
    mono.write_text(json.dumps({
        "version": mt._MONO_CACHE_VERSION,
        "lc_mtime_ns": src.stat().st_mtime_ns,
        "result": {"planet_name": name, "candidates": [], "depth_floor": 0.004},
    }), encoding="utf-8")
    return [lc, src, mono]


def _write_fetched_only(tic: int) -> list[Path]:
    """Fetched, no mono result -> must be included in the plan."""
    _, _, _, lc = _paths(tic)
    lc.write_text(json.dumps({"mission": "TESS"}), encoding="utf-8")
    return [lc]


def _write_fetched_stale(tic: int) -> list[Path]:
    """Fetched, but the mono memo's lc mtime no longer matches -> stale -> must be included."""
    name, src, mono, lc = _paths(tic)
    lc.write_text(json.dumps({"mission": "TESS"}), encoding="utf-8")
    src.write_text(json.dumps({"time": [], "flux": []}), encoding="utf-8")
    mono.write_text(json.dumps({
        "version": mt._MONO_CACHE_VERSION,
        "lc_mtime_ns": src.stat().st_mtime_ns + 1,  # deliberately stale
        "result": {"planet_name": name, "candidates": [], "depth_floor": 0.004},
    }), encoding="utf-8")
    return [lc, src, mono]


def test_pending_to_search_picks_only_fetched_but_unsearched():
    searched, fetched, stale, missing = 991000001, 991000002, 991000003, 991000004
    created: list[Path] = []
    try:
        created += _write_searched(searched)       # excluded (valid result)
        created += _write_fetched_only(fetched)     # included (no result)
        created += _write_fetched_stale(stale)      # included (stale result)
        # `missing` gets no files -> not fetched -> excluded

        stars = [{"tic": t} for t in (searched, fetched, stale, missing)]
        plan = search_pending.pending_to_search(stars)

        assert set(plan) == {"tic-%d" % fetched, "tic-%d" % stale}
        assert "tic-%d" % searched not in plan   # never re-search a valid result
        assert "tic-%d" % missing not in plan     # never fetch here — that is fetch_plausible's job
    finally:
        for p in created:
            p.unlink(missing_ok=True)
