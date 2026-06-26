# Phase 8 PRD — Hunt

> *작성일: 2026-06-26*
> *상태: Draft → sub-8-1 진입 시 Confirmed*

---

## 1. 한 문장 요약

**방문자는 아직 아무도 확인하지 않은 케플러 별에 BLS를 직접 겨냥해 신호를 찾아내고, 그 결과를 NASA KOI 카탈로그와 대조함으로써 실제 시민 과학 기여의 첫 걸음을 밟는다.**

---

## 2. 동기 (Why)

Phase 6는 이미 알려진 행성의 광도곡선을 봤다.
Phase 7는 알려진 행성에 BLS를 돌려 알고리즘을 검증했다.

**Phase 8에서는 아무도 확인하지 않은 별에 BLS를 직접 겨냥한다.**

케플러 위성은 2009~2013년 동안 약 150,000개의 별을 관측했다. 그 중 확인된 행성(Confirmed)은 약 2,600개. 케플러 파이프라인이 "후보(Candidate)"로 분류한 것은 수천 개이고, 상당수는 아직 확인되지 않았다. 케플러 데이터는 2013년에 끝났지만, 분석은 아직 끝나지 않았다.

> 시민 과학자들이 NASA 공식 파이프라인이 놓친 후보를 발견하는 일이 지금도 일어나고 있다.

Phase 8는 그 가능성 앞에 선다:

- 케플러 별 하나를 고른다
- 우리 BLS를 돌린다
- 신호가 나오면 NASA KOI 카탈로그와 대조한다
- 카탈로그에 없으면 — **아직 아무도 기록하지 않은 신호**

이것은 학습 시뮬레이션이 아니다. 실제 데이터, 실제 알고리즘, 실제 발견 가능성.

Phase 7이 알고리즘을 검증했다면, Phase 8는 그 알고리즘을 실전에 투입한다.

---

## 3. 사용자 시나리오

### 주요 경로 — 큐레이션된 타깃

1. **(0~5s)** `/hunt` 로드. 헤더: "Hunt — 케플러 데이터에서 아직 확인되지 않은 신호를 찾는다."
   5~8개의 타깃 카드. 각 카드에는 KIC 번호, 간략한 설명만 ("강한 주기성 의심됨", "미분석 구역", "후보 신호 보고됨"). 어떤 행성인지 표시 없음.

2. **(5~10s)** 타깃 카드 선택 → "BLS 탐색 시작". 로딩: *"케플러 데이터 분석 중…"*

3. **(10~90s)** 주기도그램 등장. 피크 자동 마커: *"X.X일에 강한 신호 감지"*

4. **(결과)** NASA KOI 카탈로그 크로스체크 결과:
   - **CANDIDATE**: *"KOI-XXXX.XX와 일치 — 아직 확인되지 않은 행성 후보입니다"*
   - **CONFIRMED**: *"이미 확인된 행성 [이름]입니다 — 우리 알고리즘도 동일하게 찾았습니다"*
   - **없음**: *"이 신호는 KOI 카탈로그에 없습니다 — 새로운 발견 후보일 수 있습니다"*

5. **(발견 기록)** 결과 카드 + 결과 JSON 내보내기 + Planet Hunters / NASA Exoplanet Archive 보고 링크

### 보조 경로 — 자유 탐색

KIC 번호 직접 입력 → 나머지 동일. 유효하지 않은 KIC 번호면 명확한 에러.

### 기억에 남길 한 순간

> 주기도그램 피크가 올라오고, KOI 대조 결과 *"카탈로그에 없음"* 이 표시되는 순간.
> *"내가 처음으로 이 신호를 분석한 사람일 수 있다."*

---

## 4. 범위

### ✅ 포함

1. **Hunt target catalog** — 큐레이션된 Kepler 별 목록 (KIC ID + 설명 + 힌트). CANDIDATE KOI 보유 별 + 미분석 별 혼합. `GET /api/hunt/targets` (8-1)

2. **KOI 크로스체크** — BLS 피크 주기를 NASA Exoplanet Archive KOI 테이블과 대조. 로컬 KOI 스냅샷 CSV 사용 (API 의존성 제거). `GET /api/hunt/koi-check?kic={kic}&period={period}` (8-1)

3. **KIC 자유 탐색** — KIC 번호 직접 입력. lightkurve로 LC 다운 → BLS → KOI 대조. (8-1)

4. **HuntPage 프론트엔드** — 타깃 카드 UI + 탐색 흐름 + 결과 표시 (8-2)

5. **발견 기록** — 결과 JSON 내보내기 + Planet Hunters / NASA Exoplanet Archive 외부 링크 (8-2)

6. **재사용** — `/api/lightcurve/{name}` + `/api/bls/{name}` 기존 엔드포인트 그대로. KIC 번호는 내부적으로 `"KIC {id}"` 형태로 lightkurve에 전달.

### ❌ 제외

- **실시간 KOI 데이터베이스 갱신** — 스냅샷 CSV 한 장으로 충분
- **멀티 피크 비교 UI** — 최우선 후보 1개
- **위양성(False Positive) 자동 판별** — 신호 보고는 사용자 판단
- **사용자 계정 / 발견 저장소** — YAGNI
- **TESS 데이터** — Kepler 한정. TESS fallback은 Phase 6 패턴 그대로지만 Hunt 대상 외.
- **논문 수준 통계 검증** — Transit S/N, 쌍성 판별 등 — 향후 확장 가능성만 열어둠

---

## 5. 성공 기준

### 정성적

- *"내가 처음으로 이 신호를 분석했을 수 있다"*는 느낌이 온다
- 알고리즘 탐색 → 카탈로그 대조 → 발견 흐름이 실제 행성 사냥처럼 느껴진다
- 결과가 실제 시민 과학 기여로 이어질 수 있다는 신뢰감이 있다

### 정량적

- **CANDIDATE KOI 타깃**: BLS 피크가 KOI 기록 주기 ±5% 이내
- **자유 탐색**: 유효 KIC 입력 → LC 다운 → BLS 결과 < 90s (캐시 미스)
- **KOI 크로스체크**: BLS 결과 반환 후 < 500ms
- **`npm run build` 통과**: 매 커밋

---

## 6. 비기능 요구사항

- **KOI 카탈로그**: NASA Exoplanet Archive KOI 테이블 스냅샷 CSV (`backend/data/koi_catalog.csv`). 컬럼: `kepid`, `kepoi_name`, `koi_disposition`, `koi_period`. API 의존 없음.
- **lightkurve KIC 검색**: `lk.search_lightcurve("KIC 11442793", mission="Kepler")` — 기존 패턴 그대로.
- **백엔드 재사용**: Phase 7 FastAPI + 신규 라우터. 별도 서비스 불필요.
- **BLS 캐시 재사용**: `backend/cache/bls_kic-XXXXXXX.json` — Phase 7 캐시 패턴 그대로.
- **manualChunks 순서**: `@react-three` → `/three/` 절대 변경 금지.

---

## 7. 천문학 — Phase 8에서 배우는 것

| 개념 | 설명 |
|------|------|
| KOI (Kepler Object of Interest) | 케플러 파이프라인이 transit 신호를 감지해 후보로 분류한 천체. CONFIRMED / CANDIDATE / FALSE POSITIVE 세 단계. |
| 시민 과학 (Citizen Science) | 전문 천문학자가 아닌 사람이 실제 데이터를 분석해 새로운 발견에 기여. Planet Hunters, Zooniverse가 대표적. |
| 케플러 데이터의 잔재 | 파이프라인 자동화는 단주기·깊은 transit에 최적화. 장주기·낮은 S/N 신호는 여전히 발견 대기 중. |
| 독립 검증 | 같은 데이터에 독립적인 알고리즘으로 동일 신호를 찾는 것 = 후보 신뢰도 향상. 과학에서 "독립 재현"이 중요한 이유. |
| False Positive | BLS가 찾은 신호가 행성이 아닐 수 있음 — 쌍성계, 기기 노이즈, 별 자체의 변광. 진짜 발견인지는 후속 분석이 필요. |

---

*"PRD는 이 Phase의 북극성이다. 흔들릴 때 여기로 돌아온다."*
*"Phase 7가 알고리즘을 검증했다면, Phase 8는 그 알고리즘을 실전에 투입한다."*
