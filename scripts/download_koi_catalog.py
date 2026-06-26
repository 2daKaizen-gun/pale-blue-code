"""
One-time script: download NASA KOI cumulative table snapshot.
Output: backend/data/koi_catalog.csv
Columns kept: kepid, kepoi_name, koi_disposition, koi_period
"""

import csv
import urllib.request
from pathlib import Path

URL = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
    "?query=select+kepid,kepoi_name,koi_disposition,koi_period+from+cumulative"
    "&format=csv"
)

OUT = Path(__file__).parent.parent / "backend" / "data" / "koi_catalog.csv"
OUT.parent.mkdir(exist_ok=True)

print("Downloading KOI catalog from NASA Exoplanet Archive…")
with urllib.request.urlopen(URL, timeout=60) as resp:
    raw = resp.read().decode("utf-8")

rows = list(csv.DictReader(raw.splitlines()))
print(f"  {len(rows)} KOI entries received")

kept = [r for r in rows if r.get("koi_period", "").strip() not in ("", "null")]
print(f"  {len(kept)} entries with valid period")

with OUT.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["kepid", "kepoi_name", "koi_disposition", "koi_period"])
    writer.writeheader()
    writer.writerows(kept)

print(f"Saved → {OUT}")
