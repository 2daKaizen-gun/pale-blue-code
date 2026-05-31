import { useEffect, useRef } from 'react'
import { Scene } from '../components/gravity/Scene'
import { PresetSelector } from '../components/gravity/PresetSelector'
import { getPreset, DEFAULT_PRESET_ID } from '../data/presets'
import { useGravityStore } from '../store/gravityStore'
import type { SystemState } from '../lib/physics/types'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 라우트의 진입점.
 *
 * 책임:
 *   - 활성 프리셋 = gravityStore.presetId (PresetSelector 와 공유 진실)
 *   - 물리 상태 ref 소유 (Canvas 안/밖 공통 조상), 프리셋 변경 시 재초기화
 *   - 프리셋의 물리 노브(G/ε/dt) + camera + bodies 를 Scene 으로 전달
 *
 * ─── ref 초기화 (sub-3-4) ─────────────────────────────
 *   bodiesRef 의 `.current` 는 Integrator 가 매 프레임 새 SystemState 로
 *   교체 (ref 식별자는 불변). useState 가 아닌 이유: 물리 갱신에 리렌더 0.
 *
 *   sub-3-3 은 mount 1회 초기화로 충분했음. 3-4 는 프리셋 전환마다
 *   useEffect([preset]) 로 재초기화. `Vector3.clone()` 으로 presets.ts
 *   불변 데이터를 끊어 — 누가 in-place 로 바꿔도 프리셋 원본 오염 X.
 *   getPreset() 은 모듈 싱글톤을 돌려주므로 presetId 가 같으면 preset
 *   참조도 안정 → effect 가 프리셋당 한 번만 실행.
 */
export default function GravityPage() {
  const presetId = useGravityStore((s) => s.presetId)
  const preset = getPreset(presetId)

  const bodiesRef = useRef<SystemState>(
    preset.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    })),
  )

  // 페이지 진입 = 기본 프리셋 (F5 / HMR 클린 시작) — Phase 2 mount reset 정신.
  useEffect(() => {
    useGravityStore.getState().selectPreset(DEFAULT_PRESET_ID)
  }, [])

  // 프리셋 변경 시 물리 상태 재초기화.
  useEffect(() => {
    bodiesRef.current = preset.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    }))
  }, [preset])

  return (
    <div className="relative h-screen w-full">
      <PresetSelector />
      <Scene
        presetId={presetId}
        bodiesRef={bodiesRef}
        presetBodies={preset.bodies}
        camera={preset.camera}
        G={preset.G}
        softening={preset.softening}
        dt={preset.recommendedDt}
      />
    </div>
  )
}
