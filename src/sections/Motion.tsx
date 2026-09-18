"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MOTION } from "@/content/site";

/**
 * In motion. Three rows of pill-shaped plates, pinned: as you scroll the top and bottom rows
 * drift left while the middle row drifts right, until the E-Type — the centre of the middle row —
 * lands in the centre of the screen and stops. The rest of the pills dim, the caption appears.
 */
export default function Motion() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const rows = q<HTMLElement>(".motion-row");
      const pills = q<HTMLElement>(".motion-pill");
      const hero = q<HTMLElement>(".motion-pill.is-hero")[0];
      const others = pills.filter((p) => p !== hero);
      const cap = q<HTMLElement>(".motion-cap")[0];
      const head = q<HTMLElement>(".motion-head > *");

      // every row is centred on the viewport so the hero pill (the middle of row B) sits at x = 0
      const centre = () => rows.forEach((row) => gsap.set(row, { left: (window.innerWidth - row.offsetWidth) / 2 }));
      centre();
      const over = (row: HTMLElement) => (row.offsetWidth - window.innerWidth) / 2;
      const skews = rows.map((row) => gsap.quickTo(row, "skewX", { duration: 0.5, ease: "power2.out" }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "+=260%",
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: centre,
          onUpdate: (self) => {
            // the rows lean into the scroll, a little more the faster you go
            const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
            skews.forEach((skew, i) => skew(v * (i === 1 ? -5 : 5)));
          },
        },
        defaults: { ease: "none" },
      });

      const MOVE = 0.82; // the rows travel for this share of the pin, then the centre settles
      // row A: right → left, row B: left → centre, row C: right → left (offset phase)
      tl.fromTo(rows[0], { x: () => over(rows[0]) + window.innerWidth * 0.12 }, { x: () => -over(rows[0]) - window.innerWidth * 0.12, duration: MOVE }, 0)
        .fromTo(rows[1], { x: () => -over(rows[1]) - window.innerWidth * 0.24 }, { x: 0, duration: MOVE }, 0)
        .fromTo(rows[2], { x: () => over(rows[2]) * 0.5 + window.innerWidth * 0.22 }, { x: () => -over(rows[2]) * 1.5 - window.innerWidth * 0.02, duration: MOVE }, 0)
        // the landing: the E-Type grows, the others step back, the caption rises
        .to(hero, { scale: 1.16, duration: 1 - MOVE, ease: "power2.inOut" }, MOVE)
        .to(others, { opacity: 0.32, scale: 0.94, duration: 1 - MOVE, ease: "power2.inOut" }, MOVE)
        .fromTo(cap, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: (1 - MOVE) * 0.7, ease: "power2.out" }, MOVE + 0.05)
        .to(head, { opacity: 0.35, duration: 1 - MOVE }, MOVE);

      // entrance: the pills roll in from their row's direction
      gsap.from(pills, {
        opacity: 0,
        scale: 0.7,
        duration: 1.4,
        ease: "power4.out",
        stagger: { each: 0.05, from: "center" },
        scrollTrigger: { trigger: sec, start: "top 75%", once: true },
      });

      // hover: the plate breathes and its chip label shows
      pills.forEach((pill) => {
        const chip = pill.querySelector<HTMLElement>(".motion-chip");
        const on = () => gsap.to(chip, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: true });
        const off = () => gsap.to(chip, { opacity: 0, y: 8, duration: 0.4, overwrite: true });
        pill.addEventListener("pointerenter", on);
        pill.addEventListener("pointerleave", off);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="motion" className="sec motion" data-section data-theme="paper">
      <div className="motion-head">
        <span className="lbl acc">03 — In motion</span>
        <h2 className="disp motion-h">
          Sixty-eight years, <em>still moving.</em>
        </h2>
        <span className="lbl dim">Scroll — the rows drift</span>
      </div>

      <div className="motion-rows">
        {MOTION.map((row, r) => (
          <div key={r} className={`motion-row motion-row-${"abc"[r]}`}>
            {row.map((p) => (
              <figure key={p.img} className={`plate motion-pill${p.hero ? " is-hero" : ""}`} data-cursor="view">
                <img src={p.img} alt={p.label} loading="lazy" />
                <figcaption className="tiny motion-chip">{p.label}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>

      <div className="motion-cap">
        <span className="num">1961</span>
        <span className="disp it">Jaguar E-Type — Series 1</span>
        <span className="tiny">The car that started the family</span>
      </div>
    </section>
  );
}
