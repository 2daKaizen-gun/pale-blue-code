# [Check] sub-7-2: SignalPage 프론트엔드

**날짜**: 2026-06-25
**Issue**: #35
**결과**: ✅ 성공

---

## 잘된 점

- Phase 6 D3 패턴(`useRef + useEffect + ResizeObserver + cleanup`) 그대로 계승 — PeriodogramChart 구조가 LightCurveChart와 거의 동일
- `bls.ts` API 클라이언트가 `lightcurve.ts`와 동일 패턴 — `VITE_API_BASE_URL` + `encodeURIComponent`, 에러 바디 파싱 포함
- `useState(!!initialPlanet)`로 URL param 있을 때 초기 로딩 상태 세팅 — 빈 화면 flash 없음
- D3 log scale x축에 `tickValues([1, 2, 5, 10, 20, 50, 100, 200, 500])` 고정 — 10,000 포인트 auto-tick보다 훨씬 읽기 쉬움
- `manualChunks` `@react-three` → `/three/` 순서 건드리지 않음 — vendor-d3 chunk 그대로 분리 유지

---

## 막혔던 점

### 1. useEffect 내 동기 setState 린터 경고

- **문제**: `useEffect(() => { if (initialPlanet) search(initialPlanet) }, [...])` → Biome lint: "Avoid calling setState() directly within an effect" — `search` 함수가 내부에서 `setLoading(true)`를 동기 호출하기 때문
- **원인**: `search` 콜백은 async이지만 `setLoading(true)`는 첫 번째 `await` 이전에 동기적으로 실행됨 — effect 본문에서 setState가 동기적으로 호출된 것과 동일
- **해결**: 두 경로 분리
  - **자동 탐색** (URL param): `useState(!!initialPlanet)`으로 초기 로딩 상태 설정, effect 안에서 `fetchBLS().then().catch()`로만 setState (비동기 콜백 안에서만)
  - **수동 탐색** (버튼): event handler에서 `search()` 호출 — effect가 아니므로 lint 규칙 적용 대상 아님

---

## 리팩토링 후보

- `PeriodogramChart`의 `d3.line().defined()` 조건에서 `p >= 1 && p <= 500` 하드코딩 → 상위에서 도메인 prop으로 받는 게 더 유연함 (현재 비즈니스 요건에는 충분)
- `BLSResultCard`의 duration 계산식 `best.duration * 24`는 서비스가 duration을 days로 반환한다는 가정에 의존 — 공식 문서/주석 없이 암묵적. 향후 TESS 지원 시 확인 필요

---

## 다음 sub-phase (Phase 8) 교훈

- SignalPage auto-search(`?planet=`) → DataPage auto-search와 동일 흐름이지만 lint 규칙이 다르게 트리거됨 — Phase 8 HuntPage에도 동일 패턴 적용 시 처음부터 분리된 effect 구조로 작성할 것
- D3 log scale에서 `d3.line().defined()`은 필수 — period = 0 포함 시 log(0) = -Infinity로 path가 깨짐

---

## 🌌 이번에 알게 된 우주의 한 조각

**주기도그램(Periodogram)은 "모든 가능한 음정에 대해 화음이 얼마나 잘 맞는가"를 그린 그래프다.**

BLS는 10,000개의 후보 주기 각각에 대해 "이 주기대로 transit이 있다면 데이터가 얼마나 잘 맞아떨어지는가"를 점수로 매긴다. 대부분의 주기에서는 별빛이 들쭉날쭉하게 맞지 않아 낮은 점수가 나온다. 그러나 행성의 진짜 주기에 이르면 65,000개의 밝기 측정값이 일제히 같은 위상에서 dip을 만들어내고 — 점수가 뾰족하게 솟는다.

케플러 위성이 4년 동안 한 일이 정확히 이것이다. Kepler-7 b의 경우 4.886일마다 반복되는 2.46%의 dip이 299번 쌓여 그 피크를 만들어냈다. 주기도그램에서 그 피크가 솟아오르는 순간이 바로 — 행성이 스스로 손을 드는 순간이다.
