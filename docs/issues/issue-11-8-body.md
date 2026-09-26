## 11-8: From one transit, the least it could be — the minimum orbital period

A single-transit candidate has no period. That is the whole reason it exists: BLS
needs the dip to repeat, and a long-period planet that crosses once in a 27-day
sector never gives it a second crossing to fold. But "no period" is not "no
information." The shape of the one transit we did see already constrains how long
the orbit must be — and the constraint runs in exactly the direction that makes a
monotransit worth hunting: **toward the long periods the machines are blind to.**

For a circular orbit crossing the star's center (impact parameter b = 0), the
transit duration, the star's mean density, and the transit depth fix the period:

    P_min = (pi^2 * G * rho_star / 3) * T14^3 / (1 + k)^3      k = sqrt(depth)

A central transit is the *longest* transit a given period can produce; any grazing
geometry (b > 0) of the same observed duration demands a *longer* period. So b = 0
yields the shortest period consistent with what we saw — a genuine **lower bound**.
The honest statement a survivor earns is therefore "this orbit is at least P_min
days," never "the period is P_min days."

The star's mean density comes from its catalog radius through a main-sequence
mass-radius relation (M ~ R^1.25, so rho_star / rho_sun = R^-1.75, R in solar
radii). This is the same kind of catalog-geometry assumption the sub-11-5 triage
already leans on: a wrong radius, or a star that is not on the main sequence (a
subgiant is far less dense), moves the bound. That caveat travels with the number.

### Lights

- **L1 — the physics.** Pure `stellar_density_solar(radius_rsun)` and
  `min_orbital_period_days(duration_days, depth, stellar_radius_rsun)` in the
  monotransit service. Round-trip exact against the central-transit duration
  relation; monotonic in duration, density, and depth; guarded on non-physical
  input. No I/O.
- **L2 — join to the hunt.** The pool triage index carries the stellar radius, and
  `hunt_monotransit` stamps every survivor with `min_period_days` from its own
  duration and depth and the star's radius. New model field on the survivor; nulls
  when no radius is on file, the same honesty as an unfetched star.
- **L3 — the frontend surface (copy).** A pure, tested `survivorPeriodNote` that
  reads the minimum period as a lower bound and names the long-period framing, or
  omits the line when no radius was known.
- **L4 — the survivor card.** The card shows "P >= X days -- long-period candidate"
  beside the size verdict, so the one number that says *why this is the machine's
  blind spot* is on screen.

### Check

`docs/checks/phase-11/sub-11-8.md`: the derivation and its b = 0 lower-bound
meaning, a worked round-trip validating the inversion, the main-sequence density
caveat carried forward, and the honest boundary (a lower bound, not a period; a
radius-dependent estimate, not a measurement). `pytest` + `vitest` green.

### Success criteria

- [ ] `min_orbital_period_days` inverts the central-transit duration relation
      exactly (round-trip), is monotonic in duration/density/depth, and guards
      non-physical input
- [ ] every survivor carries `min_period_days` (or null when no radius is known),
      derived from its own transit and its star
- [ ] the survivor card states the period as a lower bound and names the
      long-period framing, never as a measured period
- [ ] the density estimate's main-sequence assumption is stated where the number
      is reported
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **A lower bound, stated as one.** b = 0 gives the shortest period the observed
  duration allows; the true period can only be longer. The surface says "at least,"
  never "is."
- **Density from the catalog radius, caveat attached.** Reuse the triage's
  main-sequence footing rather than invent a mass source; a wrong radius or an
  evolved star moves the bound, and that is said plainly.
- **The bound points where the hunt lives.** The number exists to make the
  long-period prize legible — the reason a single transit is worth more than the
  machine's repeated ones.
