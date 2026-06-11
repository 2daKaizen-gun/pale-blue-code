precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2  u_resolution;
uniform vec3  u_cameraPos;
uniform mat4  u_cameraToWorld;
uniform float u_fov;
uniform float u_rs;
uniform int   u_steps;
uniform bool  u_showHorizon;
uniform bool  u_diskVisible;
uniform float u_diskInner;
uniform float u_diskOuter;

#define PI 3.14159265359

// Low-quality but fast hash — good enough for procedural stars.
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Reconstruct world-space ray direction from NDC.
// Camera space: x = ndc.x * aspect * tan(fovY/2), y = ndc.y * tan(fovY/2), z = -1.
// cameraToWorld (camera.matrixWorld) rotates the direction into world space.
vec3 rayDir(vec2 ndc) {
  float aspect      = u_resolution.x / u_resolution.y;
  float tanHalfFov  = tan(radians(u_fov * 0.5));
  vec3  d           = vec3(ndc.x * aspect * tanHalfFov, ndc.y * tanHalfFov, -1.0);
  return normalize((u_cameraToWorld * vec4(d, 0.0)).xyz);
}

// Procedural starfield mapped onto a sphere via equirectangular UV.
// Two layers: sparse bright + dense dim.
float starfield(vec3 dir) {
  float phi   = atan(dir.z, dir.x);
  float theta = asin(clamp(dir.y, -1.0, 1.0));
  vec2  uv    = vec2(phi / (2.0 * PI) + 0.5, theta / PI + 0.5);

  float b = 0.0;

  // Bright layer (~20 % of cells) — dense enough to show gravitational lensing distortion
  vec2 c1 = floor(uv * 200.0);
  vec2 l1 = fract(uv * 200.0);
  float r1 = hash21(c1);
  if (r1 > 0.80) {
    vec2  sp  = vec2(hash21(c1 + 0.5), hash21(c1 + 1.5)) * 0.8 + 0.1;
    float d1  = length(l1 - sp);
    b += smoothstep(0.06, 0.0, d1) * (0.5 + r1 * 0.5);
  }

  // Dim filler layer (~25 % of cells)
  vec2 c2 = floor(uv * 500.0);
  vec2 l2 = fract(uv * 500.0);
  float r2 = hash21(c2 + 99.7);
  if (r2 > 0.75) {
    vec2  sp2 = vec2(hash21(c2 + 13.3), hash21(c2 + 77.1)) * 0.8 + 0.1;
    float d2  = length(l2 - sp2);
    b += smoothstep(0.03, 0.0, d2) * r2 * 0.35;
  }

  return clamp(b, 0.0, 1.0);
}

// ── Schwarzschild null geodesic (sub-4-2) ─────────────────────────────────
//
// Traces one photon backward from the camera through Schwarzschild spacetime.
// Returns the asymptotic incoming direction (used to sample the starfield).
// Returns vec3(0) to signal horizon capture (caller renders black).
//
// Orbital plane reduction: Schwarzschild metric is spherically symmetric, so
// the photon path lies in a plane. We find that plane from (camPos, rd), then
// integrate the 2-D u–φ ODE and reconstruct a 3-D direction at the end.
//
// MAX_STEPS is a compile-time constant so the loop is valid on all GLSL
// drivers; u_steps provides the runtime quality knob via early break.
#define MAX_STEPS 128
// State: vec2(u, p) where u = 1/r, p = du/dφ.
// ODE: d²u/dφ² = -u + (3/2)·rs·u²  →  dp/dφ = -u + 1.5·rs·u²

vec2 geodesicDerivs(vec2 state, float rs) {
  float u = state.x;
  float p = state.y;
  return vec2(p, -u + 1.5 * rs * u * u);
}

vec2 rk4Step(vec2 s, float dphi, float rs) {
  vec2 k1 = geodesicDerivs(s,            rs) * dphi;
  vec2 k2 = geodesicDerivs(s + k1 * 0.5, rs) * dphi;
  vec2 k3 = geodesicDerivs(s + k2 * 0.5, rs) * dphi;
  vec2 k4 = geodesicDerivs(s + k3,       rs) * dphi;
  return s + (k1 + 2.0*k2 + 2.0*k3 + k4) / 6.0;
}

// Disk color: temperature gradient × Doppler beaming.
// doppler=1 → approaching (blue+bright), doppler=0 → receding (red+dim).
vec3 diskColor(float r, float doppler) {
  float t      = 1.0 - clamp((r - u_diskInner) / max(u_diskOuter - u_diskInner, 1e-4), 0.0, 1.0);
  vec3  hot    = vec3(1.0, 0.95, 0.8);   // inner: white-yellow
  vec3  cool   = vec3(0.9, 0.35, 0.05);  // outer: orange
  vec3  base   = mix(cool, hot, t);
  vec3  blue   = vec3(0.55, 0.75, 1.0);  // approaching tint
  vec3  red    = vec3(1.0,  0.35, 0.15); // receding tint
  float bright = mix(0.4, 1.6, doppler); // beaming: approaching side brighter
  return base * mix(red, blue, doppler) * bright;
}

// Returns deflected direction, or vec3(0) on horizon capture.
// diskR < 0 means no disk hit; diskDoppler is 0.5 (neutral) until L3.
vec3 traceRay(vec3 rd, out float diskR, out float diskDoppler) {
  diskR       = -1.0;
  diskDoppler = 0.5;

  // ── 1. Orbital plane basis ────────────────────────────────────────────
  vec3 e_r = normalize(u_cameraPos);
  vec3 n   = normalize(cross(u_cameraPos, rd));
  if (length(cross(u_cameraPos, rd)) < 1e-6) return rd;
  vec3 e_t = normalize(cross(n, e_r));
  if (dot(rd, e_t) < 0.0) { n = -n; e_t = -e_t; }

  // ── 2. Initial conditions ─────────────────────────────────────────────
  float r0   = length(u_cameraPos);
  float u0   = 1.0 / r0;
  float sinA = length(cross(rd, e_r));
  float cosA = dot(rd, e_r);
  float b    = (sinA < 1e-6) ? 1e-6 : sinA / u0;
  float p0sq = max(0.0, 1.0/(b*b) - u0*u0 + u_rs*u0*u0*u0);
  float p0   = (cosA < 0.0 ? 1.0 : -1.0) * sqrt(p0sq);

  // ── 3. RK4 integration ────────────────────────────────────────────────
  const float D_PHI = 0.3;
  vec2  state  = vec2(u0, p0);
  float phi    = 0.0;
  float prev_y = u_cameraPos.y;  // initial 3-D position y = camera y

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= u_steps) break;

    state = rk4Step(state, D_PHI, u_rs);
    phi  += D_PHI;

    float u_cur = state.x;
    if (u_rs > 0.0 && u_cur > 0.0 && (1.0 / u_cur) < u_rs) return vec3(0.0);
    if (u_cur <= 0.0) break;

    // Disk intersection: detect y=0 (equatorial plane) crossing
    if (u_diskVisible && u_diskOuter > u_diskInner) {
      vec3  e_r_phi = e_r * cos(phi) + e_t * sin(phi);
      vec3  pos     = (1.0 / u_cur) * e_r_phi;
      float cur_y   = pos.y;

      if (prev_y * cur_y < 0.0) {              // sign change → crossed y=0
        float r_hit = length(pos.xz);
        if (r_hit > u_diskInner && r_hit < u_diskOuter) {
          diskR = r_hit;
          // Keplerian Doppler: prograde tangential v ∝ 1/√r, project onto line-of-sight
          vec3  v_dir    = normalize(vec3(-pos.z, 0.0, pos.x));
          float v_los    = dot(v_dir, normalize(u_cameraPos - pos));
          diskDoppler    = clamp(v_los / sqrt(r_hit) * 3.0 + 0.5, 0.0, 1.0);
        }
      }
      prev_y = cur_y;
    }
  }

  // ── 4. Reconstruct 3-D exit direction ────────────────────────────────
  vec3  e_r_f = e_r * cos(phi) + e_t * sin(phi);
  vec3  e_t_f = -e_r * sin(phi) + e_t * cos(phi);
  float u_f   = max(state.x, 1e-8);
  float p_f   = state.y;
  return normalize((-p_f / u_f) * e_r_f + e_t_f);
}
// ──────────────────────────────────────────────────────────────────────────

void main() {
  vec2  ndc = v_uv * 2.0 - 1.0;
  vec3  rd  = rayDir(ndc);

  float diskR, diskDoppler;
  vec3 deflected = traceRay(rd, diskR, diskDoppler);

  // Horizon capture → black pixel
  if (length(deflected) < 0.5) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Disk hit → disk color
  if (diskR > 0.0) {
    fragColor = vec4(diskColor(diskR, diskDoppler), 1.0);
    return;
  }

  float stars = starfield(deflected);

  // Photon-sphere glow ring: thin bright band at b ≈ b_crit = sqrt(27/4)·r_s.
  // b_crit is the impact parameter where photons orbit the photon sphere —
  // it marks the inner edge of the bright Einstein ring seen by the observer.
  if (u_showHorizon && u_rs > 0.0) {
    float b_crit  = sqrt(6.75) * u_rs;          // sqrt(27/4)
    float r_cam   = length(u_cameraPos);
    float sinA    = length(cross(rd, normalize(-u_cameraPos)));
    float b_ray   = sinA * r_cam;
    float ringW   = u_rs * 0.08;
    float glow    = smoothstep(ringW, 0.0, abs(b_ray - b_crit));
    stars = clamp(stars + glow * 0.9, 0.0, 1.0);
  }

  fragColor = vec4(vec3(stars), 1.0);
}
