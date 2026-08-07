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

import json

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


def _control_depths(
    time: np.ndarray,
    flux: np.ndarray,
    duration: float,
    ingress_frac: float = _INGRESS_FRAC,
    exclude_t0: float | None = None,
) -> np.ndarray:
    """Best-fit depths of the same-duration template at non-overlapping control windows.

    The empirical null at this timescale — what noise (white and red) alone produces —
    optionally skipping windows near ``exclude_t0`` so a real dip does not pollute its own
    baseline. Only windows resting on enough points are kept.
    """
    half = 0.5 * duration
    t_lo, t_hi = float(time.min()) + half, float(time.max()) - half
    controls = []
    for tc in np.arange(t_lo, t_hi, duration):   # non-overlapping control windows
        if exclude_t0 is not None and abs(tc - exclude_t0) < _SIG_EXCLUDE_FACTOR * duration:
            continue
        out = matched_filter_score(time, flux, tc, duration, sigma=1.0, ingress_frac=ingress_frac)
        if out["n_in"] >= _MIN_IN_TRANSIT:
            controls.append(out["depth"])
    return np.asarray(controls)


def _control_scatter(controls: np.ndarray) -> tuple[float, float]:
    """Robust (median, scatter) of a control-depth null; MAD-scaled, std as fallback."""
    med = float(np.median(controls))
    mad = float(np.median(np.abs(controls - med)))
    scatter = 1.4826 * mad
    if scatter <= 0:
        scatter = float(np.std(controls))
    return med, scatter


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

    controls = _control_depths(time, flux, duration, ingress_frac, exclude_t0=t0)
    if controls.size < _SIG_MIN_CONTROLS:
        return None

    med, scatter = _control_scatter(controls)
    if scatter <= 0:
        return None
    return float((depth - med) / scatter)


# The sensitivity floor is quoted at one representative central-transit duration, so an
# empty hunt can state a single "shallowest transit we could have seen." 0.4 d sits mid-grid;
# the completeness map (sub-11-4 Light 2) confirms recovery becomes reliable near the depth
# this floor reports.
_FLOOR_DURATION = 0.4


def sensitivity_depth_floor(
    time: np.ndarray,
    flux: np.ndarray,
    duration: float = _FLOOR_DURATION,
    ingress_frac: float = _INGRESS_FRAC,
) -> float | None:
    """Shallowest single transit that would clear the significance floor on THIS curve.

    Reads the same red-noise null ``significance_red`` builds and inverts it: the depth
    that scores exactly ``_SIG_MIN_MONO`` is ``_SIG_MIN_MONO * scatter + median``. That is
    the analytic sensitivity floor — the shallowest dip this curve's own noise would let
    clear the cut — so a hunt that finds nothing can still say what depth it could have seen.
    ``None`` when there is too little baseline to form the null (the honest held answer). The
    completeness map validates this floor against what the full chain actually recovers.
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    controls = _control_depths(time, flux, duration, ingress_frac)
    if controls.size < _SIG_MIN_CONTROLS:
        return None
    med, scatter = _control_scatter(controls)
    if scatter <= 0:
        return None
    return float(_SIG_MIN_MONO * scatter + med)


# --- lone-event discriminators (Light 4) --------------------------------------
#
# The four vetting gates (odd/even, secondary, shape, size) all assume the signal
# repeats — a monotransit gives them nothing to work with. A single event needs its
# own guard against the false positives that don't repeat either: instrument glitches
# at data-segment edges (momentum dumps, downlink resets), single-cadence spikes,
# stellar flares (a brightening, not a dimming), and one-sided ramps that no real
# central transit would leave. Each is a named rule with a physical reason, so a
# rejection can say *why*, never a bare number.
_EDGE_CLEAR = 1.0        # reject if a segment edge sits within this * duration of t0
_COHERENCE_MAX = 0.6     # deepest single cadence may carry at most this share of the dip
_FLARE_DEPTH_MULT = 1.0  # a positive bump larger than the dip itself, and...
_FLARE_SIGMA = 5.0       # ...louder than this many sigma, is a flare, not a transit
_ASYM_MAX = 0.5          # |ingress depth - egress depth| / their sum, above this = asymmetric


def _segment_edges(time: np.ndarray) -> np.ndarray:
    """Times where a data segment begins or ends — gaps > 0.5 d, plus the two ends."""
    gaps = np.where(np.diff(time) > 0.5)[0]
    return np.concatenate([[time[0]], time[gaps], time[gaps + 1], [time[-1]]])


def discriminators(
    time: np.ndarray,
    flux: np.ndarray,
    event: dict,
    sigma: float | None = None,
    ingress_frac: float = _INGRESS_FRAC,
) -> dict:
    """Guard a single candidate event against non-repeating false positives.

    Returns ``{"checks": [{name, passed, value}...], "passed": all-passed}``. This is
    NOT the four gates — none of them is called here; a lone event is judged on its
    own terms. The checks:

      edge       t0 stands clear of any segment boundary (momentum dumps ring there)
      coherence  the deficit is spread across the dip, not dumped into one cadence
      flare      no brightening larger and louder than the dip beside it (stellar flare)
      symmetry   ingress and egress depths agree (a real central transit is symmetric)
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    t0, dur, depth = event["t0"], event["duration"], event["depth"]
    if sigma is None:
        sigma = estimate_noise(flux)
    half = 0.5 * dur
    checks = []

    # edge --------------------------------------------------------------------
    edges = _segment_edges(time)
    dist = float(np.min(np.abs(edges - t0)))
    checks.append({"name": "edge", "passed": dist > _EDGE_CLEAR * dur, "value": round(dist, 4)})

    # in-transit points, and their deficit below baseline ---------------------
    base = float(np.median(flux))
    in_tr = np.abs(time - t0) < half
    d = np.clip(base - flux[in_tr], 0.0, None)   # deficit, >= 0
    total = float(np.sum(d))

    # coherence: no single cadence carries most of the dip --------------------
    frac_deepest = float(np.max(d) / total) if total > 0 and d.size else 1.0
    checks.append({"name": "coherence", "passed": frac_deepest < _COHERENCE_MAX,
                   "value": round(frac_deepest, 3)})

    # flare: a nearby brightening larger and louder than the dip --------------
    win = np.abs(time - t0) < 1.5 * dur
    max_pos = float(np.max(flux[win] - base)) if np.any(win) else 0.0
    is_flare = max_pos > _FLARE_DEPTH_MULT * depth and max_pos > _FLARE_SIGMA * sigma
    checks.append({"name": "flare", "passed": not is_flare, "value": round(max_pos, 5)})

    # symmetry: ingress vs egress depth ---------------------------------------
    t_in = time[in_tr]
    left, right = d[t_in < t0], d[t_in >= t0]
    dl, dr = (float(np.mean(left)) if left.size else 0.0), (float(np.mean(right)) if right.size else 0.0)
    asym = abs(dl - dr) / (dl + dr) if (dl + dr) > 0 else 1.0
    checks.append({"name": "symmetry", "passed": asym < _ASYM_MAX, "value": round(asym, 3)})

    return {"checks": checks, "passed": all(c["passed"] for c in checks)}


# --- from one transit, the least it could be: the minimum orbital period ------
#
# A monotransit has no period — that is why BLS discards it. But the one transit we
# saw still bounds the orbit. For a circular orbit crossing the star's center (impact
# parameter b = 0), the transit duration, the star's mean density, and the depth fix
# the period (Winn 2010, the small-angle central-transit duration):
#
#   T14 = (1 + k) / pi * (3 / (pi^2 * G * rho_star))^(1/3) * P^(1/3),   k = sqrt(depth)
#
# inverted:
#
#   P_min = (pi^2 * G * rho_star / 3) * T14^3 / (1 + k)^3
#
# A central transit is the LONGEST a given period can make; any grazing geometry of
# the same observed duration needs a LONGER period. So b = 0 gives the shortest period
# consistent with the data — a true lower bound. The surface says "at least P_min days",
# never "the period is P_min". The mean density comes from the catalog radius through a
# main-sequence mass-radius relation (M ~ R^1.25, so rho_star / rho_sun = R^-1.75): the
# same catalog-geometry footing the sub-11-5 triage stands on, and a wrong radius or an
# evolved star (a subgiant is far less dense) moves the bound — a caveat that travels.
_G_SI = 6.674e-11            # gravitational constant, m^3 kg^-1 s^-2
_RHO_SUN_SI = 1408.0         # mean solar density, kg m^-3
_MS_MASS_RADIUS_EXP = 1.25   # main-sequence M ~ R^1.25 (so rho ~ R^-1.75), solar units
_SECONDS_PER_DAY = 86400.0


def stellar_density_solar(radius_rsun: float) -> float:
    """Mean stellar density in kg/m^3, estimated from radius via a main-sequence relation.

    Uses M ~ R^1.25 (solar units), so rho_star = rho_sun * R^(1.25 - 3) = rho_sun * R^-1.75.
    Valid for main-sequence dwarfs (which the sub-11-5 triage already selects); a subgiant of
    the same radius is far less dense, which would lengthen the period bound. Raises on a
    non-positive radius (no density to report).
    """
    if radius_rsun <= 0:
        raise ValueError("radius_rsun must be positive")
    return _RHO_SUN_SI * radius_rsun ** (_MS_MASS_RADIUS_EXP - 3.0)


def min_orbital_period_days(
    duration_days: float, depth: float, stellar_radius_rsun: float
) -> float | None:
    """Shortest orbital period (days) consistent with a single transit of this shape.

    Inverts the central-transit (b = 0) duration relation, where the transit is longest for a
    given period, so the result is a genuine LOWER bound — the true period can only be longer.
    Returns ``None`` when the inputs cannot yield a bound (non-positive duration or radius). A
    zero depth (k -> 0) is allowed; a negative depth is treated as zero rather than raising.
    """
    if duration_days <= 0 or stellar_radius_rsun <= 0:
        return None
    rho = stellar_density_solar(stellar_radius_rsun)
    k = np.sqrt(max(depth, 0.0))
    t14 = duration_days * _SECONDS_PER_DAY
    period_s = (np.pi ** 2 * _G_SI * rho / 3.0) * t14 ** 3 / (1.0 + k) ** 3
    return float(period_s / _SECONDS_PER_DAY)


# --- the warmest it could be: an upper bound on the world's temperature -------
#
# The minimum period (above) is the SHORTEST orbit the transit allows, so it also
# fixes the CLOSEST the planet could sit to its star — and the closest orbit is the
# hottest. Turn that period into an orbital distance through Kepler's third law (with
# the star's mass from the same main-sequence relation the period bound uses), and the
# star's own temperature and radius into the flux that distance receives:
#
#   a_min    = (G * M_star * P_min^2 / (4 pi^2))^(1/3)         Kepler III
#   T_eq_max = T_eff * sqrt(R_star / (2 * a_min))             zero-albedo, closest orbit
#
# Every assumption pushes the number UP: the real period is at least P_min, so the real
# orbit is at least a_min, so the real insolation is at most this and the real
# equilibrium temperature is at most T_eq_max; zero albedo is the hottest a body can run
# (any reflection only cools it). So the honest statement is "at most T_eq_max", never
# "its temperature is T_eq_max" — and since the temperature descends from the period, it
# inherits the same main-sequence radius caveat.
_RSUN_M = 6.957e8            # solar radius, meters


def stellar_mass_kg(radius_rsun: float) -> float:
    """Stellar mass in kg, from radius via the same main-sequence relation as the density.

    ``M = rho_star * (4/3) pi R_star^3`` with ``rho_star = rho_sun * R^-1.75`` reduces to
    ``M ~ R^1.25`` in solar units — the identical M ~ R^1.25 footing the period bound stands
    on, so the orbital distance is consistent with the period it descends from. Raises on a
    non-positive radius (no mass to report). Returns ~1 solar mass at 1 R_sun.
    """
    if radius_rsun <= 0:
        raise ValueError("radius_rsun must be positive")
    return _RHO_SUN_SI * (4.0 / 3.0) * np.pi * _RSUN_M ** 3 * radius_rsun ** _MS_MASS_RADIUS_EXP


def semi_major_axis_m(period_days: float, radius_rsun: float) -> float:
    """Orbital semi-major axis in meters, from the period via Kepler's third law.

    ``a^3 = G M_star P^2 / (4 pi^2)``, with the stellar mass estimated from the radius.
    Fed the *minimum* period, it returns the *closest* the planet could orbit. Raises on
    non-positive input (no distance to report).
    """
    if period_days <= 0 or radius_rsun <= 0:
        raise ValueError("period_days and radius_rsun must be positive")
    mass = stellar_mass_kg(radius_rsun)
    period_s = period_days * _SECONDS_PER_DAY
    a_cubed = _G_SI * mass * period_s ** 2 / (4.0 * np.pi ** 2)
    return float(a_cubed ** (1.0 / 3.0))


def max_equilibrium_temp_k(
    min_period_days: float | None, teff_k: float | None, radius_rsun: float | None
) -> float | None:
    """Warmest equilibrium temperature (K) a single-transit world could run.

    From the *minimum* period (the closest orbit) and zero albedo (the hottest case),
    ``T_eq_max = T_eff * sqrt(R_star / (2 a_min))`` — a genuine UPPER bound: a longer real
    period, or any reflection, only lowers it. Returns ``None`` when the period bound, the
    effective temperature, or the radius is missing or non-physical (no temperature to
    report). Earth around the Sun returns its known ~278 K zero-albedo value.
    """
    if (min_period_days is None or teff_k is None or radius_rsun is None
            or min_period_days <= 0 or teff_k <= 0 or radius_rsun <= 0):
        return None
    a_min = semi_major_axis_m(min_period_days, radius_rsun)
    r_star_m = radius_rsun * _RSUN_M
    return float(teff_k * np.sqrt(r_star_m / (2.0 * a_min)))


# --- when it could come round again: the earliest a second transit could appear --
#
# A single transit is seen at epoch t0. If the true period is P >= P_min (sub-11-8),
# the next transit falls at t0 + P, so the EARLIEST one could appear is t0 + P_min:
# before that date a second transit cannot occur. Because the true period can only be
# longer, the true recurrence can only be later — so this is a one-sided bound, the
# same shape as every other number the survivor carries. The surface says "cannot recur
# before DATE", the earliest edge of the follow-up window, never "the next transit is on
# DATE". This is the bridge the north-star (finding-our-own-planet.md, §5-6) names as the
# last step that makes a discovery real: a monotransit is only confirmable if someone
# knows when to look for its second crossing.
#
# t0 is in the light curve's own time frame, which for TESS SPOC products is BTJD
# (Barycentric TESS Julian Date = BJD_TDB - 2457000). Add the offset to recover JD, then
# convert to a civil date with the standard Meeus algorithm — pure, exact for a calendar day.
_BTJD_OFFSET = 2457000.0     # BTJD = BJD_TDB - 2457000 (TESS reference epoch)


def jd_to_calendar_date(jd: float) -> str:
    """Gregorian civil date (``YYYY-MM-DD``) for a Julian Date, via the Meeus algorithm.

    Exact for the calendar day: JD 2451545.0 -> ``2000-01-01`` (J2000), JD 2440587.5 ->
    ``1970-01-01`` (the Unix epoch), JD 2457000.0 -> ``2014-12-08`` (the TESS BTJD epoch).
    The time-of-day fraction is carried through and floored, so any JD within a civil day
    returns that day. Uses the Gregorian branch for JD >= 2299161 (all TESS-era dates).
    """
    jd = jd + 0.5
    z = int(np.floor(jd))
    f = jd - z
    if z < 2299161:
        a = z
    else:
        alpha = int((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - alpha // 4
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    day = int(np.floor(b - d - int(30.6001 * e) + f))
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    return f"{year:04d}-{month:02d}-{day:02d}"


def earliest_recurrence_date(t0_btjd: float, min_period_days: float | None) -> str | None:
    """Calendar date (``YYYY-MM-DD``) of the earliest a second transit could appear.

    The transit at ``t0_btjd`` cannot recur before ``t0 + P_min``, since the true period is
    at least ``P_min`` — so this is the earliest edge of the follow-up window, a lower bound,
    never a predicted transit time (a longer real period only pushes it later). ``t0_btjd`` is
    read as BTJD (the TESS SPOC frame). Returns ``None`` when there is no period bound (no
    stellar radius), the same null discipline as the period and temperature it descends from.
    """
    if min_period_days is None or min_period_days <= 0:
        return None
    return jd_to_calendar_date(t0_btjd + min_period_days + _BTJD_OFFSET)


# sub-11-11: the follow-up brief. A survivor's numbers are in our internal dialect — the epoch is
# BTJD (a TESS-only offset) and the depth is a bare fraction. A follow-up observer, or an ExoFOP
# entry, works in BJD_TDB and millimagnitudes. These two pure conversions move the numbers into
# that frame so the flag can be handed off — a translation, never an upgrade of the claim.

def epoch_bjd_tdb(t0_btjd: float) -> float:
    """The transit epoch in BJD_TDB — the standard published/ExoFOP frame.

    ``t0`` comes from a TESS SPOC light curve, whose TIME column is BTJD (``BJD_TDB - 2457000``).
    Adding the offset back recovers the full Barycentric Julian Date in the TDB scale that every
    ephemeris and follow-up campaign uses. A frame change, not a new measurement.
    """
    return t0_btjd + _BTJD_OFFSET


def depth_to_millimag(depth: float) -> float | None:
    """Transit depth in millimagnitudes — the unit a follow-up photometrist measures in.

    Depth is a fractional flux drop; a photometrist reads it as a magnitude change,
    ``Delta_mag = -2.5 log10(1 - depth)``, times 1000 for millimagnitudes. The conversion is
    logarithmic (a genuine translation, not a rescale): a 1% transit is ~10.9 mmag. Returns
    ``None`` for a non-physical depth (``<= 0`` or ``>= 1``), where the magnitude is undefined.
    """
    if depth <= 0 or depth >= 1:
        return None
    return float(-2.5 * np.log10(1.0 - depth) * 1000.0)


# --- reachable entry point (Light 5) ------------------------------------------

def run_monotransit(planet_name: str) -> dict:
    """Full single-transit pass on a cached light curve: lc -> detrend -> search ->
    significance -> discriminators.

    Reuses the BLS light-curve loader and detrend verbatim, then runs the monotransit
    search this module adds. Each ranked event is annotated with its red-noise
    significance and the lone-event discriminators; ``candidate`` is True only when the
    event both clears the measured significance floor and passes every discriminator.
    Every event is returned, passing or not, so the report can show *why* — the same
    "window into the vetting" the four gates give.
    """
    from services import bls as bls_service

    lc_meta = bls_service._find_lc_cache(planet_name)
    if lc_meta is None:
        raise FileNotFoundError(f"No light curve cache found for '{planet_name}'")

    time, flux = bls_service._get_full_lc(planet_name, lc_meta)
    flux = bls_service._detrend(time, flux)
    med = float(np.median(flux))
    if med != 0:
        flux = flux / med                       # baseline to 1 for depth/significance
    sigma = estimate_noise(flux)
    depth_floor = sensitivity_depth_floor(time, flux)   # shallowest transit this curve admits

    candidates = []
    for e in search(time, flux, sigma=sigma):
        z = significance_red(time, flux, e["t0"], e["duration"])
        disc = discriminators(time, flux, e, sigma=sigma)
        significant = z is not None and z >= _SIG_MIN_MONO
        candidates.append({
            "t0": e["t0"],
            "duration": e["duration"],
            "depth": e["depth"],
            "ses": e["ses"],
            "significance": z,
            "significant": significant,
            "checks": disc["checks"],
            "passed": disc["passed"],
            "candidate": significant and disc["passed"],
        })

    return {"planet_name": planet_name, "candidates": candidates, "depth_floor": depth_floor}


# --- memoizing the search on disk (sub-11-12) ---------------------------------
#
# run_monotransit is the expensive unit — lc load, detrend, sliding search,
# significance, four discriminators. The hunt runs it across the whole frontier
# pool, and re-running it on every request is the multi-minute spinner that makes
# the "legible to anyone" page un-openable. But the search is deterministic given
# the curve: same curve in, same events out. So we memoize the result on disk,
# keyed to the source light curve's mtime, and only recompute when the curve
# changes (a re-fetch) or the pipeline itself changes.
#
# ★ _MONO_CACHE_VERSION is load-bearing. A stale derived cache that still parses is
# exactly the trap the vet cache sprang once: old numbers pass the schema and lie.
# ANY change to the detection pipeline — the significance floor, _N_MIN_TRANSITS,
# the detrend, the discriminators, the shape model — MUST bump this tag so every
# stored result is recomputed instead of silently trusted. When in doubt, bump it.
_MONO_CACHE_VERSION = "mono-v1"


def _mono_cache_path(planet_name: str):
    from services import bls as bls_service
    return bls_service._CACHE_DIR / f"mono_{bls_service._slug(planet_name)}.json"


def _lc_source_path(planet_name: str):
    """The full-resolution light curve that IS the search input (bls_lc_*.json).

    Keying on this file's mtime is what makes the memo correct: a re-fetch rewrites
    it, changing the mtime, which invalidates the stored result automatically.
    """
    from services import bls as bls_service
    return bls_service._CACHE_DIR / f"bls_lc_{bls_service._slug(planet_name)}.json"


def run_monotransit_cached(planet_name: str) -> dict:
    """``run_monotransit`` memoized on disk — an instant read once a star is warm.

    Returns the cached result when the source light curve's mtime and the pipeline
    version both match; otherwise recomputes and stores it. A corrupt or partial
    cache file is ignored (recompute), never fatal. Writes are atomic (temp +
    replace) so a killed process leaves either the old result or the new one, never
    a half-written file that happens to parse. Falls through to ``run_monotransit``
    verbatim when there is no cached curve, so the honest FileNotFoundError still
    surfaces for an unfetched star.
    """
    src = _lc_source_path(planet_name)
    cache = _mono_cache_path(planet_name)
    stamp = src.stat().st_mtime_ns if src.exists() else None

    if stamp is not None and cache.exists():
        try:
            stored = json.loads(cache.read_text(encoding="utf-8"))
            if stored.get("version") == _MONO_CACHE_VERSION and stored.get("lc_mtime_ns") == stamp:
                return stored["result"]
        except (json.JSONDecodeError, OSError, KeyError):
            pass  # corrupt or stale-shaped cache: fall through and recompute

    result = run_monotransit(planet_name)

    # re-read the source: it may have appeared during the run (a fetch inside
    # _get_full_lc), and its mtime is the key we must store against.
    src = _lc_source_path(planet_name)
    if src.exists():
        payload = json.dumps({
            "version": _MONO_CACHE_VERSION,
            "lc_mtime_ns": src.stat().st_mtime_ns,
            "result": result,
        })
        tmp = cache.with_suffix(".json.tmp")
        try:
            tmp.write_text(payload, encoding="utf-8")
            tmp.replace(cache)  # atomic on the same filesystem
        except OSError:
            pass  # a failed write must never break the search — just skip the cache
    return result


# --- the light curve behind a verdict, for the drilldown (sub-11-13) -----------
#
# The hunt says one honest sentence per star and the drilldown shows its numbers, but a
# person cannot SEE what the detector saw. This returns the same detrended, normalized
# curve the single-transit search actually worked on — not a differently-processed one —
# decimated for the browser, plus the events it found so the view can mark each dip and
# colour it by verdict. Honest by construction: the picture is the search's own input.

# Points to send the browser. The full curve is ~10^5 samples; a uniform stride down to a
# few thousand keeps the shape (and gaps) legible while the event markers pin the dips.
_CURVE_DISPLAY_POINTS = 3000


def monotransit_curve(planet_name: str, max_points: int = _CURVE_DISPLAY_POINTS) -> dict:
    """The searched light curve for display: the SAME curve the single-transit search saw
    (loaded, detrended, baselined to 1), decimated to ``max_points`` for the browser, plus
    the events the search found (t0, duration, depth, significance, verdict) so the view can
    mark each dip. Raises ``FileNotFoundError`` for an unfetched star — never invents a curve.
    """
    from services import bls as bls_service

    lc_meta = bls_service._find_lc_cache(planet_name)
    if lc_meta is None:
        raise FileNotFoundError(f"No light curve cache found for '{planet_name}'")

    time, flux = bls_service._get_full_lc(planet_name, lc_meta)
    flux = bls_service._detrend(time, flux)
    med = float(np.median(flux))
    if med != 0:
        flux = flux / med  # baseline to 1, exactly as the search sees it

    # drop any non-finite sample so the JSON stays strict (Starlette forbids NaN/Inf)
    finite = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[finite], flux[finite]
    original = int(len(time))

    if original > max_points:
        idx = np.unique(np.linspace(0, original - 1, max_points).astype(int))
        t_show, f_show = time[idx], flux[idx]
    else:
        t_show, f_show = time, flux

    # events come from the memoized search — instant once the star is warm
    result = run_monotransit_cached(planet_name)
    events = [{
        "t0": float(c["t0"]),
        "duration": float(c["duration"]),
        "depth": float(c["depth"]),
        "significance": (float(c["significance"]) if c["significance"] is not None else None),
        "significant": bool(c["significant"]),
        "passed": bool(c["passed"]),
        "candidate": bool(c["candidate"]),
    } for c in result["candidates"]]

    floor = result.get("depth_floor")
    return {
        "planet_name": planet_name,
        "mission": lc_meta.get("mission", "TESS"),
        "time": [float(x) for x in t_show],
        "flux": [float(x) for x in f_show],
        "point_count": int(len(t_show)),
        "original_count": original,
        "depth_floor": (float(floor) if floor is not None and np.isfinite(floor) else None),
        "events": events,
    }


# --- the hunt: many stars, one honest ledger (sub-11-3 Light 1) ----------------
#
# run_monotransit judges one star. A hunt runs it across the frontier pool and keeps
# an honest ledger: every star gets a disposition, and "searched, nothing survived" is
# a first-class result — an empty survivor list *with* an explanation for every star,
# not a bare empty body. Only survivors (candidate=True) are promoted; near-misses are
# recorded with the reason they fell, so the hunt reports what it saw, not just what it
# kept. This is orchestration over the sub-11-2 brick — no new physics.

# How close a single event came to being a real single-transit candidate. A star's
# disposition is the furthest its events reached, read off this order.
_DISPOSITION_ORDER = ["candidate", "rejected", "held", "insignificant"]


def _event_disposition(c: dict) -> str:
    """Where one scored event landed: survivor, guarded out, unjudged, or below floor."""
    if c["candidate"]:
        return "candidate"          # cleared significance and every discriminator
    if c["significant"]:
        return "rejected"           # significant, but a named discriminator caught it
    if c["significance"] is None:
        return "held"               # too little baseline to judge (the honest None)
    return "insignificant"          # judged, and below the measured floor


def _classify_star(result: dict) -> dict:
    """Collapse one star's events into a single ledger entry with a named disposition."""
    cands = result["candidates"]
    floor = result.get("depth_floor")
    if not cands:
        return {"planet_name": result["planet_name"], "disposition": "no_event",
                "n_events": 0, "significance": None, "failed": [], "depth_floor": floor}

    # the event that reached furthest toward a candidate sets the star's disposition
    top = min(cands, key=lambda c: _DISPOSITION_ORDER.index(_event_disposition(c)))
    disp = _event_disposition(top)
    failed = [ch["name"] for ch in top["checks"] if not ch["passed"]] if disp == "rejected" else []
    return {"planet_name": result["planet_name"], "disposition": disp,
            "n_events": len(cands), "significance": top["significance"], "failed": failed,
            "depth_floor": floor}


# When no size verdict is known for a star (no size_index, or a name absent from the pool
# triage), the hunt carries nulls rather than guessing — the same honesty as an unfetched star.
_NO_SIZE = {"size_class": None, "min_planet_rjup": None, "min_planet_rearth": None,
            "stellar_radius": None, "teff": None}

# Survivor ranking: a candidate where a detection could be a PLANET leads one where it could only
# be a star, and an unknown-size star sorts last (we cannot claim it could host a planet). Ties
# within a class break by significance. Mirrors the sub-11-5 pool order so the two agree.
_SIZE_RANK = {"plausible": 0, "too_big": 1, "unknown": 2}
_SIZE_RANK_UNKNOWN = 2   # also covers a null size_class (no triage for this star)


def hunt_monotransit(planet_names: list[str], size_index: dict | None = None) -> dict:
    """Run the single-transit search across many stars, keeping an honest ledger.

    For each star, ``run_monotransit`` if its light curve is cached, else record
    ``not_fetched`` — the tool never pretends to have looked where it did not. Every star
    gets a disposition; survivors (``candidate=True``) are promoted to a list tagged with
    their star and ranked by significance. Returns ``{"survivors": [...], "ledger": [...]}``.

    ``size_index`` (sub-11-6, from ``pool_assessment.size_class_by_name``) optionally stamps
    each ledger entry and survivor with what a detection on that star would MEAN — its size
    class (plausible / too_big / unknown) and minimum detectable planet radius — so a dip on a
    giant is reported honestly but never mistaken for a planet. Absent, every star carries nulls.
    """
    size_index = size_index or {}
    survivors = []
    ledger = []
    for name in planet_names:
        size = size_index.get(name, _NO_SIZE)
        try:
            result = run_monotransit_cached(name)
        except FileNotFoundError:
            ledger.append({"planet_name": name, "disposition": "not_fetched",
                           "n_events": 0, "significance": None, "failed": [], "depth_floor": None,
                           **size})
            continue
        ledger.append({**_classify_star(result), **size})
        radius = size.get("stellar_radius")
        teff = size.get("teff")
        for c in result["candidates"]:
            if c["candidate"]:
                # what the machine is blind to: the shortest orbit this lone transit could belong to
                min_p = (min_orbital_period_days(c["duration"], c["depth"], radius)
                         if radius else None)
                # and the warmest that closest orbit could run — an upper bound, "at most"
                max_t = max_equilibrium_temp_k(min_p, teff, radius)
                # and the earliest that shortest orbit could bring it round again — "no earlier"
                recur = earliest_recurrence_date(c["t0"], min_p)
                # and the same numbers in an observer's frame, so the flag can be handed off
                survivors.append({"planet_name": name, **c, **size,
                                  "min_period_days": min_p, "max_eq_temp_k": max_t,
                                  "earliest_recurrence": recur,
                                  "epoch_bjd_tdb": epoch_bjd_tdb(c["t0"]),
                                  "depth_mmag": depth_to_millimag(c["depth"])})

    # plausible-star candidates lead star-sized ones; significance breaks ties within a class
    survivors.sort(key=lambda c: (
        _SIZE_RANK.get(c.get("size_class"), _SIZE_RANK_UNKNOWN), -c["significance"]))
    return {"survivors": survivors, "ledger": ledger}


# --- completeness: injection + full-hunt recovery (sub-11-4 Light 1) -----------
#
# The false-alarm audit (sub-11-3) proved the hunt stays quiet on noise — specificity.
# Its twin is completeness: press a transit of KNOWN depth into a real curve and ask
# whether the full chain promotes it. Injecting into real data (not synthetic) keeps the
# red noise, gaps, and segment joins the hunt actually fights, so a recovery number means
# what it says. The recovery helper reports not just yes/no but WHERE a real transit dies —
# search, significance, or a named discriminator — because that is the completeness cost of
# each guard, the price paid for the specificity the false-alarm audit bought.

# A recovered event must sit within this fraction of a duration of the injected t0 to count
# as the same transit; farther off and the "recovery" is a different dip, not ours.
_RECOVER_MATCH_FACTOR = 0.5


def inject_transit(
    time: np.ndarray,
    flux: np.ndarray,
    t0: float,
    depth: float,
    duration: float,
    ingress_frac: float = _INGRESS_FRAC,
) -> np.ndarray:
    """Press one trapezoidal single transit of ``depth`` into a real (baseline-1) curve.

    Multiplicative, the physical form: ``flux * (1 - depth * shape)`` dims the star by
    ``depth`` on the flat floor and ramps across ingress/egress, riding on top of whatever
    real noise the curve already carries. Returns a new array; the input is untouched.
    """
    return np.asarray(flux, dtype=float) * transit_model(time, t0, duration, depth, ingress_frac)


def recover_through_hunt(
    time: np.ndarray,
    flux: np.ndarray,
    t0: float,
    duration: float,
    sigma: float | None = None,
    ingress_frac: float = _INGRESS_FRAC,
) -> dict:
    """Run the full chain on a curve and report the fate of the event near ``(t0, duration)``.

    Returns ``{"recovered": bool, "stage": str, "significance": float | None}`` where
    ``stage`` names where the injected transit ended up:

      ``search``         the sliding search never surfaced a dip near t0 (too shallow to find)
      ``held``           found, but too little baseline to judge significance (the honest None)
      ``insignificant``  found and judged, but below the measured significance floor
      ``edge``/``coherence``/``flare``/``symmetry``  found and significant, but a discriminator
                         rejected it — the completeness cost of that guard
      ``promoted``       cleared significance and every discriminator: a recovered candidate

    This is the sensitivity counterpart to ``hunt_monotransit``: same chain, but pointed at a
    transit we planted, so a miss tells us not just *that* the hunt is blind but *where*.
    """
    time = np.asarray(time, dtype=float)
    flux = np.asarray(flux, dtype=float)
    if sigma is None:
        sigma = estimate_noise(flux)

    window = _RECOVER_MATCH_FACTOR * duration
    match = None
    for e in search(time, flux, sigma=sigma, ingress_frac=ingress_frac):
        if abs(e["t0"] - t0) <= window and (match is None or e["ses"] > match["ses"]):
            match = e
    if match is None:
        return {"recovered": False, "stage": "search", "significance": None}

    z = significance_red(time, flux, match["t0"], match["duration"], ingress_frac=ingress_frac)
    if z is None:
        return {"recovered": False, "stage": "held", "significance": None}
    if z < _SIG_MIN_MONO:
        return {"recovered": False, "stage": "insignificant", "significance": z}

    disc = discriminators(time, flux, match, sigma=sigma, ingress_frac=ingress_frac)
    if not disc["passed"]:
        failed = next(c["name"] for c in disc["checks"] if not c["passed"])
        return {"recovered": False, "stage": failed, "significance": z}
    return {"recovered": True, "stage": "promoted", "significance": z}
