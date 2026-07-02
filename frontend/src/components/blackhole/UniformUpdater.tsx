import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { bhMaterialRef } from './refs'
import { useBlackholeStore } from '../../store/blackholeStore'

export function UniformUpdater() {
  useFrame((state) => {
    const mat = bhMaterialRef.current
    if (!mat) return

    const { mass, steps, showHorizon, diskVisible } = useBlackholeStore.getState()
    const cam = state.camera as PerspectiveCamera
    const r_s = mass * 2.0

    mat.uniforms.u_cameraPos.value.copy(cam.position)
    mat.uniforms.u_cameraToWorld.value.copy(cam.matrixWorld)
    mat.uniforms.u_resolution.value.set(state.size.width, state.size.height)
    mat.uniforms.u_fov.value         = cam.fov
    mat.uniforms.u_rs.value          = r_s
    mat.uniforms.u_steps.value       = steps
    mat.uniforms.u_showHorizon.value = showHorizon
    mat.uniforms.u_diskVisible.value = diskVisible
    mat.uniforms.u_diskInner.value   = 3.0 * r_s
    mat.uniforms.u_diskOuter.value   = 8.0 * r_s
    mat.uniforms.u_time.value        = state.clock.getElapsedTime()
  })

  return null
}
