# Curator's Belt — Ambient Museum Collection & Collage Game

A relaxing, atmospheric web app where images of museum highlights glide across conveyor belts. Pluck artworks onto a canvas to assemble a custom gallery collage, then generate an AI-written exhibition narrative and export as a high-resolution PNG.

---

## How It Works

1. **Conveyor Belts** — Three tracks scroll artworks at different speeds (slow sculptures, medium classics, brisk modern). Hover to slow a track, click or drag to pluck items onto your canvas.
2. **Collection Canvas** — Arranged artworks in Salon Wall grid or Freeform (drag, rotate, scale, layer). Ambient lighting shifts based on your collection's palette.
3. **Finish Exhibition** — Freeze the gallery, edit the exhibition metadata, select gallery lighting (ambient warm, spotlight dramatic, daylight, velvet midnight, neon modern).
4. **AI Exhibition Narrative** — Click *Generate Narrative* and the Wikimedia LiftWing LLM (`llm-qwen36-27b`) writes a thematic exhibition story connecting your selected artworks.
5. **Export** — Download the complete exhibition as a high-resolution PNG with title plaque, catalog citations, and license credits.

## Dataset

28 hand-curated artworks from 16 world museums spanning the Renaissance to Modernism. All images sourced from Wikimedia Commons via `Special:FilePath` redirects — no API keys or authentication required.

**Museums represented:** Louvre, Met, Rijksmuseum, British Museum, Uffizi, Prado, MoMA, Musée d'Orsay, National Gallery London, Mauritshuis, Hermitage, Vatican Museums, Van Gogh Museum, Art Institute of Chicago, Galleria dell'Accademia, Museo Reina Sofía.

## Tech Stack

- **Vite + React 19** (TypeScript, Tailwind CSS v4)
- **Conveyor animation** — CSS `@keyframes` with adaptive DOM windowing and `content-visibility: auto`
- **Color extraction** — Canvas-based pixel sampling with lighting presets
- **Sound** — Web Audio API synthesized effects (no external files)
- **Export** — `html2canvas` for high-res PNG
- **AI narrative** — [Wikimedia LiftWing LLM](https://wikitech.wikimedia.org/wiki/Machine_Learning/LiftWing/Large_Language_Models/Wikimania_2026) (`llm-qwen36-27b`) for exhibition storytelling
- **Icons** — Lucide React
- **Confetti** — `canvas-confetti` on exhibition completion

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. No API keys needed — the app is fully client-side with free AI via Wikimedia Foundation infrastructure.

## Project Structure

```
src/
├── App.tsx                          # Main app state, localStorage persistence
├── components/
│   ├── CollectionCanvas.tsx         # Salon Wall grid & freeform drag canvas
│   ├── ConveyorBelts.tsx            # Three scrolling belts with shuffle & DOM recycling
│   ├── Header.tsx                   # Mode switcher, sound toggle, filter, clear, export
│   ├── FilterToolbar.tsx            # Museum/medium/search filters
│   ├── ArtworkModal.tsx             # Artwork detail inspection + frame selector
│   └── ExhibitionExportModal.tsx    # Export gallery, AI narrative generator, catalog
├── utils/
│   ├── colorExtraction.ts           # Canvas-based color extraction + 5 lighting presets
│   └── soundEffects.ts              # Web Audio API synthesized sounds
├── data/
│   └── museums_data.json            # Artwork dataset
├── types.ts                         # TypeScript interfaces
└── index.css                        # Tailwind + animation keyframes
```

## Key Design Decisions

- **`Special:FilePath?width=`** over direct Commons hash URLs — avoids the 600px/1200px thumbnail width issue where Commons only pre-generates standard sizes (120, 320, 400, 500, 640, 800, 960, 1024, 1280). Non-standard widths return HTTP 400.
- **Freeform drag uses window-level listeners** — prevents drag from freezing when the cursor leaves the canvas area.
- **Belt item pooling** — adaptive duplication (2× for rich tracks, 3× for sparse) with `content-visibility: auto` for browser-level off-screen optimization.
- **Dataset sourced from Wikipedia REST API** — page summary endpoint provides verified Commons filenames, avoiding hallucinated image URLs.
