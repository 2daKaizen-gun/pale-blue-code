#!/usr/bin/env python
"""Calibrate _N_MIN_TRANSITS — where does odd/even stop telling planets from binaries?

Why (sub-10-3, Light 4): `vetting._N_MIN_TRANSITS = 5` decides when a `strong` verdict
is downgraded to *provisional* (honesty nail 4), and it shipped as an admitted guess.
On a single ~27-day TESS sector it is the number that does almost all the work: at a
24.6 d baseline it makes every period longer than ~4.9 d provisional.

The threshold is only meaningful if it marks something real, so measure the thing it
claims to protect. The odd/even gate is the transit-count-sensitive one: it splits
transits into odd- and even-numbered sets and compares their depths, which is how a
binary that eclipses on alternating cycles gets caught. Fewer transits means fewer
depths per side, so at some count the comparison stops working — and a binary starts
reading as a strong planet candidate.

Method (injection-recovery on real noise):

    1. take a real single-sector TESS light curve as the noise bed;
    2. inject either a clean planet (equal depths) or a binary (odd/even mismatch,
       and deliberately NO secondary eclipse, so odd/even is the only gate that can
       catch it);
    3. pick the period so exactly N transits land in the baseline;
    4. run the real pipeline (detrend -> vet) and record the verdict;
    5. repeat over epochs and noise seeds, and report the rate.

The output is two curves against N: how often a binary is still caught, and how often
a real planet still survives. _N_MIN_TRANSITS belongs where the first one collapses.

Usage:
    python scripts/calibrate_min_transits.py --tic 7318157
    python scripts/calibrate_min_transits.py --tic 7318157 --trials 20
"""
import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from services import bls as bls_service  # noqa: E402
from services import vetting as vet  # noqa: E402
from measure_detrend_window import load_full_lc  # noqa: E402

_DEPTH = 0.005        # 0.5% — a warm-Neptune-ish dip, default injection depth
_DURATION = 0.15      # days
_MISMATCH = 0.4       # binary: odd and even depths differ by this fraction


def _inject(time, flux, period, epoch, depth_odd, depth_even, duration):
    """Box dips at `period`, alternating depth between odd and even transits."""
    out = flux.copy()
    n = np.round((time - epoch) / period).astype(int)
    phase = np.abs((time - epoch + period / 2) % period - period / 2)
    hit = phase < duration / 2
    out[hit & (n % 2 == 1)] *= 1.0 - depth_odd
    out[hit & (n % 2 == 0)] *= 1.0 - depth_even
    return out


def _trial(time, flux, n_transits, epoch_frac, is_binary):
    """One injection -> one verdict, through the real detrend + vetting path."""
    baseline = float(time.max() - time.min())
    # +0.5 so N transits fit inside the baseline rather than landing on its edge
    period = baseline / (n_transits + 0.5)
    epoch = float(time.min()) + epoch_frac * period

    if is_binary:
        odd = _DEPTH * (1.0 + _MISMATCH / 2)
        even = _DEPTH * (1.0 - _MISMATCH / 2)
    else:
        odd = even = _DEPTH

    injected = _inject(time, flux, period, epoch, odd, even, _DURATION)
    flat = bls_service._detrend(time, injected)
    best = {
        "period": period,
        "duration": _DURATION,
        "depth": max(odd, even),
        "transit_time": epoch,
    }
    report = vet.build_report(0, time, flat, best, mission="tess", sector_count=1)
    odd_even = next((c for c in report.checks if c.name == "odd_even"), None)
    return report, odd_even


def main() -> int:
    global _DEPTH
    ap = argparse.ArgumentParser()
    ap.add_argument("--tic", type=int, default=7318157)
    ap.add_argument("--trials", type=int, default=12, help="epochs sampled per N")
    ap.add_argument("--max-n", type=int, default=10)
    ap.add_argument("--depth", type=float, default=_DEPTH,
                    help="injected transit depth (fraction)")
    args = ap.parse_args()
    _DEPTH = args.depth

    time, flux = load_full_lc(args.tic)
    baseline = float(time.max() - time.min())
    print(f"TIC {args.tic}: {len(time)} points, {baseline:.2f} d baseline, "
          f"single sector")
    print(f"injecting depth={_DEPTH * 100:.2f}%, dur={_DURATION} d, "
          f"binary odd/even mismatch={_MISMATCH * 100:.0f}%")
    print(f"{args.trials} epochs per N\n")

    print(f"{'N':>3}  {'period':>8}  {'binary caught':>14}  {'planet kept':>12}"
          f"   why the planet was rejected")
    rows = []
    for n in range(1, args.max_n + 1):
        caught = kept = 0
        failed_gate: dict[str, int] = {}
        aliased = 0
        for i in range(args.trials):
            frac = i / args.trials
            rep_b, oe_b = _trial(time, flux, n, frac, is_binary=True)
            # "caught" = the binary did NOT walk away as a trustworthy candidate
            if (oe_b is not None and not oe_b.passed) or rep_b.trust != "strong":
                caught += 1
            rep_p, _ = _trial(time, flux, n, frac, is_binary=False)
            if rep_p.trust == "strong":
                kept += 1
            else:
                for c in rep_p.checks:
                    if not c.passed:
                        failed_gate[c.name] = failed_gate.get(c.name, 0) + 1
                if rep_p.alias_factor != 1.0:
                    aliased += 1
        period = baseline / (n + 0.5)
        rows.append((n, caught / args.trials, kept / args.trials))
        why = " ".join(f"{g}x{c}" for g, c in sorted(
            failed_gate.items(), key=lambda kv: -kv[1])) or "-"
        if aliased:
            why += f"  [de-aliased x{aliased}]"
        print(f"{n:>3}  {period:>7.2f}d  {caught / args.trials * 100:>13.0f}%  "
              f"{kept / args.trials * 100:>11.0f}%   {why}")

    print(f"\n_N_MIN_TRANSITS is currently {vet._N_MIN_TRANSITS} "
          f"(strong below this reads as provisional)")
    safe = [n for n, c, _ in rows if c >= 0.9]
    if safe:
        print(f"binary recall >= 90% from N = {min(safe)} upward")
    lost = [n for n, _, k in rows if k < 0.9]
    if lost:
        print("NOTE: clean planets are also being rejected -- see the rejection "
              "column; that is a separate finding from the threshold itself.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
