# Webforge homepage redesign — design spec

Date: 2026-09-10
Status: Approved by user, ready for implementation planning

## Context

The current homepage (`index.html`) is an 18-section, copy-heavy single-page
site built with plain CSS transitions and IntersectionObserver reveals. The
user wants a complete visual and structural redesign inspired by two
reference sites:

- **[obys.agency](https://obys.agency/)** — minimal, monochrome, editorial.
  The homepage *is* a dense scrolling work index: client list on the left,
  huge project thumbnails scrolling center, a live meta panel on the right.
  Almost no marketing copy — it leads entirely with proof.
- **[cuberto.com](https://cuberto.com/)** — bold confident type, huge
  rounded-corner project cards with custom art, playful spring-physics
  cursor, generous whitespace.

Goal, in the user's words: *"show people we make sexy websites"* — the site
itself needs to demonstrate the studio's design/motion ability, not explain
the studio in paragraphs.

## Decisions made during brainstorming

Captured from the clarifying-question pass, in order asked:

1. **Animation depth**: Full rebuild — add GSAP + ScrollTrigger + Lenis
   smooth-scroll + a custom cursor. Not a light CSS-only layer.
2. **Scope**: Homepage first. Inner sections/pages redesigned in a later
   round once this direction is validated live.
3. **Content**: Open to restructuring — concepts were allowed to cut/reorder
   content rather than force-fitting the current copy.
4. **Palette**: Concepts could explore freely rather than being locked to
   the current neon-lime/cobalt-gold system.
5. **Portfolio depth** (5 real projects, 2 marked work-in-progress): lean
   into the small number as deliberate confidence — generous space per
   project, no padding to make it look bigger than it is.

Three concepts were mocked up in the visual companion:

- **A — The Index** (pure Obys structure, generic typography)
- **B — The Statement** (pure Cuberto: bold type, rounded hero card)
- **C — The Forge** (synthesis: Obys structure + Webforge's existing brand
  system — cobalt→gold ombré, Abril Fatface italic accents, neon lime)

**Chosen direction: A's structure, C's typography/color system** — i.e. the
Obys-style index *is* the homepage, but rendered in Webforge's actual type
stack (Bricolage Grotesque / Abril Fatface / DM Mono) and using the
established ombré + neon-lime accent language, not generic sans-serif
monochrome. Confirmed against a refined mockup before proceeding.

Final content decision: cut aggressively. Keep only what shows work; remove
everything that explains the studio in prose.

## Final homepage structure

Five sections, top to bottom:

1. **Nav** — WEBFORGE wordmark (existing ombré treatment) + trimmed links:
   `Work — About — Contact`, where `Work` anchors to the index (section 2),
   `About` anchors to the forge story (section 3) — there is no separate
   About section, so the nav link must point at the condensed story block,
   not a page that doesn't exist
2. **Index** — the opening statement itself, replacing both the current
   hero and the separate portfolio section:
   - Short mono eyebrow line (copy TBD at implementation time, e.g. "5
     projects. No padding.")
   - Three-column layout: client name list (left) / scrolling project
     column (center) / meta panel with tags + index counter (right)
   - This is the single most important surface on the page — it carries
     nearly the whole homepage's job of proving design quality
3. **Forge story** — condensed to 2 lines max, quiet styling, no longer a
   full section with its own heading treatment
4. **Credentials strip** — Shopify · WordPress · 4 yrs · 50+ websites,
   restyled to match the new monochrome-with-neon system (reuses the
   existing `.proof-card` grid pattern already established on the current
   site — box borders + neon hover fill)
5. **Contact / CTA** — simple, confident close: one headline, one primary
   action

### Explicitly cut from the homepage (not deleted from the repo)

Difference, Problem, Questions, Transformation scroll-demo, Build-storefront
scroll-demo, Process steps, Shopify services grid, Maintenance, Why-me list,
Client breakdown, Engage cards, Fit checklist.

These sections' HTML/CSS should be preserved (e.g. moved to a clearly marked
block or a separate reference file) rather than deleted outright, since they
may become dedicated inner pages in a later round. They must not render on
the homepage.

## Tech foundation

- **No build step.** Stay single-file (`index.html`), matching how the site
  is currently deployed (Vercel, static, auto-deploy on git push). All new
  libraries load via CDN `<script>` tags.
- **GSAP + ScrollTrigger** (CDN) — scroll-driven reveals, pinning the meta
  panel, driving the active-client-in-sidebar highlight as projects scroll
  past center.
- **Lenis** (CDN) — smooth/inertia scrolling site-wide.
- **Custom cursor** — vanilla JS, extending the `.cursor-orb` element and
  `#cursorOrb` logic that already exists in the codebase (currently
  present but not doing much). Lime dot that scales up over interactive
  elements; magnetic pull toward the cursor on primary buttons/links.
- **Reduced-motion fallback**: `prefers-reduced-motion` disables Lenis and
  ScrollTrigger pinning/scrubbing entirely. The *existing* IntersectionObserver
  `.rv` fade-in system (already in the codebase) becomes the fallback
  reveal mechanism — it is not thrown away, it's repurposed as the
  no-motion path.

## Motion system, section by section

- **Index sidebar**: client name lime-highlights (text color + small lime
  dot, matching the existing `.lime-dot` motif) based on which project is
  currently centered in the scrolling column — driven by ScrollTrigger
  progress against each project's position.
- **Index center column**: each project card scales/fades in as it enters
  the viewport; subtle scale-down as it exits.
- **Index right panel**: tags + index counter (e.g. "02 / 05") stay
  pinned while the center column scrolls past.
- **Headings elsewhere** (forge story, credentials, CTA): keep a
  reveal-on-scroll, retimed through GSAP for consistent easing rather than
  the current CSS-transition timing.
- **Cursor**: magnetic pull on `.pill` buttons and project links; scale-up
  on any hoverable element.
- **Nav**: keep existing scroll-triggered shrink/background behavior.

## Content data mapping

Move the 5 projects from hardcoded per-project HTML (`<article class="proj">`
blocks) into a single JS array of objects:

```js
const PROJECTS = [
  { name: "Vugy India", url: "https://vugyindia.com", tags: "Fashion / Made-to-measure, Shopify · D2C + Brand", meta: "..." },
  // ...
];
```

The index list, center column, and meta panel all render from this array.
Adding project #6 later becomes a one-line addition instead of duplicating
a markup block by hand.

## Verification plan

No automated test framework — this is a static marketing site, consistent
with how the rest of this project has been verified throughout this
conversation:

- Manual check across desktop / tablet / mobile widths using the browser
  tool
- Toggle `prefers-reduced-motion` and confirm the fallback path renders
  correctly with no broken layout
- Real check against the Vercel production deploy after push (not just the
  local file preview) — this project has repeatedly hit issues (empty
  build-canvas, CSP iframe blocks) that only showed up on the live deploy
- Confirm no console errors, particularly around GSAP/Lenis CDN load
  failures — a network hiccup on the CDN script should not break the page
  entirely (should degrade to plain scroll, not a blank page)

## Out of scope for this round

- Inner pages / sections beyond the homepage (Process, Services, etc. as
  dedicated pages) — explicitly deferred to a later round per the
  homepage-first scope decision
- Rewriting the cut sections' copy — they're preserved as-is for now, not
  rewritten for a future page
- Placeholder contact info (`REPLACE@EMAIL.com`, `REPLACE-NUMBER`, etc.)
  remains a known outstanding item from earlier in the project, unrelated
  to this redesign
