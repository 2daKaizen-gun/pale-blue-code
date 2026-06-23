import json
import re
from pathlib import Path

import numpy as np

_CACHE_DIR = Path(__file__).parent.parent / "cache"
_CACHE_DIR.mkdir(exist_ok=True)

_PERIOD_MIN = 1.0
_PERIOD_MAX = 500.0
_PERIOD_GRID = 10_000
_DURATIONS = [0.05, 0.1, 0.2]


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


def run_bls(planet_name: str) -> dict:
    """Run BLS on the Phase 6 light curve cache. Results cached as bls_*.json."""
    from astropy.timeseries import BoxLeastSquares
    import astropy.units as u

    bls_path = _bls_cache_path(planet_name)
    if bls_path.exists():
        return json.loads(bls_path.read_text(encoding="utf-8"))

    lc = _find_lc_cache(planet_name)
    if lc is None:
        raise FileNotFoundError(f"No light curve cache found for '{planet_name}'")

    time = np.array(lc["time"])
    flux = np.array(lc["flux"])

    periods = np.geomspace(_PERIOD_MIN, _PERIOD_MAX, _PERIOD_GRID)
    durations = [d * p for p in periods for d in _DURATIONS]

    bls = BoxLeastSquares(time * u.day, flux)
    result = bls.power(periods * u.day, np.array(_DURATIONS) * u.dimensionless_unscaled)

    best_idx = int(np.argmax(result.power))
    best_period = float(result.period[best_idx].value)
    best_duration = float(result.duration[best_idx].value)
    best_t0 = float(result.transit_time[best_idx].value)

    stats = bls.compute_stats(
        result.period[best_idx],
        result.duration[best_idx],
        result.transit_time[best_idx],
    )

    data = {
        "planet_name": planet_name,
        "periods": result.period.value.tolist(),
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
