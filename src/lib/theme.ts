"use client";

import { gsap } from "@/lib/gsap";

/**
 * The page lives in two worlds: "paper" (cream, espresso ink) and "cinema" (deep bordeaux, cream
 * type). Every section declares its world with `data-theme`; the body colours tween between them
 * as the section reaches the middle of the viewport (see components/ThemeMorph). Sections that
 * change world mid-pin (the hero) call setTheme themselves.
 */
export type Theme = "paper" | "cinema";

/** Which palette token each live variable takes its value from. The colours themselves live in
 *  globals.css — read, never repeated here, so the morph can't tween back to a stale palette. */
const WORLDS: Record<Theme, Record<string, string>> = {
  paper: { "--bg": "--paper", "--fg": "--ink", "--accent": "--bronze", "--bg-2": "--paper-2" },
  cinema: { "--bg": "--cinema", "--fg": "--ivory", "--accent": "--champ", "--bg-2": "--cinema-2" },
};

/** Resolve a world to real colours. --bg/--fg/--accent/--bg-2 are what we write (inline, on
 *  :root), the source tokens are not, so this reads clean values every time. */
function colours(theme: Theme) {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(Object.entries(WORLDS[theme]).map(([live, token]) => [live, cs.getPropertyValue(token).trim()]));
}

let current: Theme | null = null;

export function setTheme(theme: Theme, immediate = false) {
  if (theme === current) return;
  current = theme;
  const root = document.documentElement;
  root.dataset.theme = theme;
  const next = colours(theme);
  if (immediate) {
    Object.entries(next).forEach(([k, v]) => root.style.setProperty(k, v));
    return;
  }
  gsap.to(root, { ...next, duration: 1.1, ease: "power2.inOut", overwrite: "auto" });
}

