import React from 'react';
import { CanvasMode, ExhibitionMeta } from '../types';
import {
  Sparkles,
  Volume2,
  VolumeX,
  LayoutGrid,
  Move,
  Trash2,
  Trophy,
  Info,
  Sliders
} from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

interface HeaderProps {
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;
  canvasItemCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  exhibitionMeta: ExhibitionMeta;
  onOpenExhibitionInfo: () => void;
  onFinishExhibition: () => void;
  onClearCanvas: () => void;
  onToggleFilterDrawer: () => void;
  isFilterOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  canvasMode,
  setCanvasMode,
  canvasItemCount,
  soundEnabled,
  setSoundEnabled,
  exhibitionMeta,
  onOpenExhibitionInfo,
  onFinishExhibition,
  onClearCanvas,
  onToggleFilterDrawer,
  isFilterOpen,
}) => {
  return (
    <header className="relative z-30 h-16 bg-stone-950/90 backdrop-blur-md border-b border-amber-900/30 px-4 md:px-6 flex items-center justify-between shadow-2xl text-stone-200 select-none">
      {/* Brand & Plaque Summary */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5 bg-gradient-to-r from-amber-950/80 to-stone-900/80 px-3.5 py-1.5 rounded-lg border border-amber-700/40 shadow-inner">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-stone-950 font-serif font-bold text-sm shadow">
            CB
          </div>
          <div>
            <h1 className="font-serif text-base font-semibold text-amber-100 tracking-wide leading-none flex items-center gap-1.5">
              Curator’s Belt
              <span className="text-[10px] uppercase font-sans tracking-widest px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                Gallery
              </span>
            </h1>
            <p className="text-[11px] text-amber-300/70 font-sans mt-0.5 font-light">
              {exhibitionMeta.title} ({canvasItemCount} {canvasItemCount === 1 ? 'Piece' : 'Pieces'})
            </p>
          </div>
        </div>

        {/* Info & Metadata trigger */}
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onOpenExhibitionInfo();
          }}
          className="p-2 rounded-md hover:bg-stone-800/80 text-amber-200/70 hover:text-amber-100 transition border border-transparent hover:border-amber-800/40 flex items-center gap-1 text-xs"
          title="Exhibition Plaque Details"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">Plaque</span>
        </button>
      </div>

      {/* Center Layout Mode Switcher */}
      <div className="hidden md:flex items-center bg-stone-900/90 p-1 rounded-lg border border-stone-800 shadow-inner">
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            setCanvasMode('salon');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            canvasMode === 'salon'
              ? 'bg-amber-900/70 text-amber-100 border border-amber-700/60 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Salon Wall</span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            setCanvasMode('freeform');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            canvasMode === 'freeform'
              ? 'bg-amber-900/70 text-amber-100 border border-amber-700/60 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Freeform Canvas</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Filter Drawer Toggle */}
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onToggleFilterDrawer();
          }}
          className={`p-2 rounded-md transition text-xs flex items-center gap-1.5 border ${
            isFilterOpen
              ? 'bg-amber-900/60 text-amber-200 border-amber-700/60'
              : 'bg-stone-900/80 text-stone-300 hover:text-white border-stone-800 hover:border-amber-800/50'
          }`}
          title="Filter Museum Belts"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Filters</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playClickSound();
          }}
          className="p-2 rounded-md bg-stone-900/80 hover:bg-stone-800/80 text-stone-300 hover:text-amber-200 transition border border-stone-800"
          title={soundEnabled ? 'Mute Gallery Sounds' : 'Enable Gallery Sounds'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {/* Clear Canvas */}
        {canvasItemCount > 0 && (
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              onClearCanvas();
            }}
            className="p-2 rounded-md bg-stone-900/80 hover:bg-red-950/60 text-stone-400 hover:text-red-300 transition border border-stone-800 hover:border-red-900/50"
            title="Clear Gallery Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Finish & Export Exhibition */}
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onFinishExhibition();
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-serif font-semibold text-xs px-3.5 py-2 rounded-md shadow-lg shadow-amber-900/30 transition transform hover:scale-105 active:scale-95"
        >
          <Trophy className="w-4 h-4" />
          <span>Finish Exhibition</span>
        </button>
      </div>
    </header>
  );
};
