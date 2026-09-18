"use client";

import { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, SplitText, useGSAP, FINE_POINTER } from "@/lib/gsap";
import { whenReady } from "@/lib/ready";
import PillButton from "@/components/PillButton";

const MENU = [
  { href: "#hero", n: "01", label: "Overture", img: "/img/hero.jpg" },
  { href: "#manifesto", n: "02", label: "Manifesto", img: "/img/heritage_archive3.jpg" },
  { href: "#motion", n: "03", label: "In motion", img: "/img/car_etype.jpg" },
  { href: "#collection", n: "04", label: "The Collection", img: "/img/car_300sl.jpg" },
  { href: "#machine", n: "05", label: "The Machine", img: "/img/machine_car.jpg" },
  { href: "#craft", n: "06", label: "Craft", img: "/img/craft_wood.jpg" },
  { href: "#journey", n: "07", label: "The Journey", img: "/img/journey.jpg" },
  { href: "#journal", n: "08", label: "The Journal", img: "/img/journal_golden.jpg" },
  { href: "#final", n: "09", label: "Legacy", img: "/img/final_rear.jpg" },
];

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const brand = useRef<HTMLAnchorElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const lenis = useRef<Lenis | undefined>(undefined);
  const lenisNow = useLenis();
  useEffect(() => {
    lenis.current = lenisNow;
  }, [lenisNow]);

  // hides while scrolling down, returns on the first scroll up; compact wordmark past the hero
  useGSAP(
    () => {
      // the brand lives outside the header: blended (difference) elements can only blend with
      // their own stacking context, and the fixed header is one
      const els = [ref.current!, brand.current!];
      let hidden = false;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          const down = self.direction === 1 && y > 200;
          if (down !== hidden) {
            hidden = down;
            els.forEach((el) => el.classList.toggle("is-hidden", hidden));
          }
          els.forEach((el) => el.classList.toggle("is-compact", y > 120));
        },
      });
      const entrance = gsap.from(els, { y: -24, opacity: 0, duration: 1.4, delay: 0.7, ease: "power3.out", paused: true });
      return whenReady(() => entrance.play());
    },
    { scope: ref },
  );

  // menu: darkness wipes down, the chapters type in, and a plate follows the pointer over them
  useGSAP(
    () => {
      const el = menu.current!;
      const items = gsap.utils.toArray<HTMLElement>(".menu-item", el);
      const preview = el.querySelector<HTMLElement>(".menu-preview")!;
      const imgs = gsap.utils.toArray<HTMLImageElement>(".menu-preview img", el);
      const split = new SplitText(items.map((i) => i.querySelector(".menu-label")!), { type: "chars", charsClass: "ch" });
      if (open) {
        lenis.current?.stop();
        el.classList.add("is-open");
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" })
          .from(split.chars, { yPercent: 110, duration: 1, stagger: { each: 0.01, from: "start" } }, 0.45)
          .from(gsap.utils.toArray(".menu-n, .menu-foot > *", el), { opacity: 0, y: 8, duration: 0.8, stagger: 0.04 }, 0.7);
      } else {
        lenis.current?.start();
        if (!el.classList.contains("is-open")) return;
        gsap.fromTo(el, { clipPath: "inset(0% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => el.classList.remove("is-open"),
        });
      }

      if (!window.matchMedia(FINE_POINTER).matches) return () => split.revert();
      const px = gsap.quickTo(preview, "x", { duration: 0.8, ease: "power3" });
      const py = gsap.quickTo(preview, "y", { duration: 0.8, ease: "power3" });
      const move = (e: PointerEvent) => {
        px(e.clientX);
        py(e.clientY);
      };
      const offs = items.map((item, i) => {
        const on = () => {
          imgs.forEach((im, j) => im.classList.toggle("on", j === i));
          gsap.to(preview, { opacity: 1, scale: 1, rotate: -4 + i * 1.2, duration: 0.6, ease: "power3.out", overwrite: true });
        };
        const off = () => gsap.to(preview, { opacity: 0, scale: 0.8, duration: 0.5, ease: "power3.out", overwrite: true });
        item.addEventListener("pointerenter", on);
        item.addEventListener("pointerleave", off);
        return () => {
          item.removeEventListener("pointerenter", on);
          item.removeEventListener("pointerleave", off);
        };
      });
      el.addEventListener("pointermove", move);
      return () => {
        el.removeEventListener("pointermove", move);
        offs.forEach((f) => f());
        split.revert();
      };
    },
    { scope: menu, dependencies: [open], revertOnUpdate: true },
  );

  const go = (href: string) => {
    // Lenis ignores scrollTo while stopped, so restart it before the smooth scroll
    lenis.current?.start();
    setOpen(false);
    lenis.current?.scrollTo(href, { duration: 1.8 });
  };

  return (
    <>
      <a ref={brand} href="#hero" className="nav-brand" aria-label="Vintage Motors — home" onClick={(e) => (e.preventDefault(), go("#hero"))}>
        <span className="disp">VINTAGE</span>
        <span className="nav-brand-rest disp">MOTORS</span>
        <span className="nav-brand-est">Est. 1958</span>
      </a>
      <header ref={ref} className="nav">
        <div className="nav-actions">
          <PillButton label={open ? "Close" : "Menu"} icon="⁘" open={open} onClick={() => setOpen((v) => !v)} />
          <PillButton label="Enquire" icon="+" href="#final" solid onClick={(e) => (e.preventDefault(), go("#final"))} />
        </div>
      </header>

      <div ref={menu} className="menu" aria-hidden={!open}>
        <nav className="menu-list" aria-label="Chapters">
          {MENU.map((m) => (
            <a key={m.href} href={m.href} className="menu-item" data-cursor="hide" onClick={(e) => (e.preventDefault(), go(m.href))}>
              <span className="num menu-n">{m.n}</span>
              <span className="disp menu-label">{m.label}</span>
            </a>
          ))}
        </nav>
        <div className="menu-preview" aria-hidden="true">
          {MENU.map((m) => (
            <img key={m.href} src={m.img} alt="" fetchPriority="low" />
          ))}
        </div>
        <div className="menu-foot">
          <span className="tiny">Vintage Motors — Est. 1958</span>
          <span className="tiny">Coach house, above the lake</span>
          <span className="tiny">Instagram · YouTube</span>
        </div>
      </div>
    </>
  );
}
