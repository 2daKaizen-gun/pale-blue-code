# Phase 1 → Phase 2 인수인계

**완료일**: 2026-05-09
**소요 기간**: Phase 1 약 1일 (예상 2~3주 → 압축 진행)
**총 커밋**: 약 25개 (sub-phase 1-1 ~ 1-5)
**채팅 링크**: (Phase 1 채팅 URL — 너가 채워넣기)

---

## 1. Phase 1에서 무엇을 만들었나

- **1-1** Vite + React 18 + TypeScript 5 프로젝트 셋업, React Router v6 기반 8개 라우트
- **1-2** 디자인 토큰 시스템 — CSS 변수 (`tokens.css`) → Tailwind config 연결, Inter + Space Mono 적용
- **1-3** NASA APOD 위젯 — 오늘의 우주 사진 fetch + 로딩/에러 상태 처리
- **1-4** 랜딩 페이지 + 9개 Phase 카드 로드맵 + 7개 Phase placeholder UI
- **1-5** Vercel 첫 배포 — `https://pale-blue-code.vercel.app` 라이브, GitHub push 시 자동 재배포
- **추가 문서 작업** — Phase 1 종료 시 `COLLABORATION.md` / `WORKFLOW.md` 갱신

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| Routing | React Router v6 (`createBrowserRouter`) | 중첩 라우팅 + `<Outlet />` 패턴 |
| Tailwind | v3 (v4 아님) | v4는 `init` 명령어 제거 + 생태계 미성숙 |
| 디자인 토큰 | CSS 변수 → Tailwind 참조 | Three.js 셰이더에서도 `getComputedStyle`로 읽을 수 있게 양립 |
| 폰트 | Inter (본문) + Space Mono (코드/숫자) | 구글 폰트 CDN |
| 상태 관리 | `useState` + `useEffect` | Zustand는 Phase 2 이후 필요 시 도입 |
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

### 4-1. PRD + TechSpec 도입 검토 (⚠️ Phase 2 첫 논의)

권이건이 1-5 진행 중에 제안: *"Phase 2부터는 집중적으로 뭔가 만들어내니까 PRD + TechSpec 기법 사용하자."*

다뤄야 할 것:
- sub-phase Plan과의 관계 정리 (대체할지, 보완할지, 위 계층으로 둘지)
- 양식 정립 (목적, 사용자, 범위, 비기능 요구사항, 기술 결정 등)
- `docs/specs/` 폴더 신설 여부
- Phase 2 = Three.js 태양계 시각화 = 첫 본격 구현 → 양식 효과가 가장 큰 시점

→ **Phase 2 첫 메시지 응답에서 반드시 이 안건 꺼낼 것**

### 4-2. Phase 1을 별도 카드로 노출한 결정 자연스러운지 검증

홈 로드맵에서 Phase 0~8 총 9개 카드로 구성했음 (README는 Phase 0~7). Phase 2 시작 시 어색하면 조정 — `phases.ts` 한 곳만 수정하면 모든 곳 동기화됨.

### 4-3. 작은 리팩토링 후보들

- `STATUS_LABEL` / `STATUS_COLOR` 가 `PhaseCard` + `PhasePlaceholder` 에 중복 → `phases.ts` 또는 `lib/phaseStatus.ts` 로 추출
- 7개 Phase 페이지가 거의 동일 패턴 → 동적 라우트 (`/phase/:slug`) 로 통합 가능. 단, Phase 2부터 페이지가 진짜로 채워지기 시작하면 통합이 오히려 부담일 수 있어 — 결정 보류
- APOD fetch 로직을 `useApod` 커스텀 훅으로 추출 → 재사용성 + 테스트 용이성

---

## 5. Phase 2 시작점

**Phase 2 — Solar System (예정)**:
- 핵심 질문: *"우리가 아는 우주는 어떻게 생겼는가?"*
- Three.js + React Three Fiber 도입
- 8개 행성 3D 시각화, 공전 인터랙티브
- 스케일 vs 가시성 트레이드오프 (실제 비율로 그리면 지구가 점이 됨)

**첫 PCTC Plan 핵심 질문**:
- *"PRD + TechSpec 양식을 어떻게 정의할까?"* (4-1 안건)
- *"R3F 셋업과 첫 행성 메쉬 — sub-phase를 어떻게 쪼갤까?"*
- *"카메라 컨트롤은 OrbitControls로 시작? 커스텀?"*
- *"행성 텍스처는 NASA Solar System Treks에서 받아올지, 절차적으로 생성할지?"*

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
- **PRD + TechSpec 안건은 반드시 첫 메시지 응답에서 꺼낼 것** (4-1 참조). 권이건이 명시적으로 부탁한 사항
- **새 규칙 (Phase 1에서 추가됨)**:
  - sub-phase 종료 시 `git push origin main` (Check 마지막 스텝)
  - sub-phase 종료 시 마일스톤 현황 표시 (체크리스트 형식)
  - 두 규칙 모두 `COLLABORATION.md` §4, `WORKFLOW.md` Check 섹션에 반영됨
- **권이건은 push 시점을 정확히 기억함** — 1-5 중 내가 push 명령을 일찍 안내했을 때 즉시 잡아줬음. 규칙 위반 시 신뢰할 수 있는 알람
- **"단일 소스 원칙" 좋아함** — `phases.ts` 패턴처럼 메타데이터 한 곳 정의 + 여러 곳 import. Phase 2에서 행성 데이터도 같은 패턴으로 가야 함
- **막히면 솔직히 말하는 편** — 1-3에서 git status 미스터리 잡을 때 끝까지 진단 따라옴. 페이스가 빨라도 디버깅 함께함
- **비유 설명을 좋아함** — Phase 1에서도 "발사대", "별자리 perspective", "Cruise Phase" 등 잘 통함

---

## 8. 링크

- GitHub 레포: https://github.com/2daKaizen-gun/pale-blue-code
- 라이브 사이트: https://pale-blue-code.vercel.app
- Phase 1 회고: 별도 회고 없음 (sub-phase별 Check가 이미 회고 역할)

---

*"발사대를 떠났다. 이제 우주를 그릴 차례다."*
