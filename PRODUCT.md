# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain static HTML/CSS/JS, no framework and no build step. Chosen because the site is one image-derived character field with no backend, and it hosts free anywhere (GitHub Pages, Vercel).

## Users

Two audiences, in this order on the landing view:
1. People who would find Arhm interesting: peers, hackathon and research community, collaborators. They arrive on the art.
2. Recruiters, PIs, and program reviewers. They go one step in and need a readable, copyable resume and a PDF.

## Product Purpose

Arhm Iqbal's personal website. It represents him as a person first and carries his resume, projects, and the books he has read. Success: a visitor remembers the landing view, and a recruiter can still read and download the resume within one click.

## Positioning

A personal site that is a single responsive character grid rather than pages of sections. The landing view is art; the further in you go, the more it becomes a resume.

## Capabilities and Constraints

- No backend. Fully static.
- 42 locally hosted space photographs, revealed on click in a shuffled sequence without repeats.
- Hover flips an individual tile to preview the next photograph. Each click permanently flips progressively more tiles (4, 16, 64, …). The next-image button reveals all remaining tiles.
- Sections: resume, projects, books. More may be added later (undecided).
- Book list: not yet supplied by Arhm. Undecided content.

## Brand Commitments

Stated by Arhm as what represents him: very ambitious; loves the city and skylines; artistic; loves anime and manga, especially the comet night skies in Your Name; loves soccer; loves games like NieR: Automata. Wants it minimal, stripped, abstract, polished, purposeful, and not generic. These are inspirations for an original look, not works to reproduce.

## Evidence on Hand

- CV: `/Users/quantaviosbingleton/Downloads/Arhm Iqbal CV (9).pdf` (education, research, presentations, work, awards, skills, certifications).
- LinkedIn headline: 3rd year Honours Neuroscience student at the University of Alberta; technical co-founder of SimuPrep; "5/6 hackathons won so far"; About line: "Popular loner".
- GitHub (Arhm-Iqbal): Basirah (live at basirah-hazel.vercel.app), evidence-poverty-auditor, Vibe-Maxxing, phone-recorder.
- Leading the UAIS Wi-Fi Biosensing project (2026).
- Absent, do not fabricate: book list, photos, testimonials.

## Product Principles

1. Art on arrival, resume one step in.
2. The resume is always real text: selectable, readable by screen readers, downloadable.
3. Everything on screen is about Arhm; no decoration that could belong to anyone.
4. Stripped: remove anything that does not carry meaning.

## Accessibility & Inclusion

Real text for all content, keyboard navigation, and a still version for visitors with reduced-motion settings.

## Visual refinement — November 2026

- No clock or explanatory sentence below the name.
- The name is plain white text in a standard sans-serif. No symbol mask, animated name, condensed display font, arrow, or playback controls. Body: Inter. Field and captions: IBM Plex Mono.
- 42 local Hubble photographs, including 36 additions. Full provenance in `assets/SOURCES.md` and the public `credits.html` page. Only the current and next images are retained in memory.
- Continuously animated image-aware glyph layers, measured by actual ink density, with edge-oriented strokes and individual tile flips. The photo remains fixed. Every photograph has its own hand-placed motion score in `space-motion.js`: distinct paths, elliptical structures, centers, timings, direction and stellar cadence. Programs are defined in original-photo coordinates and transformed through the responsive crop. Motion is suppressed around bright stars, with soft glints applied only to detected photographic star halos. There is no diagonal light sweep, photo pan/zoom, brightness pulsing or random per-cell shimmer. Real photographic highlights preserve star cores, halos and diffraction detail. Dark regions have a lower glyph density. The matrix updates at 30 Hz and tile flips run at display refresh rate. Clicks accumulate without restarting tiles already in motion; critically damped hover reversals prevent snapping.
- No visible arrow, pause or play controls. The canvas supports Enter/Space for progressive reveals. Reduced motion disables ambient animation and makes tile changes immediate. Animation suspends when the artwork is offscreen or the tab is hidden.
- Static HTML/CSS/JS with no build step or runtime network dependency. Serve this directory with a local HTTP server for canvas pixel access.

### Motion review

The user rejected a universal drift/wave, moving the whole photograph, and removing liveliness when reducing intensity. Preserve continuous, visible matrix motion and the progressive tile flips. Every one of the 42 photographs has an explicit motion score; do not replace them with a shared default effect. The name stays plain white text.

### Symbol motion — 14 November 2026

The user found the field static and colourless, then rejected a reduced symbol set and randomly spawned particles. Current state: the original 90+ ink-sorted symbol set is unchanged. Each score in `space-motion.js` is also compiled into lanes that follow its structures (alongside a stream, around a ring, outward from a shell). Every cell belongs to a lane; each lane carries its symbols along at its own speed, with a minimum so nothing stands still, and stretches of a lane run hot (brighter, whiter). Symbol colour is the pixel's own hue, saturated. Pointer movement drops dye that the lanes carry off. Do not reduce the symbol set, and do not replace lane motion with random particles or a uniform effect.

### Characters as the picture — 14 November 2026

Trial approved by the user: the plain photograph is no longer drawn under the characters (`UNDER = 0` in `field.js`). The characters are drawn as a stencil and a lifted, saturated full-resolution copy of the photograph shows only through their ink. Two things stand in for the lost under-image: a heavily blurred copy glows behind the characters (`BLOOM`), and fine bright detail (thin rims, threads of gas, stars) is kept as real photo pixels on top, chosen by how much a pixel stands out from its blurred surroundings. Cells with no light have no characters. Awaiting the user's verdict; `UNDER` and `BLOOM` are the two numbers to adjust.

### Light detection and shaped shells — 14 November 2026

- A cell gets characters if the brightest thing inside it (not its average) rises above that photograph's own sky level. Each photograph is exposed for itself (`floor`, `ceil` in `field.js`), so faint images such as the Ultra Deep Field use the full range of symbols. Each cell also carries the colour of its brightest object, so a symbol over a small galaxy is not left dark.
- Two shell variants in `space-motion.js` take their shape from the photograph instead of a hand-placed ellipse. `traced` (Crab Nebula): fronts expand in the object's measured outline. `glow` (Orion Nebula): fronts start at the light source and bend around the cloud's bright and dark regions. The user reported the plain elliptical rings as looking off on both; other shell photographs still use ellipses and may need the same.


### Work and Resume — 19 November 2026

The user found Work and Resume boring and pointed to samworks.vercel.app as the model: project pictures, links, and a themed GitHub activity graph at the end.

- Work is a two-column grid of projects, each led by a picture. Real screenshots where the work is public (SimuPrep, Basirah, the Evidence Poverty Auditor dashboard, the Vibe-Maxxing Devpost image; provenance in `assets/SOURCES.md`). The other four covers are drawn in the artwork's characters by `work.js`, each a picture of what the project measures, labelled "Illustration", still until hovered. Honours are set in the spike colour with a four-point star; tech tags only where a repo or Devpost confirms them.
- GitHub activity is a year of stars: brightness by contributions, diffraction spikes on the busiest days. A saved snapshot (`assets/github-activity.js`, refreshed with `node scripts/update-github-activity.mjs`) draws first; when a visitor reaches the graph the page asks github-contributions-api.jogruber.de for fresher counts and keeps the snapshot if that fails. This is the site's only runtime network request, approved by the user.
- Resume draws its own timeline from `data-from` / `data-to` on each entry (`resume.js`), one coloured track per group in the Hubble narrowband palette. On wide screens the chart is sticky beside the list and lights the entry being read.
