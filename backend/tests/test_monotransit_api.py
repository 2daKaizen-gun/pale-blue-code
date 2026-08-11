"""sub-11-2 Light 5 — the /api/monotransit wire contract.

Service logic is covered in test_monotransit.py; these lock the HTTP surface:
status codes, the response-model shape, and the full lc -> detrend -> search ->
significance -> discriminators path running end to end. A synthetic light curve is
written into the cache under a throwaway slug so the test never depends on the
gitignored real caches, then cleaned up.
"""

import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from main import app
from services import bls as bls_service
from services import monotransit as mono

client = TestClient(app)

_SLUG = "test-mono-fixture"
_CADENCE = 2.0 / 60 / 24     # TESS 2-min, days
_T0 = 13.0                   # one clean transit, mid-span, clear of both ends


@pytest.fixture
def cached_lc():
    """Write a single-sector light curve with one injected transit, then remove it."""
    time = np.arange(0.0, 27.0, _CADENCE)
    rng = np.random.default_rng(0)
    flux = mono.transit_model(time, _T0, 0.3, 0.01) + rng.normal(0.0, 5e-4, size=time.shape)

    cache = bls_service._CACHE_DIR
    bls_lc = cache / f"bls_lc_{_SLUG}.json"
    disp_lc = cache / f"lc_{_SLUG}_tess.json"
    bls_lc.write_text(json.dumps({"time": time.tolist(), "flux": flux.tolist()}), encoding="utf-8")
    disp_lc.write_text(json.dumps({"hostname": _SLUG, "mission": "tess"}), encoding="utf-8")
    try:
        yield _SLUG
    finally:
        bls_lc.unlink(missing_ok=True)
        disp_lc.unlink(missing_ok=True)


def test_monotransit_endpoint_finds_the_injected_candidate(cached_lc):
    r = client.get(f"/api/monotransit/{cached_lc}")
    assert r.status_code == 200
    body = r.json()
    assert body["planet_name"] == cached_lc
    assert body["candidates"], "the injected transit should surface as an event"

    top = body["candidates"][0]
    assert abs(top["t0"] - _T0) < 0.1
    assert top["significance"] is not None and top["significance"] > mono._SIG_MIN_MONO
    assert top["passed"] is True
    assert top["candidate"] is True
    # the four named discriminators are all present in the report
    assert {c["name"] for c in top["checks"]} == {"edge", "coherence", "flare", "symmetry"}


def test_monotransit_endpoint_missing_lc_returns_424():
    r = client.get("/api/monotransit/no-such-star-anywhere")
    assert r.status_code == 424
    assert r.json()["detail"]["planet"] == "no-such-star-anywhere"


# --- the hunt endpoint (sub-11-3 Light 3) -------------------------------------

def _write_star(tic, time, flux):
    slug = f"tic-{tic}"
    cache = bls_service._CACHE_DIR
    (cache / f"bls_lc_{slug}.json").write_text(
        json.dumps({"time": time.tolist(), "flux": flux.tolist()}), encoding="utf-8")
    (cache / f"lc_{slug}_tess.json").write_text(
        json.dumps({"hostname": slug, "mission": "tess"}), encoding="utf-8")


def _remove_star(tic):
    slug = f"tic-{tic}"
    (bls_service._CACHE_DIR / f"bls_lc_{slug}.json").unlink(missing_ok=True)
    (bls_service._CACHE_DIR / f"lc_{slug}_tess.json").unlink(missing_ok=True)


@pytest.fixture
def tiny_pool(monkeypatch):
    """A three-star frontier pool: one with a real transit, one flat, one uncached."""
    real, flat, missing = 99000001, 99000002, 99000003
    time = np.arange(0.0, 27.0, _CADENCE)
    rng = np.random.default_rng(1)
    _write_star(real, time, mono.transit_model(time, _T0, 0.3, 0.01) + rng.normal(0, 5e-4, time.shape))
    _write_star(flat, time, 1.0 + rng.normal(0, 5e-4, time.shape))
    monkeypatch.setattr(
        "services.hunt.frontier_tess_stars",
        lambda: [{"tic": real}, {"tic": flat}, {"tic": missing}],
    )
    try:
        yield real, flat, missing
    finally:
        _remove_star(real)
        _remove_star(flat)


def test_hunt_endpoint_promotes_survivor_and_ledgers_the_pool(tiny_pool):
    real, flat, missing = tiny_pool
    r = client.get("/api/monotransit/hunt")
    assert r.status_code == 200
    body = r.json()
    assert body["mission"] == "tess"
    assert body["searched"] == 2                 # real + flat cached; missing is not
    assert len(body["ledger"]) == 3

    disp = {e["planet_name"]: e["disposition"] for e in body["ledger"]}
    assert disp[f"TIC {missing}"] == "not_fetched"
    assert disp[f"TIC {real}"] == "candidate"

    assert len(body["survivors"]) == 1
    assert body["survivors"][0]["planet_name"] == f"TIC {real}"
    assert body["survivors"][0]["candidate"] is True


def test_hunt_endpoint_rejects_non_tess():
    r = client.get("/api/monotransit/hunt", params={"mission": "kepler"})
    assert r.status_code == 400


def test_hunt_endpoint_carries_the_size_verdict_per_star(monkeypatch):
    # sub-11-6: the hunt joins the sub-11-5 triage, so each searched star and each survivor says
    # what a detection there would MEAN. A transit on a dwarf reads plausible with a real min radius.
    tic = 99000010
    time = np.arange(0.0, 27.0, _CADENCE)
    rng = np.random.default_rng(2)
    _write_star(tic, time, mono.transit_model(time, _T0, 0.3, 0.01) + rng.normal(0, 5e-4, time.shape))
    # a dwarf pool: radius small enough that the detection floor implies a planet-sized companion
    monkeypatch.setattr(
        "services.hunt.frontier_tess_stars",
        lambda: [{"tic": tic, "tmag": 9.0, "constellation": "Pavo", "radius": 1.0}],
    )
    try:
        r = client.get("/api/monotransit/hunt")
    finally:
        _remove_star(tic)

    assert r.status_code == 200
    body = r.json()
    entry = body["ledger"][0]
    assert entry["size_class"] == "plausible"
    assert entry["min_planet_rjup"] is not None
    assert body["survivors"][0]["size_class"] == "plausible"
    assert body["survivors"][0]["min_planet_rjup"] is not None


# --- the pool assessment endpoint (sub-11-5 Light 3) --------------------------

def test_pool_endpoint_ranks_and_summarizes_the_real_pool():
    r = client.get("/api/monotransit/pool")
    assert r.status_code == 200
    body = r.json()
    summary, targets = body["summary"], body["targets"]

    assert summary["total"] == len(targets)
    assert summary["plausible"] + summary["too_big"] + summary["unknown"] == summary["total"]
    assert summary["plausible"] > summary["too_big"]        # a dwarf-dominant, hunt-selected pool
    # ranked plausible-first, and a plausible target carries a real planet radius
    assert targets[0]["classification"] == "plausible"
    assert targets[0]["min_planet_rjup"] is not None
    assert targets[0]["min_planet_rjup"] <= summary["planet_max_rjup"]


# --- the fetch-plan endpoint (sub-11-7 Light 3) -------------------------------

def test_fetch_plan_endpoint_lists_plausible_targets_without_fetching(monkeypatch):
    # a two-star pool: one dwarf (plausible, worth a fetch) and one giant (too_big, excluded)
    monkeypatch.setattr(
        "services.hunt.frontier_tess_stars",
        lambda: [
            {"tic": 501, "tmag": 9.0, "constellation": "Pavo", "radius": 1.0},   # dwarf
            {"tic": 502, "tmag": 5.0, "constellation": "Tucana", "radius": 40.0},  # giant
        ],
    )
    r = client.get("/api/monotransit/fetch-plan")
    assert r.status_code == 200
    body = r.json()
    # only the dwarf is a target; the giant never appears in a fetch plan
    assert [t["star_name"] for t in body["targets"]] == ["TIC 501"]
    assert body["summary"]["plausible"] == 1
    assert body["summary"]["best_target"] == "TIC 501"
    assert body["summary"]["best_min_planet_rjup"] is not None
    # every target says cached or pending; the counts account for all of them
    s = body["summary"]
    assert s["cached"] + s["pending"] == s["plausible"]
