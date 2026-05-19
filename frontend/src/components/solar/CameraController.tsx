import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  useSolarSystemStore,
  TRANSITION_DURATION_MS,
  type BodyId,
} from '../../store/solarSystemStore'
import { PLANETS, findPlanetById } from '../../data/planets'
import { SUN } from '../../data/sun'
import {
  type ScaleConfig,
  computeVisualRadius,
  computeVisualDistance,
  getInterpolatedScaleConfig,
} from '../../lib/scale'
import { computeOrbitAngle } from '../../lib/time'
import {
  computeTransitionProgress,
  easeInOutCubic,
} from '../../lib/easing'

type CameraControllerProps = {
  scale: ScaleConfig
}

/**
 * OrbitControls 의 필요한 부분만 — 직접 의존성 (three-stdlib) 추가 없이.
 * makeDefault prop 이 켜져 있으면 `useThree((s) => s.controls)` 가 이 형태로 채워짐.
 */
interface OrbitControlsLike {
  target: THREE.Vector3
  update(): void
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * CameraController — selectedBodyId 변화 시 카메라 보간 + 추적 (sub-2-5 [Light 5]).
 *
 * Scene 의 Canvas 자식. useThree 로 camera + controls 접근.
 *
 * ─── 책임 ─────────────────────────────────────────
 *   1. selectedBodyId 변화 감지 → 보간 시작 (1.5s easeInOutCubic)
 *   2. 매 프레임 카메라 target = 천체 *현재* 위치 (공전 따라 갱신)
 *   3. 카메라 position = target + 고정 방향 offset (radius * 5 다이아고날)
 *   4. selectedBodyId === null → 손 떼기 (현 위치 유지, 자유 카메라)
 *
 * ─── 책임 외 (미래 Light) ─────────────────────────
 *   - Light 6: 사용자 OrbitControls 만지면 deselect — Scene 의 OrbitControls 콜백
 *   - Light 7: [🎥 카메라 리셋] home 복귀 보간 — 별도 trigger 필요
 *
 * ─── 보간 패러다임 ────────────────────────────────
 *   sub-2-4 의 *mode + changedAt 만 store, progress 는 derived* 결을 잇되,
 *   *trigger 자체* 는 useEffect 의 *selectedBodyId 변화 감지*. 보간 시작 시점에
 *   *from 위치 캡처* (useEffect 는 변화 시 1회 — 성능 영향 X).
 *
 *   매 프레임 *to 위치는 새로 계산* — 행성 공전하므로 *목표가 움직임*.
 *   보간 중 (progress < 1) 도 카메라가 *움직이는 목표* 를 부드럽게 추격.
 *
 *   currentScaleConfig 도 매 프레임 계산 = 거리 토글 (sub-2-4) 시에도 카메라가
 *   행성과 함께 *수성 박힘 → 해왕성 멀리 흩어짐* 의 여정을 따라감.
 *
 * ─── 고정 방향 offset ──────────────────────────────
 *   offset = (radius * 5, radius * 3, radius * 5) — *월드 좌표 기준* 다이아고날.
 *     - 모든 천체 *비슷한 화면 점유* (radius 비례) — 권이건 결정 Q2
 *     - 약간 위에서 (y = radius * 3) — 평면 아닌 시점
 *     - *월드 좌표 고정* — 행성이 공전해도 카메라 시점은 항상 +X/+Z 쪽 → 권이건 결정 Q3
 *
 *   sun 도 같은 식 적용. 반지름이 커서 카메라가 멀리 가지만, *고정 방향* 패턴은 동일.
 *
 * ─── 타입 우회 ────────────────────────────────────
 *   `useThree((s) => s.controls)` 의 반환 타입은 `THREE.EventDispatcher<...> | null`
 *   추상. `.target` + `.update()` 접근 위해 *최소 인터페이스* OrbitControlsLike 로 cast.
 *   makeDefault prop 이 OrbitControls 에 있어야 `s.controls` 채워짐 (Scene.tsx 에서 설정 완료).
 */
export function CameraController({ scale }: CameraControllerProps) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsLike | null

  // selectedBodyId 변화에만 반응. selector 가 값 자체 → ID 변할 때마다 effect 발화 =
  // 보간 재시작이 필요한 시점.
  const selectedBodyId = useSolarSystemStore((s) => s.selectedBodyId)

  // 보간 시작 시 캡처되는 from 정보. null = 추적 중 아님 (손 떼기).
  const transitionRef = useRef<{
    bodyId: BodyId
    startTime: number
    fromCameraPosition: THREE.Vector3
    fromTarget: THREE.Vector3
  } | null>(null)

  useEffect(() => {
    if (!controls) return
    if (selectedBodyId === null) {
      // 손 떼기 — 카메라 현 위치 유지, 사용자 자유
      transitionRef.current = null
      return
    }
    // 새 body 선택 → from 캡처, 보간 진입
    transitionRef.current = {
      bodyId: selectedBodyId,
      startTime: performance.now(),
      fromCameraPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
    }
  }, [selectedBodyId, camera, controls])

  useFrame(() => {
    const transition = transitionRef.current
    if (!transition || !controls) return // 손 떼기

    const { simulationDays, scaleMode, scaleModeChangedAt } =
      useSolarSystemStore.getState()
    const now = performance.now()

    // 카메라 보간 progress (1.5s easeInOutCubic)
    const progress = easeInOutCubic(
      computeTransitionProgress(
        now,
        transition.startTime,
        TRANSITION_DURATION_MS,
      ),
    )

    // 거리 토글 보간도 매 프레임 — 진실 토글 중에도 카메라가 행성 따라감
    const scaleProgress = easeInOutCubic(
      computeTransitionProgress(now, scaleModeChangedAt, TRANSITION_DURATION_MS),
    )
    const currentScaleConfig = getInterpolatedScaleConfig(
      scale,
      scaleMode,
      scaleProgress,
    )

    // 목표 위치 + 천체 radius 계산
    const targetPosition = new THREE.Vector3()
    let radius: number

    if (transition.bodyId === 'sun') {
      targetPosition.set(0, 0, 0)
      radius = computeVisualRadius(SUN.realRadius_km, currentScaleConfig)
    } else {
      const planet = findPlanetById(transition.bodyId)
      if (!planet) return
      const index = PLANETS.findIndex((p) => p.id === planet.id)
      const initialAngle = (index / PLANETS.length) * Math.PI * 2
      const orbitAngle = computeOrbitAngle(
        simulationDays,
        planet.orbitalPeriod_days,
        initialAngle,
      )
      const distance = computeVisualDistance(
        planet.realDistance_km,
        currentScaleConfig,
      )
      targetPosition.set(
        Math.cos(orbitAngle) * distance,
        0,
        Math.sin(orbitAngle) * distance,
      )
      radius = computeVisualRadius(planet.realRadius_km, currentScaleConfig)
    }

    // 고정 방향 offset — 월드 좌표 기준 다이아고날 + 약간 위
    const cameraOffset = new THREE.Vector3(radius * 5, radius * 3, radius * 5)
    const targetCameraPosition = new THREE.Vector3().addVectors(
      targetPosition,
      cameraOffset,
    )

    // 보간 적용 — from → to, progress 비율
    camera.position.lerpVectors(
      transition.fromCameraPosition,
      targetCameraPosition,
      progress,
    )
    controls.target.lerpVectors(
      transition.fromTarget,
      targetPosition,
      progress,
    )
    controls.update()
  })

  return null
}
