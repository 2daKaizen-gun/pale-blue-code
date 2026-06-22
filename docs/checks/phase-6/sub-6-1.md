# sub-6-1 Check — Lightkurve 통합 + /api/lightcurve 엔드포인트 + 파일 캐시

> Phase 6 — Data · Issue #31 · 2026-06-19 · sub-6-1

---

## 🧪 Test

```
[Test] sub-6-1: Lightkurve backend — /api/lightcurve/{planet_name} + /folded + file cache
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (Light 추가 없음, 프론트 변경 없음)
- Python: `uvicorn backend.main:app` 기동 확인

### 수동 (curl / Python)

| 항목 | 결과 |
|------|------|
| `GET /api/lightcurve/Kepler-452 b` → JSON 반환 (최초 ~10s, 캐시 후 <500ms) | ✅ |
| 응답에 `time`, `flux`, `flux_err` 배열 존재 + `point_count ≤ 5000` | ✅ |
| `backend/cache/lc_kepler-452-b_kepler.json` 생성 확인 | ✅ |
| `GET /api/lightcurve/Kepler-452 b/folded?period=384.843` → `phase`, `flux` bins | ✅ |
| 두 번째 요청 캐시 히트 — `backend/cache/` 파일에서 직접 읽음 | ✅ |
| 행성 데이터 없는 이름 → HTTP 404 + 명확한 에러 메시지 | ✅ |

### 성공 기준 점검

- [x] `backend/services/mast.py` — Lightkurve 래퍼 + 파일 캐시 (`lc_*.json`)
- [x] `backend/routers/lightcurves.py` — `/api/lightcurve/{planet_name}` + `/folded`
- [x] `backend/models/lightcurve.py` — `LightCurveResponse` + `PhaseFoldResponse` Pydantic 모델
- [x] PDCSAP_FLUX 전처리: `normalize()` + `remove_nans()` + `remove_outliers(sigma=5)`
- [x] 데시메이션: 최대 5,000점 균등 샘플링
- [x] 위상 접기: numpy binning 200 bins (서버사이드)
- [x] `backend/cache/.gitkeep` 추가, `backend/cache/` `.gitignore` 등록
- [x] `npm run build` 통과

---

## ✅ Check

```
[Check] sub-6-1: Lightkurve + /api/lightcurve + file cache
```

### 잘된 점

- **Lightkurve의 추상화가 Phase 6을 90% 쉽게 만들었다.** FITS 파일 다운로드 · 파싱 ·
  정규화 · NaN 제거 · 위상 접기가 Lightkurve API 5줄로 처리됐다. Phase 5에서 httpx로
  NASA TAP API를 직접 쿼리한 경험 덕분에 "라이브러리가 감춰주는 게 뭔지"도 알고 쓴
  것. Lightkurve 내부에서 MAST HTTP, FITS 파싱, astropy 시간 변환이 일어난다.

- **파일 캐시가 개발 생산성을 결정했다.** MAST 첫 다운로드 ~10s. 캐시 없었다면 API를
  바꿀 때마다 10초 대기 — 개발 속도가 10배 느려질 것이다. `_cache_key` 함수가 행성
  이름을 slug로 변환해 파일명 안전하게 보장. Phase 7 BLS 캐시도 동일 패턴 재사용 예정.

- **Phase 5 planets 캐시와의 연결이 자연스러웠다.** `GET /api/lightcurve/{planet_name}`
  → `app.state.planets`에서 `hostname` 조회 → Lightkurve에 hostname 전달. Phase 5가
  공들여 만든 planets 메모리 캐시가 Phase 6에서 "공짜로" 활용됨.

- **`remove_outliers(sigma=5)` 결정 — 잡음 제거 없이 D3 렌더 문제.** 처음엔 outlier
  제거 없이 전달했는데, flux 값 중 `±100` 수준의 이상값이 포함되어 D3 y축 자동 스케일이
  완전히 깨졌다. 5σ 제거가 transit dip은 보존하면서 센서 이상값만 제거함을 확인.

### 막혔던 점 / 트러블슈팅

#### 1. Lightkurve `stitch()` 분기 미스매치 — BTJD 연속성 깨짐

- **증상**: Kepler-452 b 광도곡선 다운로드 시 `time` 배열이 중간에 큰 점프(~90일)로
  끊김. 관측 기간 중 공백이 비정상적으로 많아 보임.
- **원인**: Kepler 관측은 Quarter 단위(~90일)로 나뉘어 저장됨. `search_result.download_all()`
  후 `stitch()`가 Quarter들을 연결하는데, 일부 Quarter가 author="Kepler" 필터에 걸려
  누락됨.
- **해결**: `search_result = lk.search_lightcurve(hostname, mission="Kepler",
  author="Kepler", exptime="long")` 에서 `author` 필터 제거. 모든 Kepler Pipeline
  처리본이 포함됨. `stitch()` 후 연속성 확인.
- **교훈**: Lightkurve 검색 결과는 author/pipeline별 중복이 있을 수 있음. 필터를 좁히면
  원하는 Quarter가 빠질 수 있다.

#### 2. 위상 접기 `transit_depth` 계산 — None 반환 케이스

- **증상**: `/folded` 응답의 `transit_depth`가 일부 행성에서 `None`. Phase Fold 탭의
  TransitInfo 패널에 "—" 표시.
- **원인**: `transit_depth = 1 - min(binned_flux)`. 위상 접기 후 bins가 충분하지 않거나
  transit dip이 bins에 잘 포착되지 않으면 `min(flux)`가 1.0에 가까워 음수 depth 발생.
  음수 처리 → `None` 반환.
- **해결**: `transit_depth = max(0, 1 - min(binned_flux))` — 음수 클램핑. 실제 transit
  dip이 없거나 데이터가 부족한 케이스에서 0 반환.
- **교훈**: "관측 데이터에서 추출하는 값"은 항상 이상 케이스 고려. 수학적으로 정의된
  양이 음수가 나오면 데이터 부족이지 코드 버그가 아닐 수 있다.

#### 3. `requirements.txt` Lightkurve 설치 크기 — Railway 빌드 타임 증가

- **문제**: Lightkurve + astropy 합쳐 ~100MB. Railway 빌드 시간이 3분에서 8분으로 증가.
- **대응**: 빌드 자체는 성공. Railway 무료 플랜에서 허용 범위 (15분 limit). 포트폴리오
  데모 목적에서 허용. pip 캐시는 nixpacks가 레이어 캐시로 처리.
- **교훈**: 과학 Python 패키지(scipy, astropy)는 컴파일 단계가 있어 빌드 시간이 급증.
  개발 환경에서 미리 `pip install` 시간 측정 후 CI 영향 예측.

### 리팩토링 후보

- **캐시 키 충돌 방지** — `_cache_key`가 slug 변환 시 너무 공격적으로 정규화하면 다른
  행성이 같은 키를 공유할 수 있음. 현재 패턴에서 실제 충돌 없지만, Phase 7 BLS 캐시에서
  같은 함수를 쓸 때 재검증.
- **Lightkurve 타임아웃** — 현재 `asyncio.wait_for` 없음. MAST 연결 불안정 시 무한
  대기 가능. Phase 6 중 실제 발생하지 않았으나 30s timeout 추가 후보.
- **파일 캐시 용량 모니터링** — 행성당 ~200KB. 100개 행성 캐시 = ~20MB. Railway persistent
  disk 없는 경우 재배포 시 초기화. 포트폴리오 범위에서 허용.

### 다음 sub-6-2에 적용할 교훈

- **`LightCurveData` 타입을 프론트에 먼저 정의** — Phase 5 `Planet` 타입 패턴 그대로.
  `frontend/src/lib/api/lightcurve.ts`가 D3 컴포넌트들의 props 타입이 됨.
- **D3 x축은 BKJD 숫자** — absolute time이라 "1000~1800" 범위. 사용자에게 의미있는
  표현을 위해 x축 라벨을 "Days from mission start"로 표시하거나, 첫 값 기준 offset
  처리 필요 여부를 D3 컴포넌트 Plan 단계에서 결정.
- **transit dip 마커는 PhaseFoldChart에서** — raw LightCurveChart는 여러 transit이
  흩어져있어 마커 위치 특정 어려움. Phase Fold 후 U자 최저점에 마커 집중.

## 🌌 이번에 알게 된 우주의 한 조각

**PDCSAP_FLUX — 위성이 자기 자신의 흔들림을 빼는 방법.**

Kepler 위성은 완벽하지 않다. 우주에 있어도 태양풍의 광자 압력, 자세 제어 반응 휠의
진동, 차등 속도계(differential velocity aberration)로 인해 위성 자체가 미세하게 흔들린다.
이 흔들림이 측광값에 그대로 담기면 "위성이 흔들린 것"인지 "별이 어두워진 것"인지
구별이 안 된다.

SAP_FLUX (Simple Aperture Photometry)는 원시값 — 위성 흔들림 포함.
PDCSAP_FLUX (Pre-search Data Conditioning SAP)는 케플러 파이프라인이 CBV (Cotrending
Basis Vectors)를 이용해 *위성 시스템 노이즈를 빼고 남은 별빛만* 추출한 값.

CBV는 같은 관측 시간에 많은 별에서 공통으로 나타나는 밝기 변동 패턴이다 — 그게 위성의
시스템 노이즈. 개별 별의 진짜 변화는 모든 별에서 공통이 아니라 그 별에서만 나타난다.
PDCSAP는 "공통 노이즈를 제거하고 고유 신호만 남긴 것". 우리가 `lc.flux`로 읽는 값이
이 보정 완료 광도다.
