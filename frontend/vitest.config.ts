import { defineConfig } from 'vitest/config'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Vitest 설정. Phase 6 BLS 알고리즘 시기까지 *순수 함수 TDD* 의 인프라.
 *
 * ─── 환경 선택 ───────────────────────────────────────
 *   environment: 'node' — 현재는 순수 함수만 테스트.
 *   React 컴포넌트/hook 테스트가 필요해지면 'jsdom' 으로 전환
 *   (+ @testing-library/react, jsdom 설치 필요).
 *
 * ─── vite.config 와 별도 ────────────────────────────
 *   별도 파일로 두면 vite.config 변경이 테스트 환경에 영향 X.
 *   vitest 는 동일 디렉토리의 vite.config 를 자동 머지하지만,
 *   vitest.config 가 *우선*. 명시적이라 디버깅 쉬움.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false, // import { describe, it, expect } 명시
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
