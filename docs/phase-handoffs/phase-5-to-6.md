# Phase 5 → Phase 6 인수인계

**완료일**: 2026-06-18  
**소요 기간**: 1일 (예상 2~3일)  
**총 커밋**: ~22개  
**채팅 링크**: (이전 Phase 5 채팅 — compacted)

---

## 1. Phase 5에서 무엇을 만들었나

- FastAPI + Python 3.11 백엔드: NASA Exoplanet Archive TAP API로 6,298개 행성 데이터 lifespan 캐시
- ExoplanetPage: FilterPanel(발견 방법 필터) + PlanetTable(정렬/검색/페이지) + D3 ScatterPlot(공전주기 vs 반지름, log-log) + PlanetDetail + TimelineView(연도별 누적 막대 애니메이션)
- Lighthouse 85 달성: @fontsource 자체 호스팅, header-first LCP, vendor-three modulepreload 제거

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| 폰트 | @fontsource Latin-only 자체 호스팅 | Google Fonts CDN → Lighthouse LCP 병목 제거 |
| D3 패턴 | useRef + useEffect + ResizeObserver | D3이 SVG DOM 직접 소유, React는 선언만 |
| 백엔드 | FastAPI uvicorn + lifespan 캐시 | 6,298개 행성 메모리 캐시 (재시작 시 재로드) |
| API 거리 필드 | `sy_dist` (시스템 거리) | `st_dist`는 deprecated — 절대 혼동 금지 |
| 코드 분할 | React.lazy() + manualChunks vendor-three/r3f/d3 | vendor-three는 HTML modulepreload에서 제외 |

---

## 3. 다음 Phase가 재사용할 자산

- `frontend/src/lib/api/exoplanet.ts` — Planet 타입 + fetchPlanets/fetchPlanet
- `frontend/src/components/exoplanet/FilterPanel.tsx` — `METHOD_COLOR`, `getMethodColor` (색상 일관성)
- `frontend/src/components/exoplanet/ScatterPlot.tsx` — D3 log-log scatter 패턴 참조용
- `frontend/src/components/exoplanet/TimelineView.tsx` — D3 stacked bar 누적 애니메이션
- `backend/main.py` — FastAPI lifespan 캐시 패턴 (다음 백엔드에서 재사용 가능)

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 5 — Exoplanet**: closed ✅
  - 총 sub-phase Issue: 3개 (#28 ~ #30)
  - Closed: 모두 ✅
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/5`

### 인계 시점 미해결 항목

- [ ] Railway 배포 미완료 — Railway 계정 없어서 스킵. nixpacks.toml은 준비됨 (`backend/nixpacks.toml`). 낮음.
- [ ] 백엔드 프로덕션 배포 없음 — 로컬 실행 전제. Phase 6 시작 전 배포 검토 필요.

### Phase 6 시작 시 생성할 Issue 후보

| 제목 | 라벨 |
|---|---|
| `6-1: ...` | `phase-6`, `sub-phase` |

(Phase 6 PRD 작성 후 결정)

---

## 5. Phase 6 시작점

**Phase 6 시작 시 첫 절차** (WORKFLOW.md의 *"Phase 시작 절차"* 참조):
1. 새 채팅에 컨텍스트 첨부 (헌장 + WORKFLOW + 본 인수인계 + README)
2. Phase 6 PRD + TechSpec 작성 (`docs/specs/phase-6/`)
3. GitHub Milestone `Phase 6 — Data` 생성
4. sub-phase 6-1 Plan → Issue → Code

**Phase 6 첫 작업 (sub-phase 6-1)**:
- Phase 6 "Data"는 데이터 시각화/분석이 주제. Phase 5 Exoplanet 데이터를 기반으로 더 깊은 분석을 할지, 새 데이터셋을 쓸지 결정 필요.
- 핵심 질문: *"Phase 5 백엔드를 그대로 재사용할 것인가, 새 데이터 파이프라인이 필요한가?"*

---

## 6. 누적 학습

🌌 **Phase 5에서 알게 된 우주의 핵심 개념**:
- 외계행성 탐지법 — Transit(별 밝기 감소), Radial Velocity(도플러), Imaging, Microlensing 각각 탐지 가능한 행성 유형이 다름
- Kepler(2009): Transit 탐지 혁명 — 1년에 수십 개에서 수천 개로 발견수 폭증
- TESS(2018): Kepler 후계자, 전 하늘 탐색, 밝은 별 근처 행성 집중
- `sy_dist` = 시스템까지 거리(parsec), `st_dist`는 deprecated

---

## 7. Claude에게

- 권이건은 비유로 빠르게 이해하지만 규칙 위반에 즉각 교정 — **이슈 바디는 반드시 영어만** (한글 U+AC00~D7A3 스캔 후 create)
- 파일 읽기 먼저 → 코드 작성 원칙 철저히 지킴. hallucination 절대 금지.
- CC Gate 규칙: Claude가 commit, push는 항상 사용자 gate.
- PCTC 사이클: Plan → Code → Test → Check 순서. 빌드 먼저 확인 후 커밋.

---

## 8. 링크

- Phase 5 specs: `docs/specs/phase-5/`
- 배포: https://pale-blue-code.vercel.app (Vercel, frontend만)
- 백엔드 로컬: `http://localhost:8000`
- **Milestone**: https://github.com/2daKaizen-gun/pale-blue-code/milestone/5
- **Issues**: #28 (sub-5-1), #29 (sub-5-2), #30 (sub-5-3)
- **다음 Milestone**: (Phase 6 시작 시 생성)
