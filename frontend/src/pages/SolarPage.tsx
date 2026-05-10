import { Scene } from '../components/solar/Scene'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * SolarPage — `/solar` 라우트의 진입점.
 *
 * 책임:
 *   - Scene (R3F Canvas) 을 전체 영역에 렌더
 *   - AppLayout 의 사이드바와 공존하므로 본문 영역 100% 사용
 *
 * 책임 아닌 것:
 *   - 3D scene 자체 → <Scene />
 *   - 컨트롤 패널 → sub-phase 2-3 부터 추가 예정
 *
 * 자세한 설계는 docs/specs/phase-2/PRD.md, TECHSPEC.md 참조.
 */
export default function SolarPage() {
  return (
    <div className="h-screen w-full">
      <Scene />
    </div>
  )
}
