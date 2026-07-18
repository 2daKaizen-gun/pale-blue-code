"""sub-9B-1 frontier endpoints — HTTP contract tests.

Service-level tests (test_hunt.py) cover the logic; these lock the wire contract:
status codes, response-model shape, and the /api prefix the frontend calls.
"""
from fastapi.testclient import TestClient

from main import app
from services import hunt

client = TestClient(app)

_KNOWN_KOI_KIC = 11446443
_KNOWN_TOI_TIC = 50365310   # TOI 1000.01


def test_frontier_random_returns_unrecorded_pool_member():
    r = client.get("/api/hunt/frontier/random")
    assert r.status_code == 200
    body = r.json()
    assert body["recorded"] is False
    assert body["kic_id"] in hunt._load_frontier()


def test_frontier_random_tess_returns_unrecorded_pool_member():
    r = client.get("/api/hunt/frontier/random?mission=tess")
    assert r.status_code == 200
    body = r.json()
    assert body["recorded"] is False
    assert body["kic_id"] in hunt._load_frontier_tess()   # kic_id carries the TIC


def test_recorded_endpoint_flags_a_known_koi():
    r = client.get(f"/api/hunt/recorded/{_KNOWN_KOI_KIC}")
    assert r.status_code == 200
    body = r.json()
    assert body["kic_id"] == _KNOWN_KOI_KIC
    assert body["recorded"] is True
    assert len(body["entries"]) > 0
    assert all(e["kepoi_name"] and e["disposition"] for e in body["entries"])


def test_recorded_endpoint_reports_absent_star_as_unrecorded():
    r = client.get("/api/hunt/recorded/1")
    assert r.status_code == 200
    body = r.json()
    assert body["recorded"] is False
    assert body["entries"] == []


def test_recorded_endpoint_flags_a_known_toi_under_tess_mission():
    r = client.get(f"/api/hunt/recorded/{_KNOWN_TOI_TIC}?mission=tess")
    assert r.status_code == 200
    body = r.json()
    assert body["recorded"] is True
    assert len(body["entries"]) > 0
    assert all(e["kepoi_name"].startswith("TOI ") for e in body["entries"])


def test_recorded_endpoint_default_mission_is_kepler():
    # The same TIC number under the default (Kepler) mission is read as a KIC —
    # it is not a recorded KOI, so the mission param must actually switch catalogs.
    r = client.get(f"/api/hunt/recorded/{_KNOWN_TOI_TIC}")
    assert r.status_code == 200
    assert r.json()["recorded"] is False
