"""assemble_dossier pins decision D's honest presentation over the caches.

The dossier is a caches-only read; these tests pin the pure assembly it produces — the Earth-size
filter, sharpest-first order, the honest disposition meaning (never softer than the search found),
the candidate count, and the exclusion of a target with unknown sensitivity — so the deliverable's
claims cannot drift.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

import earth_size_dossier as esd   # noqa: E402


def _row(tic, min_rearth, disposition="no_event", radius=0.2, floor=0.001, sectors=6, baseline=2500.0):
    return {"tic": tic, "radius": radius, "floor": floor, "min_rearth": min_rearth,
            "sectors": sectors, "baseline_days": baseline, "disposition": disposition}


def test_only_earth_size_targets_are_kept_and_sorted_sharpest_first():
    rows = [_row(1, 1.20), _row(2, 0.60), _row(3, 2.50)]   # TIC 3 is too big
    out = esd.assemble_dossier(rows, earth_max=1.25)
    assert out["n_targets"] == 2
    assert [t["tic"] for t in out["targets"]] == [2, 1]    # sharpest (smallest R_e) first


def test_disposition_meaning_matches_what_the_search_found():
    out = esd.assemble_dossier([_row(1, 0.6, disposition="no_event")])
    assert "no single-transit event" in out["targets"][0]["meaning"]
    assert out["n_candidates"] == 0


def test_a_surviving_candidate_is_counted_and_named():
    out = esd.assemble_dossier([_row(1, 0.6, disposition="candidate")])
    assert out["n_candidates"] == 1
    assert "survived every gate" in out["targets"][0]["meaning"]


def test_unknown_sensitivity_is_dropped_not_claimed():
    rows = [_row(1, None), _row(2, 0.6)]
    out = esd.assemble_dossier(rows)
    assert [t["tic"] for t in out["targets"]] == [2]


def test_a_rejected_or_unsearched_target_reports_honestly():
    rows = [_row(1, 0.6, disposition="rejected"), _row(2, 0.6, disposition=None)]
    out = esd.assemble_dossier(rows)
    by_tic = {t["tic"]: t for t in out["targets"]}
    assert "instrument artifact" in by_tic[1]["meaning"]
    assert by_tic[2]["meaning"] == esd._DISPOSITION_MEANING[None]
    assert out["n_candidates"] == 0
