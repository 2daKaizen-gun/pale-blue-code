# Phase 8 TechSpec — Hunt

> *작성일: 2026-06-26*
> *PRD: `docs/specs/phase-8/PRD.md`*

---

## §1. 핵심 기술 결정 요약

| 영역 | 결정 | 이유 |
|------|------|------|
| KIC 번호 처리 | Hunt 전용 엔드포인트 (`/api/hunt/*`) | 기존 `/api/lightcurve/{name}` 라우터가 planet catalog lookup 필수 — KIC 번호는 catalog에 없음 |
| LC 다운로드 | `lk.search_lightcurve("KIC XXXXXXX", mission="Kepler")` | lightkurve가 KIC ID를 직접 지원. hostname lookup 불필요. |
| BLS 재사용 | `bls_service.run_bls(f"KIC {kic_id}")` 그대로 호출 | `_slug("KIC 11442793")` → `"kic-11442793"`. 캐시 키 자동 생성. `_get_full_lc`도 lc_meta hostname으로 KIC 검색 지원. |
| LC 캐시 구조 | `lc_kic-XXXXXXX_kepler.json`, `hostname = "KIC XXXXXXX"` 포함 | BLS 서비스가 `lc_meta["hostname"]`으로 lightkurve 재검색 — 동일 포맷 유지 필수 |
| KOI 카탈로그 | `backend/data/koi_catalog.csv` 로컬 스냅샷 | NASA API 의존 제거. 컬럼: `kepid, kepoi_name, koi_disposition, koi_period` |
| KOI 크로스체크 | 주기 ±5% tolerance | BLS 피크 부정확도 감안. 같은 star에 복수 KOI 있으면 전부 반환. |
| D3 주기도그램 | `PeriodogramChart.tsx` 재사용 (Phase 7) | `BLSData` 인터페이스 그대로. 별도 컴포넌트 없음. |
| BLS 결과 카드 | `BLSResultCard.tsx` 재사용 (Phase 7) | 동일 인터페이스. |
| 큐레이션 타깃 | sub-8-1에서 KOI CSV 다운 후 확정 | 조건: Kepler 단주기 CANDIDATE KOI + 미등록 별 혼합, BLS 신뢰 가능한 신호 |

---

## §2. 백엔드 아키텍처

### 신규 파일

```
backend/
├── data/
│   └── koi_catalog.csv          # NASA KOI 스냅샷 (sub-8-1에서 다운)
├── models/
│   └── hunt.py                  # HuntTarget, KOIMatch, HuntLCResponse Pydantic 모델
├── services/
│   └── hunt.py                  # get_targets, fetch_lc_by_kic, koi_check
└── routers/
    └── hunt.py                  # GET /api/hunt/* 3개 엔드포인트
```

### `backend/models/hunt.py`

```python
class HuntTarget(BaseModel):
    kic_id: int
    label: str           # "KIC 11442793"
    description: str     # 힌트 문구 — 행성 이름 노출 없음
    hint: str            # "short-period signal suspected"

class KOIMatch(BaseModel):
    kepoi_name: str      # "K00001.01"
    disposition: str     # "CANDIDATE" | "CONFIRMED" | "FALSE POSITIVE"
    koi_period: float    # days

class HuntLCResponse(BaseModel):
    kic_id: int
    time: list[float]
    flux: list[float]
    flux_err: list[float]
    point_count: int
    original_count: int
```

### `backend/services/hunt.py`

#### `get_targets() → list[HuntTarget]`

하드코딩된 큐레이션 리스트 반환. sub-8-1에서 KOI CSV 조회 후 KIC ID 확정.

선정 기준:
- Kepler 관측 별 (lightkurve `mission="Kepler"` 지원 확인)
- BLS 신뢰 가능 조건: period ≤ 30일, transit depth ≥ 0.5%
- 혼합: CANDIDATE KOI 2~3개 + 미등록(KOI 없음) 1~2개 + CONFIRMED 1개 (BLS 검증용)
- 총 5~7개

#### `fetch_lc_by_kic(kic_id: int) → dict`

```python
def fetch_lc_by_kic(kic_id: int) -> dict:
    import lightkurve as lk
    planet_name = f"KIC {kic_id}"
    key = _cache_key(planet_name, "Kepler")   # "lc_kic-XXXXXXX_kepler"
    cached = _load_cache(key)
    if cached:
        return cached

    search = lk.search_lightcurve(planet_name, mission="Kepler",
                                   author="Kepler", exptime="long")
    if len(search) == 0:
        raise FileNotFoundError(f"No Kepler light curve for KIC {kic_id}")

    lc = search.download_all().stitch().normalize().remove_nans().remove_outliers(sigma=5)
    time_arr = lc.time.value.astype(float)
    flux_arr = lc.flux.value.astype(float)
    err_arr  = lc.flux_err.value.astype(float) if lc.flux_err is not None \
               else np.zeros_like(flux_arr)

    original_count = len(time_arr)
    time_d, flux_d, err_d = _decimate(time_arr, flux_arr, err_arr)  # 재사용 or inline

    data = {
        "kic_id": kic_id,
        "planet_name": planet_name,   # BLS 서비스 호환용
        "hostname": planet_name,      # _get_full_lc 가 lc_meta["hostname"] 로 재검색
        "mission": "Kepler",
        "time": time_d.tolist(),
        "flux": flux_d.tolist(),
        "flux_err": err_d.tolist(),
        "period": None,               # 미확인 — BLS가 찾을 예정
        "point_count": len(time_d),
        "original_count": original_count,
    }
    _save_cache(key, data)
    return data
```

> **캐시 키 불변 규칙**: `lc_kic-XXXXXXX_kepler.json` 포맷 + `hostname` 필드 필수.
> BLS 서비스 `_get_full_lc`가 `lc_meta["hostname"]`으로 lightkurve 재검색하기 때문.

#### `koi_check(kic_id: int, period: float, tolerance: float = 0.05) → list[KOIMatch]`

```python
def koi_check(kic_id: int, period: float, tolerance: float = 0.05) -> list[dict]:
    df = _load_koi_catalog()   # 첫 호출 시 CSV 로드 → 모듈 레벨 캐시
    matches = df[
        (df["kepid"] == kic_id) &
        (np.abs(df["koi_period"] - period) / period < tolerance)
    ]
    return matches[["kepoi_name", "koi_disposition", "koi_period"]].to_dict("records")
```

### `backend/routers/hunt.py`

```
GET /api/hunt/targets               → list[HuntTarget]
GET /api/hunt/lc/{kic_id}          → HuntLCResponse
GET /api/hunt/bls/{kic_id}         → BLSResponse (Phase 7 모델 재사용)
GET /api/hunt/koi-check             → list[KOIMatch]
    ?kic_id={int}&period={float}
```

BLS 엔드포인트 구현:
```python
@router.get("/hunt/bls/{kic_id}", response_model=BLSResponse)
async def hunt_bls(kic_id: int):
    planet_name = f"KIC {kic_id}"
    try:
        data = await run_in_threadpool(bls_service.run_bls, planet_name)
    except FileNotFoundError:
        raise HTTPException(
            status_code=424,
            detail={"message": f"Light curve not cached for KIC {kic_id}. "
                               f"Fetch via GET /api/hunt/lc/{kic_id} first.",
                    "kic_id": kic_id},
        )
    return BLSResponse(**data)
```

### `backend/data/koi_catalog.csv`

sub-8-1에서 1회 다운로드:
```
URL: https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI
     ?table=cumulative&select=kepid,kepoi_name,koi_disposition,koi_period&format=csv
파일: backend/data/koi_catalog.csv
크기: ~10,000 행, ~500 KB
```

다운로드 스크립트: `scripts/download_koi_catalog.py`

---

## §3. 프론트엔드 아키텍처

### 신규/수정 파일

```
frontend/src/
├── pages/
│   └── HuntPage.tsx                    # placeholder → 실구현
├── components/
│   └── hunt/
│       ├── HuntTargetCard.tsx          # 타깃 선택 카드
│       └── KOIMatchCard.tsx            # KOI 대조 결과 카드
└── lib/api/
    └── hunt.ts                         # fetchHuntTargets, fetchHuntLC, fetchHuntBLS, fetchKOICheck
```

**Phase 7 컴포넌트 재사용** (수정 없음):
- `components/signal/PeriodogramChart.tsx` — `BLSData` 인터페이스 그대로
- `components/signal/BLSResultCard.tsx` — 동일

### `HuntPage.tsx` 구조 및 상태 흐름

```
HuntPage
├── [타깃 미선택]
│   ├── 헤더 + 설명
│   ├── HuntTargetCard × N (curated)
│   └── KIC 직접 입력 (고급)
│
└── [타깃 선택됨]
    ├── 1단계: LC 다운 중 → Spinner ("케플러 데이터 수신 중…")
    ├── 2단계: BLS 실행 중 → Spinner ("65,000개 데이터 분석 중…")
    └── 3단계: 결과
        ├── PeriodogramChart (Phase 7 재사용)
        ├── BLSResultCard (Phase 7 재사용)
        └── KOIMatchCard (신규)
            ├── CANDIDATE → 노란색 배지 "미확인 후보"
            ├── CONFIRMED → 초록 배지 "이미 확인된 행성 [이름]"
            └── 없음 → 빨간 배지 "카탈로그 미등록 — 새로운 후보 가능성"
```

**상태 관리** (useState):
- `selectedKic: number | null`
- `lcLoading / blsLoading / koi Loading: boolean`
- `lcData: HuntLCData | null`
- `blsData: BLSData | null`
- `koiMatches: KOIMatch[]`
- `error: string | null`

**순차 실행** (의존 관계):
```
LC fetch → BLS fetch (LC 완료 후) → KOI check (BLS 완료 후)
```
각 단계별 로딩 메시지 노출.

### `HuntTargetCard.tsx`

```tsx
interface HuntTarget {
  kic_id: number
  label: string       // "KIC 11442793"
  description: string // "밝기 변화가 관측된 별 — 주기성 의심됨"
  hint: string        // "short-period signal suspected"
}
```

카드 클릭 → `onSelect(target.kic_id)` 호출.

### `KOIMatchCard.tsx`

```tsx
interface Props {
  kicId: number
  period: number        // BLS 피크 주기
  matches: KOIMatch[]   // 빈 배열 = 카탈로그 미등록
}
```

결과 3가지:
- `matches.length > 0 && disposition === "CANDIDATE"` → amber 배지
- `matches.length > 0 && disposition === "CONFIRMED"` → green 배지
- `matches.length === 0` → red/purple 배지 + 시민과학 보고 링크

---

## §4. API 클라이언트 (`hunt.ts`)

```typescript
export interface HuntTarget {
  kic_id: number
  label: string
  description: string
  hint: string
}

export interface KOIMatch {
  kepoi_name: string
  disposition: 'CANDIDATE' | 'CONFIRMED' | 'FALSE POSITIVE'
  koi_period: number
}

export interface HuntLCData {
  kic_id: number
  time: number[]
  flux: number[]
  flux_err: number[]
  point_count: number
  original_count: number
}

export async function fetchHuntTargets(): Promise<HuntTarget[]>
export async function fetchHuntLC(kicId: number): Promise<HuntLCData>
export async function fetchHuntBLS(kicId: number): Promise<BLSData>  // BLSData from bls.ts
export async function fetchKOICheck(kicId: number, period: number): Promise<KOIMatch[]>
```

`bls.ts` 패턴 동일 (`VITE_API_BASE_URL` + `encodeURIComponent`).

---

## §5. sub-phase 분할

### sub-8-1: Hunt 백엔드

**Goal**: `/api/hunt/*` 엔드포인트 동작 + KOI 크로스체크 + 큐레이션 타깃 확정

**Lights (예상 커밋 순서)**:
1. `scripts/download_koi_catalog.py` + `backend/data/koi_catalog.csv` 다운로드
2. `backend/models/hunt.py` — HuntTarget, KOIMatch, HuntLCResponse Pydantic 모델
3. `backend/services/hunt.py` — `fetch_lc_by_kic` + `koi_check` + `get_targets` (큐레이션 확정)
4. `backend/routers/hunt.py` + `main.py` 등록 — 3개 엔드포인트
5. 수동 검증: `GET /api/hunt/targets` → 5~7개 타깃 / `GET /api/hunt/lc/{kic_id}` → LC / `GET /api/hunt/bls/{kic_id}` → BLS 피크 / `GET /api/hunt/koi-check?kic_id=…&period=…` → KOI 대조

**성공 기준**:
- 큐레이션 타깃 중 CANDIDATE KOI 별: BLS 피크가 KOI 기록 주기 ±5% 이내
- KOI 없는 별: BLS가 강한 피크를 반환하거나 "평탄한 주기도그램" 중 하나
- `npm run build` 통과

### sub-8-2: Hunt 프론트엔드

**Goal**: HuntPage placeholder → 실구현. 타깃 선택 → LC → BLS → KOI 대조 전체 흐름.

**Lights (예상 커밋 순서)**:
1. `frontend/src/lib/api/hunt.ts` — API 클라이언트 4개 함수
2. `HuntTargetCard.tsx` — 타깃 선택 카드 UI
3. `KOIMatchCard.tsx` — KOI 대조 결과 (CANDIDATE / CONFIRMED / 미등록 3가지 상태)
4. `HuntPage.tsx` — 전체 조립 + 순차 상태 흐름 + Phase 7 컴포넌트 재사용
5. `constants/phases.ts` — Phase 8 `status: 'planned'` → `'done'`
6. `npm run build` 통과 확인

**성공 기준**:
- 타깃 카드 선택 → LC → BLS → KOI 대조 전체 흐름 완주
- CANDIDATE 타깃: 카드에 amber "미확인 후보" 배지 표시
- 미등록 타깃: red "카탈로그 미등록" 배지 + 보고 링크
- 주기도그램 피크 ≈ KOI 기록 주기 (CANDIDATE 타깃 기준)
- `npm run build` 통과

---

## §6. 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| KOI CANDIDATE 별 BLS 주기 ±5% 초과 | 중 | tolerance를 ±10%로 완화. 또는 타깃 교체 (sub-8-1에서 확정). |
| 미등록 타깃에서 BLS가 강한 피크 없음 | 중 | "평탄한 주기도그램 = 이 별엔 단주기 행성 없음" 도 유효한 과학적 결과. |
| NASA KOI CSV 다운로드 URL 변경 | 낮 | 스냅샷 파일을 repo에 직접 커밋. 실시간 API 콜 없음. |
| `lk.search_lightcurve("KIC XXXXXXX")` 실패 | 낮 | Kepler DR25에 포함된 별이면 100% 지원. 타깃 선정 시 DR25 수록 확인. |
| BLS 실행 > 90s (캐시 미스) | 중 | 큐레이션 타깃은 sub-8-1에서 미리 bls_lc_*.json 캐시 생성. 첫 방문 지연 없음. |

---

## §7. 불변 규칙 (Phase 7 계승)

- **manualChunks**: `@react-three`는 `/three/` 경로보다 반드시 먼저 매칭 — 절대 변경 금지
- **커밋 게이트**: `npm run build` 통과 → `git add` → 메시지 제시 → 권이건 OK → `git commit`
- **push 게이트**: sub-phase 완료 후 권이건이 직접 push (또는 승인)
- **이슈 본문**: 영어만 (한글 U+AC00~U+D7A3 금지)
- **PCTC**: Plan 없이 Code 금지. Check 생략 금지.

---

*"TechSpec은 결정의 근거다. 실물이 정본이고, TechSpec은 왜 그렇게 만들었나를 기록한다."*
*"Phase 7가 알고리즘을 검증했다면, Phase 8는 그 알고리즘을 실전에 투입한다."*
