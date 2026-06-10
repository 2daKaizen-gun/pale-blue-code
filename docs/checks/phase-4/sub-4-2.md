# sub-4-2 Check — Schwarzschild Lensing + Einstein Ring

> Phase 4 — Light Bent · Issue #26 · 2026-06-11 · sub-4-2

---

## 🧪 Test

```
[Test] sub-4-2: Schwarzschild lensing — GLSL RK4 geodesic + Einstein ring
```

### 자동

- `npm run build` — TS + Vite 빌드 통과 (모든 Light)
- vitest: 렌더 파이프라인 브라우저 검증. 유닛 테스트 범위 없음.

### 수동 (브라우저)

| 항목 | 결과 |
|------|------|
| `/blackhole` 로드 — 별하늘 + 사건 지평선 black disc 유지 | ✅ |
| 블랙홀 주변 별들이 중심 방향으로 당겨져 보임 (gravitational lensing) | ✅ |
| Mass 슬라이더 올리면 black disc 커지고 왜곡 영역 확대 | ✅ |
| Horizon 버튼 → 광자구 위치에 글로우 링 오버레이 | ✅ |
| Steps 토글 (64/96/128) 동작 | ✅ |
| u_rs=0 (mass~0 근처) → 4-1 baseline 별하늘과 유사 | ✅ |
| 하단 ControlPanel 표시 | ✅ |

### 성공 기준 점검

- [x] u–φ ODE GLSL RK4 — `geodesicDerivs` + `rk4Step` + `traceRay` 구현
- [x] 3D 궤도 평면 설정 (e_r, e_t, n) + 초기값 (u0, p0, b) 정확
- [x] 사건 지평선 캡처 (`1/u < r_s` → black)
- [x] `u_rs=0` 직선 경로 = sub-4-1 baseline 일치
- [x] ControlPanel — mass 슬라이더 / steps 토글 / horizon 토글
- [x] UniformUpdater — u_steps · u_showHorizon 매 프레임 갱신
- [x] `npm run build` 통과

### 미달 / 후속

- Einstein ring (광자구 근처 밝은 링)이 수학적으로는 생성되나, 절차적 별하늘의 랜덤 분포 특성상 선명한 "링" 형태보다 "글로우 오버레이(Horizon 버튼)"로 더 명확하게 인지됨. 별 밀도 추가 증가 또는 sub-4-3에서 강착 원반 추가 시 더 드라마틱해질 것으로 예상.

---

## ✅ Check

```
[Check] sub-4-2: Schwarzschild lensing — GLSL RK4 geodesic + Einstein ring
```

### 잘된 점

- **u–φ ODE의 3D 좌표 변환이 예상보다 깔끔했다.** 슈바르츠실트 대칭 덕분에 3D
  문제가 2D 궤도 평면으로 환원된다. `e_r` (반경 방향)·`e_t` (접선 방향)·`n` (법선)
  세 벡터로 궤도 기저를 설정하면, 이후 모든 계산은 `(u, p)` 두 스칼라만 관리하면
  된다. Phase 3 CPU RK4(6개 상태)가 GLSL RK4(2개 상태)로 줄어든 건 GR의 구 대칭
  덕분 — 물리 대칭이 코드 단순화를 직접 만든다.

- **`u_rs=0` 직선 경로 검증이 실제로 버그를 잡아냈다.** 처음 설계 시 p0 부호 방정식
  과 최종 방향 재구성 수식을 여러 번 확인했고, r_s=0에서의 straight-line passthrough
  테스트가 수식이 맞음을 확인해줬다. sub-4-1 Check의 "r_s=0 먼저" 교훈이 실제로 작동.

- **`glslVersion: GLSL3`과 MAX_STEPS 상수 패턴** — sub-4-1에서 배운 Three.js
  RawShaderMaterial 동작 방식 그대로 적용. `#version` 이슈 없이 진행. GLSL ES 3.0의
  uniform loop (`for(i=0; i<MAX_STEPS; i++){ if(i>=u_steps) break; }`) 패턴도
  드라이버 호환 우회로 처음부터 넣어 런타임 이슈 없음.

- **ControlPanel이 Phase 3 패턴을 그대로 재사용했다.** 레이아웃(`absolute bottom-4
  left-1/2 -translate-x-1/2`), 스타일(backdrop-blur, border-white/10), aria 접근성
  패턴이 Phase 3 ControlPanel과 동일 — 코드 없이 기억으로도 쓸 수 있는 패턴이
  됐다.

### 막혔던 점 / 트러블슈팅

#### 1. Einstein ring이 렌징만으로는 드라마틱하지 않음

- **증상**: 수학적으로 렌징이 동작하고 사건 지평선도 보이나, 별들이 링 모양으로
  선명하게 모이는 "아인슈타인 링" 시각 효과가 약함. Horizon 글로우 오버레이 없이는
  "드라마틱하게 못 느끼겠다"는 피드백.
- **원인 1 — 별 밀도**: 4%/7% 랜덤 별하늘은 각 방향에 별이 없는 영역이 많아,
  렌징으로 방향이 꺾여도 "꺾인 방향에 별이 없으면" 차이가 보이지 않음. 렌징 시각화는
  기준점(별)이 빽빽해야 왜곡이 드러난다.
- **원인 2 — D_PHI 너무 작음**: `D_PHI=0.1`, 64스텝 = 6.4rad. 광자구 근처
  (b ≈ b_crit) 광선은 탈출까지 10–19rad이 필요한데 적분이 일찍 끊겨 잘못된 방향을
  반환. Einstein ring을 만드는 핵심 광선들이 제대로 추적되지 않음.
- **해결**: (a) 별 밀도 4%→20%, 7%→25%로 증가. (b) D_PHI 0.1→0.3 (64스텝에서
  19.2rad 커버). (c) 기본 mass 1.0→1.5 (링 각도 20°→31°로 확대).
- **교훈**: 광자구 근처 측지선은 통상 광선보다 훨씬 긴 φ 경로를 필요로 한다.
  step 수가 아니라 *총 커버리지(steps × D_PHI)*가 중요. 적분기 스텝 크기 선정 시
  "가장 어려운 케이스(b ≈ b_crit)"를 기준으로 삼아야 한다.

#### 2. 카메라 거리 스케일 선정

- **문제**: sub-4-1 기본 카메라 z=5에서 mass=1.0(r_s=2.0)이면 r/r_s=2.5 — 카메라
  가 광자구 안쪽이라 전체 화면이 극단적으로 왜곡되거나 검어짐.
- **해결**: 카메라를 z=15로 이동. mass 최대값(3.0, r_s=6)에서도 b_crit=15.6 ≈
  r_cam=15로 한계에 걸리지만 데모 범위에서 허용.
- **교훈**: GR 렌징에서 "카메라가 광자구 안쪽에 있다"는 것은 탈출 가능한 광자가
  없다는 뜻 — 스케일 선정은 b_crit < r_cam 조건을 먼저 확인해야 한다.

### 리팩토링 후보

- **bhMaterialRef 싱글턴 재검토** — HMR 시 stale ref 가능성. React Context로 교체
  시 더 안전하나 Phase 4 데모에선 YAGNI.
- **카메라 거리 vs mass 최대값 결합** — mass=3.0에서 r_cam이 b_crit에 거의 걸림.
  mass 범위를 0.3–2.5로 줄이거나 카메라를 z=20으로 이동해 여유 확보 후보.
- **star density를 uniform으로** — 별 밀도 임계값이 셰이더 리터럴. 고밀도/저밀도
  모드를 uniform으로 제어하면 성능 튜닝이 용이 — 현재는 YAGNI.

### 다음 sub-4-3에 적용할 교훈

- **강착 원반이 드라마틱한 이유**: 원반은 빛을 방출하는 연속 구조 — 별처럼 점이
  아니라 면. 원반을 추가하면 렌징 효과가 *연속적인 왜곡* 으로 보여 훨씬 드라마틱.
  절차적 별하늘의 점 분포 한계를 원반이 보완할 것.
- **도플러 비밍 계산은 y=0 평면 교점 먼저**: 레이가 적도면(y=0)과 교차하는지 먼저
  검출하고, 교점 r이 [r_isco, r_outer] 범위일 때 색 계산. traceRay에서 반환된
  deflected ray로 이 교점을 검출한다.
- **measurement-first**: 강착 원반 + 렌징 조합에서 60fps가 유지되는지 먼저 측정 후
  최적화(dpr 낮추기, 저해상도 렌더). 추측 최적화는 YAGNI.

## 🌌 이번에 알게 된 우주의 한 조각

**아인슈타인 링은 "완벽한 정렬의 우연"이 아니라 "측지선의 수렴"이다.**

빛이 블랙홀 광자구(r = 1.5r_s)를 스칠 때, 그 빛은 360° 를 완전히 돌아 관측자에게
돌아온다. 이 때문에 블랙홀 *정반대*에 있는 별이 링으로 보인다. 하지만 더 깊은 진실:
이 링은 "별이 우연히 일직선에 있어서" 생기는 게 아니라, 슈바르츠실트 시공간의
곡률이 특정 충격 매개변수(b_crit)를 가진 모든 광선을 같은 방향으로 수렴시키기
때문이다.

이 코드에서 b ≈ b_crit인 광선들은 64스텝으로 20rad에 가까운 φ를 적분해야 탈출한다.
그것은 광자가 블랙홀 주위를 **거의 한 바퀴 돌았다**는 뜻이다. 우리가 보는 "별"은
실제로 블랙홀 뒤편에서 출발해 한 바퀴를 돌아온 빛이다 — 우주의 가장 먼 우회로.
