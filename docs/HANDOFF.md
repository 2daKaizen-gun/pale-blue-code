# 🛰️ HANDOFF — Phase 인수인계 템플릿

> *Phase가 끝나고 새 채팅으로 넘어갈 때, 다음 Claude가 5분 안에 컨텍스트를 복원할 수 있게 하는 압축 패키지.*

---

## 절대 원칙

1. **한 페이지를 넘지 않는다** — 길어지면 context anxiety의 원인이 됨
2. **다음 Claude의 진입 키트** — 회고가 아닌 *"앞으로 일하는 데 필요한 것"*만
3. **링크로 위임한다** — 상세는 회고 문서(`docs/checks/`)나 커밋 히스토리에

---

## 사용법

각 Phase 종료 시:

1. 이 템플릿을 복사해서 `docs/phase-handoffs/phase-N-to-M.md` 로 저장
2. 채워넣고 커밋
3. 새 채팅 시작 시 → `COLLABORATION.md` + `WORKFLOW.md` + 이 HANDOFF + `README.md` 첨부
4. 첫 메시지: *"Phase M 시작하자"*

---

## 템플릿

```markdown
# Phase {N} → Phase {M} 인수인계

**완료일**: YYYY-MM-DD  
**소요 기간**: 실제 N주 (예상 N주)  
**총 커밋**: N개  
**채팅 링크**: (이전 Phase 채팅 URL — 검색 가능하게)

---

## 1. Phase {N}에서 무엇을 만들었나 (3줄 이내)

- 핵심 산출물 한 줄
- 부가 산출물 한 줄  
- 배포 / 통합 상태 한 줄

---

## 2. 확정된 기술 결정 (다음 Phase가 따라야 할 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| 라이브러리 X | vN.M.K | (이유 한 줄) |
| 패턴 Y | 채택 / 거부 | (간단히) |
| 폴더 구조 | `src/...` | (재사용될 곳만) |

---

## 3. 다음 Phase가 재사용할 자산

- `src/components/Foo.tsx` — 용도 한 줄
- `src/lib/bar.ts` — 용도 한 줄
- 디자인 토큰: `src/styles/tokens.css`

(다음 Phase가 *반드시* 알아야 할 것만. 모든 파일 나열 X)

---

## 4. 미해결 이슈 / 부채

- [ ] 이슈 #N: 한 줄 설명 — (긴급도: 낮음/중간/높음)
- [ ] 알려진 버그: ...
- [ ] 리팩토링 후보: ...

(없으면 *"없음"* 으로 명시)

---

## 5. 다음 Phase의 시작점

**Phase {M} 첫 작업 (sub-phase {M}-1)**:
- 무엇부터 시작할지 한 단락
- 첫 PCTC Plan에서 다룰 핵심 질문 1~2개

---

## 6. 누적 학습 (한 줄씩)

🌌 **이 Phase에서 알게 된 우주의 핵심 개념**:
- 개념 1 — 한 줄 정의
- 개념 2 — 한 줄 정의
- 개념 3 — 한 줄 정의

(상세는 `docs/checks/phase-{N}/` 의 sub-phase별 Check 문서 참조)

---

## 7. Claude에게 (다음 Phase의 너에게)

- 이전 Phase의 너에게서: 톤 / 협업 스타일 / 주의사항 한두 줄
- 예: *"권이건은 비유로 설명하면 빨리 이해함. 코드 양보다 이해 우선."*

---

## 8. 링크 모음

- 이전 Phase 회고: `docs/checks/phase-{N}/`
- 배포 URL: ...
- GitHub 릴리스: `vN.M.K`
- 관련 PR / 이슈: ...
```

---

## 작성 가이드라인

### ✅ 좋은 HANDOFF의 특징

- 새 채팅의 Claude가 *"내가 뭘 해야 하지?"* 를 5분 안에 답할 수 있다
- *"왜 이렇게 결정했나"* 가 아니라 *"무엇이 결정되었나"* 가 중심
- 미해결 이슈가 명시적이고, 우선순위가 있다
- 다음 Phase의 첫 작업이 구체적이다

### ❌ 피해야 할 안티패턴

- 모든 Light 사이클을 나열함 → 그건 커밋 히스토리에 있음
- 감상문 ("이번 Phase는 정말 보람찼다") → 회고 문서로
- 천문학 지식 누적 전체 → 별도 학습 노트로
- "혹시 모르니 다 적어두자" → context anxiety의 시작
- 결정의 *근거*까지 다 적기 → 결정만 적고, 근거는 링크로

---

## 예시 (가상): Phase 1 → Phase 2 HANDOFF

```markdown
# Phase 1 → Phase 2 인수인계

**완료일**: 2026-05-25  
**소요 기간**: 3주 (예상 2~3주)  
**총 커밋**: 47개  
**채팅 링크**: https://claude.ai/chat/xxx

---

## 1. Phase 1에서 무엇을 만들었나

- React + TypeScript + Vite 셋업 완료, Vercel 자동 배포 작동
- NASA APOD 위젯 (일일 갱신, 에러 처리 포함) 랜딩 페이지에 통합
- 디자인 토큰 시스템 정립, Phase 별 라우팅 구조 완성

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| React | 18.3 | 19는 RTF 호환성 이슈로 보류 |
| 스타일링 | TailwindCSS 3.4 | CSS Modules 검토 후 기각 |
| 상태 관리 | Zustand | Phase 5 백엔드 통합 시 재검토 |
| 라우팅 | React Router 6 | App Router 대신 SPA 유지 |

---

## 3. 다음 Phase가 재사용할 자산

- `src/components/PhaseLayout.tsx` — Phase 페이지 공통 셸
- `src/lib/api/client.ts` — fetch 래퍼 (에러 처리 통합)
- `src/styles/tokens.css` — 우주 테마 색상 / 타이포

---

## 4. 미해결 이슈

- [ ] APOD 비디오 응답 처리 미구현 — 중간
- [ ] 다크모드 토글 추후 — 낮음

---

## 5. 다음 Phase 시작점

**Phase 2 sub-phase 2-1**: Three.js 기초 셋업 + 첫 행성 1개 렌더
- React Three Fiber 도입 결정
- `src/pages/SolarSystem/` 폴더 신설
- 첫 PCTC Plan 핵심 질문: *"공전 궤도를 실제 비율로 그릴까, 시각적 과장으로 그릴까?"*

---

## 6. 누적 학습

🌌 **알게 된 우주의 핵심 개념**:
- APOD가 1995년부터 매일 운영된 NASA의 가장 오래된 웹 프로젝트
- 천문 단위 (AU) — 지구-태양 거리, 약 1.5억 km
- *"창백한 푸른 점"* 의 사진 좌표 (보이저 1호 1990)

---

## 7. Claude에게

- 권이건은 SkyWear의 패턴(MVVM, Retrofit) 익숙. 비교 설명이 빠르게 들어감
- 막히면 30분 안에 알리는 편 — 신뢰하고 기다려도 됨
- 비유 설명을 좋아함, 우주 동기를 놓치지 않게 가끔 환기

---

## 8. 링크

- Phase 1 회고: `docs/checks/phase-1/`
- 배포: https://palebluecode.vercel.app
- GitHub Release: v0.1.0
```

---

## 헌장과의 연결

이 템플릿은 [`COLLABORATION.md`](./COLLABORATION.md) 의 다음 조항을 구체화한다:

- §4 작업 리듬 — Phase 단위 채팅 분리
- §9 Context Rot / Anxiety 방지 — 압축된 인계 문서
- §11~12 책임 — Phase 종료 시 인수인계 작성

---

*"가벼운 짐만 들고 다음 별로 떠난다."*
