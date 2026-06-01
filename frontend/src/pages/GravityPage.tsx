import { useEffect, useRef } from 'react'
import { Scene } from '../components/gravity/Scene'
import { PresetSelector } from '../components/gravity/PresetSelector'
import { getPreset, DEFAULT_PRESET_ID } from '../data/presets'
import { useGravityStore } from '../store/gravityStore'
import type { SystemState } from '../lib/physics/types'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 진입점. 활성 프리셋 = gravityStore.presetId.
 *
 * ─── ref 재초기화 (sub-3-4 [fix]) ─────────────────────
 *   bodiesRef.current 를 프리셋 변경 시 *렌더 중 동기* 로 갈아끼움.
 *   useEffect(commit 이후) 로 하면, key-remount 된 Trails/Bodies 는 이미 새
 *   presetBodies(개수 B_new)인데 bodiesRef 는 잠깐 옛 상태(B_old)라 길이가
 *   어긋나 Trails 가 터졌음. 렌더 중 동기 재설정하면 자식 렌더 전에 맞춰져
 *   타이밍 갭이 사라짐. (GravityPage 는 presetId 변할 때만 리렌더 — 매 프레임 X.)
 *
 *   Vector3.clone() 으로 presets.ts 불변 데이터를 끊어 — 오염 방지.
 */
export default function GravityPage() {
  const presetId = useGravityStore((s) => s.presetId)
  const preset = getPreset(presetId)

  const makeBodies = (): SystemState =>
    preset.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    }))

  const bodiesRef = useRef<SystemState>(makeBodies())
  const loadedIdRef = useRef(presetId)

  // 프리셋 변경 → 렌더 중 동기 재초기화 (자식 렌더 전).
  if (loadedIdRef.current !== presetId) {
    loadedIdRef.current = presetId
    bodiesRef.current = makeBodies()
  }

  // 페이지 진입 = 기본 프리셋 (F5 / HMR 클린 시작) — Phase 2 mount reset 정신.
  useEffect(() => {
    useGravityStore.getState().selectPreset(DEFAULT_PRESET_ID)
  }, [])

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
