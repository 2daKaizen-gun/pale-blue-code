precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2  u_resolution;
uniform vec3  u_cameraPos;
uniform mat4  u_cameraToWorld;
uniform float u_fov;
uniform float u_rs;    // Schwarzschild radius — used in sub-4-2
uniform int   u_steps; // geodesic integration steps — used in sub-4-2

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

  // Bright sparse layer (~4 % of cells)
  vec2 c1 = floor(uv * 150.0);
  vec2 l1 = fract(uv * 150.0);
  float r1 = hash21(c1);
  if (r1 > 0.96) {
    vec2  sp  = vec2(hash21(c1 + 0.5), hash21(c1 + 1.5)) * 0.8 + 0.1;
    float d1  = length(l1 - sp);
    b += smoothstep(0.07, 0.0, d1) * (0.6 + r1 * 0.4);
  }

  // Dim dense layer (~7 % of cells)
  vec2 c2 = floor(uv * 400.0);
  vec2 l2 = fract(uv * 400.0);
  float r2 = hash21(c2 + 99.7);
  if (r2 > 0.93) {
    vec2  sp2 = vec2(hash21(c2 + 13.3), hash21(c2 + 77.1)) * 0.8 + 0.1;
    float d2  = length(l2 - sp2);
    b += smoothstep(0.04, 0.0, d2) * r2 * 0.4;
  }

  return clamp(b, 0.0, 1.0);
}

void main() {
  vec2 ndc = v_uv * 2.0 - 1.0;
  vec3 rd  = rayDir(ndc);

  // Black disc: pixels within 4° of the BH direction (world origin) go dark.
  // Soft edge over ~0.12° so the boundary isn't aliased.
  vec3  toBH     = normalize(-u_cameraPos);
  float cosA     = dot(rd, toBH);
  float discEdge = cos(radians(4.0));
  float discMask = 1.0 - smoothstep(discEdge, discEdge + 0.002, cosA);

  float stars = starfield(rd);
  fragColor   = vec4(vec3(stars) * discMask, 1.0);
}
