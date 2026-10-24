/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArmPose, LibraryMode, RailMode, ViewMode, BeltLatkanMode, LatkanBoxOrientation } from '../types';
import {
  Eye,
  Camera,
  Sliders,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Layers,
  LayoutGrid,
  ArrowUpDown,
  ArrowLeftRight,
} from 'lucide-react';

interface StudioSettingsBarProps {
  viewMode: ViewMode;
  onSetViewMode: (v: ViewMode) => void;
  armPose: ArmPose;
  onSetArmPose: (p: ArmPose) => void;
  railMode: RailMode;
  onRailChange: (r: RailMode) => void;
  libraryMode: LibraryMode;
  onLibChange: (l: LibraryMode) => void;
  beltLatkan?: BeltLatkanMode;
  onSetBeltLatkan?: (b: BeltLatkanMode) => void;
  latkanBoxOrientation?: LatkanBoxOrientation;
  onSetLatkanBoxOrientation?: (o: LatkanBoxOrientation) => void;
  onResetFocus: () => void;
  onOpenSummary?: () => void;
  className?: string;
}

export const StudioSettingsBar: React.FC<StudioSettingsBarProps> = ({
  viewMode,
  onSetViewMode,
  armPose,
  onSetArmPose,
  railMode,
  onRailChange,
  libraryMode,
  onLibChange,
  beltLatkan = 'heavy',
  onSetBeltLatkan,
  latkanBoxOrientation = 'horizontal',
  onSetLatkanBoxOrientation,
  onResetFocus,
  onOpenSummary,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      id="studio-settings-bar"
      aria-label="Studio Controls"
      className={`relative transition-all duration-300 select-none ${
        isCollapsed ? 'w-11' : 'w-[220px]'
      } ${className}`}
    >
      <div className="rounded-2xl border border-[#000000]/20 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_12px_32px_rgba(43,39,36,0.12)] p-2.5 flex flex-col gap-2.5">
        {/* Header with Collapse / Expand Toggle */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#000000]/10">
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Sliders className="w-3.5 h-3.5 text-[#174d33] flex-none" />
              <span className="font-serif text-[13px] font-semibold text-[#000000] truncate">
                Settings
              </span>
            </div>
          )}
          <button
            id="toggle-settings-bar-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Settings' : 'Collapse Settings'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-black/60 hover:bg-[#000000]/5 hover:text-[#000000] active:scale-95 transition-all mx-auto"
            aria-label={isCollapsed ? 'Expand Settings' : 'Collapse Settings'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-[#174d33]" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Collapsed Icon Strip */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            {/* View Mode Icon Indicator */}
            <button
              id="collapsed-view-toggle"
              onClick={() => {
                const modes: ViewMode[] = ['front', 'detail', 'back'];
                const nextIdx = (modes.indexOf(viewMode) + 1) % modes.length;
                onSetViewMode(modes[nextIdx]);
              }}
              title={`View: ${viewMode} (Click to toggle)`}
              className="w-8 h-8 rounded-xl bg-[#174d33]/10 text-[#174d33] flex items-center justify-center text-[10px] font-bold uppercase hover:bg-[#174d33]/20 transition-colors"
            >
              {viewMode[0]}
            </button>

            {/* Arm Pose Icon Indicator */}
            <button
              id="collapsed-pose-toggle"
              onClick={() => onSetArmPose(armPose === 'resting' ? 'stretched' : 'resting')}
              title={`Pose: ${armPose} (Click to toggle)`}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                armPose === 'stretched'
                  ? 'bg-[#174d33] text-white shadow-xs'
                  : 'bg-[#000000]/5 text-black/60 hover:bg-[#000000]/10'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {armPose === 'stretched' ? (
                  <>
                    <path d="M4 12h16" />
                    <path d="M12 4v8" />
                    <path d="M7 16l-3-4 3-4" />
                    <path d="M17 8l3 4-3 4" />
                  </>
                ) : (
                  <>
                    <path d="M12 4v3" />
                    <path d="M8 10v10" />
                    <path d="M16 10v10" />
                  </>
                )}
              </svg>
            </button>

            {/* Belt Latkan Quick Cycle */}
            {onSetBeltLatkan && (
              <button
                id="collapsed-latkan-toggle"
                onClick={() => {
                  const cur = beltLatkan ?? 'heavy';
                  const nextMode: BeltLatkanMode = cur === 'none' ? 'light' : cur === 'light' ? 'heavy' : 'none';
                  onSetBeltLatkan(nextMode);
                }}
                title={`Belt (Latkan): ${beltLatkan === 'none' ? 'No Belt' : `${beltLatkan} size`} (Click to cycle)`}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  beltLatkan !== 'none'
                    ? 'bg-[#174d33] text-white shadow-xs'
                    : 'bg-[#000000]/5 text-black/60 hover:bg-[#000000]/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Reset Camera Focus */}
            <button
              id="collapsed-focus-reset"
              onClick={onResetFocus}
              title="Reset Camera Focus"
              className="w-8 h-8 rounded-xl bg-[#000000]/5 text-black/60 hover:text-[#000000] hover:bg-[#000000]/10 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded Full Settings Controls */
          <div className="flex flex-col gap-3">
            {/* 1. View Angle / Mode */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-sans font-semibold tracking-wider text-black/60">
                <Eye className="w-3 h-3 text-[#174d33]" />
                <span>View Angle</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1 bg-[#000000]/5 border border-[#000000]/10">
                {(['front', 'detail', 'back'] as ViewMode[]).map((mode) => {
                  const isActive = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      id={`setting-view-${mode}`}
                      onClick={() => onSetViewMode(mode)}
                      className={`py-1 text-[10px] uppercase tracking-wider rounded-lg font-sans font-medium transition-all ${
                        isActive
                          ? 'bg-[#174d33] text-white shadow-xs'
                          : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Arm Pose Switcher (Resting vs. Stretched with Gravity Drape) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-sans font-semibold tracking-wider text-black/60">
                <span>Arm Pose</span>
                <span className="font-mono text-[8.5px] text-[#174d33] lowercase">
                  {armPose === 'stretched' ? 'gravity active' : 'natural'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-[#000000]/5 border border-[#000000]/10">
                <button
                  id="setting-pose-resting"
                  onClick={() => onSetArmPose('resting')}
                  className={`py-1.5 px-2 text-[10px] uppercase tracking-wider rounded-lg font-sans font-medium flex items-center justify-center gap-1 transition-all ${
                    armPose === 'resting'
                      ? 'bg-[#174d33] text-white shadow-xs'
                      : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                  }`}
                >
                  <svg className="w-3 h-3 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v3" />
                    <path d="M8 10v10" />
                    <path d="M16 10v10" />
                  </svg>
                  <span>Resting</span>
                </button>

                <button
                  id="setting-pose-stretched"
                  onClick={() => onSetArmPose('stretched')}
                  className={`py-1.5 px-2 text-[10px] uppercase tracking-wider rounded-lg font-sans font-medium flex items-center justify-center gap-1 transition-all ${
                    armPose === 'stretched'
                      ? 'bg-[#174d33] text-white shadow-xs'
                      : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                  }`}
                >
                  <svg className="w-3 h-3 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16" />
                    <path d="M12 4v8" />
                  </svg>
                  <span>Stretch</span>
                </button>
              </div>
            </div>

            {/* 3. Component Rail Layout */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-sans font-semibold tracking-wider text-black/60">
                <Layers className="w-3 h-3 text-[#174d33]" />
                <span>Slot Rail</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1 bg-[#000000]/5 border border-[#000000]/10">
                {(['circles', 'labelled', 'arc'] as const).map((r) => {
                  const isActive = railMode === r;
                  return (
                    <button
                      key={r}
                      id={`setting-rail-${r}`}
                      onClick={() => onRailChange(r)}
                      className={`py-1 text-[10px] capitalize rounded-lg font-sans font-medium transition-all ${
                        isActive
                          ? 'bg-[#174d33] text-white shadow-xs'
                          : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Library Layout */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-sans font-semibold tracking-wider text-black/60">
                <LayoutGrid className="w-3 h-3 text-[#174d33]" />
                <span>Library</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1 bg-[#000000]/5 border border-[#000000]/10">
                {(['cards', 'filmstrip', 'tray'] as const).map((l) => {
                  const isActive = libraryMode === l;
                  return (
                    <button
                      key={l}
                      id={`setting-lib-${l}`}
                      onClick={() => onLibChange(l)}
                      className={`py-1 text-[10px] capitalize rounded-lg font-sans font-medium transition-all ${
                        isActive
                          ? 'bg-[#174d33] text-white shadow-xs'
                          : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Belt & Latkan Customization */}
            {onSetBeltLatkan && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-sans font-semibold tracking-wider text-black/60">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#174d33]" />
                    <span>Belt (Latkan)</span>
                  </div>
                  <span className="font-mono text-[8.5px] text-[#174d33] capitalize">
                    {beltLatkan === 'none' ? 'off' : beltLatkan}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl p-1 bg-[#000000]/5 border border-[#000000]/10">
                  {(['none', 'light', 'heavy'] as BeltLatkanMode[]).map((mode) => {
                    const isActive = beltLatkan === mode;
                    return (
                      <button
                        key={mode}
                        id={`setting-belt-latkan-${mode}`}
                        onClick={() => onSetBeltLatkan(mode)}
                        className={`py-1 text-[10px] capitalize rounded-lg font-sans font-medium transition-all ${
                          isActive
                            ? 'bg-[#174d33] text-white shadow-xs'
                            : 'text-black/60 hover:text-[#000000] hover:bg-white/60'
                        }`}
                      >
                        {mode === 'none' ? 'None' : mode}
                      </button>
                    );
                  })}
                </div>
                {/* Floating Box Orientation Switcher */}
                {onSetLatkanBoxOrientation && (
                  <div className="flex items-center justify-between pt-0.5 px-0.5 text-[9px] text-black/60">
                    <span>Stage Box:</span>
                    <div className="flex rounded-md overflow-hidden border border-[#000000]/15 bg-white/50">
                      <button
                        onClick={() => onSetLatkanBoxOrientation('horizontal')}
                        className={`px-1.5 py-0.5 text-[8.5px] capitalize font-sans flex items-center gap-0.5 ${
                          latkanBoxOrientation === 'horizontal'
                            ? 'bg-[#174d33] text-white font-medium'
                            : 'hover:bg-black/5'
                        }`}
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>Horiz</span>
                      </button>
                      <button
                        onClick={() => onSetLatkanBoxOrientation('vertical')}
                        className={`px-1.5 py-0.5 text-[8.5px] capitalize font-sans flex items-center gap-0.5 ${
                          latkanBoxOrientation === 'vertical'
                            ? 'bg-[#174d33] text-white font-medium'
                            : 'hover:bg-black/5'
                        }`}
                      >
                        <ArrowUpDown className="w-2.5 h-2.5" />
                        <span>Vert</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Utility & Summary Quick Actions */}
            <div className="pt-1.5 border-t border-[#000000]/10 flex items-center justify-between gap-1.5">
              <button
                id="setting-reset-focus-btn"
                onClick={onResetFocus}
                title="Center camera on current seam"
                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border border-[#000000]/15 text-[10px] text-black/60 hover:text-[#000000] hover:bg-[#000000]/5 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Center</span>
              </button>

              {onOpenSummary && (
                <button
                  id="setting-open-summary-btn"
                  onClick={onOpenSummary}
                  title="View Studio Design Portfolio"
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-[#174d33]/15 border border-[#174d33]/30 text-[10px] font-medium text-[#174d33] hover:bg-[#174d33]/25 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-[#174d33]" />
                  <span>Portfolio</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
