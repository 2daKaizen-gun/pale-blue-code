import { describe, it, expect } from 'vitest'
import { learnPhases, huntItems, sectionForPath } from './navModel'

describe('navModel — 2계층 네비 그룹 구성', () => {
  it('배우기(learnPhases)는 Home을 제외하고 여정 단계만 담는다', () => {
    expect(learnPhases.length).toBeGreaterThan(0)
    // Home('/')은 상시 노출이라 배우기 섹션에 없어야 한다.
    expect(learnPhases.some((p) => p.path === '/')).toBe(false)
  })

  it('배우기는 경로 중복 없이 유일하다 (Phase 0·1이 같은 / 로 접힘)', () => {
    const paths = learnPhases.map((p) => p.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('여정의 정점 Phase 8 "Hunt"(/hunt)는 배우기에 남는다', () => {
    expect(learnPhases.some((p) => p.path === '/hunt')).toBe(true)
  })

  it('사냥하기(huntItems)는 Frontier와 표적 풀을 담는다', () => {
    const tos = huntItems.map((i) => i.to)
    expect(tos).toContain('/hunt/frontier')
    expect(tos).toContain('/hunt/pool')
  })
})

describe('navModel — sectionForPath 경로→섹션 판정', () => {
  it('Home(/)은 소속 없음(null): 양쪽 섹션이 접힌 채 시작', () => {
    expect(sectionForPath('/')).toBe(null)
  })

  it('여정 경로는 learn', () => {
    expect(sectionForPath('/solar')).toBe('learn')
    expect(sectionForPath('/exoplanet')).toBe('learn')
    // Phase 8 Hunt은 여정의 정점이므로 learn (사냥 도구가 아님)
    expect(sectionForPath('/hunt')).toBe('learn')
  })

  it('실제 도구 경로는 hunt (자식 :mission 라우트 포함)', () => {
    expect(sectionForPath('/hunt/frontier')).toBe('hunt')
    expect(sectionForPath('/hunt/frontier/some-mission')).toBe('hunt')
    expect(sectionForPath('/hunt/pool')).toBe('hunt')
  })

  it('/hunt 와 /hunt/frontier 를 혼동하지 않는다 (접두 판정의 함정)', () => {
    // '/hunt'는 learn, '/hunt/frontier'는 hunt — 접두 검사가 /hunt 를 먼저
    // 삼키면 안 된다. frontier/pool 를 먼저 확인하므로 안전.
    expect(sectionForPath('/hunt')).toBe('learn')
    expect(sectionForPath('/hunt/frontier')).toBe('hunt')
  })
})
