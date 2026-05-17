# 🔄 WORKFLOW — PCTC 사이클

> *Plan → Code → Test → Check*  
> *Pale Blue Code의 모든 작업이 따르는 표준 사이클.*

---

## 작업 단위의 계층

Phase 작업은 3계층으로 구성된다:

| 계층 | 산출물 | 작성 시점 | 위치 | GitHub |
|------|--------|-----------|------|--------|
| **Phase 단위** | PRD + TechSpec | Phase 시작 시 1회 | `docs/specs/phase-N/` | **Milestone** |
| **sub-phase 단위** | PCTC Full 사이클 | 각 sub-phase 시작/종료 | 채팅 + `docs/checks/` | **Issue** |
| **커밋 단위** | PCTC Light 사이클 | 30분~1시간마다 | 채팅 → 커밋 | Issue 본문 체크리스트 항목 |

- PRD/TechSpec = *왜* + *무엇* (Phase 내내 reference)
- PCTC = *어떻게* + *언제* (실행)
- GitHub = *진행의 가시화* (회고 정본은 여전히 `docs/checks/`, Issue 는 트래커)

Phase 단위 산출물은 sub-phase Plan을 *대체하지 않고 위임*한다 — TechSpec §7은 sub-phase 제목만 나열하고, 상세는 해당 sub-phase의 PCTC Plan에 맡긴다.

---

## 양식 안내

| 양식 | 사용 시점 | 예시 |
|------|-----------|------|
| **Full** | sub-phase 단위 (며칠짜리) | *"BLS 알고리즘 구현"*, *"태양계 시각화"* |
| **Light** | sub-phase 내부의 작은 작업 (30분~1시간) | *"로딩 스피너 추가"*, *"색상 토큰 정의"* |

규칙:  
- **하나의 sub-phase = 1 Full 사이클** (시작 Plan + 종료 Test + Check)
- **그 안의 모든 커밋 단위 작업 = Light 사이클**

---

# 🚀 Phase 시작 절차

새 Phase 진입 시 따르는 순서. **한 번만** 한다.

### 1. 컨텍스트 복원
새 채팅 첫 메시지에 첨부:
- `COLLABORATION.md`
- `WORKFLOW.md` (본 문서)
- `docs/phase-handoffs/phase-{N-1}-to-{N}.md`
- `README.md`

### 2. PRD + TechSpec 작성
- `docs/specs/phase-{N}/PRD.md`
- `docs/specs/phase-{N}/TECHSPEC.md`

### 3. GitHub Milestone 생성
레포 루트의 PowerShell 에서 (인코딩 안전을 위해 `gh api` 사용):

```powershell
gh api repos/:owner/:repo/milestones `
  -f title="Phase {N} — {이름}" `
  -f state="open" `
  -f description="{한 줄 요약}"
```

### 4. (필요시) 새 라벨 생성
이 Phase 전용 라벨이 필요하면:

```powershell
gh label create "phase-{N}" --color "{hex}" --description "Phase {N} — {이름}"
```

### 5. 첫 sub-phase Plan 진입
아래 *"Sub-phase 시작 절차"* 로 넘어감.

---

# 🎯 Sub-phase 시작 절차

각 sub-phase 첫 작업 시 따르는 순서. **매 sub-phase 마다** 한다.

### 1. Plan 작성 (Claude 와 함께)
아래 [Plan] 양식 따라 작성. 핵심 질문 / 작업 분할 / 성공 기준 모두 확정.

### 2. GitHub Issue 생성

Plan 확정 직후, Claude 가 Issue 본문 초안 (영어) 을 제공. 권이건이 PowerShell 에서 명령 실행.

**본문 파일은 `scripts/` 폴더에 저장**. 이유:
- 임시 폴더 (`$env:TEMP`) 가 아닌 *레포 안 영구 보관* — *결정의 흔적* 으로 남음
- 미래의 Claude / 권이건이 *"이전 sub-phase Issue 본문 어떻게 썼더라"* 참조 가능
- git 추적 권장 (인계 자료의 일부)

```powershell
# 1) scripts/ 폴더 보장 (없으면 생성)
New-Item -ItemType Directory -Path scripts -Force | Out-Null

# 2) 본문 작성 (UTF-8 no BOM — em-dash 안 깨짐)
$body = @'
## Plan
{목표 한 단락}

## Lights
- [ ] Light 1 — ...
- [ ] Light 2 — ...

## Success criteria
- [ ] ...

## Key decisions
- ...

## References
- PRD: `docs/specs/phase-{N}/PRD.md`
- TechSpec: `docs/specs/phase-{N}/TECHSPEC.md`
- Previous retrospective: `docs/checks/phase-{N}/sub-{N}-{M-1}.md`
'@

$bodyFile = "scripts\issue-{N}-{M}-body.md"
[System.IO.File]::WriteAllText(
  (Resolve-Path scripts).Path + "\issue-{N}-{M}-body.md",
  $body,
  [System.Text.UTF8Encoding]::new($false)
)

# 3) Issue 생성
gh issue create `
  --title "{N-M}: {제목}" `
  --body-file scripts\issue-{N}-{M}-body.md `
  --milestone "Phase {N} — {이름}" `
  --label "phase-{N},sub-phase,{성격라벨}"
```

> ⚠️ Milestone 제목의 `—` 는 **em-dash** (en-dash `–` 도 hyphen `-` 도 아님). 잘못 입력하면 `could not resolve to a MilestoneNumber` 에러.

성격 라벨 선택:
- `enhancement` — 새 기능 추가
- `refactor` — 동작 변화 없는 개선
- `bug` — 버그 수정
- `chore` — 빌드/설정/의존성
- `documentation` — 문서 작업

**왜 PowerShell 인가**: here-string (`@'...'@`) 으로 긴 본문을 *이스케이프 없이* 변수에 통째로 담을 수 있고, UTF-8 no BOM 인코딩을 *명시적으로 강제* 가능. cmd 는 멀티라인 처리가 까다롭고 인코딩 (기본 cp949) 사고가 잦음. *이 프로젝트의 표준은 PowerShell*.

### 3. Code 단계 진입
Light 사이클 시작. 각 커밋 메시지에 Issue 번호 참조 가능:

```
feat(solar): add planet hover detection (#14)
```

마지막 커밋은 `Closes #14` 로 자동 close 트리거:

```
test(solar): verify hover panel integration

Closes #14
```

---

# 📘 Full 사이클 (sub-phase 단위)

## 🅿️ Plan — 설계

작업 시작 전, Claude에게 다음 형식으로 요청한다:

```
[Plan] sub-phase {번호}: {제목}

목표:
- (이 sub-phase 끝났을 때 무엇이 동작해야 하는가)

배경 / 동기:
- (왜 이 작업이 필요한가, 어떤 천문학적 / 기술적 의미인가)

범위:
- 포함: ...
- 제외: ...

기술 결정:
- 사용 라이브러리:
- 아키텍처 결정:
- TDD 적용 여부: [예 / 아니오 / 부분 적용]
  - (이유)

작업 분할 (Light 사이클로 쪼개기):
1. ...  → 예상 커밋: feat(scope): ...
2. ...
3. ...
(하루 6~10 커밋 페이스에 맞춰 분할)

위험 / 막힐 가능성:
- ...

성공 기준:
- (구체적이고 검증 가능하게)
```

Claude는 이 양식에 따라 Plan을 응답한다. **Plan 확정 시 Claude 는 GitHub Issue 본문 초안 (영어) 도 함께 제공**한다. Plan 확정 + Issue 생성 후 Code 단계로 진입.

---

## 💻 Code — 구현

Plan에서 분할한 작업을 **순서대로 Light 사이클로 구현**한다.

원칙:
- TDD 적용 sub-phase: 실패하는 테스트 먼저 → 코드 → 통과 확인
- TDD 미적용 sub-phase: 동작하는 가장 작은 단위마다 커밋
- 막히면 즉시 멈추고 Claude에게 "막혔다" 알리기 (혼자 30분 이상 헤매지 않기)
- 커밋 메시지에 Issue 번호 (`#N`) 참조하면 GitHub 에서 자동 링크됨

---

## 🧪 Test — 검증

sub-phase 모든 코드 작업이 끝난 후, 통합 검증.

```
[Test] sub-phase {번호} 검증

자동 테스트:
- (Vitest / Jest / Pytest 등으로 작성한 테스트 결과)

수동 검증:
- (실제 브라우저 / API 호출로 동작 확인)

에지 케이스:
- 빈 입력:
- 네트워크 실패:
- 잘못된 데이터:
- (해당 작업에 맞는 케이스)

성공 기준 점검:
- [ ] Plan에서 정한 성공 기준 #1
- [ ] 성공 기준 #2
- [ ] ...
```

Claude는 이 단계에서 빠진 케이스나 추가 검증 포인트를 제안한다.

---

## ✅ Check — 회고

sub-phase 종료 시점의 회고. 인수인계 문서의 핵심 재료가 된다.

```
[Check] sub-phase {번호} 회고

잘된 점:
- ...

막혔던 점 / 트러블슈팅:
- 문제:
- 원인:
- 해결:
  (포트폴리오의 Troubleshooting 섹션에 직접 들어갈 수 있게)

리팩토링 후보:
- (지금은 안 하지만 나중에 손볼 곳)

다음 sub-phase에 적용할 교훈:
- ...

🌌 이번에 알게 된 우주의 한 조각:
- (천문학 / 물리학 지식 — 한 단락)
```

이 Check 결과는 → `docs/checks/phase-N/sub-N-M.md` 로 저장.

### Check 직후 마무리 스텝 (필수)

회고 작성 후, sub-phase를 닫기 전에 **항상** 다음 세 가지를 수행한다:

#### 1. 마일스톤 현황 표시

현재 Phase의 sub-phase 진행 상황을 체크리스트로 시각화한다. 형식:

```
📍 현재 마일스톤 현황

Phase {N} — {Phase 이름}
├── ✅ N-1: {제목}            (#5)
├── ✅ N-2: {제목}            (#6)              ← 방금 완료
├── ⬜ N-3: {제목}            (Issue 미생성)
└── ⬜ N-4: {제목}            (Issue 미생성)
```

GitHub Issue 번호도 같이 표시 — *문서와 GitHub 양쪽이 같은 진실을 가리키게*.

#### 2. GitHub Issue close

두 가지 방법:

**자동 (권장)**: 마지막 커밋 메시지에 `Closes #N` 포함 → push 시 자동 close
```
test(solar): verify hover panel integration

Closes #14
```

**수동**: 커밋에 `Closes #N` 안 넣었으면 별도 명령
```powershell
gh issue close {N} --comment "Completed. See ``docs/checks/phase-{N}/sub-{N-M}.md`` for full retrospective."
```

#### 3. `git push origin main`

sub-phase 동안 쌓인 모든 로컬 커밋을 원격에 동기화한다.

```bash
git push origin main
```

원칙:
- **sub-phase 단위로만 push** — 한 sub-phase 안의 Light 사이클마다 push 하지 않는다 (소음 방지)
- push 전에 `git log --oneline` 으로 이번 sub-phase 커밋 묶음을 한 번 확인하면 좋다
- push가 자동 배포 (Vercel) 를 트리거하므로, sub-phase가 완전히 끝난 시점에만 푸시
- push 가 `Closes #N` 트리거 — Issue 자동 close + Milestone 진행률 자동 갱신

---

# 📗 Light 사이클 (커밋 단위 작업)

작은 작업에는 4단계를 압축한 한 호흡으로 처리한다.

## 형식

```
[Light] {간단한 작업명}

P: (한 문장 — 무엇을 왜)
C: (구현. 코드 블록 또는 변경 요약)
T: (어떻게 검증했는지 — 한 줄)
C: (배운 것 또는 다음 단계 — 한 줄, 생략 가능)

→ commit: <type>(<scope>): <description> (#N)
```

> Issue 번호 `(#N)` 은 진행 중인 sub-phase 의 Issue 번호. 마지막 Light 의 커밋에서만 `Closes #N` 으로 바꿈.

## 예시

```
[Light] APOD 컴포넌트에 로딩 스피너 추가

P: 이미지 fetch 중 빈 화면 방지를 위해 스피너 표시
C: useState로 isLoading 추가, fetch 시작/완료 시 토글, 
   <Spinner /> 컴포넌트 조건부 렌더
T: 네트워크 throttle 3G로 설정 후 스피너 1.2초 표시 확인
C: Suspense로 리팩토링 가능 — Phase 1 종료 시 검토

→ commit: feat(apod): add loading spinner during image fetch (#7)
```

---

# 🔄 일일 작업 흐름 (예시)

하루를 PCTC 리듬으로 구성하는 모범 패턴:

```
오전 09:00  [Full Plan]  sub-phase 1-3 시작 — APOD 위젯
            └ Claude와 30분 Plan 세션, 작업 7개로 분할
            └ Claude 가 Issue 본문 (영어) 제공 → 권이건 `gh issue create`
              → Issue #7 open

09:30~12:00 [Light 1] API 키 발급 + .env 셋업      → commit (#7)
            [Light 2] fetch 함수 작성              → commit (#7)
            [Light 3] 응답 타입 정의               → commit (#7)

(점심)

13:00~17:00 [Light 4] APOD 컴포넌트 기본 골격      → commit (#7)
            [Light 5] 스타일링 + 반응형            → commit (#7)
            [Light 6] 로딩 스피너                  → commit (#7)
            [Light 7] 에러 처리                    → commit (`Closes #7`)

17:00~17:30 [Full Test]  통합 검증
17:30~17:50 [Full Check] 회고 → `docs/checks/phase-1/sub-1-3.md`
17:50~18:00 마일스톤 표시 + git push origin main
            → push 시 GitHub 가 `Closes #7` 감지 → Issue #7 자동 close
            → Milestone "Phase 1 — Foundation" 진행률 자동 갱신
```

이 패턴 = 하루 7 커밋 + 1 Full Plan + 1 Full Check + 1 push + Issue 한 생명주기.  
완벽한 *"하루 6~10 커밋"* 페이스.

---

# 🚨 PCTC 위반 시 신호

다음 상황이 보이면 사이클이 무너진 것:

- ❌ Plan 없이 곧장 Code로 들어감 → 중간에 방향 잃을 확률 높음
- ❌ 한 커밋에 Light 여러 개가 섞임 → 너무 큰 단위, 쪼개기
- ❌ Test 없이 다음 sub-phase로 넘어감 → 부채 누적
- ❌ Check 생략 → 인수인계 문서가 비어 있게 되어 다음 Phase 시작이 무거워짐
- ❌ push 누락 → 로컬 커밋이 쌓이고 자동 배포가 멈춤. 다음 sub-phase 시작 전 반드시 동기화
- ❌ 마일스톤 표시 누락 → 진행률 감각 흐려짐. Check 후 자동으로 표시
- ❌ PRD/TechSpec 없이 sub-phase부터 들어감 → Phase 전체 방향 불명확. Phase 시작 시 반드시 작성
- ❌ **Phase 시작했는데 Milestone 미생성** → sub-phase Issue 생성 시 첨부할 Milestone 없음
- ❌ **sub-phase 시작했는데 Issue 미생성** → 진행 가시화 깨짐. Plan 확정 직후 생성
- ❌ **sub-phase Check 끝났는데 Issue close 안 됨** → Milestone 진행률 부정확. `Closes #N` 또는 수동 close

Claude는 위 신호 중 하나라도 감지하면 *"잠깐, 사이클 어긋났어"* 라고 말한다.

---

# 🗂️ `scripts/` 폴더의 역할

`scripts/` 는 *Issue 본문 / 일회성 자동화 / 디버그 스니펫* 등을 담는다.

- **추적 O** (권장 기본값) — Issue 본문 파일 (`issue-{N}-{M}-body.md`) 은 git 추적. *결정의 흔적* 으로 남음. 미래의 Claude / 권이건이 컨텍스트 복원 시 참조 가능.
- *민감 정보 / 진짜 일회성 스크립트* 만 `.gitignore` 에 선택적 추가:
```gitignore
  scripts/*.local.*
  scripts/secret-*
```

`scripts/` 자체는 *항상 추적* (폴더 존재 보장).

# 📎 헌장과의 연결

이 문서는 [`COLLABORATION.md`](./COLLABORATION.md) 의 다음 조항을 구체화한다:

- §4 작업 리듬 — Phase 단위 PRD/TechSpec + Sub-phase 단위 PCTC + GitHub 진행 관리 + sub-phase 종료 시 3대 마무리
- §5 커밋 규칙 — 각 Light 사이클 종료 시 커밋 + Issue 참조
- §6 PCTC 작업 사이클 — 본 문서가 그 상세
- §7 천문학 지식 학습 동반 — Check 단계의 *"우주의 한 조각"*
- §9 Context Rot / Anxiety 방지 — 명시적 사이클로 결정 흐림 방지 + Issue 본문 (트래커) ↔ `docs/checks/` (회고 정본) 역할 분리

---

*"계획 없는 코드는 별 없는 밤하늘과 같다."*
