// Discovery-method → color, shared by FilterPanel, ScatterPlot and
// TimelineView. Kept in its own module so the component files stay
// component-only exports (react-refresh friendly).
export const METHOD_COLOR: Record<string, string> = {
  Transit: '#818cf8',
  'Radial Velocity': '#34d399',
  Imaging: '#fbbf24',
  Microlensing: '#f87171',
  Astrometry: '#38bdf8',
}

export function getMethodColor(method: string): string {
  return METHOD_COLOR[method] ?? '#64748b'
}
