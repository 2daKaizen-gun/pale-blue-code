// The backend origin, resolved from build-time env — kept as a *pure* function so
// the one rule that actually matters can be tested in node: a production build must
// never silently fall back to the local dev server. That exact misconfiguration
// (VITE_API_BASE_URL unset on Vercel → the deployed site calling localhost:8000)
// left every backend feature dead in production, quietly, for the whole project's
// life. The fix is not just "set the var" — it is to make the mistake *loud*.

export interface ApiConfig {
  /** Origin every api/* module builds its request URLs from. */
  baseUrl: string
  /** True when the resolved base cannot work for how this build is served. */
  misconfigured: boolean
  /** Human-readable why, for the console + the on-screen banner. null when fine. */
  reason: string | null
}

/** The dev-server fallback. Correct locally, fatal in a hosted build. */
export const LOCAL_DEFAULT = 'http://localhost:8000'

const LOCALHOST = /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/

/**
 * Resolve the API base from the raw env value and whether this is a production
 * build. `prod` mirrors Vite's `import.meta.env.PROD` (true for `vite build`,
 * false for `vite dev` / tests). Passing env in (rather than reading import.meta
 * here) keeps this testable in the node vitest environment.
 */
export function resolveApiConfig(env: { raw: string | undefined; prod: boolean }): ApiConfig {
  const raw = env.raw?.trim()

  if (!raw) {
    // No override. Fine in dev (real local backend); fatal in a hosted build.
    return {
      baseUrl: LOCAL_DEFAULT,
      misconfigured: env.prod,
      reason: env.prod
        ? 'VITE_API_BASE_URL is not set — this production build is calling the local dev server (localhost:8000), so every backend feature is offline. Set it to the hosted backend URL and redeploy.'
        : null,
    }
  }

  if (env.prod && LOCALHOST.test(raw)) {
    return {
      baseUrl: raw,
      misconfigured: true,
      reason: `VITE_API_BASE_URL points at a local address (${raw}) in a production build — a hosted page cannot reach a backend on localhost. Set it to the public backend URL and redeploy.`,
    }
  }

  return { baseUrl: raw, misconfigured: false, reason: null }
}
