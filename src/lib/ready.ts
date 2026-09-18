"use client";

/**
 * One-shot "site is ready" signal. The preloader marks it once fonts + the hero plate are in;
 * the hero intro, nav and rail wait for it.
 */
let ready = false;
const subs = new Set<() => void>();

export function whenReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

export function markReady() {
  if (ready) return;
  ready = true;
  subs.forEach((cb) => cb());
  subs.clear();
}

export function isReady() {
  return ready;
}
