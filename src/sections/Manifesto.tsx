"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { MANIFESTO } from "@/content/site";

/**
 * Manifesto. One statement, filled in word by word as you scroll; three plates open inside the
 * sentence as their line is read. Below, the figures count up.
 */
export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const text = q<HTMLElement>(".mani-text")[0];
      const pills = q<HTMLElement>(".mani-pill");
      const figs = q<HTMLElement>(".mani-fig");

      // words are split per line so the inline plates keep their place in the flow
      const split = new SplitText(q(".mani-line"), { type: "words", wordsClass: "w mani-w", tag: "span" });
      const words = split.words as HTMLElement[];

      const tl = gsap.timeline({
        scrollTrigger: { trigger: text, start: "top 78%", end: "bottom 45%", scrub: 0.8 },
        defaults: { ease: "none" },
      });
      tl.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.04, duration: 0.4 }, 0);
      // each plate opens when the reading reaches the end of its line
      pills.forEach((pill) => {
        const line = pill.closest<HTMLElement>(".mani-line-wrap")!.querySelector<HTMLElement>(".mani-line")!;
        const lastWord = line.querySelectorAll<HTMLElement>(".mani-w");
        const idx = words.indexOf(lastWord[lastWord.length - 1]);
        tl.fromTo(pill, { width: 0, marginLeft: 0 }, { width: "1.8em", marginLeft: "0.18em", duration: 0.5, ease: "power2.inOut" }, Math.max(0, idx * 0.04 - 0.1));
      });

      // hover: a plate leans out and shows its caption
      pills.forEach((pill) => {
        const cap = pill.querySelector<HTMLElement>(".mani-cap");
        const on = () => {
          gsap.to(pill, { scale: 1.16, rotate: -5, duration: 0.6, ease: "power3.out", overwrite: "auto" });
          gsap.to(cap, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
        };
        const off = () => {
          gsap.to(pill, { scale: 1, rotate: 0, duration: 1, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
          gsap.to(cap, { opacity: 0, y: 6, duration: 0.4, overwrite: "auto" });
        };
        pill.addEventListener("pointerenter", on);
        pill.addEventListener("pointerleave", off);
      });

      // figures: hairline draws, digits count up, labels fade
      figs.forEach((fig, i) => {
        const n = fig.querySelector<HTMLElement>(".mani-fig-n")!;
        const target = Number(n.dataset.n);
        const v = { n: 0 };
        gsap
          .timeline({ scrollTrigger: { trigger: fig, start: "top 88%", once: true }, delay: i * 0.12 })
          .fromTo(fig.querySelector(".hl"), { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.4, ease: "power4.inOut" }, 0)
          .to(v, { n: target, duration: 1.6, ease: "power3.out", onUpdate: () => (n.textContent = String(Math.round(v.n)).padStart(2, "0")) }, 0.2)
          .from(fig.querySelector(".mani-fig-l"), { opacity: 0, y: 8, duration: 0.9 }, 0.5);
      });

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="manifesto" className="sec mani" data-section data-theme="paper">
      <div className="mani-head">
        <span className="lbl acc">02 — Manifesto</span>
        <span className="lbl dim">Read slowly</span>
      </div>
      <p className="disp mani-text">
        {MANIFESTO.lines.map((l, i) => (
          <span key={i} className="mani-line-wrap">
            <span className="mani-line">{l.text}</span>
            {l.img && (
              <span className="mani-pill" data-cursor="view">
                {/* 0.15em, not a capsule: it tracks the type, and lands on the same 12px the
                    plates elsewhere use at the largest step */}
                <span className="mani-pill-in absolute inset-0 overflow-hidden rounded-[0.15em] bg-surface">
                  <img src={l.img} alt={l.alt} className="size-full object-cover" />
                </span>
                <span className="tiny mani-cap">{l.alt}</span>
              </span>
            )}{" "}
          </span>
        ))}
      </p>
      <div className="mani-figs">
        {MANIFESTO.figures.map((f) => (
          <div key={f.label} className="mani-fig">
            <span className="hl" />
            <span className="disp mani-fig-n" data-n={f.n}>
              00
            </span>
            <span className="lbl mani-fig-l">{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
