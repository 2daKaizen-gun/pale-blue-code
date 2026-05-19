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
import { CAMERA_HOME_POSITION, CAMERA_HOME_TARGET } from '../../data/camera'
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
 * 보간 목표의 두 종류. body 추적이거나 home 복귀이거나.
 */
type TransitionTarget =
  | { kind: 'body'; bodyId: BodyId }
  | { kind: 'home' }

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * CameraController — 카메라 보간 + 추적 (sub-2-5 [Light 5/6/7]).
 *
 * ─── 책임 ─────────────────────────────────────────
 *   1. selectedBodyId 변화 감지 → body 추적 보간 시작
 *   2. cameraResetRequestedAt 변화 감지 → home 보간 시작
 *   3. 매 프레임 transitionRef.target 의 *현재* 위치 계산 + 카메라 적용
 *   4. transitionRef === null → 손 떼기 (사용자 자유 카메라)
 *
 * ─── 두 trigger 의 충돌 해소 ──────────────────────
 *   [🎥] 누름은 store 에서 selectedBodyId=null + cameraResetRequestedAt=now 동시 set.
 *   두 useEffect 가 발화. *작성 순서로 나중이 이긴다*:
 *     - 위:  selectedBodyId effect (null 받음 → transitionRef=null)
 *     - 아래: cameraResetRequestedAt effect (now 받음 → transitionRef={kind:'home'})
 *   → home 보간 이김. ✅
 *
 *   사용자 OrbitControls 만짐 (yieldCameraControl):
 *     - selectedBodyId=null + cameraResetRequestedAt=-Infinity 동시 set.
 *     - 두 effect 모두 *손 떼기* (transitionRef=null) 로 귀결.
 *
 * ─── 보간 패러다임 ────────────────────────────────
 *   sub-2-4 의 *mode + changedAt 만 store, progress 는 derived* 결을 이음.
 *   trigger 자체 (selectedBodyId / cameraResetRequestedAt) 는 store, 보간 진행
 *   상태 (from 위치, startTime) 는 컴포넌트 ref. progress 매 프레임 derived.
 *
 *   매 프레임 *to 위치는 새로 계산* — body 추적이면 행성 공전 따라감, home 이면
 *   고정 [0,60,150]. 보간 중 (progress < 1) 도 카메라가 *움직이는 목표* 부드럽게 추격.
 *
 *   currentScaleConfig 도 매 프레임 — 거리 토글 중에도 카메라가 천체와 함께 따라감.
 *
 * ─── 고정 방향 offset (body 추적) ───────────────────
 *   (radius * 5, radius * 3, radius * 5) — 월드 좌표 기준 다이아고날 + 약간 위.
 *     - 모든 천체 *비슷한 화면 점유* (radius 비례)
 *     - 행성이 공전해도 *카메라 시점은 항상 +X/+Z 쪽* (월드 좌표 고정)
 */
export function CameraController({ scale }: CameraControllerProps) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsLike | null

  const selectedBodyId = useSolarSystemStore((s) => s.selectedBodyId)
  const cameraResetRequestedAt = useSolarSystemStore(
    (s) => s.cameraResetRequestedAt,
  )

  // 보간 시작 시 캡처되는 from 정보. null = 손 떼기 (사용자 자유).
  const transitionRef = useRef<{
    target: TransitionTarget
    startTime: number
    fromCameraPosition: THREE.Vector3
    fromTarget: THREE.Vector3
  } | null>(null)

  // ── Effect 1: selectedBodyId 변화 → body 추적 보간 진입
  useEffect(() => {
    if (!controls) return
    if (selectedBodyId === null) {
      transitionRef.current = null
      return
    }
    transitionRef.current = {
      target: { kind: 'body', bodyId: selectedBodyId },
      startTime: performance.now(),
      fromCameraPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
    }
  }, [selectedBodyId, camera, controls])

  // ── Effect 2: cameraResetRequestedAt 변화 → home 보간 또는 손 떼기
  //    *Effect 1 보다 아래에 작성* — 동시 set 시 *나중 발화로 이김* (home 이김).
  useEffect(() => {
    if (!controls) return
    if (cameraResetRequestedAt === -Infinity) {
      // 자동 제어 양도 (사용자 OrbitControls 자유). 또는 초기 상태.
      transitionRef.current = null
      return
    }
    // home 보간 진입
    transitionRef.current = {
      target: { kind: 'home' },
      startTime: cameraResetRequestedAt,
      fromCameraPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
    }
  }, [cameraResetRequestedAt, camera, controls])

  useFrame(() => {
    const transition = transitionRef.current
    if (!transition || !controls) return

    const { simulationDays, scaleMode, scaleModeChangedAt } =
      useSolarSystemStore.getState()
    const now = performance.now()

    const progress = easeInOutCubic(
      computeTransitionProgress(
        now,
        transition.startTime,
        TRANSITION_DURATION_MS,
      ),
    )

    // 거리 토글 보간도 매 프레임 — 진실 토글 중에도 카메라 따라감
    const scaleProgress = easeInOutCubic(
      computeTransitionProgress(now, scaleModeChangedAt, TRANSITION_DURATION_MS),
    )
    const currentScaleConfig = getInterpolatedScaleConfig(
      scale,
      scaleMode,
      scaleProgress,
    )

    // 목표 위치 + 카메라 position 계산
    const targetPosition = new THREE.Vector3()
    const targetCameraPosition = new THREE.Vector3()

    if (transition.target.kind === 'home') {
      targetPosition.set(...CAMERA_HOME_TARGET)
      targetCameraPosition.set(...CAMERA_HOME_POSITION)
    } else {
      const { bodyId } = transition.target
      let radius: number

      if (bodyId === 'sun') {
        targetPosition.set(0, 0, 0)
        radius = computeVisualRadius(SUN.realRadius_km, currentScaleConfig)
      } else {
        const planet = findPlanetById(bodyId)
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

      // 고정 방향 offset — 다이아고날 + 약간 위 (월드 좌표 기준)
      targetCameraPosition.set(
        targetPosition.x + radius * 5,
        targetPosition.y + radius * 3,
        targetPosition.z + radius * 5,
      )
    }

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
