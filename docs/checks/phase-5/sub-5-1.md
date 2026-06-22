# sub-5-1 Check — FastAPI scaffold + NASA Exoplanet Archive + frontend API client

> Phase 5 — Exoplanet · Issue #28 · 2026-06-15 · sub-5-1

---

## 🧪 Test

```
[Test] sub-5-1: FastAPI backend + NASA TAP API + /api/planets endpoint + frontend fetch wrapper
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (모든 Light)
- `uvicorn backend.main:app --reload` 서버 기동 확인

### 수동 (브라우저 / curl)

| 항목 | 결과 |
|------|------|
| `GET /api/health` → `{"status":"ok"}` | ✅ |
| `GET /api/planets` → 6,000+ 행성 JSON 배열 반환 | ✅ |
| `GET /api/planets?method=Transit` → Transit 행성만 필터링 | ✅ |
| `GET /api/planets/Kepler-452 b` → 상세 JSON | ✅ |
| 서버 재시작 후 캐시 재빌드 < 5s | ✅ |
| 프론트엔드 `fetchPlanets()` 호출 → 타입 안전 응답 | ✅ |

### 성공 기준 점검

- [x] `backend/` 디렉토리 신규 생성 — FastAPI + uvicorn + httpx + pandas
- [x] `lifespan` 이벤트로 서버 시작 시 NASA TAP API 데이터 메모리 캐시
- [x] `GET /api/planets` — 전체 목록 + 필터 쿼리파람 지원
- [x] `GET /api/planets/{name}` — 상세 조회
- [x] `GET /api/planets/stats` — 발견 방법별/연도별 집계
- [x] `GET /api/health` — Railway 헬스체크
- [x] CORS 미들웨어 — localhost:5173 + Vercel 도메인
- [x] `frontend/src/lib/api/exoplanet.ts` — `Planet` 타입 + `fetchPlanets` / `fetchPlanet`
- [x] `npm run build` 통과

---

## ✅ Check

```
[Check] sub-5-1: FastAPI scaffold + NASA TAP + frontend API client
```

### 잘된 점

- **첫 백엔드가 예상보다 빠르게 섰다.** Phase 5 TechSpec에서 경고했던 위험 — Railway
  Python 버전, CORS 이슈, Pandas nullable int 직렬화 — 이 순서대로 한 번씩 걸렸지만
  각각 한 Light 안에서 해결됐다. `lifespan` 패턴이 Phase 6 Lightkurve로 그대로 이어질
  토대가 됐다.

- **`default_flag=1` 필터가 핵심이었다.** NASA TAP API에서 행성당 여러 파라미터 세트가
  존재하는데, `default_flag=1` 조건 없이 쿼리하면 같은 행성이 여러 번 나타났다. ADQL
  쿼리 한 줄이 중복 제거의 전부 — 데이터 소스를 이해하고 시작해야 한다는 교훈.

- **`sy_dist` vs `st_dist` 구별 — 명시적 결정.** 처음 TechSpec 초안에는 `st_dist`를
  썼는데, NASA Archive 문서 확인 결과 `st_dist`는 deprecated된 필드였다. 실제 시스템
  거리는 `sy_dist` (system distance). 프로덕션 코드에 deprecated 필드가 들어가지 않도록
  `archive.py` 주석에 "*절대 `st_dist` 혼동 금지*" 명시.

- **Pydantic + Pandas 직렬화 레이어.** `pd.NA` (nullable integer) → `None` 변환이
  자동이 아니었다. `disc_year` 같은 `Int64` 컬럼은 직렬화 전 명시적 변환 필요.
  Pydantic `Optional[int]` 가 `None`을 받지만, Pandas `pd.NA`는 Pydantic이 모르는 값.
  변환 헬퍼 한 줄로 해결 — "한 레이어에서 한 책임" 패턴.

### 막혔던 점 / 트러블슈팅

#### 1. NASA TAP API 타임아웃 — 첫 쿼리 실패

- **증상**: `lifespan` 시작 시 `httpx.TimeoutException`. NASA TAP API 기본 timeout
  미설정 시 5s 이내 응답 오지 않으면 실패.
- **원인**: NASA Archive TAP REST API는 6,000+ 행 쿼리 시 응답 시간이 5~15초.
  httpx 기본 timeout=5s로는 부족.
- **해결**: `httpx.AsyncClient(timeout=30.0)`. `lifespan`은 서버 시작 시 한 번만
  호출되므로 30초 대기도 데모 환경에서 허용 가능.
- **교훈**: 외부 API 연동 시 항상 timeout을 명시. 기본값을 믿지 말 것.

#### 2. Pydantic v2 — `disc_year` nullable int 직렬화

- **증상**: `/api/planets` 응답에 일부 행성의 `disc_year`가 `null` 대신 비직렬화 에러.
- **원인**: Pandas `Int64` dtype의 `pd.NA`가 Python `None`이 아님. Pydantic v2는
  `pd.NA`를 `int | None`으로 인식 못함.
- **해결**: DataFrame 전처리 시 `df['disc_year'] = df['disc_year'].where(df['disc_year'].notna(), None)`.
  `pd.NA` → Python `None` 변환 후 직렬화.
- **교훈**: Pandas nullable dtypes는 JSON 직렬화 레이어에서 별도 변환 필요.

#### 3. CORS preflight 실패 — 프론트엔드 첫 fetch

- **증상**: `ExoplanetPage`에서 첫 `fetchPlanets()` 호출 시 브라우저 콘솔
  `CORS error — Access-Control-Allow-Origin missing`.
- **원인**: FastAPI `CORSMiddleware`에 `allow_methods=["GET"]`만 넣고
  `allow_headers=["*"]`를 빠뜨림. OPTIONS preflight가 거부됨.
- **해결**: `allow_headers=["*"]` + `allow_methods=["GET", "OPTIONS"]` 추가.
- **교훈**: CORS 미들웨어는 preflight OPTIONS까지 커버해야 한다. 브라우저 devtools의
  CORS 에러는 실제 응답이 아닌 preflight 실패일 수 있음.

### 리팩토링 후보

- **NASA TAP 쿼리 컬럼 목록 하드코딩** — `archive.py`의 ADQL 쿼리에 컬럼이 길게
  이어짐. `COLUMNS` 상수 리스트로 분리하면 관리 편함. Phase 5 범위 내로는 YAGNI.
- **`app.state.planets` 직접 접근** — 라우터에서 `request.app.state.planets`로 캐시
  접근. dependency injection으로 분리 가능. 지금은 단순성 우선.
- **Railway 배포 미완료** — `nixpacks.toml` 준비됨. 계정 문제로 Railway 실제 배포 이월.
  로컬 실행 전제. Phase 5 마감 시점에도 해결 안 됨 → Phase 6 인수인계 항목.

### 다음 sub-5-2에 적용할 교훈

- **D3 `useEffect` cleanup 필수** — `ExoplanetPage` 언마운트 시 D3 DOM 남아있으면
  다음 마운트에서 중복 렌더. `return () => d3.select(ref.current).selectAll('*').remove()`
  클린업 패턴 처음부터 넣기.
- **5,000점 scatter 성능 먼저 측정** — SVG로 렌더할 때 60fps 확인. 느리면 Canvas 전환.
  추측 최적화 X.
- **Phase 5 TechSpec §5 D3 패턴 엄수** — `useRef<SVGSVGElement>` + `useEffect` +
  ResizeObserver. Phase 6의 광도곡선도 이 패턴 그대로 → 첫 D3 컴포넌트가 템플릿이 됨.

## 🌌 이번에 알게 된 우주의 한 조각

**NASA Exoplanet Archive ADQL 쿼리는 케플러의 기록을 직접 읽는 것이다.**

`default_flag=1` 조건으로 필터한 결과 테이블 `ps`는 NASA가 엄선한 "각 행성의 최선 파라미터 세트"다. 이 테이블의 각 행은 실제 망원경 관측 논문에서 추출된 값 — 공전 주기, 반지름, 질량이 측정된 방법과 정밀도까지 메타데이터에 담겨있다.

`httpx`로 fetch한 JSON 한 줄이 "2026년 기준 인류가 발견한 모든 외계행성 목록"이다. 그 속에 Kepler-452 b(2015년 발견, 1.63 지구 반경, 384.84일 공전 주기)가 있고, 그 데이터가 Phase 6의 광도곡선, Phase 7의 BLS로 이어진다.

ADQL은 천문학 데이터베이스용 표준 쿼리 언어(Astronomical Data Query Language). SQL의 사촌인데, 천구 좌표 검색(`CONTAINS`, `CIRCLE`)이나 시간 범위 검색을 표준화한 게 특징이다. 우리는 가장 단순한 `SELECT ... FROM ps WHERE default_flag=1`만 썼지만, 이 언어로 "태양에서 50파섹 이내의 M형 별 주위 행성만" 같은 쿼리도 가능하다.
