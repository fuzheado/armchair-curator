import React, { useState, useEffect, useMemo } from 'react';
import { Artwork, CanvasItem, CanvasMode, ExhibitionMeta, FilterOptions, FrameStyle } from './types';
import museumDataset from './data/museums_data.json';
import { computeAmbientTheme } from './utils/colorExtraction';
import { Header } from './components/Header';
import { CollectionCanvas } from './components/CollectionCanvas';
import { ConveyorBelts } from './components/ConveyorBelts';
import { FilterToolbar } from './components/FilterToolbar';
import { ArtworkModal } from './components/ArtworkModal';
import { ExhibitionExportModal } from './components/ExhibitionExportModal';
import { BookOpen, X, Info, Sparkles } from 'lucide-react';
import { playPlaceSound, playClickSound } from './utils/soundEffects';

const STORAGE_KEY_CANVAS = 'curators_belt_canvas_v1';
const STORAGE_KEY_META = 'curators_belt_meta_v1';

export default function App() {
  const allArtworks = useMemo(() => museumDataset as Artwork[], []);

  // Canvas State
  const [items, setItems] = useState<CanvasItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CANVAS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load saved canvas', e);
    }
    // Default initial sample pieces for instant delight
    const defaultSampleIds = ['louvre_mona_lisa', 'met_great_wave', 'rijks_milkmaid'];
    return allArtworks
      .filter((a) => defaultSampleIds.includes(a.id))
      .map((art, idx) => ({
        id: `initial_${art.id}_${idx}`,
        artwork: art,
        x: 20 + idx * 25,
        y: 20 + idx * 10,
        width: 220,
        height: 280,
        rotation: (idx - 1) * 4,
        scale: 1,
        zIndex: idx + 1,
        frameStyle: (['gold', 'oak', 'gallery-dark'][idx % 3] as FrameStyle),
        addedAt: Date.now(),
      }));
  });

  // Mode and Sound State
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('salon');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals
  const [inspectedItem, setInspectedItem] = useState<CanvasItem | null>(null);
  const [inspectedBeltArtwork, setInspectedBeltArtwork] = useState<Artwork | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExhibitionExportOpen, setIsExhibitionExportOpen] = useState(false);
  const [isPlaqueInfoOpen, setIsPlaqueInfoOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    museum: 'all',
    medium: 'all',
    searchQuery: '',
  });

  // Exhibition Metadata State
  const [exhibitionMeta, setExhibitionMeta] = useState<ExhibitionMeta>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_META);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load saved meta', e);
    }
    return {
      title: 'Grand Masterpiece Assemblage',
      curatorName: 'Lead Curator',
      description: 'A curated dialogue between classic European masterpieces, ancient relics, and East Asian print traditions.',
      galleryLighting: 'ambient-warm',
    };
  });

  // Save to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CANVAS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed saving canvas state', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(exhibitionMeta));
    } catch (e) {
      console.warn('Failed saving meta state', e);
    }
  }, [exhibitionMeta]);

  // Derived Ambient Lighting Theme
  const ambientTheme = useMemo(
    () => computeAmbientTheme(items, exhibitionMeta.galleryLighting),
    [items, exhibitionMeta.galleryLighting]
  );

  // Unique list of museums for filter
  const allMuseums = useMemo(() => {
    return Array.from(new Set(allArtworks.map((a) => a.museum))).sort();
  }, [allArtworks]);

  // Handlers
  const handlePluckArtwork = (artwork: Artwork, xPct = 40, yPct = 30) => {
    const newItem: CanvasItem = {
      id: `canvas_item_${artwork.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      artwork,
      x: Math.max(5, Math.min(75, xPct + (Math.random() * 10 - 5))),
      y: Math.max(5, Math.min(65, yPct + (Math.random() * 10 - 5))),
      width: 220,
      height: 280,
      rotation: Math.floor(Math.random() * 12) - 6,
      scale: 1,
      zIndex: items.length + 1,
      frameStyle: 'gold',
      addedAt: Date.now(),
    };
    if (soundEnabled) playPlaceSound();
    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleDropFromBelt = (artworkId: string, clientX?: number, clientY?: number) => {
    const found = allArtworks.find((a) => a.id === artworkId);
    if (!found) return;

    let xPct = 40;
    let yPct = 30;

    if (clientX && clientY) {
      xPct = Math.max(5, Math.min(80, (clientX / window.innerWidth) * 100));
      yPct = Math.max(5, Math.min(70, (clientY / (window.innerHeight * 0.62)) * 100));
    }

    handlePluckArtwork(found, xPct, yPct);
  };

  const handleClearCanvas = () => {
    setItems([]);
    setSelectedItemId(null);
  };

  const handleFrameChangeForInspected = (newFrameStyle: FrameStyle) => {
    if (!inspectedItem) return;
    setItems((prev) =>
      prev.map((i) => (i.id === inspectedItem.id ? { ...i, frameStyle: newFrameStyle } : i))
    );
    setInspectedItem((prev) => (prev ? { ...prev, frameStyle: newFrameStyle } : null));
  };

  const handleRemoveInspectedFromCanvas = () => {
    if (!inspectedItem) return;
    setItems((prev) => prev.filter((i) => i.id !== inspectedItem.id));
    setInspectedItem(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans antialiased">
      {/* Top Header */}
      <Header
        canvasMode={canvasMode}
        setCanvasMode={setCanvasMode}
        canvasItemCount={items.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        exhibitionMeta={exhibitionMeta}
        onOpenExhibitionInfo={() => setIsPlaqueInfoOpen(true)}
        onFinishExhibition={() => setIsExhibitionExportOpen(true)}
        onClearCanvas={handleClearCanvas}
        onToggleFilterDrawer={() => setIsFilterOpen(!isFilterOpen)}
        isFilterOpen={isFilterOpen}
      />

      {/* Filter Drawer Toolbar */}
      {isFilterOpen && (
        <FilterToolbar
          filters={filters}
          setFilters={setFilters}
          allMuseums={allMuseums}
          onReset={() => setFilters({ museum: 'all', medium: 'all', searchQuery: '' })}
          onRefreshBelts={() => {
            // Re-trigger belt animation
            setFilters((f) => ({ ...f }));
          }}
          soundEnabled={soundEnabled}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {/* Main Workspace (Collection Canvas - Top 62%) */}
      <CollectionCanvas
        items={items}
        setItems={setItems}
        canvasMode={canvasMode}
        ambientTheme={ambientTheme}
        selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId}
        onInspectArtwork={(item) => setInspectedItem(item)}
        soundEnabled={soundEnabled}
        onDropFromBelt={handleDropFromBelt}
      />

      {/* Conveyor Belts (Bottom 38%) */}
      <div className="flex-1 min-h-0 flex flex-col justify-end">
        <ConveyorBelts
          allArtworks={allArtworks}
          filters={filters}
          onPluckArtwork={(art) => handlePluckArtwork(art)}
          soundEnabled={soundEnabled}
          onInspectArtwork={(art) => setInspectedBeltArtwork(art)}
        />
      </div>

      {/* Artwork Inspection Modal (For items on Canvas) */}
      {inspectedItem && (
        <ArtworkModal
          artwork={inspectedItem.artwork}
          currentFrameStyle={inspectedItem.frameStyle}
          onClose={() => setInspectedItem(null)}
          onFrameChange={handleFrameChangeForInspected}
          onRemoveFromCanvas={handleRemoveInspectedFromCanvas}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Artwork Inspection Modal (For items on Conveyor Belts) */}
      {inspectedBeltArtwork && (
        <ArtworkModal
          artwork={inspectedBeltArtwork}
          onClose={() => setInspectedBeltArtwork(null)}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Exhibition Finish & PNG Export Modal */}
      {isExhibitionExportOpen && (
        <ExhibitionExportModal
          items={items}
          exhibitionMeta={exhibitionMeta}
          setExhibitionMeta={setExhibitionMeta}
          onClose={() => setIsExhibitionExportOpen(false)}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Plaque & Curator Details Modal */}
      {isPlaqueInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-stone-900 border border-amber-800/60 rounded-xl p-6 shadow-2xl text-stone-200 space-y-4">
            <button
              onClick={() => {
                if (soundEnabled) playClickSound();
                setIsPlaqueInfoOpen(false);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-800 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-amber-900/40 pb-3">
              <Info className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-lg font-bold text-amber-100">
                Curator’s Exhibition Statement
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-400 font-mono uppercase mb-1">
                  Gallery Title
                </label>
                <input
                  type="text"
                  value={exhibitionMeta.title}
                  onChange={(e) =>
                    setExhibitionMeta((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-mono uppercase mb-1">
                  Lead Curator Name
                </label>
                <input
                  type="text"
                  value={exhibitionMeta.curatorName}
                  onChange={(e) =>
                    setExhibitionMeta((p) => ({ ...p, curatorName: e.target.value }))
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-mono uppercase mb-1">
                  Thematic Statement / Wall Text
                </label>
                <textarea
                  value={exhibitionMeta.description}
                  onChange={(e) =>
                    setExhibitionMeta((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-mono uppercase mb-1">
                  Gallery Lighting
                </label>
                <select
                  value={exhibitionMeta.galleryLighting}
                  onChange={(e) =>
                    setExhibitionMeta((p) => ({
                      ...p,
                      galleryLighting: e.target.value as ExhibitionMeta['galleryLighting'],
                    }))
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ambient-warm">Ambient Warm — Classic gallery glow</option>
                  <option value="spotlight-dramatic">Spotlight Dramatic — High contrast, dark</option>
                  <option value="daylight-gallery">Daylight Gallery — Bright, airy</option>
                  <option value="velvet-midnight">Velvet Midnight — Deep blueish tone</option>
                  <option value="neon-modern">Neon Modern — Vibrant, saturated</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => {
                  if (soundEnabled) playClickSound();
                  setIsPlaqueInfoOpen(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs rounded transition"
              >
                Save Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
