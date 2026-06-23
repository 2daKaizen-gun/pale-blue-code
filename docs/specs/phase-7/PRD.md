# Phase 7 PRD — Signal

> *작성일: 2026-06-22*
> *상태: Draft → sub-7-1 진입 시 Confirmed*
>
> *결정 메모 (Phase 7 첫머리)*: 데이터 소스 = **Phase 6 PDCSAP_FLUX 캐시 직접 재사용**.
> MAST 재호출 없음. BLS 라이브러리 = **astropy `TimeSeries.BoxLeastSquares`** (Lightkurve에
> 이미 내장, 추가 설치 불필요). 프론트 시각화 = **D3.js v7** (Phase 6 패턴 계승).

---

## 1. 한 문장 요약

**방문자는 별빛의 반복 패턴 속에서 행성을 스스로 찾아내는 알고리즘이 실제로 어떻게 동작하는지를 보고, 잡음 바다에서 하나의 신호가 손을 드는 순간을 직접 경험한다.**

---

## 2. 동기 (Why)

Phase 6는 이미 발견된 행성(Kepler-452 b)의 광도곡선을 *보여줬다*. 공전 주기를 미리 알고 위상 접기를 했다. U자 transit dip이 선명했다.

그런데 현실에서 케플러 위성은 그 주기를 *몰랐다.* 케플러 위성이 실제로 한 일은 이것이다:

> 아무것도 모르는 채로 65,000개의 밝기 값을 받아, 그 안에서 반복하는 패턴을 수학으로 찾아내는 것.

**그 수학이 BLS (Box Least Squares) 알고리즘이다.**

BLS는 가능한 모든 공전 주기에 대해 "이 주기라면 transit이 얼마나 잘 설명되나"를 점수로 환산한다. 점수 그래프(주기도그램, periodogram)에서 뾰족하게 솟아오른 주기가 *진짜 행성의 주기*다.

Phase 7는 그 탐색 과정을 라이브로 보여준다.

- Phase 6 DataPage에서 이미 PDCSAP_FLUX 광도곡선이 있다
- "주기 탐색" 버튼 → BLS 실행 → 주기도그램 등장
- Kepler-452 b를 시험하면 BLS가 384.84일 근처에서 정확히 솟아오른다
- *"이렇게 행성을 찾는구나"*

**Phase 6가 원본 녹음 파일이었다면, Phase 7는 그 파일에서 패턴을 찾는 탐지기다.**

---

## 3. 사용자 시나리오

**60초 시나리오**:

1. **(0~5s)** `/data` 페이지, Kepler-452 b 광도곡선이 표시된 상태. Phase Fold 탭 아래 새 버튼: **"주기 탐색 →"** (또는 "Find Period")

2. **(5~20s)** 버튼 클릭 → 로딩 메시지: *"65,000개 밝기 데이터에서 반복 신호 찾는 중…"* → D3 주기도그램 등장. x축 = 공전 주기(일, 로그 스케일), y축 = BLS 파워. 대부분 평탄하다가 한 곳에서 뾰족한 피크.

3. **(20~35s)** 피크에 자동 마커: **"최우선 후보: 384.8일"**. 아래 카드: 공전 주기 추정값, transit 깊이, transit 지속 시간.

4. **(35~60s)** "이 주기로 위상 접기" 버튼 → Phase Fold 탭으로 전환 + BLS가 찾은 주기로 접기. 알려진 주기(384.84일)와 BLS 주기가 일치하는 것을 U자 dip으로 눈으로 확인.

**기억에 남길 한 순간** (PRD의 영혼):

> *주기도그램에서 하나의 피크가 솟아오르는 그 순간* — 잡음 바다에서 신호 하나가 손을 든다. 케플러 위성이 4년간 15만 개 별을 보며 실제로 한 일이 바로 이것.

---

## 4. 범위

### ✅ 포함

1. **BLS 알고리즘 백엔드** — `backend/services/bls.py`. 입력: Phase 6 광도곡선 캐시. 출력: 주기도그램(periods, powers), 최우선 후보(period, duration, depth, t0). (7-1)

2. **`GET /api/bls/{planet_name}` 엔드포인트** — BLS 결과 JSON 반환. BLS 결과도 파일 캐시 (`backend/cache/bls_*.json`). (7-1)

3. **BLS 정확도 검증** — Kepler-452 b (known period = 384.84d)로 BLS 최우선 피크 ±1일 이내 확인. (7-1)

4. **D3 주기도그램 차트** (`PeriodogramChart.tsx`) — x: 공전 주기(일, 로그 스케일), y: BLS 파워. 피크 자동 마커. Phase 6 D3 패턴 계승. (7-2)

5. **BLS 결과 카드** (`BLSResultCard.tsx`) — 최우선 주기, transit 깊이, transit 지속 시간 추정. (7-2)

6. **SignalPage 구현** (`/signal`) — PlanetSearchBar + "주기 탐색" 버튼 + PeriodogramChart + BLSResultCard. 기존 placeholder 대체. DataPage PhaseFold 탭에 "→ Signal" 링크 추가. (7-2)

### ❌ 제외

- **미발견 행성 탐색** — Phase 8. 이 Phase는 이미 알려진 행성으로 알고리즘 검증에 집중.
- **TESS 데이터 BLS** — Kepler 캐시 데이터로 한정. TESS fallback은 Phase 6 로직 그대로.
- **다중 피크 비교 UI** — YAGNI. 최우선 후보 1개만.
- **BLS 파라미터 노출** (주기 범위, duration 후보 등) — 사용자 조정 없음. 서버 내부 고정.
- **실시간 Railway 배포** — 로컬 실행 전제 (Phase 5~6 미완료 상태 그대로).

---

## 5. 성공 기준

### 정성적

- *주기도그램 피크 하나가 솟는 순간*이 인상에 남는다
- *"케플러가 이렇게 찾았구나"* 의 실감이 온다
- Phase 6 광도곡선 → Phase 7 주기 탐색 흐름이 자연스럽다

### 정량적

- **BLS 정확도**: Kepler-7 b 최우선 피크가 알려진 주기(4.886일) ±0.01일 이내
- **BLS 실행 시간**: 캐시 미스 < 60초 (astropy BLS, 서버 1 코어)
- **캐시 히트**: < 200ms
- **D3 주기도그램 렌더**: 응답 받은 후 < 1초
- **`npm run build` 통과**: 매 커밋

---

## 6. 비기능 요구사항

- **백엔드 재사용**: Phase 6 FastAPI + 신규 라우터 추가. 별도 서비스 불필요.
- **광도곡선 캐시 재사용**: BLS는 `mast.py`의 기존 캐시(`lc_*.json`)에서 flux 읽기. MAST 재호출 없음.
- **BLS 결과 캐시**: `backend/cache/bls_*.json` — Phase 6 `lc_*.json` 패턴 동일.
- **라이브러리**: `astropy.timeseries.BoxLeastSquares` (Lightkurve 의존으로 이미 설치됨).
- **D3 패턴**: Phase 6 `LightCurveChart.tsx`와 동일한 `useRef + useEffect + ResizeObserver`.
- **manualChunks 순서**: `@react-three` → `/three/` 순서 절대 변경 금지.

---

## 7. 천문학 — Phase 7에서 배우는 것

| 개념 | 비유 |
|------|------|
| BLS (Box Least Squares) | "이 주기라면 transit이 이 모양이어야 한다"는 상자를 데이터에 맞춰보는 것. 가장 잘 맞는 상자 = 진짜 주기. |
| 주기도그램 (Periodogram) | 모든 가능한 주기에 대한 신호 강도 그래프. 행성의 주기에서 뾰족하게 솟는다. |
| BLS 파워 | "이 주기를 가정했을 때 데이터가 얼마나 잘 설명되나"의 점수. 높을수록 강한 신호. |
| 주기 탐색 범위 | 1~500일 로그 격자. Hot Jupiter(짧은 주기)부터 Earth-like(긴 주기)까지. |
| 알고리즘 검증 | 케플러 위성이 한 일의 재현: 주기를 모르는 상태에서 BLS로 찾아서, 알려진 주기와 일치하는지 확인. |

---

*"PRD는 이 Phase의 북극성이다. 흔들릴 때 여기로 돌아온다."*
*"Phase 6가 별의 노래를 들었다면, Phase 7는 그 노래에서 행성의 주기를 찾는다."*
