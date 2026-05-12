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

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 선택 이유 |
|------|------|-------------------|----------|
| 3D 엔진 | **Three.js 0.170+** | Babylon.js, PlayCanvas | 사실상 웹 3D의 표준, 자료/예제 압도적 |
| React 통합 | **@react-three/fiber 9.6+** | Three.js 직접, R3F v8 (React 18용) | R3F가 React 생태계의 표준, scene graph가 컴포넌트 트리, 자동 cleanup. v9 = React 19 페어 |
| R3F 헬퍼 | **@react-three/drei 10.7+** | drei v9 (R3F v8용), 직접 구현 | OrbitControls / Stars / Html 등 90% 케이스 커버. v10 = R3F v9 페어 |
| 카메라 컨트롤 | drei `OrbitControls` | drei `CameraControls`, 커스텀 | 회전/줌/팬/터치 자동, Phase 2 범위에 정확히 맞음 |
| 텍스처 출처 | Solar Textures 2K (CC-BY) | NASA Treks, 절차적 | 라이선스 명확, 용량 적정, 식별 가능한 디테일 |
| 거리 모드 전환 | 1.5초 보간 (easeInOutCubic) | 즉시 점프, 2초+ | UX 표준, *"지구가 사라지는 1초"* 가 과정으로 보임 |
| 상태 관리 | Zustand 4.x | React Context, props drilling | Canvas 안/밖을 잇는 공유 메모리, `useFrame` 안 리렌더 회피 |
| 데이터 모델 | `data/planets.ts` 는 real 값만 보관, `lib/scale.ts` 의 비례 압축 함수로 visual 계산 | real + visual 두 값 보관 (sub-2-2 [Light 6] 까지 사용 후 기각) | 비례 압축 함수가 단일 소스. 손튜닝 추측치 제거, *"이 숫자 어디서 왔나"* = `computeVisualRadius(...)` 한 줄로 답변 |
| 개발 디버그 GUI | leva 0.9+ (개발 시에만) | 없음 | sub-phase 2-2/2-4에서 행성 위치/스케일 손으로 튜닝 |

### 호환성 매트릭스 (참고)

| 우리 스택 | 버전 | 페어 |
|---|---|---|
| React | 19.2.5 | — |
| @react-three/fiber | 9.6.1 | React 19 짝꿍 |
| @react-three/drei | 10.7.7 | R3F v9 짝꿍 |
| three | 0.170.x | R3F v9 권장 범위 |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────┐
│  Page: SolarPage (/solar)                        │
│  ┌────────────────────────────────────────────┐  │
│  │  R3F <Canvas>                              │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ <Scene>                              │  │  │
│  │  │   <Sun />                            │  │  │
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
│  │  [거리 토글] [시간 슬라이더] [정지] [리셋] │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                       ↕
              ┌──────────────────┐
              │  Zustand Store   │
              │  - scaleMode      │
              │  - timeSpeed      │
              │  - selectedPlanet │
              │  - cameraTarget   │
              └──────────────────┘
                       ↕
              ┌──────────────────┐
              │  data/planets.ts │
              │  (불변 데이터)    │
              └──────────────────┘
```

**흐름**:
- `data/planets.ts`: 행성 메타데이터 (반지름, 거리, 공전 주기, 자전축, 텍스처, 고리)
- `lib/scale.ts`: 비례 압축 함수 — real → visual 단일 진실
- `Zustand store`: 사용자 인터랙션 결과 (현재 모드, 시간 속도, 선택된 행성)
- `<Planet>`: 매 프레임 `useFrame` 안에서 store + data 읽어 위치 갱신
- `ControlPanel`: store의 setter 호출
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
  // 비례 압축 함수 거치는 패턴 유지 검토.
}
```

### 단위 선택

| 종류 | 단위 | 이유 |
|------|------|------|
| 거리 (실제) | km | NASA 데이터 단위 그대로 — 변환 실수 0 |
| 거리 (시각) | scene unit | `lib/scale.ts` 의 함수가 km → scene unit 변환 |
| 공전 | days | 직관적 (수성 88일, 해왕성 60182일) |
| 자전 | hours | 직관적 (지구 24h, 금성 5832h 역회전) |
| 자전축 | degrees | 천문학 관습 (지구 23.5°, 천왕성 97.77°) |

### 스케일 변환

`lib/scale.ts` 가 단일 진실:

```typescript
visualRadius   = (realRadius_km / EARTH_RADIUS_KM) ^ radiusExponent   × radiusScale
visualDistance = (realDistance_km / ONE_AU_KM)     ^ distanceExponent × distanceScale
```

거리 토글 (sub-phase 2-4) 은 `distanceExponent` 를 *0.5 (시각 모드) ↔ 1.0 (실제 모드)* 로 보간 + `distanceScale` 동반 조정.

| 모드 | radiusExponent | distanceExponent | 의미 |
|------|----------------|------------------|------|
| 시각 | 0.5 | 0.5 | 제곱근 압축. 행성 식별 가능 |
| 실제 | 1.0 | 1.0 | 비례 그대로. *지구가 점이 되는 1초* |

`Ring` 도 같은 함수를 거침 — `innerRadius_km` / `outerRadius_km` 가 `computeVisualRadius` 호출. 토성 본체와 고리의 비율이 *수학적으로 자동 일관*.

---

## 4. 폴더 구조

```
frontend/src/
├── pages/
│   └── SolarPage.tsx                  ← Phase 2 진입점 (/solar 라우트)
├── components/
│   └── solar/
│       ├── Scene.tsx                  ← R3F Canvas 루트 + leva 패널
│       ├── Sun.tsx                    ← (sub-phase 2-2 [Light 3])
│       ├── Planet.tsx                 ← 행성 공통 컴포넌트
│       ├── Ring.tsx                   ← 토성/천왕성 고리 (sub-2-2 [Light 8])
│       ├── Moon.tsx                   ← (sub-phase 2-6)
│       ├── Starfield.tsx              ← drei <Stars> wrapper (sub-phase 2-6)
│       ├── CameraController.tsx       ← 행성 클릭 시 카메라 보간 (sub-phase 2-5)
│       └── ControlPanel.tsx           ← Canvas 밖, 하단 고정 UI (sub-phase 2-3 부터)
├── data/
│   ├── planets.ts                     ← real 값 단일 소스
│   └── sun.ts                         ← 태양 별도 (sub-2-2 [Light 3])
├── store/
│   └── solarSystemStore.ts            ← Zustand (sub-phase 2-3)
├── lib/
│   ├── scale.ts                       ← 비례 압축 함수 (sub-2-2 [Light 6])
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
- **8개로 제한**: 명왕성 / 카이퍼 벨트 / 소행성대 제외. 메시지 흐림 방지.
- **달만 위성**: 다른 행성의 위성 제외. *"우리 위성"* 이라는 의미 보존 + 시각적 노이즈 방지.
- **고정 텍스처 vs 동적**: 행성 표면은 정적 텍스처. 목성 폭풍 애니메이션 / 토성 고리 그림자 등은 미구현.
- **천왕성 고리 단색**: 토성과의 *시각적 차별화* 위해 단색 회색. 사실 천왕성 고리도 매우 어두워 — *현실에 가까운 단조로움*.

### 알려진 한계

- **공전 궤도는 원형으로 가정**: 실제는 타원 (이심률). Phase 3 N-body에서 정확한 케플러 궤도로 갈 예정. Phase 2는 단순 원.
- **공전면 평면**: 모든 행성을 같은 평면에 배치. 실제 궤도 경사 (수성 7°, 명왕성 17°) 무시.
- **태양 광원 단순화**: pointLight 1개 (decay=0, distance=0). 실제처럼 거리 제곱 감쇠 X.
- **달 한 개만**: 지구의 달만 표시. 목성/토성의 위성들 다수는 *시각적 노이즈*.
- **자전축 방향 단순화**: `rotation={[0, 0, AXIAL_TILT_RAD]}` 로 모든 행성이 같은 방향으로 기울어짐. 현실은 행성마다 기울어진 방향도 다름 — *기울기의 크기* 메시지에 집중.

이 한계들은 PRD 메시지(*"진짜 우주는 빈 공간이다"*)와 무관 — Phase 2 범위 외.

---

## 6. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| R3F 학습 곡선이 예상보다 큼 | 중간 | sub-phase 2-1을 *"빈 Canvas + sphere 1개 회전"* 만으로 한정. 작게 시작 |
| 모바일 60fps 미달 | 높음 | 행성 sphere 32 segments → 16으로 감소, 텍스처 2K → 1K, postprocessing X |
| 거리 스케일 보간이 어색함 | 중간 | sub-phase 2-4에서 PoC 후 easing 함수 튜닝. `leva` 로 실시간 조정 |
| 텍스처 로딩 시간 길어 첫 페인트 늦음 | 중간 | drei `useTexture` + `<Suspense fallback>` 패턴, 점진적 로딩 |
| Zustand 도입이 처음이라 `useFrame` 안 사용법 헷갈림 | 낮음 | `getState()` 패턴 (구독 X, 리렌더 X) 만 쓰면 됨, 문서 풍부 |
| Vercel 빌드에 텍스처 포함 시 용량 폭증 | 낮음 | 9개 행성 × 2K JPG + 1개 PNG ≈ 5MB 미만, Vercel 무료 한계 한참 아래 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **2-1**: R3F 셋업 + 빈 Canvas + 첫 sphere 1개 (지구) 자전
- **2-2**: 8개 행성 + 태양 데이터 모델 + 정적 배치 (시각 모드) + 비례 압축 + 고리
- **2-3**: 공전 애니메이션 + 시간 속도 컨트롤 (Zustand 도입)
- **2-4**: 거리 스케일 토글 + 1.5초 보간
- **2-5**: 행성 호버/클릭 + 카메라 줌인 + 정보 패널 + 카메라 리셋
- **2-6**: 달 + starfield 배경 + 컨트롤 패널 UI 마무리
- **2-7**: 모바일 최적화 + 성능 측정 + Lighthouse + Phase 종료

총 7 sub-phase ≈ 7~10일 (Phase 1 페이스 기준).

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
