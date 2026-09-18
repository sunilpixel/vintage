"use client";

/**
 * Smoothed scroll velocity, written once per frame by SmoothScroll and read by anything that
 * reacts to it (the marquee). Kept in JS rather than a :root custom property: rewriting a
 * root-level variable every frame recomputed style for the whole document and was the single
 * biggest source of scroll jank.
 */
export const scrollVelocity = { v: 0 };
