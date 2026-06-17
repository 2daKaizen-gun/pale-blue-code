import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// ─── sub-3-7 [perf] manualChunks ──────────────────────────────────
//   Diagnosis (Lighthouse mobile, /gravity): TBT red + LCP orange — the
//   classic "big JS bundle blocks the main thread" signature. The route is
//   already code-split (router.tsx 2-7), so three/r3f/drei load only on
//   /gravity — but they sat *inside* that one route chunk, so parsing +
//   executing the whole thing in one shot stalled the thread (TBT) and
//   delayed first paint (LCP).
//
//   Fix: split the heavy 3D vendor libs into their own chunks. Two wins:
//     - The browser fetches vendor + page chunks in parallel instead of one
//       monolith, and can parse them off the critical path.
//     - three/r3f/drei are shared across R3F routes (solar / gravity /
//       blackhole…), so once cached the second route reuses it — no re-download.
//
//   Function form (not the object map): on this Vite/Rollup version the
//   object literal trips TS2769 (output gets inferred as the array overload,
//   where manualChunks must be a function). The function is also more robust —
//   we decide explicitly which package lands in which chunk by module path.
//
//   measurement-first (2-7): added only after the report showed TBT/bundle as
//   the bottleneck — not on spec. Re-measure after this; if 85+ we stop here.
export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps, { hostType }) {
        if (hostType === 'html') {
          return deps.filter(
            (dep) => !dep.includes('vendor-three') && !dep.includes('vendor-r3f')
          )
        }
        return deps
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three'
            if (id.includes('@react-three')) return 'vendor-r3f'
            if (id.includes('/d3') || id.includes('/d3-')) return 'vendor-d3'
          }
        },
      },
    },
  },
})
