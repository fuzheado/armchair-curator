Here is a PRD for a new app, can you see if this is clear, or ask me anything else you might need:

# Product Requirements Document (PRD)

## Project Title
**Curator’s Belt — Ambient Museum Collection & Collage Game**

---

## 1. Product Overview & Vision
**Curator’s Belt** is a relaxing, atmospheric web application and visual curation game. Images of museum highlights continuously glide across the bottom of the screen on three conveyor belts moving at different speeds. The user plucks artworks off the belts onto a spacious collection canvas above, assembling a custom gallery collage. As new pieces are added, the canvas ambiently transforms its lighting, layout, and metadata display in real time.

---

## 2. Technical Architecture & Data Strategy

### 2.1 Dataset Strategy
* **Primary Source:** A static JSON bundle (`museums_data.json`) pre-compiled from the main Wikipedia articles of ~100 top global museums (e.g., Louvre, Metropolitan Museum of Art, Rijksmuseum).
* **Rationale:** Main article images serve as a human-curated "greatest hits" filter, eliminating the need for real-time SPARQL queries while guaranteeing high visual quality and pre-parsed wikitext captions.

### 2.2 Artwork Data Schema
```typescript
interface Artwork {
  id: string;             // Unique identifier (e.g., "louvre_mona_lisa")
  title: string;          // Artwork title
  museum: string;         // e.g., "Louvre Museum"
  articleUrl: string;     // Direct Wikipedia article URL
  thumbUrl: string;       // 600px Wikimedia Commons CDN thumbnail URL
  fullUrl: string;        // 1200px Wikimedia Commons CDN image URL
  aspectRatio: number;    // width / height float ratio
  caption: string;        // Cleaned text caption extracted from wikitext
  license: string;        // e.g., "Public Domain" or "CC BY-SA 4.0"
}
```

### 2.3 Performance & Caching Rules
DOM Recycling: Object pooling for off-screen conveyor belt elements to maintain 60 FPS performance.
Preloading Queue: Web Worker thread pre-fetches image assets into browser cache ahead of the visible viewport edge.

## 3. UI/UX Layout & Component Architecture

+-----------------------------------------------------------------------+
|                                                                       |
|                       COLLECTION CANVAS (65% Viewport)                |
|               (Dynamic Salon Wall / Interactive Collage)              |
|                                                                       |
+-----------------------------------------------------------------------+
| Track 1 (Slow / 15px/s)   [ Sculpture ]   [ Gold Frame ]   [ Vase ]  | ->
| Track 2 (Med / 25px/s)    [ Portrait ]    [ Sketch ]   [ Landscape ] | ->
| Track 3 (Brisk / 35px/s)  [ Modern ]   [ Textile ]   [ Print ]       | ->
+-----------------------------------------------------------------------+

### 3.1 Collection Canvas (Top 65% Viewport)
Workspace Behavior: Interactive area where collected pieces are placed and framed.
Dynamic Layout Engine:
"Salon Wall" grid mode: Auto-adjusts surrounding artwork using smooth CSS transitions or spring physics when a new item lands.
Freeform mode: Allows manual drag, rotation, scaling, and z-index layer ordering.
Reactive Ambient Lighting:
Extracts dominant color palettes from placed artworks on the fly using HTML5 Canvas context.
Smoothly shifts background canvas gradients and drop-shadow tints to reflect the collective palette of the current collection.
Live Exhibition Plaque: Displays real-time item count and thematic summary (e.g., "Selections from Louvre & Rijksmuseum — 5 Artworks").
Click-to-Inspect: Selecting an artwork on the canvas opens a detail modal with its high-res image, complete caption, and direct Wikipedia link.
### 3.2 Conveyor Belts (Bottom 35% Viewport)
Structure: Three parallel horizontal tracks scrolling left-to-right at staggered speeds.

Interactions:

Hover: Pauses/slows the hovered track and elevates the item slightly with a soft drop-shadow.

Drag-to-Pluck: Dragging an item upward detaches it from the belt and moves it into the Canvas state.

Infinite Loop: Automatically feeds random unshown items from museums_data.json onto the right edge as slots open up.
## 4. Suggested Tech Stack
Framework: Next.js / React OR Vite + Vanilla JS (for ultra-lightweight execution).

State Management: Zustand or React Context (tracking beltQueue and canvasItems).

Animation & Gesture: Framer Motion or @use-gesture/react for drag-and-drop physics.

Color Extraction: colorthief library or native OffscreenCanvas API.

## 5. Implementation Roadmap for Coding Agents
### Phase 1: MVP Setup
Create mock museums_data.json with 20 sample artwork records.
Build 3 horizontal scrolling conveyor tracks with basic CSS keyframe loops or requestAnimationFrame.
Implement basic drag-and-drop from belt to canvas.
### Phase 2: Reactive Polish & Layout
Implement real-time color extraction to shift background canvas gradients upon adding items.
Build auto-arranging "Salon Wall" layout logic for the canvas.
Integrate full 100-museum JSON dataset with image preloading queue.
### Phase 3: Export & Presentation Mode
Add "Finish Exhibition" button to hide conveyor belts and freeze the gallery wall.
Generate downloadable high-resolution PNG image of the finished collage with title plaque and license credits.