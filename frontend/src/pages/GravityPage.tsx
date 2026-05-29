import { Scene } from '../components/gravity/Scene'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 라우트의 진입점.
 *
 * 책임:
 *   - Scene (R3F Canvas) 을 전체 영역에 렌더
 *   - (sub-3-4/3-5 이후) ControlPanel / EnergyReadout 을 그 위에 띄움
 *
 * 책임 아닌 것:
 *   - 3D scene 자체 → <Scene />
 *
 * SolarPage 패턴 미러링. relative 컨테이너는 향후 Canvas 위 absolute UI
 * (energy readout — 3-5, control panel — 3-4) 를 위한 positioned ancestor.
 *
 * 자세한 설계는 docs/specs/phase-3/PRD.md, TECHSPEC.md 참조.
 */
export default function GravityPage() {
  return (
    <div className="relative h-screen w-full">
      <Scene />
    </div>
  )
}
