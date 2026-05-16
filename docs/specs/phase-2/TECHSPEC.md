# Phase 2 TechSpec — Solar System

> *작성일: 2026-05-10*
> *상태: Confirmed*
> *PRD: ./PRD.md*

> **2026-05-10 갱신 (1차)**: §1 의존성 버전을 *실제 설치본* 으로 정정. Phase 2 sub-phase 2-1 [Light 1] 의존성 설치 시 React 19 환경에 맞춰 R3F v9 / drei v10 으로 페어링. R3F 공식 매트릭스: v8→React 18, v9→React 19.
>
> **2026-05-10 갱신 (2차)**: §4 폴더 구조의 페이지 파일명을 `SolarSystemPage.tsx` → `SolarPage.tsx` 로 정정. 실제 레포의 기존 페이지 명명 패턴 (PhaseN 이 아닌 도메인 이름 단축형) 을 따름. sub-phase 2-1 [Light 6] 라우트 연결 시 발견.
>
> **2026-05-12 갱신 (3차)**: §1 + §3 의 *데이터 모델 결정* 을 뒤집음. sub-phase 2-2 [Light 5] leva 손튜닝 중 발견 — 8개 행성에 직접 `visualRadius`/`visualDistance` 박는 방식이 *손튜닝 부담 + 근거 부재*. 비례 압축 함수 `(real / earthReal) ^ k × scale` 도입 (`lib/scale.ts`) 으로 한 함수가 전 천체 자동 계산. 이전 결정 *"단위 혼란 제거"* 의 근거는 함수 내부 단위 변환 단일화로 더 강화. sub-phase 2-4 의 거리 토글이 *exponent k 의 0.5 → 1.0 부드러운 보간* 으로 정리되어 토글 메시지도 수학적으로 우아해짐.
>
> **2026-05-12 갱신 (4차)**: §3 의 ring 필드를 *판별 합집합* 으로 확장 — `type: 'texture'` (토성) 와 `type: 'solid'` (천왕성) 두 종류 지원. 천왕성 고리 추가 결정 (1977년 별 가림 관측으로 발견, 어두운 13개 좁은 띠). 자전축 97.77° 와 결합되어 *옆으로 누운 고리* 시각화 — sub-2-1 의 axial tilt 사연이 시각적 정점. §4 폴더 구조에 `Ring.tsx` 추가. PlanetData 타입 정의에서 미사용 `color` 필드 제거, `axialTilt_deg` 추가 ([Light 2] 의 데이터 확장 + [Light 7] 의 컴포넌트 연동 결과 정식 반영). `MoonData` 의 시각 필드 갱신은 sub-phase 2-6 에 위임.
>
> **2026-05-13 갱신 (5차)**: sub-2-3 [Light 3] 사용자 피드백 → PRD §3-§5 갱신과 동기. *거리 모드 전환* 을 *진실 토글 (거리 + 자전)* 로 확장. 핵심 변경:
>
> 1. **§1**: *거리 모드 전환* 행을 *진실 모드 전환 (거리/자전)* 으로 재명명. 두 토글 + 프리셋 트레이드오프 추가.
> 2. **§1**: *axial-flip 보정 함수* (`getEffectiveRotationPeriod`) 행 추가 — sub-2-3 [Light 3] 발견. 금성 axialTilt 177.4° + 천왕성 97.77° 의 좌표계 뒤집힘으로 인한 *시각적 부호 캔슬* 보정.
> 3. **§3**: lib/time.ts 에 `getVisualRotationPeriod` 추가 예정 (sub-2-4). 자전 *시각 모드* 매핑 = `sign(period) × (|period|/24) ^ k × 24` — `lib/scale.ts` 의 distanceExponent 와 *수학적으로 같은 압축*.
> 4. **§3**: store 에 `rotationMode: 'visual' | 'real'` + `scaleMode: 'visual' | 'real'` 두 필드 추가 예정. 보간 중 transition state 도 store 가 보유.
> 5. **§7**: sub-2-4 한 줄을 *진실 토글 (거리 + 자전) + 프리셋 + 1.5초 보간* 로 갱신. sub-2-3 은 진실 모드 only 의 ControlPanel (시간 컨트롤) 까지만.
> 6. **§4**: `lib/time.ts` 에 visual rotation 함수 추가 예고만. 새 파일 없음.
>
> *결정 근거*: 사용자가 *수성/금성 멈춤, 목성 광속, 공전 불규칙* 으로 보고함. 모두 *천문학적 진실* — NASA 데이터 + 케플러 제3법칙의 시각적 결과. PRD §3 의 *"기억에 남길 한 순간"* 정신을 *거리 차원만* 이 아닌 *자전 차원* 까지 확장하기로 결정. 두 차원 모두 *교육적 거짓말 ↔ 진실* 의 토글 가능. *전체 진실 프리셋* 으로 동시 변환의 임팩트 추가.
>
> **2026-05-14 갱신 (6차)**: sub-2-3 [Light 8] starfield 를 sub-2-6 에서 당겨옴 (drei <Stars> 한 줄). [Light 8.5] 속도 매핑: 100,000× 제거 (인간 눈 가독성) + 0.1× 추가 (느린 자전 관찰). §7 sub-2-3 / sub-2-6 갱신. PRD §4 시간 컨트롤 항목 동기.
>
> **2026-05-16 갱신 (7차)**: sub-2-4 구현 + 시각 검증 사용자 피드백 반영. 6차까지 *예고만* 된 진실 토글의 *실제 구현 결과* 정식 반영. 핵심 변경:
>
> 1. **§1**: 자전 시각 매핑의 exponent `0.5 → 0.3` 으로 갱신 (sub-2-4 [Fix] — 사용자 피드백 *자전 차이 약함*. visual ↔ real 차이가 *수성 17배* 로 확대).
> 2. **§1**: 거리 토글 행을 *exponent + scale 둘 다 보간* 으로 갱신. 이전엔 exponent 만. real 의 `distanceScale=80` 추가 (수성이 태양 안 박힘 회피).
> 3. **§3**: store 인터페이스에서 `scaleTransitionProgress` / `rotationTransitionProgress` 필드 **제거**. 대신 `scaleModeChangedAt` / `rotationModeChangedAt` 두 timestamp. progress 는 매 프레임 useFrame 안 derived — *매 프레임 setState 0* 보장 (sub-2-3 의 *리렌더 0* 패러다임 유지).
> 4. **§3**: `getVisualRotationPeriod(period, mode)` 시그니처에서 `mode` 매개변수 **제거**. 함수가 *visual 값* 한 가지만 책임, 보간은 `getInterpolatedRotationPeriod` 별도 함수. `getInterpolatedScaleConfig` 도 추가 (distanceScale 까지 보간).
> 5. **§3**: 자전 시각 변환 표 새 수치로 (exp=0.3): 수성 81h / 금성 -125h / 지구 24h / 목성 18h.
> 6. **§3**: `reset` 액션의 책임 **통합** — 시간 + 진실 모드 둘 다. R 버튼 / ↺ 클릭 / ControlPanel mount 시 useEffect 모두 동일 액션. (초기 시도: `resetAll` 별도 액션 분리 → 사용자 의도 어긋남 → 통합. YAGNI.)
> 7. **§3 신규**: *보간 시스템* 하위 섹션 — `lib/easing.ts`, useFrame 안 매 프레임 흐름, Ring 의 자체 store 구독 패턴, OrbitPath 의 mesh.scale 트릭.
> 8. **§5**: *세 차원 중 크기는 시각 모드 유지* 트레이드오프 명시 (PRD §3 동기). reset 통합으로 *시간만 리셋* 불가 명시.
> 9. **§7**: sub-2-4 *진실 토글 + 1.5초 보간 + reset 통합* 완료.

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 선택 이유 |
|------|------|-------------------|----------|
| 3D 엔진 | **Three.js 0.170+** | Babylon.js, PlayCanvas | 사실상 웹 3D의 표준, 자료/예제 압도적 |
| React 통합 | **@react-three/fiber 9.6+** | Three.js 직접, R3F v8 (React 18용) | R3F가 React 생태계의 표준, scene graph가 컴포넌트 트리, 자동 cleanup. v9 = React 19 페어 |
| R3F 헬퍼 | **@react-three/drei 10.7+** | drei v9 (R3F v8용), 직접 구현 | OrbitControls / Stars / Html / Line 등 90% 케이스 커버. v10 = R3F v9 페어 |
| 카메라 컨트롤 | drei `OrbitControls` | drei `CameraControls`, 커스텀 | 회전/줌/팬/터치 자동, Phase 2 범위에 정확히 맞음 |
| 텍스처 출처 | Solar Textures 2K (CC-BY) | NASA Treks, 절차적 | 라이선스 명확, 용량 적정, 식별 가능한 디테일 |
| 진실 모드 전환 (거리/자전) | 별도 두 토글 + 프리셋, 1.5초 보간 (easeInOutCubic) | 통합 한 토글, 즉시 점프 | UX 표준, *두 깨달음의 1초* 가 각각 보이게. 프리셋은 두 보간을 동기화 |
| 거리 시각 매핑 | `exp` 와 `scale` 둘 다 보간 (visual: 0.5/20 ↔ real: 1.0/80) | exp 만 보간 (sub-2-4 [Light 3]) | 수성이 태양 *안* 으로 박히는 문제 회피. real scale=80 으로 수성도 태양 밖, 해왕성은 화면 밖 (*길을 잃는다* 영혼) |
| 자전 시각 매핑 | cube-root 압축 (`sign × (\|period\|/24)^0.3 × 24`) | sqrt 압축 (^0.5, sub-2-4 [Light 2]), 균일화 (모두 24h), 로그 | sqrt 는 *체감 차이 약함*. cube root 는 *수성 17배 차이* — visual ↔ real 토글 임팩트. 24h 기준점 보존, 부호 보존 |
| axial-flip 보정 | `getEffectiveRotationPeriod` 함수 | 데이터의 axialTilt 정규화, 컴포넌트 안 분기 | NASA 원본 데이터 보존 + 함수 안 *왜 보정하는지* 의 천문학적 설명 보존 |
| 보간 상태 모델 | store: `mode + changedAt` 만. progress: useFrame 안 derived | store: `transitionProgress` 직접 보유 (sub-2-4 5차 예고) | 매 프레임 setState 0 → 리렌더 0. sub-2-3 *증분→절대* 패러다임의 자연 확장 |
| 상태 관리 | Zustand 4.x | React Context, props drilling | Canvas 안/밖을 잇는 공유 메모리, `useFrame` 안 리렌더 회피 |
| 데이터 모델 | `data/planets.ts` 는 real 값만 보관, `lib/scale.ts` + `lib/time.ts` 의 변환 함수가 visual 계산 | real + visual 두 값 보관 (sub-2-2 [Light 6] 까지 사용 후 기각) | 변환 함수가 단일 소스. 손튜닝 추측치 제거, *"이 숫자 어디서 왔나"* = 함수 한 줄로 답변 |
| 개발 디버그 GUI | leva 0.9+ (개발 시에만) | 없음 | sub-phase 2-2/2-3/2-4에서 행성 위치/스케일/속도 손으로 튜닝 |

### 호환성 매트릭스 (참고)

| 우리 스택 | 버전 | 페어 |
|---|---|---|
| React | 19.2.5 | — |
| @react-three/fiber | 9.6.1 | React 19 짝꿍 |
| @react-three/drei | 10.7.7 | R3F v9 짝꿍 |
| three | 0.170.x | R3F v9 권장 범위 |
| zustand | 4.5+ | 시간/모드 store |
| vitest | 2.1+ | lib/time, lib/scale, lib/easing 등 순수 함수 TDD |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────┐
│  Page: SolarPage (/solar)                        │
│  ┌────────────────────────────────────────────┐  │
│  │  R3F <Canvas>                              │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ <Scene>                              │  │  │
│  │  │   <TimeAdvancer />                   │  │  │
│  │  │   <Sun />                            │  │  │
│  │  │   <OrbitPath /> × 8                  │  │  │
│  │  │   <Planet />  × 8                    │  │  │
│  │  │     ├─ <Ring />  (토성/천왕성)       │  │  │
│  │  │     └─ <Moon /> (지구만, sub-2-6)    │  │  │
│  │  │   <Stars />  (drei 배경)             │  │  │
│  │  │   <CameraController />               │  │  │
│  │  │   <OrbitControls />                  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  ControlPanel (Canvas 밖, 하단 고정)       │  │
│  │  [⏸] [0.1× 1× 100× 10,000×]                │  │
│  │  [거리] [자전] [전체 진실]                 │  │
│  │  [↺ 통합 리셋] [카메라 리셋]               │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                       ↕
              ┌──────────────────────┐
              │  Zustand Store       │
              │  - simulationDays    │
              │  - timeSpeed         │
              │  - scaleMode         │  ← sub-2-4
              │  - scaleModeChangedAt│  ← sub-2-4 (7차: progress 대신)
              │  - rotationMode      │
              │  - rotationModeChangedAt│
              │  - selectedPlanet    │
              │  - cameraTarget      │
              └──────────────────────┘
                       ↕
              ┌──────────────────┐
              │  data/planets.ts │
              │  data/sun.ts     │
              │  (불변 real 데이터)│
              └──────────────────┘
```

**흐름**:
- `data/planets.ts` + `data/sun.ts`: 행성/태양 메타데이터 (반지름, 거리, 공전 주기, 자전 주기, 자전축, 텍스처, 고리)
- `lib/scale.ts`: 공간 차원 (거리/반지름) 의 real → visual 단일 진실 + 보간된 ScaleConfig 도출
- `lib/time.ts`: 시간 차원 (자전/공전 각도) 의 real → visual 단일 진실 + 보간된 period 도출
- `lib/easing.ts`: easeInOutCubic + lerp + computeTransitionProgress (sub-2-4)
- `Zustand store`: 사용자 인터랙션 결과 (현재 모드들 + changedAt, 시간 속도, 선택된 행성, simulationDays)
- `<Planet>` / `<Ring>` / `<Sun>` / `<OrbitPath>`: 매 프레임 `useFrame` 안에서 store + data 읽어 progress 계산 → 보간 → 위치/회전 갱신
- `ControlPanel`: store 의 setter 호출 + mount 시 reset 자동 호출
- `CameraController`: 선택된 행성 변하면 카메라 보간 시작 (sub-2-5)

---

## 3. 데이터 모델

### `data/planets.ts`

```typescript
export type PlanetId =
  | 'mercury' | 'venus' | 'earth' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune'

/**
 * 고리 데이터 — 판별 합집합 (discriminated union).
 *   - texture: 토성처럼 풍부한 줄무늬 (PNG with alpha)
 *   - solid:   천왕성처럼 단조로운 가는 띠 (단색 + 투명도)
 */
export type RingData =
  | {
      type: 'texture'
      texture: string
      innerRadius_km: number
      outerRadius_km: number
    }
  | {
      type: 'solid'
      color: string         // CSS color (예: '#9aa0a8')
      opacity: number       // 0~1
      innerRadius_km: number
      outerRadius_km: number
    }

export type PlanetData = {
  id: PlanetId
  name: { ko: string; en: string }

  // 실제 값 (NASA 단위 그대로)
  realRadius_km: number
  realDistance_km: number       // 평균 궤도 반경 (태양 중심)
  orbitalPeriod_days: number    // 공전 주기
  rotationPeriod_hours: number  // 자전 주기 (음수 = 역회전)
  axialTilt_deg: number         // 자전축 기울기 (지구 23.5°, 천왕성 97.77°)

  // 시각화 자산
  texture: string               // public/textures/planets/{id}.jpg
  description: string           // 정보 패널용 (sub-phase 2-5)

  // 고리 (토성/천왕성)
  ring?: RingData

  // 위성 (지구만 보유, sub-phase 2-6 에서 시각 필드 갱신 예정)
  moon?: MoonData
}

export type MoonData = {
  realRadius_km: number
  realDistance_km: number       // 모행성 중심부터의 거리
  orbitalPeriod_days: number
  texture: string
  // 시각 필드 (visualRadius/visualDistance) 는 sub-phase 2-6 에서 결정.
}
```

### Store 인터페이스 (sub-2-4 완료 시점)

```typescript
type ScaleMode = 'visual' | 'real'         // 거리 토글 — sub-2-4
type RotationMode = 'visual' | 'real'      // 자전 토글 — sub-2-4

interface SolarSystemStore {
  // 시간 (sub-2-3)
  simulationDays: number
  timeSpeed: number
  prevSpeed: SpeedOption

  // 진실 토글 (sub-2-4)
  scaleMode: ScaleMode
  scaleModeChangedAt: number           // performance.now(), 초기값 -Infinity (이미 도달 상태)
  rotationMode: RotationMode
  rotationModeChangedAt: number

  // 선택 (sub-2-5 예약)
  selectedPlanet: PlanetId | null

  // 액션
  setTimeSpeed: (speed: SpeedOption) => void
  togglePause: () => void
  reset: () => void                    // *모든 것* 처음으로 (시간 + 진실 모드)
  advanceTime: (deltaSeconds: number) => void
  toggleScaleMode: () => void
  toggleRotationMode: () => void
  toggleAllTruth: () => void           // 둘 다 real, 또는 둘 다 visual (탈출 경로)
}
```

**핵심 패러다임 (7차 갱신)**:

sub-2-3 의 *증분 → 절대 시간* (`simulationDays` 단일 진실 + 위치 derive) 이
sub-2-4 의 *모드 변경 시각* (`changedAt` 단일 진실 + progress derive) 으로 확장.

```
sub-2-3: position = derived(simulationDays, period, distance)
sub-2-4: progress = derived(performance.now(), changedAt, durationMs)
```

*상태는 가장 적게, 계산은 매 프레임.* 둘 다 *변경 사실* 만 store 에 두고, *연속 변환값* 은 매 프레임 함수로. 부수효과:
- 매 프레임 setState 0 → 리렌더 0 (sub-2-3 보장 유지)
- 중복 토글 자동 방어 (changedAt 새로 세팅 → 새 시점에서 재시작)
- 정지/리셋이 보간 중에도 자연 작동
- 프리셋의 *동시성* 확보 (두 changedAt 동일 timestamp)

### reset 의 통합 책임 (7차 갱신)

```typescript
reset: () => {
  set({
    simulationDays: 0,
    timeSpeed: DEFAULT_SPEED,
    prevSpeed: DEFAULT_SPEED,
    scaleMode: 'visual',
    scaleModeChangedAt: -Infinity,
    rotationMode: 'visual',
    rotationModeChangedAt: -Infinity,
  })
}
```

호출 위치 (셋 다 동일 효과):
- 사용자 [↺] 버튼 클릭
- R 키 입력 (ControlPanel keydown 핸들러)
- ControlPanel mount 시 useEffect (F5 / HMR 후 깨끗한 시작점)

**책임 통합 결정**:
- 초기 시도: `reset` (시간만) + `resetAll` (모든 것) 두 액션 분리
- 사용자 피드백: R 버튼 눌렀는데 진실 안 풀림 → 의도 어긋남
- 통합: 한 액션이 모든 시작점 책임. *YAGNI* — 미래 *시간만 리셋* 필요해지면 그때 별도 액션 추가
- 원칙: *한 사용자 의도 = 한 액션*

### 단위 선택

| 종류 | 단위 | 이유 |
|------|------|------|
| 거리 (실제) | km | NASA 데이터 단위 그대로 — 변환 실수 0 |
| 거리 (시각) | scene unit | `lib/scale.ts` 의 함수가 km → scene unit 변환 |
| 공전 | days | 직관적 (수성 88일, 해왕성 60182일) |
| 자전 (실제) | hours | 직관적 (지구 24h, 금성 5832h 역회전) |
| 자전 (시각) | hours | `lib/time.ts` 의 `getVisualRotationPeriod` 가 변환 |
| 자전축 | degrees | 천문학 관습 (지구 23.5°, 천왕성 97.77°) |
| changedAt | ms | `performance.now()` 단위, 초기값 -Infinity |

### 스케일 변환

`lib/scale.ts` 가 공간의 단일 진실:

```typescript
visualRadius   = (realRadius_km / EARTH_RADIUS_KM) ^ radiusExponent   × radiusScale
visualDistance = (realDistance_km / ONE_AU_KM)     ^ distanceExponent × distanceScale
```

거리 토글 (sub-2-4) 은 *`distanceExponent` + `distanceScale` 둘 다 보간*:

| 모드 | radiusExponent | radiusScale | distanceExponent | distanceScale | 의미 |
|------|----------------|-------------|------------------|---------------|------|
| 시각 | 0.5 | 1.0 | 0.5 | 20 | 제곱근 압축. 한 화면 모임 |
| 실제 | 0.5 (불변) | 1.0 (불변) | 1.0 | 80 | 비례 그대로 + 광활. *지구가 점이 되는 1초* |

**radius 는 시각 모드 유지** — PRD §4 범위에 *radius 토글 없음*. 행성을 *볼 수 있게* 유지하는 것이 거리/시간 진실의 전제. 세 차원 중 *크기는 거짓 유지*.

| 행성 | AU | visual 거리 | real 거리 | 비율 |
|---|---:|---:|---:|---:|
| 수성 | 0.387 | 12.44 | 30.96 | 2.5× |
| 금성 | 0.723 | 17.00 | 57.84 | 3.4× |
| 지구 | 1.000 | 20.00 | 80.00 | 4.0× |
| 화성 | 1.524 | 24.69 | 121.9 | 4.9× |
| 목성 | 5.203 | 45.62 | 416.2 | 9.1× |
| 토성 | 9.539 | 61.77 | 763.1 | 12.3× |
| 천왕성 | 19.18 | 87.59 | 1534 | 17.5× |
| 해왕성 | 30.05 | 109.6 | 2404 | 22× |

**핵심 보장** (PRD §5 정량 기준):
- 수성 real 거리 30.96 > 태양 반지름 visual 10.45 → 박힘 회피 ✓
- 해왕성 real 22× 멀어짐 → *길을 잃는다* 영혼 실체화 ✓

보간 함수:
```typescript
export function getInterpolatedScaleConfig(
  baseConfig: ScaleConfig,
  mode: ScaleMode,             // 도달 목표 모드
  progress: number,            // eased 0~1
): ScaleConfig
```

### 시간/자전 변환

`lib/time.ts` 가 시간의 단일 진실:

```typescript
computeOrbitAngle    (simulationDays, periodDays, initialAngle)
computeRotationAngle (simulationDays, periodHours)
getEffectiveRotationPeriod  (periodHours, axialTiltDeg)   // axial-flip 보정
getVisualRotationPeriod     (realPeriodHours)             // visual 값 1개만
getInterpolatedRotationPeriod (realPeriod, mode, progress) // visual ↔ real lerp
```

**시그니처 변경 (7차)**: `getVisualRotationPeriod(period, mode)` → `(period)`. 함수는 *visual 값* 한 가지만 책임. 보간은 별도 함수.

**압축 공식**:
```typescript
const VISUAL_COMPRESSION_EXPONENT = 0.3   // 7차 갱신: 0.5 → 0.3

visualPeriod = sign(real) × (|real| / 24) ^ 0.3 × 24
```

24h (지구) 가 *불변 기준점*. 24h 보다 큰 주기 (느린 자전) 는 압축, 작은 주기 (빠른 자전) 는 팽창.

| 행성 | real (h) | visual (h, exp=0.3) | 비율 (real/visual) |
|------|--------------|---------------------|--------------------|
| 수성 | 1407.6 | +81.4 | 17.3× 차이 |
| 금성 | -5832.5 | -124.7 | 46.8× 차이 (역회전) |
| 지구 | 23.93 | +23.98 | ≈1× (기준점) |
| 화성 | 24.62 | +24.18 | ≈1× |
| 목성 | 9.93 | +18.4 | 1.85× 차이 |
| 토성 | 10.66 | +18.8 | 1.76× 차이 |
| 천왕성 | -17.24 | -21.7 | 1.26× 차이 (역회전) |
| 해왕성 | 16.11 | +21.3 | 1.32× 차이 |
| 태양 | 609.12 | +63.3 | 9.6× 차이 |

**합성 순서** (Planet/Ring/Sun 의 useFrame):

```
realPeriod (NASA 원본)
  → getInterpolatedRotationPeriod(real, mode, eased)    // visual ↔ real lerp
  → getEffectiveRotationPeriod(period, axialTilt)       // axial-flip 보정 (Sun 생략)
  → computeRotationAngle(simulationDays, effective)     // 라디안
```

*보간 → 보정* 순서. 의미:
- 보간 = 데이터 본질의 변환
- 보정 = 좌표계 부산물

수학적으론 어느 순서든 같지만 *책임 분리* 측면에서 이 순서.

### 보간 시스템 (`lib/easing.ts`)

```typescript
easeInOutCubic(t: number): number              // S-curve, 양 끝 도함수 0
lerp(from, to, t: number): number              // 선형 보간
computeTransitionProgress(now, changedAt, durationMs): number  // 0~1 clamped
```

**보간 총 시간**: `TRANSITION_DURATION_MS = 1500` (1.5초). PRD §5 ± 50ms 기준.

**매 프레임 흐름 (Planet/Ring/Sun/OrbitPath 공통)**:

```typescript
useFrame(() => {
  const store = useSolarSystemStore.getState()   // 매 프레임 getState (구독 X)
  const now = performance.now()

  // 거리 보간 (Planet, OrbitPath)
  const scaleProgress = easeInOutCubic(
    computeTransitionProgress(now, store.scaleModeChangedAt, TRANSITION_DURATION_MS)
  )
  const config = getInterpolatedScaleConfig(baseScale, store.scaleMode, scaleProgress)
  // → computeVisualDistance(data.realDistance_km, config)

  // 자전 보간 (Planet, Ring, Sun)
  const rotationProgress = easeInOutCubic(
    computeTransitionProgress(now, store.rotationModeChangedAt, TRANSITION_DURATION_MS)
  )
  const period = getInterpolatedRotationPeriod(realPeriod, store.rotationMode, rotationProgress)
  // → getEffectiveRotationPeriod (Sun 제외) → computeRotationAngle
})
```

**Ring 의 동적 prop 처리 (sub-2-4)**:

Ring 시그니처 변경:
```typescript
// Before (sub-2-3)
{ data: RingData, scale: ScaleConfig, parentRotationPeriodHours: number }

// After (sub-2-4)
{ data: RingData, scale: ScaleConfig, parent: { rotationPeriod_hours, axialTilt_deg } }
```

이유: Planet 의 `effectiveRotationPeriod` 가 *매 프레임 동적*. prop 으로 전달하면 Ring 매 프레임 re-render. → Ring 이 *정적 parent 데이터* 만 받고 *자체로 store 구독*. Planet 과 *완전히 동일한 보간 흐름*, 매 프레임 prop 변경 0.

`useRingRotation` 커스텀 hook 으로 RingTextured/RingSolid 중복 제거:
```typescript
function useRingRotation(
  meshRef: RefObject<THREE.Mesh | null>,    // React 19: null 포함 명시
  parent: ParentRotation,
): void
```

**OrbitPath 의 mesh.scale 트릭 (sub-2-4)**:

거리 토글 시 *행성과 궤도 라인이 함께* 멀어져야 시각 일관. 단순한 useMemo 재계산 (128 Vector3 매 프레임) 은 부담. → **단위 원 (반지름 1)** 을 한 번 생성, `<group>` 으로 감싸고 `group.scale.setScalar(distance)` 매 프레임 갱신. GPU transform 만 변경, geometry 재계산 0.

---

## 4. 폴더 구조

```
frontend/src/
├── pages/
│   └── SolarPage.tsx                  ← Phase 2 진입점 (/solar 라우트)
├── components/
│   └── solar/
│       ├── Scene.tsx                  ← R3F Canvas 루트 + leva 패널
│       ├── TimeAdvancer.tsx           ← 매 프레임 simulationDays 누적 (sub-2-3)
│       ├── Sun.tsx                    ← 태양
│       ├── Planet.tsx                 ← 행성 공통 컴포넌트
│       ├── Ring.tsx                   ← 토성/천왕성 고리 (sub-2-4: parent 객체 + 자체 구독)
│       ├── OrbitPath.tsx              ← 공전 궤도 라인 (sub-2-3, 2-4 mesh.scale 트릭)
│       ├── Moon.tsx                   ← 지구 위성 (sub-phase 2-6)
│       ├── Starfield.tsx              ← drei <Stars> wrapper (sub-2-3 [Light 8])
│       ├── CameraController.tsx       ← 행성 클릭 시 카메라 보간 (sub-phase 2-5)
│       └── ControlPanel.tsx           ← Canvas 밖, 하단 고정 UI (sub-2-3 / 2-4 진실 토글)
├── data/
│   ├── planets.ts                     ← real 값 단일 소스
│   └── sun.ts                         ← 태양 별도
├── store/
│   └── solarSystemStore.ts            ← Zustand (sub-2-3 도입, 2-4 모드 + reset 통합)
├── lib/
│   ├── scale.ts                       ← 공간 변환 + 보간 (real ↔ visual 거리/반지름)
│   ├── time.ts                        ← 시간 변환 + 보간 (공전/자전, axial-flip, visual rotation)
│   └── easing.ts                      ← easeInOutCubic, lerp, computeTransitionProgress (sub-2-4)
└── public/
    └── textures/
        └── planets/                   ← Solar Textures 2K (CC-BY)
            ├── sun.jpg
            ├── mercury.jpg
            ├── ...
            ├── saturn_ring.png        ← 알파 채널 PNG
            └── ATTRIBUTION.md
```

---

## 5. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프

- **스케일 vs 가시성**: 시각적 모드는 의도적 거짓말 — *비례 압축* 으로 의식화. 정확한 스케일은 토글로만 제공. *PRD의 핵심 메시지*.
- **자전 속도 vs 가시성**: 시각적 모드의 자전은 *cube-root 압축 (exp=0.3)* 으로 케플러 비례 *완화하되 보존*. NASA 원본은 토글로만 제공. *PRD §3 의 두 번째 깨달음 순간*.
- **세 차원 중 크기는 거짓 유지**: 행성 radius 는 시각 모드 유지 (radiusExponent=0.5). 거리/시간만 토글. 행성을 *볼 수 있게* 유지하는 것이 *거리/시간의 진실 전달* 의 전제. PRD §3 의 의도된 트레이드오프.
- **reset 한 액션의 통합 책임**: *시간만 리셋* 분리 안 함. 한 사용자 의도 (R 버튼) = 한 액션 (모든 것 처음). 미래 두 의도 분리 필요 시 별도 액션 추가. YAGNI.
- **8개로 제한**: 명왕성 / 카이퍼 벨트 / 소행성대 제외. 메시지 흐림 방지.
- **달만 위성**: 다른 행성의 위성 제외. *"우리 위성"* 이라는 의미 보존 + 시각적 노이즈 방지.
- **고정 텍스처 vs 동적**: 행성 표면은 정적 텍스처. 목성 폭풍 애니메이션 / 토성 고리 그림자 등은 미구현.
- **천왕성 고리 단색**: 토성과의 *시각적 차별화* 위해 단색 회색. 사실 천왕성 고리도 매우 어두워 — *현실에 가까운 단조로움*.

### 알려진 한계

- **공전 궤도는 원형으로 가정**: 실제는 타원 (이심률). Phase 3 N-body에서 정확한 케플러 궤도로 갈 예정. Phase 2는 단순 원.
- **공전면 평면**: 모든 행성을 같은 평면에 배치. 실제 궤도 경사 (수성 7°, 명왕성 17°) 무시.
- **태양 광원 단순화**: pointLight 1개 (decay=0, distance=0). 실제처럼 거리 제곱 감쇠 X.
- **달 한 개만**: 지구의 달만 표시. 목성/토성의 위성들 다수는 *시각적 노이즈*.
- **자전축 방향 단순화**: `rotation={[0, 0, AXIAL_TILT_RAD]}` 로 모든 행성이 같은 방향으로 기울어짐. 현실은 행성마다 기울어진 방향도 다름 — *기울기의 크기* 메시지에 집중. 단, 90° 초과 축은 `getEffectiveRotationPeriod` 로 회전 방향 보정.
- **공전 속도는 토글 X**: 케플러 제3법칙은 항상 살아있음 (시간 슬라이더로만 가감속). 자전 토글은 *자전만* 변환. 공전 비례 (수성 88일 vs 해왕성 60182일) 는 PRD 의 *그대로 살려두고 싶은* 차원.
- **태양 axial tilt 보정 없음**: Sun.tsx 는 `getEffectiveRotationPeriod` 합성 생략. 태양의 axial tilt (7.25°) 가 시각화 의미 적음 + SUN 데이터 구조에 필드 의존 회피.
- **HMR 후 상태 유지의 진짜 원인 미확인** (sub-2-4): `reset on mount` 로 우회. sub-2-5 디버그 후보.

이 한계들은 PRD 메시지(*"진짜 우주는 빈 공간이다"*, *"진짜 자전 비례는 17배 차이다"*)와 무관 — Phase 2 범위 외.

---

## 6. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| R3F 학습 곡선이 예상보다 큼 | 중간 | sub-phase 2-1을 *"빈 Canvas + sphere 1개 회전"* 만으로 한정. 작게 시작 |
| 모바일 60fps 미달 | 높음 | 행성 sphere 32 segments → 16으로 감소, 텍스처 2K → 1K, postprocessing X |
| 거리 + 자전 토글 동시 보간 (프리셋) 시 jank | 낮음 (sub-2-4 검증) | 두 changedAt 동일 timestamp + 같은 easing 함수 → 자동 동기. 검증 통과 |
| 토글 보간이 어색함 | 낮음 (sub-2-4 검증) | easeInOutCubic 1.5초 — 표준 곡선. 사용자 피드백 *체감 OK* |
| 텍스처 로딩 시간 길어 첫 페인트 늦음 | 중간 | drei `useTexture` + `<Suspense fallback>` 패턴, 점진적 로딩 |
| Zustand 도입이 처음이라 `useFrame` 안 사용법 헷갈림 | 낮음 (sub-2-3/2-4 정착) | `getState()` 패턴 (구독 X, 리렌더 X) 만 쓰면 됨, 문서 풍부 |
| React 19 의 `useRef` 타입 엄격화로 컴파일 실패 | 낮음 (sub-2-4 학습) | hook 매개변수에 `RefObject<T \| null>` 명시. 컨테이너 환경 tsc 직접 실행으로 사전 검증 |
| Vercel 빌드에 텍스처 포함 시 용량 폭증 | 낮음 | 9개 행성 × 2K JPG + 1개 PNG ≈ 5MB 미만, Vercel 무료 한계 한참 아래 |
| vitest 통과 ≠ tsc 통과 (미사용 변수 등) | 중간 (sub-2-4 학습) | push 전 `npm run build` 필수. 컨테이너 tsc 환경 매 Light 마다 실행 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **2-1**: R3F 셋업 + 빈 Canvas + 첫 sphere 1개 (지구) 자전 ✅
- **2-2**: 8개 행성 + 태양 데이터 모델 + 정적 배치 (시각 모드) + 비례 압축 + 고리 ✅
- **2-3**: 공전 애니메이션 + 시간 컨트롤 (Zustand 도입) + 궤도 라인 + axial-flip 보정 + starfield ✅
- **2-4**: **진실 토글 (거리 + 자전 각각) + 전체 진실 프리셋 + 1.5초 보간 + reset 통합** ✅
- **2-5**: 행성 호버/클릭 + 카메라 줌인 + 정보 패널 + 카메라 리셋 ⬜
- **2-6**: 달 + 컨트롤 패널 UI 마무리 ⬜
- **2-7**: 모바일 최적화 + 성능 측정 + Lighthouse + Phase 종료 ⬜

총 7 sub-phase ≈ 7~10일 (Phase 1 페이스 기준). sub-2-3 / sub-2-4 가 핵심 인터랙션 단위.

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
