import { CanvasItem, ExhibitionMeta } from '../types';

/**
 * Extracts or computes ambient color themes based on the canvas items.
 * Supports real-time Canvas-based color extraction from images.
 */

export interface AmbientTheme {
  primaryGradient: string;  // Background CSS gradient
  glowColor: string;        // Accent glow rgba
  accentColor: string;      // Text accent / border highlight
  overlayStyle?: string;    // Additional CSS gradient for lighting overlay
}

type GalleryLighting = ExhibitionMeta['galleryLighting'];

// Default warm gallery neutral palette
const DEFAULT_THEME: AmbientTheme = {
  primaryGradient: 'radial-gradient(ellipse at 50% 30%, #2a2620 0%, #171512 70%, #0d0c0a 100%)',
  glowColor: 'rgba(212, 175, 55, 0.15)',
  accentColor: '#d4af37',
};

// Color extraction cache: imageUrl → extracted hex colors
const colorExtractionCache = new Map<string, string[]>();

/**
 * Extracts up to 3 dominant colors from an image using Canvas API.
 * Samples a 50×50px downscaled version, quantizes colors into buckets,
 * and returns the top 3 hex strings. Results are cached by URL.
 * Falls back to an empty array on error (caller should use pre-baked colors).
 */
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  const cached = colorExtractionCache.get(imageUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas context');

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Bucket quantized colors by frequency
        const buckets = new Map<string, number>();
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 96) continue; // skip transparent / near-transparent

          // Quantize to 32-step buckets (8 levels per channel)
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }

        if (buckets.size === 0) {
          colorExtractionCache.set(imageUrl, []);
          resolve([]);
          return;
        }

        const sorted = Array.from(buckets.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          });

        colorExtractionCache.set(imageUrl, sorted);
        resolve(sorted);
      } catch {
        colorExtractionCache.set(imageUrl, []);
        resolve([]);
      }
    };

    img.onerror = () => {
      colorExtractionCache.set(imageUrl, []);
      resolve([]);
    };

    img.src = imageUrl;
  });
}

// ── Lighting modifiers ──────────────────────────────────────────────

interface ColorMultipliers {
  /** Scale factor per RGB channel for gradient stops */
  rgbScale: [number, number, number][];
  /** Glow alpha override (0–1), or null to keep default */
  glowAlpha: number | null;
  /** Glow RGB offset added after scaling (positive or negative) */
  glowRgbOffset: number;
  /** Extra overlay CSS gradient, or undefined for none */
  overlayStyle: string | undefined;
}

const LIGHTING_PRESETS: Record<GalleryLighting, ColorMultipliers> = {
  'ambient-warm': {
    rgbScale: [
      [0.35, 0.35, 0.35],
      [0.20, 0.20, 0.20],
      [0.10, 0.10, 0.10],
    ],
    glowAlpha: 0.25,
    glowRgbOffset: 40,
    overlayStyle: undefined,
  },
  'spotlight-dramatic': {
    rgbScale: [
      [0.25, 0.25, 0.25],
      [0.12, 0.12, 0.12],
      [0.04, 0.04, 0.04],
    ],
    glowAlpha: 0.45,
    glowRgbOffset: 20,
    overlayStyle: 'radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0.55) 0%, transparent 55%, rgba(0,0,0,0.25) 100%)',
  },
  'daylight-gallery': {
    rgbScale: [
      [0.50, 0.48, 0.44],
      [0.30, 0.28, 0.25],
      [0.15, 0.14, 0.12],
    ],
    glowAlpha: 0.08,
    glowRgbOffset: 60,
    overlayStyle: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.07) 0%, transparent 60%)',
  },
  'velvet-midnight': {
    rgbScale: [
      [0.22, 0.18, 0.30],
      [0.10, 0.08, 0.18],
      [0.04, 0.03, 0.08],
    ],
    glowAlpha: 0.30,
    glowRgbOffset: 20,
    overlayStyle: 'radial-gradient(ellipse at 50% 30%, rgba(15,10,45,0.45) 0%, transparent 70%)',
  },
  'neon-modern': {
    rgbScale: [
      [0.45, 0.42, 0.42],
      [0.28, 0.25, 0.25],
      [0.14, 0.12, 0.12],
    ],
    glowAlpha: 0.35,
    glowRgbOffset: 20,
    overlayStyle: 'radial-gradient(ellipse at 50% 35%, rgba(255,20,147,0.05) 0%, rgba(0,255,255,0.04) 50%, transparent 80%)',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Main theme function ──────────────────────────────────────────────

export function computeAmbientTheme(
  items: CanvasItem[],
  galleryLighting: GalleryLighting = 'ambient-warm'
): AmbientTheme {
  const modifiers = LIGHTING_PRESETS[galleryLighting] || LIGHTING_PRESETS['ambient-warm'];

  if (!items || items.length === 0) {
    return { ...DEFAULT_THEME, overlayStyle: modifiers.overlayStyle };
  }

  // Collect all artwork colors
  const allColors: string[] = [];
  items.forEach((item) => {
    if (item.artwork.colors && item.artwork.colors.length > 0) {
      allColors.push(...item.artwork.colors);
    }
  });

  if (allColors.length === 0) {
    return { ...DEFAULT_THEME, overlayStyle: modifiers.overlayStyle };
  }

  const primary = allColors[0] || '#4a3f35';
  const secondary = allColors[Math.min(1, allColors.length - 1)] || '#8c7250';
  const tertiary = allColors[allColors.length - 1] || '#2c261e';

  try {
    const rgbs = [hexToRgb(primary), hexToRgb(secondary), hexToRgb(tertiary)];

    // Build gradient stops with lighting multipliers
    const stops = rgbs.map((rgb, idx) => {
      const [sr, sg, sb] = modifiers.rgbScale[idx];
      const r = Math.floor(clamp(rgb.r * sr, 0, 255));
      const g = Math.floor(clamp(rgb.g * sg, 0, 255));
      const b = Math.floor(clamp(rgb.b * sb, 0, 255));
      const a = 1.0 - idx * 0.03; // slight alpha taper
      return `rgba(${r},${g},${b},${a.toFixed(2)})`;
    });

    const primaryGradient = `radial-gradient(ellipse at 50% 35%, ${stops[0]} 0%, ${stops[1]} 60%, ${stops[2]} 100%)`;

    // Glow from primary color with offset
    const gAlpha = modifiers.glowAlpha ?? 0.25;
    const gOff = modifiers.glowRgbOffset;
    const glowColor = `rgba(${clamp(rgbs[0].r + gOff, 0, 255)},${clamp(rgbs[0].g + gOff, 0, 255)},${clamp(rgbs[0].b + gOff, 0, 255)},${gAlpha})`;

    const accentColor = `rgb(${clamp(rgbs[0].r + 40, 0, 255)},${clamp(rgbs[0].g + 40, 0, 255)},${clamp(rgbs[0].b + 40, 0, 255)})`;

    return {
      primaryGradient,
      glowColor,
      accentColor,
      overlayStyle: modifiers.overlayStyle,
    };
  } catch {
    return { ...DEFAULT_THEME, overlayStyle: modifiers.overlayStyle };
  }
}
