import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Stats } from '@react-three/drei'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Scene — R3F Canvas 루트.
 *
 * Phase 2 Scene 패턴을 *의식적으로* 미러링 (sub-2-7 결정의 상속):
 *   - DPR 캡 [1, 2] 모듈 상수 (인라인 배열은 매 렌더 새 참조 →
 *     setPixelRatio 반복 호출. 안정 참조로 차단)
 *   - dev 전용 <Stats /> — prod 는 DEV 가드로 제외
 *   - CSS var 배경 (디자인 토큰 단일 source)
 *
 * Phase 2 와 다른 점 (의식적):
 *   - **텍스처 0** → useTexture suspend 없음 → *안쪽 <Suspense> 불필요*.
 *     (sub-2-7 [L3 fix] 의 Context Lost 는 텍스처 suspend 가 라우트
 *     Suspense 까지 올라가서 Canvas 언마운트 → WebGL 컨텍스트 한도 초과
 *     였음. 3-3 은 절차적 sphere/line 만 쓰니 suspend source 가 0.
 *     3-4 태양계 프리셋이 텍스처 도입 시 그때 패턴 복원.)
 *   - leva 없음 (3-5 ε/dt 튜닝 들어오면 DevControls 도입)
 *   - CameraController 없음 (3-5 선택/추적 도입 시)
 *   - 라이팅 0 — 별은 meshBasicMaterial 자체발광 (Light 3 결정).
 *
 * 채워질 구멍 (3-3 안에서):
 *   - <Bodies /> ← Light 3   (bodiesRef → mesh 위치 매 프레임)
 *   - <Integrator /> ← Light 4 (useFrame substep, ref 교체)
 *   - <Trails /> ← Light 6   (ring-buffer 페이드 라인)
 *
 * 카메라: TWO_BODY 프리셋 (separation=1, body radius=0.05) 기준 인라인 상수.
 * 3-4 멀티 프리셋 도입 시 *프리셋이 카메라 메타 보유* 또는 동적 조정으로 분기.
 */

const DPR: [number, number] = [1, 2]
const CAMERA_POSITION: [number, number, number] = [0, 0, 3]

export function Scene() {
  return (
    <Canvas
      dpr={DPR}
      camera={{ position: CAMERA_POSITION, fov: 50, near: 0.01, far: 100 }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {import.meta.env.DEV && <Stats />}

      <Stars radius={50} depth={50} count={1000} factor={2} fade />

      {/* <Bodies />     ← Light 3 */}
      {/* <Integrator /> ← Light 4 */}
      {/* <Trails />     ← Light 6 */}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={20}
      />
    </Canvas>
  )
}
