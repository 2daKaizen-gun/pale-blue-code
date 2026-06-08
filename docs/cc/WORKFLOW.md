# 🔄 WORKFLOW — PCTC 사이클 (Claude Code 판)

> *Plan → Code → Test → Check*
> *Pale Blue Code 의 모든 작업이 따르는 표준 사이클.*
>
> **Claude Code 환경 전용.** Phase 1~3 (채팅) 정본은 루트 `WORKFLOW.md`. 차이
> 요약은 `docs/cc/MIGRATION.md`. 핵심 변화: 파일 업로드/다운로드 핑퐁이 사라지고
> Claude 가 레포를 *직접* 읽고 편집·`gh`·`git add`·`npm run build` 를 실행한다.
> **커밋(`git commit`)·push 만 권이건 게이트.**

---

## 작업 단위의 계층

| 계층 | 산출물 | 시점 | 위치 | GitHub |
|------|--------|------|------|--------|
| **Phase** | PRD + TechSpec | Phase 시작 1회 | `docs/specs/phase-N/` | **Milestone** |
| **sub-phase** | PCTC Full | 각 sub-phase 시작/종료 | 세션 + `docs/checks/` | **Issue** |
| **커밋** | PCTC Light | 30분~1시간 | 세션 → 커밋 | Issue 체크리스트 |

PRD/TechSpec = *왜/무엇*, PCTC = *어떻게/언제*, GitHub = *진행 가시화*.
TechSpec §7 은 sub-phase 제목만, 상세는 각 sub-phase Plan 에 위임.

---

## 양식 안내

| 양식 | 사용 | 예 |
|------|------|---|
| **Full** | sub-phase 단위 (며칠) | "BLS 구현", "렌징 셰이더" |
| **Light** | sub-phase 내 작은 작업 (30분~1h) | "스피너 추가", "토큰 정의" |

규칙:
- **하나의 sub-phase = 1 Full 사이클** (시작 Plan + 종료 Test + Check)
- **그 안 모든 커밋 단위 = Light 사이클**
- **큰 sub-phase 는 *묶음(bundle)* 으로 조직** — Plan 의 작업 분할이 성격 다른
  갈래로 나뉘면(예: 버그픽스 / 신기능 / 마감) 묶음 단위로 순차 진행. 1 Full
  사이클은 유지(Plan·Test·Check 는 전체에 한 번), 내부를 묶음으로 나눠 커밋 페이스와
  빌드 의존 순서를 지킨다 (sub-3-7 = A/B/C, 8 커밋). **묶음은 별도 sub-phase 가
  아니다** — Issue 하나, Check 하나.

---

# 🚀 Phase 시작 절차 (한 번만)

### 1. 컨텍스트 복원
새 Claude Code 세션에서 다음을 *읽게* 한다 (첨부 아니라 경로 지정):
`docs/cc/COLLABORATION.md` · `docs/cc/WORKFLOW.md` ·
`docs/phase-handoffs/phase-{N-1}-to-{N}.md` · `README.md`

### 2. PRD + TechSpec
`docs/specs/phase-{N}/PRD.md` · `TECHSPEC.md` (Claude 가 초안, 권이건 확정)

### 3. GitHub Milestone (Claude 실행, 권이건 승인)
```bash
gh api repos/:owner/:repo/milestones \
  -f title="Phase {N} — {이름}" \
  -f state="open" \
  -f description="{한 줄 요약}"
```
> ⚠️ `—` 는 em-dash. 아니면 `could not resolve to a MilestoneNumber`.
> CC 는 Linux/macOS 셸이면 backtick 대신 `\` 줄바꿈. (PowerShell 환경이면 채팅판
> 문법 그대로 — 네 CC 가 도는 OS 셸에 맞춘다.)

### 4. (필요시) 라벨
```bash
gh label create "phase-{N}" --color "{hex}" --description "Phase {N} — {이름}"
```

### 5. 첫 sub-phase Plan 진입 → 아래.

---

# 🎯 Sub-phase 시작 절차 (매번)

### 1. Plan 작성 (Claude 와 함께)
아래 [Plan] 양식. 핵심 질문 / 작업 분할(묶음) / 성공 기준 확정.

### 2. GitHub Issue 생성 (Claude 실행, 권이건 승인)
Plan 확정 직후 Claude 가 본문을 `scripts/issue-{N}-{M}-body.md` 에 *직접 작성* 하고
`gh issue create` 를 실행한다. **생성 전 권이건에게 본문·제목·라벨을 보여 승인받는다.**

```bash
gh issue create \
  --title "{N-M}: {제목}" \
  --body-file scripts/issue-{N}-{M}-body.md \
  --milestone "Phase {N} — {이름}" \
  --label "phase-{N},sub-phase,{성격라벨}"
```

본문 구성: Plan / Lights / Success criteria / Key decisions / References.
`scripts/issue-*-body.md` 는 *git 추적* (결정의 흔적). 성격 라벨:
`enhancement` / `refactor` / `bug` / `chore` / `documentation`.

> CC 이점: 본문을 here-string 으로 변수에 담을 필요 없이 Claude 가 파일을 바로 쓴다.
> 인코딩(UTF-8 no BOM) 도 Claude 가 보장 — em-dash 안 깨짐.

### 3. Code 단계 진입 → Light 사이클.

---

# 📘 Full 사이클 (sub-phase 단위)

## 🅿️ Plan
```
[Plan] sub-phase {번호}: {제목}
목표 / 배경·동기 / 범위(포함·제외) / 기술 결정(라이브러리·아키텍처·TDD 여부) /
작업 분할(묶음 → Light, 하루 6~10 커밋 페이스) / 위험 / 성공 기준(검증 가능하게)
```
Plan 확정 시 Claude 가 Issue 본문 초안(영어)도 함께. 확정 + Issue 생성 후 Code.

## 💻 Code
Plan 의 묶음/Light 를 순서대로 구현. Claude 가 **파일을 직접 편집**한다 —
*실물을 먼저 읽고* (추정 금지, 구현이 정본). TDD 적용 sub-phase 는 실패 테스트 먼저.
막히면 즉시 멈추고 알리기 (혼자 30분 이상 X). 빌드 의존: import 내리는 쪽 ↔ 받는
쪽은 *각각 독립 빌드 통과* 순서로.

## 🧪 Test
sub-phase 코드 완료 후 통합 검증.
```
[Test] sub-phase {번호}
자동: vitest/pytest 결과 (Claude 가 직접 실행) /
수동: 브라우저·API 동작 / 에지케이스(빈 입력·네트워크 실패·잘못된 데이터) /
성공 기준 점검 (Plan 항목별 체크)
```
> CC 이점: `npm test` / `npm run build` 를 Claude 가 *진짜로 돌려* 결과를 보고한다.
> 추측한 통과는 금지 (이게 채팅판 대비 가장 큰 신뢰 개선).

## ✅ Check (회고)
```
[Check] sub-phase {번호}
잘된 점 / 막혔던 점(문제·원인·해결 — 포트폴리오 Troubleshooting 직행) /
리팩토링 후보 / 다음 sub-phase 교훈 / 🌌 이번에 알게 된 우주의 한 조각
```
→ `docs/checks/phase-N/sub-N-M.md` 로 저장 (Claude 가 직접 작성).

### Check 직후 마무리 (필수)

**1. 마일스톤 현황 표시**
```
📍 Phase {N} — {이름}
├── ✅ N-1: {제목}   (#5)
├── ✅ N-2: {제목}   (#6)   ← 방금
└── ⬜ N-3: {제목}   (Issue 미생성)
```

**2. Issue close** — 자동(마지막 커밋 `Closes #N`) 권장. 수동이면 `gh issue close`.

**3. `git push origin main` — 권이건 게이트.**
- Claude 가 `git log --oneline` 으로 이번 묶음을 보여주고 push 를 *제안*
- **권이건이 검토 후 직접 push** (또는 승인). push 가 Vercel 배포 + `Closes #N` 트리거
- **sub-phase 단위로만 push** (Light 마다 X)

---

# 📗 Light 사이클 (커밋 단위)

```
[Light] {작업명}
P: (한 문장 — 무엇을 왜)
C: (구현 — Claude 가 파일 편집)
T: (검증 — Claude 가 build/test 실행 결과 한 줄)
C: (배운 것/다음 — 생략 가능)
→ Claude: git add + 커밋 메시지 제시 + 확인 요청 → 권이건: OK → Claude: git commit (#N)
```
마지막 Light 의 커밋만 `Closes #N`.

**커밋 게이트 흐름** (CC 핵심):
1. Claude: 파일 편집 → `npm run build` 통과 확인 → `git add <files>` → 메시지 제시 + 확인 요청
2. 권이건: `git diff --staged` 검토 → **OK** (또는 수정 지시)
3. Claude: `git commit -m "..."` 실행
4. 묶음/sub-phase 끝까지 반복 → 마지막에 권이건 push

---

# 🚨 PCTC 위반 신호

- ❌ Plan 없이 Code → 방향 상실
- ❌ 한 커밋에 Light 여러 개 → 쪼개기
- ❌ Test 없이 다음 sub-phase → 부채
- ❌ Check 생략 → 인수인계 빈약
- ❌ **빌드 안 돌리고 커밋 add** → CC 인데 추측 통과. `npm run build` 먼저
- ❌ **확인 없이 commit** → 반드시 메시지 제시 후 OK 받고 실행. push 는 권이건
- ❌ **Light 여러 개 한 커밋** → 파일 묶음을 Light 단위로 쪼개서 커밋
- ❌ push 누락 → 배포 멈춤
- ❌ Milestone/Issue 미생성, 미close → 진행 가시화 깨짐

Claude 는 신호 감지 시 *"잠깐, 사이클 어긋났어"*.

---

# 🗂️ `scripts/` 폴더

Issue 본문(`issue-{N}-{M}-body.md`) / 일회성 자동화 / 디버그 스니펫. *git 추적*
기본 (결정의 흔적). 민감/진짜 일회성만 `.gitignore` (`scripts/*.local.*`).

---

# 📎 헌장과의 연결

`docs/cc/COLLABORATION.md` 구체화: §4 리듬 + §5 커밋 게이트 + §6 PCTC + §7 학습 +
§9 rot/anxiety + §11~12 책임(주체 = CC 기준).

---

*"계획 없는 코드는 별 없는 밤하늘과 같다."*
