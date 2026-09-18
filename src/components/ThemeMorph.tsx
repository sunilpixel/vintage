"use client";

import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { setTheme, type Theme } from "@/lib/theme";

/**
 * Watches every `[data-theme]` section: when one crosses the middle of the viewport the body
 * colours tween to its world (see lib/theme). Pinned sections span their pin distance.
 */
export default function ThemeMorph() {
  useGSAP(() => {
    setTheme("paper", true);
    const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-theme]"));
    secs.forEach((sec) => {
      const theme = sec.dataset.theme as Theme;
      const extent = () => {
        const pinner = ScrollTrigger.getAll().find((t) => t.pin === sec);
        return sec.offsetHeight + (pinner ? pinner.end - pinner.start : 0);
      };
      ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: () => `+=${extent()}`,
        refreshPriority: -1,
        onToggle: (self) => self.isActive && setTheme(theme),
      });
    });
  });
  return null;
}
