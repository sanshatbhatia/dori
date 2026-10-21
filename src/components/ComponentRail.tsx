/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category, GarmentKey, RailMode, SelectionState } from '../types';
import { GREEN, INK } from '../data/geometry';
import { GARMENTS } from '../data/garments';

interface ComponentRailProps {
  railMode: RailMode;
  currentGarment: GarmentKey;
  categories: Category[];
  activeCategoryIndex: number;
  onSelectCategoryIndex: (index: number) => void;
  selection: SelectionState;
  /** Categories that can't be used with the current design: shown greyed out with a slash */
  unavailableIds?: string[];
}

export const ComponentRail: React.FC<ComponentRailProps> = ({
  railMode,
  currentGarment,
  categories,
  activeCategoryIndex,
  onSelectCategoryIndex,
  selection,
  unavailableIds = [],
}) => {
  const off = (id: string) => unavailableIds.includes(id);
  // diagonal slash drawn across an unavailable category's glyph
  const slash = (
    <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <span className="block w-[130%] h-[1.5px] bg-[#5a534c]/60 rotate-[-45deg]" />
    </span>
  );
  const g = GARMENTS[currentGarment];

  // Circles Mode: Floating on left edge of canvas
  if (railMode === 'circles') {
    return (
      <div
        id="component-rail-circles"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 max-h-[calc(100%-40px)] overflow-y-auto flex flex-col gap-1.5 p-1.5 rounded-[22px] bg-[#eae9e9]/75 backdrop-blur-md border border-[#3c342c]/15 shadow-md z-20"
      >
        {categories.map((c, i) => {
          const isSelected = i === activeCategoryIndex;
          const currentOpt = c.opts.find((o) => o.id === selection[c.id]) || c.opts[0];

          return (
            <button
              key={c.id}
              id={`rail-cat-${c.id}`}
              onClick={() => onSelectCategoryIndex(i)}
              title={off(c.id) ? `${c.label} isn't available with this design` : undefined}
              aria-disabled={off(c.id)}
              className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[48px] justify-center transition-opacity ${
                off(c.id) ? 'opacity-35 cursor-not-allowed' : isSelected ? 'opacity-100 cursor-pointer' : 'opacity-70 hover:opacity-90 cursor-pointer'
              }`}
            >
              <div
                className={`relative w-[36px] h-[36px] rounded-full overflow-hidden bg-[#f7f4ef] flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-[1.5px] border-[#174d33] scale-105 shadow-sm ring-2 ring-[#174d33]/20'
                    : 'border border-[#3c342c]/15'
                }`}
              >
                {/* Abstract visual glyph */}
                <span className="font-serif text-[13px] font-bold text-[#174d33]">
                  {c.short.slice(0, 2)}
                </span>
                {off(c.id) && slash}
              </div>
              <span
                className={`text-[9px] uppercase tracking-tight truncate max-w-[42px] font-sans ${
                  isSelected ? 'text-[#174d33] font-bold' : 'text-[#5a534c]'
                }`}
              >
                {c.short}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Labelled Mode: Horizontal strip showing category label and current selected option
  if (railMode === 'labelled') {
    return (
      <div
        id="component-rail-labelled"
        className="flex-none flex gap-2 px-3 py-2 overflow-x-auto border-t border-[#3c342c]/15 bg-[#fffdf9] z-20"
      >
        {categories.map((c, i) => {
          const isSelected = i === activeCategoryIndex;
          const currentOpt = c.opts.find((o) => o.id === selection[c.id]) || c.opts[0];

          return (
            <button
              key={c.id}
              id={`rail-labelled-${c.id}`}
              onClick={() => onSelectCategoryIndex(i)}
              aria-disabled={off(c.id)}
              className={`flex-none flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                off(c.id)
                  ? 'opacity-40 cursor-not-allowed border-[#3c342c]/15'
                  : isSelected
                  ? 'bg-[#f7f4ef] border-[#174d33] shadow-xs cursor-pointer'
                  : 'border-[#3c342c]/15 hover:bg-black/5 cursor-pointer'
              }`}
            >
              <div className="w-[30px] h-[30px] rounded-lg bg-[#f7f4ef] border border-[#3c342c]/15 flex items-center justify-center font-serif text-[12px] font-semibold text-[#174d33]">
                {c.short.slice(0, 2)}
              </div>
              <div className="text-left min-w-0">
                <div
                  className={`text-[11.5px] font-medium leading-tight whitespace-nowrap ${
                    isSelected ? 'text-[#174d33]' : 'text-[#2b2724]'
                  }`}
                >
                  {c.label}
                </div>
                <div className="text-[10px] text-[#5a534c] leading-tight truncate max-w-[85px]">
                  {off(c.id) ? 'Not with jacket' : currentOpt.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Arc Mode: Radial thumb arc positioning
  return (
    <div
      id="component-rail-arc"
      className="absolute right-2 bottom-3 w-[240px] h-[240px] pointer-events-none z-20"
    >
      <div className="absolute left-[30px] top-[30px] w-[320px] h-[320px] rounded-full border border-[#3c342c]/10" />
      {categories.map((c, i) => {
        const isSelected = i === activeCategoryIndex;
        const total = categories.length;
        const ang = -0.17 + 1.92 * (i / (total - 1));
        const R = 158;
        const ax = 205 - R * Math.cos(ang) - 23;
        const ay = 205 - R * Math.sin(ang) - 23;

        return (
          <div
            key={c.id}
            className={`absolute pointer-events-auto transition-transform duration-300 ${off(c.id) ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              left: `${ax}px`,
              top: `${ay}px`,
              width: '44px',
              height: '44px',
            }}
            onClick={() => onSelectCategoryIndex(i)}
          >
            <div
              className={`relative w-[34px] h-[34px] rounded-full overflow-hidden bg-[#f7f4ef] flex items-center justify-center border transition-all ${
                isSelected
                  ? 'border-[1.5px] border-[#174d33] scale-110 shadow-md ring-2 ring-[#174d33]/20'
                  : 'border-[#3c342c]/20 hover:scale-105'
              }`}
            >
              <span className="font-serif text-[12px] font-bold text-[#174d33]">
                {c.short.slice(0, 2)}
              </span>
              {off(c.id) && slash}
            </div>
          </div>
        );
      })}
    </div>
  );
};
