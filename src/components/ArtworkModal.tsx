import React from 'react';
import { Artwork, FrameStyle } from '../types';
import { ExternalLink, X, Palette, BookOpen, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

const PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23292620' width='200' height='200'/%3E%3Ctext fill='%2399927a' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='serif' font-size='14'%3EImage Unavailable%3C/text%3E%3C/svg%3E";

interface ArtworkModalProps {
  artwork: Artwork | null;
  currentFrameStyle?: FrameStyle;
  onClose: () => void;
  onFrameChange?: (style: FrameStyle) => void;
  onRemoveFromCanvas?: () => void;
  soundEnabled: boolean;
}

const FRAME_OPTIONS: { id: FrameStyle; label: string; bg: string }[] = [
  { id: 'gold', label: 'Gilded Gold', bg: 'border-amber-500 bg-amber-950/40 text-amber-200' },
  { id: 'oak', label: 'Natural Oak', bg: 'border-yellow-700 bg-amber-900/40 text-amber-100' },
  { id: 'gallery-dark', label: 'Gallery Black', bg: 'border-stone-700 bg-stone-900 text-stone-200' },
  { id: 'float-white', label: 'Minimal Float', bg: 'border-stone-300 bg-stone-100 text-stone-900' },
  { id: 'ornate', label: 'Baroque Ornate', bg: 'border-yellow-600 bg-yellow-950/60 text-yellow-300' },
  { id: 'acrylic-glass', label: 'Acrylic Glass', bg: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200' },
  { id: 'none', label: 'Frameless', bg: 'border-stone-800 bg-stone-900 text-stone-400' },
];

export const ArtworkModal: React.FC<ArtworkModalProps> = ({
  artwork,
  currentFrameStyle = 'gold',
  onClose,
  onFrameChange,
  onRemoveFromCanvas,
  soundEnabled,
}) => {
  if (!artwork) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border border-amber-900/50 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-stone-200">
        {/* Close Button */}
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onClose();
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-stone-950/70 hover:bg-red-900/80 text-stone-300 hover:text-white transition shadow border border-stone-800"
          title="Close Inspection"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Artwork High Res View */}
        <div className="md:w-1/2 bg-stone-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-800 relative min-h-[300px]">
          <div className="relative max-h-[60vh] max-w-full flex items-center justify-center group">
            <img
              src={artwork.fullUrl || artwork.thumbUrl}
              alt={artwork.title}
              className="max-h-[55vh] max-w-full object-contain rounded shadow-2xl border-4 border-stone-800 transition duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_SRC;
              }}
            />
          </div>
          <span className="mt-3 text-[11px] text-stone-500 font-mono flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Aspect Ratio: {artwork.aspectRatio} | 1200px Commons CDN
          </span>
        </div>

        {/* Right: Artwork Details & Controls */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-widest text-amber-500 font-semibold mb-1">
                {artwork.museum}
              </div>
              <h2 className="font-serif text-2xl font-bold text-amber-100 leading-tight">
                {artwork.title}
              </h2>
              <p className="text-sm text-stone-400 font-serif italic mt-1">
                {artwork.artist || 'Unknown Artist'} {artwork.date ? `(${artwork.date})` : ''}
              </p>
            </div>

            {/* Medium & License Tags */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700 capitalize">
                {artwork.medium}
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {artwork.license}
              </span>
            </div>

            {/* Wiki Caption */}
            <div className="bg-stone-950/70 p-4 rounded-lg border border-stone-800 text-sm text-stone-300 leading-relaxed font-sans">
              <p>{artwork.caption}</p>
            </div>

            {/* Color Swatches */}
            {artwork.colors && artwork.colors.length > 0 && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1 mb-2">
                  <Palette className="w-3.5 h-3.5 text-amber-400" /> Dominant Palette
                </label>
                <div className="flex space-x-2">
                  {artwork.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border border-stone-700 shadow"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Frame Customizer if on canvas */}
            {onFrameChange && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-stone-400 block mb-2">
                  Gallery Frame Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (soundEnabled) playClickSound();
                        onFrameChange(opt.id);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded border transition text-left flex items-center justify-between ${
                        currentFrameStyle === opt.id
                          ? 'border-amber-400 bg-amber-900/60 text-amber-100 font-semibold ring-1 ring-amber-400'
                          : opt.bg + ' hover:opacity-90'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {currentFrameStyle === opt.id && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
            <a
              href={artwork.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-medium transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Wikipedia Entry</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            {onRemoveFromCanvas && (
              <button
                onClick={() => {
                  if (soundEnabled) playClickSound();
                  onRemoveFromCanvas();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-medium transition border border-red-800"
              >
                Remove from Gallery
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
