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
> 3. **§3**: lib/time.ts 에 `getVisualRotationPeriod(realPeriodHours, mode)` 추가 예정 (sub-2-4 [Light X]). 자전 *시각 모드* 매핑 = `sign(period) × (|period|/24) ^ 0.5 × 24` — `lib/scale.ts` 의 distanceExponent 와 *수학적으로 같은 압축*. 1x 에서 수성 184h, 지구 24h, 목성 15h 로 정규화.
> 4. **§3**: store 에 `rotationMode: 'visual' | 'real'` + `scaleMode: 'visual' | 'real'` 두 필드 추가 예정. 보간 중 transition state 도 store 가 보유.
> 5. **§7**: sub-2-4 한 줄을 *진실 토글 (거리 + 자전) + 프리셋 + 1.5초 보간* 로 갱신. sub-2-3 은 진실 모드 only 의 ControlPanel (시간 컨트롤) 까지만.
> 6. **§4**: `lib/time.ts` 에 visual rotation 함수 추가 예고만. 새 파일 없음.
>
> *결정 근거*: 사용자가 *수성/금성 멈춤, 목성 광속, 공전 불규칙* 으로 보고함. 모두 *천문학적 진실* — NASA 데이터 + 케플러 제3법칙의 시각적 결과. PRD §3 의 *"기억에 남길 한 순간"* 정신을 *거리 차원만* 이 아닌 *자전 차원* 까지 확장하기로 결정. 두 차원 모두 *교육적 거짓말 ↔ 진실* 의 토글 가능. *전체 진실 프리셋* 으로 동시 변환의 임팩트 추가.
>
> **2026-05-14 갱신 (6차)**: sub-2-3 [Light 8] starfield 를 sub-2-6 에서 당겨옴 (drei <Stars> 한 줄). [Light 8.5] 속도 매핑: 100,000× 제거 (인간 눈 가독성) + 0.1× 추가 (느린 자전 관찰). §7 sub-2-3 / sub-2-6 갱신. PRD §4 시간 컨트롤 항목 동기.

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
| 자전 시각 매핑 | 제곱근 압축 (`sign × (\|period\|/24)^0.5 × 24`) | 균일화 (모두 24h), 로그 압축 | distanceExponent 와 *수학적으로 같은 압축*. 케플러 비례 *완화하되 보존*. 1x 에서 수성 184h / 지구 24h / 목성 15h |
| axial-flip 보정 | `getEffectiveRotationPeriod` 함수 | 데이터의 axialTilt 정규화, 컴포넌트 안 분기 | NASA 원본 데이터 보존 + 함수 안 *왜 보정하는지* 의 천문학적 설명 보존 |
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
| vitest | 2.1+ | lib/time, lib/scale 등 순수 함수 TDD |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────┐
│  Page: SolarPage (/solar)                        │
│  ┌────────────────────────────────────────────┐  │
│  │  R3F <Canvas>                              │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ <Scene>                              │  │  │
│  │  │   <TimeAdvancer />                  │  │  │
│  │  │   <Sun />                            │  │  │
│  │  │   <OrbitPath /> × 8                  │  │  │
│  │  │   <Planet />  × 8                    │  │  │
│  │  │     ├─ <Ring />  (토성/천왕성)       │  │  │
│  │  │     └─ <Moon /> (지구만, sub-2-6)    │  │  │
│  │  │   <Stars />  (drei 배경)            │  │  │
│  │  │   <CameraController />              │  │  │
│  │  │   <OrbitControls />                  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  ControlPanel (Canvas 밖, 하단 고정)        │  │
│  │  [자전 토글] [거리 토글] [전체 진실]        │  │
│  │  [시간 컨트롤: 정지 1x 100x 10000x 100000x] │  │
│  │  [정지 ⏸] [리셋 ↺] [카메라 리셋]            │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                       ↕
              ┌──────────────────┐
              │  Zustand Store   │
              │  - simulationDays│
              │  - timeSpeed     │
              │  - scaleMode     │  ← sub-2-4 추가
              │  - rotationMode  │  ← sub-2-4 추가
              │  - selectedPlanet│
              │  - cameraTarget  │
              └──────────────────┘
                       ↕
              ┌──────────────────┐
              │  data/planets.ts │
              │  data/sun.ts     │
              │  (불변 real 데이터)│
              └──────────────────┘
```

**흐름**:
- `data/planets.ts` + `data/sun.ts`: 행성/태양 메타데이터 (반지름, 거리, 공전 주기, 자전 주기, 자전축, 텍스처, 고리)
- `lib/scale.ts`: 공간 차원 (거리/반지름) 의 real → visual 단일 진실
- `lib/time.ts`: 시간 차원 (자전/공전 각도) 의 real → visual 단일 진실
- `Zustand store`: 사용자 인터랙션 결과 (현재 모드들, 시간 속도, 선택된 행성, simulationDays)
- `<Planet>`: 매 프레임 `useFrame` 안에서 store + data 읽어 위치/회전 갱신
- `ControlPanel`: store 의 setter 호출
- `CameraController`: 선택된 행성 변하면 카메라 보간 시작

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
  rotationMode: RotationMode
  scaleTransitionProgress: number      // 0=visual, 1=real, 보간 중엔 그 사이
  rotationTransitionProgress: number

  // 선택 (sub-2-5)
  selectedPlanet: PlanetId | null

  // setters ...
}
```

### 단위 선택

| 종류 | 단위 | 이유 |
|------|------|------|
| 거리 (실제) | km | NASA 데이터 단위 그대로 — 변환 실수 0 |
| 거리 (시각) | scene unit | `lib/scale.ts` 의 함수가 km → scene unit 변환 |
| 공전 | days | 직관적 (수성 88일, 해왕성 60182일) |
| 자전 (실제) | hours | 직관적 (지구 24h, 금성 5832h 역회전) |
| 자전 (시각) | hours | `lib/time.ts` 의 `getVisualRotationPeriod` 가 변환 |
| 자전축 | degrees | 천문학 관습 (지구 23.5°, 천왕성 97.77°) |

### 스케일 변환

`lib/scale.ts` 가 공간의 단일 진실:

```typescript
visualRadius   = (realRadius_km / EARTH_RADIUS_KM) ^ radiusExponent   × radiusScale
visualDistance = (realDistance_km / ONE_AU_KM)     ^ distanceExponent × distanceScale
```

거리 토글 (sub-phase 2-4) 은 `distanceExponent` 를 *0.5 (시각 모드) ↔ 1.0 (실제 모드)* 로 보간 + `distanceScale` 동반 조정.

| 모드 | radiusExponent | distanceExponent | 의미 |
|------|----------------|------------------|------|
| 시각 | 0.5 | 0.5 | 제곱근 압축. 행성 식별 가능 |
| 실제 | 1.0 | 1.0 | 비례 그대로. *지구가 점이 되는 1초* |

### 시간/자전 변환

`lib/time.ts` 가 시간의 단일 진실:

```typescript
computeOrbitAngle    (simulationDays, periodDays, initialAngle)
computeRotationAngle (simulationDays, periodHours)
getEffectiveRotationPeriod (periodHours, axialTiltDeg)    // axial-flip 보정
getVisualRotationPeriod (periodHours, mode)               // sub-2-4 추가
```

자전 토글 (sub-phase 2-4): `mode` 가 *'visual' ↔ 'real'* 보간.

```typescript
// mode = 'visual'
sign(period) × (|period| / 24) ^ 0.5 × 24

// mode = 'real'
period  // NASA 원본 그대로
```

| 행성 | real (hours) | visual (hours) | 1x 에서 한 바퀴 |
|------|--------------|----------------|----------------|
| 수성 | 1407.6 | +184 | 7.7일 |
| 금성 | -5832.5 | -374 | -15.6일 (역회전) |
| 지구 | 23.93 | +24 | 1.0일 |
| 화성 | 24.62 | +24.3 | 1.01일 |
| 목성 | 9.93 | +15.4 | 0.64일 |
| 토성 | 10.66 | +16.0 | 0.67일 |
| 천왕성 | -17.24 | -20.3 | -0.85일 |
| 해왕성 | 16.11 | +19.7 | 0.82일 |

`Ring` 도 같은 함수를 거침. 토성 본체와 고리의 비율은 *Planet 에서 보정된 effectivePeriod* 를 그대로 받음.

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
│       ├── Ring.tsx                   ← 토성/천왕성 고리
│       ├── OrbitPath.tsx              ← 공전 궤도 라인 (sub-2-3 추가)
│       ├── Moon.tsx                   ← 지구 위성 (sub-phase 2-6)
│       ├── Starfield.tsx              ← drei <Stars> wrapper (sub-phase 2-6)
│       ├── CameraController.tsx       ← 행성 클릭 시 카메라 보간 (sub-phase 2-5)
│       └── ControlPanel.tsx           ← Canvas 밖, 하단 고정 UI (sub-phase 2-3 부터)
├── data/
│   ├── planets.ts                     ← real 값 단일 소스
│   └── sun.ts                         ← 태양 별도
├── store/
│   └── solarSystemStore.ts            ← Zustand (sub-phase 2-3 도입, 2-4 확장)
├── lib/
│   ├── scale.ts                       ← 공간 변환 (real ↔ visual 거리/반지름)
│   ├── time.ts                        ← 시간 변환 (공전/자전 각도, axial-flip 보정, visual rotation)
│   └── easing.ts                      ← easeInOutCubic 등 보간 함수 (sub-phase 2-4)
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
- **자전 속도 vs 가시성**: 시각적 모드의 자전은 *제곱근 압축* 으로 케플러 비례 *완화하되 보존*. NASA 원본은 토글로만 제공. *PRD §3 의 두 번째 깨달음 순간*.
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

이 한계들은 PRD 메시지(*"진짜 우주는 빈 공간이다"*, *"진짜 자전 비례는 800배 차이다"*)와 무관 — Phase 2 범위 외.

---

## 6. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| R3F 학습 곡선이 예상보다 큼 | 중간 | sub-phase 2-1을 *"빈 Canvas + sphere 1개 회전"* 만으로 한정. 작게 시작 |
| 모바일 60fps 미달 | 높음 | 행성 sphere 32 segments → 16으로 감소, 텍스처 2K → 1K, postprocessing X |
| 거리 + 자전 토글 동시 보간 (프리셋) 시 jank | 중간 | 두 보간을 *같은 progress 변수* 로 묶어 처리. easing 함수 한 곳에서 계산 |
| 토글 보간이 어색함 | 중간 | sub-phase 2-4에서 PoC 후 easing 함수 튜닝. `leva` 로 실시간 조정 |
| 텍스처 로딩 시간 길어 첫 페인트 늦음 | 중간 | drei `useTexture` + `<Suspense fallback>` 패턴, 점진적 로딩 |
| Zustand 도입이 처음이라 `useFrame` 안 사용법 헷갈림 | 낮음 (sub-2-3 정착됨) | `getState()` 패턴 (구독 X, 리렌더 X) 만 쓰면 됨, 문서 풍부 |
| Vercel 빌드에 텍스처 포함 시 용량 폭증 | 낮음 | 9개 행성 × 2K JPG + 1개 PNG ≈ 5MB 미만, Vercel 무료 한계 한참 아래 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **2-1**: R3F 셋업 + 빈 Canvas + 첫 sphere 1개 (지구) 자전
- **2-2**: 8개 행성 + 태양 데이터 모델 + 정적 배치 (시각 모드) + 비례 압축 + 고리
- **2-3**: 공전 애니메이션 + 시간 컨트롤 (Zustand 도입) + 궤도 라인 + axial-flip 보정 + starfield
- **2-4**: **진실 토글 (거리 + 자전 각각) + 전체 진실 프리셋 + 1.5초 보간**
- **2-5**: 행성 호버/클릭 + 카메라 줌인 + 정보 패널 + 카메라 리셋
- **2-6**: 달 + 컨트롤 패널 UI 마무리
- **2-7**: 모바일 최적화 + 성능 측정 + Lighthouse + Phase 종료

총 7 sub-phase ≈ 7~10일 (Phase 1 페이스 기준). sub-2-3 / sub-2-4 가 핵심 인터랙션 단위.

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
