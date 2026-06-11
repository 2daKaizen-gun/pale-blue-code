import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { BlackholeRenderer } from './BlackholeRenderer'
import { UniformUpdater } from './UniformUpdater'
import { ControlPanel } from './ControlPanel'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'

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
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>

      {/* Home button — top-right overlay */}
      <Link
        to="/"
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/60 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Back to home"
      >
        ← Home
      </Link>

      <ControlPanel />
    </div>
  )
}
