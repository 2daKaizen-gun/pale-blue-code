import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { BlackholeRenderer } from './BlackholeRenderer'
import { UniformUpdater } from './UniformUpdater'

const DPR: [number, number] = [1, 2]

export function Scene() {
  return (
    <Canvas
      dpr={DPR}
      camera={{ position: [0, 0, 15], fov: 60, near: 0.01, far: 1000 }}
    >
      {import.meta.env.DEV && <Stats />}
      <BlackholeRenderer />
      <UniformUpdater />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </Canvas>
  )
}
