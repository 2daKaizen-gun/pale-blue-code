import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function DataPage() {
  const phase = PHASES.find((p) => p.path === '/data')!
  return <PhasePlaceholder phase={phase} />
}
