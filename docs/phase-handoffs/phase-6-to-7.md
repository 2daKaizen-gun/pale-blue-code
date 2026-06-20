# Phase 6 → Phase 7 인수인계

**완료일**: 2026-06-21
**소요 기간**: 3일 (예상 3~4일)
**총 커밋**: ~18개
**채팅 링크**: (Phase 6 채팅 — compacted)

---

## 1. Phase 6에서 무엇을 만들었나

- **Lightkurve 백엔드 통합**: NASA MAST에서 케플러/TESS 광도곡선 다운로드 + 정규화 + 데시메이션(5,000점) + 파일 캐시(`backend/cache/`)
- **FastAPI 신규 엔드포인트**: `GET /api/lightcurve/{planet_name}` (raw) + `GET /api/lightcurve/{planet_name}/folded` (위상 접기, numpy binning)
- **DataPage** (`/data`): PlanetSearchBar(자동완성) + LightCurveChart(D3 raw 시계열, 줌/팬) + PhaseFoldChart(D3 위상 접기, U자 transit dip + amber 마커) + TransitInfo(depth, 추정 반경, 공전 주기)
- **ExoplanetPage → DataPage 연동**: PlanetDetail에 "광도곡선 보기" 버튼 → `/data?planet=...`
- **성능 버그 수정**: `manualChunks` 순서 버그(R3F가 vendor-three로 들어가 React를 끌어들임, 모든 페이지에서 1MB 3D 번들 로딩) 수정 → vendor-r3f로 정리

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| 광도곡선 소스 | Lightkurve + MAST | Kepler 우선 → TESS fallback |
| Flux 종류 | PDCSAP_FLUX | 위성 자세 보정 완료 |
| 캐시 | 파일 기반 `backend/cache/lc_*.json` | `.gitignore`, Railway 재배포 시 초기화 허용 |
| 위상 접기 | 서버사이드 numpy binning (200 bins) | 65,000점 연산 → Python이 적합 |
| 데시메이션 | 균등 샘플링 max 5,000점 | ~200KB 전송, transit dip 보존 |
| 반경 추정 | `δ = (Rp/R*)²`, R* = 1 R_sun 가정 | Phase 7에서 항성 데이터로 개선 가능 |
| vite manualChunks | `@react-three` 먼저, `/three/` 경로 매칭 | 순서 버그 수정 — 절대 되돌리지 말 것 |

---

## 3. 다음 Phase가 재사용할 자산

- `backend/services/mast.py` — Lightkurve 래퍼 + 파일 캐시 패턴 (BLS도 동일 캐시 전략)
- `backend/routers/lightcurves.py` — 라우터 추가 패턴
- `frontend/src/lib/api/lightcurve.ts` — `LightCurveData`, `PhaseFoldData` 타입 (BLS 결과 타입 추가 예정)
- `frontend/src/components/data/LightCurveChart.tsx` — D3 시계열 패턴 (BLS 주기도그램에도 동일 적용)
- `frontend/src/components/data/PhaseFoldChart.tsx` — D3 위상 접기 패턴 재사용

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 6 — Data**: closed ✅
  - #31 (sub-6-1): closed ✅
  - #32 (sub-6-2): closed ✅
  - #33 (sub-6-3): closed ✅
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/6`

### Phase 7 시작 시 생성할 Issue 후보

| 제목 | 라벨 |
|---|---|
| `7-1: BLS period search algorithm` | `phase-7`, `sub-phase`, `enhancement` |
| `7-2: Periodogram chart + candidate display` | `phase-7`, `sub-phase`, `enhancement` |

(Phase 7 PRD 작성 후 확정)

---

## 5. Phase 7 시작점

**Phase 7 시작 시 첫 절차** (WORKFLOW.md 참조):
1. 새 채팅에 컨텍스트 첨부: `docs/cc/COLLABORATION.md` · `docs/cc/WORKFLOW.md` · `docs/phase-handoffs/phase-6-to-7.md` · `README.md`
2. Phase 7 PRD + TechSpec 작성 (`docs/specs/phase-7/`)
3. GitHub Milestone `Phase 7 — Signal` 생성
4. sub-phase 7-1 Plan → Issue → Code

**Phase 7 첫 작업**:
- Phase 6 DataPage에서 이미 PDCSAP_FLUX 광도곡선이 있다.
- Phase 7 = **BLS (Box Least Squares)** 주기 탐색 알고리즘 직접 구현 + 주기도그램 시각화.
- 핵심: `backend/services/bls.py` + `/api/bls/{planet_name}` 엔드포인트 + D3 주기도그램 차트.
- 검증: 알려진 행성(Kepler-452 b, period=384.84d)으로 BLS가 같은 주기를 찾아내면 성공.

---

## 6. 누적 학습

🌌 **Phase 6에서 알게 된 우주의 핵심 개념**:
- **광도곡선(Light Curve)**: 별빛을 시간 축으로 그린 그래프. 별이 쉬지 않고 부르는 노래.
- **Transit Depth**: `δ = (Rp/R*)²`. 0.008% 빛이 줄면 지구 크기 행성이 태양 앞을 지나간 것.
- **Phase Folding**: 공전 주기 T로 시간을 `t mod T` 처리 → 잡음 평균화, 신호 강화. 수백 번의 transit을 하나로 겹쳐 S/N을 높이는 마법.
- **PDCSAP_FLUX**: 위성 자체 자세 변화로 인한 시스템 노이즈를 제거한 보정 광도.
- **BTJD/BKJD**: 태양계 무게중심(Barycenter) 기준 시간 단위. 지구 공전 효과를 제거해 정밀 타이밍 가능.

---

## 7. Claude에게

- PCTC 순서(Plan → Issue → Code → commit 확인)를 반드시 지킨다. sub-6-2, 6-3에서 이슈 없이 코드 먼저 짠 실수 반복 금지.
- 이슈 본문의 완료된 `[ ]` 체크박스는 즉시 `[x]`로 수정해야 한다.
- 커밋 전 반드시 메시지 제시 후 OK 받고 실행. push는 권이건 게이트.
- `manualChunks`에서 `@react-three`는 반드시 `/three/`보다 먼저 체크.

---

## 8. 링크

- Phase 6 specs: `docs/specs/phase-6/`
- 배포: https://pale-blue-code.vercel.app (Vercel, frontend)
- 백엔드 로컬: `http://localhost:8000`
- **Milestone**: https://github.com/2daKaizen-gun/pale-blue-code/milestone/6
- **Issues**: #31 (sub-6-1), #32 (sub-6-2), #33 (sub-6-3)
- **다음 Milestone**: (Phase 7 시작 시 생성)
