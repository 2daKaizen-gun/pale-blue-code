# 11-11: The follow-up brief — a survivor's numbers in an observer's frame

sub-11-8, -9, and -10 gave a survivor its portrait: how long its orbit is *at least* (minimum
period), how warm it could run *at most* (maximum temperature), and the earliest a second transit
could appear (recurrence date). That portrait is the north-star's *flag*
(`docs/vision/finding-our-own-planet.md` §6). But a flag only becomes a real follow-up when a
telescope operator — or an ExoFOP submission — can read it, and they do not speak our internal
dialect: the epoch is in **BTJD** (a TESS-internal frame) and the depth is a bare fraction. This
sub-phase translates the survivor's numbers into the frame an outside observer actually works in,
so the flag can be *handed off* — the last bridge in §5.5–§6.

Two translations do the real work; both are deterministic, no network, no new assumptions:

```
epoch_bjd_tdb = t0_btjd + 2457000.0          (BTJD -> BJD_TDB, the standard published epoch frame)
depth_mmag    = -2.5 * log10(1 - depth) * 1e3 (fractional depth -> millimagnitudes, what a
                                               follow-up photometrist measures; non-linear)
```

BTJD (`BJD_TDB - 2457000`) is TESS's internal offset; every published ephemeris and ExoFOP entry
is in **BJD_TDB**, so an epoch handed to a follow-up observer must add the offset back. And a
photometrist reads depth in **millimagnitudes**, not a fraction — a 1% transit is 10.9 mmag, and
the conversion is logarithmic (`Δmag = -2.5 log10(flux ratio)`), so it is a genuine physical
translation, not a rescale. Together with the duration (already in hours) and the earliest
recurrence (sub-11-10), these are exactly the fields an observer needs to point a telescope.

## The honesty stays

The brief translates; it does not upgrade the claim. The survivor is still a **light-curve
single-transit candidate, not a planet**; the period and temperature are still one-sided bounds;
the recurrence date is still the *earliest* edge of the window, not a predicted transit time. The
brief carries those caveats with the numbers, so a hand-off can never read as "here is a confirmed
world" — only "here is a candidate event, in your frame, and here is the earliest you could catch
it again."

## Lights

- **L1 — the physics.** `epoch_bjd_tdb(t0_btjd)` (BTJD -> BJD_TDB, pure) and
  `depth_to_millimag(depth)` (fractional depth -> mmag via `-2.5 log10(1 - depth) * 1000`,
  monotonic in depth, `None` for a non-physical depth `<= 0` or `>= 1`). No I/O.
- **L2 — join to the hunt.** `hunt_monotransit` stamps every survivor with `epoch_bjd_tdb` and
  `depth_mmag`, derived from its own `t0` and `depth`. New survivor model fields and frontend type.
- **L3 — the surface, copy.** A pure, tested `survivorFollowUpBrief(...)` that assembles the
  observer-frame line — epoch in BJD_TDB, depth in millimagnitudes, duration in hours, and the
  earliest recurrence — framed as a hand-off to a follow-up campaign, with the candidate/bounds
  caveats intact. `null` when the numbers to build a brief are missing.
- **L4 — the survivor card.** A "follow-up brief" block on the card gathers the observer-frame
  numbers in one place — the copy-ready ephemeris a human takes to Planet Hunters / ExoFOP.

## Check

`docs/checks/phase-11/sub-11-11.md`: the two conversions and why each is the observer's frame
(BJD_TDB anchored against the BTJD offset; millimagnitudes anchored on a 1% -> 10.9 mmag worked
value and its logarithmic form); a worked brief for a real survivor; the honesty (a translation,
never an upgrade of the claim — still a candidate, still one-sided bounds, still an earliest edge);
and the test counts.

## Success criteria

- [ ] `epoch_bjd_tdb` returns `t0 + 2457000.0` (BTJD -> BJD_TDB), exact against the named offset
- [ ] `depth_to_millimag` returns `-2.5 log10(1 - depth) * 1000`, is monotonic in depth (a 1% depth
      is ~10.9 mmag), and returns `None` for a non-physical depth (`<= 0` or `>= 1`)
- [ ] every survivor carries `epoch_bjd_tdb` and `depth_mmag`, derived from its own `t0` and `depth`
- [ ] the follow-up brief reads the epoch in BJD_TDB and the depth in millimagnitudes, and carries
      the candidate/one-sided-bound caveats — never framing the hand-off as a confirmed planet
- [ ] the BTJD -> BJD_TDB frame change and the millimagnitude unit are both named where the numbers
      are reported
- [ ] `pytest` green; `npm run build` + `vitest` green for the frontend touch

## Key decisions

- **A translation, not an upgrade.** The brief moves the same numbers into an observer's frame; it
  does not raise the claim. The candidate framing and the one-sided bounds travel with the brief.
- **BJD_TDB is the hand-off frame.** BTJD is TESS-internal; every ExoFOP/ephemeris epoch is
  BJD_TDB, so the brief adds the `2457000.0` offset back and names the frame beside the number.
- **Millimagnitudes are the photometrist's unit.** Depth is reported as `-2.5 log10(1 - depth)`
  in mmag — the logarithmic magnitude system a follow-up observer measures in — not a bare fraction.
