"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, SplitText, useGSAP, DESKTOP, FINE_POINTER, radius } from "@/lib/gsap";
import PillButton from "@/components/PillButton";

const LINKS = [
  { href: "#collection", label: "Collection" },
  { href: "#journal", label: "Journal" },
  { href: "mailto:hello@vintagemotors.example", label: "Contact" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://youtube.com", label: "YouTube" },
];

/**
 * Legacy — the end card. A statement, the rear plate that widens from a pill to a banner as the
 * page ends, links with drawing underlines, the wordmark assembling letter by letter and
 * leaning under the pointer, and the local time at the coach house.
 */
export default function Final() {
  const root = useRef<HTMLElement>(null);
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
      const fine = window.matchMedia(FINE_POINTER).matches;
      const marks = q<HTMLElement>(".fin-mark");
      const splits = marks.map((m) => new SplitText(m, { type: "chars", charsClass: "ch fin-ch" }));
      const banner = q<HTMLElement>(".fin-banner")[0];
      const clock = q<HTMLElement>(".fin-clock b")[0];

      gsap
        .timeline({ scrollTrigger: { trigger: sec, start: "top 65%", once: true }, defaults: { ease: "power4.out" } })
        .fromTo(q(".fin-h .mask-line > span"), { yPercent: 110, rotateX: -40, transformPerspective: 800, transformOrigin: "50% 100%" }, { yPercent: 0, rotateX: 0, duration: 1.6, stagger: 0.14 }, 0)
        .from(q(".fin-kicker, .fin-copy, .fin-cta"), { opacity: 0, y: 10, duration: 1, stagger: 0.1 }, 0.4)
        .from(q(".fin-links a"), { opacity: 0, y: 10, duration: 0.9, stagger: 0.06 }, 0.7);

      // the wordmark assembles as the end of the page arrives
      gsap
        .timeline({ scrollTrigger: { trigger: q(".fin-wordmark")[0], start: "top 90%", once: true } })
        .from(splits[0].chars, { yPercent: 110, opacity: 0, rotate: 6, duration: 1.4, stagger: 0.04, ease: "power4.out" }, 0)
        .from(splits[1].chars, { yPercent: 110, opacity: 0, rotate: -6, duration: 1.4, stagger: { each: 0.04, from: "end" }, ease: "power4.out" }, 0.2)
        .from(q(".fin-foot > *"), { opacity: 0, y: 8, duration: 0.9, stagger: 0.06 }, 0.8);

      if (desktop) {
        // the banner widens from a pill to the full column as it passes
        gsap.fromTo(
          banner,
          { width: "42%", borderRadius: 999 },
          { width: "100%", borderRadius: radius(), ease: "none", scrollTrigger: { trigger: banner, start: "top 90%", end: "top 35%", scrub: 1 } },
        );
        gsap.fromTo(banner.querySelector("img"), { scale: 1.3, yPercent: -8 }, { scale: 1.02, yPercent: 6, ease: "none", scrollTrigger: { trigger: banner, start: "top bottom", end: "bottom top", scrub: 1 } });
      }

      // letters lean away from the pointer
      if (fine && desktop) {
        const chars = splits.flatMap((s) => s.chars as HTMLElement[]);
        const wm = q<HTMLElement>(".fin-wordmark")[0];
        const move = (e: PointerEvent) => {
          chars.forEach((c) => {
            const r = c.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy);
            const k = Math.max(0, 1 - d / 260);
            gsap.to(c, { y: -k * 22, skewX: (-dx / 260) * k * 10, duration: 0.6, ease: "power3.out", overwrite: "auto" });
          });
        };
        const leave = () => gsap.to(chars, { y: 0, skewX: 0, duration: 1.2, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
        wm.addEventListener("pointermove", move);
        wm.addEventListener("pointerleave", leave);
      }

      // the time at the coach house (Lake Como)
      const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Rome" });
      const tick = () => {
        if (clock) clock.textContent = fmt.format(new Date());
      };
      tick();
      const id = window.setInterval(tick, 1000);

      return () => {
        window.clearInterval(id);
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="final" className="sec fin world-cinema" data-section data-theme="cinema">
      <div className="fin-top">
        <div className="fin-txt">
          <span className="lbl acc fin-kicker">09 — Legacy</span>
          <h2 className="disp fin-h vskew">
            <span className="mask-line">
              <span>Keep the legacy</span>
            </span>
            <span className="mask-line">
              <span>
                <em>moving.</em>
              </span>
            </span>
          </h2>
          <p className="copy fin-copy">
            The collection is private, but the doors of the coach house open by appointment. Come and see the machines — better, come
            and hear them.
          </p>
          <div className="fin-cta">
            <PillButton label="Book a visit" icon="→" href="mailto:hello@vintagemotors.example" solid />
            <PillButton label="Back to top" icon="↑" onClick={() => lenis.current?.scrollTo(0, { duration: 2.2 })} />
          </div>
        </div>
        <nav className="fin-links" aria-label="Footer">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="lbl ul" target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="plate fin-banner" data-cursor="view">
        <img src="/img/final_rear.jpg" alt="Rear view of a green Aston Martin DB4 GT Zagato parked at a viewpoint at dusk" />
        <span className="tiny fin-banner-cap">DB4 GT Zagato — 1961 · lakeside viewpoint, dusk</span>
      </div>

      <div className="fin-wordmark" aria-label="Vintage Motors">
        <span className="disp fin-mark fin-mark-1">VINTAGE</span>
        <span className="disp it fin-mark fin-mark-2">MOTORS</span>
      </div>

      <div className="fin-foot">
        <span className="tiny">© 2026 Vintage Motors · Est. 1958</span>
        <span className="tiny fin-clock">
          Coach house, Lake Como — <b>00:00:00</b>
        </span>
        <span className="tiny">Driven by passion</span>
      </div>
    </section>
  );
}
