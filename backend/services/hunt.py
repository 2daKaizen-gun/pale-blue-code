import contextlib
import csv
import json
import os
import random
import re
from pathlib import Path

import numpy as np

_CACHE_DIR = Path(__file__).parent.parent / "cache"
_CACHE_DIR.mkdir(exist_ok=True)

_DATA_DIR = Path(__file__).parent.parent / "data"
_KOI_CSV = _DATA_DIR / "koi_catalog.csv"
_TOI_CSV = _DATA_DIR / "toi_catalog.csv"
_FRONTIER_JSON = _DATA_DIR / "frontier_seeds.json"
_TESS_FRONTIER_JSON = _DATA_DIR / "frontier_seeds_tess.json"

_MAX_POINTS = 5000

_koi_cache: list[dict] | None = None
_toi_cache: list[dict] | None = None
_frontier_cache: list[int] | None = None
_tess_frontier_cache: list[int] | None = None

# Demonstration targets — every one is a KNOWN, catalogued Kepler Object of
# Interest, not an undiscovered signal. They exist to learn the vetter against a
# catalogued disposition: run BLS + vetting, form your own verdict, then compare
# with NASA's in the KOI cross-check. (An actual first-time hunt of stars with no
# KOI entry is Phase 9-B — see docs/specs/phase-9/9B-PLAN.md, honesty nail #3.)
# The exact disposition is left for the cross-check to reveal, not the card.
_TARGETS = [
    {
        "kic_id": 9140402,
        "label": "KIC 9140402",
        "description": "Known KOI K00928.01 — a short-period (~2.5 d) candidate. Demo target: vet it, then compare your verdict with the catalog.",
        "hint": "known short-period KOI · demo",
    },
    {
        "kic_id": 4936180,
        "label": "KIC 4936180",
        "description": "Known KOI K00820.01 — a ~4.6-day candidate. Demo target for learning the vetter against a catalogued disposition.",
        "hint": "known ~4.6d KOI · demo",
    },
    {
        "kic_id": 7380537,
        "label": "KIC 7380537",
        "description": "Known KOI K00883.01 — a short-period (~2.7 d) candidate. Demo target: form your own verdict, then check it against NASA's.",
        "hint": "known short-period KOI · demo",
    },
    {
        "kic_id": 11446443,
        "label": "KIC 11446443",
        "description": "Known confirmed planet K00001.01 (Kepler-1b / TrES-2b). Demo target: the vetter should call this a strong candidate.",
        "hint": "known confirmed planet · demo",
    },
    {
        "kic_id": 10583180,
        "label": "KIC 10583180",
        "description": "Known KOI K00748.01. Demo target: form your own verdict, then compare with NASA's disposition in the cross-check.",
        "hint": "known KOI · demo",
    },
]


def get_targets() -> list[dict]:
    return _TARGETS


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def star_name(star_id: int, mission: str = "kepler") -> str:
    """Canonical star label per mission — the one place KIC/TIC naming forks.

    Everything downstream (BLS cache slug, vet cache, LC re-search) keys off this
    string, so switching the prefix here is all it takes to point the same
    four-gate pipeline at a different survey.
    """
    return f"TIC {star_id}" if mission.lower() == "tess" else f"KIC {star_id}"


def _lc_cache_path(kic_id: int) -> Path:
    slug = _slug(f"KIC {kic_id}")
    return _CACHE_DIR / f"lc_{slug}_kepler.json"


def _decimate(
    time: np.ndarray,
    flux: np.ndarray,
    err: np.ndarray,
    max_points: int = _MAX_POINTS,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    n = len(time)
    if n <= max_points:
        return time, flux, err
    step = max(1, n // max_points)
    idx = np.arange(0, n, step)
    return time[idx], flux[idx], err[idx]


def _download_stitched_lc(search):
    """Download + stitch a lightkurve search result, with the progress bar muted.

    astroquery/astropy render a download progress bar to sys.stdout. Inside a
    threadpool worker under uvicorn that stream can be closed mid-download, raising
    "I/O operation on closed file" and 500-ing the request (and worse, leaving a
    half-written .fits behind). We don't need the bar on a server, so silence
    stdout/stderr for the duration of the download.
    """
    with open(os.devnull, "w") as _null, contextlib.redirect_stdout(_null), \
            contextlib.redirect_stderr(_null):
        return search.download_all().stitch().normalize().remove_nans().remove_outliers(sigma=5)


def _purge_mast_cache(kic_id: int) -> None:
    """Delete this star's lightkurve download cache (corrupt/interrupted files)."""
    import shutil

    base = Path.home() / ".cache" / "lightkurve" / "mastDownload"
    if not base.exists():
        return
    for d in base.glob(f"**/kplr{kic_id:09d}_*"):
        if d.is_dir():
            shutil.rmtree(d, ignore_errors=True)


def _build_kepler_payload(
    kic_id: int,
    time_arr: np.ndarray,
    flux_arr: np.ndarray,
    err_arr: np.ndarray,
) -> dict:
    """Assemble the cached Kepler LC payload (pure — no network). Sibling of
    _build_tess_payload.

    Records baseline_days from the FULL (undecimated) series for symmetry with TESS
    (honesty nail 4). Kepler's multi-year baseline clears the vetter's transit-count
    threshold trivially, but the field is reported for both missions. Kepler has no
    sectors, so sector_count is None.
    """
    original_count = len(time_arr)
    baseline_days = float(time_arr[-1] - time_arr[0]) if original_count else 0.0
    time_d, flux_d, err_d = _decimate(time_arr, flux_arr, err_arr)
    star = f"KIC {kic_id}"
    return {
        "kic_id": kic_id,
        "planet_name": star,
        "hostname": star,
        "mission": "Kepler",
        "time": time_d.tolist(),
        "flux": flux_d.tolist(),
        "flux_err": err_d.tolist(),
        "period": None,
        "point_count": len(time_d),
        "original_count": original_count,
        "baseline_days": baseline_days,
        "sector_count": None,
    }


def fetch_lc_by_kic(kic_id: int) -> dict:
    """Fetch and cache a Kepler light curve by KIC number.

    Cache saved as lc_kic-XXXXXXX_kepler.json with hostname = "KIC XXXXXXX"
    so that bls_service._get_full_lc can re-search lightkurve via lc_meta["hostname"].
    """
    import lightkurve as lk
    from lightkurve.utils import LightkurveError

    cache_path = _lc_cache_path(kic_id)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    star_name = f"KIC {kic_id}"
    search = lk.search_lightcurve(star_name, mission="Kepler", author="Kepler", exptime="long")
    if len(search) == 0:
        raise FileNotFoundError(f"No Kepler light curve found for {star_name}")

    try:
        lc = _download_stitched_lc(search)
    except LightkurveError:
        # An interrupted download leaves a corrupt .fits in the lightkurve cache,
        # and every retry then re-reads that bad file. Purge this star's cache and
        # try once more with a clean slate (self-heal against network hiccups).
        _purge_mast_cache(kic_id)
        lc = _download_stitched_lc(search)
    time_arr = lc.time.value.astype(float)
    flux_arr = lc.flux.value.astype(float)
    err_arr = lc.flux_err.value.astype(float) if lc.flux_err is not None else np.zeros_like(flux_arr)

    data = _build_kepler_payload(kic_id, time_arr, flux_arr, err_arr)
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    return data


def _tic_lc_cache_path(tic_id: int) -> Path:
    slug = _slug(f"TIC {tic_id}")
    return _CACHE_DIR / f"lc_{slug}_tess.json"


def _build_tess_payload(
    tic_id: int,
    time_arr: np.ndarray,
    flux_arr: np.ndarray,
    err_arr: np.ndarray,
    sector_count: int,
) -> dict:
    """Assemble the cached TESS LC payload (pure — no network).

    Records baseline_days and sector_count from the FULL (undecimated) series so
    the hunt can be honest about how little TESS actually watched this star: a
    single 27-day sector blunts the four-gate vetter (Phase 10 honesty nail 4).
    """
    original_count = len(time_arr)
    baseline_days = float(time_arr[-1] - time_arr[0]) if original_count else 0.0
    time_d, flux_d, err_d = _decimate(time_arr, flux_arr, err_arr)
    star = f"TIC {tic_id}"
    return {
        "kic_id": tic_id,          # generic star id, kept for HuntLCResponse symmetry
        "planet_name": star,
        "hostname": star,
        "mission": "TESS",
        "author": "SPOC",          # BLS re-search reads this (author="TESS" is invalid)
        "exptime": "short",        # 2-min SPOC cadence — BLS re-search must match
        "time": time_d.tolist(),
        "flux": flux_d.tolist(),
        "flux_err": err_d.tolist(),
        "period": None,
        "point_count": len(time_d),
        "original_count": original_count,
        "baseline_days": baseline_days,
        "sector_count": sector_count,
    }


def fetch_lc_by_tic(tic_id: int) -> dict:
    """Fetch and cache a TESS light curve by TIC number.

    The TESS sibling of fetch_lc_by_kic. Searches SPOC (2-min PDCSAP), stitches
    all sectors, caches as lc_tic-XXXXXX_tess.json with mission="TESS" so that
    bls_service._find_lc_cache (which already iterates "tess") picks it up and
    _get_full_lc re-searches via lc_meta["author"].
    """
    import lightkurve as lk
    from lightkurve.utils import LightkurveError

    cache_path = _tic_lc_cache_path(tic_id)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    star_name = f"TIC {tic_id}"
    search = lk.search_lightcurve(star_name, mission="TESS", author="SPOC")
    if len(search) == 0:
        raise FileNotFoundError(f"No TESS SPOC light curve found for {star_name}")

    try:
        lc = _download_stitched_lc(search)
    except LightkurveError:
        # A single retry against a network hiccup. (The Kepler self-heal purge is
        # KIC-filename specific; TESS product names differ, so we simply retry.)
        lc = _download_stitched_lc(search)

    time_arr = lc.time.value.astype(float)
    flux_arr = lc.flux.value.astype(float)
    err_arr = lc.flux_err.value.astype(float) if lc.flux_err is not None else np.zeros_like(flux_arr)

    data = _build_tess_payload(tic_id, time_arr, flux_arr, err_arr, sector_count=len(search))
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    return data


def lc_sector_count(star_id: int, mission: str = "kepler") -> int | None:
    """Sectors recorded when the TESS light curve was fetched; None for Kepler.

    Read from the cached LC payload (_build_tess_payload stores sector_count) so the
    vetter can report how many TESS sectors the gates actually saw (honesty nail 4).
    Kepler has no sectors, and a missing/corrupt cache degrades to None rather than
    guessing.
    """
    if mission.lower() != "tess":
        return None
    path = _tic_lc_cache_path(star_id)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data.get("sector_count")


def _load_koi_catalog() -> list[dict]:
    global _koi_cache
    if _koi_cache is None:
        with _KOI_CSV.open(encoding="utf-8") as f:
            _koi_cache = list(csv.DictReader(f))
    return _koi_cache


def _harmonic_factor(
    bls_period: float, koi_period: float, tolerance: float, max_n: int = 4
) -> float | None:
    """Relate a BLS peak to a catalog period, accounting for aliasing.

    BLS frequently locks onto an integer multiple or divisor of the true
    transit period (e.g. a 4x or half-period alias) when the data span is long
    relative to the period. Return the matched ratio (1.0 exact, 4.0 = 4x alias,
    0.5 = half-period alias), or None if no harmonic matches within tolerance.
    """
    for n in range(1, max_n + 1):
        if abs(bls_period - n * koi_period) / (n * koi_period) < tolerance:
            return float(n)
        if abs(koi_period - n * bls_period) / (n * bls_period) < tolerance:
            return 1.0 / n
    return None


def koi_check(kic_id: int, period: float, tolerance: float = 0.05) -> list[dict]:
    """Return KOI entries for this star matching the period or one of its harmonics."""
    rows = _load_koi_catalog()
    matches = []
    for r in rows:
        if int(r["kepid"]) != kic_id:
            continue
        try:
            koi_period = float(r["koi_period"])
        except (ValueError, KeyError):
            continue
        factor = _harmonic_factor(period, koi_period, tolerance)
        if factor is not None:
            matches.append({
                "kepoi_name": r["kepoi_name"],
                "disposition": r["koi_disposition"],
                "koi_period": koi_period,
                "harmonic": factor,
            })
    return matches


def koi_entries(kic_id: int) -> list[dict]:
    """All KOI rows for this star, period-independent (membership by kepid alone).

    This is the "is this star recorded at all?" test — distinct from koi_check,
    which matches a specific period harmonic. A star with ANY KOI entry is already
    on file, so it is not undiscovered hunting ground (Phase 9-B honesty nail #3).
    """
    return [r for r in _load_koi_catalog() if int(r["kepid"]) == kic_id]


def is_recorded(kic_id: int) -> bool:
    """True if the star has any KOI entry — i.e. someone already filed it."""
    return len(koi_entries(kic_id)) > 0


def _load_toi_catalog() -> list[dict]:
    global _toi_cache
    if _toi_cache is None:
        with _TOI_CSV.open(encoding="utf-8") as f:
            _toi_cache = list(csv.DictReader(f))
    return _toi_cache


def toi_entries(tic_id: int) -> list[dict]:
    """All TOI rows for this star, keyed by TIC id (`tid`) alone.

    The TESS analogue of koi_entries: "is this star recorded at all?" A star with
    ANY TOI entry is already on file, so it is not undiscovered TESS hunting ground
    (honesty nail #3, extended to TESS in Phase 10). tfopwg_disp carries the TFOPWG
    disposition (FP / PC / CP / KP); toi is the TOI designation.
    """
    rows = _load_toi_catalog()
    out = []
    for r in rows:
        try:
            if int(float(r["tid"])) == tic_id:
                out.append(r)
        except (ValueError, KeyError):
            continue
    return out


def is_recorded_tess(tic_id: int) -> bool:
    """True if the star has any TOI entry — i.e. someone already filed it."""
    return len(toi_entries(tic_id)) > 0


def _load_frontier() -> list[int]:
    """Pre-verified pool of unrecorded KICs with real Kepler light curves.

    Built offline by scripts/build_frontier_seeds.py; runtime only reads the JSON.
    """
    global _frontier_cache
    if _frontier_cache is None:
        payload = json.loads(_FRONTIER_JSON.read_text(encoding="utf-8"))
        _frontier_cache = [int(k) for k in payload["kics"]]
    return _frontier_cache


def pick_frontier(rng: random.Random | None = None) -> int:
    """Pick one unrecorded KIC from the seed pool. RNG injectable for tests."""
    return (rng or random.Random()).choice(_load_frontier())


def _load_frontier_tess() -> list[int]:
    """Pre-verified pool of unrecorded TICs with real SPOC light curves.

    Built offline by scripts/build_frontier_seeds_tess.py; runtime reads the JSON
    only. The TESS sibling of _load_frontier.
    """
    global _tess_frontier_cache
    if _tess_frontier_cache is None:
        payload = json.loads(_TESS_FRONTIER_JSON.read_text(encoding="utf-8"))
        _tess_frontier_cache = [int(t) for t in payload["tics"]]
    return _tess_frontier_cache


def pick_frontier_tess(rng: random.Random | None = None) -> int:
    """Pick one unrecorded TIC from the TESS seed pool. RNG injectable for tests."""
    return (rng or random.Random()).choice(_load_frontier_tess())
