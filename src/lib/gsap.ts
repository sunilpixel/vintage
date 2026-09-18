"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 1.2 });

/** Desktop breakpoint used by every pinned section. */
export const DESKTOP = "(min-width: 861px)";
export const MOBILE = "(max-width: 860px)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** The --r token in px. The CSS owns the value; the corner tweens read it so the two can't
 *  drift apart — and so phones get their smaller radius without a second hard-coded number. */
export const radius = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--r")) || 16;

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP };
