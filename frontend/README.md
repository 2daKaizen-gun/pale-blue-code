# Pale Blue Code — frontend

React 19 + TypeScript + Vite. The learning pages (solar system, N-body gravity,
black hole, exoplanets, data, signal) and the hunt surfaces (repeated-transit
hunt, frontier hub, single-transit hunt) all live here. Project overview and the
hunt's record: the root [`README.md`](../README.md).

## Run

```bash
npm ci
npm run dev          # http://localhost:5173
```

Backend features (planets, light curves, BLS, vetting, the hunt) need the
FastAPI server on `localhost:8000` — `python -m uvicorn main:app --port 8000`
from `../backend`. With `VITE_API_BASE_URL` unset, the app targets it
automatically. Copy `.env.example` to `.env` for the NASA APOD key.

## Check

```bash
npm run lint         # eslint (a CI gate)
npx vitest run       # unit tests — the honest-copy and pure-logic boundaries
npm run build        # tsc -b + vite build (CI builds on Windows on purpose)
```

## Layout

| Path | What |
|---|---|
| `src/pages/` | one page per route (`router.tsx`) |
| `src/components/<area>/` | per-area components; `*Copy.ts` files hold the pure, tested wording |
| `src/components/layout/` | app shell, two-tier nav (배우기 · 사냥하기), backend status banner |
| `src/lib/api/` | backend clients; `apiConfig.ts` fails loud if production points at localhost |
| `src/lib/physics/` | N-body integrators (RK4, energy) |
| `src/shaders/` | GLSL for the black-hole lensing |
| `src/store/` | Zustand stores |

Deploying: set `VITE_API_BASE_URL` to the bare backend origin (no `/api`, no
trailing `/`) — see [`docs/deploy.md`](../docs/deploy.md).
