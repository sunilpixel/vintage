"use client";

import { useEffect, useRef } from "react";
import { gsap, FINE_POINTER } from "@/lib/gsap";

/**
 * Custom cursor. Elements opt into states with `data-cursor`:
 *   image | link | view | drag | explore | read | play | lens | hide
 * Text states (view/drag/explore/read) show a label inside a 96px ring.
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER).matches) return;
    const r = root.current!;
    const d = dot.current!;
    const g = ring.current!;
    const l = label.current!;

    const dotX = gsap.quickTo(d, "x", { duration: 0.18, ease: "power3" });
    const dotY = gsap.quickTo(d, "y", { duration: 0.18, ease: "power3" });
    const ringX = gsap.quickTo(g, "x", { duration: 0.55, ease: "power3" });
    const ringY = gsap.quickTo(g, "y", { duration: 0.55, ease: "power3" });

    let state = "default";
    let last = { x: 0, y: 0, t: performance.now() };
    let shown = false;

    const setState = (next: string, text?: string) => {
      if (next === state && (l.textContent || "") === (text || "")) return;
      r.dataset.state = next;
      state = next;
      l.textContent = text || "";
    };

    const onMove = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      dotX(x);
      dotY(y);
      ringX(x);
      ringY(y);
      if (!shown) {
        shown = true;
        gsap.to(r, { opacity: 1, duration: 0.6 });
      }
      // velocity → subtle skew of the ring while dragging
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      const vx = (x - last.x) / dt;
      const vy = (y - last.y) / dt;
      last = { x, y, t: now };
      if (state === "drag") {
        gsap.to(g, {
          skewX: gsap.utils.clamp(-14, 14, vx * 10),
          skewY: gsap.utils.clamp(-8, 8, vy * 6),
          duration: 0.3,
          overwrite: "auto",
        });
      }
    };

    const evaluate = (t: HTMLElement | null) => {
      if (!t) return;
      const el = t.closest<HTMLElement>("[data-cursor]");
      if (el) {
        const v = el.dataset.cursor || "image";
        const text = ["view", "drag", "explore", "read", "play"].includes(v) ? v : undefined;
        setState(v, text);
        return;
      }
      if (t.closest("a, button, [role=button]")) {
        setState("link");
        return;
      }
      const wasSkewed = state === "drag";
      setState("default");
      if (wasSkewed) gsap.to(g, { skewX: 0, skewY: 0, duration: 0.4 });
    };
    const onOver = (e: PointerEvent) => evaluate(e.target as HTMLElement | null);
    // the page moves under a still pointer while scrolling: re-check what is beneath it
    let scrollRaf = 0;
    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => shown && evaluate(document.elementFromPoint(last.x, last.y) as HTMLElement | null));
    };

    const onLeave = () => gsap.to(r, { opacity: 0, duration: 0.4 });
    const onEnter = () => gsap.to(r, { opacity: 1, duration: 0.4 });
    const onDown = () => r.classList.add("is-down");
    const onUp = () => r.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={root} className="cursor" data-state="default" aria-hidden="true">
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring">
        <span ref={label} className="cursor-label" />
        <span className="cursor-arrow cursor-arrow-l">‹</span>
        <span className="cursor-arrow cursor-arrow-r">›</span>
      </div>
    </div>
  );
}
