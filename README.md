# Vintage Motors

A single-page site for a private collection of classic cars, told as a film in nine chapters.
Scroll-driven throughout: pinned sections, a scrubbed frame sequence, a WebGL lens, and a colour
scheme that morphs between a light and a dark world as you move down the page.

Next.js 16 (App Router) · React 19 with the React Compiler · Tailwind CSS 4 · GSAP 3.15
(ScrollTrigger, SplitText, ScrambleText) · Lenis · a small dependency-free WebGL layer.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start

npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

## Layout

```
src/
  app/
    layout.tsx        fonts (next/font), metadata, the two font CSS variables
    page.tsx          the section order — this is the whole page
    globals.css       design tokens, @theme, base type, shared atoms (.disp .copy .lbl .num .hl)
  styles/
    chrome.css        nav, menu overlay, cursor, chapter counter, preloader, lens ring
    sections.css      per-section layout, in page order
    mobile.css        the ≤ 860px reflow
  sections/           one file per chapter; each owns its markup and its GSAP timeline
  components/         SmoothScroll, ThemeMorph, Preloader, Nav, Cursor, Chapter, Marquee,
                      PillButton, Magnetic, LensRing
  lib/
    gsap.ts           plugin registration, the DESKTOP / FINE_POINTER queries, radius()
    theme.ts          the paper ⇄ cinema colour morph
    ready.ts          one-shot "site is ready" signal (preloader → hero intro, nav, counter)
    velocity.ts       smoothed scroll velocity, written once per frame
    lens.ts           pointer-tracked lens controller
    gl/               ShaderPlane (fullscreen quad + uniforms) and the fragment shaders
  content/site.ts     cars, materials, journal stories, manifesto copy, chapter labels
public/img/           photography + credits.json
public/reel/          the Machine section's 96-frame sequence, built by scripts/build-reel.py
```

## The chapters

| # | Section | What it does |
|---|---------|--------------|
| 01 | Hero | A rounded screen between the top labels and the giant wordmark opens to full viewport like a curtain; letterbox bars slide in. The screen tilts to the pointer and a WebGL lens roams the plate. |
| 02 | Manifesto | One statement filled in word by word on scroll; three small plates open inline as their line is read; figures count up below. |
| 03 | Motion | Pinned. Three rows of plates drift in alternating directions until the E-Type lands dead centre and stops; the rest dim. |
| 04 | Collection | Pinned. Six machines listed left; two frames on the right wipe to the next machine by clip-path. Clicking a row scrolls the pin to it. |
| 05 | Machine | Pinned. 96 graded frames scrub with the scroll — first playing inside the letters of a giant MACHINE (SVG text clip-path), then filling the screen with hard cuts, a timecode and projector weave. |
| 06 | Craft | A sticky card stack, one card per material. The covered card steps back as the next slides over it; labels unscramble, plates track the pointer in depth. |
| 07 | Journey | Pinned tracking shot: a letterboxed strip opens to full height, the camera pans, the quote is read word by word and the light cools. |
| 08 | Journal | Story rows. Plates open from a pill into a frame, hovering sweeps a tint and leans the plate toward the pointer. |
| 09 | Final | The rear plate widens into a banner, the wordmark assembles letter by letter and leans under the pointer, and the clock shows local time at the coach house. |

Between Journal and Final a marquee band runs with the scroll — its speed and direction follow
the scroll velocity.

## Conventions

A few of these are load-bearing. Breaking them tends to fail quietly rather than loudly.

**Colour lives in one place.** The palette is the tokens in `globals.css :root` — `--paper`,
`--ink`, `--cinema`, `--bronze` and friends. `lib/theme.ts` maps each live variable to a *token
name* and reads the computed value, so it never repeats a hex; `ThemeMorph` tweens `--bg`,
`--fg`, `--accent` and `--bg-2` on `:root` when a `[data-theme]` section crosses the middle of
the viewport. `layout.tsx`'s `viewport.themeColor` holds the one unavoidable copy of `--paper` —
update it with the palette.

**Corner radius lives in one place too.** `--r` (16px, 12px on phones). Tweens that animate a
corner call `radius()` from `lib/gsap.ts` rather than hard-coding a number, so JS and CSS cannot
drift and phones get the smaller value for free.

**Tailwind sits underneath the hand-written CSS, not beside it.** The stylesheets are unlayered,
so every rule in them outranks every utility regardless of specificity. Where a shared class sets
the same property as a utility — `.disp` letter-spacing, `.copy` font-size — the utility needs a
trailing `!`. Two more Tailwind 4 notes: `max-*` is exclusive, so the breakpoints are registered
one pixel up as `--breakpoint-desk: 861px` / `--breakpoint-lap: 1101px` and you write `max-desk:`
rather than `max-[860px]:`; and never put `scale-*` on a GSAP-driven element, because v4 emits the
standalone `scale` property, which composes with GSAP's inline `transform` and applies twice.

**Sections own their motion.** Every section is a client component holding one `useGSAP` with a
`scope`. Call it with no dependency array — passing one defers cleanup, which on this page means
duplicate pins. Class names in the markup that start with the section's prefix are GSAP hooks;
the layout they used to carry may now be Tailwind utilities.

**`overflow: clip`, never `hidden`.** On `body` or a section, `overflow: hidden` makes the element
a scroll container and kills every `position: sticky` below it.

**Type.** Cormorant Garamond for display, Jost for everything else. Cormorant sets lighter and
smaller per em than most serifs, so `.disp` runs at weight 500 and the small display-font spots
(`.num`, the nav brand, the chapter counter) run at 600 and force `lining-nums` — the face
defaults to oldstyle figures, which turn an index into `o2 / o5`.

## Styling split

`sections/Craft.tsx` is laid out in Tailwind utilities; the other eight sections are laid out in
`styles/sections.css`. That is a real inconsistency, not a rule — Craft was ported first and the
rest have not followed yet. Either direction is defensible: utilities read well for layout, and
hand-written CSS reads better for the compound hover/pin/clip-path states the other sections lean
on. Pick one before the next section is touched.

## Photography

Everything in `public/img/` is a Creative Commons placeholder from Wikimedia Commons or Flickr;
`public/img/credits.json` records the photographer, licence and source page for each file, and
several are share-alike. Replace them with licensed or commissioned plates before this ships.

Most are around 1000px wide, which is fine for the plates but not for anything full-bleed — the
hero was visibly soft until it was replaced with a 2200px version. The site uses plain `<img>`
(no `next/image`, no `srcset`), so one file serves every use of a given plate; keep the large
ones near 350KB. Moving to `next/image` is the obvious next step if the photography is upgraded.

## The reel

`scripts/build-reel.py` renders the Machine section's frame sequence — a graded Ken Burns pass
over the car plates with crossfades at the cuts. It is a stand-in for real footage: export the
final film as the same `f_000.jpg …` sequence and update `REEL` in `sections/Machine.tsx` if the
frame count changes.

## Breakpoints

- ≥ 861px — the full experience: pins, the WebGL lens, the custom cursor.
- ≤ 860px — column reflow, no pins, no custom cursor.

`DESKTOP` in `lib/gsap.ts` and `--breakpoint-desk` in `globals.css` are the same line; keep them
in step.
