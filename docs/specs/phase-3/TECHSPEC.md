# Phase 3 TechSpec — Gravity

> *작성일: 2026-05-25*
> *상태: Draft → sub-3-1 진입 시 Confirmed → **sub-3-3 통과 후 동기화 (2026-05-31)***
>
> *스택 실측 (2026-05-25)*: `frontend/package.json` 직접 확인 — React 19.2.5 / R3F 9.6.1 /
> drei 10.7.7 / three 0.170 / zustand 5.0.13 / vitest 4.1.6 / Vite 8.0.10 / TS 6.0.2.
> **물리·수학 라이브러리 0개** — Phase 3 적분기는 *외부 의존성 없이 순수 손코딩*.
> 이게 오히려 *lib/physics 순수 함수 + TDD* 와 정확히 맞물린다. (sub-2-7의 Context Rot
> 교훈대로 매트릭스 추측 대신 package.json 실측.)
>
> *sub-3-3 동기화 메모*: 본 문서가 *예측한 in-place 적분* 은 sub-3-1 실물 확인 결과 *pure
> 함수 (fresh SystemState 반환)* 로 정착, sub-3-3 에서 *ref-교체* 패턴으로 무리렌더 달성.
> §1 / §2 / §3 / §4 모두 *실물에 맞춰* 갱신. *문서가 코드를 따라간다* (sub-3-2 §1 교훈).
>
> *2026-06-04 동기화 (sub-3-6 Plan 진입)*: §7 sub-phase 분할 갱신.
> (1) **상태 정정 (Context Rot)** — 3-4 / 3-5 ⬜→✅. 두 sub-phase 완료, sub-3-5 Check
>     (`docs/checks/phase-3/sub-3-5.md`, Issue #22) 존재하는데 §7 이 미갱신이었음.
> (2) **카메라 이월 + 분할** — §7 은 CameraController 를 3-5 에 계획했으나 sub-3-5 회고가
>     *이월* (스펙↔실물 충돌, 실물이 정본). 당초 6 sub-phase 의 3-6 (시간 컨트롤 +
>     모바일/성능/Lighthouse + Phase 종료) 을 → **3-6 = 시간 컨트롤만**, **신규 3-7 =
>     CameraController(천체 추적) + 모바일/성능/Lighthouse + Phase 종료** 로 분리.
>     *한 sub-phase = 한 관심사* (PCTC 결, sub-2-4 의 *한 의도=한 액션* 의 sub-phase판).
> (3) §2 도식 카메라 주석 "3-5" → "3-7" 정정.
>
> *2026-06-05 동기화 (sub-3-6 종료)*: §2 substep 루프 의사코드 → **분수 누적기**
> (floor-1 폐기, `lib/util/substep.ts`) 로 갱신, §3 store → 실물(`TimeSpeed` 유니온 +
> `paused` 직교, `presetLoadedAt` 미구현 명시) 동기화. §7 3-6 ✅(#23). **3-7 범위
> 확장** — sub-3-6 스모크에서 드러난 *PresetSelector 넘침* + *현재-시뮬 리셋*
> (`presetLoadedAt` nonce)을 3-7 핫픽스 묶음으로 흡수 (Ken 결정).

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 선택 이유 |
|------|------|-------------------|----------|
| 적분기 (주) | **RK4 (4차 룽게-쿠타)** | Euler(1차), Verlet/Leapfrog(symplectic), RKF45(적응형) | 정확도/구현난이도 균형 + *2체 해석해로 검증 가능*. 인수인계 결정. Euler는 *영혼 데모* 로 의도 보존, Verlet은 *알려진 한계* 에 후속으로 명시 |
| 적분기 (데모) | **Euler 보존** (전환 토글) | Euler 미구현 | PRD §3 *그 한 순간* = Euler가 *우주를 깨는* 것을 보여주는 대비축. 순수 함수라 비용 0 |
| 중력 합산 | **직접합 O(N²) pairwise** | Barnes-Hut O(N log N) tree code | N이 수십 규모 → O(N²) 가볍고 *정확*. tree code는 근사 + 과잉 (YAGNI) |
| 근접 발산 처리 | **softening ε**: `(\|r\|² + ε²)^1.5` 분모 | 충돌 감지+머지, hard cutoff, 무처리 | 근접 시 `1/r²` 폭발 방지 = *표준 N-body 기법*, 파라미터 하나. 거리 압축 충돌(sub-2-6 달 버그)의 물리 버전 |
| 물리 상태 보유 | **mutable ref + useFrame 마다 *ref 교체*** (`bodiesRef.current = rk4Step(...)`) | (원안) ref 안 SystemState in-place 변형 / store에 위치/속도 보유 (매 프레임 setState) | *매 프레임 setState 0 → 리렌더 0*. Phase 2 *useFrame-derived* 패러다임의 N-body판. **원안의 in-place 변형은 sub-3-3 에서 기각** — pure rk4Step (sub-3-1) 이 fresh SystemState 를 반환하므로 in-place 래퍼는 *검증된 코어를 다시 짜야* 가능 (sub-3-2 금지). 코어 보존이 우선 |
| store 책임 | **제어 상태만**: `presetId / integrator / timeSpeed / paused / perturbation` | 물리 상태까지 store | store = *사용자 의도*, ref = *물리 상태*. 역할 분리 (Phase 2 store 정신). **3-3 에선 store 미도입** — 단일 프리셋·고정 RK4 라 인라인 상수로 충분. 3-4 프리셋 셀렉터부터 도입 |
| 타임스텝 ↔ 시각 속도 | **고정 물리 dt + 시각 속도 = 프레임당 substep 수** | 시각 속도로 dt 직접 스케일 | *정확도는 dt가 결정* → dt 고정해야 시각 속도와 무관하게 같은 궤도. 빠르게=substep↑, 느리게=substep↓/스킵. (인수인계 §5 핵심 질문의 답). **3-3 에선 TIME_SPEED=1 컴파일 상수** — 3-5/3-6 에서 store 로 |
| 물리 단위 | **정규화 (코드) 단위** — 프리셋이 `G`·질량·거리·시간 스케일 정의 | SI (m/kg/s), 천문단위(AU/M☉/년) 직접 | 2체 검증이 *무차원* 으로 깨끗 (`G=1`, `M=1` 케이스). 태양계 프리셋은 자체 스케일 + 표시 변환 |
| 벡터 연산 | **three `Vector3` 직접** (lib/physics는 순수 함수로 래핑) | 자작 Vec3, gl-matrix | three 이미 의존성. 단, *적분 핵심 수식은 순수 함수* 로 분리해 테스트 가능하게 (Vector3 in/out) |
| 궤적 (trails) | **ring-buffer + imperative `THREE.Line` + `<primitive>`** | drei `<Line>` (원안) / `<line>` JSX intrinsic / 매 프레임 점 누적(무한 증가) | 메모리 고정(고정 길이 ring) + GC 압력 0. **drei `<Line>` 은 sub-3-3 Light 2 의 Stars bisect 경험상 v10 매트릭스 위험**; **`<line>` JSX intrinsic 은 SVG `<line>` 과 R3F v9 / React 19 타입 충돌**. imperative 가 두 함정 모두 우회 |
| 동심 trail 방어 | **per-body `Line.position.z` micro-stagger (0.001)** | 없음 / blending 변경 | sub-3-3 Light 6 trial: 동질량 원궤도에서 두 trail 이 *같은 곡선* 이라 한쪽이 숨는 그래픽 증상. 데이터-원인이라 진짜 해법은 비대칭 프리셋이지만, micro-stagger 는 *coplanar trail 의 깊이 정렬 일반 방어* 로 한 줄 비용에 유지 |
| 씬 셋업 | **`components/gravity/Scene.tsx`** = Phase 2 Scene 패턴 재사용 (Canvas + dpr 캡 + 안쪽 Suspense + dev 컨트롤 가드) | Phase 2 Scene 직접 import | Phase 2 §2 결정 그대로 — 라우트 Suspense로 올리면 Canvas 언마운트 → Context Lost (sub-2-7 트러블슈팅). *Canvas 안쪽 Suspense 고정*. **3-3 분기**: 텍스처 0 이라 안쪽 Suspense 의 *suspend source* 가 없음 → 한 줄 생략. **3-4 태양계 프리셋이 텍스처 도입 시 패턴 복원** |
| 검증 방법 | **vitest 수치 테스트가 정본** (보존량 비교 + ring-buffer 불변량) | 시각 육안만 | 카오스라 *궤도 발산 ≠ 버그*. 에너지·각운동량·주기 보존이 *적분 정상성* 의 유일한 객관 기준. **3-3 의 ring-buffer 9 증명서가 trail 시각 보장의 받침** |
| 개발 디버그 GUI | leva (DEV 가드, Phase 2 패턴) | 없음 | softening ε / dt / 질량 / 초기 속도 손튜닝. prod 번들 제외(`import.meta.env.DEV`). **3-3 미도입**, 3-5 ε/dt 튜닝 시 |

### 호환성 매트릭스 (참고 — package.json 실측본)

| 우리 스택 | 버전 | 페어 / 비고 |
|---|---|---|
| React | 19.2.5 | — |
| @react-three/fiber | 9.6.1 | React 19 짝꿍 |
| @react-three/drei | 10.7.7 | R3F v9 짝꿍. **3-3 Light 2 발견: `Stars` 가 *조용히* 안 그려짐** — 매트릭스 깨짐 의심, drei docs 재확인 후 복원 (회고 후보) |
| three | 0.170.x | `Vector3` 물리 벡터 + 렌더 |
| zustand | 5.0.13 | 제어 상태 store (물리 상태는 ref). **3-3 미도입**, 3-4 부터 |
| vitest | 4.1.6 | `lib/physics` + `lib/util` 순수 함수 TDD — *이 Phase의 안전망* |
| **물리/수학 라이브러리** | **없음** | RK4·중력·보존량·ring-buffer 전부 순수 손코딩 (의존성 0) |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────┐
│  Page: GravityPage (/gravity)                    │
│  └─ owns bodiesRef (Canvas 안/밖 공통 조상)      │
│  ┌────────────────────────────────────────────┐  │
│  │  R3F <Canvas dpr={[1,2]}>                  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ <Scene>  (Phase 2 패턴 미러)         │  │  │
│  │  │   <Integrator />   ← useFrame substep │  │  │
│  │  │   <Bodies />       ← ref → mesh 위치  │  │  │
│  │  │   <Trails />       ← ring-buffer 라인 │  │  │
│  │  │   (Stars   — 3-4 drei 매트릭스 복원후)│  │  │
│  │  │   (Camera  — 3-7 선택/추적부터)       │  │  │
│  │  │   <OrbitControls />                  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  ControlPanel (Canvas 밖, 하단 고정)       │  │
│  │  3-4 부터 도입. 3-3 미배치.                 │  │
│  │  [⏸] [0.1× 1× 100× 10,000×]                │  │
│  │  프리셋: [2체][3체][쌍성][태양계]          │  │
│  │  적분기: [Euler | RK4]   섭동: [——●——]     │  │
│  │  에너지 readout: E_total ▮▮▮  L ▮▮         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
            ↕ (제어 상태, 3-4부터)        ↕ (물리 상태)
   ┌──────────────────────┐    ┌──────────────────────────┐
   │  Zustand store       │    │  bodiesRef (mutable id)  │
   │  - presetId          │    │  .current : SystemState  │
   │  - integrator (e/rk4)│    │  (Body[] = mass/pos/vel) │
   │  - timeSpeed         │    │  useFrame가 매 프레임    │
   │  - paused            │    │  .current 를 *교체*       │
   │  - perturbation      │    │  (in-place 변형 X)        │
   │  - presetLoadedAt    │    └──────────────────────────┘
   └──────────────────────┘              ↑ 초기화
                               ┌──────────────────────────┐
                               │  data/presets.ts         │
                               │  (불변 초기조건 단일소스) │
                               │  + data/planets.ts(mass) │
                               └──────────────────────────┘
                ↑ 순수 함수 (테스트 정본)
        ┌────────────────────────────────────┐
        │  lib/physics/                      │
        │  - types.ts    (Body, SystemState) │
        │  - gravity.ts  (가속도, softening) │
        │  - integrators.ts (rk4Step, eulerStep) │
        │  - energy.ts   (E_total, L)        │
        │                                    │
        │  lib/util/                         │
        │  - ringBuffer.ts  (trails 받침)    │
        └────────────────────────────────────┘
```

**흐름**:
- `lib/physics/types.ts`: `Body` (mass/position/velocity 만) + `SystemState = Body[]`. 렌더 메타 (id/color/radius/label) 는 `presets.ts` 의 `PresetBody` 가 *위에* 얹음. *물리/렌더 분리* (sub-3-3 결정).
- `lib/physics/gravity.ts`: `computeAccelerations(bodies, G, softening)` → `Vector3[]`. *순수 함수*. `a_i = Σ_{j≠i} G·m_j·(r_j−r_i) / (|r_j−r_i|²+ε²)^1.5`.
- `lib/physics/integrators.ts`: `rk4Step(state, dt, accelOf)` / `eulerStep(state, dt, accelOf)`. `accelOf: (state) => Vector3[]` (AccelFn — gravity 가속도를 G/ε 클로저로 감싼 일급 함수). **반환값은 *새 SystemState*** (in/out 불변, 모든 Vector3 fresh). 적분기는 ODE 일반화가 아닌 *위치/속도/가속도* 직접 형태.
- `lib/physics/energy.ts`: `totalEnergy(state, G)` = KE + PE, `angularMomentum(state)`. *검증용 순수 함수*.
- `lib/util/ringBuffer.ts`: 고정 길이 FIFO. `push(x,y,z)` O(1), `forEach((x,y,z,i)=>...)` 시간 순 (oldest→newest), `rawBuffer` zero-copy. *Trails 시각 보장의 받침* (9 증명서, sub-3-3 Light 5).
- `data/presets.ts`: 프리셋별 초기조건 (`bodies`, `G`, 권장 `dt`, `ε`). `PresetBody = Body & { id, color, radius, label }` 인라인. 태양계는 `planets.ts` real 값(+mass) 재사용. **sub-3-3: `TWO_BODY` (비대칭 e=0.3) + `TWO_BODY_CIRCULAR` (sub-3-2 검증 fixture)** 두 export.
- `Zustand store` (3-4부터): 제어 상태만. 프리셋 변경 시 `bodiesRef.current` 를 프리셋 초기조건으로 *재초기화* + `presetLoadedAt` 갱신. **3-3 은 `GravityPage` 가 mount 시 1 회 초기화로 갈음** (단일 프리셋).
- `bodiesRef`: `useRef<SystemState>`. `.current` 식별자는 mount 후 불변, *값은 매 프레임 새 SystemState 로 교체*. ref 교체만으로 React 리렌더 0 보장 (식별자 비교).
- `<Integrator>`: `useFrame` 안에서 `bodiesRef.current = rk4Step(bodiesRef.current, dt, accelOf)` 를 substep 만큼 반복. *화면 없음* (`return null`).
- `<Bodies>`: `bodiesRef.current` 를 매 프레임 읽어 각 mesh `position.copy(...)` 로 직접 write (Phase 2 useFrame-derived 의 N-body판).
- `<Trails>`: 매 프레임 각 천체 위치를 per-body RingBuffer 에 push, `BufferGeometry` position/color 어트리뷰트로 페이드 라인 직접 write. 컴포넌트는 imperative `THREE.Line` 을 `<primitive>` 로 마운트.
- `ControlPanel` (3-4부터): store setter 호출. 적분기 토글 / 프리셋 / 시간 속도 / 섭동.

**substep 루프 (타임스텝 분리의 심장)** *(sub-3-6 실물)*:
```
useFrame((_, frameDelta)):
  { integrator, timeSpeed, paused } = getState()   // 무구독 — 리렌더 0
  if paused: return                                // 정지: 스텝 X + 누적도 X
  { substeps, accumulator } =
      advanceAccumulator(acc, frameDelta, timeSpeed, FIXED_DT, MAX_SUBSTEPS)
  acc = accumulator                                // 남은 sim-time 다음 프레임 이월
  if substeps == 0: return                         // 0.1× — 아직 FIXED_DT 만큼 안 참
  step = (integrator == 'euler') ? eulerStep : rk4Step   // method 축 (3-5)
  s = bodiesRef.current
  for k in 0..substeps:  s = step(s, FIXED_DT, accelOf)
  bodiesRef.current = s                            // ref 교체 (in-place 아님)
```
→ `FIXED_DT` 고정이라 *시각 속도와 무관하게 같은 정확도*. 시각 속도는 *프레임당 몇 번 적분하느냐* 로만 작용. `MAX_SUBSTEPS` 캡이 폭증 방지.

> *sub-3-6 정정*: 당초 의사코드의 `clamp(ceil(…), 1, …)` 는 **floor-1** 때문에
> *프레임당 1 step 미만* 을 표현 못 해 — fine-dt 프리셋에서 **0.1× 가 1× 와 동일**해지고
> 프레임률에 의존했다 (sub-3-5 에 묻혀 있던 버그). 해법은 **분수 누적기**
> (`lib/util/substep.ts`, 순수·테스트됨): sim-time 을 프레임 간 *은행* 에 모았다가
> `FIXED_DT` 단위로 *통째* 소비. 0.1× = 여러 프레임에 한 step, 10,000× = 한 프레임에
> 캡까지. 캡 초과분은 *드롭* (backlog 누적 = death spiral 차단). 결정론 유지 —
> 방문 상태열 `step^k(s₀)` 은 속도와 무관, 누적기는 *언제* 찍느냐만 정함. *적분기 2층*
> (순수 코어 ↔ 래퍼) 그대로: `rk4Step`/`eulerStep` 한 글자도 안 고침.

---

## 3. 데이터 모델

### `lib/physics/types.ts` (실물)

```ts
// 한 천체 — 물리 코어가 아는 전부.
// id/color/radius/label 같은 렌더 메타는 의도적으로 여기 없음 — 적분기와
// 중력 함수는 천체가 어떻게 보이는지 신경 안 씀. 프리셋/씬 레이어가 위로 얹음.
interface Body {
  mass: number          // 정규화/프리셋 단위
  position: Vector3
  velocity: Vector3
}

// N-body 시스템 — 적분기가 입력/출력으로 다루는 값.
// 물리 함수들은 pure: SystemState 를 읽고 *새* SystemState (모든 Vector3 fresh)
// 를 반환. mutable ref 기반 in-place 최적화는 component 레이어 (sub-3-3) 의 일.
type SystemState = Body[]

// AccelFn — 가속도 필드 (gravity 클로저로 G/ε 캡쳐).
type AccelFn = (state: SystemState) => Vector3[]

// 적분기 시그니처 (순수).
type Integrator = (state: SystemState, dt: number, accelOf: AccelFn) => SystemState
```

### `data/presets.ts` (sub-3-3 실물)

```ts
type PresetBody = Body & {
  id: string
  color: string
  radius: number       // 시각 반지름 (물리 점질량)
  label: string
}

interface Preset {
  id: 'two-body' | 'two-body-circular' | 'three-body' | 'binary' | 'solar-system'
  name: string
  description: string
  G: number
  recommendedDt: number
  softening: number
  bodies: PresetBody[]
}
```

- **two-body** (sub-3-3 헤드라인): 비대칭 (m=5:1) + e=0.3 타원, barycenter 정지. *두 별이 다른 크기 동심 타원* 으로 보이는 PRD §3 *태양-지구* 의 시각화.
- **two-body-circular**: 동질량 원궤도 — sub-3-2 conservation 검증 fixture 와 *비트 단위 동일* (`circularBinary()` 와 같은 숫자). 셀렉터의 *수학적 깨끗함* 옵션.
- **three-body**: figure-8 (Chenciner–Montgomery *published 초기조건* 그대로 — 민감하니 테스트로 고정) + 섭동 슬라이더로 카오스 체험.
- **binary**: 쌍성계 (질량비 다른 두 별).
- **solar-system**: `data/planets.ts` 의 real 거리/주기 + **mass 필드 확장** 재사용. 초기 속도는 *원궤도 근사* (`v = √(G·M☉/r)`) — Phase 2 원궤도 가정의 연장.

> **`data/planets.ts` 확장**: Phase 2는 mass가 불필요했음. Phase 3는 `mass` (real, kg 또는 M☉) 필드 추가 — *단일 소스 성장*. Phase 2 컴포넌트는 mass를 안 읽으므로 영향 0.

### `store/gravityStore.ts` (제어 상태만, 3-4부터 / sub-3-6 실물)

```ts
const TIME_SPEEDS = [0.1, 1, 100, 10_000] as const   // 3-6
type TimeSpeed = (typeof TIME_SPEEDS)[number]

interface GravityStore {
  presetId: PresetId
  integrator: 'euler' | 'rk4'                // 3-5 — method 축 (영혼)
  perturbation: number                       // 3-5 — 3체 섭동 (초기조건 미세 변위)
  timeSpeed: TimeSpeed                        // 3-6 — 시각 속도 (dt 는 절대 스케일 X)
  paused: boolean                            // 3-6 — substep 루프 게이트
  // setters: selectPreset / setIntegrator / setPerturbation
  //          + setTimeSpeed(unpause 동반) / togglePause                  // 3-6
}
```

> *sub-3-6 정정* (실물에 동기화 — *문서는 코드를 따라간다*):
> - `timeSpeed` 는 `number` 가 아니라 **`TimeSpeed` 유니온** (4값 한정). 당초 주석
>   `0(정지)` 는 폐기 — **pause 는 `timeSpeed === 0` 이 아니라 별도 `paused` 불리언**.
>   둘은 *직교*: 정지해도 선택 속도 보존 → 재개 시 그 속도 (Phase 2 `prevSpeed` 부기 불필요).
> - `selectPreset` 이 *프리셋 = Phase 3 리셋* 정신으로 `perturbation/timeSpeed/paused` 를
>   기본값으로 함께 초기화 (별도 리셋 액션 없음, sub-2-4 YAGNI).
> - **`presetLoadedAt` nonce 는 *아직 미구현*** — *같은* 프리셋 재선택 시 re-seed 가
>   안 일어나는 구멍(현재 시뮬 리셋 먹통)을 메우는 장치. **리셋 커밋(3-6 이후 별도:
>   nonce + ↻ 트랜스포트 버튼 + R 키)에서 도입 예정.** 그때 `GravityPage` 의 re-seed
>   deps 에 합류.

---

## 4. 폴더 구조

```
frontend/src/
├── pages/
│   └── GravityPage.tsx                ← /gravity 진입점 (bodiesRef 소유)
├── components/
│   └── gravity/
│       ├── Scene.tsx                  ← Canvas 루트 (Phase 2 패턴 미러)
│       ├── Integrator.tsx             ← useFrame substep, ref 교체 (return null)
│       ├── Bodies.tsx                 ← bodiesRef → mesh 위치 매 프레임
│       ├── Trails.tsx                 ← ring-buffer 궤적 라인 (imperative Line)
│       ├── EnergyReadout.tsx          ← 총 에너지/각운동량 표시 (Canvas 밖) — 3-5
│       └── ControlPanel.tsx           ← 프리셋/적분기/시간/섭동 (ControlButtons 재사용) — 3-4
├── data/
│   ├── presets.ts                     ← N-body 초기조건 단일 소스
│   └── planets.ts                     ← mass 필드 확장 (태양계 프리셋 재사용) — 3-4
├── store/
│   └── gravityStore.ts                ← 제어 상태 Zustand (물리 상태는 ref) — 3-4
├── lib/
│   ├── physics/                       ← ★ 순수 함수 + TDD (이 Phase의 심장)
│   │   ├── types.ts                   ← Body, SystemState, AccelFn
│   │   ├── gravity.ts                 ← 가속도 (softening) + 테스트
│   │   ├── integrators.ts             ← rk4Step / eulerStep + 테스트
│   │   ├── energy.ts                  ← totalEnergy / angularMomentum + 테스트
│   │   └── two-body.test.ts           ← 보존 4 증명서 (sub-3-2)
│   └── util/
│       └── ringBuffer.ts (+ .test.ts) ← trails 받침, 9 증명서 (sub-3-3)
└── (재사용) hooks/useIsTouchDevice, components/ui/{Spinner,ControlButtons},
             components/layout/AppLayout, CameraController 패턴
```

---

## 5. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프
- **RK4 선택 (Euler 데모 보존)**: 정확도/난이도 균형 + *영혼 데모*. 둘 다 순수 함수라 비용 0.
- **O(N²) 직접합**: N이 작아 가볍고 정확. tree code(Barnes-Hut)는 YAGNI.
- **softening ε**: 근접 발산만 막는 표준 기법. 충돌 머지는 미구현 (점질량).
- **물리 상태 = ref-교체, store = 제어만**: Phase 2 *무리렌더* 패러다임의 N-body판. setState 0. Vector3 GC 압력은 *측정 전엔 가짜 적* (sub-2-7 측정 우선 원칙).
- **고정 dt + substep**: *물리 정확도와 시각 속도 분리* (인수인계 §5 핵심 질문의 답).
- **정규화 단위**: 2체 검증을 무차원으로 깨끗하게. 태양계는 자체 스케일.

### 알려진 한계
- **RK4는 symplectic이 아니다** — *매우 긴* 적분에선 천천히 에너지가 드리프트한다. 그러나 PRD 영혼은 *Euler vs RK4 대비* (Euler는 *몇 바퀴 만에* 깨짐, RK4는 데모 시간 동안 *닫혀 보임*) 이므로 RK4로 충분. *무한 안정성* 이 필요하면 Verlet/Leapfrog(symplectic) — **후속/Phase 4 이후 고려**. *정직한 한계로 명시*.
- **점질량 가정** — 물리적 크기 충돌 없음. softening이 근접 시 *살짝 부정확* (의도적 trade).
- **태양계 프리셋의 초기 속도 = 원궤도 근사** — 실제 이심률·궤도면 경사·현재 위상 무시. Phase 2 원궤도 가정의 연장. *2체 정밀 검증은 정규화 프리셋이 담당*, 태양계는 *느낌/연속성* 담당.
- **평면 초기조건 위주** — 3D 공간이지만 프리셋은 가독성 위해 평면. 자유 배치 에디터 없음.
- **메인스레드 계산** — Web Worker 분리 안 함. N·substep 상한으로 60fps 방어. 대규모 N은 범위 외.
- **카오스 = 재현성의 한계** — figure-8은 published 초기조건이라도 부동소수점·dt에 민감. 테스트는 *보존량* 으로 정상성 판별 (정확한 궤도 좌표 비교 X).

이 한계들은 PRD 메시지(*"법칙 하나에서 케플러가 태어난다"*, *"방법이 우주를 가른다"*)와 무관 — Phase 3 범위 밖.

---

## 6. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| RK4 구현의 미묘한 수식 오류 (k1~k4 조합) | 중간 | **TDD** — 2체 해석해(에너지/각운동량/`T²∝a³`)로 자동 검증. sub-3-2가 안전망. *화면 보기 전에 테스트가 잡음* |
| figure-8 초기조건이 조금만 틀려도 깨짐 | 높음 | *published 초기조건 그대로* 사용 + 스냅샷/보존량 테스트로 고정. 손튜닝 금지 |
| 카오스라 "버그 vs 정상 발산" 구분 불가 | 중간 | *에너지 보존* 으로 판별 — 보존되면 적분 정상(궤도 발산은 물리적), 안 되면 버그 |
| 시각 속도 ↑ 시 substep 폭증 → 프레임 드랍 | 중간 | `MAX_SUBSTEPS` 캡. 초과분은 *시뮬 시간 손실* 허용(시각 속도 정의가 "최대 노력") + 큰 속도에서 정확도 경고 |
| N-body 계산이 메인스레드 fps 깎음 | 중간 | N 수십 상한 + O(N²) 가벼움. 모바일 더 보수적. 측정 후 필요 시 Worker(범위 밖 후속) |
| ref 기반 물리 상태와 React 렌더 동기화 헷갈림 | 중간 (Phase 2 무리렌더 학습 있음) | mesh 위치는 *useFrame에서 ref 직접 read*. store는 제어만. 프리셋 변경만 재초기화 트리거 |
| 정규화 단위 ↔ 표시 단위 혼선 | 낮음 | 프리셋이 단위 소유. 2체는 `G=1`. *"이 숫자 어디서 왔나" = 프리셋 한 곳* |
| tsc 통과 ≠ 물리 정확 | 중간 | *물리 정본은 vitest 수치 테스트* (tsc는 타입만). push 전 `npm run build` + `npm run test:run` |
| trails 매 프레임 점 누적 → 메모리/ GC | 낮음 | ring-buffer 고정 길이. 무한 push 금지. 9 증명서로 회전 불변량 고정 (sub-3-3 Light 5) |
| **drei 컴포넌트의 *조용한* 매트릭스 깨짐** *(sub-3-3 Light 2 발견)* | 중간 | bisect 디버그 (한 번에 다 켜지 말고 한 개씩). 깨지는 컴포넌트는 회피 (Stars 제거 → 분위기 자산 회복은 별도 chore) |
| **데이터 자체가 같아 보이는 시각 증상** *(sub-3-3 Light 6 발견)* | 중간 | *그래픽 증상을 그래픽 원인으로 가정 X*. 세 그래픽 fix 실패 후 입력으로 시선 돌리니 풀림 — 입력 같지 않은지 *먼저* 확인 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **3-1**: N-body 데이터 모델 + 중력 가속도(softening) + **RK4 적분기** — `lib/physics` 순수 함수, *TDD, 화면 없음*. 테스트로 굴린다. ✅
- **3-2**: **2체 해석해 검증** (에너지·각운동량 보존 + 케플러 `T²∝a³`) + Euler 적분기(대비용) 구현. *이 Phase의 안전망*. ✅
- **3-3**: N-body 씬 + **궤적(trails)** — Scene 재사용, `bodiesRef` 무리렌더 (*ref-교체*), mesh 직접 write, ring-buffer 9 증명서. *첫 시각화* (비대칭 e=0.3 두 별이 *동심의 다른 타원* 을 그리는 순간). ✅
- **3-4**: **프리셋 셀렉터** (2체 / 3체 figure-8 / 쌍성 / 태양계) + `planets.ts` mass 확장 + `gravityStore` 도입 + 카메라 메타를 Preset 으로. ✅
- **3-5**: **적분기 토글 [Euler|RK4] + 에너지 readout + 카오스 섭동** — *Phase의 영혼*. PRD §3 *그 한 순간*. ✅ *(CameraController 는 3-7 로 이월 — `docs/checks/phase-3/sub-3-5.md` 참조)*
- **3-6**: **시간 컨트롤** — 타임스텝↔시각속도 substep 분리 (`TIME_SPEED` 상수 → `store.timeSpeed` + 분수 누적기, paused=루프 게이트), `MAX_SUBSTEPS` 캡, ControlPanel 시간 UI + 키보드. *물리 정확도(고정 dt) ⊥ 시각 속도*. ✅ *(`docs/checks/phase-3/sub-3-6.md`, #23)*
- **3-7** (Phase 종료): **CameraController(천체 추적)** (3-5 이월, CameraRig 명령형 패턴 위에 + 프리셋 `CameraConfig` 메타 재사용) + **PresetSelector 사이드바 넘침 fix** (sub-3-6 스모크 발견) + **현재-시뮬 리셋** (`presetLoadedAt` nonce + ↻ 트랜스포트 버튼 + R 키, `selectPreset` 통합 경로 재사용) + 모바일/성능/Lighthouse + **Phase 종료 + 인수인계**. ⬜

총 7 sub-phase (당초 6 → sub-3-5 의 카메라 이월 + 3-6 시간 컨트롤 집중 → 카메라/폴리시/종료를 3-7 로 분리). **3-1 / 3-2 가 심장** (순수 물리 + 검증), **3-5 가 영혼** (Euler vs RK4). 3-7 은 *마무리 + 폴리시 합류* sub-phase 라 Light 가 많음 — Plan 에서 (a) 카메라 / (b) 핫픽스(넘침+리셋) / (c) 성능·종료 세 묶음으로 쪼갠다.

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
*"이번 Phase의 정본은 화면이 아니라 테스트다 — 보존량이 우주의 정상성을 증명한다."*
*"문서는 코드를 따라간다. 실물이 정본." (sub-3-2 / sub-3-3)*
