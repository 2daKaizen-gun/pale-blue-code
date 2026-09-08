"""Predict which unsearched dwarfs are worth fetching — from our own measured floors (path A, widening).

Path A's four sensitivity levers are all null (vision §9-2): the pipeline is as sharp as it gets, so
the way forward is *more* quiet stars that already reach Earth size, not a lower floor. But fetching a
light curve is the slow, network-bound step, and only ~6% of even carefully-chosen dwarfs turn out
quiet enough to reach Earth size (§9). So before spending a fetch we ask: can we predict, from
catalog values we already have, which unsearched stars will reach Earth size?

The honest answer, measured here: **weakly, and one-sided.** A star's measured depth floor rises with
faintness (brighter = quieter), but Tmag alone explains only ~R^2 0.17 of it — the rest is red noise,
crowding, and stellar variability that no catalog value foretells. So a Tmag-based predictor is a
*conservative pre-filter*: when it predicts Earth-size it is almost always right (high precision), but
it misses most Earth-size stars (low recall), because their low floor comes from a quietness brightness
cannot see. Prediction sharpens where to look first; it does not replace searching.

This fits `log(floor) = a + b*Tmag` from the stars we have already searched (their measured floor +
catalog Tmag/radius), validates the fit's Earth-size skill on a held-out half, and ranks an unsearched
candidate pool by predicted minimum planet radius (`sqrt(predicted_floor)*R_star`). Reads caches only
for the fit; never fetches.

Run from the backend/ dir, e.g.:
    python ../scripts/predict_earth_reach.py --searched data/frontier_seeds_tess.json data/pool_s0103.json \
        --candidates data/pool_s0102.json --top 20
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

import numpy as np   # noqa: E402

from services import pool_assessment as pa   # noqa: E402
from completeness_hunt import _measured_floor   # noqa: E402

# A floor at or above this depth is a degenerate curve (its control null had huge scatter), not real
# sensitivity — excluded from the fit so a handful of failed curves do not bend the relation.
_FLOOR_CAP = 0.05
_MIN_FIT = 20               # too few searched stars -> no honest fit
_EARTH_MAX_REARTH = 1.25


def fit_floor_model(rows):
    """rows: iterable of ``{tmag, floor}``. Fit ``log(floor) = a + b*tmag`` by least squares.

    Drops missing values and degenerate floors (<=0 or >= ``_FLOOR_CAP``). Returns
    ``{a, b, n, r2}`` — the intercept, slope, sample size, and in-sample R^2 — or ``None`` when
    there are too few usable points to fit honestly.
    """
    pts = [
        (r["tmag"], r["floor"])
        for r in rows
        if r.get("tmag") is not None and r.get("floor") and 0 < r["floor"] < _FLOOR_CAP
    ]
    if len(pts) < _MIN_FIT:
        return None
    t = np.array([p[0] for p in pts], dtype=float)
    f = np.log(np.array([p[1] for p in pts], dtype=float))
    b, a = np.polyfit(t, f, 1)
    pred = a + b * t
    ss_res = float(np.sum((f - pred) ** 2))
    ss_tot = float(np.sum((f - f.mean()) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
    return {"a": float(a), "b": float(b), "n": len(pts), "r2": r2}


def predict_floor(tmag, model):
    """The floor this brightness implies under the fitted relation (a central estimate, not a bound)."""
    return float(np.exp(model["a"] + model["b"] * tmag))


def predict_min_rearth(radius, tmag, model):
    """Predicted smallest planet a star could reveal: ``sqrt(predicted_floor)*R_star`` in R_earth.

    ``None`` when radius or Tmag is missing (no prediction, never a guessed one).
    """
    if radius and radius > 0 and tmag is not None:
        return pa.rjup_to_rearth(pa.min_detectable_planet_radius(radius, predict_floor(tmag, model)))
    return None


def rank_candidates(rows, model, earth_max=_EARTH_MAX_REARTH):
    """rows: iterable of ``{tic, tmag, radius}``. Rank by predicted min planet radius, sharpest first.

    Returns a list of ``{tic, tmag, radius, pred_min_rearth, earth_size}`` sorted ascending by the
    predicted reach; a row with no prediction (missing radius/Tmag) sorts last with ``earth_size``
    False. ``earth_size`` flags a predicted reach at or below ``earth_max`` — the conservative
    pre-filter (high precision, low recall; see validate_reach_prediction).
    """
    ranked = []
    for r in rows:
        pred = predict_min_rearth(r.get("radius"), r.get("tmag"), model)
        ranked.append({
            "tic": r.get("tic"),
            "tmag": r.get("tmag"),
            "radius": r.get("radius"),
            "pred_min_rearth": pred,
            "earth_size": pred is not None and pred <= earth_max,
        })
    ranked.sort(key=lambda r: (r["pred_min_rearth"] is None,
                               r["pred_min_rearth"] if r["pred_min_rearth"] is not None else 0.0))
    return ranked


def validate_reach_prediction(rows, earth_max=_EARTH_MAX_REARTH):
    """Measure the predictor's Earth-size skill on a held-out half — the honest self-report.

    rows: searched stars ``{tmag, radius, floor}`` with a measured floor. Splits deterministically
    (even indices fit, odd indices test — no RNG, so the number is reproducible), fits on the train
    half, and on the test half compares predicted Earth-size against *actual* Earth-size (from the
    measured floor). Returns ``{n_train, n_test, r2, precision, recall, median_abs_err_rearth}`` or
    ``None`` when either half is too small. Precision high with recall low is the expected, honest
    shape: a conservative pre-filter, not an oracle.
    """
    usable = [
        r for r in rows
        if r.get("tmag") is not None and r.get("radius") and r.get("floor")
        and 0 < r["floor"] < _FLOOR_CAP
    ]
    train = usable[::2]
    test = usable[1::2]
    model = fit_floor_model(train)
    if model is None or len(test) < _MIN_FIT:
        return None

    tp = fp = fn = 0
    abs_errs = []
    for r in test:
        actual = pa.rjup_to_rearth(pa.min_detectable_planet_radius(r["radius"], r["floor"]))
        pred = predict_min_rearth(r["radius"], r["tmag"], model)
        if pred is None:
            continue
        abs_errs.append(abs(pred - actual))
        pe, ae = pred <= earth_max, actual <= earth_max
        tp += pe and ae
        fp += pe and not ae
        fn += (not pe) and ae
    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    return {
        "n_train": model["n"], "n_test": len(test), "r2": model["r2"],
        "precision": precision, "recall": recall,
        "median_abs_err_rearth": float(np.median(abs_errs)) if abs_errs else None,
    }


def _searched_rows(pool_paths):
    """Searched stars with a measured floor + catalog tmag/radius, unioned across pools (dedup by TIC)."""
    seen = {}
    for p in pool_paths:
        for s in json.loads(Path(p).read_text(encoding="utf-8"))["stars"]:
            tic = int(s["tic"])
            if tic in seen:
                continue
            floor = _measured_floor("tic-%s" % tic)
            if floor is not None:
                seen[tic] = {"tic": tic, "tmag": s.get("tmag"), "radius": s.get("radius"), "floor": floor}
    return list(seen.values())


def _candidate_rows(pool_paths, searched_tics):
    """Unsearched stars (no measured floor) from the candidate pools — the fetch-worth question."""
    rows = []
    for p in pool_paths:
        for s in json.loads(Path(p).read_text(encoding="utf-8"))["stars"]:
            tic = int(s["tic"])
            if tic in searched_tics or _measured_floor("tic-%s" % tic) is not None:
                continue
            rows.append({"tic": tic, "tmag": s.get("tmag"), "radius": s.get("radius")})
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Rank unsearched dwarfs by predicted Earth-size reach.")
    ap.add_argument("--searched", nargs="+", required=True,
                    help="pools of already-searched stars, to fit + validate the floor-vs-Tmag relation")
    ap.add_argument("--candidates", nargs="+",
                    help="pools of unsearched stars to rank (omit to only fit+validate)")
    ap.add_argument("--top", type=int, default=20)
    args = ap.parse_args()

    searched = _searched_rows(args.searched)
    model = fit_floor_model(searched)
    if model is None:
        print("too few searched stars with a measured floor to fit.")
        return
    print("fit log(floor) = %.4f + %.4f*Tmag   (n=%d, in-sample R^2=%.3f)"
          % (model["a"], model["b"], model["n"], model["r2"]))

    v = validate_reach_prediction(searched)
    if v:
        pr = ("%.2f" % v["precision"]) if v["precision"] is not None else "n/a"
        rc = ("%.2f" % v["recall"]) if v["recall"] is not None else "n/a"
        me = ("%.2f" % v["median_abs_err_rearth"]) if v["median_abs_err_rearth"] is not None else "n/a"
        print("held-out skill (train %d / test %d): Earth-size precision=%s recall=%s, median |err|=%s R_earth"
              % (v["n_train"], v["n_test"], pr, rc, me))
        print("(precision high / recall low = a conservative pre-filter: trust a positive, keep searching the rest)")

    if not args.candidates:
        return
    searched_tics = {r["tic"] for r in searched}
    candidates = _candidate_rows(args.candidates, searched_tics)
    ranked = rank_candidates(candidates, model)
    predicted_earth = [r for r in ranked if r["earth_size"]]
    print("-" * 66)
    print("candidate pool: %s  (%d unsearched)"
          % (", ".join(Path(p).name for p in args.candidates), len(candidates)))
    print("predicted Earth-size (a positive is worth a fetch first): %d" % len(predicted_earth))
    print("  %-14s %7s %8s %13s" % ("TIC", "Tmag", "R_star", "pred min R_e"))
    for r in ranked[:args.top]:
        tm = "%.2f" % r["tmag"] if r["tmag"] is not None else "  ?  "
        rad = "%.3f" % r["radius"] if r["radius"] else "  ?  "
        pr = "%.2f" % r["pred_min_rearth"] if r["pred_min_rearth"] is not None else " ? "
        mark = "  <- Earth-size" if r["earth_size"] else ""
        print("  %-14s %7s %8s %13s%s" % (r["tic"], tm, rad, pr, mark))


if __name__ == "__main__":
    main()
