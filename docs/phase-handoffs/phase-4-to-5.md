# Phase 4 → Phase 5 인수인계

**완료일**: 2026-06-12
**소요 기간**: 실제 약 5일 (예상 1~2주)
**총 커밋**: sub-4-3 기준 약 20개 (git log --oneline | head -25 확인)
**Issues**: sub-4-1 = #25, sub-4-2 = #26, sub-4-3 = #27

---

## 1. Phase 4에서 무엇을 만들었나

- **슈바르츠실트 시공간에서 광자가 구부러지는 모습을 실시간 GLSL로 렌더링** —
  RK4 측지선 적분기가 GPU 셰이더 안에서 매 픽셀마다 광자 경로를 계산.
  배경 별하늘이 블랙홀 주변에서 왜곡되고 아인슈타인 링이 나타남.
- **볼류메트릭 강착 원반 — HDR Doppler 비밍 + 케플러 차등 회전 + 플라즈마 난류** —
  접근하는 쪽이 4.5×, 후퇴하는 쪽이 0.08× 의 비대칭 밝기. EHT M87* 사진의
  남쪽 밝은 호와 같은 물리.
- **ISCO 핫스팟 + 케플러 차등 회전 애니메이션** — `u_time`으로 내원이 외원보다
  빠르게 도는 플라즈마 난류 시각화.
- 배포: `pale-blue-code.vercel.app/blackhole`

---

## 2. 확정된 기술 결정 (Phase 5가 따라야 할 것)

| 영역 | 결정 | 비고 |
|------|------|------|
| 셰이더 | `RawShaderMaterial` + `GLSL3` + `?raw` import | Three.js 자동 prefix 없음 — `in/out/fragColor` 직접 선언 |
| 유니폼 갱신 | `UniformUpdater` (별도 컴포넌트, `useFrame` 안) | Canvas 안에서 매 프레임 push — prop-drilling 없음 |
| Canvas 외부 접근 | 모듈 레벨 ref export (`bhMaterialRef`, `bhOrbitRef`) | Context/Provider 오버헤드 없이 싱글턴 패턴 |
| 상태 | Zustand store (`blackholeStore`) — controls only | per-frame state 없음, `getState()` in useFrame |
| 모바일 DPR | `useIsTouchDevice` → `dpr={isMobile ? [1,1.5] : [1,2]}` | 터치 기기는 자동 해상도 낮춤 |
| 빌드 | **`npm run build` push 전 필수** | 셰이더 글자 오류는 런타임에만 — tsc는 GLSL 무시 |

---

## 3. Phase 4가 개발한 핵심 GLSL 패턴 (Phase 5 재사용 가능)

- **RK4 측지선 적분기**: `geodesicDerivs` + `rk4Step` + `traceRay` in
  `frontend/src/shaders/blackhole.frag.glsl` — Kerr로 확장 시 동일 구조 유지
- **볼류메트릭 방출 누적**: RK4 루프 안에서 `diskEmit += emission * density * D_PHI`
  패턴 — 평면 교점보다 양쪽 이미지(근거리 + 렌즈 이미지) 자동 포함
- **Reinhard 토닝맵**: `color = color / (color + 1.0)` — HDR [0,∞) → [0,1), 색상
  비율 보존. main() 맨 마지막에 단 한 줄.
- **von Mises 원형 집중**: `exp(-k * (1 - cos(angle)))` — `mod` 경계 불연속 없는
  원형 가중치. 핫스팟, 빔, 제트에 범용 사용 가능.

---

## 4. GitHub 진행 상태

### Milestone 현황
- **Phase 4 — Light Bent**: sub-4-3 Closes #27 커밋 push 후 자동 Issue 닫힘
  - Issue 번호: #25 (4-1), #26 (4-2), #27 (4-3)
  - Milestone URL: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/4`

### 인계 시점 미해결 항목
- [ ] **Kerr 블랙홀** — 사용자 명시 요청: "더 멋지고 정교한 블랙홀". Kerr 측지선은
  r·φ·t 3차원 ODE + 스핀 파라미터 a. 프레임 끌림(frame-dragging)으로 원반이
  비대칭하게 뒤틀리며 에르고영역 가시화 가능. Phase 5 후보 1순위.
- [ ] **원반 산란/불투명도** — 현재 원반은 순수 방출만. 두꺼운 내원이 배경을 가리는
  `opacity` 항 추가 시 더 실감나는 내원 구조 표현 가능.
- [ ] **카메라 인트로 애니메이션** — 첫 로드 시 블랙홀을 천천히 공전하며 reveal하는
  자동 카메라 시퀀스 (OrbitControls autoRotate 또는 커스텀 tweening).
- [ ] **gravity TBT (Script Eval 2.4s)** — Phase 3 미해결 인계 항목. 긴급도 낮음.

---

## 5. Phase 5 시작점

**Phase 5 시작 시 첫 절차** (WORKFLOW "Phase 시작 절차"):
1. 새 채팅에 컨텍스트 첨부 (COLLABORATION + WORKFLOW + 본 HANDOFF + README)
2. Phase 5 PRD + TechSpec 작성 (`docs/specs/phase-5/`)
3. GitHub Milestone `Phase 5 — ?` 생성 (`gh api`)
4. sub-phase 5-1 Plan → Issue → Code

**Phase 5 유력 후보 (user 피드백 기반)**:
- Kerr 블랙홀 (frame-dragging + ergosphere) — Phase 4의 연장
- 새 천문 시뮬레이션 — 중성자별 충돌 / 초신성 / 펄서
- 인터랙티브 우주 탐험 (확대/축소 스케일) — AU → pc → Mpc

---

## 6. 누적 학습

🌌 **Phase 4에서 알게 된 우주의 핵심 개념**:

- **빛도 떨어진다** — 질량이 없지만 시공간 곡률을 따른다. 슈바르츠실트 측지선은
  2D u–φ ODE로 환원되며 RK4로 GPU에서 실시간 계산 가능.
- **광자구(r = 1.5r_s)는 탈출과 포획의 경계** — 이 반경을 스치는 빛은 360° 공전 후
  관측자에게 돌아온다. 아인슈타인 링의 물리적 기원.
- **도플러 비밍 비대칭은 버그가 아니라 서명** — 접근 쪽 4제곱 밝기 증폭은 EHT M87*
  사진에서 관측된 남쪽 밝은 호와 동일한 효과. "한쪽이 어둡다"는 상대성 이론의 증거.
- **Schwarzschild는 정적이다** — 회전이 없는 블랙홀은 시간에 무관한 정적 해.
  원반은 케플러 회전으로 살아있지만 시공간 자체는 변하지 않는다. Kerr(회전 BH)에서야
  에르고영역과 프레임 끌림이 나타난다.

(상세는 `docs/checks/phase-4/sub-4-{1..3}.md`)

---

## 7. Claude에게 (Phase 5의 너에게)

- 권이건은 **천문학 비유로 빠른 이해** — 코드 양보다 개념 먼저, 개념은 비유로.
- **파일 직접 편집** — diff나 지시가 아니라 Edit/Write 툴로 바로 수정.
- **빌드 먼저** — 구현 후 `npm run build` 확인하고 커밋. tsc는 GLSL 오류 안 잡음.
- **이슈 본문은 반드시 영어** — COLLABORATION.md §4 규칙. Korean issue body는
  즉시 지적받는다.
- **영어 문서, 한국어 대화** — docs/는 English, 채팅은 한국어.
- 사용자 관심사: 인터스텔라급 비주얼, 물리 정확성, 일반인 이해 가능한 드라마틱함.

---

## 8. 링크 모음

- Phase 4 회고: `docs/checks/phase-4/sub-4-{1..3}.md`
- 배포: `https://pale-blue-code.vercel.app/blackhole`
- **Milestone (Phase 4)**: `https://github.com/2daKaizen-gun/pale-blue-code/milestone/4`
- **Issues**: #25 (sub-4-1), #26 (sub-4-2), #27 (sub-4-3)
- **다음 Milestone**: (Phase 5 시작 시 생성 후 추가)
