# sub-5-2 Check — ExoplanetPage: FilterPanel + PlanetTable + D3 ScatterPlot + PlanetDetail

> Phase 5 — Exoplanet · Issue #29 · 2026-06-16 · sub-5-2

---

## 🧪 Test

```
[Test] sub-5-2: ExoplanetPage — FilterPanel + PlanetTable + D3 scatter plot + PlanetDetail
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (모든 Light)
- D3 `vendor-d3` 청크 분리 확인 (`dist/` 빌드 출력)

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| `/exoplanet` 로드 — 5,000+ 점 D3 산점도 렌더 | ✅ |
| FilterPanel — 발견 방법 버튼 클릭 → scatter 즉시 필터 | ✅ |
| `Transit` 선택 → 점 4,000+ 유지, `Radial Velocity` → ~1,000 | ✅ |
| PlanetTable — 행성 이름 검색 | ✅ |
| ScatterPlot 점 클릭 → PlanetDetail 사이드 패널 표시 | ✅ |
| PlanetDetail — 이름, 발견 연도, 공전 주기, 반경, 항성 거리 표시 | ✅ |
| ResizeObserver — 창 크기 변경 시 산점도 재렌더 | ✅ |
| 60fps 산점도 인터랙션 (zoom/pan) | ✅ |

### 성공 기준 점검

- [x] D3 log-log scatter — x: 공전 주기, y: 행성 반경 (지구 반경), 색: 발견 방법
- [x] `FilterPanel` — `METHOD_COLOR` 기반 발견 방법 필터 버튼
- [x] `PlanetTable` — 이름/호스트 검색 + 발견 연도/크기 정렬 + 페이지네이션 (50행)
- [x] `PlanetDetail` — 점/행 클릭 시 사이드 패널 (PRD §3 상세 정보)
- [x] `getMethodColor` — D3 scatter · FilterPanel · 범례 색상 단일 소스
- [x] `vendor-d3` manualChunks 분리
- [x] `npm run build` 통과

---

## ✅ Check

```
[Check] sub-5-2: ExoplanetPage — scatter + table + detail panel
```

### 잘된 점

- **`getMethodColor` 단일 소스가 처음부터 맞았다.** `FilterPanel`의 버튼 색상,
  ScatterPlot 점 색상, 범례 색상이 모두 `METHOD_COLOR` 맵 + `getMethodColor` 헬퍼
  하나를 공유한다. 필터 버튼 색과 점 색이 동기화 안 된 버그를 구조적으로 원천 차단.
  Phase 6 `TransitInfo`의 amber 마커도 같은 "단일 색상 소스" 정신으로 이어짐.

- **D3 `useEffect` + `ResizeObserver` 패턴이 Phase 6 템플릿이 됐다.** `ScatterPlot`의
  `useRef<SVGSVGElement>` + `useEffect([planets, selectedMethod])` + `ResizeObserver`
  패턴을 한 번 정확히 만들었더니, Phase 6 `LightCurveChart` · `PhaseFoldChart` 작성 시
  동일 패턴을 그대로 복사 → 수정 가능. "첫 D3 컴포넌트가 템플릿"의 실제 결과.

- **5,000점 SVG scatter가 60fps를 유지했다.** 사전 측정이 중요했다: D3 SVG로 5,000개
  `<circle>`을 그렸는데 첫 렌더 후 Pan/Zoom 인터랙션에서 측정 결과 60fps 유지. Canvas
  전환 불필요 (measurement-first, YAGNI). 단, 첫 렌더는 ~300ms — 로딩 스피너 필요성
  인식.

- **선택 상태가 URL 없이 컴포넌트 local state로 충분했다.** Phase 2–4의 Zustand store
  경험 후 "전역 store 먼저" 반사가 있었는데, 필터/선택 상태는 ExoplanetPage 전용이라
  `useState`로 충분. Phase 5 TechSpec의 "프론트 상태는 React local" 결정이 옳았음.

### 막혔던 점 / 트러블슈팅

#### 1. D3 StrictMode 이중 실행 — 산점도 두 번 렌더

- **증상**: 첫 로드 시 산점도가 살짝 깜빡이고, DevTools에서 D3 effect가 두 번 실행됨.
  일부 `<circle>`이 두 번 추가되어 투명도 중복.
- **원인**: React StrictMode가 `useEffect`를 mount → unmount → mount 순서로 두 번
  실행. 첫 번째 실행의 D3 cleanup이 없으면 두 번째 실행이 기존 DOM 위에 덧붙임.
- **해결**: `useEffect` return에 `() => { d3.select(ref.current).selectAll('*').remove() }`
  cleanup 추가. Phase 5 TechSpec §7이 명시적으로 경고한 항목 — 처음부터 넣었어야 했다.
- **교훈**: StrictMode는 cleanup 없는 D3 effect를 즉시 폭로한다. 시각 컴포넌트에
  `useEffect` 넣을 때 cleanup을 동시에 작성할 것.

#### 2. D3 log scale — `pl_orbper: null` 값 처리

- **증상**: log scale x축에서 `pl_orbper = null` 행성이 있으면 `NaN` position으로
  SVG 밖 위치에 점이 찍힘. 일부 행성이 화면 바깥쪽 구석에 점으로 뭉침.
- **원인**: `d3.scaleLog()(null)` = `NaN`. SVG `cx` = `NaN` → 브라우저가 `cx=0`으로
  fallback.
- **해결**: scatter 전 `planets.filter(p => p.pl_orbper != null && p.pl_rade != null)`.
  null 필드 있는 행성 제외. 필터 전 6,000+ → 필터 후 4,800+.
- **교훈**: D3 스케일은 null/undefined 자동 처리 안 한다. 렌더 전 데이터 정제 필수.

#### 3. PlanetDetail 창 넓이 — 산점도 겹침

- **증상**: PlanetDetail 패널이 산점도 오른쪽 끝을 가림. 좁은 화면에서 점을 클릭할
  방법이 없어짐.
- **원인**: PlanetDetail를 `absolute right-0` 고정으로 구현했는데, ExoplanetPage의
  flex 레이아웃과 상호작용해 산점도 컨테이너를 줄이지 않고 위에 올라탐.
- **해결**: PlanetDetail를 flex row의 오른쪽 형제로 배치 (`w-80 flex-shrink-0`).
  산점도 컨테이너가 `flex-1`로 남은 너비 자동 점유. 패널 열림/닫힘에 따라 산점도
  너비가 자연스럽게 변하고 ResizeObserver가 재렌더.
- **교훈**: `absolute` vs flex 형제 선택은 "다른 요소에 영향을 주느냐"가 기준.
  D3 ResizeObserver 패턴이 있으면 flex 형제가 안전 — 크기 변화를 알아서 처리.

### 리팩토링 후보

- **`PlanetTable` 가상 스크롤** — 현재 페이지네이션 50행. 5,000행 전부 표시 시
  느림 (측정 안 함). sub-5-3 Lighthouse 시 성능 영향 확인 후 결정.
- **ScatterPlot hover tooltip** — 점 hover 시 행성 이름 tooltip. 현재 click-only.
  마우스 이벤트 처리 + D3 tooltip 패턴 추가 후보 (Phase 5 범위 확장).
- **FilterPanel 크기 필터** — PRD §3에 "크기 슬라이더"가 있으나 이번 sub-5-2에서
  구현 안 됨. sub-5-3 또는 별도 Light.
- **D3 cleanup 타이밍** — 현재 전체 SVG `selectAll('*').remove()` 후 재렌더. 데이터
  변경 시 D3 enter/update/exit 패턴으로 최적화 가능 — 지금은 YAGNI.

### 다음 sub-5-3에 적용할 교훈

- **TimelineView 데이터는 `by_year` 집계 — `/api/planets/stats` 기반.** 연도별 누적
  카운트가 있어야 D3 애니메이션 가능. stats 엔드포인트가 sub-5-1에 이미 구현됨.
- **Lighthouse 85+ 전략**: D3 `vendor-d3` 청크 분리가 이미 됨. 남은 항목은 폰트(Google
  Fonts CDN → 자체 호스팅)와 LCP. Phase 3/4의 `manualChunks` 패턴 계승.
- **선택 필터 → URL 파람 동기화** — Phase 6 DataPage가 `?planet=` URL 파람을 받으므로,
  ExoplanetPage의 PlanetDetail에서 "광도곡선 보기" 링크를 `/data?planet=...`으로
  연결하는 준비를 sub-5-3에서.

## 🌌 이번에 알게 된 우주의 한 조각

**5,000개의 점이 화면을 채울 때 — Transit bias의 가시화.**

D3 산점도에서 발견 방법별로 색을 나누면 Transit(파란 계열)이 압도적으로 많다. 그런데
Transit으로 발견된 행성들은 x축(공전 주기)이 짧은 쪽에 몰려있다. 이것이 Transit bias다:
별 앞을 지나는 각도가 관측자 시선과 정렬될 확률은 공전 반경에 반비례한다. 가까울수록
찾기 쉬운 것이다.

실제 지구-태양 시스템을 Transit으로 발견하려면 — 관측자가 황도면에 정렬되어야 한다.
모든 방향에서 지구를 Transit으로 발견할 확률: 태양 반경 / 지구 공전 반경 = 0.7 / 149 ≈
0.5%. 케플러 이전에 지구 같은 행성이 발견 안 된 이유가 D3 scatter 한 장으로 설명된다.

Phase 7의 BLS 알고리즘이 찾아야 할 신호의 어려움이 여기에 있다 — 길고 약한 주기에서
0.01% 밝기 변화를 잡아내야 한다.
