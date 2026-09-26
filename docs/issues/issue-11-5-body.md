## 11-5: What a detection would mean — the pool's minimum detectable planet radius

sub-11-3 and sub-11-4 built the tool's two scoreboards: how often the hunt cries wolf
(false-alarm rate, zero across five nulls) and how deep it can see (completeness floor, ~0.40%).
Both are about the *instrument*. sub-11-5 turns to the *sky* it points at, and asks the question
that has to come before any fetch: on these stars, would a dip we could detect even be a planet?

The frontier pool is 50 of the freshest bright SPOC stars absent from the TOI catalog. A transit
depth maps to a companion radius by `R_p = sqrt(depth) * R_star`, so the detection floor becomes
a **minimum detectable planet radius** per star. And the pool's stars are bright because many are
**giants** — median stellar radius ~10.8 R_sun, up to 111 R_sun. On a 7.8 R_sun star our 0.40%
floor implies a ~2.5 R_jup companion; on an 11 R_sun star, ~3.5 R_jup; on the giants, a
star-sized object. Only a handful of pool stars are small enough (R < ~1.6 R_sun) that a
detectable dip could be a genuine planet. This sub-phase says so honestly, and turns the flat
50-star pool into a ranked target list where the few real candidates are separated from the many
where a "detection" would be a mirage.

### Plan

Pure geometry over the pool's enriched metadata (stellar radius), offline — no fetch, no network.
Use the measured completeness floor (~0.40%) as a stated fiducial detectable depth. The verdict is
**radius-dominated**: stellar radius spans ~100x across the pool while noise spans ~10x, so which
stars can host a detectable planet is set by radius, and a fragile per-star noise-from-magnitude
model is deliberately avoided (the three already-fetched pool giants measure 158-1245 ppm, far
above the photon limit — giants are noisier *and* bigger, so the fiducial-floor verdict is
conservative for them). Radius bounds a companion's *size*, not its mass, so this is a necessary
size gate, not a claim of planethood — a real candidate would still need a mass.

### Lights

- [ ] Light 1 — the physics: `planet_radius_from_depth(depth, stellar_radius)` and
      `min_detectable_planet_radius(stellar_radius, depth_floor)`, returning a radius in R_jup and
      R_earth. Pure, tested against hand-computed cases (a 1% dip on a Sun-like star is ~1 R_jup).
- [ ] Light 2 — the pool assessment: rank all 50 pool stars by minimum detectable planet radius,
      classify each `plausible` (R_p_min below the ~2 R_jup planet/brown-dwarf size boundary) or
      `too_big` (a detection would be a star, not a planet), and handle a missing radius honestly
      (`unknown`, not a guess). Pure, tested.
- [ ] Light 3 — reachability: `GET /api/monotransit/pool` returns the ranked assessment plus a
      summary (how many of the 50 could host a detectable planet); a `PoolAssessment` model.
- [ ] Light 4 — the surface: the frontier pool shown as an honest ranked target list — the few
      stars where a detection could be a planet first, the many giants named as what they are.
      **Not** added to `phases.ts`.
- [ ] Light 5 — Check doc `docs/checks/phase-11/sub-11-5.md`: the detectable-radius floor, the
      honest count, and what it means for where the hunt should point. (Deferred one session.)

### Success criteria

- [ ] a minimum detectable planet radius is computed per pool star from its stellar radius and
      the measured detection floor
- [ ] every pool star is classified plausible / too_big / unknown, and the pool is ranked
- [ ] the honest count is surfaced — how few of the 50 could host a detectable planet
- [ ] `GET /api/monotransit/pool` returns the ranked assessment and summary
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **Radius-first, not a magnitude-noise model.** R_star spans ~100x, noise ~10x; radius sets the
  verdict. The three fetched pool giants measure 158 / 268 / 1245 ppm per point — far above the
  photon limit — so using one fiducial floor understates giants' true noise, making the "too_big"
  verdict conservative, not optimistic.
- **Fiducial detectable depth = 0.40%**, the sub-11-4 completeness floor, stated once and applied
  uniformly rather than fabricated per star. The Check records the measured per-star anchors.
- **Size, not mass.** A transit depth fixes a companion's radius; the ~2 R_jup boundary separates
  planet-sized from star-sized, but a real planet claim still needs a mass. This is triage, not a
  detection.

### References

- `docs/vision/finding-our-own-planet.md` — path B, and the honesty of naming what we can't find
- `docs/checks/phase-11/sub-11-4.md` — the completeness floor this sub-phase reads as fiducial
- `backend/services/hunt.py` — `frontier_tess_stars()`, the enriched pool (tic, tmag, radius, ...)
