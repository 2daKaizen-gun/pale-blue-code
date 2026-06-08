# sub-3-7 Check — Camera follow + mobile/perf pass + Phase 3 close

> Phase 3 — Gravity · Issue #24 · 2026-06-07 · Phase 3 마지막 sub-phase

## 잘된 점

- **3-6 스모크가 넘긴 빚 세 개를 *기반 청소(묶음 A)* 로 먼저 갚고 카메라를 얹었다.**
  순서가 약이었다 — 받침대 흔들림(PresetSelector 넘침)·셔터 끊김(trail 다각형)·
  재정렬 불능(reload 안 됨)을 다 잡은 *깨끗한 기반* 위에 추적을 올리니, 카메라
  작업 중 잡음이 없었다. 큰 sub-phase 를 A(청소)→B(기능)→C(마감) 세 묶음으로
  쪼갠 게 "하루 6~10 커밋" 페이스도 지켰다.

- **trail 샘플링을 frame→substep 으로 옮긴 게 *부수효과가 곧 본질* 이었다.**
  고속 다각형(3-6 스모크) 은 표면 증상이고, 진짜는 trail 이 "최근 N *프레임*"
  (속도 의존) 을 담던 것. substep 당 push 로 "최근 N *적분 스텝*"(속도 무관,
  고정 sim-time 창) 이 됐다. 3-6 누적기 철학("빠르게 = 같은 진실을 더 촘촘히")
  이 꼬리에도 그대로 박혔다. RingBuffer 소유를 GravityPage(bodiesRef 의 형제) 로
  끌어올려 Integrator(write)/Trails(read) 로 책임 분리 — R3F useFrame 순서 보장이
  없어도 같은 ring 객체라 일관.

- **reset 을 *새 액션 없이* nonce 로 풀었다.** `presetLoadedAt` 을 **monotonic
  카운터**(wall-clock timestamp 아님 — R 연타 시 같은 ms 충돌로 re-seed 씹히는
  함정 회피) 로 두고, `selectPreset` 이 같은 id 에도 매번 bump. ↻ 버튼·R 키는
  `selectPreset(현재 id)` 재사용 — sub-2-4/3-6 YAGNI("한 사용자 의도 = 한 액션")
  를 끝까지 지킴.

- **카메라 추적 = delta-follow.** 추적 천체의 프레임당 변위(Δ) 를 카메라 position
  *과* OrbitControls target 에 *똑같이* 더함 → spherical(반경·각도) 불변 → 사용자
  줌/각도 보존하며 천체만 시야 고정. 화면 정중앙 강제가 아니라 *기준계 전환*
  (solar-system 에서 지구 follow → 태양이 지구를 도는 천동설 시점). 추적 대상은
  CameraConfig(정적 메타) 가 아니라 store(런타임 선택) 에 — `followIndex` reset
  to null on selectPreset (프리셋마다 천체 수 2~9 라 stale 인덱스 방지).

- **성능은 measurement-first 로 진단했고, 진단된 것만 고쳤다.** Lighthouse 모바일
  /gravity 72점, LCP 주황 + TBT 빨강 = "큰 JS 번들이 메인스레드 막음" 의 교과서적
  신호. `vite.config` manualChunks 로 three/r3f/drei 를 vendor 청크 분리 →
  **LCP 주황 해결**(병렬 로드, 77점). 남은 TBT 는 vendor-three(345 KiB) 의 *순수
  실행 시간*(Script Eval 2.4s) 으로 좁혀짐 — leva 누수 같은 우리 버그 없음(unused
  JS 목록에 leva 부재 확인). three 의 구조적 비용이라 micro-opt 는 YAGNI.

## 막혔던 점 / 트러블슈팅

### 1. PresetSelector 넘침 — `fixed` 의 기준이 *뷰포트* 였다
- **문제**: 셀렉터가 데스크톱 사이드바 위로 흘러넘침.
- **원인**: `fixed left-1/2 -translate-x-1/2` 는 *뷰포트* 정중앙. AppLayout 의
  사이드바(`md:w-48`, 레이아웃 안 flex 자식) 가 왼쪽을 차지하므로 콘텐츠 중앙과
  어긋남.
- **해결**: `fixed` → `absolute`. GravityPage 의 부모(`relative h-screen w-full`)
  가 곧 콘텐츠 영역이라, absolute 면 사이드바 폭을 *하드코딩하지 않고도* 콘텐츠
  중앙 정렬 — 사이드바 폭이 바뀌어도 자동 적응. ControlPanel 도 같은 처리(일관 +
  같은 넘침 잠재 차단).
- **교훈**: offset 계산식(`calc(50% + 6rem)`) 보다 *부모 기준 absolute* 가 견고.
  레이아웃 상수 의존을 없애는 게 안 깨지는 길.

### 2. trail substep 이동은 "한 줄 치환" 이 아니라 "소유 이전" 이었다
- **문제 가능성**: Trails 의 frame push 를 그냥 substep 으로 옮기려 했으나, Trails
  는 자기 useFrame 에서 bodiesRef *최종* 상태만 봄 — substep 중간 상태에 접근 불가.
- **해결**: RingBuffer 를 GravityPage 가 소유(trailsRef), Integrator 가 substep
  루프 *안* 에서 push, Trails 는 read+render. bodiesRef 패턴 그대로 확장.
- **교훈**: 샘플링 주체를 바꾸려면 *데이터 소유* 를 옮겨야 했다. 3-6 의 "실물을
  읽기 전엔 작업 크기를 모른다" 재현 — 받기 전엔 "Trails 한 줄" 인 줄 알았다.

### 3. vite manualChunks 객체 리터럴이 TS2769
- **문제**: `output.manualChunks: { 'vendor-three': [...] }` 가 타입 에러.
- **원인**: 이 Vite/Rollup 버전에서 `output` 이 배열 오버로드로 추론 → manualChunks
  가 *함수* 타입만 허용.
- **해결**: 함수형 `manualChunks(id)` — `node_modules` 안 `three`→vendor-three,
  `@react-three`→vendor-r3f 로 모듈 경로 직접 라우팅. 더 견고(어느 패키지가 어느
  청크로 갈지 명시 제어).
- **교훈**: 추정 config 는 버전 타입과 어긋날 수 있다 — 함수형이 안전.

## 스모크에서 드러난 것 (3-7 범위 밖 — 후속)

- **HomePage APOD 503** — NASA APOD API 가 일시 503(DEMO_KEY rate limit 가능성).
  Phase 1 위젯 건이고 gravity 와 무관. 외부 의존 장애라 우리 코드 문제 아님 —
  Phase 1 에러 처리(재시도/폴백) 강화 후보로만 기록.

## 리팩토링 후보

- **gravity TBT (Script Eval 2.4s)** — vendor-three 순수 실행 시간. 85+ 가 꼭
  필요하면 별도 *성능 패스* 거리: Canvas 마운트 지연(상호작용 후 로드), geometry
  생성 워커 분리, drei 의 실제 사용 모듈만 import 확인. *Phase 3 마감이 아니라
  독립 작업* — 지금 손대면 PCTC 깨짐 (YAGNI).
- **ControlPanel 비대화 지속** — 모바일 flex-wrap 으로 버텼지만 클러스터가 6개.
  Phase 4+ 에서 패널 컴포넌트 분해(TimeControls / IntegratorToggle / FollowControl)
  후보.
- **키보드 핸들러** — Space/1~4/R 이 ControlPanel useEffect 인라인. 이제 키가
  늘었으니(F 추적키는 미구현) Phase 2 키보드 훅과 통합 후보. 지금은 한 곳뿐 YAGNI.
- **`MAX_SUBSTEPS_MOBILE = 8` 하드코딩** — 기기별 더 세밀한 분기는 과잉. 현 분기로 충분.

## 다음 Phase(4 = Light Bent / GLSL 블랙홀 렌징)에 적용할 교훈

- **큰 sub-phase 는 묶음으로 쪼갠다** — A(청소)/B(기능)/C(마감) 패턴이 Phase 종료
  sub-phase 에 잘 맞았다. Phase 4 의 GLSL 도 셰이더 기반 마련 → 렌징 효과 → 통합
  으로 묶일 듯.
- **measurement-first 가 또 이겼다** — 72→77 의 LCP 해결은 측정이 가리킨 곳
  (번들 분리) 만 고쳐서 얻음. Phase 4 GLSL 성능도 추측 말고 프로파일 먼저.
- **명령형 카메라 패턴 계승** — CameraRig(reframe) + CameraController(follow) 가
  키 없는 명령형(3-4 Context Lost 회피) 으로 정착. Phase 4 카메라도 이 위에.

## 🌌 이번에 알게 된 우주의 한 조각

- **추적은 기준계의 선택이다.** delta-follow 로 한 천체를 시야에 못박으면, 그
  천체는 멈춰 보이고 *나머지 우주가 그 주위를 돈다*. solar-system 에서 지구를
  따라가면 태양이 지구를 도는 — 정확히 **천동설의 시점**이 코드로 재현된다.
  코페르니쿠스 혁명의 본질이 "누가 도느냐" 가 아니라 "*어느 기준계가 더 단순한
  법칙을 주느냐*" 였음을 화면이 보여준다: 지구 기준계에선 행성들이 역행(retrograde)
  하는 복잡한 춤을 추지만, 태양 기준계에선 깨끗한 타원이 된다. 같은 물리, 다른
  기준계, 다른 *복잡도*. 적도의 추적 마운트가 별을 시야에 붙들 때 실제로 하는 일
  도 이것 — 지구 자전이라는 기준계를 상쇄해, 별이 "정지한" 더 단순한 프레임으로
  옮겨 앉는 것이다.
