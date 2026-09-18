/**
 * Minimal WebGL full-screen quad with named textures + uniforms.
 * Used for the optical-lens effects (hero, craftsmanship). No three.js needed.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/** Shared GLSL helpers prepended to every fragment shader. */
export const GLSL_COMMON = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;

float luma (vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 sepia (vec3 c, float a) {
  vec3 s = vec3(
    dot(c, vec3(0.393, 0.769, 0.189)),
    dot(c, vec3(0.349, 0.686, 0.168)),
    dot(c, vec3(0.272, 0.534, 0.131)));
  return mix(c, s, a);
}
vec3 saturate3 (vec3 c, float a) { return mix(vec3(luma(c)), c, a); }
vec3 contrast3 (vec3 c, float a) { return (c - 0.5) * a + 0.5; }
/* CSS-filter-like grade: sepia(), saturate(), contrast(), brightness() */
vec3 grade (vec3 c, float sep, float sat, float con, float bri) {
  c = sepia(c, sep);
  c = saturate3(c, sat);
  c = contrast3(c, con);
  return c * bri;
}

/* object-fit: cover for a texture of size tRes drawn into uRes, focus in 0..1 (y-up) */
vec2 coverUv (vec2 uv, vec2 tRes, vec2 focus) {
  float ra = uRes.x / uRes.y;
  float ta = tRes.x / tRes.y;
  vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
  return focus * (1.0 - s) + uv * s;
}
`;

type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

type TextureEntry = { tex: WebGLTexture; unit: number; size: [number, number]; ready: boolean };

export class ShaderPlane {
  readonly gl: WebGLRenderingContext;
  readonly canvas: HTMLCanvasElement;
  private program: WebGLProgram;
  private locs = new Map<string, WebGLUniformLocation | null>();
  private values = new Map<string, UniformValue>();
  private textures = new Map<string, TextureEntry>();
  private ro: ResizeObserver | null = null;
  private start = performance.now();
  private alive = true;
  /** something (uniform, texture, size) changed since the last draw */
  private dirty = true;
  dpr = 1;

  constructor(canvas: HTMLCanvasElement, frag: string) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    this.program = this.link(VERT, GLSL_COMMON + frag);
    gl.useProgram(this.program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error("Shader compile error: " + log);
    }
    return sh;
  }

  private link(vs: string, fs: string) {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error("Program link error: " + gl.getProgramInfoLog(p));
    }
    return p;
  }

  private loc(name: string) {
    if (!this.locs.has(name)) this.locs.set(name, this.gl.getUniformLocation(this.program, name));
    return this.locs.get(name) ?? null;
  }

  /** Canvas CSS size → drawing-buffer size (dpr capped for fill-rate). */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(r.width * this.dpr));
    const h = Math.max(1, Math.round(r.height * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    this.set("uRes", [w, h]);
    this.dirty = true;
  }

  set(name: string, value: UniformValue) {
    const prev = this.values.get(name);
    if (prev !== undefined && (typeof value === "number" ? prev === value : typeof prev !== "number" && prev.length === value.length && prev.every((n, i) => n === value[i]))) return;
    this.values.set(name, value);
    this.dirty = true;
  }

  get(name: string) {
    return this.values.get(name);
  }

  /** Loads an image into a named sampler2D; also sets `${name}Res`. */
  texture(name: string, src: string | HTMLImageElement): Promise<[number, number]> {
    const gl = this.gl;
    let entry = this.textures.get(name);
    if (!entry) {
      const tex = gl.createTexture()!;
      const unit = this.textures.size;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 9, 8]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      entry = { tex, unit, size: [1, 1], ready: false };
      this.textures.set(name, entry);
      this.set(`${name}Res`, [1, 1]);
    }
    const e = entry;

    return new Promise((resolve, reject) => {
      const upload = (img: HTMLImageElement) => {
        if (!this.alive) return;
        gl.activeTexture(gl.TEXTURE0 + e.unit);
        gl.bindTexture(gl.TEXTURE_2D, e.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        e.size = [img.naturalWidth, img.naturalHeight];
        e.ready = true;
        this.set(`${name}Res`, e.size);
        this.dirty = true;
        resolve(e.size);
      };
      if (typeof src !== "string") {
        if (src.complete && src.naturalWidth) upload(src);
        else src.addEventListener("load", () => upload(src), { once: true });
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => upload(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  hasTexture(name: string) {
    return this.textures.get(name)?.ready ?? false;
  }

  /** Draws only when an input changed: the shaders here are pure functions of their uniforms
   *  and textures (uTime is available but unused), so a redraw with the same inputs is the same
   *  frame — and the lens ticks every frame while the hero is on screen. */
  render() {
    if (!this.alive || !this.dirty) return;
    this.dirty = false;
    const gl = this.gl;
    gl.useProgram(this.program);
    this.values.set("uTime", (performance.now() - this.start) / 1000);

    for (const [name, e] of this.textures) {
      gl.activeTexture(gl.TEXTURE0 + e.unit);
      gl.bindTexture(gl.TEXTURE_2D, e.tex);
      const l = this.loc(name);
      if (l) gl.uniform1i(l, e.unit);
    }
    for (const [name, v] of this.values) {
      const l = this.loc(name);
      if (!l) continue;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Frees GPU resources. The context itself is left alone on purpose: a canvas keeps
   * one context for life, and React (StrictMode / HMR) re-mounts effects on the same
   * canvas, so forcing a context loss here would break every later instance.
   */
  destroy() {
    this.alive = false;
    this.ro?.disconnect();
    const gl = this.gl;
    for (const e of this.textures.values()) gl.deleteTexture(e.tex);
    gl.deleteProgram(this.program);
    this.textures.clear();
  }
}

export function webglSupported() {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
