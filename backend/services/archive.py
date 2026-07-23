import math

import httpx
import pandas as pd
from models.planet import Planet

_TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

_COLUMNS = ",".join([
    "pl_name", "hostname", "discoverymethod", "disc_year",
    "pl_orbper", "pl_rade", "pl_masse", "pl_eqt",
    "sy_dist", "st_teff", "sy_pnum", "disc_facility",
])

_QUERY = f"select {_COLUMNS} from ps where default_flag=1"


def _frame_to_planets(df: pd.DataFrame) -> list[Planet]:
    """Turn the archive frame into Planets with JSON-safe missing values.

    Missing numbers must reach the client as JSON ``null``, not ``NaN``. Two traps
    make that easy to get wrong, and both 500 the whole ``/planets`` list:
      1. ``df.where(cond, None)`` on a float64 column stores ``None`` back as ``NaN``
         (pandas cannot hold ``None`` in a float column) — so cast to object first.
      2. Starlette's JSONResponse renders with ``allow_nan=False``, so a single
         leaked ``NaN`` (or ``inf``) raises "Out of range float values are not JSON
         compliant" and the entire array fails to serialize.
    """
    # nullable int columns
    for col in ("disc_year", "sy_pnum"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    # float columns — coerce bad values to NaN
    for col in ("pl_orbper", "pl_rade", "pl_masse", "pl_eqt", "sy_dist", "st_teff"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # drop rows without a planet name or host
    df = df.dropna(subset=["pl_name", "hostname"])

    # object dtype so None sticks (see docstring #1)
    records = df.astype(object).where(df.notna(), None).to_dict(orient="records")
    # belt-and-suspenders: map any surviving non-finite float to None (see #2)
    records = [
        {k: (None if isinstance(v, float) and not math.isfinite(v) else v) for k, v in r.items()}
        for r in records
    ]
    return [Planet(**r) for r in records]


async def fetch_planets() -> list[Planet]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(_TAP_URL, params={
            "REQUEST": "doQuery",
            "LANG": "ADQL",
            "QUERY": _QUERY,
            "FORMAT": "json",
        })
        resp.raise_for_status()
        data = resp.json()

    return _frame_to_planets(pd.DataFrame(data))
