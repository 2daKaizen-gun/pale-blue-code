import csv
import json
import re
from pathlib import Path

import numpy as np

_CACHE_DIR = Path(__file__).parent.parent / "cache"
_CACHE_DIR.mkdir(exist_ok=True)

_DATA_DIR = Path(__file__).parent.parent / "data"
_KOI_CSV = _DATA_DIR / "koi_catalog.csv"

_MAX_POINTS = 5000

_koi_cache: list[dict] | None = None

_TARGETS = [
    {
        "kic_id": 9140402,
        "label": "KIC 9140402",
        "description": "Faint Kepler field star with suspected short-period dimming events.",
        "hint": "short-period transit signal",
    },
    {
        "kic_id": 4936180,
        "label": "KIC 4936180",
        "description": "Moderate brightness fluctuations at regular 4-5 day intervals.",
        "hint": "4-5 day periodicity suspected",
    },
    {
        "kic_id": 7380537,
        "label": "KIC 7380537",
        "description": "Rapid periodic flux drops flagged by automated pipeline.",
        "hint": "hot Jupiter candidate range",
    },
    {
        "kic_id": 11446443,
        "label": "KIC 11446443",
        "description": "Well-studied Kepler target — run BLS to verify the published result.",
        "hint": "confirmed result available for comparison",
    },
    {
        "kic_id": 10583180,
        "label": "KIC 10583180",
        "description": "Strong photometric signal detected — nature of the source unconfirmed.",
        "hint": "strong signal, interpretation contested",
    },
]


def get_targets() -> list[dict]:
    return _TARGETS


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


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


def fetch_lc_by_kic(kic_id: int) -> dict:
    """Fetch and cache a Kepler light curve by KIC number.

    Cache saved as lc_kic-XXXXXXX_kepler.json with hostname = "KIC XXXXXXX"
    so that bls_service._get_full_lc can re-search lightkurve via lc_meta["hostname"].
    """
    import lightkurve as lk

    cache_path = _lc_cache_path(kic_id)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    star_name = f"KIC {kic_id}"
    search = lk.search_lightcurve(star_name, mission="Kepler", author="Kepler", exptime="long")
    if len(search) == 0:
        raise FileNotFoundError(f"No Kepler light curve found for {star_name}")

    lc = search.download_all().stitch().normalize().remove_nans().remove_outliers(sigma=5)
    time_arr = lc.time.value.astype(float)
    flux_arr = lc.flux.value.astype(float)
    err_arr = lc.flux_err.value.astype(float) if lc.flux_err is not None else np.zeros_like(flux_arr)

    original_count = len(time_arr)
    time_d, flux_d, err_d = _decimate(time_arr, flux_arr, err_arr)

    data = {
        "kic_id": kic_id,
        "planet_name": star_name,
        "hostname": star_name,
        "mission": "Kepler",
        "time": time_d.tolist(),
        "flux": flux_d.tolist(),
        "flux_err": err_d.tolist(),
        "period": None,
        "point_count": len(time_d),
        "original_count": original_count,
    }
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    return data


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
