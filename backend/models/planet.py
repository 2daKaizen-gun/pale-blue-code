from pydantic import BaseModel
from typing import Optional


class Planet(BaseModel):
    pl_name: str
    hostname: str
    discoverymethod: str
    disc_year: Optional[int] = None
    pl_orbper: Optional[float] = None
    pl_rade: Optional[float] = None
    pl_masse: Optional[float] = None
    pl_eqt: Optional[float] = None
    sy_dist: Optional[float] = None
    st_teff: Optional[float] = None
    sy_pnum: Optional[int] = None
    disc_facility: Optional[str] = None
