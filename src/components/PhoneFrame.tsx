/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArmPose, GarmentKey, LibraryMode, RailMode, ViewMode, BeltLatkanMode, LatkanBoxOrientation } from '../types';
import { StudioSettingsBar } from './StudioSettingsBar';
import { Sparkles, Scissors, Shirt, Ruler } from 'lucide-react';
import { GARMENTS } from '../data/garments';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeRail?: RailMode;
  activeLib?: LibraryMode;
  onRailChange?: (r: RailMode) => void;
  onLibChange?: (l: LibraryMode) => void;
  viewMode?: ViewMode;
  onSetViewMode?: (v: ViewMode) => void;
  armPose?: ArmPose;
  onSetArmPose?: (p: ArmPose) => void;
  beltLatkan?: BeltLatkanMode;
  onSetBeltLatkan?: (b: BeltLatkanMode) => void;
  latkanBoxOrientation?: LatkanBoxOrientation;
  onSetLatkanBoxOrientation?: (o: LatkanBoxOrientation) => void;
  onResetFocus?: () => void;
  onOpenSummary?: () => void;
  currentGarment?: GarmentKey;
  onSelectGarment?: (g: GarmentKey) => void;
  activeCategoryLabel?: string;
  selectedOptionName?: string;
}

export const PHONE_BASE_W = 402;
export const PHONE_BASE_H = 874;

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  activeRail = 'circles',
  activeLib = 'cards',
  onRailChange,
  onLibChange,
  viewMode = 'front',
  onSetViewMode,
  armPose = 'resting',
  onSetArmPose,
  beltLatkan = 'heavy',
  onSetBeltLatkan,
  latkanBoxOrientation = 'horizontal',
  onSetLatkanBoxOrientation,
  onResetFocus,
  onOpenSummary,
  currentGarment = 'lehenga',
  onSelectGarment,
  activeCategoryLabel,
  selectedOptionName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [showSidePanels, setShowSidePanels] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const h12 = hours % 12 || 12;
      setCurrentTime(`${h12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Resolution Scaling
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const isMobile = clientWidth <= 440;
      setIsMobileViewport(isMobile);
      setShowSidePanels(clientWidth >= 960);

      const paddingX = isMobile ? 16 : 32;
      const paddingY = isMobile ? 24 : 40;
      const availW = Math.max(clientWidth - paddingX, 240);
      const availH = Math.max(clientHeight - paddingY, 360);
      const s = Math.min(availW / PHONE_BASE_W, availH / PHONE_BASE_H, 1.0);
      setScale(Number(s.toFixed(3)));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, []);

  const garmentConfig = GARMENTS[currentGarment];

  return (
    <div
      ref={containerRef}
      id="atelier-viewport"
      className="relative w-full h-screen overflow-hidden bg-[#1a1715] text-[#2b2724] font-body flex items-center justify-center select-none"
    >
      {/* Background Subtle Atelier Lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(182, 130, 53, 0.09) 0%, rgba(23, 77, 51, 0.08) 40%, rgba(26, 23, 21, 0.98) 80%)',
        }}
      />

      {/* Desktop Workspace Container */}
      <div className="relative w-full h-full flex items-center justify-center gap-6 px-4 z-10">
        {/* Left Side Atelier Spec Sheet (visible on desktop) */}
        {showSidePanels && !isMobileViewport && (
          <aside
            id="desktop-left-atelier-card"
            className="w-[220px] flex-none hidden lg:flex flex-col gap-3 p-3.5 rounded-2xl bg-[#24201d]/90 border border-white/10 backdrop-blur-md text-[#e8e2dc] shadow-xl animate-fade"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#174d33] flex items-center justify-center text-[#a1d6b6]">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-[14px] font-semibold text-white leading-tight">
                  Dori Atelier
                </h3>
                <span className="text-[9px] uppercase tracking-wider text-[#b68235] font-mono">
                  Bespoke Studio
                </span>
              </div>
            </div>

            {/* Active Garment Info */}
            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[9.5px] uppercase tracking-wider text-[#9f9891] font-sans">
                Active Silhouette
              </span>
              <span className="font-serif text-[15px] font-bold text-white">
                {garmentConfig.name}
              </span>
              <span className="text-[10px] text-[#b8b0a8] leading-tight">
                {garmentConfig.desc}
              </span>
            </div>

            {/* Current Component Seam */}
            {activeCategoryLabel && (
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[9.5px] uppercase tracking-wider text-[#9f9891] font-sans">
                  Focused Seam
                </span>
                <span className="text-[12px] font-semibold text-[#a1d6b6]">
                  {activeCategoryLabel}
                </span>
                {selectedOptionName && (
                  <span className="text-[11px] text-[#d6cfc7] font-mono">
                    {selectedOptionName}
                  </span>
                )}
              </div>
            )}

            {/* Belt (Latkan) Status Badge */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
              <div className="flex flex-col">
                <span className="text-[9.5px] uppercase tracking-wider text-[#9f9891] font-sans">
                  Belt (Latkan)
                </span>
                <span className="text-[11.5px] font-semibold text-[#f5d485] capitalize">
                  {beltLatkan === 'none' ? 'None' : `${beltLatkan} Size`}
                </span>
              </div>
              {onSetBeltLatkan && (
                <button
                  onClick={() => {
                    const cur = beltLatkan ?? 'heavy';
                    const nextMode: BeltLatkanMode = cur === 'none' ? 'light' : cur === 'light' ? 'heavy' : 'none';
                    onSetBeltLatkan(nextMode);
                  }}
                  title="Toggle Belt (Latkan)"
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[9.5px] font-mono text-white transition-colors"
                >
                  Cycle
                </button>
              )}
            </div>

            {/* Active Garment Indicator */}
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[9.5px] uppercase tracking-wider text-[#9f9891] font-sans">
                Active Garment
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="text-[12px] font-semibold text-white">Lehenga</span>
              </div>
              <span className="text-[9.5px] text-[#9f9891] font-sans leading-tight">
                Bespoke Bridal & Festive Studio
              </span>
            </div>

            {/* Atelier Proportions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9.5px] font-mono text-[#8e8780]">
              <span className="flex items-center gap-1">
                <Ruler className="w-3 h-3 text-[#b68235]" />
                Size XL
              </span>
              <span>Made-to-Measure</span>
            </div>
          </aside>
        )}

        {/* Center: Scaled Phone Mockup Container */}
        <div
          id="phone-scale-wrapper"
          className="relative transition-all duration-200 ease-out flex items-center justify-center flex-none"
          style={{
            width: `${Math.round(PHONE_BASE_W * scale)}px`,
            height: `${Math.round(PHONE_BASE_H * scale)}px`,
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out flex-none"
            style={{
              width: `${PHONE_BASE_W}px`,
              height: `${PHONE_BASE_H}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* iOS Device Frame Container */}
            <div
              id="phone-screen-container"
              className="relative w-full h-full overflow-hidden bg-[#f7f4ef] text-[#2b2724] font-body rounded-[48px] shadow-[0_32px_80px_rgba(0,0,0,0.65),0_0_0_12px_#272422,0_0_0_13px_rgba(255,255,255,0.15)] ring-1 ring-black/40"
              style={{ boxSizing: 'border-box' }}
            >
              {/* iOS Dynamic Island */}
              <div
                className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[126px] h-[35px] rounded-[22px] bg-black z-50 flex items-center justify-between px-3 pointer-events-none"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#151515] border border-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1b263b] border border-white/5" />
              </div>

              {/* iOS Status Bar */}
              <div className="absolute top-0 left-0 right-0 z-40 h-[46px] px-7 flex items-center justify-between pointer-events-none text-[#2b2724] font-sans">
                <span className="text-[14px] font-semibold tracking-tight">{currentTime}</span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {/* Cellular Signal */}
                  <svg width="16" height="11" viewBox="0 0 17 11" fill="currentColor">
                    <rect x="0" y="7" width="2.8" height="4" rx="0.6" />
                    <rect x="4.2" y="5" width="2.8" height="6" rx="0.6" />
                    <rect x="8.4" y="2.5" width="2.8" height="8.5" rx="0.6" />
                    <rect x="12.6" y="0" width="2.8" height="11" rx="0.6" />
                  </svg>
                  {/* Wifi */}
                  <svg width="15" height="11" viewBox="0 0 17 12" fill="currentColor">
                    <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" />
                    <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" />
                    <circle cx="8.5" cy="10.5" r="1.5" />
                  </svg>
                  {/* Battery */}
                  <svg width="24" height="11" viewBox="0 0 25 11" fill="none">
                    <rect x="0.5" y="0.5" width="21" height="10" rx="3" stroke="currentColor" strokeOpacity="0.4" />
                    <rect x="2" y="2" width="18" height="7" rx="1.5" fill="currentColor" />
                    <path d="M23 3.5V7.5C23.6 7.2 24 6.4 24 5.5C24 4.6 23.6 3.8 23 3.5Z" fill="currentColor" fillOpacity="0.4" />
                  </svg>
                </div>
              </div>

              {/* Actual Studio Content inside Phone */}
              <div className="w-full h-full pt-[44px] pb-[18px] flex flex-col overflow-hidden relative">
                {children}
              </div>

              {/* iOS Home Indicator Bar */}
              <div className="absolute bottom-1.5 left-0 right-0 h-5 flex items-center justify-center pointer-events-none z-50">
                <div className="w-[134px] h-[5px] rounded-full bg-black/25" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Settings Bar (outside the phone on desktop, making the space useful) */}
        {showSidePanels && !isMobileViewport && onSetViewMode && onSetArmPose && onRailChange && onLibChange && (
          <aside
            id="desktop-right-settings-card"
            className="w-[220px] flex-none hidden md:flex flex-col gap-3 animate-fade"
          >
            <StudioSettingsBar
              viewMode={viewMode}
              onSetViewMode={onSetViewMode}
              armPose={armPose}
              onSetArmPose={onSetArmPose}
              railMode={activeRail}
              onRailChange={onRailChange}
              libraryMode={activeLib}
              onLibChange={onLibChange}
              beltLatkan={beltLatkan}
              onSetBeltLatkan={onSetBeltLatkan}
              latkanBoxOrientation={latkanBoxOrientation}
              onSetLatkanBoxOrientation={onSetLatkanBoxOrientation}
              onResetFocus={onResetFocus || (() => onSetViewMode('front'))}
              onOpenSummary={onOpenSummary}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
