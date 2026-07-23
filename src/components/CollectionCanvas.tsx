import React, { useEffect, useRef, useState } from 'react';
import { CanvasItem, CanvasMode, FrameStyle } from '../types';
import { AmbientTheme } from '../utils/colorExtraction';
import { Sparkles, Trash2, ZoomIn, ZoomOut, RotateCw, Layers, Move, Eye, Frame } from 'lucide-react';
import { playClickSound, playPlaceSound } from '../utils/soundEffects';

interface CollectionCanvasProps {
  items: CanvasItem[];
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
  canvasMode: CanvasMode;
  ambientTheme: AmbientTheme;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  onInspectArtwork: (item: CanvasItem) => void;
  soundEnabled: boolean;
  onDropFromBelt?: (artworkId: string, clientX?: number, clientY?: number) => void;
}

const FRAME_CLASSES: Record<FrameStyle, string> = {
  gold: 'border-[6px] md:border-[8px] border-amber-600 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(212,175,55,0.4)] rounded-xs bg-amber-950/80',
  oak: 'border-[6px] md:border-[8px] border-amber-800 shadow-[0_15px_30px_rgba(0,0,0,0.7)] rounded-xs bg-amber-900/90',
  'gallery-dark': 'border-[6px] md:border-[8px] border-stone-800 shadow-[0_15px_30px_rgba(0,0,0,0.9)] rounded-xs bg-stone-900',
  'float-white': 'border-[4px] md:border-[6px] border-stone-200 shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-xs bg-stone-100',
  ornate: 'border-[8px] md:border-[10px] border-yellow-600 shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_20px_rgba(234,179,8,0.3)] rounded-xs bg-yellow-950',
  'acrylic-glass': 'border-2 border-cyan-400/40 shadow-[0_15px_35px_rgba(6,182,212,0.2)] rounded bg-cyan-950/30 backdrop-blur-sm',
  none: 'shadow-[0_10px_25px_rgba(0,0,0,0.7)] rounded-xs',
};

const IMG_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#292524" width="200" height="200" rx="4"/><text fill="#78716c" font-family="serif" font-size="13" text-anchor="middle" x="100" y="105">Image Unavailable</text></svg>',
  );

export const CollectionCanvas: React.FC<CollectionCanvasProps> = ({
  items,
  setItems,
  canvasMode,
  ambientTheme,
  selectedItemId,
  setSelectedItemId,
  onInspectArtwork,
  soundEnabled,
  onDropFromBelt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; itemX: number; itemY: number } | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);

  // Stable refs so window-level handlers never read stale closures
  const setItemsRef = useRef(setItems);
  setItemsRef.current = setItems;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Handle Drag and Drop from Belt
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const artworkData = e.dataTransfer.getData('application/json');
    if (artworkData && onDropFromBelt) {
      try {
        const parsed = JSON.parse(artworkData);
        if (parsed.id) {
          onDropFromBelt(parsed.id, e.clientX, e.clientY);
        }
      } catch (err) {
        console.warn('Invalid drop data', err);
      }
    }
  };

  // Freeform drag: attach window-level listeners only while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !draggedItemIdRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setItemsRef.current((prev) =>
        prev.map((i) => {
          if (i.id === draggedItemIdRef.current) {
            return {
              ...i,
              x: Math.max(2, Math.min(88, dragStartRef.current!.itemX + (dx / (containerRef.current?.clientWidth || 1000)) * 100)),
              y: Math.max(2, Math.min(80, dragStartRef.current!.itemY + (dy / (containerRef.current?.clientHeight || 600)) * 100)),
            };
          }
          return i;
        })
      );
    };

    const handleWindowMouseUp = () => {
      if (soundEnabledRef.current) playPlaceSound();
      setIsDragging(false);
      dragStartRef.current = null;
      draggedItemIdRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging]);

  // Canvas Mouse Actions in Freeform Mode
  const handleItemMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    if (canvasMode !== 'freeform') return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    draggedItemIdRef.current = item.id;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };
    setIsDragging(true);
  };

  // Item Controls
  const handleRotate = (id: string, delta: number) => {
    if (soundEnabled) playClickSound();
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, rotation: (i.rotation + delta) % 360 } : i))
    );
  };

  const handleScale = (id: string, factor: number) => {
    if (soundEnabled) playClickSound();
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, scale: Math.max(0.4, Math.min(2.5, i.scale * factor)) } : i
      )
    );
  };

  const handleLayer = (id: string, delta: number) => {
    if (soundEnabled) playClickSound();
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, zIndex: Math.max(1, i.zIndex + delta) } : i))
    );
  };

  const handleRemove = (id: string) => {
    if (soundEnabled) playClickSound();
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  return (
    <section
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => setSelectedItemId(null)}
      className="relative w-full h-[62vh] min-h-[380px] max-h-[700px] overflow-hidden transition-all duration-700 select-none shadow-2xl flex flex-col justify-between"
      style={{
        background: ambientTheme.primaryGradient,
        boxShadow: `inset 0 0 100px ${ambientTheme.glowColor}`,
      }}
    >
      {/* Wall Texture / Spotlight Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      {/* Gallery Lighting Overlay */}
      {ambientTheme.overlayStyle && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: ambientTheme.overlayStyle }}
        />
      )}

      {/* Mode Badge & Guidance */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 text-xs font-serif text-amber-200/80 bg-stone-950/70 backdrop-blur px-3 py-1.5 rounded-full border border-amber-900/30 shadow">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {canvasMode === 'salon' ? 'Harmonized Salon Wall Grid' : 'Freeform Gallery Arrangement'}
        </span>
      </div>

      {/* Canvas Workspace */}
      <div className="relative w-full h-full p-6 md:p-10 overflow-auto">
        {items.length === 0 ? (
          /* Empty Canvas Placeholder Guidance */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-amber-900/30 rounded-2xl bg-stone-950/30 backdrop-blur-xs my-auto">
            <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-700/50 flex items-center justify-center mb-4 text-amber-400 shadow-lg">
              <Move className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-serif text-xl font-bold text-amber-100 mb-2">
              Your Gallery Canvas is Ready
            </h3>
            <p className="text-sm text-stone-400 max-w-md font-sans leading-relaxed">
              Pluck artworks off the moving conveyor belts below to populate your custom museum gallery.
              Watch the ambient wall lighting shift to complement your chosen pieces!
            </p>
          </div>
        ) : canvasMode === 'salon' ? (
          /* SALON WALL GRID MODE: Auto-arranging masonry grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center justify-items-center h-full overflow-y-auto pr-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                  onInspectArtwork(item);
                }}
                className={`relative group cursor-pointer transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${
                  FRAME_CLASSES[item.frameStyle || 'gold']
                }`}
                style={{
                  transform: `rotate(${item.rotation}deg)`,
                }}
              >
                <div className="p-1 bg-stone-950 rounded-xs overflow-hidden">
                  <img
                    src={item.artwork.thumbUrl}
                    alt={item.artwork.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = IMG_PLACEHOLDER;
                    }}
                    className="max-h-48 md:max-h-56 object-contain rounded-xs transition duration-300"
                  />
                </div>

                {/* Hover Quick Overlay */}
                <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-stone-100 rounded-xs text-center">
                  <p className="font-serif text-xs font-semibold truncate text-amber-200">
                    {item.artwork.title}
                  </p>
                  <p className="text-[10px] text-stone-400 font-serif italic truncate">
                    {item.artwork.museum}
                  </p>
                  <div className="flex justify-center space-x-2 pt-1 border-t border-stone-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectArtwork(item);
                      }}
                      className="p-1 bg-amber-900/80 rounded hover:bg-amber-800 text-amber-200"
                      title="Inspect Artwork"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="p-1 bg-red-950/80 rounded hover:bg-red-800 text-red-200"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* FREEFORM MODE: Absolute drag & scale positioning */
          <div className="relative w-full h-full min-h-[450px]">
            {items.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(item.id);
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing transition-shadow duration-300 ${
                    FRAME_CLASSES[item.frameStyle || 'gold']
                  } ${
                    isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 z-40' : ''
                  }`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
                    zIndex: item.zIndex,
                  }}
                >
                  <div className="p-1 bg-stone-950 rounded-xs">
                    <img
                      src={item.artwork.thumbUrl}
                      alt={item.artwork.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = IMG_PLACEHOLDER;
                      }}
                      className="max-h-48 md:max-h-60 object-contain rounded-xs pointer-events-none"
                    />
                  </div>

                  {/* Selected Controls Toolbar */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-stone-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-amber-600/60 shadow-xl text-amber-200 z-50 text-xs whitespace-nowrap"
                    >
                      <button
                        onClick={() => handleRotate(item.id, -15)}
                        className="p-1 hover:bg-stone-800 rounded"
                        title="Rotate Counter-Clockwise"
                      >
                        <RotateCw className="w-3.5 h-3.5 -scale-x-100" />
                      </button>
                      <button
                        onClick={() => handleRotate(item.id, 15)}
                        className="p-1 hover:bg-stone-800 rounded"
                        title="Rotate Clockwise"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleScale(item.id, 1.15)}
                        className="p-1 hover:bg-stone-800 rounded"
                        title="Enlarge"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleScale(item.id, 0.85)}
                        className="p-1 hover:bg-stone-800 rounded"
                        title="Shrink"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleLayer(item.id, 1)}
                        className="p-1 hover:bg-stone-800 rounded"
                        title="Bring Forward"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onInspectArtwork(item)}
                        className="p-1 hover:bg-stone-800 rounded text-amber-400"
                        title="Inspect Artwork Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 hover:bg-red-950 text-red-400 rounded"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
