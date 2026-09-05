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

_DETREND_WINDOW_DAYS = 30.0     # SG window — long enough to remove 430d systematic,
                                 # >> transit duration (0.46d) so transits are preserved
_MIN_WINDOW_DAYS = 5.0          # floor: 10x the longest duration in _DURATIONS. Below
                                 # this the SG curve starts following the transit and
                                 # divides it out — measured at 96% depth kept at 5d,
                                 # 82% at 2d (scripts/measure_detrend_window.py).
_POLYORDER = 2


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
    for BLS (a planet with few transits would have only 1-2 points per transit
    after decimation, making BLS blind). bls_lc_*.json stores the full
    undecimated dataset so BLS can count all transit events.

    remove_outliers is skipped: transit dips can reach 5σ depth on quiet stars
    and get clipped at sigma=5, destroying the BLS signal.
    """
    import lightkurve as lk

    full_path = _CACHE_DIR / f"bls_lc_{_slug(planet_name)}.json"
    if full_path.exists():
        data = json.loads(full_path.read_text(encoding="utf-8"))
        return np.array(data["time"]), np.array(data["flux"])

    hostname = lc_meta.get("hostname", planet_name)
    mission = lc_meta.get("mission", "Kepler")
    # author/exptime default to the Kepler convention (author == mission, long
    # cadence) but are overridden by whatever fetch stored — TESS caches author
    # "SPOC" + exptime "short" because author="TESS" is not a valid MAST author.
    author = lc_meta.get("author", mission)
    exptime = lc_meta.get("exptime", "long")

    search = lk.search_lightcurve(hostname, mission=mission, author=author, exptime=exptime)
    if len(search) == 0:
        raise FileNotFoundError(f"No light curve found for '{planet_name}' via {mission}")

    lc_col = search.download_all()
    lc = lc_col.stitch().normalize().remove_nans()

    time = lc.time.value.astype(float)
    flux = lc.flux.value.astype(float)

    full_path.write_text(
        json.dumps({"time": time.tolist(), "flux": flux.tolist()}),
        encoding="utf-8",
    )
    return time, flux


def _cadence_days(sorted_time: np.ndarray) -> float:
    """Sampling interval measured from the data (median step, robust to gaps)."""
    if len(sorted_time) < 2:
        return 0.0
    step = float(np.median(np.diff(sorted_time)))
    return step if np.isfinite(step) and step > 0 else 0.0


def _detrend(time: np.ndarray, flux: np.ndarray, window_days: float | None = None) -> np.ndarray:
    """Per-segment Savitzky-Golay detrend to remove long-term systematics.

    ``window_days`` overrides the SG window for a single call (default: the module
    constant ``_DETREND_WINDOW_DAYS``). The production pipeline never passes it — the
    30-day window stands — but path A's lever-2 measurement sweeps it to ask, from
    evidence, which window minimises the *noise floor* on real monotransit targets
    (scripts/measure_detrend_floor.py). It complements measure_detrend_window.py, which
    fixed 30 d by *transit-depth* preservation (sub-10-3); this asks the floor question.

    Splits at gaps > 1 day (Kepler quarter boundaries, TESS mid-sector downlinks),
    then divides each segment by a ~30-day SG polynomial. That removes the ~430-day
    instrumental systematic seen in Kepler-452 data while preserving the 0.46-day
    transit.

    The window is measured in *days* and converted using the cadence of the data at
    hand, not a mission constant. It used to be a fixed 1470 points — 30 days only at
    Kepler's 29.4-min long cadence, but 2.04 days on TESS 2-min data, where the SG
    curve follows the transit and divides ~18% of its depth away.

    Two guards keep the conversion honest on short data (see
    scripts/measure_detrend_window.py for the injection-recovery measurements):

      * a segment shorter than the window shrinks the window to fit rather than
        skipping the segment. 30 days of TESS 2-min data is 21,599 points, longer
        than either half of a sector, so the old `continue` would have left a
        single-sector light curve entirely undetrended.
      * a window that would fall below _MIN_WINDOW_DAYS skips that segment instead.
        Below the floor the detrend costs more transit depth than the trend it
        removes, and an uncorrected slope is the lesser harm — BLS tolerates a slow
        trend, but it cannot recover depth that was already divided out.

    Kepler is unaffected: at 0.0204 d cadence the window is the same 1470 points, and
    quarter-length segments comfortably exceed it.
    """
    from scipy.signal import savgol_filter

    sort_idx = np.argsort(time)
    t = time[sort_idx]
    f = flux[sort_idx]

    cadence = _cadence_days(t)
    if cadence == 0.0:
        return flux.copy()
    window = _DETREND_WINDOW_DAYS if window_days is None else window_days
    desired = int(window / cadence)
    floor = int(_MIN_WINDOW_DAYS / cadence)

    gap_idx = np.where(np.diff(t) > 1.0)[0] + 1
    segments = np.split(np.arange(len(t)), gap_idx)

    flat = f.copy()
    for seg in segments:
        win = min(desired, len(seg))
        if win % 2 == 0:
            win -= 1
        if win < floor or win <= _POLYORDER:
            continue
        trend = savgol_filter(f[seg], window_length=win, polyorder=_POLYORDER)
        # avoid dividing by near-zero trend
        flat[seg] = np.where(np.abs(trend) > 1e-9, f[seg] / trend, f[seg])

    # Restore the caller's ordering: callers keep their own `time` array and pair it
    # with this flux, so returning it sorted would silently mismatch the two.
    out = np.empty_like(flat)
    out[sort_idx] = flat
    return out


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
