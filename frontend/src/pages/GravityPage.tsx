import PhasePlaceholder from '../components/phases/PhasePlaceholder'
import { PHASES } from '../constants/phases'

export default function GravityPage() {
  const phase = PHASES.find((p) => p.path === '/gravity')!
  return <PhasePlaceholder phase={phase} />
}
