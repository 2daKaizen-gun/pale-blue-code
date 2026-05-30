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
 *   - 물리 상태 ref 소유 (Canvas 안/밖 공통 조상). 3-4 에서 ControlPanel
 *     이 프리셋 셀렉터로 들어오면 ControlPanel 도 Canvas *밖* 자식이라
 *     같은 ref 가 필요해짐. Page 가 단일 소유자.
 *   - Scene 에 ref + 렌더 메타 내려보냄.
 *   - (3-4/3-5 이후) ControlPanel / EnergyReadout 을 Canvas 위에 띄움.
 *
 * 책임 아닌 것:
 *   - 3D scene 자체 → <Scene />
 *   - 적분 (ref 갱신) → <Integrator /> (Light 4)
 *   - 렌더 (ref → mesh) → <Bodies />
 *
 * SolarPage 패턴 미러링. relative 컨테이너는 향후 Canvas 위 absolute UI
 * 를 위한 positioned ancestor.
 *
 * ─── ref 초기화 ───────────────────────────────────────
 *   useRef 의 *초기값*만 사용 — mount 후엔 절대 변하지 않는 *식별자*
 *   (integrator 가 매 프레임 .current 를 새 SystemState 로 교체).
 *   useState 가 아닌 이유: 물리 상태 변경에 React 리렌더 0 (sub-2-3 의
 *   useFrame-derived 패러다임의 N-body 판).
 *
 *   현재는 TWO_BODY 한 프리셋만 → mount 시 1 회 초기화로 충분. 3-4 의
 *   프리셋 셀렉터 도입 시 useEffect([presetId]) 로 재초기화 추가.
 *
 *   `new Vector3()` 인스턴스를 *복제* (clone) 해서 ref 에 담는 이유:
 *   presets.ts 의 Vector3 는 *불변 데이터* 의도. 적분기는 매 스텝 새
 *   인스턴스를 만들지만, 만약 누군가 in-place 로 바꾸면 프리셋 자체가
 *   오염됨. 초기화 시 한 번 끊어둠.
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
      <Scene bodiesRef={bodiesRef} presetBodies={TWO_BODY.bodies} />
    </div>
  )
}
