# Phase 7 TechSpec — Signal

> *작성일: 2026-06-22*
> *PRD: `docs/specs/phase-7/PRD.md`*

---

## §1. 핵심 기술 결정 요약

| 영역 | 결정 | 이유 |
|------|------|------|
| BLS 라이브러리 | `astropy.timeseries.BoxLeastSquares` | `lightkurve==2.4.2` 의존으로 이미 설치됨 — 추가 패키지 없음 |
| 광도곡선 입력 | Phase 6 `lc_*.json` 캐시 직접 읽기 | MAST 재호출 없음, 이미 정제된 PDCSAP_FLUX |
| BLS 캐시 | `backend/cache/bls_*.json` | Phase 6 `lc_*.json` 패턴 동일, `_cache_key` 재사용 |
| 주기 탐색 범위 | 1 ~ 500일, 로그 균등 격자 10,000 포인트 | Hot Jupiter(~3d) ~ Earth-like(~365d) 커버 |
| Duration 후보 | `[0.1, 0.3, 0.5]` (days) | phase fraction 아님 — astropy BLS duration은 time과 동일 단위(day) 필요 |
| D3 주기도그램 | x: log scale (period), y: BLS power | 로그 스케일이 단주기/장주기 동시 표현 |
| 프론트 UI | `SignalPage.tsx` — 기존 placeholder 대체 | Phase 7 전용 `/signal` 경로 이미 존재 |
| `?planet=` URL param | `useSearchParams` — DataPage 패턴 계승 | DataPage → SignalPage 링크 연동 |

---

## §2. 백엔드 아키텍처

### 신규 파일

```
backend/
├── services/
│   └── bls.py          # BLS 알고리즘 래퍼 + 캐시
├── routers/
│   └── bls.py          # GET /api/bls/{planet_name}
└── models/
    └── bls.py          # BLSResponse Pydantic 모델
```

### `backend/services/bls.py`

```python
# 핵심 시그니처
def run_bls(planet_name: str) -> dict:
    """
    Phase 6 캐시(lc_*.json)에서 flux 읽어 astropy BLS 실행.
    결과를 bls_*.json으로 캐시 후 반환.
    """
```

**캐시 키**: `bls_{slug}` (ex: `bls_kepler-7-b.json`)
- `_cache_key`는 `mast.py`의 함수와 동일 패턴 — mission suffix 없음 (BLS는 캐시된 데이터 기반)
- 광도곡선 캐시 없으면 → HTTP 424 (Failed Dependency) + 안내 메시지

**BLS 실행 파라미터**:
```python
from astropy.timeseries import BoxLeastSquares

bls = BoxLeastSquares(time, flux)
periods = np.geomspace(1, 500, 10_000)  # log 균등 격자
durations = [0.1, 0.3, 0.5]             # days — astropy BLS duration must match time units
result = bls.power(periods, durations)
```

**BLS 최우선 후보 추출**:
```python
best_idx = np.argmax(result.power)
best = bls.compute_stats(
    result.period[best_idx],
    result.duration[best_idx],
    result.transit_time[best_idx],
)
```

**반환 JSON 구조**:
```json
{
  "planet_name": "Kepler-7 b",
  "periods": [1.0, 1.05, ...],        // 10,000 포인트
  "powers": [0.001, 0.002, ...],       // 동일 길이
  "best": {
    "period": 4.885,
    "duration": 0.3,
    "depth": 0.0246,
    "transit_time": 2454833.1,
    "power": 0.081
  }
}
```

### `GET /api/bls/{planet_name}`

- Path: `/api/bls/{planet_name}` (URL decode 필요 — FastAPI 자동 처리)
- Cache hit: `backend/cache/bls_*.json` 존재 → JSON 직접 반환 (< 200ms)
- Cache miss: BLS 실행 (최초 < 60s) → 저장 → 반환
- 광도곡선 캐시 없음: HTTP 424 + `"message": "Light curve not found. Fetch it first."`

---

## §3. 프론트엔드 아키텍처

### 신규/수정 파일

```
frontend/src/
├── pages/
│   └── SignalPage.tsx          # placeholder → 실구현
├── components/
│   └── signal/
│       ├── PeriodogramChart.tsx # D3 log-scale 주기도그램
│       └── BLSResultCard.tsx    # 최우선 후보 카드
└── lib/api/
    └── bls.ts                  # fetchBLS API 클라이언트
```

### `SignalPage.tsx` 구조

```
SignalPage
├── PlanetSearchBar (재사용 — DataPage와 동일 컴포넌트)
├── [행성 선택 전] → 안내 텍스트
└── [행성 선택 후]
    ├── "주기 탐색 시작" 버튼
    ├── [로딩 중] → 로딩 메시지
    └── [결과 있음]
        ├── PeriodogramChart (D3)
        └── BLSResultCard
```

**URL param**: `?planet=Kepler-7+b` → `useSearchParams` → 자동 검색 트리거

### `PeriodogramChart.tsx`

- `useRef<SVGSVGElement>` + `useEffect([data])` + `ResizeObserver` — LightCurveChart 패턴 동일
- x축: `d3.scaleLog()` (1~500일), 라벨 "Period (days)"
- y축: `d3.scaleLinear()` (0~max power), 라벨 "BLS Power"
- 피크 마커: 수직선 + 라벨 (`${period.toFixed(1)} days`)
- StrictMode cleanup: `() => { d3.select(ref.current).selectAll('*').remove() }`

### `BLSResultCard.tsx`

| 표시 항목 | 값 | 비고 |
|-----------|-----|------|
| 최우선 주기 | `best.period.toFixed(2) days` | 강조 표시 |
| Transit 지속 시간 | `(best.duration * 24).toFixed(1) hours` | duration은 days |
| Transit 깊이 | `(best.depth * 100).toFixed(4)%` | percentage |
| BLS 파워 | `best.power.toFixed(4)` | 신호 강도 |

---

## §4. API 클라이언트 (`bls.ts`)

```typescript
export interface BLSData {
  planet_name: string
  periods: number[]
  powers: number[]
  best: {
    period: number
    duration: number
    depth: number
    transit_time: number
    power: number
  }
}

export async function fetchBLS(planetName: string): Promise<BLSData>
```

`lightcurve.ts`와 동일 패턴 (`VITE_API_URL` + `encodeURIComponent`).

---

## §5. sub-phase 분할

### sub-7-1: BLS 백엔드
**Goal**: `/api/bls/{planet_name}` 동작 + Kepler-7 b 정확도 검증

**Lights (예상 커밋 순서)**:
1. `backend/models/bls.py` — Pydantic BLSResponse 모델
2. `backend/services/bls.py` — BLS 실행 + 캐시
3. `backend/routers/bls.py` — FastAPI 라우터
4. `backend/main.py` — 라우터 등록
5. BLS 검증 스크립트 (optional, scripts/) — Kepler-7 b 테스트

**성공 기준**:
- `GET /api/bls/Kepler-7%20b` 응답 200
- `best.period` ± 0.01일 이내 = 4.886d

### sub-7-2: SignalPage 프론트엔드
**Goal**: SignalPage placeholder → 실구현 (PeriodogramChart + BLSResultCard)

**Lights (예상 커밋 순서)**:
1. `frontend/src/lib/api/bls.ts` — API 클라이언트 + BLSData 타입
2. `PeriodogramChart.tsx` — D3 log-scale 주기도그램 (정적 mock 데이터로 먼저)
3. `BLSResultCard.tsx` — 결과 카드 UI
4. `SignalPage.tsx` — 전체 조립 + `useSearchParams`
5. DataPage `PhaseFoldChart` → SignalPage 링크 ("→ 주기 탐색")
6. `npm run build` 통과 확인 + PHASES status `planned` → `in-progress` 업데이트

**성공 기준**:
- `/signal?planet=Kepler-7+b` → 자동 검색 트리거
- "주기 탐색" 버튼 → 로딩 → PeriodogramChart 렌더
- 피크 마커 위치 ≈ 4.9일
- `npm run build` 통과

---

## §6. 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| BLS 실행 시간 > 60s (1코어) | 중 | 주기 격자를 5,000으로 줄이거나 duration 후보 1개만 → 15~30s |
| 광도곡선 캐시 없는 행성 → 424 응답 | 높 | SignalPage에서 명확한 "광도곡선 먼저 로드" 안내 |
| D3 log scale + 10,000 포인트 렌더 성능 | 낮 | `<path>` 단일 라인 렌더 (원 찍기 X) → < 1s |
| `best.period` ± 0.01일 기준 실패 | 매우 낮 | Kepler-7 b 검증 완료 (실측 4.8848d, 오차 0.0007d). 재실패 시 duration 후보 조정. |

---

## §7. 불변 규칙 (Phase 6 계승)

- **manualChunks**: `@react-three`는 `/three/` 경로보다 반드시 먼저 매칭 — 절대 변경 금지
- **커밋 게이트**: `npm run build` 통과 → `git add` → 메시지 제시 → 권이건 OK → `git commit`
- **push 게이트**: sub-phase 완료 후 권이건이 직접 push (또는 승인)
- **이슈 본문**: 영어만 (한글 U+AC00~U+D7A3 금지)
- **PCTC**: Plan 없이 Code 금지. Check 생략 금지.

---

*"TechSpec은 결정의 근거다. 실물이 정본이고, TechSpec은 왜 그렇게 만들었나를 기록한다."*
