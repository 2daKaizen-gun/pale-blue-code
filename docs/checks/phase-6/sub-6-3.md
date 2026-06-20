# sub-6-3 Check — TransitInfo + ExoplanetPage link + Lighthouse + Phase 6 close

> Phase 6 — Data · Issue #33 · 2026-06-21 · sub-6-3

---

## 🧪 Test

```
[Test] sub-6-3: TransitInfo panel + ExoplanetPage -> DataPage link + perf fix
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (Light D-1 ~ D-4)
- 빌드 후 `vendor-r3f` 외 3D 청크 없음 — 메인 번들에 `vendor-r3f` static import 없음 확인

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| `/exoplanet` → 행성 클릭 → PlanetDetail에 "광도곡선 보기 →" 버튼 노출 | ✅ |
| "광도곡선 보기" 클릭 → `/data?planet=Kepler-452+b` 으로 이동 | ✅ |
| `/data?planet=Kepler-452+b` 로 직접 진입 시 자동 검색 실행 | ✅ |
| Phase Fold 탭 → TransitInfo 패널 (depth, 추정 반경, 공전 주기) 표시 | ✅ |
| Transit depth 0.XXX% 포맷, 추정 반경 ~X.XX R⊕ 포맷 | ✅ |
| catalog 반경 있으면 "Known Radius" 행에 표시 | ✅ |

### 성공 기준 점검

- [x] ExoplanetPage → "광도곡선 보기" → DataPage loads that planet's light curve
- [x] TransitInfo: transit depth %, estimated radius, known catalog radius
- [x] `npm run build` 통과 — vendor-r3f만 3D 청크로 존재
- [x] manualChunks 버그 수정 — 전 페이지 vendor-three(1MB) 로딩 제거
- [x] `docs/phase-handoffs/phase-6-to-7.md` 작성
- [x] GitHub Release v0.6.0 태깅

---

## ✅ Check

```
[Check] sub-6-3: TransitInfo + ExoplanetPage link + Phase 6 close
```

### 잘된 점

- **URL 쿼리 파라미터 연동이 깔끔하게 됐다.** `useSearchParams`로 `?planet=` 읽는 로직이
  `useEffect + initialPlanet` 패턴으로 마운트 시 자동 검색까지 연결됐다. 외부(ExoplanetPage)에서
  `/data?planet=Kepler-452+b`로 진입하면 바로 그 행성의 광도곡선이 뜬다. Phase 5 → Phase 6
  연결이 자연스럽다.

- **TransitInfo의 "추정 반경"이 교육적 포인트가 됐다.** 실제 트랜짓 광도곡선에서
  `δ = (Rp/R*)²` 공식으로 행성 반경을 추정하는 게 바로 케플러가 쓴 방법. 카탈로그에 있는
  "Known Radius"와 비교해보면 얼마나 정확한 추정인지 바로 확인된다.

### 막혔던 점 / 트러블슈팅

#### 1. vendor-three가 모든 페이지에서 로드됨 (Lighthouse 56점)

- **증상**: Lighthouse /exoplanet 56점. critical path에 `vendor-three.js`(293 KiB gzip)가
  `index.js` 의 정적 의존성으로 포함됨. 모든 페이지에서 1MB Three.js 로딩.
- **원인**: `manualChunks` 조건 순서 버그.
  ```js
  if (id.includes('three')) return 'vendor-three'   // @react-three도 매칭
  if (id.includes('@react-three')) return 'vendor-r3f'  // 도달 불가
  ```
  `@react-three/fiber`가 'three'를 포함하므로 R3F가 vendor-three로 들어감.
  Rolldown이 R3F의 peer dep React를 같은 청크에 co-locate → 메인 번들이 React를
  resolve하기 위해 vendor-three를 static import → 모든 페이지 로딩.
- **해결**: `@react-three` 조건을 `/three/` 경로 매칭보다 먼저 체크.
  Three.js + R3F가 `vendor-r3f`에 합쳐지고, 메인 번들에서 3D 청크 참조 완전히 제거.

### 리팩토링 후보

- **TransitInfo 추정 반경의 R* 가정**: 현재 R* = 1 R_sun 고정. Phase 7에서 항성 데이터를
  추가하면 실제 R* 값으로 개선 가능.
- **Transit duration**: `PhaseFoldResponse.transit_duration` 필드가 있지만 현재 None
  반환. 행성 카탈로그에서 `pl_trandur` 필드를 backend에 추가하면 채울 수 있음.

### 다음 Phase에 적용할 교훈

- **manualChunks 조건 순서가 청크 의존성을 바꾼다.** Rolldown에서 manual chunk에 들어간
  모듈의 peer dep이 같은 청크에 co-locate될 수 있다. 더 구체적인 경로 (`/three/`)와
  정확한 순서가 필수.
- **PCTC 순서(Plan → Issue → Code)를 반드시 지킨다.** sub-6-2, 6-3에서 코드 먼저
  짜고 이슈를 나중에 만든 실수. 다음 Phase부터는 Issue 생성 없이 코드 착수 금지.

---

## 🌌 이번에 알게 된 우주의 한 조각

**트랜짓 깊이 하나에서 행성 크기를 읽어낸다 — 케플러의 진짜 마법.**

트랜짓 광도곡선에서 관측되는 건 별빛이 X% 어두워진다는 사실뿐이다. 그런데
`δ = (Rp / R*)²` 한 줄로 행성 반경이 나온다. Kepler-452 b의 경우 transit depth ≈ 0.02%,
R* ≈ 1.1 R_sun이라면 Rp ≈ sqrt(0.0002) × 1.1 × 109 R_earth ≈ 1.6 R_earth.

이 숫자 하나를 얻기 위해 케플러 위성은 4년 동안 같은 별을 30분마다 측정했다. 15만 개의
별을 동시에. 그리고 그중 0.0002의 밝기 변화를 잡아냈다. 인류 역사상 가장 꼼꼼한 관찰.
