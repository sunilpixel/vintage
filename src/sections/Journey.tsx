"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, DESKTOP, radius } from "@/lib/gsap";

const QUOTE = "Drive slowly. The road has waited seventy years for you.";

/**
 * The Journey — a tracking shot. The plate begins as a letterboxed strip, opens to full height,
 * then the camera pans along the road while the quote is read word by word and the evening
 * cools the light. A hairline with a dot marks the distance travelled.
 */
export default function Journey() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const desktop = window.matchMedia(DESKTOP).matches;
      const frame = q<HTMLElement>(".jny-frame")[0];
      const track = q<HTMLElement>(".jny-track")[0];
      const img = q<HTMLElement>(".jny-track img")[0];
      const cool = q<HTMLElement>(".jny-cool")[0];
      const sun = q<HTMLElement>(".jny-sun")[0];
      const quote = q<HTMLElement>(".jny-quote")[0];
      const meta = q<HTMLElement>(".jny-meta > *");
      const dot = q<HTMLElement>(".jny-dot")[0];
      const fill = q<HTMLElement>(".jny-fill")[0];
      const split = new SplitText(quote, { type: "words", wordsClass: "w", tag: "span" });

      gsap.from(q(".jny-kicker > *"), {
        opacity: 0,
        y: 10,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: { trigger: sec, start: "top 70%", once: true },
      });

      if (!desktop) {
        gsap.fromTo(split.words, { opacity: 0.15 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: quote, start: "top 80%", end: "bottom 50%", scrub: true } });
        return () => split.revert();
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: "top top", end: "+=320%", pin: true, scrub: 1.2, anticipatePin: 1, invalidateOnRefresh: true },
        defaults: { ease: "none" },
      });
      tl
        // the strip opens to the full frame
        .fromTo(frame, { clipPath: `inset(30% 0% 30% 0% round ${radius()}px)` }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.22, ease: "power2.inOut" }, 0)
        .fromTo(img, { scale: 1.25 }, { scale: 1.06, duration: 0.3, ease: "power2.out" }, 0)
        .to(q(".jny-kicker"), { opacity: 0, y: -10, duration: 0.1 }, 0.12)
        // the pan: the road runs under the camera
        .fromTo(track, { xPercent: 0 }, { xPercent: -38, duration: 0.78, ease: "none" }, 0.22)
        .fromTo(img, { yPercent: 0 }, { yPercent: -6, duration: 0.78 }, 0.22)
        // the words are read as the road goes by
        .fromTo(split.words, { opacity: 0, yPercent: 40, filter: "blur(6px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", stagger: 0.028, duration: 0.14, ease: "power2.out" }, 0.3)
        .fromTo(meta, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.62)
        // the evening comes
        .fromTo(sun, { opacity: 0.5 }, { opacity: 0.1, duration: 0.6 }, 0.35)
        .fromTo(cool, { opacity: 0 }, { opacity: 0.55, duration: 0.4 }, 0.6)
        .fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 0.78 }, 0.22)
        .fromTo(dot, { left: "0%" }, { left: "100%", duration: 0.78 }, 0.22)
        .to([quote, ...meta], { opacity: 0, y: -14, duration: 0.08 }, 0.92)
        .to(q(".jny-dark"), { opacity: 0.7, duration: 0.08 }, 0.92);

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="journey" className="sec jny world-cinema" data-section data-theme="cinema">
      <div className="jny-stage">
        <div className="jny-frame">
          <div className="jny-track" data-cursor="lens">
            <img src="/img/journey.jpg" alt="A burgundy Mercedes 300 SL driving a cypress-lined Tuscan road at golden hour" />
          </div>
          <div className="ov jny-sun" />
          <div className="ov jny-cool" />
          <div className="ov jny-grade" />
          <div className="ov jny-dark" />
        </div>

        <div className="jny-kicker">
          <span className="lbl acc">07 — The journey</span>
          <span className="tiny">Monteriggioni — Tuscany · tracking shot</span>
        </div>

        <p className="disp it jny-quote">{QUOTE}</p>
        <div className="jny-meta">
          <span className="tiny">Golden hour → dusk</span>
          <span className="tiny">43.39° N 11.22° E</span>
          <span className="tiny">300 SL · 1955</span>
        </div>

        <div className="jny-line">
          <span className="jny-fill" />
          <span className="jny-dot" />
        </div>
      </div>
    </section>
  );
}
