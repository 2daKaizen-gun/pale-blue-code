import { useEffect } from 'react'
import { Leva, useControls } from 'leva'
import type { ScaleConfig } from '../../lib/scale'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * DevControls — leva 기반 dev 전용 튜닝 패널 (Scale / Lighting).
 *
 * ─── sub-phase 2-7 [L7] 분리 ────────────────────────
 *   기존엔 Scene 이 leva 를 직접 import + useControls 무조건 호출 → tree-shaking
 *   불가 → prod 번들에 leva 가 통째로 실렸음 (베이스라인에서 grep 확인).
 *
 *   leva 사용 전부를 이 컴포넌트로 격리. Scene 은 이걸 *동적 import* (DEV 가드)
 *   로만 부르므로, prod 빌드에선 이 모듈과 leva 가 모듈 그래프에서 사라진다.
 *
 *   *단일 소스 유지*: 기본값을 여기 하드코딩하지 않고 Scene 이 props 로 내려줌
 *   (initialScale / initialAmbient). 슬라이더 초기값 = prod 기본값과 항상 일치.
 *
 *   *변경 전파*: useControls 결과를 *원시값으로 분해* 해 effect 의존성에 둠.
 *   leva 가 매 렌더 새 객체를 반환해도 값이 안 바뀌면 effect 가 안 돌아 — 불필요
 *   한 setState 루프 방지. 값이 실제로 바뀔 때만 onChange 로 부모에 올림.
 *
 *   *Time(dev) dropdown 제거*: ControlPanel 의 속도 버튼 + 키보드(1~4)가 이미
 *   대체. sub-2-3 부터 보류됐던 '동기화' 자투리를 *기능 삭제* 로 정리.
 */

type DevControlsProps = {
  initialScale: ScaleConfig
  initialAmbient: number
  onScaleChange: (scale: ScaleConfig) => void
  onAmbientChange: (ambient: number) => void
}

export default function DevControls({
  initialScale,
  initialAmbient,
  onScaleChange,
  onAmbientChange,
}: DevControlsProps) {
  const { radiusExponent, radiusScale, distanceExponent, distanceScale } =
    useControls('Scale', {
      radiusExponent: {
        value: initialScale.radiusExponent,
        min: 0,
        max: 1,
        step: 0.05,
      },
      radiusScale: {
        value: initialScale.radiusScale,
        min: 0.5,
        max: 3,
        step: 0.1,
      },
      distanceExponent: {
        value: initialScale.distanceExponent,
        min: 0,
        max: 1,
        step: 0.05,
      },
      distanceScale: {
        value: initialScale.distanceScale,
        min: 5,
        max: 30,
        step: 0.5,
      },
    })

  const { ambient } = useControls('Lighting', {
    ambient: {
      value: initialAmbient,
      min: 0,
      max: 1,
      step: 0.05,
    },
  })

  useEffect(() => {
    onScaleChange({
      radiusExponent,
      radiusScale,
      distanceExponent,
      distanceScale,
    })
  }, [
    radiusExponent,
    radiusScale,
    distanceExponent,
    distanceScale,
    onScaleChange,
  ])

  useEffect(() => {
    onAmbientChange(ambient)
  }, [ambient, onAmbientChange])

  return <Leva collapsed />
}
