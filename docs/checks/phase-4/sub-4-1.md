# sub-4-1 Check — GLSL Fullscreen Shader Scaffold

> Phase 4 — Light Bent · Issue #25 · 2026-06-10 · sub-4-1

---

## 🧪 Test

```
[Test] sub-4-1: GLSL fullscreen shader scaffold
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (bugfix 커밋 이후 모든 Light 통과)
- vitest: Phase 4 범위 유닛 테스트 없음 (렌더 파이프라인은 브라우저 검증)

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| /blackhole 진입 시 fullscreen 캔버스 렌더 | ✅ |
| 절차적 별하늘 visible | ✅ 확인 ("오케이 별 보인다!") |
| 화면 중앙 검은 원반 (4° 마스크) visible | ✅ 확인 |
| OrbitControls 드래그 → 별 시차 이동 | ✅ 확인 |
| 좌상단 Stats fps 패널 | ✅ 확인 |

### 성공 기준 점검 (Plan 기준)

- [x] `PlaneGeometry(2,2)` + `RawShaderMaterial` fullscreen quad
- [x] GLSL ES 3.0 vertex: NDC bypass (카메라 행렬 우회)
- [x] ray generation: `u_cameraToWorld` × `u_fov`로 world-space ray 복원
- [x] 절차적 별하늘: equirectangular 매핑 + hash21 두 레이어
- [x] `UniformUpdater` useFrame: 카메라·해상도·mass uniforms 매 프레임 갱신
- [x] `blackholeStore`: mass / steps / diskVisible / showHorizon 상태
- [x] `bhMaterialRef` 모듈 싱글턴: prop-drilling 없이 UniformUpdater 연결

---

## ✅ Check

```
[Check] sub-4-1: GLSL fullscreen shader scaffold
```

### 잘된 점

- **Light별 커밋 규칙을 처음 제대로 지켰다.** 이전 세션에서 7개 파일을 한 커밋으로
  묶었다가 user가 교정했고, 이번엔 store → shaders → Renderer → UniformUpdater →
  Scene 순서로 5 Light + 1 bugfix, 총 6 커밋으로 분리했다. 각 커밋이 독립적으로
  이해 가능한 단위가 됐고 "하루 6~10 커밋" 페이스도 지켰다.

- **fullscreen quad + `RawShaderMaterial` 패턴이 예상대로 깨끗했다.**
  `PlaneGeometry(2,2)` + NDC bypass vertex (`gl_Position = vec4(position.xy, 0, 1)`)
  는 카메라 projectionMatrix를 완전히 우회한다. Three.js OrbitControls와의 depth
  충돌은 `depthWrite: false, depthTest: false` 한 줄로 예방 — TechSpec §7 위험
  항목이 실제로 문제 없이 지나갔다.

- **`bhMaterialRef` 모듈 싱글턴이 prop-drilling 없이 잘 작동했다.**
  `BlackholeRenderer`에서 생성한 `RawShaderMaterial`을 모듈 레벨 ref로 노출하고,
  `UniformUpdater`가 useFrame마다 읽는 패턴 — Phase 3의 "리렌더 0" 철학을 셰이더에
  그대로 이식한 것이다.

- **`glslVersion: GLSL3` 한 줄이 핵심이었다 (bugfix 교훈 → 잘된 점).**
  버그는 고통이었지만 Three.js r170 RawShaderMaterial의 동작 방식(define 선주입)을
  정확히 이해하는 계기가 됐다. 해결책은 `#version 300 es`를 우리가 쓰지 않고
  Three.js에 위임하는 것 — 라이브러리의 흐름에 맞서지 말고 올라타기.

### 막혔던 점 / 트러블슈팅

#### 1. GLSL 컴파일 오류 — `#version 300 es` 위치 문제

- **증상**: `THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false /
  Vertex shader is not compiled` — 화면 아무것도 안 뜸
- **원인**: Three.js r170은 `RawShaderMaterial`에도 `#define SHADER_TYPE RawShaderMaterial`
  / `#define SHADER_NAME` 두 줄을 *셰이더 소스 앞에 먼저* 붙인다. 우리 코드에
  `#version 300 es`가 첫 줄이었지만, Three.js 주입 후엔 define들이 앞에 오고
  `#version`이 세 번째 줄이 됐다. GLSL 스펙은 `#version`이 *주석/공백을 제외한
  첫 토큰*이어야 한다 — 위반 → 컴파일 실패.
- **해결**: 두 GLSL 파일에서 `#version 300 es` 제거. `RawShaderMaterial` 생성 시
  `glslVersion: GLSL3` 추가 → Three.js가 define보다 *먼저* `#version 300 es`를
  넣어준다.
- **교훈**: Raw라도 Three.js는 손대지 않는 게 아니다. 라이브러리 버전별 실제
  동작을 모르면 "raw = 내 코드만" 가정이 깨진다. 항상 실제 컴파일 에러 메시지를
  보고 근원을 추적할 것.

#### 2. 7개 파일 한 커밋 → 첫 세션에서 규칙 위반

- **증상**: sub-4-1 7개 파일을 `docs` 업데이트 포함 한 커밋으로 스테이징했다가
  user가 교정 (`git reset HEAD`).
- **원인**: docs 업데이트 → commit 흐름에서 sub-phase 파일까지 한꺼번에 add 한 실수.
- **해결**: `git reset HEAD` 후 Light별로 재분리. 이후 WORKFLOW.md docs 업데이트까지
  포함해 커밋 게이트 문서화 재정비.
- **교훈**: `git add .` / `git add -A` 금지. 각 Light에서 *해당 파일만* add. 여러
  파일이 생겼다면 그것 자체가 Light가 너무 크다는 신호.

### 리팩토링 후보

- **`bhMaterialRef` 패턴 재검토 가능성** — 현재 모듈 싱글턴이라 HMR 시 stale
  ref 가능성 있음. R3F Context나 `useRef` + forwardRef 패턴이 더 React스럽다.
  지금은 데모 목적 + Phase 4 전용이라 YAGNI. 4-3 마감 때 재검토.
- **starfield 두 레이어 파라미터 하드코딩** — 그리드 크기(150, 400)·밀도 임계값
  (0.96, 0.93)이 셰이더 리터럴. 서브밀리미터 조정이 필요하면 uniform으로 올릴 수
  있으나 Phase 4 범위에선 불필요.

### 다음 sub-4-2에 적용할 교훈

- **렌징 없는 직선 광자(r_s=0)로 먼저 확인한다.** TechSpec §7이 "u-φ ODE의 3D
  좌표 변환 수식 오류" 를 높은 위험으로 표시했다. 4-1에서 별하늘이 OrbitControls
  회전에 정확히 반응한다는 걸 확인했으니, 4-2에서 ODE를 넣을 때 `r_s = 0` (직선
  경로) 케이스가 4-1 결과와 일치하는지 먼저 보고 렌징을 켠다.
- **GLSL loop 스텝 수**: GLSL ES 3.0에서 uniform loop(`for(int i=0; i<u_steps; i++)`)
  가 허용되지만, 드라이버 호환을 위해 `MAX_STEPS` 상수 + `if(i >= u_steps) break`
  방어 패턴(TechSpec §7)을 처음부터 넣는다. 나중에 분기 추가하기보다 처음이 낫다.
- **3D 좌표 변환 수식 먼저 종이로 확인** — 궤도 평면 기저(e_r, e_phi, n), 초기
  u_0 / p_0 유도는 손계산을 먼저 하고 코드를 친다. 수식 오류는 GLSL에서 디버그가
  매우 어렵다.

## 🌌 이번에 알게 된 우주의 한 조각

**빛의 경로는 좌표계 위에서 "굴러가는" 것이 아니다 — 굽은 시공간이 가장 짧은
경로(측지선)를 그릴 뿐이다.**

이번에 만든 검은 원반은 "빛이 블랙홀에 막혔다"는 뜻이 아니다. 그 방향으로 보낸
광선이 사건 지평선을 통과하면 다시 나오지 못한다 — 탈출 속도가 광속을 초과하기
때문. 그리고 그 경계는 `r_s = 2GM/c²`라는 한 줄로 정의된다.

sub-4-2에서 ODE를 붙이면 저 검은 원반 *주변* 별빛이 휘는 것을 볼 것이다. 그것이
슈바르츠실트 측지선 — 일반상대성이론이 "중력은 힘이 아니라 시공간의 곡률이다"
라고 말하는 방식을 광선 하나로 보여주는 것이다. 뉴턴은 힘이 궤도를 바꾼다고
했고, 아인슈타인은 궤도 자체가 공간의 모양이라고 했다. 이번 sub-phase의 검은
원반은 그 모양이 극단에 달한 곳의 경계다.
