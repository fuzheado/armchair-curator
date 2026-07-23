import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Artwork, FilterOptions } from '../types';
import { Play, Pause, FastForward, Plus, Sparkles, MoveUp, Info } from 'lucide-react';
import { playPluckSound, playClickSound } from '../utils/soundEffects';

const PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23292620' width='200' height='200'/%3E%3Ctext fill='%2399927a' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='serif' font-size='14'%3EImage Unavailable%3C/text%3E%3C/svg%3E";

/** Fisher-Yates shuffle (returns new array, does not mutate input) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ConveyorBeltsProps {
  allArtworks: Artwork[];
  filters: FilterOptions;
  onPluckArtwork: (artwork: Artwork) => void;
  soundEnabled: boolean;
  onInspectArtwork: (artwork: Artwork) => void;
}

export const ConveyorBelts: React.FC<ConveyorBeltsProps> = ({
  allArtworks,
  filters,
  onPluckArtwork,
  soundEnabled,
  onInspectArtwork,
}) => {
  const [beltSpeedMultiplier, setBeltSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const beltContainerRef = useRef<HTMLDivElement>(null);

  // Shuffle belt items when filters reference changes (Restock Belts trigger)
  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [filters]);

  // Filter artworks according to current filter state
  const filteredArtworks = allArtworks.filter((art) => {
    if (filters.museum !== 'all' && art.museum !== filters.museum) return false;
    if (filters.medium !== 'all' && art.medium !== filters.medium) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchArtist = art.artist?.toLowerCase().includes(q);
      const matchMuseum = art.museum.toLowerCase().includes(q);
      if (!matchTitle && !matchArtist && !matchMuseum) return false;
    }
    return true;
  });

  // Separate into Track 1, Track 2, Track 3
  const track1Artworks = filteredArtworks.filter((a) => a.trackCategory === 1);
  const track2Artworks = filteredArtworks.filter((a) => a.trackCategory === 2);
  const track3Artworks = filteredArtworks.filter((a) => a.trackCategory === 3);

  // Fallbacks if a track is sparse due to filtering (fewer than 6 unique artworks = too sparse for a good loop)
  const MIN_TRACK_ITEMS = 6;
  const t1List = track1Artworks.length >= MIN_TRACK_ITEMS ? track1Artworks : filteredArtworks;
  const t2List = track2Artworks.length >= MIN_TRACK_ITEMS ? track2Artworks : filteredArtworks;
  const t3List = track3Artworks.length >= MIN_TRACK_ITEMS ? track3Artworks : filteredArtworks;

  // Shuffled versions (re-shuffled on Restock Belts)
  const shuffledT1 = useMemo(() => shuffle(t1List), [t1List, refreshKey]);
  const shuffledT2 = useMemo(() => shuffle(t2List), [t2List, refreshKey]);
  const shuffledT3 = useMemo(() => shuffle(t3List), [t3List, refreshKey]);

  // Track configurations (using shuffled lists)
  const tracks = [
    { id: 1, name: 'Track 1 — Sculptures & Relics', speed: 3, items: shuffledT1, bg: 'from-amber-950/80 via-stone-900 to-amber-950/80' },
    { id: 2, name: 'Track 2 — Classic Masterpieces & Portraits', speed: 5, items: shuffledT2, bg: 'from-stone-950 via-amber-950/60 to-stone-950' },
    { id: 3, name: 'Track 3 — Modern Art, Prints & Textiles', speed: 7, items: shuffledT3, bg: 'from-amber-950/90 via-stone-900 to-amber-950/90' },
  ];

  return (
    <section
      ref={beltContainerRef}
      className="relative z-20 w-full bg-stone-950 border-t-2 border-amber-900/60 p-3 md:p-4 text-stone-200 select-none shadow-[0_-15px_30px_rgba(0,0,0,0.8)]"
    >
      {/* Injected keyframes for dynamic belt animation (2× vs 3× duplication) */}
      <style>{`
        @keyframes scrollLoopDynamic {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(var(--anim-translate, -33.333333%)); }
        }
      `}</style>

      {/* Belt Speed & Controls Header */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-serif font-bold text-amber-200 tracking-wider uppercase text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Conveyor Belts
          </span>
          <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
            (3 Tracks • Hover to slow • Click or drag up to pluck)
          </span>
        </div>

        {/* Speed Toggles */}
        <div className="flex items-center space-x-1 bg-stone-900/90 p-1 rounded-md border border-stone-800">
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsPaused(!isPaused);
            }}
            className={`p-1 rounded text-xs transition ${
              isPaused ? 'bg-amber-900 text-amber-200' : 'text-stone-400 hover:text-stone-200'
            }`}
            title={isPaused ? 'Resume Belts' : 'Pause Belts'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setBeltSpeedMultiplier(0.5);
              setIsPaused(false);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
              beltSpeedMultiplier === 0.5 && !isPaused
                ? 'bg-amber-900/80 text-amber-200 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            0.5x
          </button>
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setBeltSpeedMultiplier(1);
              setIsPaused(false);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
              beltSpeedMultiplier === 1 && !isPaused
                ? 'bg-amber-900/80 text-amber-200 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1.0x
          </button>
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setBeltSpeedMultiplier(1.8);
              setIsPaused(false);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
              beltSpeedMultiplier === 1.8 && !isPaused
                ? 'bg-amber-900/80 text-amber-200 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1.8x
          </button>
        </div>
      </div>

      {/* 3 Conveyor Tracks */}
      <div className="space-y-2.5">
        {tracks.map((track) => {
          const isTrackHovered = hoveredTrack === track.id;
          const currentSpeed = isPaused
            ? 0
            : isTrackHovered
            ? track.speed * 0.2 * beltSpeedMultiplier
            : track.speed * beltSpeedMultiplier;

          // DOM recycling: duplicate items only enough for a seamless loop.
          // For tracks with ≥ 6 unique items, 2× fills ~2 viewport widths;
          // sparser tracks use 3× to avoid visible gaps.
          const dupCount = track.items.length >= 6 ? 2 : 3;
          const loopItems = Array.from({ length: dupCount }, () => track.items).flat();
          // CSS animation translate target matches duplication count
          const animTranslate = dupCount === 2 ? '-50%' : '-33.333333%';

          return (
            <div
              key={track.id}
              onMouseEnter={() => setHoveredTrack(track.id)}
              onMouseLeave={() => setHoveredTrack(null)}
              className="relative overflow-hidden h-20 md:h-24 rounded-lg bg-stone-900/90 border border-stone-800 shadow-inner group"
            >
              {/* Belt Track Mechanical Visual Lines */}
              <div className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(90deg,#3f2e18_0px,#3f2e18_12px,#1c150c_12px,#1c150c_24px)] opacity-60 pointer-events-none" />

              {/* Scrolling Container */}
              <div
                className="flex items-center space-x-4 h-full px-4"
                style={{
                  animationDuration: `${Math.max(10, 120 / (currentSpeed || 0.001))}s`,
                  animationPlayState: currentSpeed === 0 ? 'paused' : 'running',
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationName: 'scrollLoopDynamic',
                  width: 'max-content',
                  '--anim-translate': animTranslate,
                } as React.CSSProperties}
              >
                {loopItems.map((art, idx) => (
                  <ArtworkBeltItem
                    key={`${art.id}_${idx}`}
                    artwork={art}
                    onPluck={() => {
                      if (soundEnabled) playPluckSound();
                      onPluckArtwork(art);
                    }}
                    onInspect={() => {
                      if (soundEnabled) playClickSound();
                      onInspectArtwork(art);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Belt Item Card Component
interface ArtworkBeltItemProps {
  artwork: Artwork;
  onPluck: () => void;
  onInspect: () => void;
}

const ArtworkBeltItem: React.FC<ArtworkBeltItemProps> = ({ artwork, onPluck, onInspect }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(artwork));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src !== PLACEHOLDER_SRC) {
      img.src = PLACEHOLDER_SRC;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="relative group flex-none h-16 md:h-20 bg-stone-950 border border-amber-900/50 hover:border-amber-400 rounded-md p-1.5 flex items-center space-x-2.5 shadow-md cursor-grab active:cursor-grabbing transition-colors duration-200 hover:shadow-amber-950/50 hover:bg-stone-900"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 80px' }}
    >
      <img
        src={artwork.thumbUrl}
        alt={artwork.title}
        onError={handleImgError}
        className="h-full object-contain rounded-xs pointer-events-none"
      />
      <div className="flex flex-col justify-center max-w-[120px] md:max-w-[150px] overflow-hidden">
        <span className="font-serif text-[11px] md:text-xs font-semibold text-amber-100 truncate leading-tight">
          {artwork.title}
        </span>
        <span className="text-[9px] md:text-[10px] text-stone-400 truncate mt-0.5">
          {artwork.museum}
        </span>
      </div>

      {/* Action Hover Buttons — subtle bar below image, doesn't obscure artwork */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent rounded-b-md pt-6 pb-1.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
        <button
          onClick={onPluck}
          className="flex items-center space-x-1 bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-medium text-[10px] px-2.5 py-1 rounded shadow transition"
          title="Pluck artwork onto Collection Canvas"
        >
          <Plus className="w-3 h-3" />
          <span>Pluck</span>
        </button>
        <button
          onClick={onInspect}
          className="p-1 bg-stone-700/80 hover:bg-stone-600 text-amber-200 rounded text-[10px]"
          title="Inspect Artwork Details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
