# Phase 1 → Phase 2 인수인계

**완료일**: 2026-05-09
**소요 기간**: Phase 1 약 1일 (예상 2~3주 → 압축 진행)
**총 커밋**: 약 25개 (sub-phase 1-1 ~ 1-5)
**채팅 링크**: (Phase 1 채팅 URL — 너가 채워넣기)

> **2026-05-10 갱신**: §2 의존성 버전을 *실제 설치본* 으로 정정. Phase 2 시작 시점에 R3F 설치 충돌로 발견. 자세한 내용은 §4-4 참조.

---

## 1. Phase 1에서 무엇을 만들었나

- **1-1** Vite + React 19 + TypeScript 6 프로젝트 셋업, React Router v7 기반 8개 라우트
- **1-2** 디자인 토큰 시스템 — CSS 변수 (`tokens.css`) → Tailwind config 연결, Inter + Space Mono 적용
- **1-3** NASA APOD 위젯 — 오늘의 우주 사진 fetch + 로딩/에러 상태 처리
- **1-4** 랜딩 페이지 + 9개 Phase 카드 로드맵 + 7개 Phase placeholder UI
- **1-5** Vercel 첫 배포 — `https://pale-blue-code.vercel.app` 라이브, GitHub push 시 자동 재배포
- **추가 문서 작업** — Phase 1 종료 시 `COLLABORATION.md` / `WORKFLOW.md` 갱신

---

## 2. 확정된 기술 결정 (실제 설치본 기준)

| 영역 | 결정 | 비고 |
|------|------|------|
| React | **19.2.5** | Vite 템플릿이 latest 끌어옴 (이전 버전의 "18.3" 은 오기) |
| Routing | React Router **v7** (`createBrowserRouter`) | 중첩 라우팅 + `<Outlet />` 패턴 |
| Tailwind | v3 (v4 아님) | v4는 `init` 명령어 제거 + 생태계 미성숙 |
| Vite | **8.0.10** | 2026-03-12 stable, Rolldown 통합 |
| TypeScript | **6.0.2** | latest |
| 디자인 토큰 | CSS 변수 → Tailwind 참조 | Three.js 셰이더에서도 `getComputedStyle`로 읽을 수 있게 양립 |
| 폰트 | Inter (본문) + Space Mono (코드/숫자) | 구글 폰트 CDN |
| 상태 관리 | `useState` + `useEffect` (Phase 1) | **Phase 2 부터 Zustand 도입** (TechSpec 결정 5) |
| 데이터 페칭 | 순수 fetch | TanStack Query는 Phase 5 (백엔드 도입) 시점 검토 |
| 배포 | Vercel + 환경변수 | `VITE_NASA_API_KEY` 대시보드 등록 |
| SPA 라우팅 | `vercel.json` 의 rewrite 규칙 | 모든 경로 → `index.html` 폴백 |

---

## 3. 다음 Phase가 재사용할 자산

### 컴포넌트
- `components/layout/AppLayout.tsx` — 사이드 네비 + `<Outlet />`
- `components/phases/PhaseCard.tsx` — 홈 로드맵용 카드
- `components/phases/PhasePlaceholder.tsx` — Phase 페이지용 placeholder
- `components/ui/Spinner.tsx` — 공통 로딩 스피너
- `components/apod/ApodCard.tsx`, `ApodWidget.tsx` — APOD 표시

### 데이터
- `constants/phases.ts` — 8개 Phase 메타데이터 단일 소스 (네비/카드/페이지가 모두 참조)
- `lib/api/apod.ts` — `fetchApod()` + `Apod` 타입

### 스타일
- `styles/tokens.css` — 색상/간격/타이포 CSS 변수 (`cosmos-bg`, `cosmos-nebula` 등)
- `tailwind.config.js` — 토큰 → Tailwind 클래스 매핑

### 배포
- Vercel 프로젝트 연결됨, 환경변수 등록됨
- `frontend/vercel.json` — SPA fallback rewrite

---

## 4. 미해결 이슈

### 4-1. PRD + TechSpec 도입 (✅ Phase 2 시작 시 완료)

권이건이 1-5 진행 중에 제안: *"Phase 2부터는 집중적으로 뭔가 만들어내니까 PRD + TechSpec 기법 사용하자."*

**Phase 2 시작 시 처리됨**:
- Phase 단위 산출물로 도입, sub-phase 단위 PCTC와는 *계층* 관계
- 양식 정립 완료 (`docs/specs/phase-2/PRD.md`, `TECHSPEC.md`)
- 헌장 §4 + WORKFLOW.md 의 "작업 단위의 계층" 섹션 갱신
- commit: `docs(specs): introduce PRD/TechSpec workflow for phase 2`

### 4-2. Phase 1을 별도 카드로 노출한 결정 자연스러운지 검증

홈 로드맵에서 Phase 0~8 총 9개 카드로 구성했음 (README는 Phase 0~7). Phase 2 시작 시 어색하면 조정 — `phases.ts` 한 곳만 수정하면 모든 곳 동기화됨.

### 4-3. 작은 리팩토링 후보들

- `STATUS_LABEL` / `STATUS_COLOR` 가 `PhaseCard` + `PhasePlaceholder` 에 중복 → `phases.ts` 또는 `lib/phaseStatus.ts` 로 추출
- 7개 Phase 페이지가 거의 동일 패턴 → 동적 라우트 (`/phase/:slug`) 로 통합 가능. 단, Phase 2부터 페이지가 진짜로 채워지기 시작하면 통합이 오히려 부담일 수 있어 — 결정 보류
- APOD fetch 로직을 `useApod` 커스텀 훅으로 추출 → 재사용성 + 테스트 용이성

### 4-4. (신규) Context Rot 사례 — 의존성 매트릭스 어긋남

**발견 시점**: Phase 2 sub-phase 2-1 [Light 1] 의존성 설치 (2026-05-10)

**증상**: `npm install @react-three/fiber@^8.15.0` 실행 시 ERESOLVE 에러. R3F v8 은 React 18까지만 호환인데 실제 설치된 React 는 19.2.5.

**원인**: Phase 1 셋업 시점에 `npm create vite@latest` 가 자동으로 React 19 latest 를 끌어왔는데, 인수인계 작성 시 *추정*으로 "React 18.3" 적음. Phase 1 종료~Phase 2 시작 사이 약 1일이라 작성자(Claude + 권이건)가 검증 안 함.

**해결**: R3F v9 + drei v10 + three 0.170 으로 매트릭스 재구성. *2026년 현재 React 19 표준 페어링*.

**교훈**:
- 인수인계 작성 시 의존성 버전은 **반드시 `package.json` 직접 확인** 후 적기 (추정 X)
- 헌장 §9 *Context Rot 방지* 의 정확한 사례. Phase 2 시작 직후 발견되어 큰 사고 없이 정정 가능
- Claude에게 위임할 때도 *"확실하지 않으면 모른다"* 원칙 — 추측으로 메우는 게 가장 위험

**참고**: 이 사례 자체가 Phase 2 회고 / 포트폴리오 *Troubleshooting* 섹션에 좋은 소재.

---

## 5. Phase 2 시작점

**Phase 2 — Solar System (진행 중)**:
- 핵심 질문: *"우리가 아는 우주는 어떻게 생겼는가?"*
- Three.js + React Three Fiber 도입 (R3F v9 매트릭스)
- 8개 행성 + 달 3D 시각화, 거리 스케일 토글 (시각적 ↔ 실제 비율) 이 핵심 메시지
- *기억에 남길 한 순간* = 거리 토글 시 지구가 사라지는 1초

**현재 진행 중**: sub-phase 2-1 (R3F 셋업 + 첫 sphere 자전)
- ✅ [Light 1] R3F + drei + three 의존성 설치
- ⬜ [Light 2] data/planets.ts 신설 (지구 1개)
- ⬜ [Light 3]~[Light 7] 텍스처 / Scene / Planet / OrbitControls / 라우트 연결

상세 계획: `docs/specs/phase-2/PRD.md`, `TECHSPEC.md` 참조.

---

## 6. 누적 학습

🌌 **Phase 1에서 알게 된 것**:

- **APOD 역사** — 1995년 6월 16일 첫 사진(게성운). 30년 넘게 단 하루도 빠짐 없이 매일 한 장. 천문학자들에게는 출근 인사 같은 존재
- **별자리는 perspective의 산물** — 시리우스(8.6광년), 베텔게우스(640광년) 등 실제로는 멀리 떨어진 별들을 지구에서 본 시각으로 묶은 것. 포트폴리오 로드맵도 동일 — 흩어진 작업물을 하나의 서사로 엮는 시각
- **표준 측광 시스템(UBV)과 디자인 토큰의 닮음** — 천문학자들이 각자 다른 기준을 쓰면 데이터 비교 불가능 → 표준 필터 시스템 정립. 디자인 토큰도 같은 원리 (raw 색상값 대신 의미 있는 이름)
- **보이저 1호의 Cruise Phase** — 1977년 발사 후 *"발사가 끝이 아니라 지속 통신의 시작"*. 우리 사이트도 매일 한 장씩 우주 신호를 받음

💡 **기술적으로 배운 것**:

- TypeScript 5 `verbatimModuleSyntax` — 타입은 `import type` 으로 명시 (빌드 안전 + 의도 명확)
- `.gitignore` 슬래시 의미 — `lib/` (전역) vs `/lib/` (루트만). Python `lib/` 룰이 `frontend/src/lib/` 까지 잡았던 사고
- Tailwind v3 + Vite 기본 셋업 (v4는 아직 리스크)
- CSS `@import` 는 항상 파일 맨 위 (PostCSS 규칙)
- SPA fallback rewrite (`vercel.json`) — 어떤 호스팅에서든 SPA의 첫 배포 체크리스트 필수
- Vite 환경변수는 `VITE_` 접두사가 있어야 클라이언트 노출 (보안 기본값)

---

## 7. Claude에게 (다음 Phase의 너에게)

- 권이건은 Phase 1을 **하루 만에** 완주했음. 페이스 빠름 — 작업 분할 너무 잘게 하면 답답해할 수 있음. 단, Phase 2부터는 Three.js라 자연스럽게 호흡이 길어짐
- **PRD + TechSpec 도입 완료** (4-1 ✅) — Phase 단위 산출물로 자리잡음. 매 Phase 시작 시 작성
- **새 규칙 (Phase 1에서 추가됨)**:
  - sub-phase 종료 시 `git push origin main` (Check 마지막 스텝)
  - sub-phase 종료 시 마일스톤 현황 표시 (체크리스트 형식)
  - 두 규칙 모두 `COLLABORATION.md` §4, `WORKFLOW.md` Check 섹션에 반영됨
- **권이건은 push 시점을 정확히 기억함** — 1-5 중 내가 push 명령을 일찍 안내했을 때 즉시 잡아줬음. 규칙 위반 시 신뢰할 수 있는 알람
- **"단일 소스 원칙" 좋아함** — `phases.ts` 패턴처럼 메타데이터 한 곳 정의 + 여러 곳 import. Phase 2에서 행성 데이터도 같은 패턴으로 가야 함 (`data/planets.ts`)
- **막히면 솔직히 말하는 편** — 1-3에서 git status 미스터리 잡을 때 끝까지 진단 따라옴. 페이스가 빨라도 디버깅 함께함
- **비유 설명을 좋아함** — Phase 1에서도 "발사대", "별자리 perspective", "Cruise Phase" 등 잘 통함
- ⚠️ **Context Rot 경계** (4-4 사례 직접 발생): 인수인계 작성 시 *추정* 금지, 항상 `package.json` 직접 확인. 권이건이 *"전에 정한 거"* 라고 하면 명시적 확인 요청
- ⚠️ **장문 채팅 위험** — 채팅이 길어지면 같은 결정을 다시 꺼내거나 한참 전 내용으로 돌아가는 실수 발생함. *작업 단위가 끝나면 즉시 인수인계로 끊고 새 채팅* 의 헌장 §9 규칙을 더 적극적으로 따라야 함

---

## 8. 링크

- GitHub 레포: https://github.com/2daKaizen-gun/pale-blue-code
- 라이브 사이트: https://pale-blue-code.vercel.app
- Phase 1 회고: 별도 회고 없음 (sub-phase별 Check가 이미 회고 역할)
- Phase 2 산출물: `docs/specs/phase-2/`

---

*"발사대를 떠났다. 이제 우주를 그릴 차례다."*
