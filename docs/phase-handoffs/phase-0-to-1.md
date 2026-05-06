# Phase 0 → Phase 1 인수인계

**완료일**: 2026-05-05
**소요 기간**: Phase 0 약 1주 (예상 1주)
**총 커밋**: 약 8~10개 (문서 셋업)
**채팅 링크**: (Phase 0 채팅 URL — 너가 채워넣기)

---

## 1. Phase 0에서 무엇을 만들었나

- 협업 시스템 3대 문서 (`COLLABORATION.md`, `WORKFLOW.md`, `HANDOFF.md`) 완성
- README 최종본 + 라이선스 (AGPL-3.0) + NOTICE + .gitignore + .env.example + .editorconfig + .vscode/extensions.json
- GitHub 레포 생성 및 첫 푸시 완료, 아직 코드는 없음

---

## 2. 확정된 기술 결정

| 영역 | 결정 | 비고 |
|------|------|------|
| 에디터 | VS Code | Phase 1~4 웹 작업 + GLSL 셰이더 호환성 |
| Frontend Framework | React 18 + TypeScript 5 | 19는 RTF 호환성 검증 후 결정 |
| Build Tool | Vite | CRA 대신 — 빠르고 모던 |
| 스타일링 | TailwindCSS | Phase 1에서 셋업 |
| 3D | Three.js + React Three Fiber | Phase 2부터 도입 |
| 패키지 매니저 | npm | (필요 시 pnpm 전환 고려) |
| 라이선스 | AGPL-3.0 | 비공개 상업 통합 차단 의도 |
| 커밋 메시지 | 영어, 한 줄, Conventional Commits | 일본 커리어 + 글로벌 표준 |

---

## 3. 다음 Phase가 재사용할 자산

- **문서 시스템**: `docs/COLLABORATION.md`, `docs/WORKFLOW.md`, `docs/HANDOFF.md`
- **셋업 파일들**: `.gitignore`, `.env.example`, `.editorconfig`, `.vscode/extensions.json`
- **코드 자산**: 없음 (Phase 1에서 새로 시작)

---

## 4. 미해결 이슈

- 없음 — Phase 0은 문서 셋업만 진행

---

## 5. Phase 1 시작점

**Phase 1 — Foundation 구성 (예정)**:
- Sub-phase 1-1: Vite + React + TypeScript 프로젝트 셋업, 기본 라우팅
- Sub-phase 1-2: 디자인 토큰 정립 (우주 테마 색상 / 타이포 / 레이아웃 셸)
- Sub-phase 1-3: NASA APOD 위젯 (API 키 발급, 첫 fetch, 에러 처리)
- Sub-phase 1-4: 랜딩 페이지 + Phase별 네비게이션 구조
- Sub-phase 1-5: 첫 Vercel 배포

**첫 PCTC Plan 핵심 질문**:
- *"Phase별 페이지 구조를 처음부터 8개 다 만들지, 1~2개씩 점진적으로 추가할지?"*
- *"디자인 토큰을 CSS 변수로 갈지, Tailwind config로 갈지, 둘 다 쓸지?"*

---

## 6. 누적 학습

🌌 **Phase 0에서 알게 된 것**:
- *Pale Blue Dot* — 보이저 1호가 1990년 60억 km 밖에서 찍은 지구 사진. 칼 세이건이 NASA를 설득해서 찍었음
- AGPL-3.0의 "network use" 조항 — 웹 서비스로만 운영해도 소스 공개 의무 발생 (일반 GPL과의 차이)
- 천문학 데이터가 거의 전부 무료 공개라는 사실 — NASA / MAST / Lightkurve 모두 토큰 없이 접근 가능

(Phase 0은 코드 작업 전이라 천문학 지식보다 프로젝트 메타 학습 위주)

---

## 7. Claude에게 (다음 Phase의 너에게)

- 권이건은 **이미 5개의 포트폴리오 프로젝트 경험**이 있음. SkyWear (Android, Kotlin, MVVM) 가 가장 최근. 모던 안드로이드 패턴 익숙
- **일본 취업이 핵심 목표** — 기술 결정 시 일본 시장 트렌드 가끔 환기 (TS, Java/Spring, AWS 선호)
- **PCTC 사이클을 진지하게 따름** — Plan 없이 Code 들어가면 본인이 먼저 *"잠깐, Plan부터"* 함
- **비유 설명을 좋아함** — 천문학뿐 아니라 코딩 패턴도 비유로 설명하면 빨리 들어감
- **막히면 솔직히 말하는 편** — 30분 이상 헤매지 않으니 신뢰 가능
- **이 프로젝트의 영혼은 "어릴 적 우주과학자 꿈"** — 기술 결정에서 가끔 환기, 단 과하지 않게

---

## 8. 링크

- GitHub 레포: https://github.com/2daKaizen-gun/pale-blue-code
- Phase 0 회고: 별도 회고 없음 (문서 셋업 Phase)
- 배포 URL: 아직 없음 (Phase 1 끝에서 첫 배포)

---

*"가벼운 짐만 들고 다음 별로 떠난다."*
