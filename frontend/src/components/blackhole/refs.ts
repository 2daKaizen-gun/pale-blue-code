import type { RawShaderMaterial } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/**
 * Module-level singleton handles for the blackhole scene.
 *
 * The Canvas subtree and the (DOM-side) ControlPanel live in separate React
 * trees, so these shared refs let them talk without prop-drilling or context.
 * A single blackhole instance is guaranteed by the router, so a module
 * singleton is safe. Kept in their own module so the component files stay
 * component-only exports (react-refresh friendly).
 */

// Pushed each frame by UniformUpdater; owned by BlackholeRenderer.
export const bhMaterialRef: { current: RawShaderMaterial | null } = { current: null }

// Set by the OrbitControls ref in Scene; ControlPanel calls reset() on it.
export const bhOrbitRef: { current: OrbitControlsImpl | null } = { current: null }
