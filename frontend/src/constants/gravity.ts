/**
 * Trail length, in *integration steps* (not frames). Since the Integrator
 * pushes one point per substep (sub-3-7), a ring holds the last
 * TRAIL_CAPACITY steps = a fixed sim-time window (TRAIL_CAPACITY x dt),
 * independent of visual speed. ~5 orbits for the two-body demo dt (T/120),
 * ~1 orbit for the finer accuracy dt (T/600).
 *
 * Shared by GravityPage (which allocates the rings) and Trails (which sizes
 * the GPU buffers to match) — one number, so the two can never disagree.
 */
export const TRAIL_CAPACITY = 600
