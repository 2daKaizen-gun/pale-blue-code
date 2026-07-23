# Check: live-site revival + deploy hardening

**Date:** 2026-07-23
**Branch:** main
**Verdict:** PASS (code hardening green; the live flip needs one manual Vercel step — see Handoff)

---

## Scope

The deployed frontend was calling `http://localhost:8000` in production because
`VITE_API_BASE_URL` was never set on Vercel — so every backend feature (planets,
light curves, BLS, vetting, the hunt) has been dead on the hosted site, **silently**,
for the project's whole life. Vite inlines that var at build time, so a local `.env`
never reaches the deploy; the fix is a Vercel env var + redeploy.

The one-line env fix is the user's to make (the Railway URL lives only in their
dashboards). This work makes the failure **impossible to ship silently again**, and
gives the deploy a runbook. Novelty moved from "hope it's configured" to "the build
tells you, loudly, when it isn't."

Six Lights (one commit each):

- **L1 — fail-loud guard** (`ab977f8`): pure `resolveApiConfig()` flags a *production*
  build that falls back to (or explicitly points at) localhost; `base.ts` `console.error`s
  on it and exports `API_MISCONFIGURED` / `API_MISCONFIG_REASON`. Asymmetric on purpose
  — localhost is correct in dev, fatal in prod.
- **L2 — health probe** (`80dde7e`): `checkHealth()` hits `/api/health`, never throws;
  pure `classifyHealth()` separates *reachable-but-broken* from *unreachable* (the
  network/CORS failure that hid the breakage).
- **L3 — status banner** (`55ecd35`): `BackendStatusBanner` in `AppLayout` surfaces a
  misconfigured/unreachable backend instead of silent empty pages; decision + priority
  (misconfig root-cause > unreachable symptom) is the pure, tested `backendStatus.ts`.
- **L4 — deploy docs** (`0a7fc79`): `frontend/.env.example` (warns at the line that
  `VITE_API_BASE_URL` must be set in prod) + `docs/deploy.md` runbook with a
  symptom→cause table keyed to the banner messages.
- **L5 — vision doc** (`0f4555d`): `docs/vision/finding-our-own-planet.md`, yesterday's
  north-star, now committed.
- **L6 — this Check.**

---

## Tests

```
frontend: npm run build green · vitest 164 passed (was 145; +19)
          apiConfig 7 · health 6 · backendStatus 6
backend:  pytest 62 passed (unchanged — no backend change)
```

The new tests pin the invariants: a prod build never silently accepts a localhost
backend; `checkHealth` never throws on a dead/CORS-blocked origin; the banner stays
quiet when healthy/loading and names the root cause when several things are wrong.

---

## What this does NOT do (honest)

- It does **not** by itself make the live site work. The site goes green only when
  `VITE_API_BASE_URL` is set on Vercel to the live Railway URL and the project is
  redeployed. Until then the new banner will (correctly) show the misconfiguration
  on the hosted build.
- It assumes the Railway backend is up and CORS-allows the Vercel origin. If Railway
  is asleep/down, the banner will read "연결할 수 없어요" even with the var set — that's
  the probe telling the truth, not a regression.

## Handoff (manual, user-owned)

1. Get the Railway backend URL (Railway dashboard) and confirm
   `curl https://<backend>/api/health` → `{"status":"ok"}`.
2. Vercel → Settings → Environment Variables → `VITE_API_BASE_URL` = that URL
   (Production scope, no trailing slash).
3. Redeploy. Verify Network calls hit Railway and no red banner shows.

Runbook: `docs/deploy.md`.

---

## Result

The deploy can no longer break silently: a misconfigured or unreachable backend is
loud (console + on-page banner), `.env.example` and `docs/deploy.md` document the one
variable that matters, and the vision doc is in the tree. The live flip itself waits
on the single Vercel env step, now fully specified.
