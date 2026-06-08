# Phase 3 → Phase 4 인수인계

**완료일**: 2026-06-07
**소요 기간**: 실제 약 2주 (예상 2~3주)
**총 커밋**: sub-3-7 에서 8개 (이전 sub-phase 포함 총계는 `git log` 확인)
**채팅 링크**: (Phase 3 채팅 URL — 검색 가능하게 채워넣기)

---

## 1. Phase 3에서 무엇을 만들었나

- **뉴턴 법칙(F = G·m₁m₂/r²) 하나에서 케플러 궤도가 *스스로* 태어나는 N-body 씬** — RK4/Euler 적분기, 5개 프리셋(2체·쌍성·figure-8·우리 태양계), 보존량 자동 검증(TDD).
- **"적분기를 잘못 고르면 우주가 깨진다"** — Euler↔RK4 토글이 안정 궤도를 나선으로 풀고 다시 닫는 *Phase 의 영혼*. 시간 컨트롤(물리 dt ⊥ 시각 속도), 카메라 추적, trail.
- 배포: `pale-blue-code.vercel.app/gravity` — Lighthouse 모바일 77 (LCP 측정으로 해결, TBT 는 three 구조적 한계로 진단).

---

## 2. 확정된 기술 결정 (Phase 4가 따라야 할 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| 물리 코어 | `lib/physics/` 순수함수 + TDD | 적분기 2층: 순수 코어 ↔ 렌더루프 래퍼. 코어 절대 안 건드림 |
| 상태 | 물리=mutable ref, 컨트롤=Zustand | per-frame setState 금지. 컨트롤은 useFrame 안 getState() |
| 카메라 | `CameraRig`(reframe) + `CameraController`(follow) | *키 없는 명령형* — keyed remount = Context Lost (3-4) |
| trail | RingBuffer(GravityPage 소유) + substep 당 push | "1 ring point = 1 적분 스텝" = 고정 sim-time 창 |
| reset | nonce(`presetLoadedAt`, monotonic) + selectPreset 재사용 | 별도 reset 액션 없음 |
| 번들 | `vite.config` manualChunks 함수형 — three/r3f vendor 분리 | 객체 리터럴은 TS2769 (이 Vite 버전) |
| 빌드 | **`npm run build` (tsc -b) 를 push 전 필수** | vitest 통과해도 `erasableSyntaxOnly`/타입은 따로 깨짐 |

---

## 3. Phase 4가 재사용할 자산

- `src/components/gravity/Scene.tsx` — Canvas 루트 + CameraRig + CameraController (명령형 카메라 패턴의 정본)
- `src/hooks/useIsTouchDevice.ts` — 모바일/데스크톱 분기 (substep 캡 등)
- `src/store/gravityStore.ts` — 컨트롤 상태 패턴 (Phase 4 는 별도 store)
- `src/data/presets.ts` — `CameraConfig` + 프리셋 단일 소스 패턴
- `vite.config.ts` — vendor 청크 분리 (Phase 4 GLSL/three 도 같은 청크 탐)

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 3 — Gravity**: 모든 sub-phase Issue close 후 **close** 처리 필요 (아래 절차)
  - sub-phase Issue: 3-6 = #23, **3-7 = #24** (확정). 3-1~3-5 번호는 milestone 페이지에서 확인
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/3`

### 인계 시점 미해결 항목
- [ ] **gravity TBT** (Script Eval 2.4s, vendor-three 345 KiB) — 85+ 필요 시 별도 *성능 패스* (Canvas 마운트 지연 / geometry 워커 / drei 트리셰이킹). 긴급도: 낮음 (PRD §6 이 메인스레드 부담 인정)
- [ ] **HomePage APOD 503** — NASA API 일시 장애. Phase 1 위젯 에러 처리(재시도/폴백) 후보. 긴급도: 낮음
- [ ] ControlPanel 비대화 / 키보드 핸들러 통합 — 리팩토링 후보 (긴급도: 낮음, `docs/checks/phase-3/sub-3-7.md` 참조)

### Phase 4 시작 시 생성할 Issue 후보

| 제목 | 라벨 |
|---|---|
| `4-1: GLSL fullscreen shader scaffold + raymarch base` | `phase-4`, `sub-phase` |
| `4-2: Schwarzschild lensing (photon ray bending)` | `phase-4`, `sub-phase`, `enhancement` |
| `4-3: Accretion disk + Doppler/beaming` | `phase-4`, `sub-phase`, `enhancement` |

(실제 번호는 생성 시 GitHub 가 부여 — #24 다음)

---

## 5. Phase 4 시작점

**Phase 4 시작 시 첫 절차** (WORKFLOW "Phase 시작 절차"):
1. 새 채팅에 컨텍스트 첨부 (COLLABORATION + WORKFLOW + 본 HANDOFF + README)
2. Phase 4 PRD + TechSpec 작성 (`docs/specs/phase-4/`)
3. GitHub Milestone `Phase 4 — Light Bent` 생성 (`gh api`)
4. sub-phase 4-1 Plan → Issue → Code

**Phase 4 첫 작업 (sub-phase 4-1)**:
- GLSL 풀스크린 셰이더 골격부터 — three 의 `ShaderMaterial` + 풀스크린 quad, fragment 셰이더에서 raymarch 기반.
- **첫 PCTC Plan 핵심 질문**:
  1. *렌징을 실제 측지선 적분으로 풀까, 근사 셰이더로 풀까?* (정확도 vs 60fps — §10-2 이해 우선이지만 GLSL 은 측정 먼저)
  2. *배경을 어떻게? (스카이박스 텍스처 vs 절차적 별)* — Phase 1 starfield 재사용 가능?
- VS Code `webgl-glsl-editor` 확장 미리 설치 (메모리에 계획됨).

> ⚠️ **Phase 4 전에 Claude Code 마이그레이션 검토** — 메모리상 Phase 3 후 계획됨.
> 파일 업로드 핑퐁(이번 Phase 에서 sub-3-7 만 파일 10+ 회 주고받음) 을 없애고
> 직접 filesystem/git/vitest 접근. Phase 4 GLSL 은 셰이더 hot-reload 가 잦아
> 마이그레이션 이득이 특히 큼.

---

## 6. 누적 학습

🌌 **Phase 3에서 알게 된 우주의 핵심 개념**:
- **3체부터 일반해가 없다** — 닫힌 수식 불가, 수치 적분으로만. *컴퓨터가 왜 필요한가* 의 증명.
- **방법(적분기)이 운명을 가른다** — 같은 법칙도 Euler 면 에너지가 새어 우주가 깨지고 RK4 면 닫힌다.
- **고정 dt = 재현 가능한 우주의 전제** — 시각 속도와 적분 정확도는 다른 축 (누적기).
- **추적 = 기준계 선택** — 지구를 따라가면 태양이 돈다(천동설). 코페르니쿠스 혁명은 "누가 도냐" 가 아니라 "어느 프레임이 더 단순하냐".

(상세는 `docs/checks/phase-3/sub-3-{1..7}.md`)

---

## 7. Claude에게 (Phase 4의 너에게)

- 권이건은 **비유로 설명하면 빨리 이해** — 천문학 비유 계속. 코드 양보다 이해 우선.
- **파일은 고쳐서 직접 줘** ("나한테 고치라 하지말고 너가 고쳐서") — diff/지시 아니라 완성 파일.
- **아키텍처는 독립 판단** — 확인 안 받고 진행, 애매하면 *구현 전* 에 flag.
- **measurement-first 가 이 사람 핵심 가치** — 추측 최적화 싫어함. Phase 4 GLSL 도 프로파일 먼저.
- ⚠️ **실물 파일 읽기 전 작업 크기 추정 금지** — spec 보다 구현이 정본. Phase 4 도 `npm run build` push 전 필수.

---

## 8. 링크 모음

- Phase 3 회고: `docs/checks/phase-3/sub-3-{1..7}.md`
- 배포: `https://pale-blue-code.vercel.app/gravity`
- **Milestone (Phase 3)**: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/3`
- **Issues**: …#23 (sub-3-6), #24 (sub-3-7) — 나머지 번호는 milestone 페이지
- **다음 Milestone**: (Phase 4 시작 시 생성 후 추가)
