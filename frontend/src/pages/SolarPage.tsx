import { Scene } from '../components/solar/Scene'
import { ControlPanel } from '../components/solar/ControlPanel'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * SolarPage — `/solar` 라우트의 진입점.
 *
 * 책임:
 *   - Scene (R3F Canvas) 을 전체 영역에 렌더
 *   - ControlPanel (Canvas 밖 UI) 을 그 위에 띄움
 *   - AppLayout 의 사이드바와 공존하므로 본문 영역 100% 사용
 *
 * 책임 아닌 것:
 *   - 3D scene 자체 → <Scene />
 *   - 사용자 컨트롤 → <ControlPanel />
 *
 * ─── sub-phase 2-3 [Light 4] 변경 ──────────────────
 *   <ControlPanel /> 추가. 위치 잡기용 relative 컨테이너.
 *   ControlPanel 자체가 fixed positioning 이라 relative 가 필수는 아니지만,
 *   향후 *Canvas 위에 absolute 로 떠야 하는 추가 UI* (예: 정보 패널 sub-2-5)
 *   를 위해 미리 *positioned ancestor* 확보.
 *
 * 자세한 설계는 docs/specs/phase-2/PRD.md, TECHSPEC.md 참조.
 */
export default function SolarPage() {
  return (
    <div className="relative h-screen w-full">
      <Scene />
      <ControlPanel />
    </div>
  )
}
