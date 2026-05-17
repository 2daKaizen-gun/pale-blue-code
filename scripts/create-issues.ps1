# pale-blue-code - Retroactive issue creation (v2, encoding-safe)
# ============================================================
# Fixes v1 encoding issue: file is saved with UTF-8 BOM so PowerShell 5.1
# on Korean Windows reads it correctly instead of as CP949.
#
# Strategy:
#   - File has UTF-8 BOM (signals PowerShell to read as UTF-8)
#   - Console encoding forced to UTF-8 at runtime
#   - Milestone titles looked up from the API (exact match, no guessing)
#   - Body content written to temp files and passed via --body-file
#     (avoids native command argument escaping headaches)
#
# Prerequisites:
#   - gh CLI installed and authenticated
#   - Run from the pale-blue-code repo root
#   - Milestones for Phase 1 and Phase 2 already created
#   - Labels phase-1, phase-2, sub-phase already created

# --- Force UTF-8 for native command interop --------------------------------

$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# --- Verify environment ----------------------------------------------------

Write-Host "Verifying environment..." -ForegroundColor Cyan
$repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
if ($LASTEXITCODE -ne 0 -or -not $repo) {
    Write-Host "Error: not in a git repo, or gh not authenticated." -ForegroundColor Red
    exit 1
}
Write-Host "  Repo: $repo" -ForegroundColor Green

# --- Look up milestone titles from API (robust against any encoding issue) -

Write-Host "Looking up milestones..." -ForegroundColor Cyan
$milestonesJson = gh api "repos/:owner/:repo/milestones?state=all" | ConvertFrom-Json

$phase1 = $milestonesJson | Where-Object { $_.title -like "Phase 1*" } | Select-Object -First 1
$phase2 = $milestonesJson | Where-Object { $_.title -like "Phase 2*" } | Select-Object -First 1

if (-not $phase1) {
    Write-Host "Error: Phase 1 milestone not found." -ForegroundColor Red
    exit 1
}
if (-not $phase2) {
    Write-Host "Error: Phase 2 milestone not found." -ForegroundColor Red
    exit 1
}

Write-Host "  Phase 1 milestone: $($phase1.title)" -ForegroundColor Green
Write-Host "  Phase 2 milestone: $($phase2.title)" -ForegroundColor Green

# --- Issue definitions -----------------------------------------------------
# Each issue uses a phase number (1 or 2) which is resolved to the milestone
# title fetched from the API above. This avoids any chance of title mismatch.

$issues = @(

    # ========== PHASE 1 ==========

    @{
        title = "1-1: Vite + React + TS setup, basic routing"
        phase = 1
        labels = "phase-1,sub-phase"
        body = @'
## Plan
Bootstrap the frontend project with Vite + React 19 + TypeScript 6.
Establish React Router v7 nested routing for 8 phase routes from day one.

## Lights
- [x] Light 1 - `npm create vite@latest` with React + TS template
- [x] Light 2 - Install Tailwind v3 (v4 had `init` removed)
- [x] Light 3 - Set up React Router v7 with `createBrowserRouter`
- [x] Light 4 - Create AppLayout with side nav + `<Outlet />`
- [x] Light 5 - Create 8 phase route placeholders
- [x] Light 6 - Apply base cosmic theme (dark bg, light text)

## Success criteria
- [x] All 8 phase routes navigable via side nav
- [x] Direct URL entry (e.g. `/hunt`) works
- [x] Dark cosmic theme applied globally
- [x] No console errors

## Key decisions
- React Router v7 with `createBrowserRouter` for nested routing
- Tailwind v3 (v4 ecosystem still immature)
- Side nav + `<Outlet />` pattern for shell layout

## Troubleshooting
- `npx tailwindcss init -p` failed because Tailwind v4 was installed (v4 removed `init`)
- Resolution: pin to `tailwindcss@3` explicitly

Reference: `docs/phase-handoffs/phase-1-to-2.md`
'@
    },

    @{
        title = "1-2: Design tokens - CSS variables + Tailwind"
        phase = 1
        labels = "phase-1,sub-phase"
        body = @'
## Plan
Establish a design token system where CSS custom properties are the single
source of truth, and Tailwind config references them. This dual-layer
approach lets shaders (in Phase 2+) read tokens via `getComputedStyle`.

## Lights
- [x] Light 1 - Create `styles/tokens.css` with color/spacing/typography vars
- [x] Light 2 - Wire `tailwind.config.js` to reference CSS variables
- [x] Light 3 - Apply Inter (body) + Space Mono (code/numerics) via Google Fonts
- [x] Light 4 - Define cosmos palette (`cosmos-bg`, `cosmos-nebula`, etc.)
- [x] Light 5 - Verify token application across existing components

## Success criteria
- [x] All colors/spacing reference tokens, no raw hex
- [x] Token change in `tokens.css` propagates everywhere
- [x] Fonts loaded and applied

## Key decisions
- CSS variables as single source - readable by both Tailwind and future shaders
- Token names reflect intent (`cosmos-nebula`) not appearance (`purple-500`)

Reference: `docs/phase-handoffs/phase-1-to-2.md`
'@
    },

    @{
        title = "1-3: NASA APOD widget"
        phase = 1
        labels = "phase-1,sub-phase,enhancement"
        body = @'
## Plan
Fetch NASAs Astronomy Picture of the Day and display it on the landing
page, with proper loading and error states. First async data integration
pattern for the project.

## Lights
- [x] Light 1 - Register NASA API key, set up `.env` with `VITE_NASA_API_KEY`
- [x] Light 2 - Write `lib/api/apod.ts` with `fetchApod()` + `Apod` type
- [x] Light 3 - Build `ApodCard` component (image, title, explanation)
- [x] Light 4 - Build `ApodWidget` with loading/error states
- [x] Light 5 - Create reusable `Spinner` component
- [x] Light 6 - Integrate widget into landing page

## Success criteria
- [x] APOD image loads on landing page
- [x] Spinner shows during fetch
- [x] Error state when API fails or key missing
- [x] Daily refresh works

## Key decisions
- Plain `fetch` for Phase 1 - TanStack Query deferred to Phase 5 (backend)
- `VITE_` prefix required for Vite client-side env exposure

## Open items (deferred)
- APOD video response handling not yet implemented (some days return video)

Reference: `docs/phase-handoffs/phase-1-to-2.md`
'@
    },

    @{
        title = "1-4: Landing page + phase navigation"
        phase = 1
        labels = "phase-1,sub-phase,enhancement"
        body = @'
## Plan
Build the landing page that introduces the project and shows a roadmap of
all 9 phases. Establish a single-source-of-truth pattern for phase metadata
consumed by nav, roadmap cards, and placeholder pages alike.

## Lights
- [x] Light 1 - Define `constants/phases.ts` (id, title, status, description x 9)
- [x] Light 2 - Build `PhaseCard` for roadmap display
- [x] Light 3 - Build `PhasePlaceholder` for unbuilt phase pages
- [x] Light 4 - Compose landing page (hero + APOD + roadmap grid)
- [x] Light 5 - Wire side nav to phases data

## Success criteria
- [x] Landing page shows hero, APOD, and 9 roadmap cards
- [x] Changing `phases.ts` updates nav + cards + placeholders simultaneously
- [x] All phase routes render placeholder UI

## Key decisions
- Single source of truth (`phases.ts`) for phase metadata
- 9 cards on roadmap (Phase 0~8) - Phase 0 noted as foundation work

## Refactor candidates (deferred)
- `STATUS_LABEL` / `STATUS_COLOR` duplicated in `PhaseCard` + `PhasePlaceholder` -> extract to `lib/phaseStatus.ts`
- 7 placeholder pages share pattern -> could consolidate to dynamic route `/phase/:slug`

Reference: `docs/phase-handoffs/phase-1-to-2.md`
'@
    },

    @{
        title = "1-5: First Vercel deployment"
        phase = 1
        labels = "phase-1,sub-phase,chore"
        body = @'
## Plan
Deploy the Phase 1 build to Vercel with automatic redeployment on `git push`.
Solve the SPA routing issue so deep links and refreshes work in production.

## Lights
- [x] Light 1 - Verify local build (`npm run build`) passes
- [x] Light 2 - Sign up Vercel, import repo, configure root directory
- [x] Light 3 - Register `VITE_NASA_API_KEY` in Vercel env vars
- [x] Light 4 - Initial deploy + verify live URL
- [x] Light 5 - Diagnose 404 on direct URL entry (SPA fallback issue)
- [x] Light 6 - Add `frontend/vercel.json` rewrite for SPA fallback
- [x] Light 7 - Verify auto-redeploy on push

## Success criteria
- [x] Live URL accessible: https://pale-blue-code.vercel.app
- [x] APOD loads in production (env vars working)
- [x] Direct URL entry works without 404
- [x] `git push` triggers automatic redeployment

## Key decisions
- SPA fallback via `vercel.json` rewrite (all paths -> `index.html`)
- Vite root configured to `frontend/` subdirectory

## Troubleshooting
- 404 on `/solar` direct entry: Vercel served raw path instead of `index.html`
- Resolution: `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

Live: https://pale-blue-code.vercel.app
Reference: `docs/phase-handoffs/phase-1-to-2.md`
'@
    },

    # ========== PHASE 2 ==========

    @{
        title = "2-1: R3F setup + first rotating sphere"
        phase = 2
        labels = "phase-2,sub-phase"
        body = @'
## Plan
Set up React Three Fiber + drei + three with the correct version matrix for
React 19. Establish `data/planets.ts` single-source pattern that scales to
8 planets in sub-2-2. Render the first rotating sphere (Earth) with proper
23.5 degree axial tilt.

PRD: `docs/specs/phase-2/PRD.md`
TechSpec: `docs/specs/phase-2/TECHSPEC.md`

## Lights
- [x] Light 1 - Install R3F v9 + drei v10 + three 0.170 (React 19 matrix)
- [x] Light 2 - Create `data/planets.ts` with Earth metadata
- [x] Light 3 - Add Earth texture (CC-BY) + create `ATTRIBUTION.md`
- [x] Light 4 - Build `Scene` + `Planet` + integrate `OrbitControls`
- [x] Light 5 - Wire `SolarPage` to `/solar` route
- [x] Light 6 - Browser verification (60fps, rotation, tilt)

## Success criteria
- [x] `/solar` renders Earth rotating around its tilted axis
- [x] OrbitControls respond to mouse/touch
- [x] Dependency matrix verified: R3F v9 + drei v10 + three 0.170 + React 19

## Key decisions
- R3F v9 + drei v10 (not v8) - required for React 19 compatibility
- `data/planets.ts` as single source - Scene reads via `.map()` for zero-change scaling
- 23.5 degree axial tilt hard-coded from day one (astronomical truth principle)

## Troubleshooting
- `ERESOLVE`: R3F v8 requires React 18, Vite installed React 19
- Resolution: re-pair to R3F v9 / drei v10 / three 0.170 (no `--legacy-peer-deps` workaround)
- Red herring: `expo@55` appeared in error log - actually `peerOptional`, not installed
- Folder naming `phase2/` vs `phase-2/` corrected via `git mv`

## Refactor candidates (deferred to sub-2-7)
- Bundle size 1.15 MB (gzip 321 KB) - Vite warning at 500 KB threshold
- `App.tsx` leftover from Vite template not in use

Full retrospective: `docs/checks/phase-2/sub-2-1.md`
'@
    },

    @{
        title = "2-2: 8 planets + Sun + static layout"
        phase = 2
        labels = "phase-2,sub-phase,enhancement"
        body = @'
## Plan
Expand `data/planets.ts` from 1 planet to all 8 + Sun. Hand-tune
`visualRadius` and `visualDistance` per planet. Add the Sun component.
Introduce `leva` for live in-browser tuning during development.

PRD: `docs/specs/phase-2/PRD.md`
TechSpec: `docs/specs/phase-2/TECHSPEC.md`

## Lights
- [x] Light 1 - Download 8 planet + Sun textures, update `ATTRIBUTION.md`
- [x] Light 2 - Expand `data/planets.ts` to all 8 with NASA values
- [x] Light 3 - Create `Sun.tsx` component
- [x] Light 4 - Implement `lib/scale.ts` for real -> visual transformation
- [x] Light 5 - Add Saturn + Uranus rings
- [x] Light 6 - Integrate `leva` (dev-only) for live tuning

## Success criteria
- [x] All 8 planets + Sun visible in `/solar`
- [x] Visual proportions readable (no overlapping, no off-screen)
- [x] Saturn ring textured, Uranus ring solid color
- [x] `leva` only in development build

## Key decisions
- Two values per planet: `real_*` (NASA truth) + `visualRadius` / `visualDistance` (display)
- `lib/scale.ts` as single source for compression - no scattered constants
- `leva` for dev tuning, stripped from production
- Visually-adjusted sizes over real ratios - PRD section 3: planets must be visible for the distance/time truth to register

Full retrospective: `docs/checks/phase-2/sub-2-2.md`
'@
    },

    @{
        title = "2-3: Orbital motion + time controls"
        phase = 2
        labels = "phase-2,sub-phase,enhancement"
        body = @'
## Plan
Introduce orbital motion via Keplers third law, time controls
(pause/speed/reset), orbit paths, and starfield. Introduce Zustand for
shared state between Canvas and ControlPanel. First TDD adoption (vitest).

PRD: `docs/specs/phase-2/PRD.md`
TechSpec: `docs/specs/phase-2/TECHSPEC.md`

## Lights
- [x] Light 1 - Create `lib/time.ts` with TDD (angle calc, axial-flip correction)
- [x] Light 2 - Introduce Zustand store (simulationDays, timeSpeed)
- [x] Light 3 - Implement orbital motion in `Planet.tsx` via `useFrame`
- [x] Light 4 - Add `<OrbitPath>` component (circular orbit lines)
- [x] Light 5 - Build ControlPanel UI (pause / 0.1x / 1x / 100x / 10000x / reset)
- [x] Light 6 - Add keyboard shortcuts (Space, 1-4, R)
- [x] Light 7 - Add `<Stars>` (drei) starfield background
- [x] Light 8 - Mobile responsive ControlPanel

## Success criteria
- [x] All 8 planets orbit at correct Keplerian proportions
- [x] Pause / reset / speed controls work
- [x] `simulationDays` as single source - incremental to absolute time paradigm
- [x] 15 unit tests pass for `lib/time.ts`
- [x] 60fps maintained with all features active

## Key decisions
- Absolute time model: store `simulationDays`, derive everything else
- Zustand `getState()` pattern inside `useFrame` - zero re-renders per frame
- User tools (ControlPanel) separated from dev tools (leva)
- Time speeds: removed 100,000x (impractical), added 0.1x (Kepler observation)

## Troubleshooting
- IEEE 754 signed zero: `0 / -243.02 === -0`, Vitest `toBe(0)` fails via `Object.is`
  - Resolution: `toBeCloseTo(0)` for float comparisons
- Axial-flip sign cancellation: Venus (177.4 deg tilt) appeared to rotate same direction as others
  - Resolution: `getEffectiveRotationPeriod` flips sign when tilt is between 90 and 270 degrees, NASA data preserved
- React 19 cascading render on `useEffect(() => setIsTouch(...))`
  - Resolution: `useSyncExternalStore` for matchMedia external source

Full retrospective: `docs/checks/phase-2/sub-2-3.md`
'@
    },

    @{
        title = "2-4: Truth toggles (distance + rotation)"
        phase = 2
        labels = "phase-2,sub-phase,enhancement"
        body = @'
## Plan
Implement the soul of Phase 2 PRD: truth toggles that transform the
educational lie of the visual mode into astronomical truth.
Distance toggle (compressed vs real scale), rotation toggle
(compressed vs real period), full-truth preset (both at once),
all with 1.5s easeInOutCubic interpolation. Unify reset across time + modes.

PRD: `docs/specs/phase-2/PRD.md`
TechSpec: `docs/specs/phase-2/TECHSPEC.md`

## Lights
- [x] Light 1 - Create `lib/easing.ts` (easeInOutCubic + `computeTransitionProgress`)
- [x] Light 2 - Extend store: `scaleMode`, `rotationMode`, `*ChangedAt` timestamps
- [x] Light 3 - Add `getVisualRotationPeriod` + `getInterpolatedRotationPeriod` to `lib/time.ts`
- [x] Light 4 - Implement distance interpolation in `lib/scale.ts` (both exponent AND scale)
- [x] Light 5 - Wire interpolation into `Planet.tsx` and `Sun.tsx`
- [x] Light 6 - Add 3 toggle buttons to ControlPanel (distance / rotation / full truth)
- [x] Light 7 - Wire Ring to subscribe to store directly (avoid per-frame prop changes)
- [x] Light 8 - Integrate reset across time + modes (single `reset` action)
- [x] Light 9 - Mount-time auto-reset (page entry = clean state)

## Success criteria
- [x] Distance toggle: planets readable in visual mode, scatter in real - Mercury never inside Sun
- [x] Rotation toggle: Mercury freezes (17x difference) in real mode, perceivable change
- [x] Full Truth preset: both interpolations sync within 50ms
- [x] 1.5s interpolation with easeInOutCubic
- [x] Reset restores everything to visual + 1x speed
- [x] Page refresh = clean state (no stale mode persistence)

## Key decisions
- Store keeps `mode` + `changedAt` only; `progress` is derived per frame (state minimization)
- Both `distanceExponent` (0.5 vs 1.0) AND `distanceScale` (20 vs 80) interpolate - prevents Mercury collapsing into Sun
- Rotation compression exponent tuned 0.5 to 0.3 (sqrt felt too weak in user testing; 17x Mercury ratio = clear visual freeze)
- Single `reset` action for R button + reset icon + page mount (YAGNI: dont split intents)

## Troubleshooting
- Vitest passes but Vercel build fails: unused variable rejected by `tsc --noUnusedLocals`
  - Resolution: established tsc verification environment for pre-push check
- React 19 `useRef` returns `RefObject<T | null>` (not `RefObject<T>`)
  - Resolution: explicit `| null` in component prop type
- Visual rotation sqrt compression too weak (user feedback: no change felt)
  - Diagnosis via numerical ratio = 7.6x, below perception threshold
  - Resolution: exponent 0.5 to 0.3 yields 17x Mercury ratio
- Initial reset split (`reset` vs `resetAll`) misread user intent
  - Resolution: unified to single `reset` (YAGNI: one user intent = one action)

Full retrospective: `docs/checks/phase-2/sub-2-4.md`
'@
    }
)

# --- Create + close each issue ---------------------------------------------

$tempDir = Join-Path $env:TEMP "pale-blue-code-issues"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$created = 0
$failed = 0
$counter = 0

foreach ($issue in $issues) {
    $counter++
    Write-Host ""
    Write-Host "[$counter/9] $($issue.title)" -ForegroundColor Cyan

    # Resolve milestone title from API lookup
    $milestoneTitle = if ($issue.phase -eq 1) { $phase1.title } else { $phase2.title }

    # Write body to UTF-8 (no BOM) temp file to avoid argument escaping
    $bodyFile = Join-Path $tempDir "issue-$counter.md"
    [System.IO.File]::WriteAllText(
        $bodyFile,
        $issue.body,
        [System.Text.UTF8Encoding]::new($false)
    )

    $url = gh issue create `
        --title $issue.title `
        --body-file $bodyFile `
        --milestone $milestoneTitle `
        --label $issue.labels 2>&1 | Out-String

    $url = $url.Trim()

    if ($url -match "/issues/(\d+)") {
        $num = $Matches[1]
        gh issue close $num --comment "Completed retroactively. See docs/checks/ for full retrospective." | Out-Null
        Write-Host "  OK #$num created and closed" -ForegroundColor Green
        $created++
    } else {
        Write-Host "  FAIL: $url" -ForegroundColor Red
        $failed++
    }
}

# Cleanup
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "----- Summary -----" -ForegroundColor Yellow
Write-Host "Created: $created"
Write-Host "Failed:  $failed"
Write-Host ""
Write-Host "Verify with: gh issue list --state all --limit 20" -ForegroundColor Yellow
