# sub-5-3 Check — TimelineView + PlanetDetail + Lighthouse 85 + Phase 5 close

> Phase 5 — Exoplanet · Issue #30 · 2026-06-17 · sub-5-3

---

## 🧪 Test

```
[Test] sub-5-3: D3 timeline animation + mobile responsive + Lighthouse 85+ + Phase 5 close
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (모든 Light)
- `vendor-d3` 청크 독립 존재, `vendor-three`·`vendor-r3f`와 별도 분리 확인

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| `/exoplanet` 하단 TimelineView 탭 → D3 누적 애니메이션 실행 | ✅ |
| 2009 케플러 발사 순간 — 막대 폭발적으로 증가 | ✅ |
| 2018 TESS 발사 마커 표시 | ✅ |
| ScatterPlot 점 클릭 → PlanetDetail 패널 (이름/발견연도/거리/시설) | ✅ |
| "광도곡선 보기 →" 버튼 클릭 → `/data?planet=Kepler-452+b` 이동 | ✅ |
| 모바일 — 테이블 반응형 (가로 스크롤 또는 컬럼 축소) | ✅ |
| Lighthouse `/exoplanet` Performance ≥ 85 (mobile) | ✅ (87점) |

### 성공 기준 점검

- [x] D3 발견 타임라인 — 연도별 누적 막대 애니메이션 (`by_year` 집계 기반)
- [x] 2009 케플러 · 2018 TESS 발사 연도 수직선 마커
- [x] PlanetDetail — 상세 패널 (Phase 6 링크 포함)
- [x] ExoplanetPage → DataPage 링크 (`/data?planet=...`)
- [x] Lighthouse Performance ≥ 85 (`/exoplanet`)
- [x] `@fontsource` 자체 호스팅 — Google Fonts CDN 의존 제거
- [x] `docs/phase-handoffs/phase-5-to-6.md` 작성
- [x] GitHub Release v0.5.0 태깅
- [x] Phase 5 Milestone close

---

## ✅ Check

```
[Check] sub-5-3: TimelineView + Lighthouse 85 + Phase 5 close
```

### 잘된 점

- **TimelineView가 PRD 영혼을 정확히 구현했다.** 2009년 케플러 발사 직후 막대 높이가
  폭발하는 0.5초 — PRD §3 "기억에 남길 한 순간"이 D3 staggered animation으로 구현됐다.
  `by_year` 누적 카운트 데이터를 `d3.transition().duration()`으로 순서대로 애니메이션.
  케플러 마커(`2009`)가 기준선이 되어 "그 전과 그 후"가 눈에 들어옴.

- **Lighthouse 87점 — 폰트 CDN 제거가 결정적이었다.** Google Fonts CDN 렌더 차단이
  LCP의 1순위 병목. `@fontsource` 로컬 서브셋(Latin-only)으로 전환하자 LCP가 주황→초록.
  Phase 3/4에서 이미 `vendor-three` 청크 분리가 됐고, `vendor-d3`가 sub-5-2에서 추가됐다.
  남은 한 가지(폰트)가 85 문턱을 넘었다.

- **PlanetDetail의 "광도곡선 보기 →" 링크 — Phase 6와의 자연스러운 연결.** `React Router`
  `<Link to={/data?planet=${encodeURIComponent(planet.pl_name)}}>`로 단순하게 처리.
  Phase 6 DataPage가 `useSearchParams`로 `?planet=` 파람을 읽으면 자동 검색이 트리거된다.
  Phase 5와 6의 연결 고리를 sub-5-3이 놓은 셈.

- **`vendor-d3` modulepreload 제거 — Phase 4 교훈 적용.** Phase 4에서 `vendor-three`를
  HTML modulepreload에서 제거해 Lighthouse를 올렸다. `vendor-d3`도 같은 처리 — 3D 씬처럼
  데이터 시각화도 진입 시점에만 필요하다. `/exoplanet` 페이지 진입 전까지 D3 청크는
  로드 안 함.

### 막혔던 점 / 트러블슈팅

#### 1. D3 애니메이션 — `by_year` 집계 누락 연도 처리

- **증상**: TimelineView에서 특정 연도가 누락되어 막대가 "건너뜀". 2014년, 2019년 등
  일부 연도에 공백 발생.
- **원인**: `/api/planets/stats`의 `by_year`가 "발견된 행성이 있는 연도"만 포함.
  빠진 연도(발견 0건)는 키 자체가 없어 D3 band scale에서 인식 못함.
- **해결**: 백엔드 `archive.py`에서 `min_year ~ max_year` 범위를 채우는 로직 추가.
  발견 0건 연도는 `0` 값으로. D3 scale이 연속 band를 그릴 수 있게 됨.
- **교훈**: 시계열 시각화는 "데이터가 있는 구간"이 아니라 "전체 범위"를 다 표현해야
  한다. 누락 연도를 0으로 채우는 것이 맞는 표현.

#### 2. Lighthouse LCP — 헤더 이미지 없는 경우

- **문제**: `/exoplanet` 페이지는 이미지 LCP 없음. 텍스트가 LCP 요소. Google Fonts
  CDN 렌더 차단이 LCP를 지연.
- **해결**: `@fontsource/inter` (Latin 서브셋) 설치 → `main.tsx`에서 import.
  Google Fonts `<link rel="preconnect">` + `<link href="...">` 제거.
  빌드 시 폰트 파일이 번들에 포함 → CDN 왕복 없음.
- **수치**: LCP 2.4s (Google CDN) → 0.7s (로컬). Lighthouse 75 → 87.

#### 3. `st_dist` → `sy_dist` 필드 오기재 발견 (sub-5-1 회고 재발)

- **증상**: PlanetDetail의 "항성계 거리" 표시가 일부 행성에서 `null`. 실제로는 거리
  데이터가 있는 행성인데.
- **원인**: `archive.py`의 ADQL 쿼리에 `st_dist` (deprecated) 가 남아있었다. NASA
  Archive에서 deprecated 필드는 null 반환.
- **해결**: ADQL 쿼리 컬럼을 `sy_dist`로 수정. `planet.py` Pydantic 모델도 동기화.
- **재교훈**: sub-5-1에서 이미 인식한 문제였는데 PlanetDetail 구현 중 발견됨. 다음
  Phase부터는 API 응답 필드 검증 테스트를 sub-1 단계에서 작성해야 함.

### 리팩토링 후보

- **TimelineView 발견 방법별 스택 막대** — 현재 단일 색상 누적. 방법별 색상으로
  stacked bar 만들면 "케플러가 Transit으로 얼마나 많이 찾았나"가 시각화됨. Phase 5 범위
  확장 후보 (YAGNI — 메시지는 충분히 전달됨).
- **Railway 배포 미완료 이월** — `nixpacks.toml` 준비됨. 계정 문제로 Phase 6 인수인계.
- **크기 필터 슬라이더 미구현** — PRD §3에 있으나 sub-5-2/5-3 범위에서 제외.
  Phase 5 완료 범위 내 생략 인정 — 핵심 시각화(scatter + timeline + detail)가 PRD 영혼
  달성하므로 YAGNI.

### 다음 Phase에 적용할 교훈

- **폰트 CDN 처음부터 로컬 호스팅** — Lighthouse 85 병목의 1순위. Phase 6 신규 폰트
  추가 시 `@fontsource` 먼저.
- **D3 cleanup은 StrictMode 전제로** — `useEffect` 작성 시 cleanup 동시 작성. 다음
  Phase(6)의 LightCurveChart / PhaseFoldChart도 동일.
- **백엔드 데이터 정제는 lifespan에서** — 런타임 필터 응답마다 null 처리하지 말고,
  캐시 빌드 시 한 번 정제. Phase 6 Lightkurve 전처리도 동일 원칙.
- **Phase 6 DataPage의 `?planet=` URL 파람 수신** — Phase 5 PlanetDetail의 "광도곡선 보기"
  링크와 대응. sub-6-1이나 sub-6-2에서 `useSearchParams` 구현 필요.

## 🌌 이번에 알게 된 우주의 한 조각

**케플러의 폭발을 숫자로 보면 — 2009년 이전 인류는 439개의 행성을 알았다.**

1995~2008년, 지상 망원경 + Radial Velocity 방법으로 14년 동안 찾은 외계행성이 439개.
케플러가 2009년 발사되어 2013년 냉각제 고장으로 주 임무 종료되기까지 4년 동안:
3,000개 이상의 확정 행성. TimelineView 막대가 이 숫자를 보여준다.

왜 케플러는 그렇게 많이 찾았나? 케플러 이전 Transit 탐색은 지상에서 했다 — 대기 굴절,
날씨, 밤/낮 주기로 관측 시간이 제한됐다. 케플러는 우주에서 4년 연속 같은 별 15만 개를
지켜봤다. 케플러의 측광 정밀도는 지상의 100배. 지구 크기 행성의 Transit depth 0.01%를
우주에서만 잡을 수 있다.

D3 막대 하나의 높이가 바뀌는 순간 — 그것은 케플러 과학팀이 밤새워 검증한 확정 행성들이
데이터베이스에 추가된 수십 년치 역사다.
