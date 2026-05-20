# sub-phase 2-5 회고

**기간**: 2026-05-17 ~ 2026-05-20 (4일)
**범위**: 행성/태양 호버·클릭 인터랙션 + 카메라 추적 + 사용자 OrbitControls 양도 + [🎥] 카메라 home 리셋 + [↺] 통합 리셋에 카메라 포함

---

## 잘된 점

- **Body 추상 도입** (`BodyId = PlanetId | 'sun'`). PlanetId 에 'sun' 끼우는 *코드 거짓말* 회피 — 'sun' 은 행성이 아닌 별. 미래 'moon' 도 자연 확장. 합집합이 *상호작용 도메인* (카메라 추적 대상) 의 enum 이라 store 가 책임지는 결.
- **호버/선택 라벨의 두 단계 UX**. *호버 = 빠른 인식 (이름만), 클릭 = 의도적 탐험 (이름 + tagline)*. sub-2-4 의 *reset 통합 vs 카메라 리셋 분리* 와 같은 결 — *비슷한 의도라도 두께가 다르면 다른 액션*.
- **store 패러다임의 다층 일관 확장**. sub-2-3 *증분→절대 시간* → sub-2-4 *mode + changedAt, progress derived* → sub-2-5 *trigger timestamp 만 store, 카메라 위치는 컴포넌트 derived*. 같은 결, 세 층 위.
- **두 trigger union (body | home) + 작성 순서로 충돌 해소**. [🎥] 누름 = selectedBodyId=null + cameraResetRequestedAt=now 동시 set. 두 useEffect 모두 발화하지만 *나중 작성된 게 이긴다* — 복잡한 상태 머신 없이 React 의 자연 흐름으로 정리.
- **단일 source of truth (`data/camera.ts`)**. Scene 의 Canvas 초기 position + CameraController 의 home 보간 목표가 *같은 상수* 가리킴. 미래 home 변경 시 한 곳만 수정.
- **yieldCameraControl 의 깔끔한 이름**. *카메라 자동 제어 양도* — 의도가 이름에 담김. deselectBody (제거됨) 의 *애매한 의미* 보다 *무엇을 하는지* 명확.
- **isSelected selector 의 reference equality**. `(s) => s.selectedBodyId === data.id` 가 boolean 반환 → 다른 천체 선택 시 re-render X. zustand 의 자연 패턴이지만 *8개 행성 + 태양* 의 매 재선택마다 9 컴포넌트 re-render 피함의 가치.
- **OrbitControlsLike 최소 인터페이스**. three-stdlib 직접 의존성 추가 없이 `.target + .update()` 만 필요한 만큼 cast. *deps 줄이고 결합도 낮춤*.
- **text-shadow 라벨**. 박스 가림 회피 + *별빛처럼 떠 있는* 우주적 톤. *기능 요구 (가독성) + 영혼 (Phase 2 의 살아있는 우주)* 동시 충족.
- **사용자 의도 *짐작 X, 짧게 묻기 O*** 원칙 유지. 호버/클릭 분리 결정도 권이건의 *"호버 시에는 이름만 나오게 하고 클릭 시에 설명이랑 같이"* 한 줄로 풀림. 짐작했으면 *호버에 다 띄우는* 어색 그대로 갔을 것.

---

## 막힌 점 / 트러블슈팅

### 1. 라벨 박스가 우주 배경 가림
- **문제**: Light 3 초기 라벨이 *검은 박스 + 보더 + backdrop-blur* — 별과 행성 텍스처를 약하게 가림. 권이건 *"라벨 때문에 배경이 가려지는 건 좀 싫은데"*.
- **원인**: 배경에 *대조 만들려고* 박스 깔았지만 *Phase 2 의 영혼 (살아있는 우주)* 와 충돌. *글자 가독성* 만 필요한데 *전체 박스* 가 과잉.
- **해결**: 박스 제거. 글자 자체에 text-shadow 다층 (`0 0 4px black, 0 0 10px black, 0 1px 2px black`). 어두운 배경에선 약간의 글로우, 밝은 배경 (태양) 에선 검은 외곽이 글자 분리.
- **교훈**: *기능 요구 (가독성)* 를 *최소 침습* 으로 풀 것. 박스는 *글자 분리* 의 한 방법이지만 *유일한* 방법은 아님. text-shadow 는 *글자에만* 영향 → 배경 그대로.

### 2. 호버 라벨에 tagline 까지 같이 보이면 난잡
- **문제**: Light 4 초기 — 호버 시 *이름 + tagline* 둘 다 표시. 권이건 *"이것 너무 난잡해보여서"*.
- **원인**: *호버 = 한 번에 모든 정보* 의 직관이 *시각 노이즈* 로. 8개 행성 + 태양 모두 호버 시 *두 줄 라벨* 이 흩어지면 *어디 봐야 하나* 모호.
- **해결**: 호버/선택 두 단계 분리. 호버 = 이름만 (살짝 미리보기), 선택 = 이름 + tagline (의도적 탐험). zustand selector `(s) => s.selectedBodyId === data.id` 로 *자기 선택 여부만* 구독.
- **교훈**: *UX 의 깊이* 가 *상태의 깊이* 와 일치. 호버와 선택이 *다른 사용자 의도* 라면 라벨도 *다른 두께*. Google Maps, GitHub 등의 *호버 = 살짝, 클릭 = 전체* 패턴의 자연.

### 3. [🎥] 와 OrbitControls 가 둘 다 "selection 해제" 라 충돌
- **문제**: 사용자 OrbitControls 만지면 → deselectBody (Light 6). [🎥] 누름 → 카메라 home 보간 필요. 둘 다 *selectedBodyId=null* 로 표현하면 *home 보간인지 손 떼기인지* 구분 X.
- **원인**: 한 state 변화 (selectedBodyId=null) 가 *두 다른 의도* (양도 vs home 복귀) 를 담으려 함. *상태 1개 = 의도 1개* 의 원칙 위반.
- **해결**: store 에 별도 timestamp `cameraResetRequestedAt` 추가. 세 가지 카메라 모드:
  - 추적: `selectedBodyId != null`
  - home 보간: `selectedBodyId == null + cameraResetRequestedAt = 최근 timestamp`
  - 사용자 자유: `selectedBodyId == null + cameraResetRequestedAt = -Infinity`
- 두 액션:
  - `resetCameraView()` = [🎥] 호출. 선택 해제 + cameraResetRequestedAt=now
  - `yieldCameraControl()` = OrbitControls onStart 호출. 선택 해제 + cameraResetRequestedAt=-Infinity
- **교훈**: *두 의도가 한 state 로 모이려 하면 state 가 잘못 잡힌 것*. *trigger 자체* 도 state — sub-2-4 의 changedAt 결 그대로 카메라에 확장.

### 4. CameraController 의 두 trigger 충돌 — 작성 순서로 해소
- **문제**: [🎥] 누름이 *selectedBodyId=null + cameraResetRequestedAt=now* 동시 set. CameraController 의 두 useEffect 모두 발화 — 어느 게 이겨야?
- **원인**: 두 effect 가 *같은 transitionRef.current* 를 set. 두 가지 set 의 순서가 결과 결정.
- **해결**: cameraResetRequestedAt effect 를 *아래에 작성*. React 의 effect 발화 순서 = *작성 순서*. *나중 발화가 이긴다* — home 보간이 이김. *복잡한 우선순위 머신 없이 코드 위치 하나로*.
- **교훈**: React 의 *자연 흐름* (작성 순서) 를 활용하면 *제어 구조 의식적으로 만들 필요* 없음. 단, *주석에 명시* — 미래에 effect 순서 바꾸려는 사람을 위해.

### 5. OrbitControls 타입 — three-stdlib 직접 의존 회피
- **문제**: `useThree((s) => s.controls)` 의 반환 타입이 `THREE.EventDispatcher<...> | null` 추상. `.target` + `.update()` 접근 위해 cast 필요.
- **원인**: drei 가 OrbitControls 의 *구체 타입* 을 export 안 함. three-stdlib 직접 import 가능하지만 *transitive deps* 라 미래 drei 변경 시 깨질 위험.
- **해결**: 최소 인터페이스 `OrbitControlsLike { target: THREE.Vector3; update(): void }` 직접 선언. 필요한 두 멤버만. deps 의존성 0.
- **교훈**: *외부 라이브러리 타입* 이 정확히 export 안 될 때 — *내가 쓰는 부분만 직접 정의* 가 가장 안전. 미래 라이브러리 변경의 영향 표면 최소.

---

## 리팩토링 후보

- **`initialAngle` 계산 중복**. Scene + CameraController 두 곳에서 `(index / PLANETS.length) * Math.PI * 2`. 헬퍼 `getInitialAngle(planetId)` 를 `data/planets.ts` 끝에 추출 가능. 단일 source.
- **ControlPanel 버튼 className 중복**. 진실 토글 3개 + 리셋 2개 모두 `h-10 ... text-white/80 hover:bg-white/10` 패턴. `<ToggleButton>` / `<IconButton>` 추출 가능 — sub-2-6 UI 마무리.
- **BodyLabel inline style → Tailwind v4 utility**. text-shadow 가 Tailwind v3 기본에 없어 inline. Tailwind v4 마이그레이션 시 `text-shadow-md` 같은 utility + `text-cosmos-text` 매핑.
- **키보드 단축키 (D=거리 / T=자전 / A=전체 / C=카메라 리셋)**. PRD §6 의 *접근성* 항목. sub-2-6 보류 그대로.
- **HMR 후 상태 유지 디버그**. sub-2-4 의 보류 그대로 — ControlPanel mount reset 의 *우회* 가 작동하므로 사용자에 영향 X. 디버그는 5분 옵셔널.
- **leva 'Time (dev)' dropdown 동기화**. sub-2-3 보류 그대로.

---

## 다음 sub-phase 적용 교훈

- **사용자 의도 *짐작 X, 짧게 묻기 O*** — sub-2-4 교훈 그대로. 호버/클릭 분리도 권이건의 *한 줄* 로 풀림.
- ***UX 의 깊이* 와 *상태의 깊이* 가 일치**해야 자연. 사용자 의도가 두 종류면 state 도 두 종류, UI 도 두 종류.
- **두 의도가 한 state 로 모이려 하면 state 가 잘못 잡힌 것**. sub-2-5 의 *카메라 리셋 vs 사용자 양도* 처럼 — *별도 timestamp* 추가가 답.
- **React 의 자연 흐름 (작성 순서) 활용**. 복잡한 우선순위 머신 만들기 전에 *코드 위치* 로 해결되는지 검토.
- ***기능 요구* 의 *최소 침습* 표현 찾기**. 박스 → text-shadow 처럼, *Phase 의 영혼* 을 안 깨면서 기능 만족.
- **외부 라이브러리 타입 추상 — 최소 인터페이스 직접 선언**. transitive deps 회피 + 영향 표면 최소.
- **`as const` + 튜플 (readonly [number, number, number])** 로 *불변 상수* 표현. THREE.Vector3 직접 두면 mutable 위험 — 컴포넌트에서 매번 새 인스턴스.
- **sub-phase 종료 시 *수정사항 모아 한 번에***. 권이건의 *"이번 페이즈 끝까지 하고 수정하고 싶은 부분 말해줄께"* 패턴 — 진행 중 중단보다 *Light 묶음 완료 후 검토* 가 흐름 깔끔. (이번엔 수정사항 0이었지만 패턴 자체가 좋음.)

---

## 🌌 이번에 알게 된 우주의 한 조각

**천체 관측 시점의 의미 — 카메라 추적은 코페르니쿠스 시점 이동의 디지털 재연.**

sub-2-3 에서 *케플러 비례*, sub-2-4 에서 *비례의 비례 + 자전 차원* 을 만났다면, sub-2-5 는 *관측자의 시점* 차원.

지구에서 본 *화성의 역행 운동* — 화성이 어느 시점에 *뒤로 가는 듯한* 궤적을 그리는 현상. 프톨레마이오스 (서기 150년) 는 이걸 *epicycle (주전원)* 으로 설명 — *화성이 작은 원 안에서 도는데 그 작은 원이 다시 지구 주위를 돈다*. 매우 복잡.

코페르니쿠스 1543년 *De revolutionibus*: *관측자의 시점을 이동* 하면 모든 게 단순해진다 — 지구도 행성, 모두 태양 주위를 돈다. 화성의 역행은 *지구가 화성보다 빨라서* 생기는 *추월의 착시*. 화성 시점에서 보면 *그냥 단순한 원*.

권이건의 카메라 추적 = **관측 좌표계 이동의 디지털 재연**.
- 자유 카메라 = 태양 시점 (코페르니쿠스)
- 지구 클릭 = 지구 시점으로 잠시 이동 (프톨레마이오스의 한정된 진실)
- 화성 클릭 = 화성 시점 — *지구가 어떻게 보이는가*

*시점 이동은 본질을 바꾸지 않는다. 다만 현상의 모양을 완전히 바꾼다.*

**관련 이정표**:
- **1543 코페르니쿠스** — *시점 이동* 의 첫 글
- **1609 케플러** — *움직임의 수학* (제3법칙)
- **1610 갈릴레오** — *시점 이동의 도구* (망원경 + 갈릴레이 위성)
- **1687 뉴턴** — *모든 시점에서 같은 법칙* (관성, 중력)
- **1990 보이저 1호** — *시점 이동의 극단* (60억 km 밖에서 지구를 본 *Pale Blue Dot*)

**부가**:
- **`yield` 의 의미**. 사용자 OrbitControls 만지면 카메라 자동 제어 *양도* — *yield* 가 *내어주다* + *수확하다* 두 의미. 자동화 자원을 사용자에 *내어주고*, 사용자는 *자기 의도 수확*. 한 단어에 *주체 전환* 의 결.
- **트랜지션의 *지각***. 1.5초 easeInOutCubic 보간이 *사람 눈에 자연스러운* 이유 — 인지 심리학의 *minimum noticeable transition* 이 약 1초. 그 위에 *부드러운 마무리* 의 0.5초. 너무 빠르면 *시점이 갑자기 바뀐 느낌*, 너무 느리면 *기다림*. 1.5초가 *시점 이동의 의미를 인지하면서도 답답하지 않은* 황금 구간.
- **단일 source of truth (`data/camera.ts`) 의 우주적 의미**. Scene 초기 위치 + home 보간 목표가 *같은 상수* — *집의 정의는 하나*. 미래에 home 을 옮긴다면 *모든 카메라 액션이 그 한 점으로* 자동 정렬. 칸트의 *transcendental unity of apperception* 같은 결 — *하나의 통일된 원점*.

---

## 다음 sub-phase 시작점

**sub-2-6: 달 추가 + 키보드 단축키 + UI 정제 (PRD §4 2번 + §6 추정)**

PRD §4 항목 점검:
- ✅ 1: 8개 행성 + 태양 + 고리 (sub-2-2)
- ⬜ **2: 달 (지구의 위성)** ← sub-2-6 핵심
- ✅ 3: 진실 토글 + 프리셋 (sub-2-4)
- ✅ 4: 시간 컨트롤 (sub-2-3)
- ✅ 5: 행성 호버/클릭 + 카메라 (sub-2-5)
- ✅ 6: starfield (sub-2-3 [Light 8])

남은: **달**. 그리고 *PRD §6 키보드 단축키* (모드 + 카메라 리셋).

**첫 PCTC Plan 핵심 질문**:
1. **달의 구조** — 지구의 *공전 group 자식* 으로 둘 것인가, 아니면 *별도 천체 + 지구 위치를 매 프레임 추적* 으로 둘 것인가? 전자가 단순 (지구 따라가지만 *지구 자전 영향 안 받게* 자전축 group 밖). 후자는 *달이 BodyId 합집합에 자연 추가* 가능.
2. **달 클릭 시 카메라 추적** — BodyId 에 'moon' 끼울 것인가? *PRD §3 영혼* 이 *지구 클릭하면 달까지 같이 보인다* 라 *달도 추적 대상* 이면 자연. 단 *지구 위치 + 달 offset* 의 추적은 CameraController 의 일반화 필요.
3. **달 데이터 어디** — `data/moon.ts` 별도 파일? 아니면 `PlanetData.satellite?` 옵션 필드?
4. **키보드 단축키 충돌 검사** — D/T/A/C 가 다른 데서 안 쓰이는지 (R 은 reset 이미 사용). 검색 한 번.

**먼저 처리할 자투리**:
- HMR 디버그 (5분, 옵셔널 계속)
- 60fps 확인 (sub-2-5 끝물에 OK 확인 완료)
- (선택) initialAngle 헬퍼 추출 — sub-2-6 첫 Light 에서 자연 활용 가능
