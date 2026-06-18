# Phase 6 TechSpec — Data

> *작성일: 2026-06-19*
> *상태: Draft → sub-6-1 진입 시 Confirmed*
>
> *스택 실측 (2026-06-19)*: `backend/requirements.txt` 직접 확인 —
> fastapi 0.115.6 / uvicorn 0.32.1 / httpx 0.27.2 / pandas 2.2.3 / pydantic 2.10.3.
> **Lightkurve 미설치** — Phase 6에서 신규 추가.
> 프론트: React 19 / D3 v7 (Phase 5에서 설치됨) / Vite 8 / TS 6.
> 백엔드는 **기존 FastAPI 재사용** — 신규 라우터 추가 방식.

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 이유 |
|------|------|-------------------|------|
| 광도곡선 데이터 소스 | **MAST (Lightkurve 경유)** | 직접 MAST API (FITS 파싱), AstroQuery | Lightkurve = NASA 공식 라이브러리. FITS 다운로드·파싱·정규화·위상접기 모두 내장. 직접 MAST는 FITS 파싱 구현 비용 큼 |
| Lightkurve 설치 | `lightkurve==2.4.2` (pip) | 최신 버전 핀 없음 | MAST 다운로드 API 안정성. astropy 의존성 포함 (~50MB). 핀으로 재현성 확보 |
| 백엔드 전략 | **기존 FastAPI + 신규 라우터** (`routers/lightcurves.py`) | 별도 마이크로서비스, Serverless Function | 기존 `main.py` lifespan + CORS 재사용. 신규 서비스 운영 오버헤드 없음 |
| 광도곡선 캐시 | **파일 캐시** (`backend/cache/lc_{key}.json`) | Redis, SQLite, 메모리 캐시 | MAST 호출 5~15초 → 파일 캐시 필수. 재시작 후에도 유지. Redis = YAGNI. JSON이므로 디버그 직접 확인 가능 |
| 위상 접기 (Phase Fold) | **서버사이드 (numpy)** | 클라이언트사이드 JS | 65,000점 float 연산은 Python/numpy가 적합. 결과(소수 포인트 bins)만 전송 — 전송 크기 최소화 |
| 데이터 전송 크기 | **서버사이드 데시메이션** (최대 5,000점 반환) | 전체 65,000점 raw | Kepler long cadence 4년치 ~65,000점 = JSON ~2MB. 렌더 목적에 5,000점으로 데시메이션 충분 |
| D3 시계열 차트 | **Phase 5 D3 패턴 그대로** (`useRef` + `useEffect` + `ResizeObserver`) | Recharts, Visx, 새 패턴 | 일관성 최우선. ScatterPlot.tsx / TimelineView.tsx 패턴 동일 적용 |
| Planet → 광도곡선 연결 | **hostname 필드 재사용** (Phase 5 planets 캐시 조회) | 별도 star catalog API | Planet.hostname 이미 확보됨. `/api/lightcurve/{planet_name}` → planet 캐시에서 hostname 조회 → Lightkurve 검색 |
| Flux 종류 | **PDCSAP_FLUX** (위성 자세 보정 완료) | SAP_FLUX (원시) | PDCSAP = Pre-search Data Conditioning SAP. 위성 운동에 의한 시스템 노이즈 제거됨. 일반적 과학 사용 표준 |
| 미션 선택 | **Kepler 우선 → TESS fallback** | TESS만, 사용자 선택 | Kepler = 더 긴 기준선, Phase 5 PRD의 "케플러 폭발" 연계. TESS는 Kepler 미관측 행성에 fallback |

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: DataPage (/data)                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  <PlanetSearchBar />   — 행성/항성 이름 검색 + 자동완성 │    │
│  │                                                         │    │
│  │  <LightCurveChart />   ← D3 svg (raw view)             │    │
│  │    x: 시간 (BTJD days)  y: 상대 밝기 (normalized)      │    │
│  │    줌/팬, transit 마커                                  │    │
│  │                                                         │    │
│  │  <PhaseFoldChart />    ← D3 svg (folded view)          │    │
│  │    x: 위상 (0~1)  y: 상대 밝기                         │    │
│  │    transit depth 주석                                   │    │
│  │                                                         │    │
│  │  <TransitInfo />       — 깊이, 지속시간, 추정 반경      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                    │ fetch                                       │
│         lib/api/lightcurve.ts (fetch wrapper)                  │
└─────────────────────────────────────────────────────────────────┘
                     │ HTTP (JSON)
         localhost:8000 (dev) / Railway (prod)
┌─────────────────────────────────────────────────────────────────┐
│  Backend: FastAPI (기존 backend/)                               │
│                                                                 │
│  GET /api/lightcurve/{planet_name}   ← 신규                   │
│    params: ?mission=Kepler&max_points=5000                     │
│    1. planet_name → hostname (planets 캐시 조회)               │
│    2. 파일 캐시 확인 (backend/cache/lc_{key}.json)             │
│    3. 캐시 미스 → Lightkurve MAST 다운로드                     │
│    4. 정규화 + 데시메이션 + 직렬화                             │
│    5. 파일 캐시 저장 → 응답                                     │
│                                                                 │
│  GET /api/lightcurve/{planet_name}/folded   ← 신규            │
│    params: ?period=384.843&bins=200                            │
│    위상 접기 (numpy binning) → bins개 포인트 반환              │
│                                                                 │
│  (기존) GET /api/planets, /api/health — 변경 없음              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  backend/cache/                                         │   │
│  │    lc_kepler-452-b_kepler.json    ← 캐시 파일           │   │
│  │    lc_k2-18-b_kepler.json                              │   │
│  │    ...                                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │ MAST
         mast.stsci.edu (Lightkurve 내부 처리)
```

**데이터 흐름 (캐시 미스)**:
1. 클라이언트 `GET /api/lightcurve/Kepler-452 b`
2. 백엔드 → planets 캐시에서 `hostname = "Kepler-452"` 조회
3. `lk.search_lightcurve("Kepler-452", mission="Kepler").download()` → FITS
4. `lc.normalize().remove_nans()` → flux array (~65,000점)
5. 데시메이션 → 5,000점 → JSON 직렬화
6. `backend/cache/lc_kepler-452-b_kepler.json` 저장
7. 응답 반환 (~500ms 캐시 후 / ~10s 최초)

---

## 3. Lightkurve API

```python
import lightkurve as lk

# 검색
search_result = lk.search_lightcurve(
    "Kepler-452",          # 항성 이름 또는 TIC ID
    mission="Kepler",      # 'Kepler' | 'K2' | 'TESS'
    author="Kepler",       # PDCSAP_FLUX 제공자
    exptime="long",        # 30분 cadence (short = 1분)
)

# 다운로드 (MAST에서 FITS 가져옴 — 5~15초)
lc_collection = search_result.download_all()
lc = lc_collection.stitch()        # 분기(quarter)별 파일 연결

# 전처리
lc = lc.normalize()                # 중앙값 = 1.0
lc = lc.remove_nans()              # NaN flux 제거
lc = lc.remove_outliers(sigma=5)   # 5σ 이상 아웃라이어 제거

# 직렬화
time_arr = lc.time.value.tolist()  # BTJD float 배열
flux_arr = lc.flux.value.tolist()  # normalized flux
err_arr  = lc.flux_err.value.tolist()

# 위상 접기
lc_folded = lc.fold(period=384.843, epoch_time=lc.time[0])
```

**BTJD**: Barycentric TESS Julian Date. `lc.time` 단위.
Kepler는 BKJD (Barycentric Kepler JD = BJD - 2454833.0).
Lightkurve는 내부적으로 Time 객체 처리 — `lc.time.value`로 float 접근.

---

## 4. 데이터 모델

### Backend: Pydantic (`backend/models/lightcurve.py`)

```python
from pydantic import BaseModel
from typing import Optional

class LightCurveResponse(BaseModel):
    planet_name: str
    hostname: str
    mission: str                    # "Kepler" | "TESS"
    time: list[float]               # BTJD/BKJD days (데시메이션 후)
    flux: list[float]               # normalized (1.0 = normal brightness)
    flux_err: list[float]
    period: Optional[float]         # orbital period (days) — from planets cache
    point_count: int                # 반환된 포인트 수
    original_count: int             # 데시메이션 전 원본 포인트 수

class PhaseFoldResponse(BaseModel):
    planet_name: str
    period: float
    phase: list[float]              # 0.0 ~ 1.0
    flux: list[float]               # binned mean flux
    flux_err: list[float]           # binned std
    transit_depth: Optional[float]  # 1 - min(flux)
    transit_duration: Optional[float]  # hours (from planet data)
```

### Frontend: TypeScript (`frontend/src/lib/api/lightcurve.ts`)

```ts
export interface LightCurveData {
  planet_name: string
  hostname: string
  mission: string
  time: number[]
  flux: number[]
  flux_err: number[]
  period: number | null
  point_count: number
  original_count: number
}

export interface PhaseFoldData {
  planet_name: string
  period: number
  phase: number[]
  flux: number[]
  flux_err: number[]
  transit_depth: number | null
  transit_duration: number | null
}
```

---

## 5. 폴더 구조

```
backend/
├── main.py                      ← lifespan에 lightcurves 라우터 추가
├── routers/
│   ├── planets.py               ← 기존 — 변경 없음
│   └── lightcurves.py           ← 신규 Phase 6
├── services/
│   ├── archive.py               ← 기존 — 변경 없음
│   └── mast.py                  ← 신규: Lightkurve 래퍼 + 파일 캐시
├── models/
│   ├── planet.py                ← 기존
│   └── lightcurve.py            ← 신규
├── cache/                       ← 신규 (gitignore)
│   └── lc_*.json
├── requirements.txt             ← lightkurve 추가
└── nixpacks.toml                ← 변경 없음 (nixpacks이 requirements.txt 자동 처리)

frontend/src/
├── pages/
│   └── DataPage.tsx             ← 신규 (/data 진입점)
├── components/
│   └── data/
│       ├── PlanetSearchBar.tsx  ← 행성 이름 검색 (Phase 5 planets 목록 활용)
│       ├── LightCurveChart.tsx  ← D3 시계열 차트 (raw)
│       ├── PhaseFoldChart.tsx   ← D3 위상 접기 차트
│       └── TransitInfo.tsx      ← transit depth/duration/radius 패널
├── lib/
│   └── api/
│       ├── exoplanet.ts         ← 기존 — 변경 없음
│       └── lightcurve.ts        ← 신규
└── router.tsx                   ← /data 라우트 추가 (React.lazy)
```

---

## 6. 캐시 전략

```python
# backend/services/mast.py

import json, re
from pathlib import Path

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

def _cache_key(planet_name: str, mission: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', planet_name.lower()).strip('-')
    return f"lc_{slug}_{mission.lower()}"

def _cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.json"

def load_from_cache(key: str) -> dict | None:
    p = _cache_path(key)
    if p.exists():
        return json.loads(p.read_text())
    return None

def save_to_cache(key: str, data: dict) -> None:
    _cache_path(key).write_text(json.dumps(data))
```

`backend/cache/` 는 `.gitignore` 에 추가 — 생성된 데이터이므로 커밋 불필요. 단, `backend/cache/.gitkeep`으로 폴더 추적.

---

## 7. 데시메이션

Kepler long cadence 4년치 ~65,000점을 그대로 전송하면 JSON ~2MB.
D3 렌더 목적에 5,000점이면 충분 (전체 추세와 transit dip 보존).

```python
import numpy as np

def decimate(time, flux, flux_err, max_points=5000):
    n = len(time)
    if n <= max_points:
        return time, flux, flux_err
    step = n // max_points
    idx = np.arange(0, n, step)
    return time[idx], flux[idx], flux_err[idx]
```

단순 균등 샘플링. Transit dip은 폭이 ~10시간 = ~20포인트 (30분 cadence) 이므로
5,000점 / 65,000점 = 1/13 스텝에서도 최소 1~2포인트는 포함됨.
더 정밀한 보존이 필요하면 Phase Fold 뷰에서 처리.

---

## 8. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프

- **파일 캐시 vs Redis**: MAST 호출 결과는 변하지 않음 (케플러 관측은 완료). 파일 캐시로 영구 보존. Redis = YAGNI.
- **서버사이드 위상 접기 vs 클라이언트**: 65,000 float 연산은 Python/numpy가 적합. 결과 200 bins만 전송. 클라이언트가 직접 해도 되지만 일관성을 위해 서버.
- **데시메이션 vs 전체 전송**: 2MB JSON은 모바일에서 느림. 5,000점 데시메이션으로 ~200KB. Transit dip 보존은 Phase Fold 뷰에서 보완.
- **PDCSAP_FLUX vs SAP_FLUX**: PDCSAP가 대부분의 경우 더 깨끗함. 사용자 선택 불필요.
- **Kepler 우선**: Phase 5 PRD의 "케플러 폭발" 서사 연계. TESS는 단기 관측 (~27일) 라 transit 적게 포착됨 → fallback으로만.

### 알려진 한계

- **Lightkurve 설치 크기**: `lightkurve` + `astropy` = ~100MB. Railway 빌드 시간 증가 예상. nixpacks.toml 에 이미 준비됨.
- **모든 행성에 Kepler 데이터가 없음**: Radial Velocity 발견 행성, 지상 망원경 발견 행성 등은 Kepler/TESS가 관측하지 않을 수 있음. 404 fallback 필요.
- **MAST 호출 시간**: 최초 ~5~15s. 로딩 UX 필수. 진행 상태 메시지 없이는 사용자가 멈춘 줄 앎.
- **Railway 콜드 스타트**: 기존 Phase 5 문제 그대로. 파일 캐시는 재시작 후 유지 (Railway persistent disk 필요 — 또는 콜드 스타트 시 재생성 허용).
- **Railway persistent disk 미확정**: Railway 무료 플랜에 persistent disk 없음. 재배포 시 캐시 초기화. 포트폴리오 데모 목적에서 허용.

---

## 9. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| MAST API 다운 / 타임아웃 | 중간 | `asyncio.wait_for` 30s 타임아웃 + 명확한 에러 메시지 |
| Lightkurve MAST 인증 필요 | 낮음 | Kepler/TESS 공개 데이터는 인증 불필요. 확인 완료 |
| 행성에 Kepler/TESS 데이터 없음 | 높음 | `search_result` 비어있으면 404 + "No light curve available" 메시지 |
| Lightkurve astropy 버전 충돌 | 중간 | `requirements.txt`에 `lightkurve==2.4.2` 핀 + 로컬 `pip install` 검증 |
| D3 + React StrictMode 이중 실행 | 중간 | Phase 5와 동일: `useEffect` cleanup (`d3.select(ref).selectAll('*').remove()`) |
| 65,000점 D3 SVG 성능 | 낮음 | 데시메이션으로 5,000점만 전달. 느리면 Canvas 전환 (measurement-first) |
| `backend/cache/` 용량 | 낮음 | 행성 하나당 ~200KB. 100개 = ~20MB. 포트폴리오 범위 내 무시 |
| TypeScript strict 미사용 필드 | 낮음 | `npm run build` push 전 필수 (Phase 4 교훈) |

---

## 10. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **6-1**: Lightkurve 설치 + `/api/lightcurve/{name}` + `/api/lightcurve/{name}/folded` + 파일 캐시. *"curl로 Kepler-452 b 광도곡선이 오면 성공"*
- **6-2**: DataPage 구현 — D3 LightCurveChart (raw) + D3 PhaseFoldChart. *"브라우저에서 transit dip이 보이면 성공"*
- **6-3**: Planet 연결 (ExoplanetPage → DataPage) + TransitInfo 패널 + Lighthouse + Phase 종료

---

*"TechSpec은 결정의 카탈로그다."*
*"Phase 5가 지도였다면, Phase 6는 원본 녹음 파일이다."*
