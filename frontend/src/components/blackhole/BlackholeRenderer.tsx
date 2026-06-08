import { useRef } from 'react'
import { RawShaderMaterial, Vector2, Vector3, Matrix4 } from 'three'
import vertGlsl from '../../shaders/blackhole.vert.glsl?raw'
import fragGlsl from '../../shaders/blackhole.frag.glsl?raw'

// Module-level handle so UniformUpdater can push uniforms each frame
// without prop-drilling or context. Single instance guaranteed by router.
export const bhMaterialRef: { current: RawShaderMaterial | null } = { current: null }

export function BlackholeRenderer() {
  const matRef = useRef<RawShaderMaterial | null>(null)

  if (!matRef.current) {
    matRef.current = new RawShaderMaterial({
      vertexShader: vertGlsl,
      fragmentShader: fragGlsl,
      uniforms: {
        u_resolution:    { value: new Vector2(1, 1) },
        u_cameraPos:     { value: new Vector3() },
        u_cameraToWorld: { value: new Matrix4() },
        u_fov:           { value: 60 },
        u_rs:            { value: 0 },
        u_steps:         { value: 64 },
      },
      depthWrite: false,
      depthTest: false,
    })
  }

  // Idempotent — same ref every render; UniformUpdater reads this each frame.
  bhMaterialRef.current = matRef.current

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive object={matRef.current} attach="material" />
    </mesh>
  )
}
