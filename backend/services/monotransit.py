"""Single-transit (monotransit) search — the first brick (sub-11-2).

BLS finds a planet by its *repetition*: fold on a trial period, stack the dips,
gain signal from every orbit. A long-period planet that crosses its star only
once inside a 27-day TESS sector has nothing to fold — one dip, k = 1 — so BLS
discards it and the sub-11-1 significance precondition (which measures depth
against the scatter *between* transits) is blind to it. That single event is the
frontier `docs/vision/finding-our-own-planet.md` points us at: what the machines
miss.

This module is the primitive underneath that search. It does not fold. It scores
one place in the light curve against the shape a single transit would leave — a
matched filter — and asks how far that dip stands above the noise.

Light 1 is just the primitive: the transit shape, and the score at a fixed
(t0, duration). The sliding search, the red-noise significance, and the
lone-event discriminators build on top of it in later Lights.
"""

import numpy as np

# A real transit is not a box: the planet takes finite time to cross the limb, so
# the dip ramps down (ingress), sits on a flat floor while the disk is fully
# inside, then ramps back up (egress). We model that as a trapezoid. `ingress_frac`
# is the fraction of the total (first-to-last-contact) duration spent in *each*
# ramp; 0.1 is a typical central-transit value and keeps a wide flat floor.
_INGRESS_FRAC = 0.1


def transit_shape(
    time: np.ndarray, t0: float, duration: float, ingress_frac: float = _INGRESS_FRAC
) -> np.ndarray:
    """Unit-depth trapezoidal transit template, centered at ``t0``.

    Returns an array in [0, 1]: 0 outside the transit, 1 on the flat floor, and a
    linear ramp across ingress and egress. ``duration`` is the total first- to
    last-contact width (t1->t4). Multiply by a depth to get the flux deficit.
    """
    if duration <= 0:
        raise ValueError("duration must be positive")
    ingress_frac = min(max(ingress_frac, 0.0), 0.5)

    dt = np.abs(time - t0)
    half = 0.5 * duration
    flat_half = half * (1.0 - 2.0 * ingress_frac)  # half-width of the flat floor
    ramp = half - flat_half                        # ingress/egress ramp length

    shape = np.zeros_like(time, dtype=float)
    # flat floor: fully inside the disk
    shape[dt <= flat_half] = 1.0
    if ramp > 0:
        # ramp region: linear from 1 at the floor edge to 0 at last contact
        on_ramp = (dt > flat_half) & (dt < half)
        shape[on_ramp] = (half - dt[on_ramp]) / ramp
    return shape


def transit_model(
    time: np.ndarray,
    t0: float,
    duration: float,
    depth: float,
    ingress_frac: float = _INGRESS_FRAC,
) -> np.ndarray:
    """Normalized flux (baseline 1.0) with a single trapezoidal dip of ``depth``."""
    return 1.0 - depth * transit_shape(time, t0, duration, ingress_frac)


def estimate_noise(flux: np.ndarray) -> float:
    """Robust per-point scatter of a (detrended, baseline-1) light curve.

    Median absolute deviation scaled to a Gaussian sigma — resistant to the very
    dips we are hunting, which a plain std would inflate itself on.
    """
    resid = flux - np.median(flux)
    mad = np.median(np.abs(resid - np.median(resid)))
    sigma = 1.4826 * mad
    # a perfectly flat synthetic curve gives mad = 0; fall back to std so the
    # score stays finite in tests and on pristine data
    if sigma <= 0:
        sigma = float(np.std(resid)) or 1.0
    return float(sigma)


def matched_filter_score(
    time: np.ndarray,
    flux: np.ndarray,
    t0: float,
    duration: float,
    sigma: float | None = None,
    ingress_frac: float = _INGRESS_FRAC,
) -> dict:
    """Score a single-transit hypothesis at fixed ``(t0, duration)``.

    Fits the trapezoidal template to the flux by least squares (the best-fit depth)
    and reports how far that depth stands above white noise — the single-event
    statistic (SES), in units of sigma:

        depth_hat = sum(d * s) / sum(s * s)          d = 1 - flux, s = template
        ses       = sum(d * s) / (sigma * sqrt(sum(s * s)))

    SES is the matched-filter amplitude divided by its own uncertainty. Here the
    noise is treated as white; Light 3 replaces sigma with a correlated-noise
    normalization, because on real light curves red noise is what fakes single
    dips and dividing by white sigma would overstate confidence (the sub-10-3
    lesson, one step further).

    Returns ``{"depth": depth_hat, "ses": ses, "n_in": in-transit point count}``.
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    s = transit_shape(time, t0, duration, ingress_frac)
    ss = float(np.sum(s * s))
    n_in = int(np.count_nonzero(s > 0))
    if ss == 0:
        # the template covers no data (t0 outside the light curve, or a gap)
        return {"depth": 0.0, "ses": 0.0, "n_in": 0}

    if sigma is None:
        sigma = estimate_noise(flux)

    d = 1.0 - flux                       # observed deficit, positive during a dip
    ds = float(np.sum(d * s))
    depth_hat = ds / ss
    ses = ds / (sigma * np.sqrt(ss))
    return {"depth": depth_hat, "ses": float(ses), "n_in": n_in}


# The search grid. A single-sector planet can leave anything from a grazing few-hour
# dip to a near-day-long central transit; these durations bracket that range. The
# grid steps t0 at duration/OVERSAMPLE so no dip falls between trial centers.
_DURATIONS = [0.1, 0.2, 0.4, 0.8]   # days, total first-to-last contact
_OVERSAMPLE = 4
_MIN_IN_TRANSIT = 3                 # a dip resting on < 3 points is a spike, not a transit

# A dip surfaces at several neighboring (t0, duration) grid points; we keep only the
# strongest and merge anything within DEDUP_FACTOR * duration of it in time.
_DEDUP_FACTOR = 1.0

# Repetition is BLS's job. If a candidate has a comparable-depth twin elsewhere in the
# light curve, the two form a repeating pair a folded search would already catch, so we
# drop them from the *mono*transit list. "Comparable" = the shallower is at least this
# fraction of the deeper; unrelated noise peaks are far shallower and survive as noise,
# not as twins.
_REPEAT_DEPTH_RATIO = 0.5


def _scan(time, flux, durations, sigma, ingress_frac):
    """Every scored (t0, duration) position on the grid with a real, resting dip."""
    hits = []
    t_lo, t_hi = float(time.min()), float(time.max())
    for dur in durations:
        half = 0.5 * dur
        step = dur / _OVERSAMPLE
        t0s = np.arange(t_lo + half, t_hi - half, step)
        for t0 in t0s:
            out = matched_filter_score(time, flux, t0, dur, sigma, ingress_frac)
            if out["depth"] > 0 and out["n_in"] >= _MIN_IN_TRANSIT:
                hits.append({"t0": float(t0), "duration": dur, **out})
    return hits


def _dedup(hits):
    """Collapse neighboring grid hits for the same dip, keeping the strongest SES."""
    kept = []
    for h in sorted(hits, key=lambda x: x["ses"], reverse=True):
        window = _DEDUP_FACTOR * h["duration"]
        if any(abs(h["t0"] - k["t0"]) < max(window, _DEDUP_FACTOR * k["duration"]) for k in kept):
            continue
        kept.append(h)
    return kept


def _is_repeating(event, others):
    """True if a comparable-depth dip sits elsewhere — a pair BLS would fold."""
    for o in others:
        if o is event:
            continue
        hi, lo = max(event["depth"], o["depth"]), min(event["depth"], o["depth"])
        if hi > 0 and lo / hi >= _REPEAT_DEPTH_RATIO:
            return True
    return False


def search(
    time: np.ndarray,
    flux: np.ndarray,
    durations: list[float] | None = None,
    sigma: float | None = None,
    ingress_frac: float = _INGRESS_FRAC,
    top_k: int = 10,
) -> list[dict]:
    """Find isolated, transit-shaped single dips a folded search would discard.

    Slides the matched filter over a (duration x t0) grid, keeps the strongest hit
    per dip, then drops any dip that has a comparable-depth twin — those repeat, and
    catching repetition is BLS's job, not ours. What is left is the monotransit list:
    events that appear *once*, ranked by single-event statistic.

    No significance cut is applied here (that is Light 3); only structural floors —
    a dip must rest on at least a few points and be a dimming, not a brightening.
    Returns up to ``top_k`` candidates as dicts of (t0, duration, depth, ses, n_in).
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    durations = durations or _DURATIONS
    if sigma is None:
        sigma = estimate_noise(flux)

    peaks = _dedup(_scan(time, flux, durations, sigma, ingress_frac))
    singles = [p for p in peaks if not _is_repeating(p, peaks)]
    singles.sort(key=lambda x: x["ses"], reverse=True)
    return singles[:top_k]


# --- single-event significance, red-noise aware (Light 3) ---------------------
#
# The matched-filter SES above divides by *white* sigma. On a real light curve that
# overstates a lone dip, because stellar variability and instrumental drift leave
# *correlated* (red) noise: slow wobbles that, at the transit timescale, mimic a
# single dip. sub-11-1 could lean on the scatter BETWEEN transits to sidestep this,
# but a monotransit has no second transit to compare against. So we measure the noise
# the honest way — empirically, at the candidate's own duration.
#
# Slide the same-duration template across the rest of the light curve and read the
# best-fit depth at each control position. Those control depths are what noise alone
# produces at this timescale, red noise included: on a wobbly star they scatter wide,
# on a flat one they cluster at zero. The candidate's depth over that scatter is its
# significance. A calm-looking dip on a restless star is correctly deflated.
_SIG_EXCLUDE_FACTOR = 1.5   # skip controls within this * duration of the candidate
_SIG_MIN_CONTROLS = 8       # too few control windows → no baseline → judgment held

# Threshold: measured by injection-recovery on real single-sector TESS light curves,
# not asserted (scripts/measure_monotransit_significance.py, run on TIC 7318157, the
# sub-10-3 noise case). Noise alone tops out at 2.86 over 300 control epochs (99th
# pct 2.14); an injected 0.4%-deep transit that the search recovers scores 6.5+ (p10
# 6.52), and a 0.8% one 13.8+. Between the noise ceiling and the signal floor is an
# empty gap, and 5.0 sits in it: ~2 above the loudest noise (false alarms ~nil) and
# below anything the search can actually recover. Re-run and recorded live in Light 6.
_SIG_MIN_MONO = 5.0


def significance_red(
    time: np.ndarray,
    flux: np.ndarray,
    t0: float,
    duration: float,
    ingress_frac: float = _INGRESS_FRAC,
) -> float | None:
    """Single-event significance of a dip, normalized against correlated noise.

    Returns the candidate depth in units of the empirical scatter of same-duration
    matched-filter depths elsewhere in the light curve (red noise and all), or
    ``None`` when there is too little baseline to form that null — judgment held,
    the honest answer rather than a fabricated number.
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    depth = matched_filter_score(time, flux, t0, duration, sigma=1.0, ingress_frac=ingress_frac)["depth"]

    half = 0.5 * duration
    t_lo, t_hi = float(time.min()) + half, float(time.max()) - half
    controls = []
    for tc in np.arange(t_lo, t_hi, duration):   # non-overlapping control windows
        if abs(tc - t0) < _SIG_EXCLUDE_FACTOR * duration:
            continue
        out = matched_filter_score(time, flux, tc, duration, sigma=1.0, ingress_frac=ingress_frac)
        if out["n_in"] >= _MIN_IN_TRANSIT:
            controls.append(out["depth"])

    controls = np.asarray(controls)
    if controls.size < _SIG_MIN_CONTROLS:
        return None

    med = float(np.median(controls))
    mad = float(np.median(np.abs(controls - med)))
    scatter = 1.4826 * mad
    if scatter <= 0:
        scatter = float(np.std(controls))
    if scatter <= 0:
        return None
    return float((depth - med) / scatter)
