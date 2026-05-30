# sub-3-3 Check — N-body scene + trails

> Phase 3 — Gravity · Issue #20 · 2026-05-31

## 잘된 점
- **sub-3-2의 *"실물이 정본"* 교훈을 *두 번 더* 확인.** 한 번은
  `lib/physics/{integrators.ts,gravity.ts,types.ts}` 받기 전 Plan 단계에서:
  실물 본 결과 **Plan 의 가장 큰 한 줄 — *in-place 어댑터 만들기* — 가
  통째로 사라짐.** rk4Step이 fresh SystemState 를 *반환* 하는 pure 함수라
  in-place 래퍼는 *코어를 다시 짜야 가능*, sub-3-2 가 명시 금지한 일.
  답은 *ref 교체*: `bodiesRef.current = rk4Step(...)`. pure 코어 0 수정.
  두 번째는 Light 2 `Scene.tsx` 작성 전 *솔라 Scene/Page* 받기 — Phase 2
  의 sub-2-7 [L3 fix] Context Lost 패턴을 *비트 단위로 미러*해야 함을
  확인 (3-3 은 텍스처 0 이라 안쪽 Suspense 불필요로 분기 — 다른 점도 명시).
- **점진적 시각 만족의 7 Light 리듬.** L2 *빈 우주*, L3 *두 점 정적*,
  L4 *움직임 시작*, L5 *TDD 9 증명서*, L6 *trail 그려짐*. 매 Light 가
  자기 *동작하는 가장 작은 단위* 를 갖춤. PCTC §6 정신.
- **Light 5 ring-buffer = sub-3-2 안전망 정신 연장.** 9 it() 가 Trails
  의 모든 시각 보장의 받침. 핵심 두 증명서:
    - *"iterates oldest→newest after wrap"* — Trails 가 시간 순으로
      페이드 칠하는 모든 것의 토대.
    - *"iteration index matches age"* — `alpha = idx/(len-1)` 가 *진짜
      나이* 임을 보증. 미래 누군가 인덱스 회전 깨면 빨강.
- **Plan→실제 차이를 *정직하게*.** sub-3-2 처럼 Plan 의 9 Light 가 7 로
  자연 합쳐짐 (어댑터 Light 삭제 + Scene+라우트 합침). *인공 분할이 아닌
  자연 단위*.

## 막혔던 점 / 트러블슈팅

### 1. drei Stars v10 매트릭스 깨짐 (Light 2)
- **문제**: 초기 `Scene.tsx` 가 검은 화면 + 콘솔 `THREE.WebGLRenderer:
  Context Lost`. /solar 는 정상.
- **원인**: drei `Stars` 가 R3F v9 + three 0.170 + drei v10 매트릭스에서
  *조용히* 안 그려짐. import 에러도 워닝도 없음.
- **해결**: bisect — bare Canvas + 박스 → 통과 → OrbitControls + Stars
  추가 → Stars 만 빼고 통과. Stars 제거 채택. 배경별은 3-3 본질 아니라
  Light 2 차단할 이유 0.
- **교훈**: drei 컴포넌트도 *매트릭스 의존성* 가짐. *조용한 실패* 가능 →
  bisect 디버그가 가장 빠른 길. 한 번에 다 켜지 말고 한 개씩.

### 2. 동심 trail = 같은 원 (Light 6)
- **문제**: 처음 `TWO_BODY` 가 sub-3-2 fixture (동질량 원궤도) 그대로였음.
  화면에 *원 하나*만 그려지고 두 trail 중 한쪽 색이 항상 안 보임.
- **잘못 짚은 원인 1**: *z-fight* 라고 생각. `depthTest: false` →
  여전히 안 보임.
- **잘못 짚은 원인 2**: *blending 문제* 라고 생각. `AdditiveBlending` →
  교차점이 *흰색으로 평준화*. 별 정체성 더 흐려짐. 사용자 *"색깔이 겹쳐"*
  피드백.
- **잘못 짚은 원인 3**: *render order* 라고 생각. `Line.position.z` 에
  per-body 0.001 stagger → 여전히 한 원만.
- **진짜 원인**: 두 trail 이 *기하학적으로 같은 곡선*. 동질량 원궤도라
  별 A 와 B 의 자취가 진짜 *같은 원* 위에 있음. 픽셀 덮기가 아니라
  *수학적 실재*. 모든 합리적 시각화가 같은 답을 줌.
- **해결**: 프리셋 자체를 *비대칭 + e=0.3* 로. 두 별이 *동심의 다른
  타원* 위를 돔. sub-3-2 fixture 는 `TWO_BODY_CIRCULAR` 로 별도 보존
  → 검증서 영혼 안 잃음.
- **교훈**: *그래픽 증상을 그래픽 원인으로 가정* 하지 말 것. **데이터
  자체가 같으면 어떤 시각화도 같은 답**. 세 번의 그래픽 fix 시도 후
  *입력 데이터* 로 시선 돌리니 5초 만에 풀림. 다음에 비슷한 증상 보면
  *입력 같지 않은지 먼저* 확인.

### 3. Plan 의 in-place 어댑터 — 안 만들어짐 (Light 1)
- sub-3-2 회고가 *"§3 in-place 래퍼는 3-3 에서 만든다"* 라고 했음.
- 실물 본 결과 *코어를 다시 짜야* 가능 → sub-3-2 가 금지.
- 결론: **회고는 *해야 할 일* 을 예측한 거고, 실물이 *그 일이 불필요*
  함을 말해줌**. ref 교체로 충분 — 무리렌더 보장 충분 (Phase 2 derived
  패러다임의 N-body 판).
- 교훈 (메타): *회고의 다음-단계 예언* 도 *실물 만나면 무너질 수 있는
  추측*. sub-3-2 가 lib/physics 실물 확보를 강조한 정확한 이유.

## 리팩토링 후보
- **drei Stars 매트릭스 복원** — 별 배경은 분위기 자산. drei docs 재확인 +
  필요시 버전 핀 / 대체. 3-4 또는 별도 chore Issue.
- **Z_STAGGER 의미** — 현재 *동심 trail 방어용* 으로 한 줄 남겨둠. 비대칭
  프리셋만 쓰면 0 영향이지만 미래 누가 동심 프리셋 추가 시 자동 보호.
  유지 vs 삭제 — 3-4 멀티 프리셋 도입 시 재평가. (`Trails.tsx` 의
  `Z_STAGGER`)
- **카메라 메타를 프리셋으로** — 3-3 은 인라인 상수 `[0, 0, 3]`. TWO_BODY 와
  TWO_BODY_CIRCULAR 가 *같은 스케일* 이라 우연히 통하지만, 3-4 가
  태양계 (수십 AU) 추가하면 깨짐. Preset 인터페이스에 `camera` 필드
  추가가 자연스러움.
- **TWO_BODY_CIRCULAR ↔ test fixture 의 단일 소스 통합** — 현재 두 곳에
  *같은 숫자*가 박혀 있음 (`presets.ts` 와 `two-body.test.ts` 의
  `circularBinary()`). 3-4 의 *프리셋 셀렉터* 도입 시 test 가 프리셋을
  import 해 fixture 로 쓰는 방향. (YAGNI 지금은, 두 번째 drift 발견하면.)
- **`<Bodies>` 와 `<Trails>` 가 매 프레임 같은 ref 를 따로 읽음** —
  현재는 둘 다 시각 컴포넌트라 데이터 흐름 단방향이지만, 만약 trail 이
  *어디까지 그릴지* 가 body 상태 (예: 충돌 후 dim) 에 의존하기 시작하면
  공유 derive 가 필요. 3-5/3-6 데모에서 *충돌 머지* 도입 시 재평가.

## 다음 sub-phase(3-4 = 프리셋 셀렉터)에 적용할 교훈
- **`gravityStore` 도입의 *진짜* 첫 무대.** 3-3 은 `useRef` + 인라인 상수로
  버텼지만 3-4 는 *Canvas 밖 셀렉터 UI* 와 *Canvas 안 ref* 가 *같은 진실*
  을 봐야 함. Zustand 가 자연스러움 (Phase 2 패턴).
- **프리셋 전환 = `<Trails key={presetId} />`** — 부모 `key` 변경으로
  remount 가 가장 깔끔 (geometry/material dispose, 새 ringBuffer 생성).
  현재 `n` 기준 useMemo 도 이걸로 통합.
- **카메라 메타를 Preset 에 추가** — 3-3 인라인 상수가 깨질 시점.
- **세 프리셋 추가**: 3-체 (figure-8 published IC), 쌍성, 태양계 (planets.ts
  mass 필드 확장). PRD §4 *우리 태양계 (N-body)* 가 디폴트가 됨.
- **`TWO_BODY` 와 `TWO_BODY_CIRCULAR` 둘 다 셀렉터에 노출** — 비대칭이
  *시각* 디폴트, 동질량 원이 *수학적 깨끗함* 선택지. *프리셋이 곧 학습
  슬라이드*.

## 🌌 이번에 알게 된 우주의 한 조각

- **태양도 움직인다.** 비대칭 2체로 바꾼 게 화면을 살려준 진짜 이유:
  *케플러 1법칙의 정확한 진술* 은 "행성이 *태양 주위* 타원을 돈다" 가
  아니라 **"두 천체가 *공통 질량중심 (barycenter)* 주위 타원을 돈다"**
  야. 태양이 너무 무거워서 (지구의 33만 배) barycenter 가 태양 *내부*
  에 있을 뿐이지, *태양도 그 점 주위로 작은 원을 돈다*. 우리 화면의
  큰 별 A 가 *origin 근처에서 작은 타원* 그리는 게 바로 그거 — 바로
  *별이 흔들리는 모습*.

  이 흔들림은 천문학 사상 가장 강력한 도구로 이어져 — **외계행성 검출
  의 *radial velocity 방법***. 멀리 있는 별을 망원경으로 보면 행성은
  너무 어두워서 안 보이지만, 행성 때문에 *별이 흔들리는 것* 은 별빛의
  도플러 시프트로 감지됨. 1995 년 페가수스 51 — 인류가 외계행성을
  *처음* 본 게 바로 이 방법. Phase 5 의 기초. 우리는 지금 그 원리를
  *직접* 화면에 그리고 있는 셈.

- **케플러 2법칙이 화면에 박혔다.** 같은 dt 로 trail 점을 찍으면
  근일점 (빠를 때) 엔 호가 길어 점이 *듬성*, 원일점 (느릴 때) 엔 호가
  짧아 점이 *촘촘*. **"같은 시간에 같은 면적을 쓴다"** 의 시각적 등가
  — 점 밀도 × 호 길이 = 일정. 1609 년 케플러가 화성 관측 25년 끝에
  발견한 그 비율을, RK4 가 `F = G·m₁·m₂/r²` 한 줄에서 *연역해 그려냈다*.
  sub-3-2 가 10 자리로 증명한 L 보존이 *지금 눈에 보이는 진실*.

- **"가장 작은 단위로 가장 큰 질문" 의 가장 선명한 무대 (지금까지).**
  60 fps × 7 substep × 매 substep마다 16개 곱셈 = 초당 ~6700 번의
  RK4 평가. 1687 년 뉴턴이 *손으로* 풀던 미분방정식을 우리 노트북이
  *초당 6700 번* 다시 풀고 있다. 그 답이 *케플러의 타원* 으로 정확히
  떨어진다. 컴퓨터가 우주를 *이해* 하는 방식이 화면에 있다.
