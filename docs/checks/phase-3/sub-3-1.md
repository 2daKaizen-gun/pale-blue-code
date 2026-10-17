# sub-3-1 Check — N-body 코어 (lib/physics, TDD)

> Phase 3 — Gravity · Issue #17 · 2026-05-25

## 잘된 점
- **TDD가 `lib/physics`에 완벽히 맞았다.** 화면 0, 테스트로 빨강→초록. 컨테이너 vitest로 직접 검증 — 데스크톱/WebGL 검증 이월 0. (sub-2-7에서 그렇게 원하던 그 결.)
- **적분기를 중력과 분리 검증.** RK4를 SHO 해석해(`x''=−x`, `x(t)=cos t`)로 따로 시험 → *"적분기가 맞나"* 와 *"중력이 맞나"* 를 격리. 버그 원인이 섞이지 않음.
- **4차 수렴 실측.** dt 절반마다 오차가 정확히 16배(=2⁴) 감소 (1.31e-5 → 8.16e-7 → 5.10e-8 → 3.19e-9). RK4가 *진짜 4차* 라는 숫자 증거 — 3-5 Euler 대비의 예고편.
- **범용 `rk4Step(state, dt, AccelFn)`.** SHO로 검증한 바로 그 적분기에 3-2에서 `computeAccelerations`를 꽂는다 — *검증 = 사용*.
- 13 tests green, `tsc -b` 0, 랜딩 번들 영향 0 (93.60KB gzip 유지).

## 막혔던 점 / 트러블슈팅
- **문제**: Light 6 합동 스모크 테스트 파일이 *중복* 됐다 — `nbody.test.ts` 와 `integration.test.ts` 가 같은 일을 함.
- **원인**: 컨테이너에 남아있던 `nbody.test.ts`(생성 기록 불명)와, 그것을 모른 채 새로 만든 `integration.test.ts` 가 충돌.
- **해결**: `nbody.test.ts` 로 통합(이름이 모듈/Issue `nbody` 와 일치 + *속박 궤도가 안 튕겨나가는지* boundedness 테스트가 하나 더). `integration.test.ts` 삭제. softening 유한성은 이미 `gravity.test.ts` 가 커버하므로 손실 없음.
- **교훈**: 작업 전 기존 파일 확인(`ls` / `git status`). *측정이 중복을 잡았다* — 추측으로 메우지 않고 git status로 확인한 게 정답.

## 리팩토링 후보
- `types.ts`의 `Body`는 현재 *최소형*(mass/position/velocity). 3-4에서 렌더 필드(color/radius/label) 확장 예정 → TechSpec §3 (단일 Body 정의) 동기화 필요.
- `energy.ts`(총 에너지 / 각운동량)는 3-2에서 추가 — 풀 궤도 검증의 핵심.

## 다음 sub-phase(3-2)에 적용할 교훈
- 범용 `rk4Step`에 `gravityAccel`(= `s => computeAccelerations(s, G, ε)`)을 꽂아 2체 궤도를 돌린다 → **에너지·각운동량 보존 + 케플러 `T²∝a³`** 자동 검증.
- **Euler 적분기**를 3-2에서 추가 → RK4 대비축. 같은 2체에서 Euler는 에너지가 새어 나선으로 발산하는지 *수치로* 확인 (영혼 3-5의 재료).

## 🌌 이번에 알게 된 우주의 한 조각
- **중력 가속도는 끌리는 물체 자신의 질량과 무관하다.** 힘 `F = G·m₁·m₂/r²` 는 `m`에 비례하지만, 가속도 `a = F/m` 에서 그 `m` 이 상쇄된다. 그래서 진공에서 깃털과 망치가 *같이* 떨어진다 (갈릴레오 — 아폴로 15호가 달 표면에서 실제로 시연). 코드에서도 `computeAccelerations` 에 *받는 쪽 질량* 이 들어가지 않는다.
- **2체는 손으로 풀리지만(케플러) 3체부터는 일반해가 없다.** 닫힌 수식으로 미래를 적을 수 없고 오직 *수치 적분* 으로만 안다 — *컴퓨터가 우주를 푸는 이유*, Phase 3의 영혼.
