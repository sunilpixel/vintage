# VINTAGE MOTORS — Timeless Machines

An eight-chapter cinematic homepage for a private collection of classic automobiles.
Next.js 16 (App Router, React 19, Tailwind 4) + GSAP 3.15 (ScrollTrigger, SplitText, Observer) +
Lenis smooth scroll + a small dependency-free WebGL layer for the optical-lens effects.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

```
src/
  app/            layout (fonts, metadata), page (section order), globals.css (tokens, type, atoms)
  styles/
    chrome.css    nav, menu overlay, cursor, section rail, lens ring
    sections.css  the eight sections on the 1440 design grid (1 design px = var(--u))
    mobile.css    ≤ 860px reflow (pinned timelines are off at this width)
  components/     SmoothScroll (Lenis ⇄ ScrollTrigger, --fit), Preloader, Handoff, Nav + menu,
                  Cursor, SectionIndicator, Magnetic, LensRing, Kicker
  sections/       Hero · Heritage · Collection · Machine · Craft · Journey · Journal · Final
  lib/
    gsap.ts       plugin registration, breakpoints (DESKTOP / MOBILE / FINE_POINTER)
    ready.ts      one-shot "site is ready" signal (preloader → hero intro / nav / rail)
    lens.ts       pointer-tracked lens controller (rest position, lerp, DOM ring mirroring)
    gl/           ShaderPlane (fullscreen quad, textures, uniforms) + the two fragment shaders
  content/site.ts cars, materials, journal stories, section labels
public/img/       the 35 plates (see "Images")
public/reel/      the Collection's frame sequence (96 JPEGs + manifest), built by scripts/build-reel.py
design/           the original design canvas sources (build.py → *.dc.html)
```

## Layout model

Flowing sections (Craft, Journal, Final) are laid out on the 1440 design grid with
`--u = 100vw / 1440`, so they scale with the viewport width. Pinned sections (Hero, Heritage,
Collection, Machine, Journey) put their typography and UI on a **fit-scaled 1440×900 stage** (`.stage`,
`--fit = min(vw/1440, vh/900)`, set from JS) while their plates stay full-bleed — the composition
is identical on a 1366×768 laptop and a 4K monitor, so nothing can collide. Never tween a
`.stage` transform; wrap what you animate (see `.mac-zoom`).

## Motion map

| # | Section | Mechanism |
|---|---------|-----------|
| — | Preloader | wordmark letters rise, hairline grows with real loading progress (fonts + first plates), darkness lifts; `lib/ready` releases the hero intro, nav and rail |
| 01 | Hero | letterboxed frame opens on first scroll (clip-path), SplitText chars, pinned 150 %, WebGL lens follows the pointer and rests on the car, pointer parallax in the shader (type counter-moves), camera tracks on scroll, dark wipe out |
| 02 | Heritage | "The family archive", pinned: a vertical timeline of five decades on the left; on the right each decade's archival print — paper margin, hand-written note, plate number — falls in from above the table, turning flat with a small bounce, onto a growing pile (the pile settles beneath it, and drifts with the pointer); the timeline dot and fill follow the decade |
| 03 | Collection | "the reel" — a full-bleed film that scrolling scrubs forward and back: 96 graded frames drawn to a canvas, one segment per machine, hard cuts with a flash of light, names handing over letter by letter, a running timecode / frame counter, projector weave and flicker when the reel is pulled fast |
| 04 | Machine | pinned; components spread out from the car (with rotation) and then hover in the studio air, wheel rotates, interior slides in, headlamp glows, camera pushes toward the wheel, headlamp becomes a circular portal into the workshop |
| 05 | Craft | horizontal-mask reveals, letter-spacing transitions, WebGL material lens (hover METAL / LEATHER / WOOD / CHROME / ENGINE — crossfades with displacement) |
| 06 | Journey | curtain opens on enter; pinned tracking shot on one plate (scale 1 → 1.4 → 1.96 with the pivot on the car), headline leaves upward and out of focus, quote types in, sun lowers then the evening cools; the next chapter's photograph appears as a framed 500×360 rectangle and opens up to the full viewport |
| 07 | Journal | pinned intro: the fixed **handoff plate** (`components/Handoff`) settles from the viewport into the lead story's slot and swaps for the real image; asymmetric editorial grid, images and titles drift in opposite directions, hover = zoom + warm mono → colour + title shift + READ cursor |
| 08 | Final | blur → sharp headline chars, sunset → night grade on scroll, magnetic footer links |

Global chrome: compressing navigation (scroll down / up), full-screen chapter menu, custom cursor
(`data-cursor="image | link | view | drag | explore | read | lens"`), 01–08 section rail whose line
grows with each section's progress, animated film grain.

## Motion layer

- **WebGL planes** (`lib/gl/PlaneField.ts`, `lib/planes.ts`, `components/PlaneCanvas`): one fixed
  canvas draws the Journal, Craft and Final photographs as subdivided GPU planes that follow
  their DOM boxes. They bend and stretch with the scroll velocity, pull liquid-like toward the
  pointer with a chromatic split and relax from their film grade to natural colour on hover, and
  reveal behind a noise-edged wipe. The DOM `<img>` stays for layout, hover and fallback (touch /
  no WebGL keep the DOM reveals).
- **Velocity skew**: `SmoothScroll` writes `--vskew` / `--vel` every frame from Lenis; every
  `.vskew` headline and the marquee lean with the scroll.
- **Pointer depth**: Machine parts and the Heritage pile drift with the cursor by their own
  `--depth`, via the CSS `translate` property so GSAP's `transform` stays untouched.
- **3D type**: mask-line reveals turn up out of the page (`rotateX` + perspective); the Final
  headline resolves from blur and tilt.
- **Marquee** (`components/Marquee`): the wordmark band between Journal and Final runs with the
  scroll — speed and direction follow the velocity.

## WebGL lens

`lib/gl/ShaderPlane.ts` draws one image on a fullscreen quad with `object-fit: cover` maths and
CSS-filter-like grading in GLSL. `HERO_FRAG` magnifies under the lens with a barrel bulge,
chromatic aberration toward the rim, a bronze/black grade and lifted highlights; `CRAFT_FRAG`
reveals a macro material texture instead. If WebGL is unavailable (or on touch devices for
Craft) the plain `<img>` stays visible and Craft falls back to a small swap image.

## Images

Every plate in `public/img/` is a Creative Commons placeholder (Flickr / Wikimedia Commons);
photographer, licence and source page are listed in `design/img/credits.json`. They are ~1000 px
wide and colour-graded in CSS/GLSL. To ship, replace them with commissioned or generated 4K+
plates using the same file names, or edit the paths in `content/site.ts` and the section files.
The archival scans need separate clearance before publication.

## The reel

`scripts/build-reel.py` renders the Collection's frame sequence: a graded Ken Burns pass over
the six car plates with short crossfades at the cuts (`python scripts/build-reel.py`). It is a
placeholder for real footage — export the final film as the same `f_000.jpg …` sequence (24 fps,
16 frames per car, any resolution) and update `REEL` in `sections/Collection.tsx` if the count
changes. Frames load lazily when the section comes within two viewports (or after 4 s).

## Breakpoints

- ≥ 861px: full experience (pins, lens, cursor).
- ≤ 860px: column reflow, native horizontal strip for the collection, no pins, no custom cursor.
- Pointer without hover (touch): the lens rests on the car; Craft switches to the swap image.
# vintage
