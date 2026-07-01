// Where a hunter can take a discovery next. Kept out of the component so the
// destinations are discoverable in one place and reusable if another view wants
// to surface them (e.g. a future discovery repository).
export interface ReportLink {
  label: string
  href: string
}

export const REPORT_LINKS: ReportLink[] = [
  {
    label: 'Planet Hunters',
    href: 'https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess',
  },
  {
    label: 'NASA Exoplanet Archive',
    href: 'https://exoplanetarchive.ipac.caltech.edu/',
  },
]
