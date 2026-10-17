# sub-phase 2-3 회고

**기간**: 2026-05-12 ~ 2026-05-14 (3일)
**범위**: 공전 애니메이션 + 시간 컨트롤 (Zustand 도입) + 궤도 라인 + axial-flip 보정 + starfield

---

## 잘된 점

- **증분 → 절대 시간 패러다임 전환**. `simulationDays` 단일 진실. 정지/리셋이 *코드 수정 없이* 자동 작동.
- **TDD 첫 도입** (vitest). `lib/time.ts` 15개 테스트로 부호/엣지 케이스 명시화. Phase 6 BLS 시기 인프라 미리 정착.
- **Zustand `getState` 패턴 정착**. useFrame 안 매 프레임 리렌더 0 보장.
- **사용자 도구 (ControlPanel) ↔ 개발자 도구 (leva) 분리**. 같은 store, 다른 책임.
- **사용자 피드백 → 토큰 최소 갱신의 흐름** (100,000× 제거 + 0.1× 추가). 헌장 §12 *막히면 솔직히* 의 실전 사례.

---

## 막힌 점 / 트러블슈팅

### 1. JavaScript `-0` vs `+0` (IEEE 754)
- **문제**: `0 / -243.02 = -0`. Vitest `toBe(0)` 가 `Object.is` 기반이라 실패.
- **원인**: IEEE 754 부동소수점은 *0에도 부호 비트* 보관. `Object.is(0, -0) === false`.
- **해결**: `toBeCloseTo(0)` — 부동소수점 근사 비교의 일반 패턴. 시각 무관한 차이는 *코드 가드 X, 테스트 도구 교체* 로.

### 2. axial-flip 의 부호 캔슬
- **문제**: 금성 (axialTilt 177.4°) 이 다른 행성과 *같은 방향* 으로 자전 보임. 데이터 정확한데 시각 결과 반전.
- **원인**: 중간 group z축 177.4° 회전 → 좌표계 뒤집힘 → mesh.rotation.y 음수 회전이 외부 관찰자엔 양수로 보임. *axial tilt + rotation period 두 부호 수학적 캔슬*.
- **해결**: `lib/time.ts` 에 `getEffectiveRotationPeriod`. axialTilt > 90° && < 270° 면 period 부호 반전. NASA 데이터는 *원본 그대로 보존*.

### 3. useEffect 안 동기 setState — React 19 cascading render
- **문제**: `useEffect(() => setIsTouch(mq.matches), [])` 패턴이 React 19 ESLint 경고.
- **원인**: 첫 렌더 false → effect → setState → 두 번째 렌더. cascading.
- **해결**: `useSyncExternalStore` 도입. matchMedia 같은 외부 source 와 *tear 없이* 동기화. Zustand 가 내부적으로 쓰는 hook 의 *직접* 사용.

---

## 리팩토링 후보

- ControlPanel 의 `MOBILE_MAX_SPEED = 10_000` 실효 없음 (모든 속도가 ≤ 10,000). 인프라는 sub-2-7 위해 유지.
- leva 'Time (dev)' dropdown 이 ControlPanel 변경 시 자동 갱신 안 됨. sub-2-4 시점에 leva 제거 또는 양방향 동기 검토.
- OrbitPath 색상/투명도 토큰화 — sub-2-6 UI 마무리.
- Planet/Sun/Ring 의 useFrame 안 `useSolarSystemStore.getState()` 반복 — 캐싱 가능하지만 *현재 perf 영향 0* 이라 보류.

---

## 다음 sub-phase 적용 교훈

- 사용자 피드백 *수성/금성 멈춤, 목성 광속, 공전 불규칙* 은 *천문학적 진실* 이었음. *진실 vs 가독성* 트레이드오프 → **토글로 해결** 이 PRD §3 의 영혼 → sub-2-4 *진실 토글* 의 직접 동기.
- 기존 파일 만지기 전 *무조건 요청* 정착 (sub-2-2 회고에서 시작 → sub-2-3 에서 완전 정착).
- 다운로드 파일 형식 정착. 채팅 토큰 절약 + 권이건 적용 부담 감소.
- *결정 명확한 동안 갱신* (헌장 §9 Context Rot) vs *Light 9 묶음* — 후자가 토큰 절약. 둘 다 정당, 상황 따라 선택.

---

## 🌌 이번에 알게 된 우주의 한 조각

**케플러 제3법칙의 시각적 첫 만남**.

`공전 주기² ∝ 거리³`. 수성 (88일) vs 해왕성 (60182일) = **684배 시간 차이**. 거리는 77배 차이인데 시간은 684배 — *비선형 폭증*.

이건 케플러가 1619년 *Harmonices Mundi* 에서 발견한 그 법칙. 16년간 티코 브라헤의 정밀 관측 데이터를 분석하며, *원궤도 ❌ → 타원궤도 ✓* 와 *비선형 시간 관계* 를 깨달은 결정적 순간. 갈릴레오와 동시대인데도 갈릴레오는 원궤도 고집 — 케플러의 비선형 직관이 그만큼 반직관적.

권이건의 *"공전 속도가 불규칙해 보임"* 감각 → 17세기 인류가 처음 마주한 그 충격의 살아있는 재연.

**부가**:
- **수성 2:3 spin-orbit resonance** — 공전 2바퀴 = 자전 3바퀴
- **금성의 1년보다 긴 하루** — 솔라데이 117일 vs 공전 225일
- **천왕성 옆으로 누운 자전** — axial tilt 97.77° + retrograde
- **NASA 데이터의 이중 부호 표현** — axialTilt 와 rotationPeriod 둘 다로 retrograde 표현
- **IEEE 754 signed zero** — Phase 3 N-body 에서 또 만날 함정
- **React 19 useSyncExternalStore** — Zustand 마법의 정체
- **Hubble Deep Field** — 빈 우주 한 점에 3000개 은하

---

## 다음 sub-phase 시작점

**sub-2-4: 진실 토글 (거리 + 자전) + 전체 진실 프리셋 + 1.5초 보간**

- store 에 `scaleMode`, `rotationMode`, 보간 progress 추가
- `lib/scale.ts`: distanceExponent 보간 (0.5 ↔ 1.0)
- `lib/time.ts`: `getVisualRotationPeriod` 추가 (제곱근 압축)
- ControlPanel 에 토글 3개 추가 (자전 / 거리 / 프리셋)
- 1.5초 보간 (easeInOutCubic) → `lib/easing.ts` 신설
- 첫 PCTC Plan 핵심 질문: *"보간 progress 를 store 에 둘까, 컴포넌트 local 에 둘까?"*
