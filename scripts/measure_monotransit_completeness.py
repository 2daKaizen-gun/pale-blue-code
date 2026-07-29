"""Measure the completeness of the full monotransit hunt — the other half of the scoreboard.

sub-11-4 Light 2. sub-11-3 measured the false-alarm rate: invert a curve so no real dip
remains, run the full chain, count survivors — zero, even at inverted sig 23.57 (the edge
discriminator caught it). That is *specificity*. This measures *completeness*: press a
single transit of KNOWN depth into a real curve and ask whether the full hunt promotes it.

Two things come out, both recorded in docs/checks/phase-11/sub-11-4.md:

  depth floor of the full hunt
      the shallowest depth the whole chain (search + significance + discriminators)
      recovers with reliability. Stricter than sub-11-2's significance-only floor, because
      a discriminator can reject a real event the significance cut would have kept.

  the completeness cost of the discriminators near a segment edge
      inject the SAME transits mid-segment and just past a segment join. The edge rule that
      kills the loudest false alarm also kills a real transit beside a gap; this is its price.
      For every non-recovery we record the stage that dropped it, so the cost has a name.

Injection is into the two genuine single-sector TESS curves (span ~25 d) — the honest
monotransit population, one sector, one possible transit — not the multi-sector concats.

Run from backend/:  python ../scripts/measure_monotransit_completeness.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np

try:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)  # cp949 console + live output
except (AttributeError, ValueError):
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import bls as bls_service   # noqa: E402
from services import monotransit as mt    # noqa: E402

_CACHE = Path(__file__).resolve().parent.parent / "backend" / "cache"
_STARS = ["tic-7318157", "tic-7187543"]     # the genuine single-sector curves
_DEPTHS = [0.002, 0.004, 0.006, 0.008, 0.012]   # 0.2% .. 1.2%
_DURATION = 0.3
_N_EPOCHS = 12                               # injection sites per (depth, position) cell
_EDGE_BAND = 0.5                            # d — "near-edge" means within this of a segment join


def _load_detrended(slug):
    data = json.loads((_CACHE / f"bls_lc_{slug}.json").read_text(encoding="utf-8"))
    time = np.asarray(data["time"], float)
    flux = np.asarray(data["flux"], float)
    ok = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[ok], flux[ok]
    order = np.argsort(time)
    time, flux = time[order], flux[order]
    flat = bls_service._detrend(time, flux)
    flat = flat / np.median(flat)
    return time, flat


def _epochs(time, rng, n, near_edge):
    """n injection sites, either clear of every segment edge or hugging one."""
    edges = mt._segment_edges(time)
    half = 0.5 * _DURATION
    out = []
    tries = 0
    while len(out) < n and tries < 20000:
        tries += 1
        t = rng.uniform(time[0] + half + 0.05, time[-1] - half - 0.05)
        d = float(np.min(np.abs(edges - t)))
        # need enough real points under the transit either way
        n_in = int(np.count_nonzero(np.abs(time - t) < half))
        if n_in < mt._MIN_IN_TRANSIT:
            continue
        if near_edge and (mt._EDGE_CLEAR * _DURATION * 0.2 < d < _EDGE_BAND):
            out.append(t)
        elif not near_edge and d > 1.0:
            out.append(t)
    return out


def _sweep(slug, near_edge, rng):
    """Recovery fraction + stage tally per depth, for one position class on one star."""
    time, flux = _load_detrended(slug)
    rows = []
    for depth in _DEPTHS:
        stages = Counter()
        recovered = 0
        epochs = _epochs(time, rng, _N_EPOCHS, near_edge)
        for t0 in epochs:
            inj = mt.inject_transit(time, flux, t0, depth, _DURATION)
            out = mt.recover_through_hunt(time, inj, t0, _DURATION)
            stages[out["stage"]] += 1
            if out["recovered"]:
                recovered += 1
        n = max(len(epochs), 1)
        rows.append((depth, recovered, n, stages))
    return rows


def _print_block(title, rows):
    print(title)
    print(f"  {'depth':>7} {'recov':>7} {'frac':>6}   stages")
    for depth, recovered, n, stages in rows:
        tally = ", ".join(f"{k}:{v}" for k, v in stages.most_common())
        print(f"  {depth*100:6.2f}% {recovered:3d}/{n:<3d} {recovered/n:6.0%}   {tally}")


def main():
    rng = np.random.default_rng(0)
    print("MONOTRANSIT COMPLETENESS  (inject known transit -> full hunt -> promoted?)")
    print(f"duration={_DURATION} d, {_N_EPOCHS} epochs/cell, single-sector curves\n")

    floor_hits = {}     # depth -> (recovered, total) pooled across stars, mid-segment
    for slug in _STARS:
        mid = _sweep(slug, near_edge=False, rng=rng)
        _print_block(f"[{slug}]  MID-SEGMENT (clear of any edge)", mid)
        print()
        edge = _sweep(slug, near_edge=True, rng=rng)
        _print_block(f"[{slug}]  NEAR A SEGMENT EDGE (within {_EDGE_BAND} d of a join)", edge)
        print()
        for depth, recovered, n, _ in mid:
            r, t = floor_hits.get(depth, (0, 0))
            floor_hits[depth] = (r + recovered, t + n)

    print("POOLED MID-SEGMENT RECOVERY (the completeness curve; the depth floor is where")
    print("recovery becomes reliable):")
    print(f"  {'depth':>7} {'recovered':>10} {'frac':>6}")
    floor = None
    for depth in _DEPTHS:
        r, t = floor_hits[depth]
        frac = r / t if t else 0.0
        if floor is None and frac >= 0.5:
            floor = depth
        print(f"  {depth*100:6.2f}% {r:6d}/{t:<3d} {frac:6.0%}")
    print(f"\nDEPTH FLOOR (first depth with >=50% mid-segment recovery): "
          f"{floor*100:.2f}%" if floor else "\nDEPTH FLOOR: not reached in this grid")
    print("Record the floor and the mid-vs-edge gap in docs/checks/phase-11/sub-11-4.md (Light 5).")


if __name__ == "__main__":
    main()
