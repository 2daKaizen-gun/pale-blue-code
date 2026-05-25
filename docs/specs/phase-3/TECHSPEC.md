# Phase 3 TechSpec — Gravity

> *작성일: 2026-05-25*
> *상태: Draft → sub-3-1 진입 시 Confirmed*
>
> *스택 실측 (2026-05-25)*: `frontend/package.json` 직접 확인 — React 19.2.5 / R3F 9.6.1 /
> drei 10.7.7 / three 0.170 / zustand 5.0.13 / vitest 4.1.6 / Vite 8.0.10 / TS 6.0.2.
> **물리·수학 라이브러리 0개** — Phase 3 적분기는 *외부 의존성 없이 순수 손코딩*.
> 이게 오히려 *lib/physics 순수 함수 + TDD* 와 정확히 맞물린다. (sub-2-7의 Context Rot
> 교훈대로 매트릭스 추측 대신 package.json 실측.)

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 선택 이유 |
|------|------|-------------------|----------|
| 적분기 (주) | **RK4 (4차 룽게-쿠타)** | Euler(1차), Verlet/Leapfrog(symplectic), RKF45(적응형) | 정확도/구현난이도 균형 + *2체 해석해로 검증 가능*. 인수인계 결정. Euler는 *영혼 데모* 로 의도 보존, Verlet은 *알려진 한계* 에 후속으로 명시 |
| 적분기 (데모) | **Euler 보존** (전환 토글) | Euler 미구현 | PRD §3 *그 한 순간* = Euler가 *우주를 깨는* 것을 보여주는 대비축. 순수 함수라 비용 0 |
| 중력 합산 | **직접합 O(N²) pairwise** | Barnes-Hut O(N log N) tree code | N이 수십 규모 → O(N²) 가볍고 *정확*. tree code는 근사 + 과잉 (YAGNI) |
| 근접 발산 처리 | **softening ε**: `(\|r\|² + ε²)^1.5` 분모 | 충돌 감지+머지, hard cutoff, 무처리 | 근접 시 `1/r²` 폭발 방지 = *표준 N-body 기법*, 파라미터 하나. 거리 압축 충돌(sub-2-6 달 버그)의 물리 버전 |
| 물리 상태 보유 | **mutable ref (위치/속도 배열) — useFrame 안에서 in-place 적분** | Zustand store에 위치/속도 보유 (매 프레임 setState) | *매 프레임 setState 0 → 리렌더 0*. Phase 2 *useFrame-derived* 패러다임의 N-body판. 차이: Phase 2는 derived(무상태), 여기는 *실제 적분 상태* 라 ref에 보유하고 mesh에 직접 write |
| store 책임 | **제어 상태만**: `presetId / integrator / timeSpeed / paused / perturbation` | 물리 상태까지 store | store = *사용자 의도*, ref = *물리 상태*. 역할 분리 (Phase 2 store 정신) |
| 타임스텝 ↔ 시각 속도 | **고정 물리 dt + 시각 속도 = 프레임당 substep 수** | 시각 속도로 dt 직접 스케일 | *정확도는 dt가 결정* → dt 고정해야 시각 속도와 무관하게 같은 궤도. 빠르게=substep↑, 느리게=substep↓/스킵. (인수인계 §5 핵심 질문의 답) |
| 물리 단위 | **정규화 (코드) 단위** — 프리셋이 `G`·질량·거리·시간 스케일 정의 | SI (m/kg/s), 천문단위(AU/M☉/년) 직접 | 2체 검증이 *무차원* 으로 깨끗 (`G=1`, `M=1` 케이스). 태양계 프리셋은 자체 스케일 + 표시 변환 |
| 벡터 연산 | **three `Vector3` 직접** (lib/physics는 순수 함수로 래핑) | 자작 Vec3, gl-matrix | three 이미 의존성. 단, *적분 핵심 수식은 순수 함수* 로 분리해 테스트 가능하게 (Vector3 in/out) |
| 궤적 (trails) | **ring-buffer + drei `<Line>` / BufferGeometry** | 매 프레임 점 누적(무한 증가), Trail 라이브러리 | 메모리 고정(고정 길이 ring) + GC 압력 0. 페이드는 vertexColors/opacity |
| 씬 셋업 | **`components/gravity/Scene.tsx`** = Phase 2 Scene 패턴 재사용 (Canvas + dpr 캡 + *안쪽* Suspense + dev 컨트롤 가드) | Phase 2 Scene 직접 import | Phase 2 §2 결정 그대로 — 라우트 Suspense로 올리면 Canvas 언마운트 → Context Lost (sub-2-7 트러블슈팅). *Canvas 안쪽 Suspense 고정* |
| 검증 방법 | **vitest 수치 테스트가 정본** (보존량 비교) | 시각 육안만 | 카오스라 *궤도 발산 ≠ 버그*. 에너지·각운동량·주기 보존이 *적분 정상성* 의 유일한 객관 기준 |
| 개발 디버그 GUI | leva (DEV 가드, Phase 2 패턴) | 없음 | softening ε / dt / 질량 / 초기 속도 손튜닝. prod 번들 제외(`import.meta.env.DEV`) |

### 호환성 매트릭스 (참고 — package.json 실측본)

| 우리 스택 | 버전 | 페어 / 비고 |
|---|---|---|
| React | 19.2.5 | — |
| @react-three/fiber | 9.6.1 | React 19 짝꿍 |
| @react-three/drei | 10.7.7 | R3F v9 짝꿍 (`<Line>` trails) |
| three | 0.170.x | `Vector3` 물리 벡터 + 렌더 |
| zustand | 5.0.13 | 제어 상태 store (물리 상태는 ref) |
| vitest | 4.1.6 | `lib/physics` 순수 함수 TDD — *이 Phase의 안전망* |
| **물리/수학 라이브러리** | **없음** | RK4·중력·보존량 전부 순수 손코딩 (의존성 0) |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────┐
│  Page: GravityPage (/gravity)                    │
│  ┌────────────────────────────────────────────┐  │
│  │  R3F <Canvas dpr={[1,2]}>                  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ <Scene>  (Phase 2 패턴, 안쪽 Suspense)│  │  │
│  │  │   <Integrator />   ← useFrame substep │  │  │
│  │  │   <Bodies />       ← ref → mesh 위치  │  │  │
│  │  │   <Trails />       ← ring-buffer 라인 │  │  │
│  │  │   <Stars />                          │  │  │
│  │  │   <CameraController /> (Phase 2 재사용)│  │  │
│  │  │   <OrbitControls />                  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  ControlPanel (Canvas 밖, 하단 고정)       │  │
│  │  [⏸] [0.1× 1× 100× 10,000×]                │  │
│  │  프리셋: [2체][3체][쌍성][태양계]          │  │
│  │  적분기: [Euler | RK4]   섭동: [——●——]     │  │
│  │  에너지 readout: E_total ▮▮▮  L ▮▮         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
            ↕ (제어 상태)                ↕ (물리 상태)
   ┌──────────────────────┐    ┌──────────────────────────┐
   │  Zustand store       │    │  bodiesRef (mutable)     │
   │  - presetId          │    │  - positions: Vector3[]  │
   │  - integrator (e/rk4)│    │  - velocities: Vector3[] │
   │  - timeSpeed         │    │  - masses: number[]      │
   │  - paused            │    │  (useFrame가 in-place 적분)│
   │  - perturbation      │    └──────────────────────────┘
   │  - presetLoadedAt    │              ↑ 초기화
   └──────────────────────┘    ┌──────────────────────────┐
                               │  data/presets.ts         │
                               │  (불변 초기조건 단일소스) │
                               │  + data/planets.ts(mass) │
                               └──────────────────────────┘
                ↑ 순수 함수 (테스트 정본)
        ┌────────────────────────────────────┐
        │  lib/physics/                      │
        │  - gravity.ts  (가속도, softening) │
        │  - integrators.ts (rk4Step, euler) │
        │  - energy.ts   (E_total, L)        │
        └────────────────────────────────────┘
```

**흐름**:
- `lib/physics/gravity.ts`: 상태(위치·질량) → 가속도 배열. `a_i = Σ_{j≠i} G·m_j·(r_j−r_i) / (|r_j−r_i|²+ε²)^1.5`. *순수 함수*.
- `lib/physics/integrators.ts`: `rk4Step(state, dt, derivative)` / `eulerStep(...)`. derivative = `(pos, vel) → (vel, accel)`. *순수 함수, in/out 불변*.
- `lib/physics/energy.ts`: `totalEnergy(state)` = KE + PE, `angularMomentum(state)`. *검증용 순수 함수*.
- `data/presets.ts`: 프리셋별 초기조건 (`bodies`, `G`, 권장 `dt`, `ε`). 태양계는 `planets.ts` real 값(+mass) 재사용.
- `Zustand store`: 제어 상태만. 프리셋 변경 시 `bodiesRef` 를 프리셋 초기조건으로 *재초기화* + `presetLoadedAt` 갱신.
- `bodiesRef`: 위치/속도/질량의 *가변* 보유. `<Integrator>` 의 `useFrame` 이 매 프레임 `substep` 만큼 적분기를 돌려 *in-place* 갱신 (setState 0).
- `<Bodies>`: `bodiesRef` 를 매 프레임 읽어 각 mesh `position` 에 직접 write (Phase 2 useFrame-derived의 N-body판).
- `<Trails>`: 각 천체 위치를 ring-buffer에 push, BufferGeometry로 페이드 라인.
- `ControlPanel`: store setter 호출. 적분기 토글 / 프리셋 / 시간 속도 / 섭동.

**substep 루프 (타임스텝 분리의 심장)**:
```
useFrame((_, frameDelta)):
  if paused: return
  totalSimDt = frameDelta * timeSpeed        // 이번 프레임이 진행할 "시뮬 시간"
  n = clamp(ceil(totalSimDt / FIXED_DT), 1, MAX_SUBSTEPS)
  for k in 0..n:  bodiesRef = integratorStep(bodiesRef, FIXED_DT)
```
→ `FIXED_DT` 고정이라 *시각 속도와 무관하게 같은 정확도*. 시각 속도는 *프레임당 몇 번 적분하느냐* 로만 작용. `MAX_SUBSTEPS` 캡이 폭증 방지.

---

## 3. 데이터 모델

### `lib/physics` 타입

```ts
// 한 천체
interface Body {
  id: string
  mass: number          // 정규화/프리셋 단위
  position: Vector3
  velocity: Vector3
  color: string
  radius: number        // 시각 반지름 (물리 점질량)
  label: string
}

// 적분기가 다루는 상태 (위치/속도/질량 평행 배열 또는 Body[])
type SystemState = Body[]   // in-place 갱신 (ref)

// 적분기 시그니처 (순수)
type Integrator = (state: SystemState, dt: number, G: number, eps: number) => void  // in-place
```

### `data/presets.ts`

```ts
interface Preset {
  id: 'two-body' | 'three-body' | 'binary' | 'solar-system'
  name: string            // "우리 태양계 (N-body)"
  description: string     // 천문학 한 줄 (호버/패널)
  G: number               // 프리셋 단위계의 중력 상수
  recommendedDt: number   // FIXED_DT 기본값
  softening: number       // ε
  bodies: Body[]          // 초기조건
}
```

- **two-body**: 태양-지구 타원. 해석해 보존량 검증의 기준 (sub-3-2). `G=1` 정규화로 깔끔.
- **three-body**: figure-8 (Chenciner–Montgomery *published 초기조건* 그대로 — 민감하니 테스트로 고정) + 섭동 슬라이더로 카오스 체험.
- **binary**: 쌍성계 (질량비 다른 두 별).
- **solar-system**: `data/planets.ts` 의 real 거리/주기 + **mass 필드 확장** 재사용. 초기 속도는 *원궤도 근사* (`v = √(G·M☉/r)`) — Phase 2 원궤도 가정의 연장.

> **`data/planets.ts` 확장**: Phase 2는 mass가 불필요했음. Phase 3는 `mass` (real, kg 또는 M☉) 필드 추가 — *단일 소스 성장*. Phase 2 컴포넌트는 mass를 안 읽으므로 영향 0.

### `store/gravityStore.ts` (제어 상태만)

```ts
interface GravityStore {
  presetId: Preset['id']
  integrator: 'euler' | 'rk4'
  timeSpeed: number          // 0(정지) / 0.1 / 1 / 100 / 10000
  paused: boolean
  perturbation: number       // 3체 섭동량 (초기조건 미세 변위)
  presetLoadedAt: number     // 프리셋/섭동 변경 → ref 재초기화 트리거
  // setters...
}
```

---

## 4. 폴더 구조

```
frontend/src/
├── pages/
│   └── GravityPage.tsx                ← /gravity 진입점 (현재 stub → 채움)
├── components/
│   └── gravity/
│       ├── Scene.tsx                  ← Canvas 루트 (Phase 2 Scene 패턴 재사용)
│       ├── Integrator.tsx             ← useFrame substep 적분 루프 (화면 없음)
│       ├── Bodies.tsx                 ← bodiesRef → mesh 위치 매 프레임
│       ├── Trails.tsx                 ← ring-buffer 궤적 라인
│       ├── EnergyReadout.tsx          ← 총 에너지/각운동량 표시 (Canvas 밖)
│       └── ControlPanel.tsx           ← 프리셋/적분기/시간/섭동 (ControlButtons 재사용)
├── data/
│   ├── presets.ts                     ← N-body 초기조건 단일 소스 (신규)
│   └── planets.ts                     ← mass 필드 확장 (태양계 프리셋 재사용)
├── store/
│   └── gravityStore.ts                ← 제어 상태 Zustand (물리 상태는 ref)
├── lib/
│   └── physics/                       ← ★ 순수 함수 + TDD (이 Phase의 심장)
│       ├── gravity.ts                 ← 가속도 (softening) + 테스트
│       ├── integrators.ts             ← rk4Step / eulerStep + 테스트
│       └── energy.ts                  ← totalEnergy / angularMomentum + 테스트
└── (재사용) hooks/useIsTouchDevice, components/ui/{Spinner,ControlButtons},
             components/layout/AppLayout, CameraController 패턴
```

---

## 5. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프
- **RK4 선택 (Euler 데모 보존)**: 정확도/난이도 균형 + *영혼 데모*. 둘 다 순수 함수라 비용 0.
- **O(N²) 직접합**: N이 작아 가볍고 정확. tree code(Barnes-Hut)는 YAGNI.
- **softening ε**: 근접 발산만 막는 표준 기법. 충돌 머지는 미구현 (점질량).
- **물리 상태 = ref, store = 제어만**: Phase 2 *무리렌더* 패러다임의 N-body판. setState 0.
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
| ref 기반 물리 상태와 React 렌더 동기화 헷갈림 | 중간 (Phase 2 무리렌더 학습 있음) | mesh 위치는 *useFrame에서 ref 직접 write*. store는 제어만. 프리셋 변경만 재초기화 트리거 |
| 정규화 단위 ↔ 표시 단위 혼선 | 낮음 | 프리셋이 단위 소유. 2체는 `G=1`. *"이 숫자 어디서 왔나" = 프리셋 한 곳* |
| tsc 통과 ≠ 물리 정확 | 중간 | *물리 정본은 vitest 수치 테스트* (tsc는 타입만). push 전 `npm run build` + `npm run test:run` |
| trails 매 프레임 점 누적 → 메모리/ GC | 낮음 | ring-buffer 고정 길이. 무한 push 금지 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **3-1**: N-body 데이터 모델 + 중력 가속도(softening) + **RK4 적분기** — `lib/physics` 순수 함수, *TDD, 화면 없음*. 테스트로 굴린다. ⬜
- **3-2**: **2체 해석해 검증** (에너지·각운동량 보존 + 케플러 `T²∝a³`) + Euler 적분기(대비용) 구현. *이 Phase의 안전망*. ⬜
- **3-3**: N-body 씬 + **궤적(trails)** — Scene 재사용, `bodiesRef` 무리렌더, mesh 직접 write. *첫 시각화* (2체 타원이 그려지는 순간). ⬜
- **3-4**: **프리셋** (2체 / 3체 figure-8 / 쌍성 / 태양계) + 프리셋 셀렉터 + `planets.ts` mass 확장. ⬜
- **3-5**: **적분기 토글 [Euler|RK4] + 에너지 readout + 카오스 섭동** — *Phase의 영혼*. PRD §3 *그 한 순간*. ⬜
- **3-6**: 시간 컨트롤 통합(타임스텝↔시각속도 substep 분리) + 모바일/성능/Lighthouse + Phase 종료. ⬜

총 6 sub-phase ≈ 4~5주 (README 로드맵 추정). **3-1 / 3-2 가 심장** (순수 물리 + 검증), **3-5 가 영혼** (Euler vs RK4).

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
*"이번 Phase의 정본은 화면이 아니라 테스트다 — 보존량이 우주의 정상성을 증명한다."*
