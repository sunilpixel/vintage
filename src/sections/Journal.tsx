"use client";

import { useRef } from "react";
import { gsap, useGSAP, DESKTOP, FINE_POINTER, radius } from "@/lib/gsap";
import { STORIES } from "@/content/site";

/**
 * The Journal — an index of stories. Each row: number, plate, title, arrow. Entering, the plate
 * relaxes from a pill into a rounded frame and the title lines rise; hovering a row sweeps a
 * tint across it, the plate leans toward the pointer, the title steps right and the arrow turns.
 * A sticky issue label keeps the page while the rows pass.
 */
export default function Journal() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const desktop = window.matchMedia(DESKTOP).matches;
      const fine = window.matchMedia(FINE_POINTER).matches;
      const rows = q<HTMLElement>(".jrn-row");

      gsap
        .timeline({ scrollTrigger: { trigger: sec, start: "top 75%", once: true }, defaults: { ease: "power4.out" } })
        .fromTo(q(".jrn-h .mask-line > span"), { yPercent: 110, rotateX: -40, transformPerspective: 800, transformOrigin: "50% 100%" }, { yPercent: 0, rotateX: 0, duration: 1.6, stagger: 0.14 }, 0)
        .from(q(".jrn-head .lbl, .jrn-side > *"), { opacity: 0, y: 10, duration: 1, stagger: 0.08 }, 0.4);

      rows.forEach((row) => {
        const plate = row.querySelector<HTMLElement>(".jrn-plate")!;
        const img = plate.querySelector<HTMLElement>("img")!;
        const lines = row.querySelectorAll<HTMLElement>(".mask-line > span");
        const rule = row.querySelector<HTMLElement>(".jrn-rule")!;

        // entering: pill → frame, lines rise, rule draws
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 82%", once: true }, defaults: { ease: "power4.out" } })
          .fromTo(plate, { clipPath: "inset(0% 30% 0% 30% round 999px)" }, { clipPath: `inset(0% 0% 0% 0% round ${radius()}px)`, duration: 1.6, ease: "power4.inOut" }, 0)
          .fromTo(img, { scale: 1.3 }, { scale: 1.02, duration: 2 }, 0)
          .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.25)
          .fromTo(rule, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.4, ease: "power4.inOut" }, 0.2)
          .from(row.querySelectorAll(".jrn-n, .jrn-meta > *, .jrn-arrow"), { opacity: 0, y: 8, duration: 0.9, stagger: 0.06 }, 0.5);

        if (desktop) {
          // the plates and titles drift apart a little as the row passes
          gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 1 } });
        }

        if (fine) {
          const rx = gsap.quickTo(plate, "rotateY", { duration: 0.9, ease: "power3" });
          const ry = gsap.quickTo(plate, "rotateX", { duration: 0.9, ease: "power3" });
          gsap.set(plate, { transformPerspective: 900 });
          const move = (e: PointerEvent) => {
            const r = plate.getBoundingClientRect();
            rx(((e.clientX - r.left) / r.width - 0.5) * 10);
            ry(-((e.clientY - r.top) / r.height - 0.5) * 8);
          };
          const enter = () => {
            row.classList.add("is-hover");
            gsap.to(img, { scale: 1.1, duration: 1.2, ease: "power3.out", overwrite: "auto" });
          };
          const leave = () => {
            row.classList.remove("is-hover");
            rx(0);
            ry(0);
            gsap.to(img, { scale: 1.02, duration: 1.2, ease: "power3.out", overwrite: "auto" });
          };
          row.addEventListener("pointermove", move);
          row.addEventListener("pointerenter", enter);
          row.addEventListener("pointerleave", leave);
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="journal" className="sec jrn" data-section data-theme="paper">
      <div className="jrn-head">
        <span className="lbl acc">08 — The journal</span>
        <h2 className="disp jrn-h vskew">
          <span className="mask-line">
            <span>Stories</span>
          </span>
          <span className="mask-line">
            <span>
              <em>from the road.</em>
            </span>
          </span>
        </h2>
      </div>

      <div className="jrn-body">
        <aside className="jrn-side">
          <span className="tiny">Issue 07</span>
          <span className="tiny">Autumn 2026</span>
          <span className="tiny">Three stories</span>
        </aside>

        <div className="jrn-rows">
          {STORIES.map((s) => (
            <a key={s.id} href={`#story-${s.story}`} className="jrn-row" data-cursor="read" aria-label={`Read: ${s.title.join(" ")}`}>
              <span className="hl jrn-rule" />
              <span className="num jrn-n">{s.story}</span>
              <span className="plate jrn-plate">
                <img src={s.img} alt="" loading="lazy" />
              </span>
              <span className="jrn-txt">
                <span className="disp jrn-title">
                  <span className="mask-line">
                    <span>{s.title[0]}</span>
                  </span>
                  <span className="mask-line">
                    <span>
                      <em>{s.title[1]}</em>
                    </span>
                  </span>
                </span>
                <span className="jrn-meta">
                  <span className="tiny">{s.date}</span>
                  <span className="tiny">{s.location}</span>
                  <span className="tiny">{s.model}</span>
                </span>
              </span>
              <span className="jrn-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
