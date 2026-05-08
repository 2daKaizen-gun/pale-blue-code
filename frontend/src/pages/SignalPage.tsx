import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function SignalPage() {
  const phase = PHASES.find((p) => p.path === '/signal')!
  return <PhasePlaceholder phase={phase} />
}
