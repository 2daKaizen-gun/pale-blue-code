# Phase 2 TechSpec — Solar System

> *작성일: 2026-05-10*
> *상태: Confirmed*
> *PRD: ./PRD.md*

> **2026-05-10 갱신 (1차)**: §1 의존성 버전을 *실제 설치본* 으로 정정. Phase 2 sub-phase 2-1 [Light 1] 의존성 설치 시 React 19 환경에 맞춰 R3F v9 / drei v10 으로 페어링. R3F 공식 매트릭스: v8→React 18, v9→React 19.
>
> **2026-05-10 갱신 (2차)**: §4 폴더 구조의 페이지 파일명을 `SolarSystemPage.tsx` → `SolarPage.tsx` 로 정정. 실제 레포의 기존 페이지 명명 패턴 (PhaseN 이 아닌 도메인 이름 단축형) 을 따름. sub-phase 2-1 [Light 6] 라우트 연결 시 발견.
>
> **2026-05-12 갱신 (3차)**: §1 + §3 의 *데이터 모델 결정* 을 뒤집음. sub-phase 2-2 [Light 5] leva 손튜닝 중 발견 — 8개 행성에 직접 `visualRadius`/`visualDistance` 박는 방식이 *손튜닝 부담 + 근거 부재*. 비례 압축 함수 `(real / earthReal) ^ k × scale` 도입 (`lib/scale.ts`) 으로 한 함수가 전 천체 자동 계산. 이전 결정 *"단위 혼란 제거"* 의 근거는 함수 내부 단위 변환 단일화로 더 강화. sub-phase 2-4 의 거리 토글이 *exponent k 의 0.5 → 1.0 부드러운 보간* 으로 정리되어 토글 메시지도 수학적으로 우아해짐.

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
│  │  │     └─ 지구는 <Moon /> 자식으로     │  │  │
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
- `data/planets.ts`: 행성 메타데이터 (반지름, 거리, 공전 주기, 텍스처)
- `Zustand store`: 사용자 인터랙션 결과 (현재 모드, 시간 속도, 선택된 행성)
- `<Planet>`: 매 프레임 `useFrame` 안에서 store + data 읽어 위치 갱신
- `ControlPanel`: store의 setter 호출
- `CameraController`: 선택된 행성 변하면 카메라 보간 시작

---

## 3. 데이터 모델

### `data/planets.ts`

```typescript
export type PlanetData = {
  id: 'mercury' | 'venus' | 'earth' | 'mars'
    | 'jupiter' | 'saturn' | 'uranus' | 'neptune'
  name: { ko: string; en: string }

  // 실제 값 (NASA 단위 그대로)
  realRadius_km: number
  realDistance_km: number       // 평균 궤도 반경 (태양 중심)
  orbitalPeriod_days: number    // 공전 주기
  rotationPeriod_hours: number  // 자전 주기 (음수 = 역회전)

  // 시각화 자산
  texture: string               // public/textures/planets/{id}.jpg
  color: string                 // 토큰 키 (예: 'cosmos-mars')
  description: string           // 정보 패널용 한 단락

  // 위성 (지구만 보유)
  moon?: MoonData
}

export type MoonData = {
  realRadius_km: number
  realDistance_km: number       // 모행성 중심부터의 거리
  orbitalPeriod_days: number
  visualRadius: number
  visualDistance: number
  texture: string
}
```

### 단위 선택

| 종류 | 단위 | 이유 |
|------|------|------|
| 거리 (실제) | km | NASA 데이터 단위 그대로 — 변환 실수 0 |
| 거리 (시각) | scene unit | R3F 기본, 디자이너가 손으로 깎음 |
| 공전 | days | 직관적 (수성 88일, 해왕성 60182일) |
| 자전 | hours | 직관적 (지구 24h, 금성 5832h 역회전) |

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

---

## 4. 폴더 구조

```
frontend/src/
├── pages/
│   └── SolarPage.tsx                  ← Phase 2 진입점 (/solar 라우트)
├── components/
│   └── solar/
│       ├── Scene.tsx                  ← R3F Canvas 안의 루트
│       ├── Sun.tsx                    ← (sub-phase 2-2)
│       ├── Planet.tsx                 ← 행성 공통 컴포넌트
│       ├── Moon.tsx                   ← (sub-phase 2-6)
│       ├── Starfield.tsx              ← drei <Stars> wrapper (sub-phase 2-6)
│       ├── CameraController.tsx       ← 행성 클릭 시 카메라 보간 (sub-phase 2-5)
│       └── ControlPanel.tsx           ← Canvas 밖, 하단 고정 UI (sub-phase 2-3 부터)
├── data/
│   └── planets.ts                     ← 단일 소스
├── store/
│   └── solarSystemStore.ts            ← Zustand (sub-phase 2-3)
├── lib/
│   └── easing.ts                      ← easeInOutCubic 등 보간 함수 (sub-phase 2-4)
└── public/
    └── textures/
        └── planets/                   ← Solar Textures 2K (CC-BY)
            ├── mercury.jpg
            ├── ...
            └── ATTRIBUTION.md
```

---

## 5. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프

- **스케일 vs 가시성**: 시각적 모드는 의도적 거짓말. 정확한 스케일은 토글로만 제공. *PRD의 핵심 메시지*.
- **8개로 제한**: 명왕성 / 카이퍼 벨트 / 소행성대 제외. 메시지 흐림 방지.
- **달만 위성**: 다른 행성의 위성 제외. *"우리 위성"* 이라는 의미 보존 + 시각적 노이즈 방지.
- **고정 텍스처 vs 동적**: 행성 표면은 정적 텍스처. 목성 폭풍 애니메이션 / 토성 고리 그림자 등은 미구현.

### 알려진 한계

- **공전 궤도는 원형으로 가정**: 실제는 타원 (이심률). Phase 3 N-body에서 정확한 케플러 궤도로 갈 예정. Phase 2는 단순 원.
- **공전면 평면**: 모든 행성을 같은 평면에 배치. 실제 궤도 경사 (수성 7°, 명왕성 17°) 무시.
- **태양 광원 단순화**: directional light 1개. 실제처럼 거리 제곱 감쇠 X.
- **달 한 개만**: 지구의 달만 표시. 목성/토성의 위성들 다수는 *시각적 노이즈*.

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
| Vercel 빌드에 텍스처 포함 시 용량 폭증 | 낮음 | 9개 행성 × 2K JPG ≈ 5MB 미만, Vercel 무료 한계 한참 아래 |

---

## 7. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **2-1**: R3F 셋업 + 빈 Canvas + 첫 sphere 1개 (지구) 자전
- **2-2**: 8개 행성 + 태양 데이터 모델 + 정적 배치 (시각 모드)
- **2-3**: 공전 애니메이션 + 시간 속도 컨트롤 (Zustand 도입)
- **2-4**: 거리 스케일 토글 + 1.5초 보간
- **2-5**: 행성 호버/클릭 + 카메라 줌인 + 정보 패널 + 카메라 리셋
- **2-6**: 달 + starfield 배경 + 컨트롤 패널 UI 마무리
- **2-7**: 모바일 최적화 + 성능 측정 + Lighthouse + Phase 종료

총 7 sub-phase ≈ 7~10일 (Phase 1 페이스 기준).

---

*"TechSpec은 결정의 카탈로그다. 인수인계 §2 '확정된 기술 결정'의 원본이 여기다."*
