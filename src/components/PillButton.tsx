"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import Magnetic from "@/components/Magnetic";

type Props = {
  label: string;
  icon?: ReactNode;
  href?: string;
  solid?: boolean;
  open?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
};

/**
 * Pill button. Micro-interactions: the fill grows from where the pointer entered, the label
 * rolls up to its twin, the icon turns, and the whole pill is magnetic.
 */
export default function PillButton({ label, icon = "+", href, solid, open, className, onClick }: Props) {
  const ref = useRef<HTMLElement>(null);

  const enter = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--py", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const cls = `pill-btn${solid ? " solid" : ""}${open ? " is-open" : ""}${className ? ` ${className}` : ""}`;
  const inner = (
    <>
      <span className="pill-fill" aria-hidden="true" />
      <span className="pill-label">
        <span className="pill-txt">{label}</span>
        <span className="pill-txt" aria-hidden="true">
          {label}
        </span>
      </span>
      <span className="pill-icon" aria-hidden="true">
        {icon}
      </span>
    </>
  );

  return (
    <Magnetic strength={6}>
      {href ? (
        <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={cls} onPointerEnter={enter} onClick={onClick}>
          {inner}
        </a>
      ) : (
        <button
          ref={ref as React.RefObject<HTMLButtonElement>}
          type="button"
          className={cls}
          onPointerEnter={enter}
          onClick={onClick}
          aria-expanded={open}
        >
          {inner}
        </button>
      )}
    </Magnetic>
  );
}
