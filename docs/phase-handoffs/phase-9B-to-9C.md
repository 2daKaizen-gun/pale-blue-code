# Phase 9-B → Phase 9-C 인수인계

**완료일**: 2026-07-16
**소요 기간**: ~7일 (spec 2026-07-09 → sub-9B-1 07-10 · 9B-2 07-11 · 9B-3 07-16)
**총 커밋**: ~20개 (PRD/TechSpec → 9B-1 백엔드 frontier / 9B-2 사냥 페이지 / 9B-3 정직 로그 + 발견기록 결선)
**채팅 링크**: (Phase 9-B 채팅 — compacted)

> 🛰️ Phase 9-B("울타리 열기")는 새 트랙 **"모두의 하늘"의 2악장**이다. 판별기를 들고
> **KOI에 *없는* 별을 실제로 사냥**했다 — 대부분 빈손이고, 그 빈손조차 정직하다.
> 다음 Phase 9-C("모두의 발견")는 그 사냥을 **한 사람에서 모두로** 연다: 계정, 발견
> 저장소, 커뮤니티. 이 문서는 사냥 자산 + 9-C가 이어받을 전제를 인계한다.

---

## 1. Phase 9-B에서 무엇을 만들었나

- **백엔드 frontier**: KOI에 없고 Kepler LC가 실존하는 미기록 KIC 50개를 오프라인
  사전검증해 `frontier_seeds.json`에 커밋. `GET /hunt/frontier/random`(풀 pick) +
  `GET /hunt/recorded/{kic}`(kepid 멤버십, 주기무관 게이트). 판별은 9-A `vet` 그대로.
- **진짜 사냥 페이지 (프론트)**: `FrontierHuntPage` — 미기록 KIC 뽑기 → recorded 게이트
  → lc→bls→vet(9-A 엔진, KOI 대조 없음=미기록 확정) → trust 분기 UI. 교육 데모(HuntPage)와
  **분리된 라우트** `/hunt/frontier`.
- **정직 로그 + 발견기록**: `huntLog`(localStorage "N번 사냥, 후보 M" 정직 집계) +
  strong+미기록일 때만 `DiscoveryActions`로 discovery@2 발견기록 내보내기.

---

## 2. 확정된 기술 결정 (9-C가 따라야 할 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| 타깃 선정 | 씨드 풀(`frontier_seeds.json`) + 라이브 recorded 프로브 | 런타임은 로컬 JSON만 = 결정론·즉시·정직 |
| recorded 게이트 | kepid 멤버십(주기무관). KOI에 있으면 사냥터 아님 | 못 3 = "사냥터도 정직해야" |
| 판별 재사용 | 9-A `vetting.vet` **그대로 감싸기만**. 신규 판별 0 | 불변식 |
| 발견기록 스키마 | `pale-blue-code/discovery@2`, `matches=[]` → `in_catalog:false` | strong+미기록에서만 export |
| 정직 로그 | localStorage append-only. `hunts`는 vet가 실제 돈 것만 | 게이트 거절(recorded/no_lc)은 분모 밖 |
| "발견/후보" 어법 | strong+미기록에서만 축하 허용. 빈손은 결과 | 못 3의 UI 규칙 |
| Frontier 분리 | `/hunt/frontier`는 **네비 미등록**. `phases.ts`에 넣으면 nav 노출됨 | 분리 원칙 = 손대지 말 것 |

---

## 3. Phase 9-C가 재사용할 자산

- `frontend/src/lib/discovery.ts` — `parseDiscoveryRecord` = **9-C 발견저장소 읽기 진입점**.
  @2 통과 / @1 in-place 업그레이드 / 그외 throw. 정규화된 그릇이 이미 대기 중.
- `frontend/src/lib/huntLog.ts` — 정직 집계 코어(`computeStats`/`appendEntry`/`parseLog`).
  9-C가 로그를 계정별·서버측으로 옮긴다면 이 순수 코어가 계약.
- `frontend/src/components/hunt/DiscoveryActions` + `HuntLog` — 발견기록 export / 정직 패널.
- `backend/services/hunt.py` — `is_recorded`/`pick_frontier` + `frontier_seeds.json`.
- `backend/services/vetting.py` — 4관문 + de-alias 엔진 (9-C도 그대로).
- Phase 9-A 자산 전부(`vet` 라우트, `VettingReportCard`, `Reveal`).

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 9-B — Opening the Gate**: 모든 sub-phase closed → **milestone #10 close 대상**
  - #42 (sub-9B-1, 백엔드 frontier): closed ✅
  - #43 (sub-9B-2, 사냥 페이지): closed ✅
  - #44 (sub-9B-3, 정직 로그 + 발견기록): closed ✅ (Phase 9-B 종료 트리거)
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/10`

### 인계 시점 미해결 항목
- [ ] 큐레이션 `4936180` / `7380537` 캐시미스 E2E 미완주 — 낮음 (9-A 인계분, 10583180만 완주)
- [ ] 판별 한계(문서화됨): `kepler-22b`(BLS 336 비배수 알리아스), `kepler-452b`(얕은 grazing→weak)
- [ ] 발견기록에 주기도그램 PNG 첨부 — 향후 확장 여지만
- [ ] **⚠️ gh 활성계정**: 이 repo 이슈 조작은 `gh auth switch --user 2daKaizen-gun` 필요

### Phase 9-C 시작 시 생성할 Issue 후보 (실제 번호는 GitHub 부여)

| 제목 | 라벨 |
|---|---|
| `9C-1: {계정 — 발견 저장소 스키마 + 인증}` | `phase-9C`, `sub-phase`, `enhancement` |
| `9C-2: {발견 제출/조회 — parseDiscoveryRecord 서버측 정규화}` | `phase-9C`, `sub-phase`, `enhancement` |
| `9C-3: {커뮤니티 — 공개 피드 + 정직성 규칙 유지}` | `phase-9C`, `sub-phase` |

(분할은 9-C PRD/TechSpec에서 확정)

---

## 5. Phase 9-C 시작점

**Phase 9-C 시작 시 첫 절차** (WORKFLOW.md *"Phase 시작 절차"*):
1. 컨텍스트 복원: `docs/COLLABORATION.md` · `docs/WORKFLOW.md` · 본 문서 · `README.md`
2. `docs/specs/phase-9C/PRD.md` + `TECHSPEC.md` 작성 (초안 없음 — 9-C는 백지에서)
3. Milestone `Phase 9-C — Everyone's Find` 생성 → sub-9C-1 Plan → Issue → Code

**sub-9C-1 첫 PCTC Plan 핵심 질문** (열린 설계):
- *"발견을 어디에 저장하는가?"* — 지금은 localStorage(브라우저 밖으로 안 나감).
  계정·서버 저장소로 옮기면 백엔드 영속화 + 인증이 처음으로 필요. 큰 아키텍처 결정.
- *"모두에게 열 때 정직성(못 1~3)을 어떻게 지키는가?"* — 공개 피드가 "빈손도 결과"를
  지우지 않도록. strong+미기록만 발견, 나머지는 정직한 시도로.

> **정직한 대안**: 9-C는 규모가 크고(계정/DB/인증) 트랙의 "먼 미래"다. 서두를 필요 없다.
> TESS 데이터 편입(Phase 6 fallback 패턴 재사용) 같은 다른 트랙이 더 자연스러울 수도 있다.

---

## 6. 누적 학습

🌌 **Phase 9-B에서 알게 된 우주/공학의 핵심 개념**:
- **개척지는 대부분 빈손**: 무작위 미기록 별의 절대다수는 행성이 없다. "여기엔 없다"도
  정직한 결과 — 이걸 실패로 칠하면 사냥터가 부정직해진다(못 3).
- **미기록의 정직성**: KOI에 없는 별을 골라야 진짜 사냥. recorded 게이트가 이 정직성의
  기계적 보장 — 이미 기록된 별은 "미스터리"로 포장할 수 없다.
- **정직한 분모**: "N번 사냥"이 신뢰를 얻으려면 게이트에서 걸러진 별(미기록 아님·LC 없음)을
  사냥 수에 넣으면 안 된다. 로그의 정직성 = 분모의 정직성.
- **재사용이 정직을 지킨다**: strong-only export는 조이기가 아니라 스펙(§6). UI로
  우회할 경로가 아예 없게 하는 게 정직성의 구조적 보장.

(상세는 `docs/checks/phase-9B/sub-9B-{1,2,3}.md`)

---

## 7. Claude에게 (Phase 9-C의 너에게)

- 권이건은 빠른 페이스 + 천문학 비유로 빨리 이해. 코드 양보다 이해 우선.
- 커밋 게이트 엄수: `npm run build`(tsc -b) 먼저 → `git add` → 메시지 제시 → OK → commit.
  push는 sub-phase 단위 게이트(권이건 트리거). 이슈 생성은 승인 필요, 본문 영문.
- **빌드 통과 ≠ 클래스 유효** — Tailwind 커스텀토큰+투명도는 CSS 안 나올 수 있음.
  `tokens.css` 실물 or 표준 팔레트(emerald/amber) 사용.
- manualChunks 순서 `@react-three` → `/three/` **절대 변경 금지**.
- **Frontier 분리 원칙**: `/hunt/frontier`를 `phases.ts`에 넣지 마라 — nav에 노출된다.
- **못을 잊지 마라**: 9-C의 위험은 "모두에게 여니까 낭만적으로 팔자"다. 공개 피드가
  빈손을 지우면 못 3이 무너진다. strong+미기록만 발견, 나머지는 정직한 시도.
- 라이브 E2E가 정적 검증이 못 잡는 결함(BLS alias seam)을 잡는다 — 마지막엔 실제로 돌린다.

---

## 8. 링크

- Phase 9-B specs: `docs/specs/phase-9B/PRD.md` · `TECHSPEC.md` (초안 `docs/specs/phase-9/9B-PLAN.md`)
- Phase 9-B 회고: `docs/checks/phase-9B/sub-9B-{1,2,3}.md`
- 이전 인계: `docs/phase-handoffs/phase-9-to-9B.md`
- 배포: https://pale-blue-code.vercel.app
- **Milestone (Phase 9-B)**: https://github.com/2daKaizen-gun/pale-blue-code/milestone/10
- **Issues**: #42 (sub-9B-1), #43 (sub-9B-2), #44 (sub-9B-3)
- **다음 Milestone (Phase 9-C)**: (생성 후 여기 추가)

---

*"울타리를 열었다. 한 사람이 아무도 안 간 하늘을 사냥했고, 대부분 빈손이었다.
이제 그 문을 모두에게 연다 — 빈손까지 정직하게 담은 채로."*
