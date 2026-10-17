# sub-3-5 Check — Integrator toggle + energy readout + chaos perturbation

> Phase 3 — Gravity · Issue #22 · 2026-06-03

## 잘된 점

- **영혼이 코드 한 줄로 떨어졌다.** `Integrator` 의 useFrame 안에서
  `getState().integrator === 'euler' ? eulerStep : rk4Step` — 같은 dt, 같은
  substep 수학, *step 함수만* 교체. PRD §3 "같은 법칙, 다른 방법, 다른 우주"
  가 분기 한 줄로 산다. substep 루프는 1비트도 안 건드림.
- **재료는 이미 다 있었다 — 3-5는 *배선* 이었다.** `rk4Step`/`eulerStep`(3-1),
  `totalEnergy`/`angularMomentum`(3-2), Light 7 의 Euler 발산 *회귀 테스트* 까지.
  검증된 순수 코어를 한 글자도 안 고치고 화면에 *체감* 으로 연결만. sub-3-2
  "코어 보존" 규칙이 3-5 내내 지켜짐.
- **readout = oracle 의 가시화.** 보존량은 궤도가 *얼마나 거칠어 보이든* 상관없이
  정직하다 — RK4 는 평평, Euler 는 솟구침. `setInterval` ~6Hz 샘플 → 이 작은
  컴포넌트만 리렌더, 씬/Integrator(getState+ref)는 무관. *무리렌더 0* 철학 유지.
- **섭동은 결정론 + figure-8 보존.** `perturbation 0 → published IC 불변`(영원히
  8자), 같은 값 → 같은 운명. 커밋-온-릴리즈로 재시드(+trail remount)를 *놓을 때
  한 번* 만 — 드래그 thrash 차단(3-4 컨텍스트 손실의 예방주사).
- **dt 를 추측이 아니라 *수치 스윕* 으로 박았다.** "Euler 가 미적지근하다" 를
  감으로 고치지 않고, 물리 코어를 재현해 dt 를 스윕 → T/120 확정. *측정이
  가정을 이긴다*(sub-2-7 불칸 컷의 또 다른 거울).

## 막혔던 점 / 트러블슈팅

### 1. 빌드가 깨지는 *중간 커밋* — 분리 불가능한 변경을 쪼갬
- **문제**: `feat(nbody): add three-body chaos perturbation` 커밋 직후
  `npm run build` 가 `TS2322: Property 'perturbation' does not exist on type
  ... SceneProps`. 다음 커밋(`fix(nbody): reseed trails ...`)에서야 고쳐짐.
- **원인**: 섭동을 *물리(GravityPage)* 와 *trail 재시드(Scene)* 두 커밋으로
  쪼갰는데, GravityPage 는 `<Scene perturbation={...}>` 로 *넘기고* Scene 은
  아직 그 prop 을 *안 받는* 상태 → 둘 사이 커밋에서 타입이 안 맞음. 즉 두 변경은
  애초에 *분리 가능한 단위가 아니었다* (한쪽만으론 컴파일 자체가 안 됨).
- **해결**: Scene 최신본을 다음 커밋으로 올려 초록 회복. (history 정직하게
  남기되, 다음부터는 합칠 것.)
- **교훈**: **각 커밋은 그 자체로 빌드가 통과해야 한다.** "동작하는 가장 작은
  단위"(헌장 §5)의 *동작* 에는 *컴파일* 이 포함된다. prop 을 내리는 쪽과 받는
  쪽은 한 커밋. 나중에 `git bisect` 가 "이 커밋은 빌드 불가" 에 걸리면 곤란.

### 2. Euler 가 "튕겨나가지" 않고 "조금씩 멀어지기만" 함 (영혼 미달)
- **문제**: 2체에서 Euler 토글 → 극적인 나선 발산이 아니라 궤도가 *천천히*
  부푸는 정도. PRD §5 "Euler 발산 *데모* 보장" 이 체감으로 안 지켜짐.
- **원인**: `TWO_BODY.recommendedDt = T/600`. 이건 Euler 한테도 *꽤 정확한*
  스텝이라 에너지가 느리게만 샌다 — T/600·TIME_SPEED 1× 에서 궤도가 눈에 띄게
  부풀려면 ~10바퀴(≈25초)가 필요. 너무 느려 "어, 깨졌다" 의 1초가 죽음.
  (Light 7 테스트가 보장하는 "5바퀴에 5%+" 도 *계기* 로는 잡혀도 *눈* 엔 약함.)
- **잘못 짚을 뻔한 가정**: "토글이 안 먹나? 배선 버그인가?" — 아니었다. Euler 는
  *정상 작동*, 단지 dt 가 demo 엔 너무 고왔다. 물리가 맞는데 *연출* 이 안 된 것.
- **해결**: 물리 코어(가속도·RK4·Euler·에너지)를 그대로 재현해 dt 스윕 →
  `TWO_BODY.recommendedDt` 만 **T/120**. 핵심 발견: **RK4 는 거친 dt 에서도
  maxr 가 정확히 apoapsis(1.300)에 고정**(4차 정확도)이고 에너지 오차 6e-6, 반면
  Euler 는 같은 dt 에서 ~3바퀴(~5초) 만에 화면 밖으로 풀려나감. 다른 프리셋은
  안 건드림(circular = sub-3-2 fixture 비트-동일 보존, figure-8 = 민감 IC).
- **교훈**: **정확도용 dt ≠ 교육용 dt.** 그리고 영혼의 *진짜* 메시지가 여기서
  선명해졌다 — "같은 *거친* 시간 간격인데, RK4 는 살아남고 Euler 는 깨진다."
  적분기는 "근사 품질" 이 아니라 *어떤 우주를 시뮬레이션하는가* 의 선택.

### 3. (배선 중 잡음) `totalEnergy` 의 softening 인자
- **문제 가능성**: readout 의 `totalEnergy(s, G)` 가 ε 를 안 넘기면, ε>0 프리셋
  (태양계 softening 0.001)에서 *완벽한 RK4 도* 가짜 에너지 드리프트를 보임.
- **원인**: `totalEnergy(bodies, G, softening=0)` — PE 가 *힘과 같은 ε* 를 써야
  softened force 의 정확한 적분이 됨. raw 1/r 퍼텐셜 + softened force 를 섞으면
  보존이 깨진 것처럼 보임(energy.ts 주석이 직접 경고).
- **해결**: readout props 에 `softening` 도 받아 `totalEnergy(s, G, softening)`.
  파일을 *읽고* 시그니처를 확인한 덕에 사전 차단(추측했으면 RK4 막대가 꿈틀).
- **교훈**: 보존량 계산은 *힘과 같은 ε* 로. tsc 초록이어도 물리가 거짓말할 수
  있는 층 — 시그니처는 추측 말고 실물 확인.

## 리팩토링 후보
- **ControlPanel 이 physics props(bodiesRef/G/softening) 를 받는 것** — readout
  호스팅 때문. 순수 store-only 컨트롤이 아니게 됨. 3-6 timeSpeed 합류 시 패널의
  책임 경계 재평가(readout 을 별도 fixed 오버레이로 분리할지).
- **Euler 데모 dt 가 프리셋에 하드코딩(T/120)** — `recommendedDt` 의미가 살짝
  *demo dt* 로 바뀜. 필요해지면 `demoDt?` 필드로 분리(지금은 YAGNI, 주석으로 명시).
- **가독성 / 카피** — `Euler|RK4`, `three-body`, `Conservation ΔE/ΔL` 등 전문
  용어가 우주 비전공 방문자에게 불친절. PRD §5 "처음 본 친구 3명 반응" 기준에
  직결. **Phase 3 닫을 때 전용 패스** 로(인수인계 후보에 명시). 가장 큰 레버 =
  각 프리셋의 `description`(이미 평이한 카피)이 hover `title` 에 *숨어* 있음 →
  화면 노출만 해도 모든 씬이 스스로 설명됨.
- **leva 미도입** — TechSpec 의 dt/ε 튜닝용이었으나 수치 스윕이 대신함. Phase 4
  GLSL 셰이더 파라미터 튜닝 때 다시 평가.

## 다음 sub-phase(3-6 = 시간 컨트롤)에 적용할 교훈
- **`TIME_SPEED` 상수 → `store.timeSpeed`** — Integrator 주석에 "substep 수학은
  이미 구조화됨" 명시해둠. `getState().timeSpeed`, 0.1×/1×/100×/10,000×.
  *물리 정확도(고정 dt) = 시각 속도 독립* — 빠르게 = 프레임당 substep 더 많이.
- **paused = substep 0** (또는 루프 skip). reset 은 프리셋 재선택이 이미 담당.
- **CameraController(천체 추적)** — 3-5 에서 분리해 3-6 으로 이월. CameraRig
  명령형 패턴(3-4) 위에 얹기.
- **각 커밋 빌드 통과** — 3-5 트러블 1 이 뼈저리게 가르친 것. prop 내리는 쪽 ↔
  받는 쪽은 한 커밋.

## 🌌 이번에 알게 된 우주의 한 조각

- **방법(method)이 우주의 운명을 가른다.** 같은 뉴턴 법칙, 같은 초기조건, 같은
  *거친* 시간 간격(dt) — 그런데 그 시간을 *어떻게 굴리느냐* 만으로 한쪽 우주는
  타원을 영원히 닫고, 다른 쪽은 에너지를 흘려 나선으로 풀려 천체가 튕겨나간다.
  적분기는 "더 정확한 근사" 의 문제가 아니라 *어떤 우주를 시뮬레이션하는가* 의
  선택이다. 실제 천체역학자들이 태양계의 수십억 년 안정성을 적분할 때 *symplectic*
  적분기(에너지를 장기적으로 보존하는 종류)에 집착하는 이유가 바로 이것 — 순진한
  Euler 로 굴렸다면 행성들이 *코드의 거짓말로* 나선을 그리며 태양에 빨려들거나
  성간으로 날아가, 실재하지 않는 종말을 예언했을 것이다. RK4 가 거친 dt 에서도
  타원을 *정확히 apoapsis 에 닫는* 걸 두 눈으로 본 1초가, 그 집착을 이해하게 했다.

- **그리고 figure-8 의 섭동 = 라플라스의 악마가 무너지는 지점.** 머리카락 한 올
  만큼 시작점을 밀면 — 완전히 결정론적인 방정식인데도 — 운명이 갈라진다. 미래는
  *원리상* 정해져 있지만 *실질적으로* 예측 불가. 3체 문제가 가르친 카오스의 정수를,
  슬라이더 한 칸으로 손끝에 쥐어본 셈.
