# Phase 8 → Phase 9 인수인계

**완료일**: 2026-06-29
**소요 기간**: ~4일 (sub-8-1 ~ sub-8-3)
**총 커밋**: ~14개 (8-1 백엔드 / 8-2 프론트 + alias 수정 / 8-3 발견 기록 + close)
**채팅 링크**: (Phase 8 채팅 — compacted)

> ⚠️ Phase 8은 9-Phase 로드맵(0~8)의 **마지막 문서화 Phase**다. "Phase 9"는
> 정해진 다음 단계가 아니라, Hunt를 잇는 *열린 트랙*(§5)이다. 이 문서는 프로젝트
> 종착 상태 + 향후 후보 방향을 인계한다.

---

## 1. Phase 8에서 무엇을 만들었나

- **Hunt 백엔드**: `GET /api/hunt/targets` (큐레이션 5타깃) + `/hunt/lc/{kic}` + `/hunt/bls/{kic}` + `/hunt/koi-check` (로컬 KOI 스냅샷 CSV 대조, harmonic-aware).
- **HuntPage**: 타깃 선택 → 순차 LC→BLS→KOI 흐름 → 주기도그램 + BLSResultCard + KOIMatchCard(amber/green/purple 3상태) + **발견 기록 JSON 내보내기 + 보고 링크**.
- **배포 완료**: Vercel(프론트) + 백엔드. 라이브 E2E(Playwright+Edge) 통과.

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| KOI 대조 | 로컬 스냅샷 CSV (`backend/data/koi_catalog.csv`) | API 의존 제거 |
| BLS alias | `_harmonic_factor` — 정수배(≤4×)·부고조파(1/n) 매칭 | sub-8-2에서 발견·수정 |
| `KOIMatch.harmonic` | bls/koi 비율 필드 | UI에 alias 표기 |
| 발견 기록 | **프론트엔드 조립** (`lib/discovery.ts`) | 백엔드 신규 계약 없음 |
| 발견 기록 스키마 | `pale-blue-code/discovery@1` | 버전 태그로 하위 호환 판별 |
| LC fetch 용도 | BLS 캐시 prime(424 방지)용 — 화면 미표시 | 상태로 보관 안 함 |

---

## 3. 다음 트랙이 재사용할 자산

- `backend/services/hunt.py` — KIC LC 캐시 + harmonic-aware `koi_check`
- `backend/routers/hunt.py` — 4 엔드포인트 (404/424 에러 계약)
- `frontend/src/lib/api/hunt.ts` — `HuntTarget` / `KOIMatch` 타입 + 4 GET (`getJSON` 헬퍼)
- `frontend/src/lib/discovery.ts` — `DiscoveryRecord` + `buildDiscoveryRecord` + `downloadJSON`
- `frontend/src/components/hunt/` — HuntTargetCard / KOIMatchCard / DiscoveryActions
- Phase 7 재사용: `PeriodogramChart` · `BLSResultCard` (수정 0)

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 8 — Hunt**: 모든 sub-phase closed → **milestone close 대상**
  - #36 (sub-8-1): closed ✅
  - #37 (sub-8-2): closed ✅
  - #38 (sub-8-3): 이 묶음 마지막 커밋이 `Closes #38`
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/8`

### 인계 시점 미해결 항목
- [ ] 보고 링크 URL 상수 추출 — 낮음 (DiscoveryActions 내 하드코딩)
- [ ] 큐레이션 타깃 중 4936180 / 7380537 / 10583180 — E2E 미구동 (캐시 미스 시 90s 소요라 미검증)
- [ ] 발견 기록에 주기도그램 PNG 첨부 — 향후 확장 여지만

### "Phase 9"(열린 트랙) 후보 방향

| 방향 | 한 줄 |
|---|---|
| TESS 데이터 편입 | Kepler 한정 → TESS sector로 사냥 범위 확장 (PRD §4 제외였음) |
| 멀티 피크 비교 | 현재 최우선 후보 1개 → 상위 N개 주기 비교 UI |
| Transit S/N·쌍성 판별 | 논문 수준 통계 검증 (PRD §4 제외였음) |
| 발견 저장소 | 사용자별 발견 기록 누적 (현재 YAGNI로 제외) |

---

## 5. 다음 트랙의 시작점

Phase 8은 로드맵의 종착점이다. 새 트랙을 연다면 WORKFLOW.md *"Phase 시작 절차"* 그대로:
1. 컨텍스트 복원: `docs/cc/COLLABORATION.md` · `docs/cc/WORKFLOW.md` · 본 문서 · `README.md`
2. 새 PRD + TechSpec 작성 (`docs/specs/phase-9/`) — 방향은 §4 후보에서 권이건 확정
3. Milestone 생성 → sub-phase Plan → Issue → Code

가장 자연스러운 첫 작업: **TESS 데이터 편입** — Phase 6 TESS fallback 패턴이 이미 있어 진입 장벽이 낮다.

---

## 6. 누적 학습

🌌 **Phase 8에서 알게 된 우주의 핵심 개념**:
- **KOI 3분류**: CONFIRMED / CANDIDATE / FALSE POSITIVE — 같은 transit 신호도 후속 검증 단계가 다르다.
- **BLS alias**: 데이터 span ≫ 주기일 때 BLS는 참주기의 정수배/부고조파에 락온한다. 대조 시 harmonic 보정 필수.
- **시민 과학**: 자동 파이프라인은 단주기·깊은 transit에 최적화 — 장주기·낮은 S/N은 아직 발견 대기.
- **독립 검증**: 같은 데이터·독립 알고리즘으로 동일 신호 재현 = 후보 신뢰도 상승.
- **기록이 발견을 만든다**: 관측은 휘발, 기록은 다음 사람에게 건너간다 (발견 기록 JSON의 존재 이유).

(상세는 `docs/checks/phase-8/sub-8-{1,2,3}.md`)

---

## 7. Claude에게

- 권이건은 빠른 페이스 + 천문학 비유로 빨리 이해. 코드 양보다 이해 우선.
- 커밋 게이트 엄수: `npm run build` 먼저 → `git add` → 메시지 제시 → OK → commit. push는 권이건 게이트.
- **빌드 통과 ≠ 클래스 유효** — Tailwind 토큰은 `tokens.css` 실물 확인 후 사용 (cosmos-bg/surface/elevated만 존재).
- 라이브 E2E는 정적 검증이 못 잡는 결함(BLS alias seam)을 잡는다 — 마지막엔 실제 브라우저로 돌려본다.

---

## 8. 링크

- Phase 8 specs: `docs/specs/phase-8/` · 회고: `docs/checks/phase-8/sub-8-{1,2,3}.md`
- 배포: https://pale-blue-code.vercel.app
- **Milestone**: https://github.com/2daKaizen-gun/pale-blue-code/milestone/8
- **Issues**: #36 (sub-8-1), #37 (sub-8-2), #38 (sub-8-3)

---

*"가벼운 짐만 들고 다음 별로 떠난다. 마지막 별이라면, 등불만 켜두고 떠난다."*
