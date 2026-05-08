import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function ExoplanetPage() {
  const phase = PHASES.find((p) => p.path === '/exoplanet')!
  return <PhasePlaceholder phase={phase} />
}
