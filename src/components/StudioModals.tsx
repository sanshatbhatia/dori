/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category, GarmentKey, SelectionState, RailMode, LibraryMode, ViewMode, BeltLatkanMode } from '../types';
import { GARMENTS } from '../data/garments';
import { X, Check, AlertCircle, Sparkles, HelpCircle, Layers, LayoutGrid, RotateCcw } from 'lucide-react';

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSummary: () => void;
  onOpenHelp?: () => void;
  onResetCategory: () => void;
  onAskResetAll: () => void;
  categoryLabel: string;
  railMode?: RailMode;
  onRailChange?: (r: RailMode) => void;
  libraryMode?: LibraryMode;
  onLibChange?: (l: LibraryMode) => void;
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({
  isOpen,
  onClose,
  onOpenSummary,
  onOpenHelp,
  onResetCategory,
  onAskResetAll,
  categoryLabel,
  railMode,
  onRailChange,
  libraryMode,
  onLibChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 animate-fade" onClick={onClose}>
      <div
        className="absolute top-[90px] right-3 w-[240px] bg-[#f7f4ef] border border-[#3c342c]/20 rounded-2xl shadow-2xl overflow-hidden animate-fade z-50 p-1.5 flex flex-col gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="menu-design-summary"
          onClick={() => {
            onClose();
            onOpenSummary();
          }}
          className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-[12.5px] hover:bg-black/5 transition-colors cursor-pointer text-[#2b2724]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b68235]" />
            <span className="font-serif text-[14px] font-medium">Design Summary</span>
          </div>
          <span className="text-[9.5px] uppercase font-mono text-[#174d33] bg-[#174d33]/10 px-1.5 py-0.5 rounded">Spec</span>
        </button>

        {onOpenHelp && (
          <button
            id="menu-open-guide"
            onClick={() => {
              onClose();
              onOpenHelp();
            }}
            className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-[12.5px] hover:bg-black/5 transition-colors cursor-pointer text-[#2b2724]"
          >
            <HelpCircle className="w-4 h-4 text-[#5a534c]" />
            <span>Studio Guide</span>
          </button>
        )}

        {/* Rail Style switcher */}
        {railMode && onRailChange && (
          <div className="px-3 py-2 rounded-xl bg-black/3 border border-black/5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-[#5a534c] font-sans font-medium">
              <Layers className="w-3 h-3 text-[#174d33]" />
              <span>Slot Rail Style</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['circles', 'labelled', 'arc'] as RailMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onRailChange(mode)}
                  className={`py-1 rounded-lg text-[10px] capitalize transition-all ${
                    railMode === mode
                      ? 'bg-[#174d33] text-white font-medium shadow-xs'
                      : 'text-[#5a534c] hover:bg-black/5'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Library Mode switcher */}
        {libraryMode && onLibChange && (
          <div className="px-3 py-2 rounded-xl bg-black/3 border border-black/5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-[#5a534c] font-sans font-medium">
              <LayoutGrid className="w-3 h-3 text-[#174d33]" />
              <span>Library Layout</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['cards', 'filmstrip', 'tray'] as LibraryMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onLibChange(mode)}
                  className={`py-1 rounded-lg text-[10px] capitalize transition-all ${
                    libraryMode === mode
                      ? 'bg-[#174d33] text-white font-medium shadow-xs'
                      : 'text-[#5a534c] hover:bg-black/5'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-[#3c342c]/10 my-0.5" />

        <button
          id="menu-reset-cat"
          onClick={() => {
            onClose();
            onResetCategory();
          }}
          className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] hover:bg-black/5 transition-colors cursor-pointer text-[#2b2724]"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#5a534c]" />
          <span>Reset {categoryLabel}</span>
        </button>

        <button
          id="menu-reset-all"
          onClick={() => {
            onClose();
            onAskResetAll();
          }}
          className="w-full text-left px-3 py-2 rounded-xl text-[12px] text-[#a8564f] hover:bg-[#a8564f]/8 transition-colors cursor-pointer font-medium"
        >
          Reset entire design
        </button>
      </div>
    </div>
  );
};

interface DesignSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGarment: GarmentKey;
  selection: SelectionState;
  beltLatkan?: BeltLatkanMode;
  onSave: () => void;
}

export const DesignSummaryModal: React.FC<DesignSummaryModalProps> = ({
  isOpen,
  onClose,
  currentGarment,
  selection,
  beltLatkan = 'none',
  onSave,
}) => {
  if (!isOpen) return null;
  const g = GARMENTS[currentGarment];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 animate-fade">
      <div className="bg-[#f7f4ef] rounded-t-[28px] max-h-[85%] overflow-y-auto p-5 pb-7 border-t border-[#3c342c]/20 shadow-2xl animate-sheet">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#3c342c]/15">
          <div>
            <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#5a534c] font-sans font-medium">
              Atelier Spec
            </span>
            <h2 className="font-serif text-[28px] font-semibold text-[#2b2724] leading-tight">
              {g.name} Summary
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[#3c342c]/20 flex items-center justify-center text-[#5a534c] hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Specification rows */}
        <div className="mt-3 divide-y divide-[#3c342c]/10 text-sm">
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="uppercase tracking-wider text-[#5a534c] font-medium text-[10px]">
              Garment Model
            </span>
            <span className="font-semibold text-[#2b2724]">{g.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="uppercase tracking-wider text-[#5a534c] font-medium text-[10px]">
              Fitted Size
            </span>
            <span className="font-medium text-[#2b2724]">XL · 5′6″</span>
          </div>
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="uppercase tracking-wider text-[#5a534c] font-medium text-[10px]">
              Belt / Latkan
            </span>
            <span className="font-medium text-[#174d33] capitalize">
              {beltLatkan === 'none' ? 'None (No Belt)' : `${beltLatkan} Size`}
            </span>
          </div>

          {g.cats.map((c) => {
            const currentOpt = c.opts.find((o) => o.id === selection[c.id]) || c.opts[0];
            return (
              <div key={c.id} className="flex items-center justify-between py-2 text-xs">
                <span className="uppercase tracking-wider text-[#5a534c] text-[10px] font-medium">
                  {c.label}
                </span>
                <span className="font-medium text-[#174d33]">{currentOpt.name}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-[#5a534c] italic font-serif">
          Each line maps to a bespoke tailored construction Dori’s atelier can cut and sew.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onSave}
            className="flex-1 py-3 px-4 rounded-xl border border-[#174d33] text-[#174d33] font-sans font-medium text-xs text-center hover:bg-[#174d33]/10 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
          >
            Confirm &amp; Save Spec
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-[#3c342c]/20 text-[#5a534c] font-sans text-xs text-center hover:bg-black/5 transition-all cursor-pointer"
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
};

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 animate-fade">
      <div className="bg-[#fffdf9] border border-[#3c342c]/20 rounded-2xl p-5 shadow-2xl max-w-[340px] w-full animate-fade">
        <div className="flex items-center gap-2 text-[#a8564f] mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-serif text-[21px] font-semibold text-[#2b2724]">
            Reset entire design?
          </h3>
        </div>
        <p className="text-[12px] leading-relaxed text-[#5a534c] mt-1 font-body">
          Every component returns to the studio default. Your garment and size stay as they are.
        </p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl border border-[#a8564f] text-[#a8564f] font-sans text-xs font-semibold hover:bg-[#a8564f]/10 cursor-pointer transition-colors"
          >
            Reset Design
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#3c342c]/20 text-[#5a534c] font-sans text-xs hover:bg-black/5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface WelcomeHintModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  garmentName: string;
}

export const WelcomeHintModal: React.FC<WelcomeHintModalProps> = ({
  isOpen,
  onDismiss,
  garmentName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-[#3c342c]/65 flex flex-col justify-end p-5 animate-fade"
      onClick={onDismiss}
    >
      <div
        className="bg-[#f7f4ef] rounded-2xl p-5 border border-[#3c342c]/20 shadow-2xl animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#174d33] font-sans font-semibold">
          Welcome to the Studio
        </span>
        <h3 className="font-serif text-[24px] font-medium text-[#2b2724] leading-tight mt-1">
          Your {garmentName} in size XL, ready to design.
        </h3>

        <div className="mt-4 flex flex-col gap-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-[10px] font-bold text-[#b68235] mt-0.5">01</span>
            <p className="text-[#332e29] leading-relaxed">
              Tap any component on the right rail to focus on specific garment sections.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-[10px] font-bold text-[#b68235] mt-0.5">02</span>
            <p className="text-[#332e29] leading-relaxed">
              Browse cuts and styles below — your mannequin updates instantly with bespoke tailoring.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-[10px] font-bold text-[#b68235] mt-0.5">03</span>
            <p className="text-[#332e29] leading-relaxed">
              Use Front, Detail, and Back to inspect every seam, angle, and drape.
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-5 py-3 rounded-xl border border-[#174d33] text-[#174d33] font-sans font-semibold text-xs tracking-wide text-center hover:bg-[#174d33]/10 active:scale-[0.99] transition-all cursor-pointer"
        >
          Start Designing
        </button>
      </div>
    </div>
  );
};

interface ToastNotificationProps {
  message: string;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-40 bg-[#2b2724] text-[#f7f4ef] px-3.5 py-2.5 rounded-2xl shadow-xl flex items-start gap-2.5 text-xs leading-snug animate-toast border border-white/10">
      <span className="w-1.5 h-1.5 rounded-full bg-[#b68235] mt-1 flex-none" />
      <span className="font-body text-[11.5px]">{message}</span>
    </div>
  );
};
