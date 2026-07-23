// Single source of truth for the backend origin. Every api/* module builds its
// request URLs from API_BASE_URL — override at build time with VITE_API_BASE_URL
// (e.g. the Vercel deploy points at the hosted backend), else default to the local
// dev server. The resolution + the "never silently ship a localhost backend to
// production" guard live in apiConfig.ts (pure, tested); here we just apply it to
// the real Vite env and shout in the console if the build is misconfigured.
import { resolveApiConfig } from './apiConfig'

const config = resolveApiConfig({
  raw: import.meta.env.VITE_API_BASE_URL,
  prod: import.meta.env.PROD,
})

if (config.misconfigured && typeof console !== 'undefined') {
  // Loud on purpose: this exact class of mistake left the hosted site dead and quiet.
  console.error(`[Pale Blue Code] Backend misconfigured — ${config.reason}`)
}

export const API_BASE_URL = config.baseUrl
/** True when this build's backend origin cannot work for how it is served. */
export const API_MISCONFIGURED = config.misconfigured
/** Human-readable reason for the misconfiguration, or null. */
export const API_MISCONFIG_REASON = config.reason
