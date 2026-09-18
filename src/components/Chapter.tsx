"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SECTIONS } from "@/content/site";
import { whenReady } from "@/lib/ready";

const N = SECTIONS.length;

/**
 * Bottom-left chapter counter: "0 4 / 09 ——— The collection". The digits roll like a split-flap
 * when the chapter changes, the hairline fills with the chapter's own scroll progress, and the
 * label slides in.
 */
export default function Chapter() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const cols = gsap.utils.toArray<HTMLElement>(".chap-col", el);
      const fill = el.querySelector<HTMLElement>(".chap-line i")!;
      const setFill = gsap.quickSetter(fill, "scaleX");
      const labels = gsap.utils.toArray<HTMLElement>(".chap-label span", el);
      let current = -1;

      const roll = (col: HTMLElement, digit: number) =>
        gsap.to(col, { y: -digit * 14, duration: 0.9, ease: "power4.inOut", overwrite: true });

      const activate = (i: number) => {
        if (i === current) return;
        const prev = current;
        current = i;
        const n = String(i + 1).padStart(2, "0");
        roll(cols[0], Number(n[0]));
        roll(cols[1], Number(n[1]));
        if (prev >= 0) gsap.to(labels[prev], { yPercent: -110, opacity: 0, duration: 0.5, ease: "power3.in", overwrite: true });
        gsap.fromTo(labels[i], { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, delay: 0.25, ease: "power3.out", overwrite: true });
      };

      SECTIONS.forEach((s, i) => {
        const sec = document.getElementById(s.id);
        if (!sec) return;
        // Pinned sections stay on screen for their pin distance; keep the chapter lit for all
        // of it. Spacers are detached during a refresh, so read the distance from the pinning
        // trigger (already refreshed thanks to refreshPriority).
        const extent = () => {
          const pinner = ScrollTrigger.getAll().find((t) => t.pin === sec);
          return sec.offsetHeight + (pinner ? pinner.end - pinner.start : 0);
        };
        ScrollTrigger.create({
          trigger: sec,
          start: "top 50%",
          end: () => `+=${extent()}`,
          refreshPriority: -1,
          onToggle: (self) => self.isActive && activate(i),
          onUpdate: (self) => {
            if (current === i) setFill(self.progress);
          },
        });
      });
      const entrance = gsap.from(el, { opacity: 0, y: 10, duration: 1.2, delay: 1.2, paused: true });
      return whenReady(() => entrance.play());
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="chap" aria-hidden="true">
      <div className="chap-n">
        <span className="chap-col">
          {Array.from({ length: 10 }, (_, d) => (
            <span key={d}>{d}</span>
          ))}
        </span>
        <span className="chap-col">
          {Array.from({ length: 10 }, (_, d) => (
            <span key={d}>{d}</span>
          ))}
        </span>
        <span className="chap-of">&thinsp;/&thinsp;{String(N).padStart(2, "0")}</span>
      </div>
      <span className="chap-line">
        <i />
      </span>
      <span className="chap-label tiny">
        {SECTIONS.map((s) => (
          <span key={s.id}>{s.label}</span>
        ))}
      </span>
    </div>
  );
}
