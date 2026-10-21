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
          {/* Fitted bodice with a crew neck and princess darts */}
          <path
            d="M 14 9 Q 20 12 26 9 L 28 11 L 26.5 23 Q 20 24 13.5 23 L 12 11 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M 16.5 14 Q 16.8 19 17 23" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.7" />
          <path d="M 23.5 14 Q 23.2 19 23 23" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.7" />
          {/* Pleated peplum flaring from the natural waist */}
          <path
            d="M 13.5 23 Q 20 24 26.5 23 C 29 27 32 31 33.5 34 Q 20 36.5 6.5 34 C 8 31 11 27 13.5 23 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Inverted box pleats */}
          <path d="M 17 23.6 L 14.5 35" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 23 23.6 L 25.5 35" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 14.5 23.4 L 9.5 34.2" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.55" />
          <path d="M 25.5 23.4 L 30.5 34.2" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.55" />
        </svg>
      );
    }
    if (optId === 'halter') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* High-neck halter: mock collar, armholes cut in to the neck */}
          <path
            d="M 16.5 5 L 23.5 5 L 23.5 9 L 29 18 L 28.5 32 L 11.5 32 L 11 18 L 16.5 9 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M 16.5 9 Q 20 10.5 23.5 9" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
          <path d="M 14 17 L 26 29 M 26 17 L 14 29 M 13 23 L 19 17 M 27 23 L 21 17 M 13 23 L 19 29 M 27 23 L 21 29" stroke="#b68235" strokeWidth="0.6" opacity="0.8" />
        </svg>
      );
    }
    if (optId === 'vneck') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* Strapped bodice with a deep V neckline */}
          <path
            d="M 11 7 L 15 7 L 20 22 L 25 7 L 29 7 L 30 14 L 28.5 32 L 11.5 32 L 10 14 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M 15 7.5 L 20 22 L 25 7.5" fill="none" stroke="#b68235" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 16 23 Q 16.5 27 16.5 31.5 M 24 23 Q 23.5 27 23.5 31.5" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
        </svg>
      );
    }
    if (optId === 'sweetheart') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* Strapped bodice with a sweetheart neckline */}
          <path
            d="M 11 7 L 15 7 Q 15.5 15 20 21 Q 24.5 15 25 7 L 29 7 L 30 14 L 28.5 32 L 11.5 32 L 10 14 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M 15 7.5 Q 15.5 15 20 21 Q 24.5 15 25 7.5" fill="none" stroke="#b68235" strokeWidth="1" />
          <path d="M 16 23 Q 16.5 27 16.5 31.5 M 24 23 Q 23.5 27 23.5 31.5" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
        </svg>
      );
    }
    if (optId === 'jacket') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* Cropped choli with an embroidered hem band */}
          <path d="M 15 11 Q 20 15 25 11 L 25.5 21 L 14.5 21 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 14.5 19 L 25.5 19" stroke="#b68235" strokeWidth="1.4" />
          {/* Open jacket with gold-bordered front edges and sleeves */}
          <path d="M 15 10 L 11 10.5 L 5 22 L 9 24 L 11.5 19 L 11 33 L 17 33 L 16 18 Z" fill="#f4ede4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M 25 10 L 29 10.5 L 35 22 L 31 24 L 28.5 19 L 29 33 L 23 33 L 24 18 Z" fill="#f4ede4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M 15.3 10.5 L 16.3 18 L 17 32.5" stroke="#b68235" strokeWidth="1.2" fill="none" />
          <path d="M 24.7 10.5 L 23.7 18 L 23 32.5" stroke="#b68235" strokeWidth="1.2" fill="none" />
          <path d="M 11.3 32.4 L 16.8 32.4 M 23.2 32.4 L 28.7 32.4" stroke="#b68235" strokeWidth="1.2" />
        </svg>
      );
    }
    if (optId === 'corset') {
      return (
        <svg viewBox="0 0 40 40" className={`${isBig ? 'w-8 h-8' : 'w-7 h-7'} text-[#174d33]`}>
          {/* Square-neck boned bodice with straps and a pointed hem */}
          <path
            d="M 12 7 L 15 7 L 15 13 L 25 13 L 25 7 L 28 7 L 28.5 14 L 27 23 L 27.5 27 Q 24 29 20 33 Q 16 29 12.5 27 L 13 23 L 11.5 14 Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Topstitched boning seams */}
          <path d="M 18 13.5 Q 18 24 19 31.5" stroke="#b68235" strokeWidth="0.8" strokeDasharray="1.4 0.9" fill="none" />
          <path d="M 22 13.5 Q 22 24 21 31.5" stroke="#b68235" strokeWidth="0.8" strokeDasharray="1.4 0.9" fill="none" />
          <path d="M 15 14 Q 15.5 23 16.5 29" stroke="#b68235" strokeWidth="0.8" strokeDasharray="1.4 0.9" fill="none" />
          <path d="M 25 14 Q 24.5 23 23.5 29" stroke="#b68235" strokeWidth="0.8" strokeDasharray="1.4 0.9" fill="none" />
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
