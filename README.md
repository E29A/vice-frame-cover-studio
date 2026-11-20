# VICE FRAME — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/E29A/vice-frame-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/E29A/vice-frame-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Drop in a photo, get back GTA-style cover art: slanted multi-panel poster layouts, Vice City colour grades, big stacked poster lettering over the art, and a one-click PNG in the sizes posts actually use. Everything runs offline in the browser from static files — your photos are composited on a canvas on your own machine and never uploaded anywhere.

## What it does

- **Six slanted-panel layouts** — Cover Classic (hero + 3 below), Hero Slash, Diagonal Trio, Grid Heat (2x2), Full Bleed and Strip Story (4 vertical strips). Panels re-flow across square, portrait and landscape canvases, separated by the cream poster dividers of classic cover art.
- **Five colour grades, applied per-pixel** — Sunset (orange-teal split tone), Neon Nights (magenta-cyan), Poster Pop (posterize to flat colour levels + split tone, so photos read as painted key art), Golden Hour and Teal Heat. A halftone-and-grain print texture and a vignette are baked into every export.
- **Poster lettering** — the embedded Anton display face in three treatments (Solid, Chrome gradient with hard offset shadow, Outline), stacked over the art, top or bottom, with an editable game title and caption on a slanted callout chip.
- **Any photo, handled properly** — file picker or drag-and-drop, up to 4 photos, each assignable to any panel (click a panel, click a photo). Per panel: drag on the cover to reposition, zoom slider, flip-horizontal. Cover-crop math frames every photo inside its slanted polygon.
- **Poster extras** — two editable callout chips, an original circular "Vice Frame · Cover Studio" seal drawn in canvas paths, and an optional fictional billing block at the foot.
- **Four art-direction presets** — Sunset Boulevard, Neon Vice, Poster Pop and Golden Grid. A complete cover is already on screen at first load; from a dropped photo it is drop, optional drag, Export.
- **Export** — PNG at 1080x1080, 1080x1350 and 1920x1080, rendered offscreen at full size. Switching size re-renders the preview at that aspect.

## How it works

`app/` is plain static files: `index.html`, `style.css` and ES modules under `app/src/` (`cover.js` is the compositor — layouts, grades, lettering, extras; `main.js` is the editor, presets and export). There are no runtime network calls and no libraries. Grades run once per photo into a cached offscreen canvas, so dragging and zooming stay instant; exports re-render the same pipeline at full resolution.

The two bundled sample photos (`app/samples/`) were made for make.fun and are free to use. All lettering is original; the display font is Anton under the SIL Open Font License (`app/assets/OFL.txt`). No Rockstar Games logos, artwork or fonts are used.

## Run it

```
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. It also works straight from the static files with any static server.

For the hand-in dossier:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. Anton is licensed under the SIL Open Font License 1.1 — see `app/assets/OFL.txt`.

<sub>Entered on [make.fun](https://make.fun/?ref=360dry7e&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
