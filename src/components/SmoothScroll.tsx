"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollVelocity } from "@/lib/velocity";

/** Keeps ScrollTrigger in step with Lenis and drives Lenis from the GSAP ticker. */
function Sync() {
  const lenis = useLenis(() => ScrollTrigger.update());
  useEffect(() => {
    if (!lenis) return;
    let v = 0;
    let lastSkew = "";
    // the headlines that lean with the velocity get the variable written on themselves, and only
    // when it changes: a :root write invalidated style for the whole document every frame
    const skewed = Array.from(document.querySelectorAll<HTMLElement>(".vskew"));
    const update = (time: number) => {
      lenis.raf(time * 1000);
      v += (gsap.utils.clamp(-1, 1, lenis.velocity / 60) - v) * 0.12;
      if (Math.abs(v) < 0.002) v = 0;
      scrollVelocity.v = v;
      const skew = `${(-v * 4).toFixed(3)}deg`;
      if (skew !== lastSkew) {
        lastSkew = skew;
        for (const el of skewed) el.style.setProperty("--vskew", skew);
      }
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, [lenis]);

  // Every section registers its own (pinned) ScrollTriggers in layout effects; this effect runs
  // after all of them. GSAP refreshes triggers in creation order unless sorted, and the rail /
  // nav triggers are created before the pinned sections, so sort by document position first and
  // then re-measure everything against the final pin spacers. Fonts can still change line
  // heights afterwards, so refresh once more when they are ready.
  useEffect(() => {
    const refresh = () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    const id = requestAnimationFrame(refresh);
    document.fonts?.ready.then(refresh);
    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, autoRaf: false, anchors: true }}
    >
      <Sync />
      {children}
    </ReactLenis>
  );
}
