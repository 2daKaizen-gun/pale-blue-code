# sub-3-4 Check — Preset selector

> Phase 3 — Gravity · Issue #21 · 2026-06-02

## 잘된 점
- **`gravityStore` 의 첫 무대 — 단방향이 깔끔히 섰다.** PresetSelector(Canvas
  밖) → store.presetId → GravityPage → Scene props → 자식. 매 프레임 리렌더
  0 (물리는 여전히 ref), store 는 *전환 순간에만* 관여. Phase 2 패턴의 N-body 판.
- **프리셋이 곧 학습 슬라이드가 됐다.** 태양계(real N-body) / 2체(타원) /
  2체 원(sub-3-2 검증 궤도) / figure-8 / 쌍성 — 각 버튼이 *다른 질문*을 던짐.
  PRD §3 "Phase 2 재방문" 의도가 디폴트 = 태양계로 살아남.
- **IC 를 기억 아닌 적분으로 박았다.** figure-8(Moore 1993) 의 magic number 를
  믿지 않고 한 주기 적분 → 복귀 5e-8 / 에너지 2.6e-13 확인 후 커밋. 쌍성·태양계도
  동일하게 적분 사전 검증 (폭발 0, 지구 1.002 AU 유지). PRD §5 "figure-8 안
  건드리면 영원히 8자" 가 *우연이 아니게* 됨.
- **데이터/preset 레이어 분리 유지.** `mass_kg` 는 planets.ts/sun.ts 에 *real
  값으로*, 정규화(AU·M_sun·G=1)는 preset 레이어가. data 철학 안 깨짐.

## 막혔던 점 / 트러블슈팅

### 1. 같은 부모 형제에 동일 key → unmount 실패 → GPU 누수 → Context Lost (배선 핵심)
- **문제**: 프리셋 전환을 반복하면 옛 궤적이 화면에 쌓이고, FPS 그래프 최저값이
  60 → 6 → 4 로 폭락, 콘솔에 `THREE.WebGLRenderer: Context Lost` 반복.
- **원인**: 카메라·컨트롤·Trails·Bodies 형제 4개에 *같은* `key={presetId}` 를
  부여. React 는 *같은 부모의 형제끼리* key 가 유일해야 하는데 중복 →
  `Encountered two children with the same key` → 옛 노드가 깨끗이 unmount 되지
  않음 → Trails 의 cleanup(geometry/material dispose)이 안 돌아 *GPU 버퍼 누수*
  → 컨텍스트 손실.
- **잘못 짚은 가정**: tsc(strict + erasableSyntaxOnly + verbatimModuleSyntax)가
  *전부 초록*이라 "타입 통과 = 정상" 으로 봤음. 런타임 unmount/teardown 은
  타입체커가 못 보는 층.
- **해결**: ① 형제 key 를 *고유 prefix* 로 분리 (`trails-${id}` / `bodies-${id}`).
  ② 카메라·컨트롤은 *애초에 remount 하지 않음* — `CameraRig` 가 useThree +
  useEffect 로 position/far/min·max 만 *명령형 갱신*. 카메라/컨트롤은 Canvas
  수명 내내 하나로 유지, 새로 만들 건(버퍼) 만 새로.
- **교훈**: **`key` 는 형제 *식별자*다 — 같은 부모 형제에 같은 값 금지.**
  "remount 트리거" 로 쓰려면 노드별 고유해야 함. 그리고 **tsc 초록 ≠ 런타임
  정상**: WebGL teardown 은 *화면 + 콘솔이 정본* (인계서가 "WebGL 은 사람이
  검증" 이라 명시한 정확한 이유).

### 2. 전환 순간 bodiesRef ↔ presetBodies 길이 어긋남 → Trails 크래시
- **문제**: `Trails.tsx Cannot read properties of undefined (reading 'buffer')`.
- **원인**: bodiesRef 재초기화를 `useEffect([preset])`(commit 이후)로 했는데,
  key-remount 된 Trails 는 이미 새 presetBodies(개수 B_new)인데 bodiesRef 는
  잠깐 옛 상태(B_old). 태양계(9)→2체(2) 전환 시 Trails 가 i<9 루프, resources 는
  2개 → `resources[i]` undefined.
- **해결**: ① bodiesRef 를 *렌더 중 동기* 재초기화 (이전 presetId 를 ref 로
  추적, 바뀌면 자식 렌더 *전*에 갱신) → 타이밍 갭 제거. ② Trails 에 `if (!r)
  continue` 한 줄 방어 (Bodies 의 `if(!mesh)continue` 와 동일 패턴, 검증된
  ring-buffer 동작 불변).
- **교훈**: *mutable ref* 와 *render-driven 자식* 이 같은 개수를 봐야 할 땐,
  ref 갱신을 commit-이후(useEffect)가 아니라 *렌더 중 동기* 로 해야 자식과
  프레임이 안 어긋난다. 1번의 *2차 증상* 이었음 — 근본(key)부터 잡으니 같이 정리됨.

### 3. (pre-3-4 핫픽스) erasableSyntaxOnly — RingBuffer 파라미터 프로퍼티
- **문제**: 3-3 push 후 Vercel 빌드 `error TS1294 ... erasableSyntaxOnly`.
- **원인**: `constructor(public readonly capacity: number)` 가 런타임에
  `this.capacity = capacity` 를 *생성* → 지움가능 문법 규칙 위반. Vitest(esbuild)는
  타입 무시라 통과, `tsc -b` 만 잡음 (sub-2-3 "Vitest passes, build fails" 재발).
- **해결**: 필드 선언 + 본문 대입으로 전환. 재현 테스트로 col 15 = 파라미터
  프로퍼티 확정 후 수정.
- **교훈**: push 전 `npm run build`(=`tsc -b`) — test 만으론 못 잡는 층이 있다.

### 4. 카메라 reframe — Canvas `camera` prop 은 mount-only
- 프리셋마다 스케일이 달라(2체 ~unit ↔ 태양계 ~수십 AU) 카메라를 갈아야 하는데,
  R3F `<Canvas camera={{}}>` 는 mount 시 1회만 적용 → 전환해도 안 바뀜.
- 해결: `CameraRig` 가 명령형으로 camera.position/far + controls.target/min/max +
  update(). 초기 프레이밍만 Canvas prop 으로 첫 프리셋 값 전달(플래시 방지).

## 리팩토링 후보
- **태양계 카메라 기본 거리(`[0,0,16]`)** — 내행성 중심 프레이밍. 천왕성/해왕성은
  줌아웃 필요. 3-6 timeSpeed + 줌 프리셋 도입 시 재평가.
- **`CameraRig` 의 controls 캐스팅** (`as unknown as OrbitControlsImpl`) — useThree
  의 controls 타입이 느슨. drei 타입 정리되면 캐스팅 제거 가능.
- **Trails `useMemo([n])`** — 이제 key-remount 가 갈아끼우므로 `[n]` dep 는 사실상
  잉여(remount 가 항상 새로 만듦). 유지(이중 안전망) vs 제거 — 3-5 진입 시 판단.
- **`mass_kg` 단위** — 현재 kg(real). preset 이 M_sun 정규화. 미래 Phase 5 가
  다른 단위 필요하면 변환 함수로 분리.

## 다음 sub-phase(3-5 = 적분기 토글)에 적용할 교훈
- **`gravityStore` 에 `integrator: 'rk4' | 'euler'` 추가** — 자리는 이미 마련됨.
  Integrator 의 `TIME_SPEED` 상수 옆에 분기. useFrame 안 `getState().integrator`.
- **에너지 readout = Canvas 밖 컴포넌트** — store 구독, useFrame 아닌 가벼운
  주기 갱신(또는 ref→DOM). PRD §4-5 "수치 병기".
- **Euler 발산이 *영혼*** — two-body.test.ts Light 7 이 이미 회귀로 박아둠
  (Euler 에너지 오차 ≫ RK4). 토글이 그 테스트의 *시각판*.
- **tsc 초록 후에도 반드시 브라우저 왕복** — 3-4 가 뼈저리게 가르친 것.

## 🌌 이번에 알게 된 우주의 한 조각

- **figure-8 은 "없는 줄 알았던 답".** 3체 문제는 *일반 닫힌해가 없다* — 뉴턴
  이후 300년간 수치적분으로만 미래를 알 수 있었다. 그런데 1993년 Moore 가
  컴퓨터로, 2000년 Chenciner–Montgomery 가 수학적으로 — 세 같은 질량이 *하나의
  ∞ 곡선* 위를 영원히 쫓는 *정확한 주기해* 하나를 찾아냈다. 일반해는 없어도
  *특별한 해* 는 존재한다는 것. 우리 화면의 그 8자는 인류가 *발견한* 우주의
  한 조각이고, 우리는 그 IC 를 적분해 *닫히는 것* 까지 직접 확인했다.

- **쌍성의 흔들림 = 외계행성 검출의 씨앗.** 쌍성 프리셋에서 가벼운 별이 더 크게
  돌고 무거운 별은 *작게 흔들린다* — barycenter 둘레의 공전. 이 "별의 흔들림"
  이 바로 radial velocity 법: 멀리서 행성은 안 보여도, 행성 때문에 *별이
  흔들리는 것* 은 도플러로 잡힌다. 1995 페가수스 51. Phase 5 의 원리를 지금
  화면에 *작은 단위로* 그려둔 셈.

- **태양계를 "그려주지" 않고 "풀었다".** Phase 2 는 행성을 정해진 궤도에 올려
  돌렸다. 3-4 태양계 프리셋은 real 질량·거리만 주고 `F = G·m₁·m₂/r²` 으로 *스스로*
  돌게 했다 — 같은 화면, 전혀 다른 출처. 케플러의 결과가 뉴턴의 법칙에서 *연역*
  되어 나오는 걸 *디폴트 첫 화면* 으로 보게 된 것.
