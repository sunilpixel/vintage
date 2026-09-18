"use client";

import { useRef } from "react";
import { gsap, useGSAP, DESKTOP, FINE_POINTER } from "@/lib/gsap";
import { MATERIALS } from "@/content/site";

/**
 * Craft — a sticky stack. Five cards, one per material; each sticks near the top while the next
 * slides over it, and the covered card eases back (smaller, dimmer). Inside a card the label
 * unscrambles, the hairline draws, and the plate follows the pointer in depth.
 *
 * Layout lives in Tailwind utilities here rather than styles/sections.css — the .craft-* classes
 * that remain are GSAP hooks only. Note the hand-written CSS in globals/sections is unlayered, so
 * it outranks utilities: where a shared class (.disp, .copy) sets the same property, the utility
 * carries a trailing `!`.
 */

/** Plate corner radius, px. The reveal animates a rounded clip-path, so it has to match the
 *  `rounded-xl` on .craft-plate — keep the two in step. */
const PLATE_R = 12;

export default function Craft() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const desktop = window.matchMedia(DESKTOP).matches;
      const fine = window.matchMedia(FINE_POINTER).matches;
      const cards = q<HTMLElement>(".craft-card");

      // ---- head
      gsap
        .timeline({
          scrollTrigger: {
            trigger: q(".craft-head")[0],
            start: "top 78%",
            once: true,
          },
          defaults: { ease: "power4.out" },
        })
        .fromTo(
          q(".craft-h .mask-line > span"),
          {
            yPercent: 110,
            rotateX: -40,
            transformPerspective: 800,
            transformOrigin: "50% 100%",
          },
          { yPercent: 0, rotateX: 0, duration: 1.6, stagger: 0.14 },
          0,
        )
        .from(
          q(".craft-head .lbl, .craft-lead"),
          { opacity: 0, y: 10, duration: 1, stagger: 0.1 },
          0.4,
        );

      cards.forEach((card, i) => {
        const label = card.querySelector<HTMLElement>(".craft-label")!;
        const plate = card.querySelector<HTMLElement>(".craft-plate")!;
        const img = plate.querySelector<HTMLElement>("img")!;
        const copy = card.querySelector<HTMLElement>(".craft-copy")!;
        const final = label.textContent || "";

        // ---- entering: label unscrambles, rule draws, plate opens, copy rises
        gsap
          .timeline({
            scrollTrigger: { trigger: card, start: "top 75%", once: true },
            defaults: { ease: "power4.out" },
          })
          .to(
            label,
            {
              duration: 1.4,
              scrambleText: {
                text: final,
                chars: "upperCase",
                speed: 0.5,
                revealDelay: 0.2,
              },
            },
            0,
          )
          .fromTo(
            card.querySelector(".craft-rule"),
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 1.4, ease: "power4.inOut" },
            0.1,
          )
          .fromTo(
            plate,
            { clipPath: `inset(0% 0% 0% 100% round ${PLATE_R}px)` },
            {
              clipPath: `inset(0% 0% 0% 0% round ${PLATE_R}px)`,
              duration: 1.6,
              ease: "power4.inOut",
            },
            0,
          )
          .fromTo(
            img,
            { scale: 1.3 },
            { scale: 1.02, duration: 2, ease: "power3.out" },
            0,
          )
          .from(copy, { opacity: 0, y: 16, duration: 1.2 }, 0.5)
          .from(
            card.querySelectorAll(".craft-cap, .craft-idx"),
            { opacity: 0, y: 8, duration: 0.9, stagger: 0.1 },
            0.6,
          );

        // ---- the stack: while the next card slides over, this one steps back
        if (desktop && i < cards.length - 1) {
          gsap.fromTo(
            card,
            { scale: 1, filter: "brightness(1)" },
            {
              scale: 0.94,
              filter: "brightness(0.82)",
              ease: "none",
              scrollTrigger: {
                trigger: cards[i + 1],
                start: "top bottom",
                end: "top 8%",
                scrub: true,
              },
            },
          );
        }

        // ---- pointer depth on the plate
        if (fine && desktop) {
          const px = gsap.quickTo(img, "xPercent", {
            duration: 1.1,
            ease: "power3",
          });
          const py = gsap.quickTo(img, "yPercent", {
            duration: 1.1,
            ease: "power3",
          });
          const move = (e: PointerEvent) => {
            const r = plate.getBoundingClientRect();
            px(((e.clientX - r.left) / r.width - 0.5) * -6);
            py(((e.clientY - r.top) / r.height - 0.5) * -6);
          };
          const leave = () => {
            px(0);
            py(0);
          };
          plate.addEventListener("pointermove", move);
          plate.addEventListener("pointerenter", () =>
            gsap.to(img, {
              scale: 1.1,
              duration: 1.2,
              ease: "power3.out",
              overwrite: "auto",
            }),
          );
          plate.addEventListener("pointerleave", () => {
            leave();
            gsap.to(img, {
              scale: 1.02,
              duration: 1.2,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        }
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="craft"
      className="sec craft pt-[16vh] max-desk:pt-[12vh]"
      data-section
      data-theme="paper"
    >
      <div className="craft-head mb-[8vh] grid grid-cols-2 items-end gap-x-[4vw] gap-y-5.5 px-gut max-desk:mb-[6vh] max-desk:grid-cols-1">
        <span className="lbl acc col-span-full">06 — Craft</span>
        <h2 className="disp craft-h vskew text-[clamp(38px,5vw,88px)] max-desk:text-[40px]">
          <span className="mask-line">
            <span>Built by hand,</span>
          </span>
          <span className="mask-line">
            <span>
              <em>one car at a time.</em>
            </span>
          </span>
        </h2>
        <p className="copy craft-lead m-0 max-w-110 justify-self-end max-desk:justify-self-start">
          Four craftsmen. Panels are hand-formed on the original bucks; hides
          are cut and stitched in the house workshop; every gauge is rebuilt,
          never replaced.
        </p>
      </div>

      <div className="relative px-gut pb-[12vh]">
        {MATERIALS.map((m) => (
          <article
            key={m.id}
            className="craft-card sticky top-[8vh] mb-[16vh] grid h-[84vh] grid-cols-[1fr_1.1fr] gap-[3vw] overflow-hidden rounded-2xl border border-line bg-surface p-[clamp(24px,3vw,48px)] origin-top will-change-[transform,filter] last:mb-0 max-lap:grid-cols-2 max-desk:top-[6vh] max-desk:mb-[14vh] max-desk:grid-cols-1 max-desk:grid-rows-[auto_1fr] max-desk:gap-4.5 max-desk:h-[86svh] max-desk:rounded-xl max-desk:p-5"
          >
            <div className="flex min-h-0 flex-col gap-4.5 max-desk:gap-2.5">
              <span className="num craft-idx">
                {m.index} / {String(MATERIALS.length).padStart(2, "0")}
              </span>
              <h3
                className="disp craft-label text-[clamp(52px,7vw,120px)] uppercase tracking-[-0.02em]! max-desk:text-[50px]"
                aria-label={m.label}
              >
                {m.label}
              </h3>
              <span className="hl craft-rule w-full" />
              <span className="lbl craft-cap">{m.caption}</span>
              <p className="copy craft-copy m-0 max-w-105 max-desk:text-[13px]! max-desk:leading-[1.55]!">
                {m.copy}
              </p>
            </div>
            <div
              className="craft-plate relative aspect-3/2 max-h-full w-full self-center overflow-hidden rounded-xl bg-surface transform-gpu max-desk:aspect-auto max-desk:h-full max-desk:min-h-0"
              data-cursor="view"
            >
              <img
                src={m.img}
                alt={m.caption}
                loading="lazy"
                className="size-full object-cover transform-[scale(1.02)] will-change-transform"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
