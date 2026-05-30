import { useRef } from 'react'
import { Scene } from '../components/gravity/Scene'
import { TWO_BODY } from '../data/presets'
import type { SystemState } from '../lib/physics/types'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 라우트의 진입점.
 *
 * 책임:
 *   - 물리 상태 ref 소유 (Canvas 안/밖 공통 조상)
 *   - 활성 프리셋의 *물리 노브* (G / ε / dt) 를 Scene 으로 전달
 *   - (3-4/3-5 이후) ControlPanel / EnergyReadout 띄움
 *
 * 책임 아닌 것:
 *   - 3D scene 자체 → <Scene />
 *   - 적분 (ref 갱신) → <Integrator />
 *   - 렌더 (ref → mesh) → <Bodies />
 *
 * ─── ref 초기화 ───────────────────────────────────────
 *   useRef 의 *초기값* 만 사용 — mount 후엔 절대 변하지 않는 *식별자*
 *   (Integrator 가 매 프레임 .current 를 새 SystemState 로 교체).
 *   useState 가 아닌 이유: 물리 상태 변경에 React 리렌더 0.
 *
 *   현재는 TWO_BODY 한 프리셋만 → mount 시 1 회 초기화로 충분. 3-4 의
 *   프리셋 셀렉터 도입 시 useEffect([presetId]) 로 재초기화 추가.
 *
 *   `Vector3.clone()` 으로 presets.ts 의 불변 데이터를 끊어둠. 누군가
 *   in-place 로 바꿔도 프리셋 자체 오염 X.
 */
export default function GravityPage() {
  const bodiesRef = useRef<SystemState>(
    TWO_BODY.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    })),
  )

  return (
    <div className="relative h-screen w-full">
      <Scene
        bodiesRef={bodiesRef}
        presetBodies={TWO_BODY.bodies}
        G={TWO_BODY.G}
        softening={TWO_BODY.softening}
        dt={TWO_BODY.recommendedDt}
      />
    </div>
  )
}
