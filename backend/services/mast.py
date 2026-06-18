import json
import re
from pathlib import Path

import numpy as np

_CACHE_DIR = Path(__file__).parent.parent / "cache"
_CACHE_DIR.mkdir(exist_ok=True)

_MAX_POINTS = 5000
_FOLD_BINS = 200


def _cache_key(planet_name: str, mission: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", planet_name.lower()).strip("-")
    return f"lc_{slug}_{mission.lower()}"


def _cache_path(key: str) -> Path:
    return _CACHE_DIR / f"{key}.json"


def _load_cache(key: str) -> dict | None:
    p = _cache_path(key)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None


def _save_cache(key: str, data: dict) -> None:
    _cache_path(key).write_text(json.dumps(data), encoding="utf-8")


def _decimate(
    time: np.ndarray,
    flux: np.ndarray,
    flux_err: np.ndarray,
    max_points: int = _MAX_POINTS,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    n = len(time)
    if n <= max_points:
        return time, flux, flux_err
    step = max(1, n // max_points)
    idx = np.arange(0, n, step)
    return time[idx], flux[idx], flux_err[idx]


def fetch_lightcurve(
    planet_name: str,
    hostname: str,
    period: float | None,
    mission: str = "Kepler",
) -> dict:
    """Download and cache a normalized light curve from MAST via Lightkurve."""
    import lightkurve as lk  # deferred import — heavy dependency

    key = _cache_key(planet_name, mission)
    cached = _load_cache(key)
    if cached is not None:
        return cached

    search = lk.search_lightcurve(hostname, mission=mission, author=mission, exptime="long")
    if len(search) == 0:
        # fallback: try TESS if Kepler found nothing
        if mission == "Kepler":
            return fetch_lightcurve(planet_name, hostname, period, mission="TESS")
        raise ValueError(f"No light curve found for {hostname!r} in Kepler or TESS")

    lc_col = search.download_all()
    lc = lc_col.stitch().normalize().remove_nans().remove_outliers(sigma=5)

    time_arr = lc.time.value.astype(float)
    flux_arr = lc.flux.value.astype(float)
    err_arr = lc.flux_err.value.astype(float) if lc.flux_err is not None else np.zeros_like(flux_arr)

    original_count = len(time_arr)
    time_d, flux_d, err_d = _decimate(time_arr, flux_arr, err_arr)

    data = {
        "planet_name": planet_name,
        "hostname": hostname,
        "mission": lc.meta.get("MISSION", mission),
        "time": time_d.tolist(),
        "flux": flux_d.tolist(),
        "flux_err": err_d.tolist(),
        "period": period,
        "point_count": len(time_d),
        "original_count": original_count,
    }
    _save_cache(key, data)
    return data


def fold_lightcurve(
    planet_name: str,
    hostname: str,
    period: float,
    transit_duration: float | None,
    mission: str = "Kepler",
) -> dict:
    """Phase-fold a cached (or freshly fetched) light curve."""
    key = _cache_key(planet_name, mission)
    cached = _load_cache(key)

    if cached is not None:
        time_arr = np.array(cached["time"])
        flux_arr = np.array(cached["flux"])
    else:
        raw = fetch_lightcurve(planet_name, hostname, period, mission)
        time_arr = np.array(raw["time"])
        flux_arr = np.array(raw["flux"])

    # Pure numpy phase folding — avoids Lightkurve's fold() which is slow
    # phase in [-0.5, 0.5]: 0 = transit center (arbitrary epoch)
    phase_vals = ((time_arr - time_arr[0]) / period) % 1.0
    phase_vals = np.where(phase_vals > 0.5, phase_vals - 1.0, phase_vals)

    sort_idx = np.argsort(phase_vals)
    phase_s = phase_vals[sort_idx]
    flux_s = flux_arr[sort_idx]

    bin_edges = np.linspace(-0.5, 0.5, _FOLD_BINS + 1)
    bin_idx = np.searchsorted(bin_edges, phase_s, side="right") - 1
    bin_idx = np.clip(bin_idx, 0, _FOLD_BINS - 1)

    phase_b, flux_b, err_b = [], [], []
    for i in range(_FOLD_BINS):
        center = float((bin_edges[i] + bin_edges[i + 1]) / 2)
        phase_b.append(center)
        mask = bin_idx == i
        if mask.any():
            flux_b.append(float(np.nanmean(flux_s[mask])))
            err_b.append(float(np.nanstd(flux_s[mask])))
        else:
            flux_b.append(float("nan"))
            err_b.append(0.0)

    valid_flux = [f for f in flux_b if not np.isnan(f)]
    transit_depth = float(1.0 - min(valid_flux)) if valid_flux else None

    return {
        "planet_name": planet_name,
        "period": period,
        "phase": phase_b,
        "flux": flux_b,
        "flux_err": err_b,
        "transit_depth": transit_depth,
        "transit_duration": transit_duration,
    }
