"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, DESKTOP, FINE_POINTER, radius } from "@/lib/gsap";
import { ShaderPlane, webglSupported } from "@/lib/gl/ShaderPlane";
import { HERO_FRAG } from "@/lib/gl/shaders";
import { createLens } from "@/lib/lens";
import { whenReady } from "@/lib/ready";
import { setTheme } from "@/lib/theme";
import LensRing from "@/components/LensRing";

const PLATE = "/img/hero.jpg";

/**
 * Overture. A rounded "screen" sits between the top labels and the giant wordmark; scrolling
 * pushes it out to the full viewport like a cinema curtain opening, the wordmark sinks away, the
 * letterbox bars slide in and the film title appears. Pointer: the screen tilts, the lens roams
 * the plate, and the wordmark's letters lift under the cursor.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useGSAP(
    (ctx, contextSafe) => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const box = q<HTMLElement>(".hero-box")[0];
      const screen = q<HTMLElement>(".hero-screen")[0];
      const inner = q<HTMLElement>(".hero-screen-in")[0];
      const img = q<HTMLElement>(".hero-img")[0];
      const word = q<HTMLElement>(".hero-word")[0];
      const top = q<HTMLElement>(".hero-top")[0];
      const bottom = q<HTMLElement>(".hero-bottom")[0];
      const bars = q<HTMLElement>(".hero-bar");
      const title = q<HTMLElement>(".hero-title")[0];
      const desktop = window.matchMedia(DESKTOP).matches;
      const fine = window.matchMedia(FINE_POINTER).matches;

      // ---------------------------------------------------------- the screen fits its slot
      const fit = () => {
        const h = box.clientHeight;
        const w = Math.min(box.clientWidth, h * (16 / 9));
        gsap.set(screen, { width: w, height: w / (16 / 9) });
      };
      fit();
      const cover = () => {
        const r = { w: screen.offsetWidth, h: screen.offsetHeight };
        return Math.max(window.innerWidth / r.w, window.innerHeight / r.h) + 0.02;
      };

      // ---------------------------------------------------------- WebGL plate + lens
      const cam = { s: 1.18, x: 0, y: 0 };
      let plane: ShaderPlane | null = null;
      let lens: ReturnType<typeof createLens> | null = null;
      const lensSize = () => Math.max(120, screen.offsetWidth * 0.28);
      const onResize = () => {
        fit();
        lens?.setSize(lensSize());
      };
      const applyCam = () => {
        if (plane) {
          plane.set("uScale", cam.s);
          plane.set("uShift", [cam.x, cam.y]);
        } else {
          gsap.set(img, { scale: cam.s, xPercent: -cam.x * 100, yPercent: -cam.y * 100 });
        }
      };
      if (webglSupported() && canvas.current) {
        try {
          plane = new ShaderPlane(canvas.current, HERO_FRAG);
          plane.set("uFocus", [0.5, 0.5]);
          plane.set("uZoom", 1.35);
          plane.set("uLens", 0);
          plane.set("uPar", [0, 0]);
          plane.texture("uImg", img as HTMLImageElement).then(() => {
            sec.classList.add("gl-on");
            plane?.render();
          });
          lens = createLens(plane, {
            area: plate.current!,
            ring: ring.current,
            rest: [0.7, 0.58],
            size: lensSize(),
            lerp: 0.1,
            restVisible: true,
            onTick: (x, y, w, h) => plane?.set("uPar", [(x / w - 0.5) * 0.014, -(y / h - 0.5) * 0.01]),
          });
          lens.setActive(true);
          ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onToggle: (self) => lens?.setActive(self.isActive) });
        } catch (err) {
          console.warn("[vintage] lens disabled:", err);
          plane = null;
        }
      }
      applyCam();
      window.addEventListener("resize", onResize);

      // ---------------------------------------------------------- pointer: tilt + letters
      const prog = { p: 0 };
      if (fine && desktop) {
        gsap.set(screen, { transformPerspective: 1600 });
        const rx = gsap.quickTo(screen, "rotateX", { duration: 1.2, ease: "power3" });
        const ry = gsap.quickTo(screen, "rotateY", { duration: 1.2, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const k = 1 - prog.p; // the tilt dies as the screen goes full-bleed
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ry(nx * 6 * k);
          rx(-ny * 5 * k);
        };
        sec.addEventListener("pointermove", onMove);
        ctx.add(() => () => sec.removeEventListener("pointermove", onMove));
      }

      // ---------------------------------------------------------- intro (waits for the preloader)
      const split = new SplitText(word, { type: "chars", charsClass: "ch hero-ch" });
      gsap.set([top, bottom], { opacity: 0 });
      gsap.set(bars, { yPercent: (i) => (i ? 100 : -100) });
      const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      intro
        .fromTo(inner, { scale: 0.86, opacity: 0, borderRadius: 64 }, { scale: 1, opacity: 1, borderRadius: radius(), duration: 2, ease: "expo.out" }, 0)
        .to(cam, { s: 1, duration: 2.6, onUpdate: applyCam }, 0)
        .from(split.chars, { yPercent: 110, rotate: 4, duration: 1.4, stagger: 0.05, ease: "power4.out" }, 0.4)
        .to([top, bottom], { opacity: 1, duration: 1.2, stagger: 0.1 }, 1.1)
        .add(() => lens?.setVisible(true), 1.2);
      const unready = whenReady(() => intro.play());

      // letters lift under the pointer (magnetic-ish, per glyph)
      if (fine && desktop) {
        split.chars.forEach((c) => {
          const el = c as HTMLElement;
          const on = () => gsap.to(el, { y: -14, color: "var(--accent)", duration: 0.5, ease: "power3.out", overwrite: true });
          const off = () => gsap.to(el, { y: 0, color: "inherit", duration: 1.1, ease: "elastic.out(1, 0.45)", overwrite: true });
          el.addEventListener("pointerenter", on);
          el.addEventListener("pointerleave", off);
        });
      }

      // ---------------------------------------------------------- scroll: the curtain opens
      // Pin + empty scrub timeline are created now, while the geometry is unscrolled; the tweens
      // are added when the intro completes so they start from the post-intro state.
      if (desktop) {
        ScrollTrigger.create({ trigger: sec, start: "top top", end: "+=170%", pin: true, anticipatePin: 1 });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec,
            start: 0,
            end: () => window.innerHeight * 1.7,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              prog.p = self.progress;
              setTheme(self.progress > 0.45 ? "cinema" : "paper");
            },
          },
          defaults: { ease: "none" },
        });
        const build = contextSafe!(() => {
          tl.fromTo(inner, { scale: 1, borderRadius: radius() }, { scale: () => cover(), borderRadius: 0, duration: 0.55, ease: "power2.inOut", immediateRender: false }, 0)
            .to(cam, { s: 1.14, x: -0.02, y: 0.015, duration: 1, onUpdate: applyCam }, 0)
            .to(word, { yPercent: 70, opacity: 0, duration: 0.4, ease: "power1.in" }, 0)
            .to([top, bottom], { opacity: 0, y: -10, duration: 0.25 }, 0)
            .to(bars, { yPercent: 0, duration: 0.3, ease: "power3.out" }, 0.5)
            .fromTo(title, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.25 }, 0.62)
            .to(title, { opacity: 0, filter: "blur(6px)", duration: 0.12 }, 0.9)
            .fromTo(q(".hero-fade"), { opacity: 0 }, { opacity: 0.85, duration: 0.15 }, 0.85);
          tl.eventCallback("onUpdate", () => lens?.setRest(0.7 - 0.12 * tl.progress(), 0.58 - 0.05 * tl.progress()));
        });
        intro.eventCallback("onComplete", build);
      }
      // impatient visitors: the first scroll intent hurries the intro along
      const hurry = () => {
        if (intro.isActive()) intro.timeScale(3);
      };
      window.addEventListener("wheel", hurry, { once: true, passive: true });
      window.addEventListener("touchmove", hurry, { once: true, passive: true });

      return () => {
        unready();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("wheel", hurry);
        window.removeEventListener("touchmove", hurry);
        split.revert();
        lens?.destroy();
        plane?.destroy();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="hero" className="sec hero" data-section>
      <div className="hero-top">
        <span className="lbl">Est. 1958 — a private collection</span>
        <span className="lbl dim">Lake Como · Italy</span>
        <span className="lbl">A film in nine chapters</span>
      </div>

      <div className="hero-box">
        <div className="hero-screen">
          <div className="hero-screen-in">
            <div ref={plate} className="hero-plate" data-cursor="lens">
              <img className="hero-img" src={PLATE} alt="Silver 1964 Aston Martin DB5 coupé on a stone courtyard, three-quarter front view" />
              <canvas ref={canvas} className="hero-gl" />
              <div className="ov hero-grade" />
              <LensRing ref={ring} label="Lens 01 — 85 mm · ƒ/1.4" />
            </div>
          </div>
        </div>
      </div>

      <div className="hero-film" aria-hidden="true">
        <div className="ov hero-fade" />
        <div className="hero-bar hero-bar-t" />
        <div className="hero-bar hero-bar-b" />
        <div className="hero-title">
          <span className="tiny">Chapter one</span>
          <h2 className="disp it">Timeless machines</h2>
          <span className="tiny">300 SLR coupé — 1955 · stone hall, golden hour</span>
        </div>
      </div>

      <h1 className="disp hero-word" aria-label="Vintage">
        VINTAGE
      </h1>

      <div className="hero-bottom">
        <span className="lbl dim hero-scroll">Scroll to enter the film</span>
        <span className="lbl">Six machines · one family</span>
      </div>
    </section>
  );
}
