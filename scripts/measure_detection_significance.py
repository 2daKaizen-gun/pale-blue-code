#!/usr/bin/env python
"""Measure detection significance — is there a real signal here, before we vet its shape?

Why (Phase 11, sub-11-1, issue #49): the four vetting gates ask whether a signal
*looks* planetary — odd/even depth, secondary eclipse, U-vs-V shape, planet-range
size. None asks whether there is a real detection at all. sub-10-3 proved the cost
live: TIC 7318157 passed strong 4/4 on a BLS peak of power 0.0004 whose dip lived
almost entirely in the even epochs — a classic noise signature — because with scatter
that wide the odd/even difference was only 1.83 sigma.

Before wiring a precondition (L2), we measure. This script computes several candidate
significance figures on the three anchors and the noise case, and prints them side by
side. The threshold is not chosen by assertion; it is chosen from whatever cleanly
separates the anchors (which must survive) from TIC 7318157 (which must not).

What the measurement found (and it overturned the first guess):

  * SDE — the peak's height above the periodogram noise floor — does NOT separate them.
    Any scale you pick, robust or not, TIC 102029734 (a real anchor) scores at or below
    TIC 7318157 (noise). The reason is physical: 102029734 is a single-transit signal,
    and BLS rewards *repetition*, so its periodogram peak is genuinely weak. SDE is a
    repeat-transit figure; it is blind to a real monotransit, exactly the R3 caveat in
    the TechSpec. (The robust median/MAD form is worse than useless here — for the noise
    cases more than half the periodogram piles onto one floor value, so MAD is 0.)

  * snr_between — the folded transit depth measured against the scatter BETWEEN transits
    — DOES separate, for signals with at least two observed transits. Transits are
    near-independent draws (different times, different spot phases), unlike the ~108
    correlated samples inside one TESS transit, so dividing by the transit count is
    honest where dividing by the sample count (snr_white, shown for contrast) is not.
    TIC 7318157's dip appears on even epochs and not odd ones, so its per-transit depths
    are wildly inconsistent, and snr_between collapses to noise level (~3) while every
    real multi-transit signal sits at 6 or above.

  * Single-transit signals (k < 2) have no transit-to-transit scatter to measure, so
    snr_between is undefined. The precondition HOLDS judgment there rather than failing
    it — a real monotransit (102029734) keeps its verdict, and single-event significance
    is left to sub-11-2+ where it belongs. A single-transit *noise* case is therefore
    NOT caught here; that is the honest boundary of what one can say without repetition.

Everything is read from the cache; no network. Run from anywhere:
    python scripts/measure_detection_significance.py
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")          # Windows console defaults to cp949

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services import bls as bls_service          # noqa: E402
from services import vetting                      # noqa: E402

# The calibration set issue #49 names: the three anchors (whose recorded verdicts must
# hold) plus the noise case (which must not read as strong). The threshold is set here.
ANCHORS = [
    ("KIC 11446443", "anchor: strong    (must survive)"),
    ("KIC 7340288", "anchor: unlikely  (already caught)"),
    ("TIC 102029734", "anchor: strong/prov, k=1 (must survive)"),
    ("TIC 7318157", "NOISE: strong today -> must fall"),
]

# Not calibration — a wider spread of known targets, read only to sanity-check where the
# threshold lands: confirmed planets should sit high, false positives low.
SANITY = [
    ("Kepler-6 b", "confirmed hot Jupiter"),
    ("Kepler-7 b", "confirmed hot Jupiter"),
    ("Kepler-452 b", "confirmed, k=1 shallow"),
    ("KIC 9140402", "real 2.494 d planet (strong)"),
    ("KIC 10583180", "K00748 false positive (real EB)"),
    ("KIC 2557393", "frontier false positive"),
]

_SIG_MIN = 4.0   # chosen from the gap below: noise <= 3.23, real multi-transit >= 6.00


def _mad_std(x: np.ndarray) -> float:
    if len(x) == 0:
        return 0.0
    return float(1.4826 * np.median(np.abs(x - np.median(x))))


def _load(name: str):
    """Reconstruct exactly what the vetter saw — detrended curve + BLS block — and
    keep the full periodogram the SDE needs (which _load_vetting_input drops)."""
    bls = bls_service.run_bls(name)               # cache hit
    slug = bls_service._slug(name)
    raw = json.loads(
        (ROOT / "backend" / "cache" / f"bls_lc_{slug}.json").read_text(encoding="utf-8")
    )
    time = np.array(raw["time"])
    flux = bls_service._detrend(time, np.array(raw["flux"]))
    return time, flux, bls["best"], np.array(bls["powers"], dtype=float)


def _sde(peak: float, powers: np.ndarray) -> float:
    """Peak height above the periodogram floor, in std units. Well-defined (std > 0),
    but shown here only to demonstrate it does not separate the single-transit anchor
    from noise — the robust median/MAD form is degenerate (MAD = 0 on the noise cases)."""
    s = powers.std()
    return float((peak - powers.mean()) / s) if s > 0 else 0.0


def _significance(time, flux, best):
    """The candidate the measurement settles on. Collapse each well-sampled transit at
    the de-aliased period to one depth, then take the t-statistic that the mean depth is
    above zero, using the scatter BETWEEN transits. Returns (snr_between | nan for k<2,
    k, mean_depth, snr_white) — snr_white is the wrong-denominator form, for contrast."""
    corrected, _ = vetting._dealias(time, flux, best)
    period, t0, dur = corrected["period"], corrected["transit_time"], corrected["duration"]

    in_t = np.abs(vetting._signed_phase(time, t0, period)) < dur / 2
    epoch = np.round((time - t0) / period).astype(int)

    depths = []
    for e in np.unique(epoch[in_t]):
        sel = in_t & (epoch == e)
        if int(sel.sum()) >= vetting._MIN_PTS:
            depths.append(1.0 - float(np.median(flux[sel])))
    depths = np.array(depths)
    k = len(depths)
    d_mean = float(depths.mean()) if k else 0.0

    if k >= 2:
        sd = float(depths.std(ddof=1))
        snr_between = d_mean / (sd / np.sqrt(k)) if sd > 0 else float("inf")
    else:
        snr_between = float("nan")             # single transit — held, not failed

    n_in = int(in_t.sum())
    oot = _mad_std(flux[~in_t])
    snr_white = d_mean / (oot / np.sqrt(n_in)) if (oot > 0 and n_in) else 0.0
    return snr_between, k, d_mean, snr_white


def _verdict(snr_between: float) -> str:
    if np.isnan(snr_between):
        return "HELD (k=1)"
    return "PASS" if snr_between >= _SIG_MIN else "FAIL -> insignificant"


def _row(name: str, note: str) -> None:
    time, flux, best, powers = _load(name)
    sde = _sde(best["power"], powers)
    snr_b, k, depth, snr_w = _significance(time, flux, best)
    sb = "   nan  " if np.isnan(snr_b) else f"{snr_b:8.2f}"
    print(f"{name:>14} | {best['power']:9.5f} {sde:7.1f} | {k:3d} {depth*100:7.3f}% "
          f"{sb} {snr_w:8.1f} | {_verdict(snr_b):22} {note}")


def main() -> None:
    print(f"detection-significance measurement  (gate: snr_between >= {_SIG_MIN}, k>=2)\n")
    hdr = (f"{'target':>14} | {'power':>9} {'SDE':>7} | {'k':>3} {'depth':>8} "
           f"{'snr_btwn':>8} {'snr_wht':>8} | verdict / note")
    print(hdr)
    print("-" * len(hdr))
    for name, note in ANCHORS:
        _row(name, note)
    print(f"{'  --- sanity (not calibration) ---':>52}")
    for name, note in SANITY:
        _row(name, note)

    print("\nFinding: SDE does not separate (102029734, a real k=1 anchor, scores below "
          "the noise). snr_between does, for k>=2: noise <= 3.23, real >= 6.00, so the "
          f"gate sits at {_SIG_MIN}. Single-transit significance is held, not judged - "
          "that is sub-11-2+ (monotransit). snr_white stays high on noise: wrong denominator.")


if __name__ == "__main__":
    main()
