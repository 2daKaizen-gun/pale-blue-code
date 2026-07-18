"""Vetting engine — decide whether a BLS signal is a plausible planet or a
false positive, using only the cached, detrended light curve.

Four standard light-curve diagnostics (the LC-only subset of what NASA
Robovetter / DAVE apply), then a trust synthesis:

  odd_even   (hard)  odd- vs even-numbered transit depth agreement
  secondary  (hard)  a second dimming half a period later (a glowing companion)
  shape      (soft)  flat-bottomed U (planet) vs pointed V (grazing binary)
  size       (mixed) S/N and Rp/Rs = sqrt(depth); oversized depth is a hard EB flag

The backend returns numbers + pass/fail + a `hard` flag only; the Korean
explanations live in the frontend (VettingReport.tsx).
"""

import json
from pathlib import Path

import numpy as np

from models.vetting import VettingCheck, VettingReport
from services import bls as bls_service
from services import hunt as hunt_service

_CACHE_DIR = Path(__file__).parent.parent / "cache"

# thresholds (provisional; calibrated against anchors in sub-9-1 Light 5)
_ODD_EVEN_SIGMA = 3.0      # odd/even depth mismatch beyond this many sigma → EB
_SEC_SNR = 3.0             # secondary detection significance
_SEC_FRAC = 0.25           # secondary depth as a fraction of primary → EB
_FLAT_FRAC_MIN = 0.2       # below this the transit is too V-shaped
_SNR_MIN = 7.0             # minimum transit signal-to-noise
_RP_RS_MAX = 0.25          # above this the "planet" is stellar-sized

_MIN_PTS = 5               # per-group minimum to render a judgment; else held

# de-aliasing: BLS often locks onto a ½×/2×/3×/4× harmonic of the true period.
# Vetting at that alias makes even a real planet look like an EB (empty alternate
# cycles read as an odd/even mismatch), so we recover the fundamental period first.
_ALIAS_FACTORS = [0.25, 1.0 / 3.0, 0.5, 1.0, 2.0, 3.0, 4.0]
_DEALIAS_SNR_MIN = 5.0      # a candidate period must show a real dip
_DEALIAS_EXTRA_MAX = 0.5    # no second dip deeper than half the primary → rejects k× superharmonics
_DEALIAS_BALANCE_MIN = 0.5  # every mod-2 and mod-3 cycle group must carry the transit → rejects
                            #   ½×/⅓×/¼× subharmonics (their alternate cycles are empty). Folded,
                            #   so it stays reliable even for shallow transits.

_PERIOD_MIN = 0.5
_PERIOD_MAX = 600.0

# Honesty nail 4 (Phase 10): a wide sky is seen shallowly. The gates rest on
# repeated transits — odd/even needs several to compare, secondary needs cycle
# coverage — so a "strong" earned on only a handful of transits is only
# provisionally strong. Kepler's multi-year baseline clears this trivially; a
# single 27-day TESS sector on a longer-period planet may not. We do NOT touch the
# gate math or the trust verdict; provisional is a separate, honest flag alongside.
_N_MIN_TRANSITS = 5


def transit_count(baseline_days: float, period: float) -> int:
    """How many transit epochs fit in the observed span: floor(baseline / period)."""
    if period <= 0 or baseline_days <= 0:
        return 0
    return int(baseline_days // period)


def is_provisional(trust: str, n_transits: int) -> bool:
    """A 'strong' verdict resting on fewer than _N_MIN_TRANSITS transits is only
    provisionally strong. weak/unlikely are never flagged — provisional downgrades
    confidence, it never invents it."""
    return trust == "strong" and n_transits < _N_MIN_TRANSITS


# ── low-level helpers ────────────────────────────────────────────────────────

def _mad_std(x: np.ndarray) -> float:
    """Robust standard deviation via the median absolute deviation."""
    if len(x) == 0:
        return 0.0
    med = np.median(x)
    return float(1.4826 * np.median(np.abs(x - med)))


def _signed_phase(time: np.ndarray, t0: float, period: float) -> np.ndarray:
    """Phase folded into [-P/2, P/2), so a transit sits at 0."""
    return ((time - t0 + 0.5 * period) % period) - 0.5 * period


def _group_depth(flux_in: np.ndarray) -> tuple[float, float, int]:
    """Depth (1 - median) and its standard error for one group of in-transit points."""
    n = len(flux_in)
    if n == 0:
        return 0.0, 0.0, 0
    depth = 1.0 - float(np.median(flux_in))
    err = _mad_std(flux_in) / np.sqrt(n)
    return depth, float(err), n


# ── gate 1: odd/even depth ───────────────────────────────────────────────────

def check_odd_even(time: np.ndarray, flux: np.ndarray, best: dict) -> VettingCheck:
    period = best["period"]
    t0 = best["transit_time"]
    dur = best["duration"]

    in_t = np.abs(_signed_phase(time, t0, period)) < dur / 2
    n = np.round((time - t0) / period).astype(int)
    d_odd, e_odd, n_odd = _group_depth(flux[in_t & (n % 2 != 0)])
    d_even, e_even, n_even = _group_depth(flux[in_t & (n % 2 == 0)])

    if n_odd < _MIN_PTS or n_even < _MIN_PTS:
        # too few transits to compare — hold judgment (pass, soft)
        return VettingCheck(
            name="odd_even", passed=True, hard=False,
            metrics={"depth_odd": d_odd, "depth_even": d_even, "sigma": 0.0,
                     "n_odd": float(n_odd), "n_even": float(n_even)},
        )

    denom = np.hypot(e_odd, e_even)
    sigma = abs(d_odd - d_even) / denom if denom > 0 else 0.0
    passed = sigma < _ODD_EVEN_SIGMA
    return VettingCheck(
        name="odd_even", passed=passed, hard=not passed,
        metrics={"depth_odd": d_odd, "depth_even": d_even, "sigma": float(sigma),
                 "n_odd": float(n_odd), "n_even": float(n_even)},
    )


# ── gate 2: secondary eclipse ────────────────────────────────────────────────

def check_secondary(time: np.ndarray, flux: np.ndarray, best: dict) -> VettingCheck:
    period = best["period"]
    t0 = best["transit_time"]
    dur = best["duration"]
    primary_depth = best["depth"]

    frac = ((time - t0) % period) / period      # 0..1, primary at 0/1
    half = (dur / 2) / period
    in_sec = np.abs(frac - 0.5) < half
    in_prim = (frac < half) | (frac > 1 - half)
    oot = ~in_sec & ~in_prim

    n_sec = int(in_sec.sum())
    if n_sec < _MIN_PTS or oot.sum() < _MIN_PTS:
        return VettingCheck(
            name="secondary", passed=True, hard=False,
            metrics={"sec_depth": 0.0, "sec_snr": 0.0, "primary_depth": primary_depth},
        )

    base = float(np.median(flux[oot]))
    sec_depth = base - float(np.median(flux[in_sec]))
    sec_err = _mad_std(flux[oot]) / np.sqrt(n_sec)
    sec_snr = sec_depth / sec_err if sec_err > 0 else 0.0

    passed = not (sec_snr > _SEC_SNR and sec_depth > _SEC_FRAC * primary_depth)
    return VettingCheck(
        name="secondary", passed=passed, hard=not passed,
        metrics={"sec_depth": float(sec_depth), "sec_snr": float(sec_snr),
                 "primary_depth": float(primary_depth)},
    )


# ── gate 3: transit shape (U vs V) ───────────────────────────────────────────

def check_shape(time: np.ndarray, flux: np.ndarray, best: dict) -> VettingCheck:
    """Flat-bottomed U (planet) vs pointed V (grazing binary). Measured directly
    from the folded profile as the width ratio t_flat / t_total, where t_flat is
    the span below 80% depth and t_total the span below 20% depth. Independent of
    BLS's coarse duration quantization (0.1/0.3/0.5 d)."""
    period = best["period"]
    t0 = best["transit_time"]
    dur = best["duration"]

    ph = _signed_phase(time, t0, period)
    win = min(0.4 * period, 3.0 * dur)     # generous — contains the transit even if dur is off
    m = np.abs(ph) < win
    if int(m.sum()) < 2 * _MIN_PTS:
        return VettingCheck(name="shape", passed=True, hard=False,
                            metrics={"flat_frac": 1.0, "depth": 0.0})

    x, y = ph[m], flux[m]
    nb = 25
    edges = np.linspace(-win, win, nb + 1)
    idx = np.clip(np.digitize(x, edges) - 1, 0, nb - 1)
    prof = np.full(nb, np.nan)
    for b in range(nb):
        sel = idx == b
        if sel.any():
            prof[b] = 1.0 - float(np.median(y[sel]))     # dip depth per bin (baseline 1)
    prof = np.nan_to_num(prof, nan=0.0)

    depth = float(prof.max())
    if depth <= 0:
        return VettingCheck(name="shape", passed=True, hard=False,
                            metrics={"flat_frac": 1.0, "depth": 0.0})

    binw = 2 * win / nb
    t_total = binw * int(np.sum(prof > 0.2 * depth))
    t_flat = binw * int(np.sum(prof > 0.8 * depth))
    flat_frac = t_flat / t_total if t_total > 0 else 0.0

    passed = flat_frac >= _FLAT_FRAC_MIN
    return VettingCheck(name="shape", passed=passed, hard=False,
                        metrics={"flat_frac": float(flat_frac), "depth": depth})


# ── gate 4: size (S/N and Rp/Rs) ─────────────────────────────────────────────

def check_size(time: np.ndarray, flux: np.ndarray, best: dict) -> VettingCheck:
    period = best["period"]
    t0 = best["transit_time"]
    dur = best["duration"]
    depth = best["depth"]

    in_t = np.abs(_signed_phase(time, t0, period)) < dur / 2
    n_in = int(in_t.sum())
    scatter = _mad_std(flux[~in_t])
    err = scatter / np.sqrt(n_in) if n_in > 0 else np.inf
    snr = depth / err if err > 0 else 0.0
    rp_rs = np.sqrt(depth) if depth > 0 else 0.0

    passed = snr >= _SNR_MIN and rp_rs <= _RP_RS_MAX
    hard = rp_rs > _RP_RS_MAX          # oversized depth is a hard EB flag; low S/N is soft
    return VettingCheck(name="size", passed=passed, hard=hard,
                        metrics={"snr": float(snr), "rp_rs": float(rp_rs),
                                 "depth": float(depth)})


# ── synthesis ────────────────────────────────────────────────────────────────

def synthesize(checks: list[VettingCheck]) -> str:
    hard_fail = any(c.hard and not c.passed for c in checks)
    n_pass = sum(c.passed for c in checks)
    if hard_fail or n_pass <= 2:
        return "unlikely"
    if n_pass == 4:
        return "strong"
    return "weak"


# ── de-aliasing (recover the fundamental period before vetting) ──────────────

def _evaluate_period(time: np.ndarray, flux: np.ndarray, period: float,
                     base_dur: float) -> dict | None:
    """Score a candidate period: locate the deepest phase (t0), then measure the
    dip S/N, whether a second comparable dip exists, and how many sampled cycles
    actually contain the transit."""
    nb = 200
    ph = (time % period) / period
    idx = np.clip((ph * nb).astype(int), 0, nb - 1)
    med = np.full(nb, np.nan)
    for b in range(nb):
        sel = idx == b
        if sel.any():
            med[b] = np.median(flux[sel])
    base = np.nanmedian(med)
    depth_prof = np.nan_to_num(base - med, nan=0.0)

    pb = int(np.argmax(depth_prof))
    d_prim = float(depth_prof[pb])
    if d_prim <= 0:
        return None
    phase0 = (pb + 0.5) / nb
    t0 = phase0 * period

    hw = min(0.5, max((base_dur / 2) / period, 1.5 / nb))    # half transit width, in phase
    dphase = np.abs(((ph - phase0 + 0.5) % 1.0) - 0.5)
    in_prim = dphase < hw
    oot = dphase > 3 * hw
    n_prim = int(in_prim.sum())
    if n_prim < _MIN_PTS:
        return None

    # window depth (same ±hw window used per-cycle) — consistent with the gates,
    # unlike d_prim which is the sharper single-bin peak used only for the dip ratio.
    d_window = base - float(np.median(flux[in_prim]))
    scatter = _mad_std(flux[oot]) if oot.any() else _mad_std(flux)
    snr = d_window / (scatter / np.sqrt(n_prim)) if scatter > 0 else 0.0

    bin_centers = (np.arange(nb) + 0.5) / nb
    prim_bins = np.abs(((bin_centers - phase0 + 0.5) % 1.0) - 0.5) < 2 * hw
    other = depth_prof.copy()
    other[prim_bins] = 0.0
    extra_ratio = float(other.max() / d_prim)

    # subharmonic test: at the true period every cycle carries the transit, so the
    # depth is the same across cycle groups mod 2 and mod 3. At a ½×/⅓×/¼× alias the
    # transit lands on only some groups, leaving the others empty. Comparing folded
    # group depths (not per-cycle) keeps this reliable for shallow transits.
    cyc = np.round((time - t0) / period).astype(int)

    def _group_balance(k: int) -> float:
        depths = []
        for r in range(k):
            sel = in_prim & (cyc % k == r)
            if int(sel.sum()) < _MIN_PTS:
                return 1.0               # a group is unsampled — can't tell, don't reject
            depths.append(base - float(np.median(flux[sel])))
        hi = max(depths)
        return (min(depths) / hi) if hi > 0 else 0.0

    balance = min(_group_balance(2), _group_balance(3))

    return {"period": period, "t0": float(t0), "depth": d_window,
            "snr": snr, "extra_ratio": extra_ratio, "balance": balance}


def _dealias(time: np.ndarray, flux: np.ndarray, best: dict) -> tuple[dict, float]:
    """Return (corrected best, factor). Picks the fundamental period: the smallest
    candidate that shows a single dip present in most cycles. Falls back to the raw
    BLS period if nothing qualifies."""
    p0 = best["period"]
    dur = best["duration"]
    accepted = []
    for f in _ALIAS_FACTORS:
        p = p0 * f
        if not (_PERIOD_MIN <= p <= _PERIOD_MAX):
            continue
        ev = _evaluate_period(time, flux, p, dur)
        if ev is None:
            continue
        if (ev["snr"] >= _DEALIAS_SNR_MIN
                and ev["extra_ratio"] < _DEALIAS_EXTRA_MAX
                and ev["balance"] >= _DEALIAS_BALANCE_MIN):
            accepted.append(ev)

    chosen = min(accepted, key=lambda e: e["period"]) if accepted else None
    if chosen is None or abs(chosen["period"] - p0) < 1e-9:
        # no alias, or the raw BLS period is already the fundamental — keep the
        # original best untouched (its t0/depth are more accurate than our bin estimate)
        return dict(best), 1.0

    corrected = dict(best)
    corrected["period"] = chosen["period"]
    corrected["transit_time"] = chosen["t0"]
    corrected["depth"] = chosen["depth"]
    return corrected, chosen["period"] / p0


def build_report(
    star_id: int,
    time: np.ndarray,
    flux: np.ndarray,
    best: dict,
    mission: str = "kepler",
    sector_count: int | None = None,
) -> VettingReport:
    corrected, factor = _dealias(time, flux, best)
    checks = [
        check_odd_even(time, flux, corrected),
        check_secondary(time, flux, corrected),
        check_shape(time, flux, corrected),
        check_size(time, flux, corrected),
    ]
    trust = synthesize(checks)
    baseline_days = float(time[-1] - time[0]) if len(time) >= 2 else 0.0
    n_transits = transit_count(baseline_days, corrected["period"])
    return VettingReport(
        kic_id=star_id,
        period=corrected["period"],
        bls_period=best["period"],
        alias_factor=factor,
        checks=checks,
        passed_count=sum(c.passed for c in checks),
        total=len(checks),
        trust=trust,
        mission=mission,
        baseline_days=baseline_days,
        transit_count=n_transits,
        sector_count=sector_count,
        provisional=is_provisional(trust, n_transits),
    )


# ── cache loader + entry point ───────────────────────────────────────────────

def _load_vetting_input(star_id: int, mission: str = "kepler") -> tuple[np.ndarray, np.ndarray, dict]:
    """Reconstruct the exact detrended curve BLS saw, plus its `best` block."""
    name = hunt_service.star_name(star_id, mission)
    bls = bls_service.run_bls(name)   # cache hit; FileNotFoundError → 424 at router
    full_path = _CACHE_DIR / f"bls_lc_{bls_service._slug(name)}.json"
    if not full_path.exists():
        raise FileNotFoundError(
            f"Full-resolution light curve not cached for {name}."
        )
    raw = json.loads(full_path.read_text(encoding="utf-8"))
    time = np.array(raw["time"])
    flux = np.array(raw["flux"])
    flux = bls_service._detrend(time, flux)
    return time, flux, bls["best"]


def vet(star_id: int, mission: str = "kepler") -> VettingReport:
    """Vet a cached BLS result. Cached as vet_{slug}.json — the computation is ~50ms
    but reconstructing the detrended curve is not, so we memoize the report.

    mission="tess" only swaps the star's name (KIC->TIC) so the same four gates
    read a TESS curve; the gate math is identical."""
    name = hunt_service.star_name(star_id, mission)
    cache_path = _CACHE_DIR / f"vet_{bls_service._slug(name)}.json"
    if cache_path.exists():
        return VettingReport.model_validate_json(cache_path.read_text(encoding="utf-8"))

    time, flux, best = _load_vetting_input(star_id, mission)
    sector_count = hunt_service.lc_sector_count(star_id, mission)
    report = build_report(star_id, time, flux, best, mission=mission,
                          sector_count=sector_count)
    cache_path.write_text(report.model_dump_json(), encoding="utf-8")
    return report
