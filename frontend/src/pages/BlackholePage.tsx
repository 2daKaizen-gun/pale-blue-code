import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function BlackholePage() {
  const phase = PHASES.find((p) => p.path === '/blackhole')!
  return <PhasePlaceholder phase={phase} />
}
