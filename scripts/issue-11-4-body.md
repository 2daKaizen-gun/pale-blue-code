## 11-4: How deep, and at what cost — the completeness map of the hunt

sub-11-3 measured the hunt's **false-alarm rate**: invert every cached curve so no real
dip remains, run the full chain, and count survivors — zero across five stars, even with
one inverted noise event reaching sig 23.57 (the `edge` discriminator caught it). That is
**specificity**: how often the hunt cries wolf. It is only half the scoreboard.

An empty hunt result is meaningless without its other half — **completeness**: what could
the hunt have seen? A hunt that finds nothing because it is blind is worthless; a hunt that
finds nothing *after* proving it would have caught a 0.5%-deep single transit is a real null
result. This sub-phase measures that, and measures the price of the very discriminators that
buy specificity: the `edge` rule that kills the loudest false alarm also kills a real transit
that happens to cross near a data gap. We quantify both — the depth floor and the cost.

### Plan

Inject trapezoidal single transits of known depth and position into **real** cached frontier
curves (not synthetic — completeness must reflect the actual noise the hunt fights), run the
**full hunt chain** (search + significance + discriminators), and record what is promoted.
Then give every hunt result a cheap per-star sensitivity floor computed from the curve's own
red-noise scatter, validated against the injection map, so that "nothing survived" always
arrives with "and here is what we could have seen."

### Lights

- [ ] Light 1 — injection + full-hunt recovery primitive: `inject_transit(time, flux, t0,
      depth, duration)` presses a trapezoid dip into a real curve, and a recovery helper runs
      the full chain and reports whether the injected event is promoted — and if not, which
      stage dropped it (search / significance / which discriminator). Pure, tested.
- [ ] Light 2 — the completeness map: sweep depth x position (mid-baseline vs near a segment
      edge) across the real cached curves. Record the depth floor of the *full hunt* — stricter
      than sub-11-2's significance-only floor, because a discriminator can reject a real event —
      and the completeness cost near edges. A measurement script; numbers recorded in the Check.
- [ ] Light 3 — per-star sensitivity floor: from each curve's red-noise scatter, compute the
      shallowest single transit that would clear `_SIG_MIN_MONO` — a cheap analytic depth floor,
      no injection at request time. Attach it to each hunt result. Light 2 validates the analytic
      floor against empirical recovery.
- [ ] Light 4 — the surface states its sensitivity: the hunt panel and its honest empty-state
      show "on these curves we could have seen single transits deeper than ~X% — none appeared,"
      so a null result carries its own completeness. Frontend; **not** added to `phases.ts`.
- [ ] Light 5 — Check doc `docs/checks/phase-11/sub-11-4.md`: the completeness map, the depth
      floor, the discriminator cost, and the per-star sensitivity. (Deferred one session, as
      sub-11-2's and sub-11-3's Checks were.)

### Success criteria

- [ ] an injected single transit is recovered through the **full hunt** (search + significance
      + discriminators), not just the significance stage
- [ ] the depth floor of the full hunt is measured on real data and recorded
- [ ] the completeness cost of the discriminators near segment edges is quantified
- [ ] each hunt result carries a per-star sensitivity floor — the shallowest transit it could
      have caught
- [ ] the honest empty-state states its sensitivity, not just "nothing found"
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

### Key decisions

- **Inject into real curves, not synthetic.** Completeness must reflect the actual red noise,
  gaps, and segment joins the hunt fights — a synthetic curve would flatter the tool.
- **Analytic floor is cheap; injection validates it.** The per-star floor is a closed-form
  read off the curve's noise, computed at request time; the injection map (Light 2) proves the
  analytic floor matches what the full chain actually recovers. No live injection per request.
- **Completeness is the twin of the false-alarm scoreboard.** Together they turn "nothing
  found" from an absence into a measurement — the difference between a null result and a shrug.

### References

- `docs/vision/finding-our-own-planet.md` — path B, the gap the machines miss
- `docs/checks/phase-11/sub-11-3.md` — the false-alarm scoreboard (specificity)
- `docs/checks/phase-11/sub-11-2.md` — the significance-only recovery table (one star, mid-baseline)
- `backend/services/monotransit.py` — `run_monotransit`, `search`, `significance_red`, `discriminators`
