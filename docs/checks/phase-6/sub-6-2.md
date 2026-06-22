# sub-6-2 Check — DataPage: D3 LightCurveChart + PhaseFoldChart

> Phase 6 — Data · Issue #32 · 2026-06-20 · sub-6-2

---

## 🧪 Test

```
[Test] sub-6-2: DataPage — LightCurveChart (raw) + PhaseFoldChart + PlanetSearchBar
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (모든 Light)
- TypeScript strict 모드 + `noUnusedLocals` 통과

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| `/data` 진입 → PlanetSearchBar 자동완성 작동 | ✅ |
| "Kepler-452 b" 검색 → LightCurveChart 렌더 (5,000점 시계열) | ✅ |
| LightCurveChart x축: BKJD days, y축: normalized flux (1.0 기준) | ✅ |
| LightCurveChart 줌/팬 — D3 zoom behavior | ✅ |
| "Phase Fold" 탭 클릭 → PhaseFoldChart 렌더 | ✅ |
| PhaseFoldChart — U자 transit dip 선명히 보임 | ✅ |
| PhaseFoldChart transit 최저점에 amber 마커 표시 | ✅ |
| 창 크기 변경 → ResizeObserver 재렌더 | ✅ |

### 성공 기준 점검

- [x] `DataPage.tsx` — PlanetSearchBar + 탭 전환 (Raw / Phase Fold)
- [x] `LightCurveChart.tsx` — D3 시계열 (useRef + useEffect + ResizeObserver)
- [x] `PhaseFoldChart.tsx` — D3 위상 접기 (0~1 phase, binned flux)
- [x] `PlanetSearchBar.tsx` — 자동완성 (Phase 5 planets 목록 기반)
- [x] `frontend/src/lib/api/lightcurve.ts` — `fetchLightCurve` + `fetchPhaseFold`
- [x] D3 zoom behavior — LightCurveChart x축 줌/팬
- [x] amber 마커 — transit dip 최저점 수직선
- [x] React.lazy 라우팅 — `/data` 청크 분리
- [x] `npm run build` 통과

---

## ✅ Check

```
[Check] sub-6-2: DataPage — LightCurveChart + PhaseFoldChart
```

### 잘된 점

- **Phase 5 D3 패턴의 정확한 계승.** `ScatterPlot.tsx` 패턴(useRef + useEffect +
  ResizeObserver + cleanup)이 `LightCurveChart.tsx`로 복사→수정 됐다. D3 zoom behavior,
  x/y축 설정, cleanup 코드가 처음부터 올바르게 들어감 — Phase 5에서 StrictMode 이중
  실행 버그를 겪었기 때문에 이번엔 cleanup을 처음부터 넣었다.

- **PhaseFoldChart의 U자 dip이 PRD 영혼을 정확히 구현했다.** Phase Fold 탭을 클릭하는
  0.5초 — 흩어진 잡음이 선명한 U자로 수렴하는 그 순간. 200 bins의 binned flux가 D3
  line chart로 그려지면 transit dip이 또렷하게 보인다. amber 마커(`transit_depth > 0`
  조건)가 그 최저점을 강조. PRD §3 "기억에 남길 한 순간"의 구현.

- **PlanetSearchBar의 자동완성 — Phase 5 planets 캐시 재사용.** `fetchPlanets()`를
  DataPage mount 시 한 번만 호출해 행성 이름 목록 확보. HTML `<datalist>` + `<input>`
  조합으로 브라우저 네이티브 자동완성. React 라이브러리 없이 가볍게 구현.

- **탭 전환 상태가 단순했다.** `activeTab: 'raw' | 'fold'` — `useState` 한 줄. 탭마다
  다른 컴포넌트가 렌더되고, D3 cleanup이 `useEffect deps` 변화를 통해 자연스럽게 처리.
  Zustand 전역 store 불필요 — "컴포넌트 local state가 맞는 선택"의 또 다른 확인.

### 막혔던 점 / 트러블슈팅

#### 1. D3 zoom — 탭 전환 시 이전 zoom state 유지 문제

- **증상**: LightCurveChart에서 줌인한 뒤 Phase Fold 탭으로 전환하고 돌아오면 zoom이
  초기화되어있음. 사용자가 zoom 상태를 유지하고 싶을 수 있는데.
- **원인**: 탭 전환 시 LightCurveChart가 unmount → remount됨. `useEffect` cleanup이
  D3 zoom behavior까지 초기화.
- **결정**: zoom 상태 유지를 구현하지 않기로. 탭 전환 후 돌아오면 새로 시작 — PRD §3
  에서 "zoom 유지"는 명시적 요구사항이 아니다. YAGNI.
- **교훈**: 사용자가 "기대할 수 있는" 기능이라도 PRD에 없으면 구현하지 않는다.
  "있으면 좋을 것 같은데" 은 YAGNI의 전형.

#### 2. LightCurveChart y축 — outlier로 인한 스케일 깨짐

- **증상**: 일부 행성의 광도곡선에서 y축 범위가 [0.8, 1.3]이어야 하는데 [0.5, 1.5]로
  넓게 펴짐. transit dip이 시각적으로 눌려서 잘 안 보임.
- **원인**: 서버 `remove_outliers(sigma=5)` 후에도 5σ 안에 있는 큰 outlier가 남아있음.
  D3 `extent()`가 그 extreme 값까지 포함해 domain 계산.
- **해결**: 프론트엔드에서도 y축 domain을 `[p05(flux) - margin, p95(flux) + margin]`
  (5th ~ 95th percentile + 여유)으로 클램핑. 대부분의 데이터가 잘 보이는 범위 우선.
- **교훈**: 서버사이드 정제 + 프론트사이드 시각화 두 단계 모두에서 이상값 처리가 필요.
  서버가 "데이터 정제", 프론트가 "시각화 최적화" 담당.

#### 3. PhaseFoldChart x축 — phase 0~1 vs -0.5~0.5 선택

- **문제**: phase를 0~1로 표시하면 transit dip이 특정 phase 값 주변에 위치. 어디가
  transit 중심인지 직관적으로 모름.
- **결정**: 서버에서 `fold(center_time=t0)`로 transit 중심을 0으로 맞추면 dip이 중앙에.
  그러나 t0 추정이 필요해 복잡도 증가. Phase 6 범위에서는 0~1 그대로 유지 + amber
  마커로 dip 위치 강조. 사용자는 마커가 있어서 "저기가 transit"을 알 수 있음.
- **교훈**: "보기에 좋은 것"이 "구현이 간단한 것"과 다를 때, PRD 영혼이 먼저.
  "U자 선명하게 보임"은 달성됐으므로 충분.

### 리팩토링 후보

- **LightCurveChart zoom state 유지** — 탭 전환 시 zoom 보존. React context 또는
  DataPage state로 zoom transform 올리면 가능. Phase 6 범위 밖 — YAGNI.
- **PhaseFoldChart x축 centering** — transit 중심을 phase=0으로 맞추기. t0 추정 필요.
  Phase 7 BLS가 t0를 반환하면 자연스럽게 구현 가능.
- **LightCurveChart transit dip 시각 마커** — raw 시계열에서 known period로 expected
  transit 위치 표시. 현재는 Phase Fold에서만 마커. Phase 7 이후 BLS period 활용 시 추가.
- **PlanetSearchBar debounce** — 현재 `onChange`마다 즉시 자동완성. 500ms debounce
  추가 시 렌더 감소 (지금은 datalist 네이티브라 부담 낮음 — YAGNI).

### 다음 sub-6-3에 적용할 교훈

- **TransitInfo 컴포넌트** — `transit_depth`, `transit_duration`, 추정 반경 표시.
  `transit_depth = PhaseFoldData.transit_depth` (서버에서 계산). 추정 반경: `δ =
  (Rp/R*)²`, R* = 1 R_sun 가정 → Rp = sqrt(δ) × 109 R_earth.
- **ExoplanetPage → DataPage 링크** — PlanetDetail의 "광도곡선 보기 →" 버튼이 sub-5-3에서
  이미 구현됨. DataPage의 `useSearchParams`로 `?planet=` 파람 읽어 자동 검색 트리거.
- **Lighthouse — manualChunks 버그 주의.** sub-6-3 Lighthouse 측정 전 빌드 청크 분리
  상태 먼저 확인. `vendor-r3f`에 React가 포함되는 문제가 있으면 모든 페이지에 3D 번들이
  로드됨 (이미 Phase 3/4에서 한 번 겪은 패턴 변형).

## 🌌 이번에 알게 된 우주의 한 조각

**위상 접기 (Phase Folding) — 잡음 속에서 신호를 불러내는 마법.**

Kepler-452 b의 광도곡선은 4년치 65,000개 밝기 값이다. transit은 384.84일마다 한 번,
지속 시간 ~10시간. 4년에 약 4번 transit이 일어났다. 그 4번의 dip이 65,000개 포인트에
흩어져있으면, 눈으로 보기 어렵다.

Phase folding은 `t mod T` — 시간을 공전 주기로 나눈 나머지다. 이렇게 하면 "같은 공전
위상에 있는 관측값"들이 한 점으로 쌓인다. 4번의 transit이 phase=0.5 근처로 모두 정렬되고,
transit이 아닌 수천 개의 관측값들이 양쪽에 쌓여 평균 noise를 만든다.

결과: transit dip의 신호 대 잡음비(S/N)가 √N배 향상. N=4번 transit → S/N 2배.
케플러 과학팀은 실제로 이 과정을 거쳐 "이것이 진짜 transit인가, 잡음인가"를 판단했다.
우리 D3 PhaseFoldChart가 표시하는 U자 하나 — 그것이 케플러 과학의 핵심 검증 도구다.
