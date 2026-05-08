import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function HuntPage() {
  const phase = PHASES.find((p) => p.path === '/hunt')!
  return <PhasePlaceholder phase={phase} />
}
