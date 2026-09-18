"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, useGSAP, DESKTOP, radius } from "@/lib/gsap";
import { CARS } from "@/content/site";

const N = CARS.length;
const STEP = 1; // timeline seconds per car
const TAIL = 0.6; // rest on the last car

/**
 * The Collection. Pinned: the six machines are listed on the left; on the right two frames —
 * the car and one of its details — wipe to the next machine with a clip-path as you scroll.
 * The active row's dot slides, the specs roll over letter by letter, and clicking a row scrolls
 * the pin to that machine.
 */
export default function Collection() {
  const root = useRef<HTMLElement>(null);
  // held in a ref: a `lenis` dependency would make useGSAP run the whole setup twice
  const lenis = useRef<Lenis | undefined>(undefined);
  const lenisNow = useLenis();
  useEffect(() => {
    lenis.current = lenisNow;
  }, [lenisNow]);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const desktop = window.matchMedia(DESKTOP).matches;
      const items = q<HTMLElement>(".coll-item");
      const dot = q<HTMLElement>(".coll-dot")[0];
      const carImgs = q<HTMLElement>(".coll-frame-a .coll-img");
      const detImgs = q<HTMLElement>(".coll-frame-b .coll-img");
      const specs = q<HTMLElement>(".coll-spec");
      const counter = q<HTMLElement>(".coll-count b")[0];

      // ---- entrance
      gsap
        .timeline({ scrollTrigger: { trigger: sec, start: "top 70%", once: true }, defaults: { ease: "power4.out" } })
        .fromTo(q(".coll-h .mask-line > span"), { yPercent: 110, rotateX: -40, transformPerspective: 800, transformOrigin: "50% 100%" }, { yPercent: 0, rotateX: 0, duration: 1.6, stagger: 0.14 }, 0)
        .from(items, { opacity: 0, x: -18, duration: 1, stagger: 0.07 }, 0.4)
        .fromTo(q(".coll-frame"), { clipPath: `inset(0% 0% 100% 0% round ${radius()}px)` }, { clipPath: `inset(0% 0% 0% 0% round ${radius()}px)`, duration: 1.6, stagger: 0.15, ease: "power4.inOut" }, 0.2)
        .from(q(".coll-kicker, .coll-count, .coll-hint"), { opacity: 0, y: 8, duration: 1, stagger: 0.08 }, 0.8);

      // ---- active machine
      let active = -1;
      const setActive = (i: number) => {
        if (i === active) return;
        const prev = active;
        active = i;
        items.forEach((it, j) => it.classList.toggle("on", j === i));
        carImgs.forEach((el, j) => el.classList.toggle("on", j === i));
        detImgs.forEach((el, j) => el.classList.toggle("on", j === i));
        gsap.to(dot, { y: items[i].offsetTop + items[i].offsetHeight / 2 - 4, duration: 0.8, ease: "power4.inOut", overwrite: true });
        if (counter) counter.textContent = CARS[i].index;
        // the note hands over: the old one lifts out of focus, the new one settles in
        if (prev >= 0) gsap.to(specs[prev], { autoAlpha: 0, y: -12, filter: "blur(5px)", duration: 0.35, ease: "power2.in", overwrite: true });
        gsap.fromTo(
          specs[i],
          { autoAlpha: 0, y: 16, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out", delay: 0.12, overwrite: true },
        );
      };
      gsap.set(specs, { autoAlpha: 0 });
      setActive(0);

      // hover pre-lights a row and nudges its name
      items.forEach((it) => {
        const name = it.querySelector(".coll-name");
        it.addEventListener("pointerenter", () => gsap.to(name, { x: 10, duration: 0.5, ease: "power3.out", overwrite: true }));
        it.addEventListener("pointerleave", () => gsap.to(name, { x: 0, duration: 0.7, ease: "power3.out", overwrite: true }));
      });

      if (!desktop) {
        // phones: the frames scroll with the list; each row reveals its own pair of plates
        items.forEach((it, i) => {
          it.addEventListener("click", () => setActive(i));
          ScrollTrigger.create({ trigger: it, start: "top 70%", end: "bottom 70%", onToggle: (self) => self.isActive && setActive(i) });
        });
        return;
      }

      // ---- the wipes (pinned)
      gsap.set(carImgs.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(detImgs.slice(1), { clipPath: "inset(0% 0% 100% 0%)" });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: `+=${N * 85}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => setActive(gsap.utils.clamp(0, N - 1, Math.floor(self.progress * (N - 1 + TAIL) + 0.5))),
        },
        defaults: { ease: "none" },
      });
      for (let i = 1; i < N; i++) {
        const at = i * STEP - 0.5;
        tl.fromTo(carImgs[i], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.inOut" }, at)
          .fromTo(carImgs[i].querySelector("img"), { scale: 1.18, yPercent: 6 }, { scale: 1.02, yPercent: 0, duration: 0.6, ease: "power2.out" }, at)
          .to(carImgs[i - 1].querySelector("img"), { scale: 1.1, yPercent: -4, duration: 0.5 }, at)
          .fromTo(detImgs[i], { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.inOut" }, at + 0.08)
          .fromTo(detImgs[i].querySelector("img"), { scale: 1.18, yPercent: -6 }, { scale: 1.02, yPercent: 0, duration: 0.6, ease: "power2.out" }, at + 0.08);
      }
      tl.to({}, { duration: TAIL });

      // click a row: scroll the pin to that machine
      const st = tl.scrollTrigger!;
      items.forEach((it, i) => {
        it.addEventListener("click", () => {
          const t = i === 0 ? 0.001 : (i * STEP + 0.1) / (N - 1 + TAIL);
          lenis.current?.scrollTo(st.start + (st.end - st.start) * t, { duration: 1.4 });
        });
      });

    },
    { scope: root },
  );

  return (
    <section ref={root} id="collection" className="sec coll" data-section data-theme="paper">
      <div className="coll-grid">
        <div className="coll-left">
          <div className="coll-kicker kicker">
            <span className="num">04</span>
            <span className="hl" />
            <span className="lbl">The collection</span>
          </div>
          <h2 className="disp coll-h vskew">
            <span className="mask-line">
              <span>Six machines,</span>
            </span>
            <span className="mask-line">
              <span>
                <em>one family.</em>
              </span>
            </span>
          </h2>

          <ol className="coll-list" aria-label="Machines">
            <i className="coll-dot" aria-hidden="true" />
            {CARS.map((car) => (
              <li key={car.id} className="coll-item" data-cursor="link">
                <span className="num coll-idx">{car.index}</span>
                <span className="coll-name">{car.name}</span>
                <span className="tiny coll-year">{car.year}</span>
              </li>
            ))}
          </ol>

          <div className="coll-specs">
            {CARS.map((car) => (
              <div key={car.id} className="coll-spec">
                <span className="disp it coll-note">{car.note}</span>
                <span className="tiny">
                  {car.sub} · {car.engine} · {car.power} · {car.country}
                </span>
              </div>
            ))}
          </div>
          <div className="coll-foot">
            <span className="num coll-count">
              <b>01</b> / {String(N).padStart(2, "0")}
            </span>
            <span className="tiny coll-hint">Scroll — or choose a machine</span>
          </div>
        </div>

        <div className="coll-right">
          <div className="coll-frame coll-frame-a" data-cursor="view">
            {CARS.map((car) => (
              <div key={car.id} className="coll-img">
                <img src={car.img} alt={`${car.name}, ${car.year}`} style={{ objectPosition: car.focus }} />
              </div>
            ))}
          </div>
          <div className="coll-frame coll-frame-b" data-cursor="view">
            {CARS.map((car) => (
              <div key={car.id} className="coll-img">
                <img src={car.detail} alt={car.detailCap} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
