/**
 * store/solarSystemStore.test.ts
 *
 * sub-2-4 의 *프리셋 동시성* 은 *육안 검증이 어려운 정량 기준* (두 changedAt 일치) 이라
 * 단위 테스트 가치. sub-2-5 의 카메라 액션도 비슷 — *timestamp 갱신 의도* 가 코드로
 * 명시되어야 미래 회귀 방어.
 *
 * 토글/선택/카메라 동작 자체는 컴포넌트 통합 검증으로 충분 — 여기선
 * *상태 모델의 의미* 만.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useSolarSystemStore } from './solarSystemStore'

describe('toggleScaleMode', () => {
  beforeEach(() => {
    useSolarSystemStore.setState({
      scaleMode: 'visual',
      scaleModeChangedAt: -Infinity,
    })
  })

  it('visual → real 반전 + changedAt 갱신', () => {
    useSolarSystemStore.getState().toggleScaleMode()
    const { scaleMode, scaleModeChangedAt } = useSolarSystemStore.getState()
    expect(scaleMode).toBe('real')
    expect(scaleModeChangedAt).toBeGreaterThan(0)
    expect(scaleModeChangedAt).toBeLessThan(Infinity)
  })

  it('연속 토글 시 changedAt 매번 갱신 (중복 클릭 자동 방어)', async () => {
    useSolarSystemStore.getState().toggleScaleMode()
    const first = useSolarSystemStore.getState().scaleModeChangedAt
    await new Promise((r) => setTimeout(r, 5))
    useSolarSystemStore.getState().toggleScaleMode()
    const second = useSolarSystemStore.getState().scaleModeChangedAt
    expect(second).toBeGreaterThan(first)
  })
})

describe('toggleAllTruth — 동시성 보장', () => {
  beforeEach(() => {
    useSolarSystemStore.setState({
      scaleMode: 'visual',
      scaleModeChangedAt: -Infinity,
      rotationMode: 'visual',
      rotationModeChangedAt: -Infinity,
    })
  })

  it('둘 다 visual → 둘 다 real + 두 changedAt 동일 (정공법)', () => {
    useSolarSystemStore.getState().toggleAllTruth()
    const s = useSolarSystemStore.getState()
    expect(s.scaleMode).toBe('real')
    expect(s.rotationMode).toBe('real')
    expect(s.scaleModeChangedAt).toBe(s.rotationModeChangedAt)
  })

  it('둘 다 real → 둘 다 visual (탈출 경로)', () => {
    useSolarSystemStore.setState({ scaleMode: 'real', rotationMode: 'real' })
    useSolarSystemStore.getState().toggleAllTruth()
    const s = useSolarSystemStore.getState()
    expect(s.scaleMode).toBe('visual')
    expect(s.rotationMode).toBe('visual')
    expect(s.scaleModeChangedAt).toBe(s.rotationModeChangedAt)
  })

  it('한쪽만 real → 양쪽 real 강제 (불일치 해소)', () => {
    useSolarSystemStore.setState({ scaleMode: 'real', rotationMode: 'visual' })
    useSolarSystemStore.getState().toggleAllTruth()
    const s = useSolarSystemStore.getState()
    expect(s.scaleMode).toBe('real')
    expect(s.rotationMode).toBe('real')
    expect(s.scaleModeChangedAt).toBe(s.rotationModeChangedAt)
  })
})

describe('selectBody (sub-2-5)', () => {
  beforeEach(() => {
    useSolarSystemStore.setState({ selectedBodyId: null })
  })

  it('selectBody 행성 호출 시 ID 저장', () => {
    useSolarSystemStore.getState().selectBody('earth')
    expect(useSolarSystemStore.getState().selectedBodyId).toBe('earth')
  })

  it('selectBody 태양 호출 시 ID 저장 (BodyId 합집합 검증)', () => {
    useSolarSystemStore.getState().selectBody('sun')
    expect(useSolarSystemStore.getState().selectedBodyId).toBe('sun')
  })

  it('selectBody 중복 호출 시 목표만 갱신 (마지막 win)', () => {
    useSolarSystemStore.getState().selectBody('earth')
    useSolarSystemStore.getState().selectBody('sun')
    useSolarSystemStore.getState().selectBody('mars')
    expect(useSolarSystemStore.getState().selectedBodyId).toBe('mars')
  })
})

describe('resetCameraView (sub-2-5 [Light 7]) — home 보간 trigger', () => {
  beforeEach(() => {
    useSolarSystemStore.setState({
      selectedBodyId: 'jupiter',
      cameraResetRequestedAt: -Infinity,
    })
  })

  it('selection 해제 + cameraResetRequestedAt 갱신 (now)', () => {
    useSolarSystemStore.getState().resetCameraView()
    const s = useSolarSystemStore.getState()
    expect(s.selectedBodyId).toBeNull()
    expect(s.cameraResetRequestedAt).toBeGreaterThan(0)
    expect(s.cameraResetRequestedAt).toBeLessThan(Infinity)
  })

  it('연속 호출 시 cameraResetRequestedAt 매번 갱신 (중복 클릭 자동 방어)', async () => {
    useSolarSystemStore.getState().resetCameraView()
    const first = useSolarSystemStore.getState().cameraResetRequestedAt
    await new Promise((r) => setTimeout(r, 5))
    useSolarSystemStore.getState().resetCameraView()
    const second = useSolarSystemStore.getState().cameraResetRequestedAt
    expect(second).toBeGreaterThan(first)
  })
})

describe('yieldCameraControl (sub-2-5 [Light 7]) — 사용자 OrbitControls 양도', () => {
  it('selection 해제 + cameraResetRequestedAt = -Infinity (자동 제어 정지)', () => {
    useSolarSystemStore.setState({
      selectedBodyId: 'earth',
      cameraResetRequestedAt: 12345, // home 보간 중이었다고 가정
    })
    useSolarSystemStore.getState().yieldCameraControl()
    const s = useSolarSystemStore.getState()
    expect(s.selectedBodyId).toBeNull()
    expect(s.cameraResetRequestedAt).toBe(-Infinity)
  })
})

describe('reset — 모든 것 처음으로 (시간 + 모드 + 선택 + 카메라)', () => {
  it('진실 모드 + 큰 simulationDays + 큰 speed + 선택 → 모두 초기값 + 카메라 home 보간 시작', () => {
    useSolarSystemStore.setState({
      simulationDays: 9999,
      timeSpeed: 10_000,
      prevSpeed: 100,
      scaleMode: 'real',
      scaleModeChangedAt: 12345,
      rotationMode: 'real',
      rotationModeChangedAt: 67890,
      selectedBodyId: 'sun',
      cameraResetRequestedAt: -Infinity,
    })
    useSolarSystemStore.getState().reset()
    const s = useSolarSystemStore.getState()
    expect(s.simulationDays).toBe(0)
    expect(s.timeSpeed).toBe(1)
    expect(s.prevSpeed).toBe(1)
    expect(s.scaleMode).toBe('visual')
    expect(s.rotationMode).toBe('visual')
    expect(s.scaleModeChangedAt).toBe(-Infinity)
    expect(s.rotationModeChangedAt).toBe(-Infinity)
    expect(s.selectedBodyId).toBeNull()
    // 카메라는 *지금 보간 시작* — 시간/모드 (-Infinity, 이미 도달) 와 다른 의미
    expect(s.cameraResetRequestedAt).toBeGreaterThan(0)
    expect(s.cameraResetRequestedAt).toBeLessThan(Infinity)
  })
})
