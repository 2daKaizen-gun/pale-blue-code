"""compare_flux_floors summarizes the SAP-vs-PDCSAP floor measurement honestly (path A, lever 1).

The measurement itself is a slow MAST download; these tests pin the pure comparison it feeds into —
the sqrt(floor)*R_star conversion, the sign convention (positive delta = SAP reaches a smaller
planet), the tally of which flux wins, and the honest exclusion of a star missing either floor
(a "no comparison", never a fabricated tie) — so the conclusion the check doc reports cannot drift.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))

from services import pool_assessment as pa   # noqa: E402

import measure_flux_choice as mfc   # noqa: E402


def _rearth(radius, floor):
    return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, floor))


def test_sap_lower_floor_counts_as_sap_better():
    # Same star, SAP floor shallower (0.001 < 0.002) -> SAP reaches a smaller planet -> delta > 0.
    rows = [{"tic": 1, "radius": 0.3, "pdcsap_floor": 0.002, "sap_floor": 0.001}]
    out = mfc.compare_flux_floors(rows)
    assert out["n_compared"] == 1
    assert out["n_sap_better"] == 1
    star = out["stars"][0]
    assert star["delta_rearth"] > 0
    assert star["delta_rearth"] == _rearth(0.3, 0.002) - _rearth(0.3, 0.001)


def test_pdcsap_lower_floor_counts_against_sap():
    rows = [{"tic": 2, "radius": 0.3, "pdcsap_floor": 0.001, "sap_floor": 0.004}]
    out = mfc.compare_flux_floors(rows)
    assert out["n_compared"] == 1
    assert out["n_sap_better"] == 0
    assert out["stars"][0]["delta_rearth"] < 0


def test_missing_floor_is_excluded_not_a_tie():
    rows = [
        {"tic": 3, "radius": 0.3, "pdcsap_floor": 0.002, "sap_floor": None},
        {"tic": 4, "radius": None, "pdcsap_floor": 0.002, "sap_floor": 0.001},
        {"tic": 5, "radius": 0.3, "pdcsap_floor": 0.002, "sap_floor": 0.001},
    ]
    out = mfc.compare_flux_floors(rows)
    assert out["n_compared"] == 1                      # only TIC 5 has both floors + a radius
    assert out["stars"][0]["delta_rearth"] is None     # TIC 3: no SAP floor -> no comparison
    assert out["stars"][1]["delta_rearth"] is None     # TIC 4: no radius -> no R_earth


def test_median_delta_over_several_stars():
    rows = [
        {"tic": 1, "radius": 0.3, "pdcsap_floor": 0.002, "sap_floor": 0.001},   # SAP better
        {"tic": 2, "radius": 0.3, "pdcsap_floor": 0.001, "sap_floor": 0.001},   # tie (delta 0)
        {"tic": 3, "radius": 0.3, "pdcsap_floor": 0.001, "sap_floor": 0.004},   # PDCSAP better
    ]
    out = mfc.compare_flux_floors(rows)
    assert out["n_compared"] == 3
    assert out["n_sap_better"] == 1                    # delta 0 does not count as SAP-better
    deltas = sorted(s["delta_rearth"] for s in out["stars"])
    assert out["median_delta_rearth"] == deltas[1]
