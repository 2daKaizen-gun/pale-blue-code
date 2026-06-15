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

    df = pd.DataFrame(data)

    # nullable int columns
    for col in ("disc_year", "sy_pnum"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    # float columns — coerce bad values to NaN
    for col in ("pl_orbper", "pl_rade", "pl_masse", "pl_eqt", "st_dist", "st_teff"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # drop rows without a planet name or host
    df = df.dropna(subset=["pl_name", "hostname"])

    records = df.where(df.notna(), other=None).to_dict(orient="records")
    return [Planet(**r) for r in records]
