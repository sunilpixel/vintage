"use client";

import { gsap } from "@/lib/gsap";
import type { ShaderPlane } from "@/lib/gl/ShaderPlane";

export type LensOptions = {
  /** element whose pointer position drives the lens (usually the plate wrapper) */
  area: HTMLElement;
  /** DOM ring drawn over the canvas (glass border, ticks, label) */
  ring?: HTMLElement | null;
  /** resting position as a fraction of the area (x right, y down) */
  rest: [number, number];
  /** diameter in CSS px */
  size: number;
  /** follow interpolation 0..1 per frame */
  lerp?: number;
  /** should the lens be visible when the pointer is outside the area */
  restVisible?: boolean;
  /** called every rendered frame with the smoothed lens position and the area size */
  onTick?: (x: number, y: number, w: number, h: number) => void;
};

/**
 * Drives a ShaderPlane lens: pointer tracking, weighted follow, resting position,
 * and mirroring of the position onto a DOM ring. Rendering happens on gsap.ticker
 * only while `active` is true (set by a ScrollTrigger from the section).
 */
export function createLens(plane: ShaderPlane, opts: LensOptions) {
  const { area, ring, lerp = 0.12 } = opts;
  let size = opts.size;
  const cur = { x: 0, y: 0, l: 0 };
  const target = { x: 0, y: 0, l: 0 };
  let enabled = false;
  let hovering = false;
  let active = false;
  let restPx = [0, 0];
  let w = 1;
  let h = 1;
  let labelW = 0;

  const place = () => {
    const r = area.getBoundingClientRect();
    w = r.width;
    h = r.height;
    restPx = [opts.rest[0] * w, opts.rest[1] * h];
    if (!hovering) {
      target.x = restPx[0];
      target.y = restPx[1];
    }
  };
  const measure = () => {
    place();
    labelW = ring?.querySelector<HTMLElement>(".lens-label")?.offsetWidth ?? 0;
    if (ring) gsap.set(ring, { width: size, height: size });
  };
  measure();
  cur.x = target.x;
  cur.y = target.y;
  const ro = new ResizeObserver(measure);
  ro.observe(area);

  const onMove = (e: PointerEvent) => {
    const r = area.getBoundingClientRect();
    target.x = e.clientX - r.left;
    target.y = e.clientY - r.top;
  };
  const onEnter = (e: PointerEvent) => {
    hovering = true;
    target.l = enabled ? 1 : 0;
    onMove(e);
  };
  const onLeave = () => {
    hovering = false;
    target.x = restPx[0];
    target.y = restPx[1];
    target.l = enabled && opts.restVisible !== false ? 1 : 0;
  };
  area.addEventListener("pointerenter", onEnter);
  area.addEventListener("pointermove", onMove);
  area.addEventListener("pointerleave", onLeave);

  const ringX = ring ? gsap.quickSetter(ring, "x", "px") : null;
  const ringY = ring ? gsap.quickSetter(ring, "y", "px") : null;
  const ringA = ring ? gsap.quickSetter(ring, "opacity") : null;
  // the follow is an asymptotic lerp; once it is within a hundredth of a pixel it is treated as
  // arrived, so an idle lens stops changing uniforms and the plane stops redrawing
  const settle = (a: number, b: number, eps: number) => (Math.abs(a - b) < eps ? b : a);
  const tick = () => {
    if (!active) return;
    cur.x = settle(cur.x + (target.x - cur.x) * lerp, target.x, 0.01);
    cur.y = settle(cur.y + (target.y - cur.y) * lerp, target.y, 0.01);
    cur.l = settle(cur.l + (target.l - cur.l) * 0.08, target.l, 0.001);
    const dpr = plane.dpr;
    plane.set("uMouse", [cur.x * dpr, (h - cur.y) * dpr]);
    plane.set("uRadius", (size / 2) * dpr);
    plane.set("uLens", cur.l);
    opts.onTick?.(cur.x, cur.y, w, h);
    if (ring) {
      ringX!(cur.x - size / 2);
      ringY!(cur.y - size / 2);
      ringA!(cur.l);
      // keep the label inside the plate: swap sides when it would run off the right edge
      ring.classList.toggle("lens-flip", cur.x + size / 2 + 30 + labelW > w - 16);
    }
    plane.render();
  };
  gsap.ticker.add(tick);

  return {
    /** start / stop rendering (section in viewport) */
    setActive(v: boolean) {
      active = v;
      if (v) plane.resize();
    },
    /** move the resting point (fractions of the area) */
    setRest(x: number, y: number) {
      opts.rest = [x, y];
      place(); // called every hero scrub frame: skip the label/ring re-measure, nothing there changes
    },
    setSize(px: number) {
      size = px;
      measure();
    },
    /** enable / disable the lens (fades in place) */
    setVisible(v: boolean) {
      enabled = v;
      target.l = v && (hovering || opts.restVisible !== false) ? 1 : 0;
    },
    get hovering() {
      return hovering;
    },
    get position() {
      return { x: cur.x, y: cur.y };
    },
    destroy() {
      gsap.ticker.remove(tick);
      ro.disconnect();
      area.removeEventListener("pointerenter", onEnter);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    },
  };
}

export type Lens = ReturnType<typeof createLens>;
