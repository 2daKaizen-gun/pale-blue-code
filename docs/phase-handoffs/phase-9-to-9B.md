# Phase 9 → Phase 9-B 인수인계

**완료일**: 2026-07-09
**소요 기간**: ~4일 (sub-9-1 ~ sub-9-3, 2026-07-06 ~ 07-08)
**총 커밋**: ~20개 (PRD/TechSpec → 9-1 엔진 / 9-2 리포트 UI / 9-3 발견기록 v2 + close)
**채팅 링크**: (Phase 9 채팅 — compacted)

> 🛰️ Phase 9(Vetting)는 새 트랙 **"모두의 하늘"의 첫 악장(9-A)**이다. 판별기를 벼렸다.
> 다음 Phase 9-B("울타리 열기")는 그 칼을 들고 **KOI에 없는 별을 실제로 사냥**한다.
> 이 문서는 판별 자산 + 9-B가 이어받을 전제를 인계한다.

---

## 1. Phase 9에서 무엇을 만들었나

- **판별 엔진 (백엔드)**: `GET /api/hunt/vet/{kic}` — 캐시된 LC + BLS 주기로부터 **4관문**(odd/even 깊이 · 2차 식 · 모양 U/V · 크기 S/N+Rp/Rs) 계산 → trust(strong/weak/unlikely). 예정에 없던 **de-alias 엔진** 포함(BLS 알리아스 복원 후 판별).
- **판별 리포트 (프론트)**: `VettingReportCard` — 4관문 순차 공개 + 평이한 한국어 설명 + 신뢰도 종합. HuntPage 흐름에 통합.
- **발견 기록 v2**: `discovery@1` → `@2`로 확장, **판별 근거(4관문+trust)를 기록에 임베드**. 하위호환 리더 + trust별 보고링크 분기(정직성).

---

## 2. 확정된 기술 결정 (9-B가 따라야 할 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| 판별 = 순수 계산 | 새 외부 API 0. 입력=캐시 LC + BLS 주기 | 결정론적·TDD |
| de-alias | 판별 전 `_dealias`로 BLS 알리아스(½·2·4×) 기본주기 복원 | 리포트에 `bls_period`+`alias_factor` 노출 |
| trust 3단계 | strong / weak / unlikely (단언 금지, "~일 가능성" 어법) | 정직성 UI 규칙 |
| 발견기록 스키마 | `pale-blue-code/discovery@2`, `vetting: DiscoveryVetting \| null` | vet 미스는 `null`(연출 금지) |
| 정규화 리더 | `parseDiscoveryRecord` — @2 통과 / @1 in-place 업그레이드 / 그외 throw | 9-C 발견저장소 진입점 |
| 정직 못 3 | 사냥터도 정직해야 — 알려진 KOI를 미스터리로 포장 금지 | **9-B의 핵심 전제** |

---

## 3. Phase 9-B가 재사용할 자산

- `backend/services/vetting.py` — 4관문 + de-alias 엔진 (9-B는 **그대로 재사용**, KIC만 바뀜)
- `backend/models/vetting.py` — `VettingCheck` / `VettingReport`
- `backend/routers/hunt.py` — `GET /hunt/vet/{kic_id}` (424 계약)
- `frontend` 판별 클라이언트 (`fetchVetting` + vetting 타입)
- `frontend/src/components/hunt/VettingReportCard` — 판별 리포트 카드 (9-B 결과 분기 UI가 감쌈)
- `frontend/src/components/ui/Reveal.tsx` — 순차공개 애니메이션 (plain CSS)
- `frontend/src/lib/discovery.ts` — `@2` 스키마 + `parseDiscoveryRecord` (strong+미기록을 신뢰있게 담는 그릇)
- Phase 8 재사용: `hunt.py` LC 캐시 + `koi_check` (9-B의 "KOI에 있는가?" 분기)

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 9 — Vetting**: 모든 sub-phase closed → **milestone close 대상**
  - #39 (sub-9-1): closed ✅
  - #40 (sub-9-2): closed ✅
  - #41 (sub-9-3): closed ✅ (9-A 종료 트리거)
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/9`

### 인계 시점 미해결 항목
- [x] 큐레이션 `4936180` / `7380537` E2E 완주 (2026-07-17): 둘 다 **strong 4/4** — 4936180(K00820.01 CAND, 4.642d, alias 1.0) · 7380537(K00883.01 CAND, 8.066d, ×1/3 서브하모닉 de-alias). CANDIDATE 처분과 무모순(HARD 실패 0).
- [ ] 판별 한계 (문서화됨): `kepler-22b`(BLS 336 비배수 알리아스 미교정), `kepler-452b`(얕은 grazing→정직한 weak)
- [ ] 발견 기록에 주기도그램 PNG 첨부 — 향후 확장 여지만

### Phase 9-B 시작 시 생성할 Issue 후보 (실제 번호는 GitHub 부여)

| 제목 | 라벨 |
|---|---|
| `9B-1: {타깃 선정 — KOI에 없는 KIC 추출 + 자유입력 승격}` | `phase-9B`, `sub-phase`, `enhancement` |
| `9B-2: {진짜 사냥 페이지 — 결과 분기 UI + 정직성 규칙}` | `phase-9B`, `sub-phase`, `enhancement` |
| `9B-3: {발견기록 v2 재사용 + 정직한 빈손/후보 제시}` | `phase-9B`, `sub-phase` |

(분할은 9-B PRD/TechSpec에서 확정)

---

## 5. Phase 9-B 시작점

**Phase 9-B 시작 시 첫 절차** (WORKFLOW.md *"Phase 시작 절차"*):
1. 컨텍스트 복원: `docs/COLLABORATION.md` · `docs/WORKFLOW.md` · 본 문서 · `README.md`
2. `docs/specs/phase-9B/PRD.md` + `TECHSPEC.md` 작성 — **`docs/specs/phase-9/9B-PLAN.md`(Draft)를 정식화**
3. Milestone `Phase 9-B — Opening the Gate` 생성 → sub-9B-1 Plan → Issue → Code

**sub-9B-1 첫 PCTC Plan 핵심 질문** (9B-PLAN §3-1의 "핵심 난제"):
- *"KOI에 없는 KIC를 어떻게 고르는가?"* — 무작위 케플러 샘플링(a) + 자유입력 승격(c) 조합이 계획서 권장안.
- *"빈손을 어떻게 '실패'가 아닌 '결과'로 제시하는가?"* (못 3의 UI 구현)

---

## 6. 누적 학습

🌌 **Phase 9에서 알게 된 우주의 핵심 개념**:
- **Vetting = 배제의 기술**: 검출 ≠ 발견. NASA도 BLS 검출 후 반드시 판별을 거친다.
- **Odd/Even 테스트**: 홀·짝 식 깊이가 다르면 참주기 절반에 락온한 쌍성. 진짜 행성은 매번 동일.
- **2차 식 (secondary)**: 동반체가 별 뒤로 숨을 때 감광이 있으면 = 동반체가 발광체 = 별.
- **U vs V 모양**: 평평한 바닥(U)=온전한 원반 통과(행성적), 뾰족한 바닥(V)=스치는 식(쌍성적).
- **BLS de-alias**: 판별 전 알리아스를 안 풀면 확정행성도 EB로 오판(11446443 사례). 판별의 전제 조건.
- **정직 못 3**: 판별이 정직해도 사냥터가 가짜면 자기기만. 진짜 발견 = KOI에 **없는** 별을 거른 것.

(상세는 `docs/checks/phase-9/sub-9-{1,2,3}.md`)

---

## 7. Claude에게 (Phase 9-B의 너에게)

- 권이건은 빠른 페이스 + 천문학 비유로 빨리 이해. 코드 양보다 이해 우선.
- 커밋 게이트 엄수: `npm run build` (tsc -b) 먼저 → `git add` → 메시지 제시 → OK → commit. push는 sub-phase 단위 게이트.
- **빌드 통과 ≠ 클래스 유효** — Tailwind 커스텀토큰+투명도(`cosmos-nebula/40`)는 CSS 안 나올 수 있음. `tokens.css` 실물 or 표준 팔레트(emerald/amber) 사용.
- manualChunks 순서 `@react-three` → `/three/` **절대 변경 금지**.
- **못 3을 잊지 마라**: 9-B의 존재 이유가 "정직한 사냥터"다. 낭만을 팔지 말고 빈손도 정직한 결과로.
- 라이브 E2E가 정적 검증이 못 잡는 결함(BLS alias seam)을 잡는다 — 마지막엔 실제로 돌려본다.

---

## 8. 링크

- Phase 9 specs: `docs/specs/phase-9/PRD.md` · `TECHSPEC.md` · `9B-PLAN.md`(9-B 초안)
- Phase 9 회고: `docs/checks/phase-9/sub-9-{1,2,3}.md`
- 배포: https://pale-blue-code.vercel.app
- **Milestone (Phase 9)**: https://github.com/2daKaizen-gun/pale-blue-code/milestone/9
- **Issues**: #39 (sub-9-1), #40 (sub-9-2), #41 (sub-9-3)
- **다음 Milestone (Phase 9-B)**: (생성 후 여기 추가)

---

*"판별기를 먼저 벼렸다. 이제 그 칼을 들고 아무도 안 간 하늘로 간다 — 대부분 빈손이겠지만, 그 빈손조차 정직하다."*
