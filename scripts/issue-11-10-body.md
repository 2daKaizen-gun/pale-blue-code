# 11-10: When it could come round again — the earliest a second transit could appear

sub-11-8 gave a survivor a **minimum orbital period** (a lower bound: "at least P_min days"),
and sub-11-9 spent it for a **maximum temperature** (an upper bound). Both describe the *orbit*.
This sub-phase spends the same P_min for the one thing a monotransit follow-up campaign actually
needs: **a date**. A single transit was seen at epoch `t0`. If the true period is `P >= P_min`,
the next transit falls at `t0 + P`, so the earliest one *could* appear is `t0 + P_min`. Before
that date, a second transit cannot occur. That turns the abstract period floor into an actionable
window edge — the bridge to real follow-up the north-star (`docs/vision/finding-our-own-planet.md`
§5–§6) names as the last step that makes a discovery real.

## The physics (a one-sided bound, like the others)

```
earliest_recurrence_BTJD = t0 + P_min        (P >= P_min, so the next transit is no earlier)
earliest_recurrence_JD   = earliest_recurrence_BTJD + 2457000.0     (TESS BTJD -> JD)
earliest_recurrence_date = gregorian(earliest_recurrence_JD)        (Fliegel / Meeus JD -> calendar)
```

`t0` is in the light curve's own time frame, which for TESS SPOC products is **BTJD**
(BJD_TDB − 2457000). The Julian-Date-to-Gregorian conversion is the standard Meeus algorithm,
pure and exact for a civil date.

Because the true period can only be **longer** than `P_min`, the true recurrence can only be
**later** than this date. So the honest sentence is "the transit cannot come round again before
`DATE` — the earliest edge of the follow-up window," never "the next transit is on `DATE`."
Every assumption (the period floor, catching this particular transit) points the same way as
sub-11-8's bound: you will wait *at least* this long.

## Lights

- **L1 — the physics.** `jd_to_calendar_date(jd)` (Meeus JD → `YYYY-MM-DD`, pure) and
  `earliest_recurrence_date(t0_btjd, min_period_days)` returning the ISO date of `t0 + P_min`, or
  `None` when there is no period bound. No I/O. Anchored on known dates (J2000, the Unix epoch,
  the BTJD epoch).
- **L2 — join to the hunt.** `hunt_monotransit` stamps every survivor with `earliest_recurrence`
  from its own `t0` and `min_period_days`; a survivor with no period bound (no radius) carries
  `None`. New survivor model field and frontend type.
- **L3 — the surface, copy.** A pure, tested `survivorRecurrenceNote` that reads the date as the
  earliest edge of the follow-up window — "cannot recur before," never "the next transit is on" —
  and says plainly the real recurrence is likely later. `null` when there is no date.
- **L4 — the survivor card.** The card shows the earliest-recurrence date beside the minimum
  period and maximum temperature, so the world's portrait — how long, how warm, and when to look
  again — reads in one place.

## Check

`docs/checks/phase-11/sub-11-10.md`: the derivation and the "cannot recur before" meaning; the
calendar conversion anchored on J2000 / the Unix epoch / the BTJD epoch; a worked example turning
a real survivor's `t0` and `P_min` into a date; the honesty (a one-sided bound, the BTJD-frame
assumption stated where the date is reported, and that this is not evidence of a planet, only of
when a *hypothetical* second transit could first appear); and the test counts.

## Success criteria

- [ ] `jd_to_calendar_date` returns the correct civil date on known Julian-Date anchors (J2000, the
      Unix epoch, the BTJD epoch)
- [ ] `earliest_recurrence_date` returns the calendar date of `t0 + P_min`, is monotonic (a longer
      period bound yields a later or equal date), and returns `None` when no period bound exists
- [ ] every survivor carries `earliest_recurrence` (or null when its minimum period is unknown),
      derived from its own transit epoch and period bound
- [ ] the survivor card states the date as the earliest edge of the follow-up window — "cannot
      recur before," never "the next transit is on"
- [ ] the BTJD time-frame assumption is stated where the date is reported
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

## Key decisions

- **A date, not a claim.** `t0 + P_min` is the *earliest* a second transit could appear; the true
  period is longer, so the real recurrence is later. The copy and the card say "cannot recur
  before" and "the earliest edge," never a predicted transit time.
- **BTJD is the frame.** `t0` comes from the TESS SPOC light curve, whose TIME column is BTJD. The
  offset `2457000.0` is named as a constant and the assumption is stated in the check.
- **No period, no date.** A survivor whose minimum period is `None` (no stellar radius) carries
  `earliest_recurrence = None`, and the card omits the line — the same null discipline as the
  period and temperature bounds it descends from.
