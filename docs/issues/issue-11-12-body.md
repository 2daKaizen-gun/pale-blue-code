## The obstacle

The redesigned hunt page is meant to be legible to anyone who opens it. But it is
not *openable*: `GET /api/monotransit/hunt` re-runs the full single-transit
pipeline — light-curve load, detrend, sliding search, red-noise significance, and
four discriminators — on **every cached star, on every request**. Nothing is
stored. On the frontier pool that is a multi-minute spinner. "Approachable for
everyone" and "wait several minutes with no feedback" cannot both be true.

## The fix

Memoize `run_monotransit` on disk, keyed to the light-curve file's mtime.

The single-transit search is deterministic given the curve: same curve in, same
events out. So a stored result stays valid until the underlying `bls_lc_*.json`
changes (a re-fetch) or the detection pipeline itself changes. That turns the hunt
from a re-search of the whole pool into an instant read of what we already computed.

- `run_monotransit_cached(name)` wraps `run_monotransit`, reading/writing a
  per-star `mono_*.json` in the existing cache dir.
- Validity key: the source curve's `mtime_ns` **and** a `_MONO_CACHE_VERSION` tag.
- **The version tag is load-bearing.** A stale derived cache that still parses is
  the exact trap we hit with the vet cache — old numbers pass the schema and lie.
  Any change to the detection pipeline (thresholds, detrend, discriminators) MUST
  bump the version so every stored result is recomputed, not silently trusted.
- Writes are atomic (temp file + replace) so a killed process never leaves a
  half-written result that parses.

## Definition of done

- [ ] `run_monotransit_cached` memoizes per star, keyed on lc mtime + version
- [ ] The hunt reads cached results; a warm pool returns in well under a second
- [ ] A changed light curve OR a bumped version invalidates and recomputes
- [ ] Atomic writes; a corrupt/partial cache falls back to recompute, never crashes
- [ ] Cached and uncached runs return byte-identical dispositions (no drift)
- [ ] Tests cover: hit, miss, mtime invalidation, version invalidation, corrupt file
- [ ] Check doc under docs/checks/phase-11/
