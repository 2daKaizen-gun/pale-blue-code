/**
 * store/solarSystemStore.test.ts
 *
 * 신규 파일. sub-2-3 까지는 store 테스트가 없었지만, sub-2-4 의 *프리셋 동시성*
 * 은 *육안 검증이 어려운 정량 기준* (두 changedAt 일치) 이라 단위 테스트 가치.
 *
 * sub-2-5: selection 액션 추가 + reset 통합에 selectedPlanetId 포함 회귀 방어.
 *
 * 토글/선택 동작 자체는 컴포넌트 통합 검증으로 충분 — 여기선 *동시성 + 패러다임 자체* 만.
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
    expect(scaleModeChangedAt).toBeGreaterThan(0) // performance.now() > 0
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
    expect(s.scaleModeChangedAt).toBe(s.rotationModeChangedAt) // *동시성 핵심*
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

describe('selectPlanet / deselectPlanet (sub-2-5)', () => {
  beforeEach(() => {
    useSolarSystemStore.setState({ selectedPlanetId: null })
  })

  it('selectPlanet 호출 시 ID 저장', () => {
    useSolarSystemStore.getState().selectPlanet('earth')
    expect(useSolarSystemStore.getState().selectedPlanetId).toBe('earth')
  })

  it('selectPlanet 중복 호출 시 목표만 갱신 (마지막 win)', () => {
    useSolarSystemStore.getState().selectPlanet('earth')
    useSolarSystemStore.getState().selectPlanet('mars')
    expect(useSolarSystemStore.getState().selectedPlanetId).toBe('mars')
  })

  it('deselectPlanet 호출 시 null', () => {
    useSolarSystemStore.setState({ selectedPlanetId: 'jupiter' })
    useSolarSystemStore.getState().deselectPlanet()
    expect(useSolarSystemStore.getState().selectedPlanetId).toBeNull()
  })
})

describe('reset — 모든 것 처음으로 (시간 + 모드 + 선택)', () => {
  it('진실 모드 + 큰 simulationDays + 큰 speed + 선택 → 모두 초기값', () => {
    useSolarSystemStore.setState({
      simulationDays: 9999,
      timeSpeed: 10_000,
      prevSpeed: 100,
      scaleMode: 'real',
      scaleModeChangedAt: 12345,
      rotationMode: 'real',
      rotationModeChangedAt: 67890,
      selectedPlanetId: 'jupiter',
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
    expect(s.selectedPlanetId).toBeNull()
  })
})
