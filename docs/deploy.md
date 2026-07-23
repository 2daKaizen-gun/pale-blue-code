# Deploy — Pale Blue Code

The app is two pieces that must find each other:

- **Frontend** — static Vite/React build on **Vercel** (`pale-blue-code.vercel.app`).
- **Backend** — FastAPI (astroquery / astropy) on **Railway**.

The frontend has no server of its own; every data feature (planets, light curves,
BLS, vetting, the hunt) is a call to the backend. So the single thing that makes a
deploy live-or-dead is whether the frontend build knows the backend's URL.

---

## The one variable that matters: `VITE_API_BASE_URL`

Vite inlines `VITE_*` vars at **build time**. `frontend/src/lib/api/base.ts` reads
`VITE_API_BASE_URL` and falls back to `http://localhost:8000` when it is unset.

- **Local dev** — leave it unset. The fallback points at your local `uvicorn`.
- **Production** — it **must** be set to the public backend origin. If it is unset
  (or points at localhost), the deployed bundle fetches `localhost:8000` on the
  visitor's own machine, so nothing loads.

> This exact mistake — the var never set on Vercel — kept the hosted site's backend
> features dead, silently, for a long time. The build now `console.error`s and shows
> an on-page banner when a production build resolves a localhost backend
> (`resolveApiConfig` in `apiConfig.ts`), so the failure is loud, not invisible.

### Set it on Vercel

1. Vercel → the project → **Settings → Environment Variables**.
2. Add `VITE_API_BASE_URL` = the Railway backend URL
   (e.g. `https://<name>.up.railway.app`, **no trailing slash**), scope **Production**
   (and Preview if you use preview deploys).
3. **Redeploy** — env changes only take effect on a new build. Deployments → ⋯ →
   Redeploy, or push a commit.
4. Verify: open the site, DevTools → Network — requests go to the Railway origin and
   return 200; no red backend banner.

---

## Backend (Railway) checklist

The backend must be up, reachable, and CORS-allow the frontend origin.

- **Alive** — `curl https://<backend>/api/health` returns `{"status":"ok"}`.
- **CORS** — `backend/main.py` allow_origins must include the frontend origin
  (`https://pale-blue-code.vercel.app`). Add any new domain there or the browser
  blocks the calls even when the URL is correct.
- **Start command** — `uvicorn main:app --host 0.0.0.0 --port $PORT` (Railway sets
  `$PORT`).

---

## Quick sanity map

| Symptom | Likely cause |
|---|---|
| Site loads, every data page empty, red "설정 오류" banner | `VITE_API_BASE_URL` unset/localhost in the prod build → set it, redeploy |
| Red "연결할 수 없어요" banner | backend down, wrong URL, or CORS blocking → check `/api/health` + allow_origins |
| Amber "오류를 응답" banner | backend reachable but 5xx → check Railway logs |
| Works locally, broken only when deployed | almost always the env var — it is build-time, so a local `.env` never reaches Vercel |
