import type { Ref } from "react";

type LensRingProps = {
  label?: string;
  labelSide?: "left" | "right";
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/** The DOM half of the optical lens: glass rim, focus ticks and the tiny label. Positioned by lib/lens. */
export default function LensRing({ label, labelSide = "right", className, ref }: LensRingProps) {
  return (
    <div ref={ref} className={`lens-ring${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="lens-glass" />
      <span className="lens-tick lens-tick-t" />
      <span className="lens-tick lens-tick-b" />
      <span className="lens-tick lens-tick-l" />
      <span className="lens-tick lens-tick-r" />
      {label ? <span className={`tiny lens-label lens-label-${labelSide}`}>{label}</span> : null}
    </div>
  );
}
