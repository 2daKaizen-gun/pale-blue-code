import { PHASES, type Phase } from '../../constants/phases'

/**
 * 2계층 네비게이션의 순수 로직 (렌더링과 분리해 node 환경에서 단위 테스트).
 *
 *   📖 배우기   = 선형 학습 여정 (Phase 2~8) — PHASES 에서 파생
 *   🛰 사냥하기 = 진짜 하늘을 뒤지는 라이브 도구 (Frontier + 표적 풀) — 손으로 배치
 *
 * ⚠️ 사냥하기 항목은 PHASES 에서 파생하지 않는다: 진짜 solo 사냥(Skyward)은
 *    번호 매긴 학습 단계와 별개 트랙이라 결합을 피한다. Phase 8 "Hunt"(/hunt)는
 *    여정의 정점(교육용)이므로 배우기에 남고, Frontier(/hunt/frontier)가 실제 도구.
 */

export type NavSection = 'learn' | 'hunt' | null

export interface HuntItem {
  to: string
  emoji: string
  label: string
  hint: string
}

// Phase 0,1은 둘 다 path='/' → dedup. 배우기 = Home('/') 제외한 나머지(Solar~Hunt).
export const learnPhases: Phase[] = PHASES.filter(
  (p, i, arr) => arr.findIndex((x) => x.path === p.path) === i && p.path !== '/'
)

export const huntItems: HuntItem[] = [
  { to: '/hunt/frontier', emoji: '🛰️', label: 'Frontier', hint: '진짜 사냥 · 라이브' },
  { to: '/hunt/pool', emoji: '📋', label: '표적 풀', hint: '후보 별 목록' },
]

/**
 * 주어진 경로가 어느 섹션에 속하는지. Home 등 소속 없는 경로는 null
 * (양쪽 섹션이 접힌 채로 시작 — 평소 보이는 항목 = Home + 헤더 2개).
 */
export function sectionForPath(path: string): NavSection {
  if (path.startsWith('/hunt/frontier') || path.startsWith('/hunt/pool')) return 'hunt'
  if (learnPhases.some((p) => p.path === path)) return 'learn'
  return null
}
