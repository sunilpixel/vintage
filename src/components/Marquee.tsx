"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollVelocity } from "@/lib/velocity";

const LINE = ["Timeless machines", "Est. 1958", "Driven, not entombed", "Lake Como"];

/** A wordmark band that runs with the scroll: speed and direction follow the scroll velocity. */
export default function Marquee() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = ref.current!.querySelector<HTMLElement>(".marquee-track")!;
      const run = gsap.to(track, { xPercent: -50, duration: 48, ease: "none", repeat: -1 });
      let dir = 1;
      const tick = () => {
        const v = scrollVelocity.v;
        if (Math.abs(v) > 0.02) dir = v > 0 ? 1 : -1;
        run.timeScale(gsap.utils.interpolate(run.timeScale(), dir * (1 + Math.abs(v) * 7), 0.08));
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: ref },
  );

  const items = [...LINE, ...LINE];
  return (
    <div ref={ref} className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="marquee-half">
            {items.map((t, i) => (
              <span key={i} className={`disp marquee-item${i % 2 ? " it" : ""}`}>
                {t}
                <i />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
