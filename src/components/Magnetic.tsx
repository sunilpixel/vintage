"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, FINE_POINTER } from "@/lib/gsap";

/** Wraps an element so it drifts toward the pointer (± strength px) and springs back. */
export default function Magnetic({
  children,
  strength = 12,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!window.matchMedia(FINE_POINTER).matches) return;
      const el = ref.current!;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        xTo(gsap.utils.clamp(-1, 1, dx) * strength);
        yTo(gsap.utils.clamp(-1, 1, dy) * strength);
      };
      const leave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`magnetic${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
