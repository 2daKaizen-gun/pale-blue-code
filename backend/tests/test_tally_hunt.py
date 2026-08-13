"""tally_hunt.compute_tally reads the caches honestly — searched vs fetched vs not-fetched.

The tally script is the counter that replaced a drifting hand count (sub-11-16). These tests pin
the exact classification it makes, using synthetic cache files in the real cache dir (created and
removed here, the same pattern the hunt-ledger tests use), so a future change to the cache shape or
the disposition rules cannot silently corrupt the count.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import bls as bls_service  # noqa: E402
from services import monotransit as mt  # noqa: E402

import tally_hunt  # noqa: E402


def _write_searched(tic: int, candidates: list[dict]) -> list[Path]:
    """Make TIC read as *searched*: a bls_lc source + a valid mono cache keyed on its mtime."""
    name = "tic-%d" % tic
    slug = bls_service._slug(name)
    src = bls_service._CACHE_DIR / f"bls_lc_{slug}.json"
    mono = bls_service._CACHE_DIR / f"mono_{slug}.json"
    src.write_text(json.dumps({"time": [], "flux": []}), encoding="utf-8")
    stored = {
        "version": mt._MONO_CACHE_VERSION,
        "lc_mtime_ns": src.stat().st_mtime_ns,
        "result": {"planet_name": name, "candidates": candidates, "depth_floor": 0.004},
    }
    mono.write_text(json.dumps(stored), encoding="utf-8")
    return [src, mono]


def _write_fetched_only(tic: int) -> list[Path]:
    """Make TIC read as *fetched, not searched*: a raw MAST curve, no mono cache."""
    name = "tic-%d" % tic
    slug = bls_service._slug(name)
    lc = bls_service._CACHE_DIR / f"lc_{slug}_tess.json"
    lc.write_text(json.dumps({"mission": "TESS"}), encoding="utf-8")
    return [lc]


def _event(*, candidate: bool, significant: bool, significance, failed=()):
    checks = [{"name": n, "passed": n not in failed}
              for n in ("edge", "coherence", "flare", "symmetry")]
    return {"candidate": candidate, "significant": significant,
            "significance": significance, "checks": checks}


def test_compute_tally_classifies_every_on_disk_state():
    # Fake TICs far outside any real pool, cleaned up in finally.
    quiet, rej, insig, fetched, missing = 990000001, 990000002, 990000003, 990000004, 990000005
    created: list[Path] = []
    try:
        created += _write_searched(quiet, [])  # no events -> no_event (quiet)
        created += _write_searched(rej, [
            _event(candidate=False, significant=True, significance=11.85, failed=("edge", "symmetry")),
        ])
        created += _write_searched(insig, [
            _event(candidate=False, significant=False, significance=0.05),
        ])
        created += _write_fetched_only(fetched)
        # `missing` gets no files at all -> not_fetched

        stars = [{"tic": t} for t in (quiet, rej, insig, fetched, missing)]
        t = tally_hunt.compute_tally(stars)

        assert t["total"] == 5
        assert t["searched"] == 3
        assert t["quiet"] == 1
        assert t["insignificant"] == 1
        assert t["rejected"] == 1
        assert t["candidates"] == 0
        assert t["fetched_pending"] == 1
        assert t["not_fetched"] == 1
        # the rejected row carries its significance and the exact gates it failed
        assert t["rejected_rows"] == [(rej, 11.85, ["edge", "symmetry"])]
    finally:
        for p in created:
            p.unlink(missing_ok=True)


def test_a_stale_mono_cache_counts_as_not_searched():
    """A mono cache whose lc_mtime_ns no longer matches its source is not a valid search —
    it must fall back to 'fetched, not searched', never be counted as searched with a stale verdict."""
    tic = 990000009
    name = "tic-%d" % tic
    slug = bls_service._slug(name)
    src = bls_service._CACHE_DIR / f"bls_lc_{slug}.json"
    mono = bls_service._CACHE_DIR / f"mono_{slug}.json"
    lc = bls_service._CACHE_DIR / f"lc_{slug}_tess.json"
    try:
        src.write_text(json.dumps({"time": [], "flux": []}), encoding="utf-8")
        lc.write_text(json.dumps({"mission": "TESS"}), encoding="utf-8")
        mono.write_text(json.dumps({
            "version": mt._MONO_CACHE_VERSION,
            "lc_mtime_ns": src.stat().st_mtime_ns + 1,  # deliberately wrong: source changed since
            "result": {"planet_name": name, "candidates": [], "depth_floor": 0.004},
        }), encoding="utf-8")

        t = tally_hunt.compute_tally([{"tic": tic}])
        assert t["searched"] == 0
        assert t["fetched_pending"] == 1  # raw curve still on disk, but the search is stale
        assert t["not_fetched"] == 0
    finally:
        for p in (src, mono, lc):
            p.unlink(missing_ok=True)
