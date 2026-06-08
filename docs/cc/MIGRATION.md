# 🚚 MIGRATION — 채팅 → Claude Code (Phase 4 진입)

> Phase 1~3 은 *채팅 + 파일 업로드/다운로드* 로 했다. Phase 4 부터 *Claude Code* 로
> 옮긴다. 이 문서는 "무엇이 바뀌고 무엇이 그대로인가" 한 장 요약. 정본은
> `docs/cc/COLLABORATION.md` + `docs/cc/WORKFLOW.md`.

---

## 왜 옮기나

sub-3-7 한 sub-phase 에서 파일을 **10번 넘게** 주고받았다. Phase 4 (GLSL 블랙홀)
는 셰이더 hot-reload 가 잦아 그 핑퐁이 훨씬 심해진다. Claude Code 는 레포를 *직접*
읽고 편집하니 그 왕복이 사라진다.

---

## 무엇이 바뀌나 — 주체 표

| 작업 | 채팅 (Phase 1~3) | Claude Code (Phase 4~) |
|------|------------------|------------------------|
| 파일 읽기 | 권이건이 업로드 | **Claude 가 레포에서 직접** |
| 파일 쓰기 | Claude 가 완성본 → 권이건 다운로드 | **Claude 가 직접 편집** |
| 빌드 확인 | Claude 가 *추측* / 권이건이 로컬 실행 | **Claude 가 `npm run build` 직접 실행** ✅ |
| 테스트 | 권이건이 로컬 | **Claude 가 `npm test` 직접 실행** ✅ |
| Issue/Milestone | 권이건이 PowerShell `gh` | **Claude 가 `gh` 실행** (승인 후) |
| `git add` + 메시지 | 권이건 | **Claude** |
| **`git commit`** | 권이건 | **Claude (확인 후 실행)** ✅ |
| **`git push`** | 권이건 | **권이건 (게이트 유지)** 🚪 |

---

## 게이트 — 왜 커밋·push 는 그대로 본인 손인가

§10-2 *"이해 없이 쌓인 코드는 면접에서 무너진다"*. 커밋 순간이 곧 *이해를 확인하는
지점*이다. Claude 가 다 자동화하면 빠르지만, *네가 무엇을 커밋하는지 모른 채* 쌓인다.
그래서:

- Claude 는 **`git add` + 메시지 제시 + 확인 요청 → `git commit` 실행**
- 너는 **메시지·diff 검토 → OK** (또는 수정 지시)
- push 는 sub-phase 끝에 **네가 검토 후**

빠름보다 이해. 이 프로젝트의 영혼.

---

## 가장 큰 이득 — "추측 통과" 의 종말

채팅에선 Claude 가 `npm run build` 를 *못 돌려서*, 타입 통과를 눈으로 추정해 파일을
줬다 (그래서 `tsc -b` push 전 필수 규칙이 생김 — TS1294, unused 등이 새곤 했다).

CC 에선 Claude 가 **빌드·테스트를 진짜로 돌려보고** 통과한 것만 커밋 단계로 올린다.
*추측 통과 금지*. 이게 신뢰도에서 가장 큰 개선.

---

## 안 바뀌는 것 (영혼은 그대로)

- 한국어 반말, 천문학 비유
- PCTC (Plan-Code-Test-Check), 묶음 패턴, 하루 6~10 커밋
- *실물이 정본* — 오히려 *강해진다* (Claude 가 실물을 직접 읽는 게 기본값)
- measurement-first, YAGNI, Phase = 세션 분리
- Issue=트래커 / `docs/checks/`=회고 정본
- Conventional Commits (영어), GitHub Milestone/Issue 흐름

---

## 첫 세션 시작법 (Phase 4)

1. Claude Code 설치 + 레포 열기 *(설치/셋업은 권이건 환경에서 — 공식 문서 참조)*
2. 새 세션에서 Claude 에게 읽힐 것:
   `docs/cc/COLLABORATION.md`, `docs/cc/WORKFLOW.md`,
   `docs/phase-handoffs/phase-3-to-4.md`, `README.md`
3. 첫 메시지: *"Phase 4 시작하자"*
4. Phase 4 PRD + TechSpec 작성 → Milestone 생성 → sub-4-1 Plan → Issue → Code

> ⚠️ CC 가 도는 OS 셸(PowerShell / bash / zsh)에 따라 `gh`·`git` 명령 줄바꿈
> 문법이 다르다. Claude 가 네 셸에 맞춰 낸다 — 첫 세션에서 OS 만 알려주면 된다.

---

*"가벼운 짐만 들고 다음 별로 떠난다. 이번엔 우주선을 새로 갈아탄다."*
