# Armchair Curator — Development Handoff

*Last updated: July 23, 2026. For the next agent or developer picking this up.*

---

## Quick Start

```bash
cd /Users/alih/Documents/ai/armchair-curator
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
npm run lint       # tsc --noEmit
```

**No API keys needed.** The app is fully client-side. The AI narrative feature uses the free Wikimedia LiftWing LLM endpoint (no auth required, CORS allows `localhost:3000`).

---

## What This App Is

**Armchair Curator** — a relaxing museum curation game. Artworks scroll on three conveyor belts at the bottom. The user drags/plucks them onto a canvas above to assemble a custom gallery. Switch between Salon Wall (grid) and Freeform (drag/rotate/scale) modes. Click "Finish Exhibition" to get an AI-written exhibition narrative and export as PNG.

Full PRD: `DESIGN.md`

---

## Current State

### What's Working

| Feature | Status |
|---------|--------|
| Three conveyor belts (different speeds, pause, 0.5x / 1.0x / 1.8x) | ✅ |
| Hover slows track, shows Pluck/Inspect buttons | ✅ |
| Drag artwork from belt to canvas (HTML5 drag-and-drop) | ✅ |
| Click "Pluck" button on belt item | ✅ |
| Salon Wall grid mode | ✅ |
| Freeform mode (drag, rotate ±15°, scale 0.4–2.5×, z-index layer) | ✅ |
| Freeform drag works when cursor leaves canvas (window-level listeners) | ✅ |
| Filter toolbar (museum, medium, search) | ✅ |
| "Restock Belts" reshuffles track order (Fisher-Yates shuffle) | ✅ |
| Gallery lighting selector (5 presets: ambient, spotlight, daylight, velvet, neon) | ✅ |
| Ambient canvas background shifts based on artwork colors + lighting preset | ✅ |
| Canvas-based color extraction utility (`extractColorsFromImage`) — ready but not yet wired | ✅ |
| Inspect artwork modal with frame selector (7 frame styles) | ✅ |
| "Finish Exhibition" modal with catalog, metadata editing, PNG export (html2canvas) | ✅ |
| AI exhibition narrative via Wikimedia LiftWing LLM | ✅ |
| Narrative attribution footer (model name, link to docs) | ✅ |
| Sound effects (Web Audio API, synthesized — no external files) | ✅ |
| localStorage persistence (canvas state + exhibition metadata) | ✅ |
| Image error fallbacks (SVG "Image Unavailable" placeholder) | ✅ |
| DOM windowing on belts (adaptive 2×/3× duplication + `content-visibility: auto`) | ✅ |
| Confetti on exhibition completion | ✅ |

### Dataset

- **28 artworks** across **16 museums** (`src/data/museums_data.json`)
- Track distribution: T1=3, T2=19, T3=6 — unbalanced, but T1 falls back to full pool when sparse (<6 items)
- All image URLs use `Special:FilePath?width=640` / `?width=1280` pattern
- Sourced from Wikipedia REST API page summaries — verified Commons filenames

---

## Key Architecture Decisions

### 1. Commons Image URLs: `Special:FilePath` not hash-based

**The single most important thing to understand.** Commons only pre-generates thumbnails at standard widths: 120, 320, 400, 500, 640, 800, 960, 1024, 1280. Direct hash URLs at non-standard widths (like 600px, 1200px) return HTTP 400. Always use:

```
https://commons.wikimedia.org/wiki/Special:FilePath/{filename}?width=640
```

This auto-redirects to the nearest valid thumbnail. Do NOT revert to direct `upload.wikimedia.org/wikipedia/commons/thumb/{hash}/{file}/{width}px-{file}` URLs unless you're using a standard width from the list above.

### 2. Dataset sourcing: Wikipedia REST API, not fabricated URLs

To add more artworks, use the Wikipedia page summary endpoint:
```
GET https://en.wikipedia.org/api/rest_v1/page/summary/{article_title}
```
Extract the `thumbnail.source` field, parse the filename from the Commons hash URL, then construct a `Special:FilePath` URL. Do not fabricate Commons filenames — they will 404.

### 3. Freeform drag: window-level event listeners

In `CollectionCanvas.tsx`, drag uses `window.addEventListener('mousemove', ...)` and `window.addEventListener('mouseup', ...)` activated via `useEffect` when `isDragging` is true. This prevents the drag-from-freezing-when-cursor-leaves-canvas bug. A `setItemsRef` ref avoids stale closures.

### 4. Belt animation: CSS `@keyframes`, not `requestAnimationFrame`

The belts use CSS `scrollLoopDynamic` keyframes with a CSS custom property `--anim-translate` for the duplication multiplier. Speed is controlled via `animationDuration` calculated from `120 / currentSpeed`. Animation pauses by setting `animationPlayState: 'paused'`.

### 5. Conveyor belt track fallback

If a track has fewer than 6 unique artworks after filtering, it falls back to the full filtered pool. This prevents Track 1 from showing only 3 items. The threshold is `MIN_TRACK_ITEMS = 6` in `ConveyorBelts.tsx`.

### 6. AI narrative: Wikimedia LiftWing LLM

Endpoint:
```
POST https://api.wikimedia.org/service/lw/inference/v1/models/llm-qwen36-27b/openai/v1/chat/completions
```
Model name must be `llm-qwen36-27b` (matches the URL path — `llm-qwen3-14b` does not exist). No auth required. CORS allows localhost.

### 7. localStorage keys

- Canvas state: `armchair_curator_canvas_v1`
- Exhibition metadata: `armchair_curator_meta_v1`

Both are JSON serialized. Clearing localStorage resets the canvas to the default sample pieces.

---

## Known Issues / Gotchas

1. **Initial canvas uses hardcoded artwork IDs** — `['louvre_mona_lisa', 'met_great_wave', 'rijks_milkmaid']` in App.tsx. If the dataset changes and these IDs don't exist, the initial canvas shows empty. Should fall back to first 3 available items.

2. **Track 1 very sparse** (3 sculptures/antiquities). Works due to fallback, but the themed label "Sculptures & Relics" is misleading when it's showing paintings. Either add more sculpture/antiquity entries or update the label.

3. **`extractColorsFromImage` exists but unused** — the Canvas-based color extraction utility is written and exported but not called anywhere. Color data still comes from pre-baked `colors` arrays in the JSON. To wire it up, call it in `handlePluckArtwork` and replace the artwork's `colors` with the extracted values.

4. **Inconsistent `index.html` title** — still says "My Google AI Studio App". Update to "Armchair Curator".

5. **Vite config has encoding artifact** — `vite.config.ts` line with `// Do not modifyâ` has garbled characters.

6. **Metadata `galleryLighting` already defaults in localStorage** — If a user opened the app before lighting was implemented, their saved metadata may lack the `galleryLighting` field. The `useState` initializer handles this with a default fallback.

---

## Potential Next Steps

- **Expand dataset** — add more sculpture/antiquity/print/textile entries to balance tracks. Use the Wikipedia REST API approach.
- **Wire up `extractColorsFromImage`** — call it on artwork pluck to replace pre-baked colors with real-time extraction.
- **Better initial canvas** — instead of hardcoded IDs, pick 3 random artworks from the dataset.
- **Keyboard accessibility** — add ARIA labels, focus management, keyboard navigation for belts and canvas.
- **Web Worker preloading** — the DESIGN.md calls for image preloading via Web Worker. Not implemented.
- **Salon Wall smart layout** — currently a plain CSS grid. The DESIGN.md envisioned spring physics or intelligent masonry layout with smooth transitions.
- **Responsive mobile** — the app assumes desktop viewport. Belts and canvas need mobile layout.
- **Error boundary** — add a React ErrorBoundary wrapper around the app.
- **Fix `index.html` title** — change to "Armchair Curator".
- **Gallery lighting selector in Export modal** — the lighting selector currently only exists in the Plaque modal. Consider adding it to the Export modal too.
