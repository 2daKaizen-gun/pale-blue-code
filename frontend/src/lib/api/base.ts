// Single source of truth for the backend origin. Every api/* module builds its
// request URLs from this — override at build time with VITE_API_BASE_URL
// (e.g. the Vercel deploy points at the hosted backend), else default to the
// local dev server.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
