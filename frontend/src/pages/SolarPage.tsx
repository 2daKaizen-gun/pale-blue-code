import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function SolarPage() {
  const phase = PHASES.find((p) => p.path === '/solar')!
  return <PhasePlaceholder phase={phase} />
}
