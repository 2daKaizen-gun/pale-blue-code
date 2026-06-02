import { useEffect, useRef } from 'react'
import { Scene } from '../components/gravity/Scene'
import { PresetSelector } from '../components/gravity/PresetSelector'
import { ControlPanel } from '../components/gravity/ControlPanel'
import { getPreset, DEFAULT_PRESET_ID } from '../data/presets'
import { useGravityStore } from '../store/gravityStore'
import type { SystemState } from '../lib/physics/types'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 진입점. 활성 프리셋 = gravityStore.presetId,
 * 카오스 시드 = gravityStore.perturbation.
 *
 * ─── ref 재초기화 (sub-3-4 [fix], 3-5 확장) ───────────
 *   bodiesRef.current 를 프리셋 *또는* 섭동 변경 시 *렌더 중 동기* 로 갈아끼움.
 *   useEffect(commit 이후) 로 하면 key-remount 된 Trails/Bodies 는 새 개수인데
 *   bodiesRef 는 잠깐 옛 상태라 길이가 어긋나 Trails 가 터졌음 (3-4). 렌더 중
 *   동기 재설정하면 자식 렌더 전에 맞춰져 타이밍 갭이 사라짐. (GravityPage 는
 *   presetId/perturbation 변할 때만 리렌더 — 매 프레임 X.)
 *
 *   Vector3.clone() 으로 presets.ts 불변 데이터를 끊어 — 오염 방지.
 *
 * ─── 카오스 시드 (3-5) ────────────────────────────────
 *   three-body(figure-8) 한정: body-1 의 시작점에 고정 방향 × perturbation 을
 *   더한다. 결정론 — 같은 값이면 같은 운명. 0 이면 published IC 그대로(영원히
 *   8자). 다른 프리셋은 perturbation 을 무시.
 *
 * ─── 컨트롤 표면 ──────────────────────────────────────
 *   <PresetSelector/> = 상단. <ControlPanel/> = 하단 (적분기 토글 + readout +
 *   섭동). ControlPanel 의 readout 은 physics 상태가 필요해 bodiesRef/G/
 *   softening/presetId 를 props 로 받음 — 렌더 트리 한 곳이 단일 진실원.
 */
export default function GravityPage() {
  const presetId = useGravityStore((s) => s.presetId)
  const perturbation = useGravityStore((s) => s.perturbation)
  const preset = getPreset(presetId)

  const makeBodies = (): SystemState => {
    const bodies = preset.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    }))
    // Chaos seed (three-body only): nudge body-1's starting point along a
    // fixed axis. Deterministic; perturbation 0 → IC untouched (figure-8).
    if (preset.id === 'three-body' && perturbation !== 0) {
      bodies[0].position.x += perturbation
    }
    return bodies
  }

  const bodiesRef = useRef<SystemState>(makeBodies())
  const loadedIdRef = useRef(presetId)
  const loadedPerturbRef = useRef(perturbation)

  // 프리셋 또는 섭동 변경 → 렌더 중 동기 재초기화 (자식 렌더 전).
  if (loadedIdRef.current !== presetId || loadedPerturbRef.current !== perturbation) {
    loadedIdRef.current = presetId
    loadedPerturbRef.current = perturbation
    bodiesRef.current = makeBodies()
  }

  // 페이지 진입 = 기본 프리셋 (F5 / HMR 클린 시작) — Phase 2 mount reset 정신.
  // selectPreset 이 perturbation 도 0 으로 리셋.
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
        perturbation={perturbation}
      />
      <ControlPanel
        bodiesRef={bodiesRef}
        G={preset.G}
        softening={preset.softening}
        presetId={presetId}
      />
    </div>
  )
}
