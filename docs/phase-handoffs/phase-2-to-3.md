# Phase 2 → Phase 3 인수인계

**완료일**: 2026-05-23
**소요 기간**: 약 2주 (2026-05-10 ~ 05-23, sub-2-1 ~ 2-7)
**총 커밋**: (git log --oneline | wc -l 로 확정 — 너가 채워)
**채팅 링크**: (Phase 2 채팅 URL — 너가 채워)

---

## 1. Phase 2에서 무엇을 만들었나

- **태양계 3D 시각화** (R3F): 8행성 + 태양 + 달 + 고리, 공전/자전 + *거리·자전 진실 토글* (교육적 거짓말 ↔ 우주의 실제 모습)
- **인터랙션**: 호버/클릭 라벨 + 카메라 행성 추적 + 시간 컨트롤 + 통합 리셋 + 키보드 단축키, 모바일 탭=선택 + 반응형 레이아웃
- **배포 상태**: `pale-blue-code.vercel.app/solar` 라이브. 코드분할로 랜딩 초기 JS 403→93KB gzip, leva prod 제거 완료

---

## 2. 확정된 기술 결정 (실제 설치본 기준 — package.json 직접 확인함)

| 영역 | 결정 | 비고 |
|------|------|------|
| React | **19.2.5** | |
| R3F / drei / three | **9.6.1 / 10.7.7 / 0.170** | React 19 표준 페어링 |
| zustand | **5.0.13** | TechSpec 매트릭스의 "4.5+" 는 오기 — sub-2-7 정정 |
| vitest | **4.1.6** | 매트릭스 "2.1+" 오기 정정 |
| Vite / TS | **8.0.10 / 6.0.2** | README 뱃지(18/5/5/r160)도 19/6/8/r170 으로 정정 |
| 코드분할 | 라우트 단위 `lazy()` + AppLayout `<Outlet>` Suspense | three.js 는 `/solar` 진입 시만 로드 |
| **R3F 텍스처 로딩** | **Canvas *안쪽* `<Suspense>`** 로 잡음 | ⚠️ 라우트 Suspense 로 올라가면 Canvas 언마운트 → Context Lost (2-7 트러블슈팅) |
| dev 도구 | leva = `import.meta.env.DEV` 가드 + 동적 import, Stats = DEV 가드 | prod 번들에서 완전 제외 |
| 성능 | Canvas `dpr={[1,2]}` 캡 (모바일 fill-rate) | 폴리곤은 병목 아님(측정) — 적응형 지오메트리 컷 |
| store | zustand, `mode + changedAt` + useFrame derived progress | *매 프레임 setState 0 → 리렌더 0* 패러다임 |
| 반응형 | 너비 기반 `md` 브레이크포인트 (레이아웃) vs `pointer:coarse` (인터랙션) | 두 축 분리 |

---

## 3. 다음 Phase가 재사용할 자산

- **Scene 셋업**: `components/solar/Scene.tsx` — Canvas + dpr 캡 + 안쪽 Suspense + dev DevControls 패턴 (Phase 3 N-body 씬의 틀)
- **카메라/시간**: `CameraController`, `TimeAdvancer`, `ControlPanel` + `ControlButtons` (시간 컨트롤 재사용 가능)
- **store 패턴**: `store/solarSystemStore.ts` — useFrame-derived 무리렌더 패턴 (Phase 3 물리 상태에 동일 적용)
- **변환 함수 단일 소스**: `lib/scale.ts`, `lib/time.ts`, `lib/easing.ts`, `lib/bodyPosition.ts`
- **공통**: `hooks/useIsTouchDevice.ts`, `components/layout/AppLayout.tsx`(반응형 드로어), `components/ui/Spinner.tsx`, `data/planets.ts`(real 값만 보관 패턴), `data/camera.ts`

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 2 — Solar System**: (종료 의식에서 close 예정 ✅)
  - sub-phase Issue: **#10 ~ #16** (2-1 ~ 2-7)
  - #10~#15 closed, **#16(2-7) 은 마지막 커밋 `Closes #16` 으로 close**
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestones` (Phase 2 = 아마 `/milestone/2` — 번호 확인)

### 인계 시점 미해결 항목 (⚠️ 데스크톱 검증 이월 — sub-2-7 미검증)
- [ ] **Lighthouse Performance 85+** — 점수 미측정. 번들 입력값은 개선 확인. (`npm run build && preview` → DevTools Lighthouse Mobile)
- [ ] **모바일 30fps+ 정량** — 육안 "괜찮음" 수준, Stats 수치 미기록
- [ ] **라우트 왕복 Context Lost 스트레스** (`/solar`↔`/` 반복) 미검증
- [ ] **모바일 탭=선택 / 제스처 비충돌** 실기기 정밀 확인
- [ ] **L8 반응형 레이아웃** 갤럭시 최종 확인 (육안 OK 보고만)
- [ ] **리팩토링**: `useBodyInteraction` 훅 추출 (Planet/Moon 호버·선택·터치 로직 완전 중복) — Issue 미생성, 회고에만 기록
- [ ] **로드맵 8 vs 9 불일치** (phase-1-to-2 §4-2 부터 이월): `phases.ts` 는 9개 (0~8, Exoplanet 별도 Phase 5, **Hunt=8**) / README + COLLABORATION §1 은 8개 (0~7, Exoplanet 없음, **Hunt=7**). ⚠️ *로드맵 설계 결정* — Exoplanet 을 독립 Phase 로 둘지(문서→9) Data 에 합칠지(앱→8). **Phase 3 첫머리에 권이건과 확정 후 phases.ts / README / COLLABORATION 한 번에 동기화.**
- [x] **APOD 비이미지 처리** (phase-1-to-2 §4 항목): 해결 — 비이미지는 youtube/vimeo만 임베드, 그 외 링크 폴백 (`fix(apod)`). apod.nasa.gov iframe 거부 버그 제거.

### Phase 3 시작 시 생성할 Issue 후보

| 제목 | 라벨 |
|---|---|
| `3-1: N-body data model + RK4 integrator (pure fn, TDD)` | `phase-3`, `sub-phase` |
| `3-2: Two-body verification (analytic orbit check)` | `phase-3`, `sub-phase`, `test` |
| `3-3: N-body scene + trails` | `phase-3`, `sub-phase`, `enhancement` |

---

## 5. Phase 3 시작점

**Phase 3 — Gravity (예정)**: *"우주는 무엇으로 움직이는가?"*
- Phase 2가 *제외* 했던 **중력 상호작용**(행성이 서로 끌어당김)을 여기서. N-body + **Runge-Kutta 4차 적분**.
- 핵심: 물리(`lib/physics/`)는 *순수 함수 + TDD* 가 자연스러움 — 2-body 해석해로 검증 가능. store 의 useFrame-derived 패턴 그대로.

**Phase 3 시작 절차** (WORKFLOW *"Phase 시작 절차"*):
1. 새 채팅에 컨텍스트 4종 첨부 (COLLABORATION + WORKFLOW + 본 인수인계 + README)
2. Phase 3 PRD + TechSpec 작성
3. Milestone `Phase 3 — Gravity` 생성
4. sub-3-1 Plan → Issue → Code

**sub-3-1 첫 PCTC Plan 핵심 질문**:
- *"적분 타임스텝을 시간 슬라이더(시각 속도)와 어떻게 분리할까?"* (물리 정확도 vs 시각 속도)
- *"RK4 를 lib/physics 순수 함수로 두고 TDD — 어떤 2-body 케이스로 검증?"*

---

## 6. 누적 학습 (Phase 2)

🌌 **알게 된 우주의 핵심 개념**:
- 케플러 3법칙 — 공전 주기는 거리의 비선형 함수 (진실 토글의 수학적 뼈대)
- 조석 고정 — 달이 한 면만 보이는 이유 (자전=공전, sub-2-6)
- 태양계는 *대부분 빈 공간* — 거리 압축이 만든 달-행성 충돌 버그가 역설적으로 증명
- 축 기울기 / 역회전 (금성 177°, 천왕성 98° 누운 고리)
- **불칸(Vulcan)** — 존재하지 않은 가설 행성. *측정이 가정을 이긴다* (sub-2-7 L4 컷의 거울)

(상세 → `docs/checks/phase-2/sub-2-{1..7}.md`)

---

## 7. Claude에게 (다음 Phase의 너에게)

- **측정 우선이 잘 통함** — 2-7에서 "폴리곤 줄이자"(§6 가설)를 빌드 실측으로 반증하고 L4 컷. 추측 최적화 말고 *재고 결정*.
- **권이건의 눈을 Test 신호로 신뢰** — 모바일 레이아웃 누락을 그가 실기기로 잡음. Plan 이 완벽하지 않아도 그가 보정함.
- **단일 소스 / DRY 좋아함** — DevControls 가 기본값을 props 로 받는 식. Phase 3 물리 상수도 한 곳에.
- ⚠️ **Context Rot 또 발생** — TechSpec 의존성 매트릭스(zustand 4.5/vitest 2.1)가 실제(5.0.13/4.1.6)와 어긋났고 README 뱃지도 stale(18/5). **항상 package.json 직접 확인.** 4-4 의 재발.
- 💡 **실측 기법** — public 레포를 클론해서 빌드/번들 크기를 *직접 재는* 게 환각 없이 검증하는 길이었음. WebGL 런타임(렌더/fps/Context Lost)은 컨테이너에서 못 띄우니 *권이건이 검증* — 그래서 §4 이월 항목이 생김. 데스크톱 세션 한 번이면 닫힘.
- ⚠️ **장문 채팅 경계** (헌장 §9) — Phase 2가 길었음. Phase 3는 sub-phase 단위로 끊고 인수인계.

---

## 8. 링크

- GitHub 레포: https://github.com/2daKaizen-gun/pale-blue-code
- 라이브: https://pale-blue-code.vercel.app/solar
- Phase 2 회고: `docs/checks/phase-2/sub-2-{1..7}.md`
- Phase 2 PRD/TechSpec: `docs/specs/phase-2/`
- **Milestone**: `https://github.com/2daKaizen-gun/pale-blue-code/milestones` (Phase 2 ≈ /milestone/2)
- **Issues**: #10 ~ #16
- GitHub Release: v0.2.0 (종료 의식에서 태그 예정)

---

*"우리가 아는 우주를 그렸다. 이제 그 우주를 움직이는 힘으로 간다."*
