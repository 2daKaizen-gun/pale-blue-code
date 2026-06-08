# Phase 4 TechSpec — Light Bent

> *작성일: 2026-06-08*
> *상태: Draft → sub-4-1 진입 시 Confirmed*
>
> *스택 실측 (2026-06-08)*: `frontend/package.json` 직접 확인 — React 19.2.5 /
> R3F 9.6.1 / drei 10.7.7 / three 0.170.x / zustand 5.0.13 / vitest 4.1.6 /
> Vite 8.0.10 / TS 6.0.2. **GLSL 라이브러리 0개** — Phase 4 셰이더는 순수 손코딩.
> (Phase 3 물리 라이브러리 0개 정신 동일)

---

## 1. 핵심 기술 결정

| 영역 | 선택 | 대안 (검토 후 기각) | 이유 |
|------|------|-------------------|------|
| 렌징 방식 | **측지선 적분** — `d²u/dφ² + u = (3/2)r_s·u²` GLSL RK4 per-pixel | 근사 셰이더 (`deflection ≈ 2r_s/b`) | PRD §2 영혼: "GR 물리를 직접 코드로". 근사는 아인슈타인 링을 재현 못함. measurement-first: 스텝 수 기본값은 60fps 측정 후 결정 |
| 렌더 구조 | **fullscreen `<mesh>` + `ShaderMaterial`** (R3F 안, 씬 별도) | drei `<ScreenQuad>` / EffectComposer pass | drei ScreenQuad: 버전 호환 불명 (three.js FullScreenQuad 직접 사용 옵션도 있음). ShaderMaterial이 가장 명시적 |
| 배경 별하늘 | **절차적 GLSL** (Phase 1 Starfield 패턴 셰이더로 재구현) | HDR 스카이박스 텍스처, R3F Stars 컴포넌트 재사용 | HDR: 수 MB 번들 불필요. R3F Stars: drei 매트릭스 risk (sub-3-3 교훈). GLSL 절차적 = 번들 0 + 완전 제어 |
| 좌표계 | **2D 궤도 평면 (u-φ 방정식)** — 3D 광자 경로를 중심력 대칭 이용해 2D로 환원 | 3D Cartesian 전파 (dr/dλ, dθ/dλ, dφ/dλ 각각) | Schwarzschild = 구 대칭 → 궤도는 평면. u=1/r ODE가 GLSL에서 더 단순 (상태 2개). 3D Cartesian은 상태 6개 + 안정성 어려움 |
| GLSL 버전 | **GLSL ES 3.0** (`#version 300 es`) | GLSL ES 1.0 (WebGL 1.0) | Three.js 0.170은 WebGL2 기본. `int` loop 가변 (`for(int i=0; i<u_steps; i++)` 허용), `texture()` 함수 |
| 물리 상태 | **Zustand store** (제어: mass, steps, diskVisible, paused) + **ShaderMaterial uniforms** (렌더) | Canvas 밖 ref / props drilling | Phase 3 gravityStore 패턴 동일. uniforms은 useFrame에서 getState()로 set |
| 적분 알고리즘 | **RK4 in GLSL** (k1~k4 per pixel, per step) | Euler (발산 빠름), RK45 (GLSL 분기 어려움) | Phase 3 CPU RK4의 GPU 이식. Euler는 PRD §3 스텝 토글 데모의 대비로만 언급 (구현은 스텝 수 줄이기로 대체) |
| 씬 구조 | **`BlackholePage.tsx` → `components/blackhole/Scene.tsx`** (Phase 3 패턴 미러) | GravityPage/Scene 직접 확장 | Phase 별도 씬. Context Lost 방어 (Canvas 안쪽 Suspense 고정, sub-2-7 패턴) |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│  Page: BlackholePage (/blackhole)                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  R3F <Canvas dpr={[1,2]}>                        │    │
│  │  ┌────────────────────────────────────────────┐  │    │
│  │  │ <Scene>                                    │  │    │
│  │  │   <BlackholeRenderer />  ← fullscreen mesh │  │    │
│  │  │     ShaderMaterial                         │  │    │
│  │  │       vert: NDC quad                       │  │    │
│  │  │       frag: geodesic RK4 per-pixel         │  │    │
│  │  │         → starfield sample                 │  │    │
│  │  │         → disk intersection + Doppler      │  │    │
│  │  │   <UniformUpdater />  ← useFrame uniforms  │  │    │
│  │  │   <OrbitControls />   ← 카메라 자유 이동   │  │    │
│  │  └────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ControlPanel (Canvas 밖, 하단 고정)              │    │
│  │  [질량 ●——] [스텝 수: 64/96/128]                 │    │
│  │  [사건지평선 가시화 ✓] [강착원반 ✓]               │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
          ↕ (제어 상태)
   ┌─────────────────────────────┐
   │  Zustand: blackholeStore    │
   │  - mass: number (r_s 스케일)│
   │  - steps: 64 | 96 | 128    │
   │  - diskVisible: boolean     │
   │  - showHorizon: boolean     │
   └─────────────────────────────┘
          ↓ uniforms (useFrame getState)
   ┌─────────────────────────────────────────────────────┐
   │  ShaderMaterial uniforms                            │
   │  u_resolution: vec2   u_cameraPos: vec3            │
   │  u_cameraToWorld: mat4                             │
   │  u_rs: float          u_steps: int                 │
   │  u_diskInner: float   u_diskOuter: float           │
   │  u_diskVisible: bool  u_showHorizon: bool          │
   └─────────────────────────────────────────────────────┘
```

**데이터 흐름**:
- `BlackholePage` → `Scene` → `BlackholeRenderer` (fullscreen mesh, ShaderMaterial 소유)
- `UniformUpdater`: `useFrame` 안에서 `blackholeStore.getState()`로 uniforms 갱신
  (리렌더 0 — Phase 3 무리렌더 패턴의 셰이더판)
- `ControlPanel`: store setter 호출 → 다음 프레임 uniform 반영

---

## 3. GLSL 알고리즘

### 3.1 Fullscreen Quad Vertex Shader

```glsl
#version 300 es
in vec3 position;
void main() {
  // PlaneGeometry(2,2): position.xy는 이미 [-1,1]. projectionMatrix 우회
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
```

Three.js의 기본 Camera 변환을 *완전히 우회*한다. `projectionMatrix · modelViewMatrix`를
곱하지 않음 — 결과가 항상 화면 전체를 덮는 quad.

### 3.2 Ray Generation (Fragment Shader)

```glsl
// NDC 좌표에서 world-space ray direction 복원
vec2 ndc = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
ndc.x *= u_resolution.x / u_resolution.y;  // aspect ratio 보정

// u_cameraToWorld: THREE.Camera.matrixWorld (view → world)
// fov 고정값 or uniform으로 받기 (기본 THREE.PerspectiveCamera fov=75도)
float fovScale = tan(radians(u_fov * 0.5));
vec3 rayDir_cam = normalize(vec3(ndc * fovScale, -1.0));
vec3 rayDir = normalize((u_cameraToWorld * vec4(rayDir_cam, 0.0)).xyz);
vec3 rayOrigin = u_cameraPos;
```

### 3.3 슈바르츠실트 측지선 (광자 궤도 ODE)

**핵심 방정식**: `u = 1/r` 치환 후 궤도 평면 2D ODE

```
d²u/dφ² = -u + (3/2)·r_s·u²
```

이것을 연립 1차로: `state = (u, p)` where `p = du/dφ`
```
du/dφ = p
dp/dφ = -u + (3/2)·r_s·u²
```

**GLSL RK4**:
```glsl
vec2 geodesicDerivs(vec2 state, float rs) {
  float u = state.x;
  float p = state.y;
  return vec2(p, -u + 1.5 * rs * u * u);
}

// RK4 step: dφ = step size
vec2 rk4Step(vec2 s, float dphi, float rs) {
  vec2 k1 = geodesicDerivs(s,           rs) * dphi;
  vec2 k2 = geodesicDerivs(s + k1*0.5,  rs) * dphi;
  vec2 k3 = geodesicDerivs(s + k2*0.5,  rs) * dphi;
  vec2 k4 = geodesicDerivs(s + k3,      rs) * dphi;
  return s + (k1 + 2.0*k2 + 2.0*k3 + k4) / 6.0;
}
```

**3D 궤도 평면 세팅**:
1. 블랙홀 위치를 원점으로. `bh_to_cam = rayOrigin` (블랙홀이 원점이라 가정)
2. 궤도 평면의 법선: `n = normalize(cross(bh_to_cam, rayDir))`
3. 궤도 내 기저: `e_r = normalize(bh_to_cam)`, `e_phi = normalize(cross(n, e_r))`
4. 초기 `φ = 0`: `u_0 = 1/|bh_to_cam|`, `p_0 = du/dφ` — ray direction의 radial 성분에서 유도
5. 충격 매개변수 `b = 1 / |sin(angle between rayDir and radial)|·|bh_to_cam|`
6. RK4로 φ를 0부터 `dphi * steps`까지 적분
7. 최종 (u_f, p_f)에서 최종 방향 벡터 복원 → 그 방향으로 별하늘 샘플

**사건 지평선 판별**: 적분 중 `1/u > r_s` 이면 블랙홀 안 → `fragColor = vec4(0,0,0,1)` return

### 3.4 절차적 별하늘 (GLSL)

Phase 1 `Starfield.tsx` (Three.js Points)를 fragment shader로 재구현:

```glsl
// 방향 벡터 → 구면 좌표 → hash → 별 밀도 함수
float starfield(vec3 dir) {
  // atan2 + asin으로 UV, hash로 별 위치 격자
  // 별 하나 = smoothstep 원
  ...
}
```

별이 "렌즈를 통해" 보인다는 것은 `starfield(deflectedDir)`를 호출하는 것 — 굴절된
방향으로 샘플링.

### 3.5 강착 원반 (4-3, 참고)

```glsl
// 원반 = 적도면(y=0) 위 r_isco < r < r_outer
// 레이-평면 교점 검출
float t_disk = -rayOrigin.y / rayDir_deflected.y;  // y=0 교점
vec3 hitPt = rayOrigin + t_disk * rayDir_deflected;
float r_hit = length(hitPt.xz);
if (r_hit > r_isco && r_hit < r_outer && t_disk > 0.0) {
  // Doppler: 원반 회전 속도 v ∝ 1/sqrt(r), 시선 성분으로 beaming
  float doppler = ...;
  diskColor = mix(REDSHIFT, BLUESHIFT, doppler);
}
```

---

## 4. 데이터 모델 / Store

### `store/blackholeStore.ts`

```ts
const STEPS_OPTIONS = [64, 96, 128] as const
type StepCount = (typeof STEPS_OPTIONS)[number]

interface BlackholeStore {
  mass: number          // 슈바르츠실트 반경 스케일 (1.0 = 기본, 0.5~3.0 범위)
  steps: StepCount      // GLSL RK4 적분 스텝 수
  diskVisible: boolean  // 강착 원반 표시 (4-3)
  showHorizon: boolean  // 사건 지평선 원 오버레이

  setMass(m: number): void
  setSteps(s: StepCount): void
  toggleDisk(): void
  toggleHorizon(): void
}
```

제어 상태만. 물리 계산은 모두 GLSL (CPU-side 상태 없음).

### Uniforms 매핑

| Uniform | Three.js 소스 | 갱신 시점 |
|---------|--------------|---------|
| `u_resolution` | `gl.drawingBufferWidth/Height` | resize |
| `u_cameraPos` | `camera.position` | useFrame |
| `u_cameraToWorld` | `camera.matrixWorld` | useFrame |
| `u_fov` | `camera.fov` | resize/mount |
| `u_rs` | `store.mass` × 기본 r_s | useFrame |
| `u_steps` | `store.steps` | useFrame |
| `u_diskVisible` | `store.diskVisible` | useFrame |
| `u_showHorizon` | `store.showHorizon` | useFrame |

---

## 5. 폴더 구조

```
frontend/src/
├── pages/
│   └── BlackholePage.tsx          ← /blackhole 진입점 (빈 뼈대 이미 존재)
├── components/
│   └── blackhole/
│       ├── Scene.tsx              ← Canvas 루트 (Phase 3 패턴 미러)
│       ├── BlackholeRenderer.tsx  ← fullscreen mesh + ShaderMaterial 소유
│       ├── UniformUpdater.tsx     ← useFrame에서 uniforms 갱신 (return null)
│       └── ControlPanel.tsx       ← 질량/스텝/토글 UI
├── shaders/
│   ├── blackhole.vert.glsl        ← fullscreen quad vertex
│   └── blackhole.frag.glsl        ← geodesic RK4 + starfield + disk
├── store/
│   └── blackholeStore.ts          ← 제어 상태 Zustand
└── (재사용) hooks/useIsTouchDevice, components/ui/Spinner, AppLayout
```

> **GLSL 파일 임포트**: Vite는 `.glsl` 를 raw string으로 임포트 지원 (`?raw` suffix).
> Three.js `ShaderMaterial`의 `vertexShader`/`fragmentShader`에 직접 전달.
> `vite.config.ts` 별도 플러그인 불필요.

---

## 6. 트레이드오프 / 알려진 한계

### 의식적 트레이드오프
- **u-φ ODE (2D) vs 3D Cartesian**: 2D가 GLSL 상태 2개로 단순, 구 대칭이라 정확. 단, 카메라가 블랙홀 *아주 가까이* 있으면 근거리 근사 오차 — 데모 거리에선 무관.
- **고정 스텝 수 (64/96/128)**: 적응형(RKF45)보다 단순. GLSL 분기가 적어 GPU 효율 좋음. 데모 범위에서 충분.
- **슈바르츠실트만 (비회전)**: Kerr(회전)는 frame-dragging + ergosphere 추가 — 별도 Phase 연구 트랙.
- **절차적 별 (위치 fixed seed)**: 실제 항성 카탈로그가 아님. 포트폴리오 시각 목적으로 충분.

### 알려진 한계
- **광자구 내부 극 근접 적분 불안정** — `u → ∞` (r → 0) 발산. 사건 지평선 체크로 조기 탈출 방어.
- **강착 원반 정확도** — 실제 Doppler beaming은 상대론적 보정 포함. 여기선 비상대론적 근사 (시각 효과 우선).
- **모바일 스텝 제한** — 64 스텝에서도 중급 모바일 30fps 가능성. measurement-first로 결정.
- **메인스레드 카메라** — GPU 병렬이지만 uniform 갱신은 CPU 메인스레드. Phase 3처럼 `getState()` 무구독.

---

## 7. 위험 / 막힐 가능성

| 위험 | 가능성 | 대응 |
|------|--------|------|
| u-φ ODE의 3D 좌표 변환 수식 오류 | 높음 | sub-4-1 에서 렌징 없이 별하늘만 먼저 확인. 4-2 에서 단순 직선 광자(r_s=0)로 디버그 후 렌징 켜기 |
| GLSL loop 스텝 수 uniform 제약 | 중간 | GLSL ES 3.0은 `u_steps` uniform loop 가능. 단, 일부 드라이버는 컴파일 시 상수 요구 — 최대값 상수 + if 체크로 방어 (`for(int i=0;i<MAX_STEPS;i++){ if(i>=u_steps) break; }`) |
| 60fps 미달 | 중간 | measurement-first: sub-4-2 완료 후 Chrome devtools GPU 프로파일. 64 스텝 → fps 측정 → 목표 미달 시 최적화 (dpr 제한, 저해상도 렌더링) |
| fullscreen quad가 OrbitControls와 충돌 | 중간 | quad geometry는 depth write 꺼야 OrbitControls의 hit-test를 방해 안 함. `depthWrite: false, depthTest: false` |
| drei Stars 재사용 시 매트릭스 깨짐 | 낮음 (→ GLSL 절차적으로 우회) | 이미 기각. 절차적 GLSL이 해법 |
| Vite GLSL 임포트 설정 | 낮음 | `import glsl from './blackhole.frag.glsl?raw'` — Vite 기본 지원, 추가 플러그인 불필요 |
| 카메라 행렬 uniform 타이밍 | 낮음 | `useFrame`에서 OrbitControls 업데이트 *후* uniform 갱신 순서 보장 (`after: true` 옵션) |

---

## 8. sub-phase 분할 (개요)

각 sub-phase의 한 줄 제목만. 상세는 PCTC Plan에 위임.

- **4-1**: GLSL fullscreen shader scaffold — NDC quad vertex, frag에 절차적 별하늘, 렌징 없이 카메라 이동만, uniforms 파이프라인 검증. *"별이 보이면 성공"*
- **4-2**: 슈바르츠실트 렌징 — u-φ ODE GLSL RK4, 3D 좌표 변환, 아인슈타인 링 재현, 질량/스텝 UI. *Phase의 영혼*
- **4-3**: 강착 원반 + 도플러 비밍 + 모바일/성능/Lighthouse + Phase 종료 + 인수인계

---

*"TechSpec은 결정의 카탈로그다."*
*"Phase 3 CPU RK4 → Phase 4 GPU GLSL RK4. 적분기는 여전히 우주를 굴린다, 이번엔 GPU로."*
