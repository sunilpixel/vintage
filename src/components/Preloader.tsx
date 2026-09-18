"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { markReady } from "@/lib/ready";

const PLATES = ["/img/hero.jpg", "/img/heritage_archive3.jpg", "/img/car_etype.jpg", "/img/car_300sl.jpg", "/img/car_db5.jpg"];

const load = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

/**
 * Opening title card: wordmark letters rise, a hairline grows with the real loading progress,
 * then the darkness lifts and the hero intro takes over (see lib/ready).
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | undefined>(undefined);
  const lenisNow = useLenis();
  useEffect(() => {
    lenis.current = lenisNow;
  }, [lenisNow]);

  useGSAP(
    () => {
      const el = root.current!;
      const brand = el.querySelector<HTMLElement>(".pre-brand")!;
      const line = el.querySelector<HTMLElement>(".pre-line")!;
      const count = el.querySelector<HTMLElement>(".pre-count")!;
      const est = el.querySelector<HTMLElement>(".pre-est")!;
      const split = new SplitText(brand, { type: "chars", charsClass: "ch" });
      const progress = { p: 0 };
      let done = 0;
      let alive = true;

      document.documentElement.classList.add("is-loading");
      lenis.current?.stop();

      const render = () => {
        gsap.set(line, { scaleX: progress.p });
        count.textContent = String(Math.round(progress.p * 100)).padStart(3, "0");
      };
      const toProgress = (p: number) =>
        gsap.to(progress, { p, duration: 0.8, ease: "power2.out", onUpdate: render, overwrite: true });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(split.chars, { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.035 }, 0.2)
        .from(est, { opacity: 0, y: 6, duration: 0.8 }, 0.9)
        .from(count, { opacity: 0, duration: 0.6 }, 0.9);

      // real loading: fonts + the first plates, with a floor so the card is never a flash
      const steps = [document.fonts.ready.then(() => undefined), ...PLATES.map(load)];
      steps.forEach((s) =>
        s.then(() => {
          done += 1;
          if (alive) toProgress(Math.min(0.96, done / steps.length));
        }),
      );
      const minimum = new Promise<void>((r) => setTimeout(r, 2000));

      Promise.all([...steps, minimum]).then(() => {
        if (!alive) return;
        toProgress(1);
        const out = gsap.timeline({ defaults: { ease: "power4.inOut" }, delay: 0.5 });
        out
          .to(split.chars, { yPercent: -110, opacity: 0, duration: 0.8, stagger: 0.02 }, 0)
          .to([est, count, line], { opacity: 0, duration: 0.5 }, 0)
          .fromTo(el, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1 }, 0.35)
          .add(() => {
            document.documentElement.classList.remove("is-loading");
            lenis.current?.start();
            markReady();
          }, 0.55)
          .set(el, { display: "none" });
      });

      return () => {
        alive = false;
        split.revert();
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="pre" aria-hidden="true">
      <div className="pre-brand disp">VINTAGE MOTORS</div>
      <div className="pre-line" />
      <div className="pre-row">
        <span className="tiny pre-est">Est. 1958</span>
        <span className="num pre-count">000</span>
      </div>
    </div>
  );
}
