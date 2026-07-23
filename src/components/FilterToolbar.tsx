import React from 'react';
import { FilterOptions } from '../types';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

interface FilterToolbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  allMuseums: string[];
  onReset: () => void;
  onRefreshBelts: () => void;
  soundEnabled: boolean;
  onClose: () => void;
}

const MEDIUMS = [
  { id: 'all', label: 'All Mediums' },
  { id: 'painting', label: 'Paintings' },
  { id: 'sculpture', label: 'Sculptures' },
  { id: 'print', label: 'Prints & Ukiyo-e' },
  { id: 'antiquity', label: 'Antiquities' },
  { id: 'textile', label: 'Textiles' },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  setFilters,
  allMuseums,
  onReset,
  onRefreshBelts,
  soundEnabled,
  onClose,
}) => {
  return (
    <div className="bg-stone-900/95 border-b border-amber-900/40 p-3.5 px-4 md:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-200 shadow-md animate-fadeIn">
      {/* Left: Search & Museum Selector */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="Search title, artist, or museum..."
            className="w-full bg-stone-950 border border-stone-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Museum Select */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
          <select
            value={filters.museum}
            onChange={(e) => {
              if (soundEnabled) playClickSound();
              setFilters((prev) => ({ ...prev, museum: e.target.value }));
            }}
            className="bg-stone-950 border border-stone-800 text-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 max-w-[180px]"
          >
            <option value="all">All Museums ({allMuseums.length})</option>
            {allMuseums.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle: Medium Chips */}
      <div className="flex items-center space-x-1 overflow-x-auto py-1">
        {MEDIUMS.map((med) => (
          <button
            key={med.id}
            onClick={() => {
              if (soundEnabled) playClickSound();
              setFilters((prev) => ({ ...prev, medium: med.id }));
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition ${
              filters.medium === med.id
                ? 'bg-amber-900/70 text-amber-200 border border-amber-700/60 font-semibold'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800/80'
            }`}
          >
            {med.label}
          </button>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onRefreshBelts();
          }}
          className="px-2.5 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs flex items-center gap-1.5 transition border border-stone-700"
          title="Restock Conveyor Belt Delivery"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restock Belts</span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onReset();
          }}
          className="text-stone-400 hover:text-stone-200 text-[11px] underline px-1"
        >
          Reset
        </button>

        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            onClose();
          }}
          className="p-1 rounded text-stone-500 hover:text-stone-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
