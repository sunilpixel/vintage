"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { CARS } from "@/content/site";

/** frame sequence written by scripts/build-reel.py (see public/reel/manifest.json) */
const REEL = { count: 96, fpc: 16, fps: 24, src: (i: number) => `/reel/f_${String(i).padStart(3, "0")}.jpg` };
const N = CARS.length;
const WORD = "MACHINE";

const timecode = (frame: number) => {
  const s = Math.floor(frame / REEL.fps);
  const f = frame % REEL.fps;
  return `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};

/**
 * The Machine — the film. Ninety-six graded frames scrub with the scroll. At first they play
 * through the letters of a giant MACHINE (an SVG text clip-path); then the letters zoom until the
 * frame fills the screen, the letterbox bars slide in and the reel runs on: hard cuts with a
 * flash between machines, a running timecode, projector weave when you scroll fast, and the
 * bars closing over the last frame.
 */
export default function Machine() {
  const root = useRef<HTMLElement>(null);
  const maskCanvas = useRef<HTMLCanvasElement>(null);
  const fullCanvas = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const stage = q<HTMLElement>(".mac-stage")[0];
      const masked = q<HTMLElement>(".mac-masked")[0];
      const full = q<HTMLElement>(".mac-full")[0];
      const text = textRef.current!;
      const canvases = [maskCanvas.current!, fullCanvas.current!];
      const ctxs = canvases.map((c) => c.getContext("2d", { alpha: false })!);
      const names = q<HTMLElement>(".mac-name");
      const specs = q<HTMLElement>(".mac-spec");
      const segFills = q<HTMLElement>(".mac-seg i");
      const segs = q<HTMLElement>(".mac-seg");
      const tc = q<HTMLElement>(".mac-tc-time")[0];
      const fr = q<HTMLElement>(".mac-tc-frame")[0];
      const flash = q<HTMLElement>(".mac-flash")[0];
      const flicker = q<HTMLElement>(".mac-flicker")[0];
      const bars = q<HTMLElement>(".mac-bar");
      const ui = q<HTMLElement>(".mac-ui")[0];
      const intro = q<HTMLElement>(".mac-intro")[0];
      const loadingN = q<HTMLElement>(".mac-loading-n")[0];
      const splits = names.map((n) => new SplitText(n, { type: "chars", charsClass: "ch" }));

      // ---------------------------------------------------------- the word (clip-path in stage px)
      // The clipPath uses userSpaceOnUse, so the text is laid out in the stage's own pixels:
      // size it to span ~92% of the width and sit on the optical centre.
      const measure = q<SVGTextElement>(".mac-measure")[0];
      const layoutWord = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        measure.setAttribute("font-size", "100");
        const len = measure.getComputedTextLength() || 500;
        const fs = (100 * w * 0.92) / len;
        const x = w / 2;
        const y = h / 2 + fs * 0.35;
        [text, measure].forEach((t) => {
          t.setAttribute("font-size", String(fs));
          t.setAttribute("x", String(x));
          t.setAttribute("y", String(y));
        });
        // the zoom dives into the thick left stem of the H (4th letter)
        let ox = w / 2;
        try {
          const ext = measure.getExtentOfChar(3);
          ox = ext.x + fs * 0.13;
        } catch {
          ox = w / 2 - (fs * len) / 200 + (fs * len * 0.5) / 100;
        }
        gsap.set(text, { scale: 1, svgOrigin: `${ox} ${h / 2 - fs * 0.12}` });
      };
      layoutWord();
      document.fonts?.ready.then(layoutWord);

      // ---------------------------------------------------------- frames
      const frames: (HTMLImageElement | undefined)[] = [];
      let loaded = 0;
      let current = -1;
      let loading = false;
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvases.forEach((c) => {
          c.width = Math.round(c.clientWidth * dpr);
          c.height = Math.round(c.clientHeight * dpr);
        });
        current = -1;
      };
      const nearestIndex = (i: number) => {
        for (let d = 0; d < REEL.count; d++) {
          if (frames[i - d]) return i - d;
          if (frames[i + d]) return i + d;
        }
        return -1;
      };
      const nearest = (i: number) => {
        const n = nearestIndex(i);
        return n < 0 ? undefined : frames[n];
      };
      // A sliding window of pre-decoded bitmaps around the head. drawImage(HTMLImageElement) can
      // re-decode the JPEG on the main thread whenever Chrome's decoded-image cache has evicted it
      // (96 frames do not fit); a bitmap is decoded off-thread once and blitted. Only ±WINDOW
      // frames are kept so the iGPU is not asked to hold all 96 (which was slower still).
      const WINDOW = 12;
      const bitmaps = new Map<number, ImageBitmap>();
      const pending = new Set<number>();
      let alive = true;
      const canBitmap = typeof createImageBitmap === "function";
      const warm = (around: number) => {
        if (!canBitmap) return;
        for (const [i, b] of bitmaps) {
          if (Math.abs(i - around) > WINDOW + 4) {
            b.close();
            bitmaps.delete(i);
          }
        }
        for (let d = 0; d <= WINDOW; d++) {
          for (const i of [around + d, around - d]) {
            const img = frames[i];
            if (!img || bitmaps.has(i) || pending.has(i)) continue;
            pending.add(i);
            createImageBitmap(img).then(
              (b) => {
                pending.delete(i);
                if (alive && Math.abs(i - current) <= WINDOW + 4) bitmaps.set(i, b);
                else b.close();
              },
              () => pending.delete(i),
            );
          }
        }
      };
      // the masked canvas only shows during the word phase (frames 0–10); the full one afterwards
      const MASK_LAST = Math.ceil(REEL.fpc * 0.6) + 1;
      const draw = (i: number, force = false) => {
        if (i === current && !force) return;
        const n = nearestIndex(i);
        if (n < 0) return;
        const img = frames[n]!;
        current = i;
        const src = bitmaps.get(n) ?? img;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        canvases.forEach((c, k) => {
          if (k === 0 && i > MASK_LAST && !force) return; // hidden behind the full frame: skip the blit
          const cw = c.width;
          const ch = c.height;
          const s = Math.max(cw / iw, ch / ih);
          const w = iw * s;
          const h = ih * s;
          ctxs[k].drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
        });
        warm(i);
      };
      const load = (i: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            frames[i] = img;
            loaded += 1;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = REEL.src(i);
        });
      const loadAll = async () => {
        if (loading) return;
        loading = true;
        await load(0);
        draw(0, true);
        const queue = Array.from({ length: REEL.count - 1 }, (_, i) => i + 1);
        await Promise.all(
          Array.from({ length: 6 }, async () => {
            while (queue.length) {
              const i = queue.shift()!;
              await load(i);
              if (loadingN) loadingN.textContent = String(Math.round((loaded / REEL.count) * 100)).padStart(3, "0");
              const want = current < 0 ? 0 : current;
              if (nearest(want) === frames[i]) draw(want, true);
            }
          }),
        );
        sec.classList.add("is-ready");
      };
      fit();
      const onResize = () => {
        fit();
        layoutWord();
        draw(Math.max(0, current), true);
      };
      window.addEventListener("resize", onResize);
      ScrollTrigger.create({ trigger: sec, start: "top 200%", once: true, onEnter: loadAll });
      const idle = window.setTimeout(loadAll, 4000);

      // ---------------------------------------------------------- segments (one machine each)
      let seg = -1;
      const setSeg = (i: number) => {
        if (i === seg) return;
        const prev = seg;
        seg = i;
        segs.forEach((el, j) => el.classList.toggle("on", j === i));
        if (prev >= 0) {
          gsap.fromTo(flash, { opacity: 0.3 }, { opacity: 0, duration: 0.35, ease: "power2.out", overwrite: true });
          gsap.to(splits[prev].chars, { yPercent: -110, opacity: 0, duration: 0.3, stagger: 0.012, ease: "power2.in", overwrite: true });
          gsap.to(specs[prev], { opacity: 0, y: -6, duration: 0.25, overwrite: true });
        }
        gsap.fromTo(splits[i].chars, { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 0.6, stagger: 0.02, ease: "power3.out", delay: 0.15, overwrite: true });
        gsap.fromTo(specs[i], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.3, overwrite: true });
      };
      gsap.set(splits.flatMap((s) => s.chars as HTMLElement[]), { yPercent: 110 });
      gsap.set(specs, { opacity: 0 });
      gsap.set(bars, { yPercent: (i) => (i ? 100 : -100) });

      // ---------------------------------------------------------- scroll: word → film → bars
      const head = { f: 0 };
      const setSegFill = segFills.map((el) => gsap.quickSetter(el, "scaleX"));
      const render = () => {
        const f = Math.round(head.f);
        draw(f);
        if (tc) tc.textContent = timecode(f);
        if (fr) fr.textContent = `FR ${String(f).padStart(3, "0")}`;
        const s = Math.min(N - 1, Math.floor(f / REEL.fpc));
        const within = (head.f - s * REEL.fpc) / REEL.fpc;
        setSegFill.forEach((set, j) => set(j < s ? 1 : j === s ? gsap.utils.clamp(0, 1, within) : 0));
        return s;
      };
      const ZOOM = 0.22; // share of the pin spent zooming through the word
      const weave = gsap.quickTo(canvases[1], "y", { duration: 0.4, ease: "power2.out" });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "+=520%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: layoutWord,
          onUpdate: (self) => {
            // projector weave + flicker when the reel is pulled fast (only once the film is full)
            if (self.progress < ZOOM) return;
            const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 3000);
            weave(v * 10);
            gsap.to(flicker, { opacity: Math.abs(v) * 0.22, duration: 0.3, overwrite: true, onComplete: () => gsap.to(flicker, { opacity: 0, duration: 0.5 }) });
          },
        },
        defaults: { ease: "none" },
      });
      tl
        // the first frames run inside the letters, the word drifts up a touch
        .to(head, { f: REEL.fpc * 0.6, duration: ZOOM * 0.55, onUpdate: render }, 0)
        .to(intro, { opacity: 0, y: -20, duration: ZOOM * 0.3 }, ZOOM * 0.2)
        // then the letters dive: the H's stem swallows the screen while the full frame fades up beneath
        .to(text, { scale: 90, duration: ZOOM * 0.6, ease: "power3.in" }, ZOOM * 0.4)
        .fromTo(full, { opacity: 0 }, { opacity: 1, duration: ZOOM * 0.25 }, ZOOM * 0.68)
        .set(masked, { visibility: "hidden" }, ZOOM)
        // letterbox + UI
        .to(bars, { yPercent: 0, duration: 0.05, ease: "power3.out" }, ZOOM)
        .fromTo(ui, { opacity: 0 }, { opacity: 1, duration: 0.05 }, ZOOM + 0.02)
        .add(() => setSeg(0), ZOOM + 0.01)
        // the film runs
        .to(head, { f: REEL.count - 1, duration: 1 - ZOOM - 0.08, onUpdate: () => setSeg(render()) }, ZOOM)
        // the bars close over the last frame
        .to(ui, { opacity: 0, duration: 0.03 }, 0.93)
        .to(bars[0], { yPercent: 0, height: "50.5vh", duration: 0.07, ease: "power2.inOut" }, 0.93)
        .to(bars[1], { yPercent: 0, height: "50.5vh", duration: 0.07, ease: "power2.inOut" }, 0.93);

      // ---------------------------------------------------------- entrance
      gsap
        .timeline({ scrollTrigger: { trigger: sec, start: "top 70%", once: true }, defaults: { ease: "power4.out" } })
        .fromTo(masked, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, ease: "power3.out" }, 0)
        .from(q(".mac-intro > *"), { opacity: 0, y: 10, duration: 1, stagger: 0.08 }, 0.5);

      return () => {
        alive = false;
        bitmaps.forEach((b) => b.close());
        bitmaps.clear();
        window.removeEventListener("resize", onResize);
        window.clearTimeout(idle);
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="machine" className="sec mac world-cinema" data-section data-theme="cinema">
      <div className="mac-stage">
        <svg className="mac-svg" aria-hidden="true">
          <defs>
            <clipPath id="mac-clip" clipPathUnits="userSpaceOnUse">
              <text ref={textRef} className="mac-text" textAnchor="middle" fontSize="100">
                {WORD}
              </text>
            </clipPath>
          </defs>
          {/* rendered (invisibly) so the word can be measured before it is used as a clip */}
          <text className="mac-text mac-measure" textAnchor="middle" fontSize="100" opacity="0">
            {WORD}
          </text>
        </svg>

        <div className="mac-full" aria-hidden="true">
          <canvas ref={fullCanvas} className="mac-canvas" />
          <div className="ov mac-grade" />
          <div className="ov mac-flicker" />
          <div className="ov mac-flash" />
        </div>
        <div className="mac-masked" style={{ clipPath: "url(#mac-clip)" }} data-cursor="play">
          <canvas ref={maskCanvas} className="mac-canvas" aria-label="The machine — a film in six parts" />
          <div className="ov mac-grade" />
        </div>

        <div className="mac-bar mac-bar-t" aria-hidden="true" />
        <div className="mac-bar mac-bar-b" aria-hidden="true" />

        <div className="mac-intro">
          <span className="lbl acc">05 — The machine</span>
          <span className="tiny">A film in six parts · scroll to play</span>
          <span className="tiny mac-loading">
            Loading reel <b className="mac-loading-n">000</b>
          </span>
        </div>

        <div className="mac-ui">
          <div className="mac-tc">
            <span className="tiny">Reel 05 · 24 fps</span>
            <span className="num mac-tc-time">00:00:00:00</span>
            <span className="tiny mac-tc-frame">FR 000</span>
          </div>
          <div className="mac-title">
            {CARS.map((car) => (
              <h3 key={car.id} className="disp it mac-name">
                {car.name}
              </h3>
            ))}
          </div>
          <div className="mac-specs">
            {CARS.map((car) => (
              <div key={car.id} className="tiny mac-spec">
                <span className="acc">{car.index} / 06</span> · {car.sub} · {car.year} · {car.engine} · {car.power}
              </div>
            ))}
          </div>
          <div className="mac-strip" aria-hidden="true">
            {CARS.map((car) => (
              <span key={car.id} className="mac-seg">
                <i />
                <b className="num">{car.index}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
