/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, ComponentOption, GarmentKey, LibraryMode, SelectionState } from '../types';
import { checkCompatibilityReason } from '../data/garments';
import { ChevronUp, X } from 'lucide-react';

interface DesignLibraryProps {
  libraryMode: LibraryMode;
  currentGarment: GarmentKey;
  activeCategory: Category;
  selection: SelectionState;
  onSelectOption: (cat: Category, optId: string) => void;
  onFlashToast: (msg: string) => void;
}

export const DesignLibrary: React.FC<DesignLibraryProps> = ({
  libraryMode,
  currentGarment,
  activeCategory,
  selection,
  onSelectOption,
  onFlashToast,
}) => {
  const [trayOpen, setTrayOpen] = useState(false);
  const selectedOptId = selection[activeCategory.id];
  const activeOpt = activeCategory.opts.find((o) => o.id === selectedOptId) || activeCategory.opts[0];

  const handleCardClick = (opt: ComponentOption) => {
    const reason = checkCompatibilityReason(currentGarment, activeCategory, opt.id, selection);
    if (reason) {
      onFlashToast(reason);
      return;
    }
    onSelectOption(activeCategory, opt.id);
    if (trayOpen) {
      setTrayOpen(false);
    }
  };

  const renderOptionGlyph = (optId: string, name: string, isBig = false) => {
    if (optId === 'peplum') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* Smocked bodice silhouette */}
          <path
            d="M 12 10 Q 20 12 28 10 L 26 23 Q 20 24 14 23 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Smocking shirring lines */}
          <line x1="13" y1="13" x2="27" y2="13" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 1" opacity="0.8" />
          <line x1="13.5" y1="16" x2="26.5" y2="16" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 1" opacity="0.8" />
          <line x1="14" y1="19" x2="26" y2="19" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 1" opacity="0.8" />
          {/* Flared fluted peplum skirtlet */}
          <path
            d="M 14 23 Q 20 24 26 23 C 29 27 33 32 34 34 Q 20 37 6 34 C 7 32 11 27 14 23 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Flute pleat folds */}
          <path d="M 17 24 C 15 28 13 32 12 34" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 20 24 L 20 35" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 23 24 C 25 28 27 32 28 34" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
        </svg>
      );
    }
    return (
      <span className={`font-serif ${isBig ? 'text-[16px]' : 'text-[14px]'} font-bold text-[#174d33]`}>
        {name.charAt(0)}
      </span>
    );
  };

  // 1. CARDS MODE: Horizontal card collection
  if (libraryMode === 'cards') {
    return (
      <div id="design-library-cards" className="flex-none pt-2 pb-3.5 border-t border-[#3c342c]/15 bg-[#fffdf9] z-10">
        {/* Category Header */}
        <div className="flex items-baseline justify-between gap-2 px-3.5 pb-2">
          <h2 className="font-serif text-[17px] font-semibold text-[#2b2724] leading-none">
            {activeCategory.label}
          </h2>
          <span className="text-[9.5px] uppercase tracking-[0.14em] text-[#5a534c] font-sans font-medium">
            {activeCategory.opts.length} options
          </span>
        </div>

        {/* Horizontal Card Carousel */}
        <div className="flex gap-2.5 overflow-x-auto px-3.5 py-1">
          {activeCategory.opts.map((opt) => {
            const isSelected = selectedOptId === opt.id;
            const incompatibleReason = checkCompatibilityReason(currentGarment, activeCategory, opt.id, selection);
            const isUnavailable = Boolean(incompatibleReason);

            return (
              <button
                key={opt.id}
                id={`card-opt-${opt.id}`}
                onClick={() => handleCardClick(opt)}
                className={`flex-none w-[108px] p-1 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f7f4ef] border-[1.5px] border-[#174d33] shadow-xs'
                    : 'border border-[#3c342c]/15 hover:bg-black/5'
                } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {/* Preview Thumbnail Box */}
                <div
                  className={`relative h-[82px] w-full rounded-lg overflow-hidden bg-[#fffdf9] flex flex-col items-center justify-center p-2 border border-black/5 ${
                    isUnavailable ? 'grayscale' : ''
                  }`}
                >
                  {/* Option Badge */}
                  {isSelected && (
                    <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md font-mono text-[8.5px] uppercase tracking-wider bg-[#174d33] text-[#f7f4ef] font-medium shadow-xs">
                      Selected
                    </span>
                  )}
                  {isUnavailable && (
                    <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md font-mono text-[8.5px] uppercase tracking-wider bg-[#b68235] text-[#f7f4ef] font-medium shadow-xs">
                      Locked
                    </span>
                  )}

                  {/* Stylized Visual Icon Representing the cut */}
                  <div className="w-10 h-10 rounded-lg bg-[#5b8f72]/15 border border-[#5b8f72]/30 flex items-center justify-center">
                    {renderOptionGlyph(opt.id, opt.name, true)}
                  </div>
                </div>

                {/* Option Name */}
                <div
                  className={`mt-1.5 text-[11px] text-center truncate font-sans ${
                    isSelected ? 'text-[#174d33] font-semibold' : 'text-[#3d3833]'
                  }`}
                >
                  {opt.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. FILMSTRIP MODE: Edge-to-edge frames
  if (libraryMode === 'filmstrip') {
    return (
      <div id="design-library-filmstrip" className="flex-none pb-2.5 bg-[#fffdf9] border-t border-[#3c342c]/15 z-10">
        <div className="flex items-baseline justify-between px-3.5 py-2">
          <h2 className="font-serif text-[17px] font-semibold text-[#2b2724] leading-none">
            {activeCategory.label}
          </h2>
          <span className="text-[11px] text-[#5a534c] italic font-serif">
            {activeOpt.name}
          </span>
        </div>

        <div className="flex overflow-x-auto border-y border-[#3c342c]/15">
          {activeCategory.opts.map((opt) => {
            const isSelected = selectedOptId === opt.id;
            const incompatibleReason = checkCompatibilityReason(currentGarment, activeCategory, opt.id, selection);
            const isUnavailable = Boolean(incompatibleReason);

            return (
              <button
                key={opt.id}
                id={`filmstrip-opt-${opt.id}`}
                onClick={() => handleCardClick(opt)}
                className={`relative flex-none w-[90px] h-[112px] overflow-hidden border-r border-[#3c342c]/15 transition-all cursor-pointer flex flex-col justify-between p-2 ${
                  isSelected ? 'bg-[#f7f4ef]' : 'bg-[#fffdf9]'
                } ${isUnavailable ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
              >
                {/* Top active marker */}
                <div
                  className={`absolute left-0 right-0 top-0 h-[3px] ${
                    isSelected ? 'bg-[#174d33]' : isUnavailable ? 'bg-[#b68235]' : 'bg-transparent'
                  }`}
                />

                <div className="w-full flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#5b8f72]/15 flex items-center justify-center">
                    {renderOptionGlyph(opt.id, opt.name, false)}
                  </div>
                </div>

                <div
                  className={`text-[10px] text-center truncate w-full ${
                    isSelected ? 'text-[#174d33] font-semibold' : 'text-[#3c342c]'
                  }`}
                >
                  {opt.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. TRAY MODE: Expandable drawer
  return (
    <div id="design-library-tray" className="flex-none bg-[#fffdf9] border-t border-[#3c342c]/15 z-10">
      {/* Collapsed Bar */}
      <div
        onClick={() => setTrayOpen(true)}
        className="p-3 px-3.5 flex items-center gap-3 cursor-pointer hover:bg-black/2 active:bg-black/5"
      >
        <div className="w-[42px] h-[42px] rounded-xl bg-[#f7f4ef] border border-[#3c342c]/15 flex items-center justify-center">
          {renderOptionGlyph(activeOpt.id, activeOpt.name, true)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-[#5a534c] font-sans">
            {activeCategory.label}
          </div>
          <div className="font-serif text-[19px] font-semibold text-[#2b2724] leading-tight truncate">
            {activeOpt.name}
          </div>
        </div>
        <div className="flex items-center gap-1 border border-[#174d33] text-[#174d33] rounded-xl px-3 py-1.5 text-[12px] font-medium">
          <span>Change</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Expanded Modal Bottom Sheet */}
      {trayOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 animate-fade">
          <div className="bg-[#f7f4ef] rounded-t-[26px] p-4 pt-3 border-t border-[#3c342c]/20 shadow-2xl animate-sheet max-h-[75%] flex flex-col">
            {/* Grab Handle */}
            <div className="w-11 h-1 rounded-full bg-black/20 mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-[#3c342c]/15 mb-3">
              <div>
                <span className="text-[9.5px] uppercase tracking-wider text-[#5a534c]">
                  Choose {activeCategory.label}
                </span>
                <h3 className="font-serif text-[20px] font-semibold text-[#2b2724] leading-tight">
                  {activeCategory.label} Collection
                </h3>
              </div>
              <button
                onClick={() => setTrayOpen(false)}
                className="w-8 h-8 rounded-full border border-[#3c342c]/20 flex items-center justify-center text-[#5a534c] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of options */}
            <div className="grid grid-cols-3 gap-2.5 overflow-y-auto pr-1">
              {activeCategory.opts.map((opt) => {
                const isSelected = selectedOptId === opt.id;
                const incompatibleReason = checkCompatibilityReason(currentGarment, activeCategory, opt.id, selection);
                const isUnavailable = Boolean(incompatibleReason);

                return (
                  <button
                    key={opt.id}
                    id={`tray-opt-${opt.id}`}
                    onClick={() => handleCardClick(opt)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? 'bg-white border-[#174d33] shadow-xs ring-1 ring-[#174d33]'
                        : 'bg-[#fffdf9] border-[#3c342c]/15 hover:bg-white'
                    } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#5b8f72]/15 flex items-center justify-center mb-1">
                      {renderOptionGlyph(opt.id, opt.name, false)}
                    </div>
                    <span
                      className={`text-[11px] truncate w-full ${
                        isSelected ? 'text-[#174d33] font-semibold' : 'text-[#2b2724]'
                      }`}
                    >
                      {opt.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] text-[#174d33] font-mono mt-0.5">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
