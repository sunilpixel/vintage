"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { markReady } from "@/lib/ready";

/** Top of the stack first. Each plate wipes off to the right and uncovers the one after it; the
 *  hero plate comes last so the final wipe hands the same car over to the hero screen. */
const PLATES = ["/img/heritage_archive3.jpg", "/img/car_300sl.jpg", "/img/machine_car.jpg", "/img/journey.jpg", "/img/hero.jpg"];

/** The wipe: the left edge of the clip travels to the right edge, so the plate narrows into a
 *  strip on the right and is gone. Explicit 4-value insets — GSAP needs matching shapes. */
const OPEN = "inset(0% 0% 0% 0%)";
const GONE = "inset(0% 0% 0% 100%)";
const WIPE = 0.8; // one wipe
const STEP = 0.6; // gap between wipes — shorter than WIPE, so they run one behind the other
const DRIFT = 10; // xPercent the leaving plate carries to the right

const load = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

/**
 * Opening title card. The wordmark rises on paper while the plates decode; the stack then fades
 * in full-bleed and the plates wipe off one behind the other, left to right, each one uncovering
 * the next. When the hero plate is the only one left — and fonts + plates are in — the whole
 * card wipes the same way and the hero intro takes over (see lib/ready).
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
      const stack = el.querySelector<HTMLElement>(".pre-stack")!;
      const plates = gsap.utils.toArray<HTMLElement>(".pre-plate", el); // DOM order = wipe order
      const imgs = plates.map((p) => p.querySelector<HTMLImageElement>("img")!);
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

      // ---------------------------------------------------------- title on paper
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(split.chars, { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.035 }, 0.2)
        .from(est, { opacity: 0, y: 6, duration: 0.8 }, 0.9)
        .from(count, { opacity: 0, duration: 0.6 }, 0.9);

      // ---------------------------------------------------------- the plate stack
      // Every plate underneath waits a touch larger and settles to 1 as the one above leaves —
      // the depth that makes them read as a stack rather than a slideshow.
      gsap.set(stack, { autoAlpha: 0 });
      gsap.set(plates, { clipPath: OPEN });
      gsap.set(imgs.slice(1), { scale: 1.1 });
      // the title goes ink -> ivory, bronze -> gold with the fade (tokens read, never re-typed)
      const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const wipes = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
      wipes
        .to(stack, { autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 0)
        .to(el, { "--pre-fg": token("--ivory"), "--pre-ac": token("--champ"), duration: 0.9, ease: "power2.out" }, 0)
        .fromTo(imgs[0], { scale: 1.1 }, { scale: 1, duration: 1.8, ease: "power3.out" }, 0);
      plates.slice(0, -1).forEach((plate, i) => {
        const t = 1 + i * STEP;
        wipes
          .to(plate, { clipPath: GONE, duration: WIPE }, t)
          .to(imgs[i], { xPercent: DRIFT, duration: WIPE }, t)
          .set(plate, { visibility: "hidden" }, t + WIPE)
          .to(imgs[i + 1], { scale: 1, duration: 1.6, ease: "power3.out" }, t + 0.1);
      });
      // resolves as the last wipe lands (the hero plate is still settling; that carries on under the out)
      const wiped = new Promise<void>((r) => wipes.add(r, 1 + (plates.length - 2) * STEP + WIPE));

      // real loading: fonts + the plates. The stack only starts once all its plates have decoded
      // (they share the cache with the <img>s below), after the wordmark has had its beat.
      const fonts = document.fonts.ready.then(() => undefined);
      const platesIn = PLATES.map(load);
      const steps = [fonts, ...platesIn];
      steps.forEach((s) =>
        s.then(() => {
          done += 1;
          if (alive) toProgress(Math.min(0.96, done / steps.length));
        }),
      );
      const beat = new Promise<void>((r) => setTimeout(r, 700));
      Promise.all([...platesIn, beat]).then(() => {
        if (alive) wipes.play();
      });

      // ---------------------------------------------------------- out: the card itself wipes
      Promise.all([...steps, wiped]).then(() => {
        if (!alive) return;
        toProgress(1);
        const out = gsap.timeline({ defaults: { ease: "power4.inOut" }, delay: 0.4 });
        out
          .to(split.chars, { yPercent: -110, opacity: 0, duration: 0.8, stagger: 0.02 }, 0)
          .to([est, count, line], { opacity: 0, duration: 0.5 }, 0)
          .fromTo(el, { clipPath: OPEN }, { clipPath: GONE, duration: 1.1 }, 0.35)
          .to(imgs[imgs.length - 1], { xPercent: DRIFT, duration: 1.1 }, 0.35)
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
      <div className="pre-stack">
        {PLATES.map((src, i) => (
          // first plate on top: it is the first to leave
          <div key={src} className="pre-plate" style={{ zIndex: PLATES.length - i }}>
            <img src={src} alt="" draggable={false} />
          </div>
        ))}
        <div className="ov pre-grade" />
      </div>
      <div className="pre-card">
        <div className="pre-brand disp">VINTAGE MOTORS</div>
        <div className="pre-line" />
        <div className="pre-row">
          <span className="tiny pre-est">Est. 1958</span>
          <span className="num pre-count">000</span>
        </div>
      </div>
    </div>
  );
}
