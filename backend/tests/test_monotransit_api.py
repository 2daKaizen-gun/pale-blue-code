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
