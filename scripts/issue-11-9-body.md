## 11-9: The warmest it could be — an upper bound on the world's temperature

sub-11-8 gave a single-transit survivor the one number BLS could never hand it: a
minimum orbital period, stated as a lower bound — "this orbit is at least P_min
days." That number is a floor. This sub-phase spends it.

Because P_min is the *shortest* orbit the transit allows, it also fixes the
*closest* the planet could sit to its star — and the closest orbit is the hottest.
Turn the period into an orbital distance through Kepler's third law (with the star's
mass from the same main-sequence relation the period bound already uses), and the
star's own temperature and radius into the flux that distance receives, and a
survivor can finally answer the question the whole hunt is really about:

    a_min  = ( G * M_star * P_min^2 / (4*pi^2) )^(1/3)         Kepler III
    T_eq_max = T_eff * sqrt( R_star / (2 * a_min) )            zero-albedo, closest orbit

**Every assumption here errs toward "at most."** The real period is at least P_min,
so the real orbit is at least a_min, so the real insolation is at most this and the
real equilibrium temperature is at most T_eq_max. Zero albedo is the hottest a body
can run (any reflection only cools it). So the honest sentence a survivor earns is
"this world is at most T_eq_max — and since it is probably farther out, likely
cooler," never "its temperature is T_eq_max."

This is where a single transit stops being a dip and becomes a *world you can ask
about*: is it, even at its warmest, cool enough to be temperate? The machines throw
these away unfolded. We can say how warm they could be.

### Lights

- **L1 — the physics.** Pure `stellar_mass_kg(radius_rsun)`,
  `semi_major_axis_m(period_days, radius_rsun)` (Kepler III with the M ~ R^1.25
  mass), and `max_equilibrium_temp_k(min_period_days, teff_k, radius_rsun)` in the
  monotransit service. Earth around the Sun returns its known ~278 K zero-albedo
  value; monotonic (hotter star hotter, longer minimum period cooler); a genuine
  upper bound (a longer period only lowers it); guarded on non-physical or missing
  input (no T_eff, no radius, no period -> None). No I/O.
- **L2 — join to the hunt.** The pool triage index carries the stellar effective
  temperature alongside the radius, and `hunt_monotransit` stamps every survivor
  with `max_eq_temp_k`, computed from its own minimum period and its star. New model
  field on the survivor; null when T_eff, radius, or the period bound is missing —
  the same honesty as an unfetched star.
- **L3 — the frontend surface (copy).** A pure, tested `survivorTempNote` that reads
  the temperature as an upper bound ("at most", never "is"), names the temperate
  framing when even the warmest case is cool enough to ask about, and omits the line
  when no bound is known.
- **L4 — the survivor card.** The card shows "at most T K" beside the minimum
  period, so the survivor's portrait — how long its orbit is *at least*, how warm it
  is *at most* — reads in one place.

### Check

`docs/checks/phase-11/sub-11-9.md`: the derivation and its "at most" meaning, a
worked Earth-around-the-Sun validation of the constant, worked temperatures on a
real dwarf across a range of periods, the assumptions carried forward (zero albedo,
main-sequence mass, a temperature that inherits the period's radius dependence), and
the honest boundary (an upper bound, not a temperature; not evidence of a planet).
`pytest` + `vitest` green.

### Success criteria

- [ ] `max_equilibrium_temp_k` returns Earth's known zero-albedo value around the
      Sun, is monotonic in effective temperature and minimum period, is a genuine
      upper bound (a longer period only lowers it), and guards non-physical or
      missing input
- [ ] every survivor carries `max_eq_temp_k` (or null when T_eff, radius, or the
      period bound is unknown), derived from its own minimum period and its star
- [ ] the survivor card states the temperature as an upper bound and names the
      temperate framing, never as a measured temperature
- [ ] the zero-albedo and main-sequence assumptions are stated where the number is
      reported
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **An upper bound, stated as one.** The minimum period gives the closest orbit and
  so the hottest case; zero albedo makes it hotter still. Every assumption pushes the
  number up, so the true temperature can only be lower. The surface says "at most,"
  never "is."
- **Mass from the same main-sequence relation.** The orbital distance needs a
  stellar mass; reuse the M ~ R^1.25 footing the period bound already stands on
  rather than invent a second mass source, so the temperature is consistent with the
  period it descends from — and inherits the same radius caveat.
- **The number that makes a world worth asking about.** A period says where; a
  temperature says whether it could be temperate. That is the question a human cares
  about, and the one a machine that discarded the transit never reached.
