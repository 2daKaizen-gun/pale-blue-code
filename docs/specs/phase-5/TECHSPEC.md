# Phase 5 TechSpec — Exoplanet

> *작성일: 2026-06-15*
> *상태: Draft → sub-5-1 진입 시 Confirmed*
>
> *스택 실측 (2026-06-15)*: `frontend/package.json` 직접 확인 — React 19.2.5 /
> R3F 9.6.1 / drei 10.7.7 / three 0.170.x / zustand 5.0.13 / vitest 4.1.6 /
> Vite 8.0.10 / TS 6.0.2. **D3.js 미설치** — Phase 5에서 신규 추가.
> **백엔드 없음** (`backend/` 디렉토리 미존재) — Phase 5가 첫 백엔드.
> (Phase 3 "물리 라이브러리 0개", Phase 4 "GLSL 라이브러리 0개" 정신처럼
> Phase 5 백엔드도 최소 의존성: FastAPI + httpx + pandas + astropy-minimal.)

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 이유 |
|------|------|-------------------|------|
| 백엔드 프레임워크 | **FastAPI (Python 3.11)** | Express.js, Django | README 확정 스택. Phase 6-8 Lightkurve/Astropy 네이티브 Python 환경 필요. async 기본 |
| 데이터 소스 | **NASA Exoplanet Archive TAP REST API** (직접 HTTP) | AstroQuery (Python 라이브러리), 로컬 CSV | TAP API 공개, 인증 불필요, ADQL 쿼리로 컬럼 선택 가능. AstroQuery는 같은 API를 래핑 — 의존성 추가 대비 이득 없음. 직접 httpx가 더 투명 |
| HTTP 클라이언트 (백엔드) | **httpx** (async) | requests (동기), aiohttp | FastAPI async 루프와 자연스러운 페어. requests는 동기라 FastAPI lifespan에서 블로킹 위험 |
| 캐싱 전략 | **서버 시작 시 메모리 캐시** (`lifespan` 이벤트) | Redis, SQLite, 매 요청 fetch | 데이터 5,000행 ~500KB. 재시작 시 갱신 충분. Redis = 과잉(YAGNI). 매 요청 fetch = NASA API 호출 제한 리스크 |
| 데이터 처리 | **Pandas DataFrame** | 순수 Python list, Polars | Phase 6-8 Lightkurve/Astropy와 Pandas 생태계 통일. Polars: 더 빠르나 생태계 분리(YAGNI) |
| 프론트 상태 | **React useState + useEffect** (컴포넌트 로컬) | Zustand | 필터/검색 상태는 이 페이지 전용. Phase 4 blackholeStore처럼 전역 store 불필요 |
| 시각화 라이브러리 | **D3.js v7** | Recharts, Plotly.js, Visx | Phase 6 광도곡선에도 재사용. 완전한 제어. Recharts: React 래퍼 한계. Plotly: ~3MB 오버킬 |
| 백엔드 배포 | **Railway** (nixpacks 자동 감지) | Render, Fly.io, Vercel Serverless | README 확정. Python + requirements.txt → 자동 빌드. Dockerfile 불필요 |
| 프론트 API 클라이언트 | **fetch wrapper** (`lib/api/exoplanet.ts`) | TanStack Query, SWR | 데이터 로딩 복잡도 낮음. 캐싱은 백엔드에서. TanStack Query = YAGNI |
| 번들 분리 | **`vendor-d3` manualChunks** (기존 `vendor-three` 패턴 확장) | 단일 번들 | D3 ~500KB. 기존 Phase 3/4 manualChunks 함수형 패턴 그대로 |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend: ExoplanetPage (/exoplanet)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  <FilterPanel />   — 발견 방법 / 크기 슬라이더 / 연도  │  │
│  │  <ViewToggle />    — [산점도] [테이블] [타임라인]      │  │
│  │                                                        │  │
│  │  <ScatterPlot />   ← D3 svg                           │  │
│  │    x: log(공전 주기)  y: 행성 크기  색: 발견 방법     │  │
│  │    click → <PlanetDetail /> 사이드 패널               │  │
│  │                                                        │  │
│  │  <PlanetTable />   ← 검색/정렬/페이지                 │  │
│  │                                                        │  │
│  │  <TimelineView />  ← D3 누적 애니메이션               │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │ fetch                             │
│          lib/api/exoplanet.ts (fetch wrapper)               │
└──────────────────────────────────────────────────────────────┘
                           │ HTTP (JSON)
          Railway 배포 환경 (production)
          localhost:8000 (development)
┌──────────────────────────────────────────────────────────────┐
│  Backend: FastAPI (backend/)                                 │
│                                                              │
│  GET /api/planets          ← 목록 (필터 쿼리파람)           │
│  GET /api/planets/{name}   ← 상세                           │
│  GET /api/planets/stats    ← 발견 방법별/연도별 집계        │
│  GET /api/health           ← Railway 헬스체크               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lifespan startup:                                   │   │
│  │    httpx → NASA TAP API (ADQL 쿼리)                  │   │
│  │    → Pandas DataFrame 전처리 (결측값, 타입 정규화)    │   │
│  │    → app.state.planets (메모리 캐시)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  CORS: ["https://pale-blue-code.vercel.app",               │
│         "http://localhost:5173"]                            │
└──────────────────────────────────────────────────────────────┘
                           │ ADQL HTTP (TAP)
          NASA Exoplanet Archive
          exoplanetarchive.ipac.caltech.edu/TAP/sync
```

**데이터 흐름**:
1. 서버 시작 → `lifespan` → NASA TAP API 쿼리 → DataFrame 캐시
2. 클라이언트 → `GET /api/planets?method=Transit&...` → 캐시 필터링 → JSON
3. `ExoplanetPage` mount → `lib/api/exoplanet.ts` fetch → React state → D3/Table 렌더

---

## 3. NASA Exoplanet Archive API

**엔드포인트**: `https://exoplanetarchive.ipac.caltech.edu/TAP/sync`

**쿼리 방식** (ADQL):
```
GET /TAP/sync?query=select+pl_name,hostname,discoverymethod,...+from+ps+where+default_flag=1&format=json
```

`default_flag=1` — 행성당 하나의 기준 파라미터 세트 (중복 제거).

**가져올 컬럼** (`ps` 테이블):

| 컬럼 | 의미 | 타입 |
|------|------|------|
| `pl_name` | 행성 이름 | str |
| `hostname` | 호스트 항성 이름 | str |
| `discoverymethod` | 발견 방법 (Transit/Radial Velocity 등) | str |
| `disc_year` | 발견 연도 | int? |
| `pl_orbper` | 공전 주기 (일) | float? |
| `pl_rade` | 행성 반경 (지구 반경 단위) | float? |
| `pl_masse` | 행성 질량 (지구 질량 단위) | float? |
| `pl_eqt` | 평형 온도 (K) | float? |
| `st_dist` | 항성계 거리 (pc) | float? |
| `st_teff` | 항성 유효 온도 (K) | float? |
| `sy_snum` | 항성 수 | int? |
| `sy_pnum` | 확인된 행성 수 | int? |
| `disc_facility` | 발견 시설/망원경 | str? |

**Pandas 전처리**:
- NaN → None (JSON null 직렬화)
- `disc_year` float64 → Int64 (nullable int)
- 음수 `pl_orbper` / `pl_rade` → None (Archive 오류 행)
- `discoverymethod` 정규화 (공백 trim)

---

## 4. 데이터 모델

### Backend: Pydantic (`backend/models/planet.py`)

```python
from pydantic import BaseModel
from typing import Optional

class Planet(BaseModel):
    pl_name: str
    hostname: str
    discoverymethod: str
    disc_year: Optional[int]
    pl_orbper: Optional[float]   # days
    pl_rade: Optional[float]     # Earth radii
    pl_masse: Optional[float]    # Earth masses
    pl_eqt: Optional[float]      # K
    st_dist: Optional[float]     # parsecs
    st_teff: Optional[float]     # K
    sy_pnum: Optional[int]
    disc_facility: Optional[str]

class PlanetStats(BaseModel):
    total: int
    by_method: dict[str, int]
    by_year: dict[int, int]      # year → cumulative count (타임라인용)
```

### Frontend: TypeScript (`frontend/src/lib/api/exoplanet.ts`)

```ts
export interface Planet {
  pl_name: string
  hostname: string
  discoverymethod: string
  disc_year: number | null
  pl_orbper: number | null
  pl_rade: number | null
  pl_masse: number | null
  pl_eqt: number | null
  st_dist: number | null
  st_teff: number | null
  sy_pnum: number | null
  disc_facility: string | null
}

export interface PlanetStats {
  total: number
  by_method: Record<string, number>
  by_year: Record<number, number>
}
```

---

## 5. 폴더 구조

```
backend/                         ← Phase 5에서 신규 생성
├── main.py                      ← FastAPI app + lifespan + CORS
├── routers/
│   └── planets.py               ← /api/planets 라우터
├── services/
│   └── archive.py               ← NASA TAP API 클라이언트 + 캐시
├── models/
│   └── planet.py                ← Pydantic 모델
├── requirements.txt             ← fastapi uvicorn httpx pandas
└── .env.example                 ← (ARCHIVE_URL 등 향후 확장용)

frontend/src/
├── pages/
│   └── ExoplanetPage.tsx        ← /exoplanet 진입점 (placeholder → 구현)
├── components/
│   └── exoplanet/
│       ├── ScatterPlot.tsx      ← D3 svg scatter (useRef + useEffect)
│       ├── PlanetTable.tsx      ← 검색/필터/정렬 테이블
│       ├── PlanetDetail.tsx     ← 상세 사이드 패널
│       ├── FilterPanel.tsx      ← 발견 방법 / 크기 / 연도 필터
│       └── TimelineView.tsx     ← D3 누적 애니메이션
├── lib/
│   └── api/
│       └── exoplanet.ts         ← fetch wrapper + 타입
└── (재사용) components/ui/Spinner, AppLayout
```

> **D3 React 통합 패턴**: D3는 DOM을 직접 조작하므로 `useRef<SVGSVGElement>` + `useEffect`로 마운트 후 D3를 붙인다. 데이터/크기 변경 시 `useEffect` deps에 포함해 재렌더. React 컴포넌트는 `<svg ref={svgRef} />` 껍데기만 — D3가 내부를 채운다.

---

## 6. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프

- **메모리 캐시 vs Redis**: 5,000행 ~500KB는 메모리 캐시로 충분. Railway 재시작 시 (~30초) 데이터 재fetch. 24/7 고가용성이 목표가 아닌 포트폴리오 — YAGNI.
- **TAP REST API 직접 vs AstroQuery**: 투명성 우선. AstroQuery는 같은 API를 래핑 + 추가 의존성. 직접 httpx가 Phase 6에서 뭘 하는지 더 명확하게 보임.
- **서버사이드 필터 vs 클라이언트 필터**: 5,000행이면 클라이언트 필터로도 충분. 하지만 백엔드에 필터 파람을 두어 API 일관성 확보. 캐시 Pandas 필터 = O(n) 충분히 빠름.
- **D3 직접 DOM 조작 vs React-D3 하이브리드**: 제어 완전성 우선. React-D3 하이브리드(D3 계산 + React 렌더)는 복잡도만 늘어남. Phase 6 광도곡선도 동일 패턴 사용 예정.
- **가상 스크롤 vs 페이지네이션**: 5,000행 전부 DOM에 올리면 느림. 페이지(50행씩) 또는 가상 스크롤. 단순성 우선 → 페이지네이션. 가상 스크롤은 YAGNI.

### 알려진 한계

- **NASA Archive 가용성**: 외부 API. 서버 장애 시 캐시 없으면 기동 실패 가능. 로컬 fallback CSV 없음 — 포트폴리오 허용 범위.
- **`default_flag=1` 필터**: 행성당 하나의 파라미터 세트를 선택하지만, 발표 논문마다 다른 값을 가질 수 있음. 포트폴리오 시각화 목적 상 충분.
- **Transit bias 미보정**: 탐색 바이어스(Transit은 가까운/큰 행성 선호)를 보정하지 않음. PRD §7에서 시각적으로 설명만.
- **Railway 콜드 스타트**: 트래픽 없으면 Railway가 인스턴스를 sleep. 첫 요청 시 ~30초 기동. 포트폴리오 데모 시 미리 워밍업 필요.

---

## 7. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| NASA TAP API 응답 형식 변경 / 404 | 낮음 | ADQL 쿼리와 컬럼명을 `archive.py`에 집중. 변경 시 한 곳만 수정 |
| CORS 이슈 (프론트↔백엔드) | 중간 | FastAPI `CORSMiddleware` 명시적 origin 목록. Railway 배포 URL 확정 후 env var로 관리 |
| Railway 배포 Python 버전 | 낮음 | `runtime.txt` 또는 `pyproject.toml`로 3.11 고정 |
| D3 + React 이중 DOM 관리 충돌 | 중간 | `useRef` + `useEffect` 패턴 엄수. React StrictMode 이중 실행에 D3 cleanup 필수 (`return () => d3.select(ref.current).selectAll('*').remove()`) |
| 5,000점 산점도 성능 | 중간 | SVG 기본. 느리면 Canvas 렌더(`d3 + <canvas>`)로 전환 — measurement-first |
| Pandas nullable int 직렬화 | 중간 | `pd.NA` → Python `None` 변환 후 Pydantic 직렬화. `Int64` dtype 사용 |
| Railway 콜드 스타트 > 30초 | 낮음 | `/api/health` 헬스체크로 Railway keep-alive 설정 |
| `tsc -b` CORS/fetch 타입 오류 | 낮음 | `frontend/src/lib/api/exoplanet.ts`에 타입 선언. `npm run build` push 전 필수 (Phase 4 교훈) |

---

## 8. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **5-1**: FastAPI scaffold + NASA Exoplanet Archive 연동 (`/api/planets`) + Railway 배포 + 프론트 API 클라이언트. *"백엔드 응답이 오면 성공"*
- **5-2**: ExoplanetPage 구현 — 데이터 테이블(검색/필터/정렬) + D3 산점도(공전 주기 vs 크기). *"5,000개의 점이 화면에 나타나면 성공"*
- **5-3**: D3 발견 타임라인 애니메이션 + 행성 상세 패널 + 모바일/성능/Lighthouse + Phase 종료 + 인수인계

---

*"TechSpec은 결정의 카탈로그다."*
*"Phase 1–4는 렌더링이 정본이었다. Phase 5부터는 데이터가 정본이다."*
