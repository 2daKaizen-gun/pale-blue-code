# [Check] sub-7-1: BLS 백엔드

**날짜**: 2026-06-23
**Issue**: #34
**결과**: ✅ 성공

---

## 잘된 점

- `backend/models/bls.py` · `services/bls.py` · `routers/bls.py` · `main.py` — 파일 단위 커밋으로 PCTC Light 사이클 깔끔하게 유지
- Phase 6 캐시 재사용 패턴(`_find_lc_cache`) 그대로 계승 — MAST 재호출 없이 lc_*.json에서 시작
- `bls_lc_*.json` 별도 풀 해상도 캐시 전략이 결국 옳은 설계임을 검증

---

## 막혔던 점

### 1. `u.dimensionless_unscaled` 단위 불일치
- **문제**: `BoxLeastSquares(time * u.day, flux).power(periods * u.day, durations * u.dimensionless_unscaled)` → astropy가 duration 단위를 day로 기대하는데 dimensionless를 넘겨 `UnitConversionError`
- **원인**: TechSpec의 "phase fraction" 주석을 오해 — astropy BLS duration은 항상 time 단위(day)
- **해결**: astropy units 전부 제거, 순수 numpy 배열로 변경. duration `[0.1, 0.3, 0.5]` day로 고정

### 2. 라우터 중복 키 버그
- **문제**: `BLSResponse(**data, best=data["best"])` → `best` 키가 `**data`와 중복 → 500 에러
- **원인**: Pydantic 모델 생성 시 `data`에 이미 `best`가 있음을 간과
- **해결**: `BLSResponse(**data)` 한 줄로

### 3. Kepler-452 b BLS false positive (설계 변경)
- **문제**: 데시메이션(5,000점)으로는 transit 1개당 1-2점뿐 → BLS miss. 풀 해상도(65K점) 받아도 ~430일 fake peak가 384일 신호보다 강함
- **원인 분석**:
  1. transit depth 820ppm ≈ 5.2σ → `remove_outliers(sigma=5)` 가 transit point를 이탈치로 제거
  2. 제거하지 않아도 ~430일 transit-shaped systematic noise가 더 강한 BLS power
  3. `flatten()` 적용 시 lightkurve BKJD time format 문제로 오히려 signal 감쇄
  4. SG detrend(30일 window)도 transit-shaped systematic은 제거 불가
- **결론**: Kepler-452 b는 기본 BLS로 global max 검출 불가 — CBV 보정 없이는 한계
- **해결**: **검증 행성을 Kepler-7 b로 변경**
  - 주기 4.886일, transit depth 2.46%, Kepler 4년 약 299회 transit
  - BLS 결과: `best.period = 4.8848d` (알려진 4.8855d와 차이 0.0007일) ✅
  - 스토리: "역사상 최초로 대기 구름 지도가 만들어진 행성 — 스타이로폼보다 가벼운 세계"

---

## 리팩토링 후보

- `_detrend()` 내 Kepler cadence(0.0204d) 하드코딩 → TESS(0.00139d) 지원 시 파라미터화 필요
- `_get_full_lc()` 내 fallback(decimated data 반환)은 BLS 정확도 보장 안 됨 — 에러로 바꾸는 게 더 정직

---

## 다음 sub-phase (7-2) 교훈

- `bls_lc_*.json` 캐시는 lc_*.json보다 크고 시간이 걸림 — 프론트엔드 로딩 메시지에 "최초 실행 시 60초 이상 소요" 안내 필요
- BLS 결과 JSON이 10,000 periods × powers = ~800KB → D3 렌더는 `<path>` 단일 라인으로 처리 (TechSpec §6 경고 이미 있음)
- Kepler-7 b가 메인 데모이므로 DataPage에서 "광도곡선 먼저 로드" 후 SignalPage 진입 흐름 안내 필요

---

## 🌌 이번에 알게 된 우주의 한 조각

**BLS는 만능이 아니다 — 신호보다 강한 잡음이 이기면 틀린 행성을 반환한다.**

Kepler-452 b는 실제 케플러 팀이 수년간의 정밀 분석으로 찾아낸 행성이다. 기본 BLS 한 번으로 찾을 수 있을 것 같지만, 실제로는 위성 자세 보정 벡터(CBV), 계기 트렌드 제거, 통계적 유의도 검증을 모두 거쳐야 "정말 행성이다"라고 말할 수 있다.

**Kepler-7 b**는 반대 극단이다. 밀도 0.17 g/cm³ — 스타이로폼(0.02 g/cm³)보다 무겁지만 물(1.0 g/cm³)보다 훨씬 가볍다. 이 "퍼프 행성"의 transit은 너무 뚜렷해서 BLS가 299번의 dip을 쌓아 오차 0.001일로 주기를 찾아낸다. 그리고 그 데이터를 더 분석하자 2013년 NASA는 행성 표면의 구름 분포를 최초로 지도로 만들었다.

행성 탐색 알고리즘의 신뢰도는 행성 자체의 특성만큼이나 중요하다.
