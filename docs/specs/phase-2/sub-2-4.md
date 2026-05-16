# sub-phase 2-4 회고

**기간**: 2026-05-15 ~ 2026-05-16 (2일)
**범위**: 진실 토글 (거리 + 자전) + 전체 진실 프리셋 + 1.5초 easeInOutCubic 보간 + reset 통합 (시간 + 모드)

---

## 잘된 점

- **store 패러다임의 자연 확장**. sub-2-3 의 *증분→절대 시간* 이 *보간 상태* 까지 *형태 유지* 한 채 확장. `progress = derived(now, changedAt)` 은 `position = derived(simulationDays, period)` 의 미러. *같은 결, 한 층 위*.
- **tsc 검증 환경 구축**. 헌장 §9 *환각 방지* 의 도구화 — 머릿속 시뮬 대신 *실제 컴파일러*. `/home/claude` 의 React 19 + strict + noUnusedLocals 환경. sub-2-5 이후 매 Light 마다 재사용.
- **사용자 피드백 → 수치 진단 → 최소 변경 fix**. sub-2-3 [Light 3] *수성/금성 멈춤* → *천문학적 진실* 진단의 결을 그대로. 이번엔 *수성 박힘 + 자전 임팩트 약함* → *distanceScale 보간 + exp 0.3 강화* 두 라이브러리 수치만 변경.
- **함수 책임 분리**. `getVisualRotationPeriod` (압축), `getInterpolatedRotationPeriod` (보간), `getEffectiveRotationPeriod` (좌표계 보정) — 한 함수 한 일. lerp 도 단독. *합성으로 깊이*.
- **PCTC Plan 의 핵심 질문 → 동의 → 진행** 흐름 정착. *보간 progress 는 store derived* 결정이 작업 시작 전 명시적으로 풀린 게 흔들림 없는 진행의 기반.
- **사용자 도구 (ControlPanel) ↔ 개발자 도구 (leva)** 분리 유지. 모드 토글은 사용자 도구로만, leva 추가 X.
- **reset 의 통합 책임**. 한 액션이 *시간 + 모드 + mount 자동* 셋 다 책임. *사용자 의도와 일치한 단순함*.

---

## 막힌 점 / 트러블슈팅

### 1. vitest 통과 ≠ tsc 통과 (미사용 변수)
- **문제**: Light 3 테스트의 `const dMid = computeVisualDistance(...)` 가 vitest 통과, Vercel 빌드 실패.
- **원인**: vitest 는 esbuild 트랜스파일러로 *느슨*, tsc 는 `noUnusedLocals: true` *엄격*. CI/배포는 tsc 가 먼저.
- **해결**: 변수 삭제. *교훈은 도구화* — 이후 *내 환경에서 tsc 직접 실행*. WORKFLOW.md *Check 직후 마무리 스텝* 에 *"push 전 build 통과 확인"* 추가 검토.

### 2. React 19 의 `useRef` 반환 타입 엄격화
- **문제**: `useRingRotation(meshRef: RefObject<THREE.Mesh>)` 시그니처 → 호출 측 `useRef<THREE.Mesh>(null)` 반환은 `RefObject<THREE.Mesh | null>`. 타입 좁힘 시도 → tsc 거부.
- **원인**: React 19 의 `useRef(null)` 반환 타입이 `RefObject<T | null>` 로 단일화.
- **해결**: 매개변수 타입을 `RefObject<THREE.Mesh | null>` 로 명시. early return null 가드 유지.
- **교훈**: 타입 추측 X, 환경에서 검증.

### 3. 거리 visual scale 20 + real exp 1.0 = 수성 박힘
- **문제**: real 모드의 수성 거리 `0.387 × 20 = 7.74` < 태양 반지름 `10.45` → 수성이 *태양 안* 으로 시각적 충돌. PRD §3 정신과 어긋남.
- **원인**: distanceExponent 만 보간, distanceScale 정적. 비례 풀리는데 스케일 그대로면 *작은 거리 행성* 이 *태양 안* 으로.
- **해결**: distanceScale 도 보간 대상 추가 (visual 20 ↔ real 80). 수성 real 거리 `0.387 × 80 = 30.96` → 태양 반지름의 *3배 밖*. 해왕성은 *2404* 로 화면 밖 → PRD §3 *길을 잃는다* 의 영혼 실체화.
- **교훈**: *수학적 정확* 과 *시각적 진실* 의 트레이드오프. PRD 영혼이 우선.

### 4. visual 자전 sqrt 압축이 너무 약함 (사용자 피드백)
- **문제**: 권이건 보고 — *자전 토글 변화 별로 없음*. 수치 시뮬: 수성 visual 184h ↔ real 1407.6h = 7.6배 차이지만, visual 도 거의 안 도는 상태 (1초당 13% 회전) 라 real 가도 *체감 차이 약함*.
- **원인**: sqrt 압축 (exp=0.5) 이 *극단값에 충분히 강하지 않음*. 케플러 비례 *완화* 가 *너무 부드러움*.
- **해결**: `getVisualRotationPeriod` exponent 0.5 → 0.3. 수성 visual 81h (real 과 *17배 차이*), 목성 visual 18.4h (real 과 *1.85배 차이*). *PRD §3 수성 멈춤 + 목성 광속* 의 수학적 실체.
- **교훈**: 사용자 *체감* 피드백 → *수치 비율* 로 정량 진단. *별로 변화 없음* 도 *visual/real 비율 계산* 으로 검증 가능.

### 5. reset 의 책임 분리 → 통합 (사용자 의도 잘못 짚음)
- **문제**: 권이건 *"새로고침하면 진실 다 해제"* → 내가 *"시간만 리셋 = R 버튼"* + *"모든 것 리셋 = resetAll on mount"* 로 *두 책임 분리* 시도. 권이건이 *R 버튼 눌렀는데 진실 안 풀림* 보고. 의도 어긋남.
- **원인**: 권이건의 *"새로고침"* = *"R 버튼 = 다 처음"* 의도였는데, 내가 *F5 새로고침* 으로 해석하고 *추가 액션* 분리. *YAGNI 위반* — 미래에 필요할 수도 있는 기능을 *지금* 끼워넣음.
- **해결**: `resetAll` 제거. `reset` 이 *시간 + 모드* 둘 다 리셋. ControlPanel mount 시 useEffect 도 `reset` 호출. 한 액션이 *모든 시작점 (R 버튼 + ↺ 버튼 + 페이지 진입)* 책임.
- **교훈**: 사용자 의도 *짐작* 으로 기능 분리 X. *"한 액션이면 한 의도"* 가 우선. 미래에 *분리* 필요해지면 그때 추가. YAGNI.

### 6. Ring 의 동적 prop 전달 문제
- **문제**: Planet 이 매 프레임 *동적 effectiveRotationPeriod* 계산 → Ring 에 어떻게 전달? prop 매 프레임 변경하면 60fps re-render.
- **해결**: Ring 시그니처 변경 (`parentRotationPeriodHours: number` → `parent: { rotationPeriod_hours, axialTilt_deg }`). Ring 이 *자체로 store 구독* 해 같은 보간 로직 적용. 매 프레임 prop 변경 0, re-render 0.
- **교훈**: *동적 값* 을 prop 으로 전달하지 말 것. *원본 데이터 + 자체 구독* 패턴이 React Three Fiber 의 결.

---

## 리팩토링 후보

- **HMR 후 상태 유지의 진짜 원인 미확인** — `reset on mount` 로 우회. *왜* 알면 더 좋음. sub-2-5 진입 시 5분 디버그 후보.
- **`ringParent` 인라인 객체** — Planet 함수 본문에서 매 렌더 새 객체. Planet 자체 re-render 거의 없어 OK 지만 `useMemo` 가능.
- **ControlPanel 토글 버튼 3개 중복 코드** — 같은 className 패턴 반복. `<ToggleButton>` 추출 가능. sub-2-6 UI 마무리 시점.
- **키보드 단축키 (D=거리/T=자전/A=전체)** — Plan 의 sub-2-5/6 보류 그대로.
- **leva 'Time (dev)' dropdown 동기화** — sub-2-3 회고 그대로 보류.

---

## 다음 sub-phase 적용 교훈

- **vitest 통과 ≠ tsc 통과**. push 전 `npm run build` 필수.
- **타입 추측 X, 환경에서 검증**. `/home/claude` 의 tsc 환경 sub-2-5 이후 매 Light 마다 실행.
- **사용자 *체감* 피드백은 *수치* 로 진단**. *별로 변화 없음* 같은 *주관* 도 *비율 계산* 으로 정량 검증.
- **store 의 *상태 최소화* 패러다임 일관**. progress 같은 *derived value* 는 매 프레임 계산. *저장* 은 *변경 사실* (`changedAt`) 만.
- **함수 한 가지만 책임 + 합성으로 깊이**. 함수 시그니처에 *mode* 같은 분기 매개변수 넣고 싶을 때 잠시 멈추고 *분리* 검토.
- **사용자 피드백 받기 전 코드를 *완성* 으로 선언하지 X**. Light 9 끝났을 때 *Code 완료* 가 아니라 *Test 시작*.
- **문서 갱신은 sub-phase 종료의 일부**. PRD/TechSpec/HANDOFF/check 갱신 안 하면 sub-phase 끝난 게 아님.
- **YAGNI — 미래 분리 가능성에 *지금* 책임 쪼개지 말 것**. *한 사용자 의도 = 한 액션* 부터. 분리는 *진짜 두 의도가 나뉘는 시점* 에. (reset/resetAll 분리 시도 → 통합 의 교훈)
- **사용자 의도 해석은 *짐작 X, 짧게 묻기 O***. *"새로고침하면 진실 해제"* 의 *"새로고침"* 이 F5 인지 R 버튼인지 30초만 확인했으면 분리 시도 자체가 없었음.

---

## 🌌 이번에 알게 된 우주의 한 조각

**케플러 비례의 *두 차원* 과 *비선형 폭증의 일관성*.**

sub-2-3 에서 *공전 주기² ∝ 거리³* 의 *케플러 제3법칙* 을 시각으로 처음 만남. 이번 sub-2-4 는 그 비례가 *공전* 만이 아니라 *자전* 에도 똑같이 작용함의 발견.

- **공전**: 수성 88일 ↔ 해왕성 60182일 = **684배** (실제 모드 시간 차이)
- **자전**: 목성 9.93시간 ↔ 금성 5832.5시간 = **587배** (실제 모드 자전 차이)
- **거리**: 수성 0.387 AU ↔ 해왕성 30.05 AU = **78배** (3차원의 공간)

**비례의 비례**. 우주는 *균일* 하지 않다. *어떤 천체* 에선 1초가 지나는데, *다른 천체* 에선 한 시간이 같이 지난다. 행성마다 *자기 시계* 가 있고, 그 시계의 속도는 *케플러의 법칙이 정하는 비례* 에 따른다.

권이건의 1.5초 보간 = **케플러가 16년 동안 티코 브라헤 데이터 분석하며 깨달은 *비선형 직관* 의 압축된 재연**. 사용자가 *"전체 진실"* 버튼 누르는 그 1.5초 = 1619년 케플러의 *"아 — 비례가 *이렇게*"* 의 순간.

**부가**:
- **자전 압축 sqrt → cube root 가까이 (0.3)** = 천문학에서 log scale 흔히 쓰는 이유. 극단값을 *볼 수 있게*. 인간 인지는 *선형* 이라 *log 도구* 필요. 별의 등급도 log, 데시벨도 log, pH 도 log.
- **distanceScale 까지 보간** = *상대 비율* 과 *카메라 시야* 의 분리. 상대 비율은 *진실*, 시야는 *우리가 선택하는 창*. 두 차원이 한 토글 안에 있음.
- **부호 보존 sqrt 압축** = 금성/천왕성 *역회전이 visual 모드에서도 유지*. 시각화는 *현상을 압축하되 본질을 비틀지 않음*.
- **mode + changedAt 만 저장, progress 는 derived** = *상태 최소화* 의 철학. 메모리는 *사실* 만 보관, *시간 함수* 는 *계산*. 데이터베이스 정규화의 본질과 같은 결.
- **reset 한 액션의 통합 책임** = *시작점은 하나*. 빅뱅이 하나면 시간도 모드도 한 시각에서. *분리* 는 *나중 우주* 에서 갈라짐.
- **easeInOutCubic 의 양 끝 도함수 0** = *시작과 끝의 부드러움*. 인간이 *움직임을 인지* 하는 방식과 일치. 모든 자연 현상이 *툭 시작/끝* 이 없는 이유 — 관성.

---

## 다음 sub-phase 시작점

**sub-2-5: 행성 호버/클릭 + 카메라 줌인/리셋** (PRD §4 추정)

- 행성에 hover → 정보 패널 (Three.js raycaster + drei `<Html>`)
- 행성 click → 카메라가 부드럽게 줌인 (drei `<OrbitControls>` 또는 custom tween)
- 지구 click → 달까지 함께 보이는 frame
- 카메라 리셋 버튼 (현재 ControlPanel 에 *전체 reset* 만 있음, 카메라 리셋 추가)
- **첫 PCTC Plan 핵심 질문 1**: 카메라 줌인 — *행성 따라가는가* (공전 중에도 추적, 까다로움) vs *위치 스냅* (정지, 단순)?
- **첫 PCTC Plan 핵심 질문 2**: 호버 정보 패널 — 어디에? 마우스 옆? 행성 옆 라벨? 사이드바?
- **첫 PCTC Plan 핵심 질문 3**: 카메라 리셋이 *전체 reset* 과 분리되는가, 합쳐지는가? (sub-2-4 reset 통합 교훈 적용 — *사용자 의도 먼저 확인*)

**먼저 처리할 자투리**:
- HMR 후 상태 유지 디버그 (5분, 옵셔널)
- 60fps 확인 (Chrome DevTools Performance)
- (선택) Vercel push 후 Live URL 시각 검증
