import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { BlackholeRenderer } from './BlackholeRenderer'
import { UniformUpdater } from './UniformUpdater'
import { ControlPanel } from './ControlPanel'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'

// Module-level ref so ControlPanel can call reset() from outside the Canvas.
// Same singleton pattern as bhMaterialRef.
export const bhOrbitRef: { current: any } = { current: null }

export function Scene() {
  const isMobile = useIsTouchDevice()
  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2]

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 4, 20], fov: 60, near: 0.01, far: 1000 }}
      >
        {import.meta.env.DEV && <Stats />}
        <BlackholeRenderer />
        <UniformUpdater />
        <OrbitControls
          ref={(ref) => { bhOrbitRef.current = ref }}
          makeDefault
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
      <ControlPanel />
    </div>
  )
}
