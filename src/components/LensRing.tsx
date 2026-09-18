import { forwardRef } from "react";

/** The DOM half of the optical lens: glass rim, focus ticks and the tiny label. Positioned by lib/lens. */
const LensRing = forwardRef<HTMLDivElement, { label?: string; labelSide?: "left" | "right"; className?: string }>(
  function LensRing({ label, labelSide = "right", className }, ref) {
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
  },
);

export default LensRing;
