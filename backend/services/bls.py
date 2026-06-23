import json
import re
from pathlib import Path

import numpy as np

_CACHE_DIR = Path(__file__).parent.parent / "cache"
_CACHE_DIR.mkdir(exist_ok=True)

_PERIOD_MIN = 1.0
_PERIOD_MAX = 500.0
_PERIOD_GRID = 10_000
_DURATIONS = [0.1, 0.3, 0.5]  # days — covers hot Jupiter to Earth-like transits

_KEPLER_CADENCE_DAYS = 0.0204   # 29.4 min long-cadence
_DETREND_WINDOW_DAYS = 30.0     # SG window — long enough to remove 430d systematic,
                                 # >> transit duration (0.46d) so transits are preserved


def _slug(planet_name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", planet_name.lower()).strip("-")


def _bls_cache_path(planet_name: str) -> Path:
    return _CACHE_DIR / f"bls_{_slug(planet_name)}.json"


def _find_lc_cache(planet_name: str) -> dict | None:
    slug = _slug(planet_name)
    for mission in ("kepler", "tess", "k2"):
        p = _CACHE_DIR / f"lc_{slug}_{mission}.json"
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8"))
    return None


def _get_full_lc(planet_name: str, lc_meta: dict) -> tuple[np.ndarray, np.ndarray]:
    """Return full-resolution time+flux for BLS, cached as bls_lc_*.json.

    The display lc cache (lc_*.json) is decimated to 5,000 points — too sparse
    for BLS on planets with few transits (e.g. Kepler-452 b: ~3 transits,
    each only 1-2 points after decimation). bls_lc_*.json stores the full
    undecimated dataset so BLS can detect all transit events.

    remove_outliers is skipped: transit dips (~820 ppm for Kepler-452 b) can be
    at 5σ for quiet stars and get clipped, destroying the BLS signal.
    """
    import lightkurve as lk

    full_path = _CACHE_DIR / f"bls_lc_{_slug(planet_name)}.json"
    if full_path.exists():
        data = json.loads(full_path.read_text(encoding="utf-8"))
        return np.array(data["time"]), np.array(data["flux"])

    hostname = lc_meta.get("hostname", planet_name)
    mission = lc_meta.get("mission", "Kepler")

    search = lk.search_lightcurve(hostname, mission=mission, author=mission, exptime="long")
    if len(search) == 0:
        return np.array(lc_meta["time"]), np.array(lc_meta["flux"])

    lc_col = search.download_all()
    lc = lc_col.stitch().normalize().remove_nans()

    time = lc.time.value.astype(float)
    flux = lc.flux.value.astype(float)

    full_path.write_text(
        json.dumps({"time": time.tolist(), "flux": flux.tolist()}),
        encoding="utf-8",
    )
    return time, flux


def _detrend(time: np.ndarray, flux: np.ndarray) -> np.ndarray:
    """Per-segment Savitzky-Golay detrend to remove long-term systematics.

    Splits at gaps > 1 day (Kepler quarter boundaries), then applies a 30-day
    SG polynomial to each segment. This removes the ~430-day instrumental
    systematic seen in Kepler-452 data while preserving the 0.46-day transit.
    """
    from scipy.signal import savgol_filter

    win = int(_DETREND_WINDOW_DAYS / _KEPLER_CADENCE_DAYS)
    if win % 2 == 0:
        win += 1

    sort_idx = np.argsort(time)
    t = time[sort_idx]
    f = flux[sort_idx]

    gap_idx = np.where(np.diff(t) > 1.0)[0] + 1
    segments = np.split(np.arange(len(t)), gap_idx)

    flat = f.copy()
    for seg in segments:
        n = len(seg)
        if n < win:
            continue
        trend = savgol_filter(f[seg], window_length=win, polyorder=2)
        # avoid dividing by near-zero trend
        flat[seg] = np.where(np.abs(trend) > 1e-9, f[seg] / trend, f[seg])

    return flat


def run_bls(planet_name: str) -> dict:
    """Run BLS on full-resolution, detrended light curve. Results cached as bls_*.json."""
    from astropy.timeseries import BoxLeastSquares

    bls_path = _bls_cache_path(planet_name)
    if bls_path.exists():
        return json.loads(bls_path.read_text(encoding="utf-8"))

    lc_meta = _find_lc_cache(planet_name)
    if lc_meta is None:
        raise FileNotFoundError(f"No light curve cache found for '{planet_name}'")

    time, flux = _get_full_lc(planet_name, lc_meta)
    flux = _detrend(time, flux)

    periods = np.geomspace(_PERIOD_MIN, _PERIOD_MAX, _PERIOD_GRID)
    durations = np.array(_DURATIONS)

    bls = BoxLeastSquares(time, flux)
    result = bls.power(periods, durations)

    best_idx = int(np.argmax(result.power))
    best_period = float(result.period[best_idx])
    best_duration = float(result.duration[best_idx])
    best_t0 = float(result.transit_time[best_idx])

    stats = bls.compute_stats(
        result.period[best_idx],
        result.duration[best_idx],
        result.transit_time[best_idx],
    )

    data = {
        "planet_name": planet_name,
        "periods": result.period.tolist(),
        "powers": result.power.tolist(),
        "best": {
            "period": best_period,
            "duration": best_duration,
            "depth": float(stats["depth"][0]),
            "transit_time": best_t0,
            "power": float(result.power[best_idx]),
        },
    }

    bls_path.write_text(json.dumps(data), encoding="utf-8")
    return data
