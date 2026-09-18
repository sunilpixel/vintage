/**
 * Fragment shaders. `GLSL_COMMON` (precision, vUv, uRes, uTime, grade(), coverUv())
 * is prepended by ShaderPlane.
 */

/** Hero plate: film grade + an optical lens that magnifies, bends, colour-shifts and lifts highlights. */
export const HERO_FRAG = `
uniform sampler2D uImg;
uniform vec2 uImgRes;
uniform vec2 uFocus;    /* object-position, y-up */
uniform vec2 uMouse;    /* lens centre, px, y-up */
uniform float uRadius;  /* lens radius, px */
uniform float uZoom;    /* magnification */
uniform float uLens;    /* 0..1 lens presence */
uniform float uScale;   /* background zoom (scroll) */
uniform vec2 uShift;    /* camera track (scroll), uv */
uniform vec2 uPar;      /* pointer parallax, uv */

vec3 plate (vec2 uv) {
  /* the floor and car (lower half) sit nearer the camera, so they parallax more than the hall */
  float depth = 0.55 + 0.9 * (1.0 - uv.y);
  vec2 z = (uv - uFocus) / uScale + uFocus + uShift + uPar * depth;
  return texture2D(uImg, coverUv(z, uImgRes, uFocus)).rgb;
}

void main () {
  vec2 px = vUv * uRes;
  vec3 base = grade(plate(vUv), 0.34, 0.62, 1.12, 0.80);

  vec2 d = px - uMouse;
  float dist = length(d);
  float r = uRadius;
  float k = clamp(dist / r, 0.0, 1.0);
  float inside = (1.0 - smoothstep(r - 1.5, r + 1.0, dist)) * uLens;

  /* optics: magnify with a soft bulge, refraction gets stronger toward the rim */
  float bulge = uZoom * (1.0 + 0.28 * (1.0 - k * k));
  vec2 lp = uMouse + d / bulge;
  vec2 luv = lp / uRes;
  vec2 dir = d / max(dist, 0.001);
  float ca = 0.0065 * k * k;
  vec3 lc;
  lc.r = plate(luv + dir * ca).r;
  lc.g = plate(luv).g;
  lc.b = plate(luv - dir * ca).b;

  /* paint shifts to a bronze / black reflection under the glass */
  vec3 g = grade(lc, 0.85, 1.05, 1.32, 0.82);
  g = mix(g, g * vec3(1.05, 0.90, 0.74), 0.45);
  float l = luma(lc);
  g += pow(l, 4.0) * vec3(0.26, 0.21, 0.13);

  /* glass: rim fresnel, one specular hotspot, faint inner shading */
  float rim = smoothstep(0.70, 1.0, k);
  g += rim * 0.20 * vec3(0.95, 0.90, 0.80);
  vec2 spec = d / r - vec2(-0.42, 0.46);
  g += exp(-dot(spec, spec) * 9.0) * 0.16;
  g *= 1.0 - 0.10 * k;

  vec3 col = mix(base, g, inside);
  gl_FragColor = vec4(col, 1.0);
}`;
