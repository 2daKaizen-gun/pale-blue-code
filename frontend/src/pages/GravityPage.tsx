import { useEffect, useState } from 'react'
import { Scene } from '../components/gravity/Scene'
import { PresetSelector } from '../components/gravity/PresetSelector'
import { ControlPanel } from '../components/gravity/ControlPanel'
import { getPreset, DEFAULT_PRESET_ID } from '../data/presets'
import { useGravityStore } from '../store/gravityStore'
import { RingBuffer } from '../lib/util/ringBuffer'
import { TRAIL_CAPACITY } from '../constants/gravity'
import type { SystemState } from '../lib/physics/types'

interface Sim {
  key: string
  bodiesRef: { current: SystemState }
  trailsRef: { current: RingBuffer[] }
}

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * GravityPage — `/gravity` 진입점. 활성 프리셋 = gravityStore.presetId,
 * 카오스 시드 = gravityStore.perturbation, 리로드 nonce = presetLoadedAt.
 *
 * ─── 시뮬레이션 세대 교체 (sub-3-4 [fix], 3-5 확장, 3-7 trail + nonce) ──
 *   bodiesRef *와* trailsRef 를 담은 세대(sim)를 프리셋·섭동·*리로드(nonce)*
 *   변경 시 *렌더 중 동기* 로 새것으로 교체 (2026-09-26: ref 를 렌더 중
 *   변이하던 것을 React 의 "키가 바뀌면 렌더 중 state 교체" 패턴으로). useEffect(commit 이후) 로 하면
 *   key-remount 된 Trails/Bodies 는 새 개수인데 ref 는 잠깐 옛 상태라 길이가
 *   어긋나 터졌음 (3-4). 렌더 중 동기 재설정하면 자식 렌더 전에 맞춰져 타이밍
 *   갭이 사라짐. (GravityPage 는 presetId/perturbation/presetLoadedAt 변할
 *   때만 리렌더 — 매 프레임 X.)
 *
 *   Vector3.clone() 으로 presets.ts 불변 데이터를 끊어 — 오염 방지.
 *   trailsRef: 새 RingBuffer 들로 교체 → 옛 궤적 클리어 (Trails 의 key remount
 *   와 함께 깨끗한 새 trajectory).
 *
 *   nonce(presetLoadedAt): 같은 프리셋 *재선택* 도 재시드하게 하는 트리거.
 *   presetId/perturbation 이 안 변해도(예: figure-8 에 nudge 0 인 채 ↻) nonce
 *   가 bump 되어 깨끗이 다시 굴림. 리셋 로직을 따로 안 만들고 selectPreset 재사용.
 *
 * ─── 카오스 시드 (3-5) ────────────────────────────────
 *   three-body(figure-8) 한정: body-1 의 시작점에 고정 방향 x perturbation 을
 *   더한다. 결정론 — 같은 값이면 같은 운명. 0 이면 published IC 그대로(영원히
 *   8자). 다른 프리셋은 perturbation 을 무시.
 *
 * ─── 컨트롤 표면 ──────────────────────────────────────
 *   <PresetSelector/> = 상단. <ControlPanel/> = 하단 (재생/속도 + ↻리로드 +
 *   적분기 토글 + readout + 섭동). ControlPanel 의 readout 은 physics 상태가
 *   필요해 bodiesRef/G/softening/presetId 를 props 로 받음 — 렌더 트리 한 곳이
 *   단일 진실원.
 */
export default function GravityPage() {
  const presetId = useGravityStore((s) => s.presetId)
  const perturbation = useGravityStore((s) => s.perturbation)
  const presetLoadedAt = useGravityStore((s) => s.presetLoadedAt)
  const preset = getPreset(presetId)

  // One simulation generation per (preset, perturbation, reload nonce). The
  // refs live inside it, so a re-seed swaps in fresh ones instead of mutating
  // shared refs during render.
  const simKey = `${presetId}|${perturbation}|${presetLoadedAt}`
  const makeSim = (): Sim => {
    const bodies = preset.bodies.map((b) => ({
      mass: b.mass,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
    }))
    // Chaos seed (three-body only): nudge body-1's starting point along a
    // fixed axis. Deterministic; perturbation 0 -> IC untouched (figure-8).
    if (preset.id === 'three-body' && perturbation !== 0) {
      bodies[0].position.x += perturbation
    }
    return {
      key: simKey,
      bodiesRef: { current: bodies },
      // One trail ring per body. Owned here (sibling of bodiesRef) so the
      // Integrator can write per-substep and Trails can read — see sub-3-7.
      trailsRef: { current: preset.bodies.map(() => new RingBuffer(TRAIL_CAPACITY)) },
    }
  }

  const [sim, setSim] = useState(makeSim)
  // 프리셋·섭동·리로드(nonce) 변경 → 렌더 중 새 세대로 교체 (자식 렌더 전).
  // React 가 이 렌더를 버리고 새 state 로 즉시 다시 렌더하므로 자식은 옛 세대를 못 본다.
  if (sim.key !== simKey) setSim(makeSim())
  const { bodiesRef, trailsRef } = sim

  // 페이지 진입 = 기본 프리셋 (F5 / HMR 클린 시작) — Phase 2 mount reset 정신.
  // selectPreset 이 perturbation 도 0 으로 리셋 + nonce bump.
  useEffect(() => {
    useGravityStore.getState().selectPreset(DEFAULT_PRESET_ID)
  }, [])

  return (
    <div className="relative h-screen w-full">
      <PresetSelector />
      <Scene
        presetId={presetId}
        bodiesRef={bodiesRef}
        trailsRef={trailsRef}
        presetBodies={preset.bodies}
        camera={preset.camera}
        G={preset.G}
        softening={preset.softening}
        dt={preset.recommendedDt}
        perturbation={perturbation}
        presetLoadedAt={presetLoadedAt}
      />
      <ControlPanel
        bodiesRef={bodiesRef}
        presetBodies={preset.bodies}
        G={preset.G}
        softening={preset.softening}
        presetId={presetId}
      />
    </div>
  )
}
