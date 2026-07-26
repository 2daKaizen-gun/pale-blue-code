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
