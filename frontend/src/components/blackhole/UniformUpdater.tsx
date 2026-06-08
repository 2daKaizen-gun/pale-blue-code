import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { bhMaterialRef } from './BlackholeRenderer'
import { useBlackholeStore } from '../../store/blackholeStore'

export function UniformUpdater() {
  useFrame((state) => {
    const mat = bhMaterialRef.current
    if (!mat) return

    const { mass } = useBlackholeStore.getState()
    const cam = state.camera as PerspectiveCamera

    mat.uniforms.u_cameraPos.value.copy(cam.position)
    mat.uniforms.u_cameraToWorld.value.copy(cam.matrixWorld)
    mat.uniforms.u_resolution.value.set(state.size.width, state.size.height)
    mat.uniforms.u_fov.value = cam.fov
    mat.uniforms.u_rs.value  = mass * 2.0
  })

  return null
}
