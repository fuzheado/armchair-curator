export type ArtMedium = 'painting' | 'sculpture' | 'print' | 'textile' | 'antiquity' | 'drawing';

export interface Artwork {
  id: string;             // Unique identifier (e.g., "louvre_mona_lisa")
  title: string;          // Artwork title
  artist?: string;        // Artist name or culture
  date?: string;          // Origin date/era
  museum: string;         // e.g., "Louvre Museum"
  articleUrl: string;     // Direct Wikipedia article URL
  thumbUrl: string;       // 600px Wikimedia Commons CDN thumbnail URL
  fullUrl: string;        // 1200px Wikimedia Commons CDN image URL
  aspectRatio: number;    // width / height float ratio
  caption: string;        // Cleaned text caption extracted from wikitext
  license: string;        // e.g., "Public Domain" or "CC BY-SA 4.0"
  medium: ArtMedium;      // Medium classification
  trackCategory: 1 | 2 | 3; // Preferred conveyor belt track (1: Sculpture/Antiquity, 2: Painting/Portrait, 3: Modern/Print)
  tags?: string[];
  colors?: string[];      // Pre-calculated accent colors
}

export type FrameStyle = 'gold' | 'oak' | 'gallery-dark' | 'float-white' | 'ornate' | 'acrylic-glass' | 'none';

export interface CanvasItem {
  id: string;             // Unique placement instance ID
  artwork: Artwork;
  x: number;              // Percentage or px X position in freeform mode
  y: number;              // Percentage or px Y position in freeform mode
  width: number;          // Rendered width in px
  height: number;         // Rendered height in px
  rotation: number;       // Angle in degrees (-15 to 15)
  scale: number;          // Zoom/Scale factor (0.5 to 2.0)
  zIndex: number;         // Layering order
  frameStyle: FrameStyle; // Frame border styling
  addedAt: number;        // Timestamp
}

export type CanvasMode = 'salon' | 'freeform';

export interface ExhibitionMeta {
  title: string;
  curatorName: string;
  description: string;
  galleryLighting: 'ambient-warm' | 'spotlight-dramatic' | 'daylight-gallery' | 'velvet-midnight' | 'neon-modern';
}

export interface FilterOptions {
  museum: string;
  medium: string;
  searchQuery: string;
}
