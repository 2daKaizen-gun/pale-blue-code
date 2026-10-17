# sub-phase 2-7 회고

**기간**: 2026-05-22 ~ 2026-05-23 (2일)
**범위**: 성능 측정 + 코드분할 + leva prod 제거 + DPR 캡 + 모바일 탭=선택 + 모바일 반응형 레이아웃 + Phase 2 종료 준비
**메타**: *측정 우선* 원칙으로 Light 우선순위를 재조정하고 L4를 컷한 sub-phase. Plan 구멍(모바일 레이아웃)을 Test가 잡아 L8로 보강.

---

## 잘된 점

- **측정이 가설을 이겼다.** TechSpec §6의 *"sphere 32→16 감소"* 를 그대로 따르는 대신 drei `<Stats>` + prod 빌드 실측을 먼저 했다. 결과: 데스크톱이 *풀 지오메트리로 60fps* — 폴리곤은 병목이 아니었다. 진짜 병목은 단일 1.4MB 번들. *안 느린 걸 최적화하지 않는다* 원칙으로 L4(적응형 지오메트리) 컷.
- **코드분할의 정량 효과.** 라우트 lazy-load 로 랜딩 초기 JS **403KB → 93KB gzip (▼77%)**. three.js 309KB 를 `/solar` 진입 시에만 로드. (빌드 실측)
- **leva 완전 제거 — 3중 교차 확인.** dev 전용 `DevControls` + 동적 import 로 prod 모듈 그래프에서 제외. ① DevControls 청크 미생성 ② 실제 leva 문자열 0 (`elevated` 오탐 분리) ③ `@stitches` 0. /solar 309→242KB gzip.
- **단일 source 유지.** DevControls 가 기본값을 하드코딩하지 않고 Scene 이 props(`initialScale`/`initialAmbient`)로 내려줌 → dev 슬라이더 초기값 = prod 기본값 항상 일치.
- **Test 단계가 Plan 구멍을 잡았다.** 모바일 반응형 레이아웃을 Light 분할에서 빠뜨렸는데, 실기기 테스트(갤럭시)에서 사이드바 점유 + 컨트롤 라벨 깨짐 발견 → L8 추가. *PCTC 가 의도대로 작동한 사례.*

---

## 막힌 점 / 트러블슈팅

### 1. WebGL Context Lost (핵심)
- **문제**: L6(라우트 코드분할) 도입 후 dev 에서 `/solar` 가 까만 화면 + 6 FPS. 콘솔: `THREE.WebGLRenderer: Context Lost`.
- **원인**: L6 에서 AppLayout `<Outlet>` 에 Suspense 를 걸었는데, Planet/Sun 의 `useTexture` suspend 가 *Canvas 안에 더 가까운 경계가 없어* 그 라우트 Suspense 까지 전파. → fallback 전환 = SolarPage/Canvas 언마운트 → 텍스처 dispose → 리마운트 → 재 suspend → 루프 → WebGL 컨텍스트 한도 초과 → Context Lost.
- **해결**: 텍스처 쓰는 Sun + Planets 를 *Canvas 안쪽* `<Suspense fallback={null}>` 로 감쌈. suspend 가 여기서 잡혀 라우트 경계까지 못 올라감 → Canvas 절대 언마운트 안 됨 → 컨텍스트 1회 생성 후 유지.
- **교훈**: *추상화(경계)를 추가하면 없던 부작용이 생긴다.* Suspense 가 없을 땐 텍스처 suspend 가 초기 마운트로 무해했는데, 경계를 추가하니 비로소 Canvas 를 무너뜨렸다. R3F 원칙: 텍스처 suspend 는 *Canvas 안쪽 경계* 로 잡아 라우트 Suspense 와 분리. (sub-2-6 "압축이라는 거짓말의 부작용" 과 같은 결 — 한 결정이 멀리서 부작용을 낳음.)

### 2. 성능 가정 ≠ 실측 (L4 컷)
- **문제**: TechSpec §6 이 모바일 대책으로 "폴리곤 감소" 를 미리 적어둠.
- **진단**: 측정하니 데스크톱 60fps(풀 품질). 8개 저폴리곤 구는 GPU 에 먼지. 모바일 병목 후보는 *DPR(고해상도 픽셀 수)* 과 *번들 크기*.
- **결정**: L4 컷. L3(dpr `[1,2]` 캡)으로 모바일 fill-rate 만 보험.

---

## 리팩토링 후보

- **`useBodyInteraction` 훅 추출**: Planet 과 Moon 의 호버/선택/터치 로직 완전 중복 (isHovered, isSelected, cursor effect, pointer 핸들러 3개, isTouch 가드). 한 훅으로 묶으면 DRY. (L5 범위 밖이라 보류)
- **DevControls leva 스키마**: Scale/Lighting 컨트롤 정의 인라인. 늘어나면 별도 상수로.
- **라우트 왕복 컨텍스트**: `/solar` 재방문마다 Canvas 마운트/언마운트로 컨텍스트 1개씩 생성/파괴. 정상이지만 매우 잦은 왕복 시 누적 가능성 미검증.

---

## 다음 sub-phase 적용 교훈

- **측정 먼저, 최적화 나중.** 가설(§6)을 데이터가 뒤집었다. 안 느린 걸 고치지 않는다.
- **경계 추가는 부작용을 동반한다.** Suspense/추상화를 넣을 땐 *어디서 suspend 가 잡히는지* 까지 추적.
- **Test 는 Plan 구멍의 안전망.** 모바일 레이아웃 누락을 실기기 테스트가 보정 — Plan 이 완벽하지 않아도 PCTC 가 잡는다.
- **반응형은 너비 기반(브레이크포인트), 인터랙션은 입력 기반(`pointer:coarse`).** 두 축 안 섞기.

---

## 🌌 이번에 알게 된 우주의 한 조각

**불칸(Vulcan) — 존재하지 않았던 행성, 그리고 "당연한 설명" 이 틀릴 때.**

19세기, 수성의 근일점이 예측보다 미세하게 더 빨리 도는 게 관측됐다 (perihelion precession). 천왕성의 이상 운동을 *해왕성 발견* 으로 풀어낸 성공에 취해, 천문학자들은 *"수성 안쪽에 안 보이는 행성이 하나 더 있겠지"* 라 가정하고 그 가설 행성에 **불칸** 이라는 이름까지 붙였다. 수십 년간 일식 때마다 찾았지만 — 없었다. 진짜 원인은 행성이 아니라 *시공간 자체의 휘어짐* (아인슈타인 일반상대성, 1915). "하나 더하면 설명된다" 는 가장 그럴듯한 가정이 통째로 틀렸고, 답은 전혀 다른 차원에 있었다.

이번 sub-phase 의 L4 가 딱 불칸이었다. *"모바일이 느리면 폴리곤 줄이면 되겠지"* 라는 그럴듯한 가정 — 측정해보니 폴리곤은 범인이 아니었고, 진짜 병목은 *번들 크기와 DPR* 이라는 다른 차원에 있었다. 천문학이 늘 그랬듯, *관측이 가설을 이긴다.* (Phase 1 의 UBV 표준 측광 *"눈대중 말고 표준으로 측정"* 과 같은 결.)

---

## 검증 현황 (정직하게)

✅ **확인됨**:
- 자동 테스트 **61/61 통과** (회귀 0) — store/time/easing/scale/bodyPosition/planets
- prod 빌드 통과, leva 부재(3중 grep), 번들 분할 수치(403→93 / 309→242 gzip)
- 데스크톱 fps 60 (육안)

⚠️ **미검증 — 데스크톱에서 확인 필요 (이월)**:
- **Lighthouse Performance 85+** — 점수 자체 미측정. 단, 점수를 좌우하는 *번들 입력값* 은 개선 확인됨.
- **모바일 30fps+** 정량 — 육안 "괜찮음" 수준, Stats 수치 미기록.
- **라우트 왕복 Context Lost** 스트레스 (`/solar`↔`/` 반복).
- **모바일 탭=선택 / 제스처 비충돌** 정밀 확인.
- **L8 반응형 레이아웃** 실기기 최종 확인.

→ 인수인계 §4 미해결 항목으로 이월. 데스크톱 5분이면 닫힘.

---

## 다음 단계 (Phase 2 종료 의식)

1. 인수인계 `docs/phase-handoffs/phase-2-to-3.md` 작성 (**README + GitHub 현황 필요**)
2. Milestone `Phase 2 — Solar System` close
3. Release 태그 (v0.2.0 후보)
