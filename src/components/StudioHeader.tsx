/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, RotateCw, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { GarmentKey } from '../types';
import { GARMENTS } from '../data/garments';

interface StudioHeaderProps {
  currentGarment: GarmentKey;
  onSelectGarment: (g: GarmentKey) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleMenu: () => void;
  onOpenHint?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentGarment,
  onSelectGarment,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleMenu,
  onOpenHint,
}) => {
  const garmentConfig = GARMENTS[currentGarment];

  return (
    <div className="flex-none bg-[#f7f4ef] z-20">
      {/* Top Action Bar */}
      <div className="h-[52px] px-3.5 flex items-center gap-2 border-b border-[#3c342c]/15">
        {/* Back / Studio Guide button */}
        <button
          id="header-back-btn"
          onClick={onOpenHint}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2b2724] hover:bg-[#3c342c]/5 active:scale-95 transition-transform cursor-pointer"
          title="Studio Guide & Tips"
          aria-label="Studio Guide"
        >
          <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* Garment Title & Atelier Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="font-serif text-[19px] font-semibold text-[#2b2724] leading-tight truncate">
            {garmentConfig.name} Atelier
          </h1>
          <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#5a534c] font-sans font-medium">
            Bespoke Customizer · Size XL
          </span>
        </div>

        {/* Undo Button */}
        <button
          id="header-undo-btn"
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
            canUndo
              ? 'border-[#3c342c]/20 text-[#2b2724] hover:bg-[#3c342c]/5 active:scale-95'
              : 'border-[#3c342c]/10 text-[#3c342c]/30 cursor-not-allowed'
          }`}
          title="Undo"
          aria-label="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Redo Button */}
        <button
          id="header-redo-btn"
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
            canRedo
              ? 'border-[#3c342c]/20 text-[#2b2724] hover:bg-[#3c342c]/5 active:scale-95'
              : 'border-[#3c342c]/10 text-[#3c342c]/30 cursor-not-allowed'
          }`}
          title="Redo"
          aria-label="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Menu Options Button */}
        <button
          id="header-menu-btn"
          onClick={onToggleMenu}
          className="w-9 h-9 rounded-xl border border-[#3c342c]/20 flex items-center justify-center text-[#2b2724] hover:bg-[#3c342c]/5 active:scale-95 transition-all"
          title="Options"
          aria-label="Studio Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Garment Selector Strip (shown only if multiple garments available) */}
      {Object.keys(GARMENTS).length > 1 && (
        <div className="flex gap-2 px-3.5 py-2 overflow-x-auto border-b border-[#3c342c]/10 bg-[#f7f4ef]">
          {(Object.keys(GARMENTS) as GarmentKey[]).map((key) => {
            const isSelected = key === currentGarment;
            return (
              <button
                key={key}
                id={`garment-tab-${key}`}
                onClick={() => onSelectGarment(key)}
                className={`flex-none px-3.5 py-1.5 rounded-xl text-[12px] font-sans transition-all cursor-pointer ${
                  isSelected
                    ? 'border border-[#174d33] text-[#174d33] bg-[#174d33]/8 font-semibold shadow-xs'
                    : 'border border-[#3c342c]/15 text-[#5a534c] hover:bg-black/5'
                }`}
              >
                {GARMENTS[key].name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
