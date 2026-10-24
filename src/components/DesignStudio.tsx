/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, NotebookPen, Save } from 'lucide-react';
import {
  GarmentKey,
  HistoryStep,
  LibraryMode,
  RailMode,
  SelectionState,
  ViewMode,
  ArmPose,
  Category,
  BeltLatkanMode,
  LatkanBoxOrientation,
} from '../types';
import { GARMENTS, getDefaults, checkCompatibilityReason, categoryUnavailableReason, PREFERRED_WITH } from '../data/garments';
import { PhoneFrame } from './PhoneFrame';
import { StudioHeader } from './StudioHeader';
import { MannequinStage } from './MannequinStage';
import { ComponentRail } from './ComponentRail';
import { DesignLibrary } from './DesignLibrary';
import {
  MenuDropdown,
  DesignSummaryModal,
  ResetConfirmModal,
  WelcomeHintModal,
  ToastNotification,
} from './StudioModals';
import { FOCUS } from '../data/geometry';
import { capturePreview } from './capturePreview';

/** What the Studio hands back to the order flow: the structured design, notes and a preview image */
export interface StudioResult {
  selection: SelectionState;
  beltLatkan: BeltLatkanMode;
  notes: string;
  previewDataUrl?: string;
}

export interface DesignStudioProps {
  /** start from an existing design (draft, saved design or Explore look) */
  initial?: { selection: SelectionState; beltLatkan: BeltLatkanMode };
  initialNotes?: string;
  /** order context shown in the Studio: garment, size, occasion, fabric… */
  context?: { title: string; size?: string; chips: string[] };
  /** leave the Studio: 'back' discards unsaved changes (after confirmation), 'save' keeps a draft, 'done' returns to the order */
  onExit?: (action: 'back' | 'save' | 'done', result: StudioResult) => void | Promise<string | void>;
  doneLabel?: string;
}

export function DesignStudio({ initial, initialNotes = '', context, onExit, doneLabel = 'Done' }: DesignStudioProps) {
  const [currentGarment, setCurrentGarment] = useState<GarmentKey>('lehenga');
  const [selections, setSelections] = useState<Record<GarmentKey, SelectionState>>({
    lehenga: initial?.selection ? { ...getDefaults('lehenga'), ...initial.selection } : getDefaults('lehenga'),
  });
  const [notes, setNotes] = useState(initialNotes);
  const [notesOpen, setNotesOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const stageWrapRef = useRef<HTMLDivElement>(null);

  const [activeCatIndex, setActiveCatIndex] = useState<number>(1); // e.g. Neckline by default
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [armPose, setArmPose] = useState<ArmPose>('stretched');
  const [railMode, setRailMode] = useState<RailMode>('circles');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('cards');
  const [beltLatkan, setBeltLatkan] = useState<BeltLatkanMode>(initial?.beltLatkan ?? 'heavy');
  const [latkanBoxOrientation, setLatkanBoxOrientation] = useState<LatkanBoxOrientation>('horizontal');

  // Undo / Redo history
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Notifications and feedback
  const [toast, setToast] = useState<string>('');
  const [loadingSlot, setLoadingSlot] = useState<string>('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showReset, setShowReset] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const currentSelection = selections[currentGarment];
  const garmentConfig = GARMENTS[currentGarment];
  const categories = garmentConfig.cats;
  const activeCategory = categories[Math.min(activeCatIndex, categories.length - 1)];

  // Flash toast message
  const flashToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast('');
    }, 3600);
  }, []);

  // Flash loading animation for current slot
  const flashLoading = useCallback((slotShort: string) => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setLoadingSlot(slotShort);
    loadingTimeoutRef.current = setTimeout(() => {
      setLoadingSlot('');
    }, 650);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  // Select Option with cascade validation and history
  const handleSelectOption = useCallback(
    (cat: Category, optId: string) => {
      const sel = selections[currentGarment];
      if (sel[cat.id] === optId) return;

      const reason = checkCompatibilityReason(currentGarment, cat, optId, sel);
      if (reason) {
        flashToast(reason);
        return;
      }

      const next = { ...sel, [cat.id]: optId };
      let cascadeNote = '';

      // Check if other components are broken by this selection
      garmentConfig.cats.forEach((otherCat) => {
        if (otherCat.id === cat.id) return;
        if (checkCompatibilityReason(currentGarment, otherCat, next[otherCat.id], next)) {
          const preferredId = PREFERRED_WITH[`${cat.id}:${optId}`]?.[otherCat.id];
          const isValid = (id: string) => !checkCompatibilityReason(currentGarment, otherCat, id, next);
          const validAlt =
            (preferredId && isValid(preferredId) ? otherCat.opts.find((o) => o.id === preferredId) : undefined) ||
            otherCat.opts.find((o) => isValid(o.id));
          if (validAlt) {
            if (!cascadeNote) {
              cascadeNote = `${otherCat.label} switched to ${validAlt.name} so the seams align.`;
            }
            next[otherCat.id] = validAlt.id;
          }
        }
      });

      // Update history stack
      const newHistory = history.slice(0, historyIndex + 1).concat([{ g: currentGarment, sel: next, beltLatkan }]);

      setSelections((prev) => ({ ...prev, [currentGarment]: next }));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      flashLoading(cat.short);

      if (cascadeNote) {
        flashToast(cascadeNote);
      }
    },
    [currentGarment, garmentConfig.cats, history, historyIndex, selections, beltLatkan, flashLoading, flashToast]
  );

  // Set Belt (Latkan) Mode with History
  const handleSetBeltLatkan = useCallback(
    (mode: BeltLatkanMode) => {
      setBeltLatkan(mode);
      const newHistory = history.slice(0, historyIndex + 1).concat([
        { g: currentGarment, sel: selections[currentGarment], beltLatkan: mode },
      ]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      flashToast(`Belt (Latkan): ${mode === 'none' ? 'None (Clean Waist)' : `${mode.toUpperCase()} size`}`);
    },
    [currentGarment, history, historyIndex, selections, flashToast]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentGarment(prevStep.g);
      setSelections((prev) => ({ ...prev, [prevStep.g]: prevStep.sel }));
      if (prevStep.beltLatkan) {
        setBeltLatkan(prevStep.beltLatkan);
      }
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setSelections((prev) => ({ ...prev, [currentGarment]: getDefaults(currentGarment) }));
      setBeltLatkan(currentGarment === 'lehenga' ? 'heavy' : 'none');
    }
  }, [currentGarment, history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentGarment(nextStep.g);
      setSelections((prev) => ({ ...prev, [nextStep.g]: nextStep.sel }));
      if (nextStep.beltLatkan) {
        setBeltLatkan(nextStep.beltLatkan);
      }
    }
  }, [history, historyIndex]);

  // Garment Tab Switch
  const handleSelectGarment = useCallback((gk: GarmentKey) => {
    setCurrentGarment(gk);
    setActiveCatIndex(1); // Set to neckline or second slot
    setViewMode('front'); // Show full design on tab switch
  }, []);

  // Category selection on rail
  const handleSelectCategoryIndex = useCallback(
    (index: number) => {
      const cat = garmentConfig.cats[index];
      const unavailable = cat && categoryUnavailableReason(cat, selections[currentGarment]);
      if (unavailable) {
        flashToast(unavailable);
        return;
      }
      setActiveCatIndex(index);
      if (cat) {
        const focusConf = FOCUS[cat.slot];
        if (focusConf) {
          setViewMode(focusConf.view);
        }
      }
      setMenuOpen(false);
    },
    [garmentConfig.cats, selections, currentGarment, flashToast]
  );

  // Categories that can't be used with the current design (e.g. no dupatta with a jacket)
  const unavailableCategoryIds = categories
    .filter((c) => categoryUnavailableReason(c, currentSelection))
    .map((c) => c.id);

  // If undo/redo or a change makes the open category unavailable, move back to the blouse
  useEffect(() => {
    if (unavailableCategoryIds.includes(activeCategory.id)) setActiveCatIndex(0);
  }, [unavailableCategoryIds.join(','), activeCategory.id]);

  // Reset category
  const handleResetCategory = useCallback(() => {
    setMenuOpen(false);
    const defaults = getDefaults(currentGarment);
    const defaultOptId = defaults[activeCategory.id];
    if (currentSelection[activeCategory.id] !== defaultOptId) {
      handleSelectOption(activeCategory, defaultOptId);
      flashToast(`${activeCategory.label} reset to studio default.`);
    }
  }, [activeCategory, currentGarment, currentSelection, handleSelectOption, flashToast]);

  // Reset all
  const handleResetAll = useCallback(() => {
    setShowReset(false);
    setSelections((prev) => ({ ...prev, [currentGarment]: getDefaults(currentGarment) }));
    flashToast('Design reset. Undo still holds your history.');
  }, [currentGarment, flashToast]);

  // Unsaved changes: anything different from what the Studio opened with
  const startRef = useRef(JSON.stringify({ s: selections.lehenga, b: beltLatkan, n: initialNotes }));
  const isDirty = JSON.stringify({ s: currentSelection, b: beltLatkan, n: notes }) !== startRef.current;

  // Hand the design back: switch to the front view, render a preview picture, then exit
  const finish = useCallback(
    async (action: 'save' | 'done') => {
      if (!onExit) {
        setShowSummary(false);
        flashToast('Design saved.');
        return;
      }
      setBusy(true);
      setShowSummary(false);
      setViewMode('front');
      await new Promise((r) => setTimeout(r, 800));
      let previewDataUrl: string | undefined;
      try {
        const svg = stageWrapRef.current?.querySelector('#mannequin-stage svg') as SVGSVGElement | null;
        if (svg) previewDataUrl = await capturePreview(svg);
      } catch {
        // the preview picture is optional; the design data is what matters
      }
      try {
        const msg = await onExit(action, { selection: currentSelection, beltLatkan, notes, previewDataUrl });
        startRef.current = JSON.stringify({ s: currentSelection, b: beltLatkan, n: notes });
        if (typeof msg === 'string') flashToast(msg);
      } catch (e) {
        flashToast(e instanceof Error ? e.message : 'Could not save. Try again.');
      } finally {
        setBusy(false);
      }
    },
    [onExit, currentSelection, beltLatkan, notes, flashToast],
  );

  const handleSave = useCallback(() => void finish('save'), [finish]);

  const handleBack = useCallback(() => {
    if (!onExit) return setShowHint(true);
    if (isDirty) setLeaveOpen(true);
    else onExit('back', { selection: currentSelection, beltLatkan, notes });
  }, [onExit, isDirty, currentSelection, beltLatkan, notes]);

  return (
    <PhoneFrame
      activeRail={railMode}
      activeLib={libraryMode}
      onRailChange={setRailMode}
      onLibChange={setLibraryMode}
      viewMode={viewMode}
      onSetViewMode={setViewMode}
      armPose={armPose}
      onSetArmPose={setArmPose}
      beltLatkan={beltLatkan}
      onSetBeltLatkan={handleSetBeltLatkan}
      latkanBoxOrientation={latkanBoxOrientation}
      onSetLatkanBoxOrientation={setLatkanBoxOrientation}
      onResetFocus={() => setViewMode('front')}
      onOpenSummary={() => setShowSummary(true)}
      currentGarment={currentGarment}
      onSelectGarment={handleSelectGarment}
      studioPanels
      studioSize={context?.size}
      activeCategoryLabel={activeCategory.label}
      selectedOptionName={activeCategory.opts.find((o) => o.id === currentSelection[activeCategory.id])?.name}
    >
      {/* Studio Header (Back, Garment Name, Undo/Redo, Menu, Garment Tabs) */}
      <StudioHeader
        currentGarment={currentGarment}
        onSelectGarment={handleSelectGarment}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        onOpenHint={handleBack}
        size={context?.size}
        title={context?.title}
        subtitle={context?.chips.slice(1).join(' · ')}
        action={
          onExit && (
            <button
              id="studio-done-btn"
              onClick={() => void finish('done')}
              disabled={busy}
              className="flex-none h-9 px-3 rounded-xl bg-[#174d33] text-white text-[12.5px] font-sans font-semibold flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {busy ? '…' : doneLabel}
            </button>
          )
        }
      />

      {/* Main Interactive Stage with Mannequin & Camera Focus */}
      <div ref={stageWrapRef} className="flex-1 relative overflow-hidden flex flex-col">
        <MannequinStage
          currentGarment={currentGarment}
          selection={currentSelection}
          activeCategory={activeCategory}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          armPose={armPose}
          onSetArmPose={setArmPose}
          beltLatkan={beltLatkan}
          onSetBeltLatkan={handleSetBeltLatkan}
          latkanBoxOrientation={latkanBoxOrientation}
          onSetLatkanBoxOrientation={setLatkanBoxOrientation}
          loadingSlot={loadingSlot}
          railOnLeft={railMode === 'circles'}
          onSelectCategorySlot={(slot) => {
            const idx = categories.findIndex((c) => c.slot === slot);
            if (idx >= 0 && !unavailableCategoryIds.includes(categories[idx].id)) {
              handleSelectCategoryIndex(idx);
              flashToast(`Selected ${categories[idx].label} to customize`);
            }
          }}
        />

        {/* Component Rail (Floating Circles, Labelled Rail, or Thumb Arc) */}
        <ComponentRail
          railMode={railMode}
          currentGarment={currentGarment}
          categories={categories}
          activeCategoryIndex={activeCatIndex}
          onSelectCategoryIndex={handleSelectCategoryIndex}
          selection={currentSelection}
          unavailableIds={unavailableCategoryIds}
        />
      </div>

      {/* Design Library Carousel / Tray */}
      <DesignLibrary
        libraryMode={libraryMode}
        currentGarment={currentGarment}
        activeCategory={activeCategory}
        selection={currentSelection}
        onSelectOption={handleSelectOption}
        onFlashToast={flashToast}
      />

      {/* Menu Dropdown with Complete Controls */}
      <MenuDropdown
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSummary={() => setShowSummary(true)}
        onOpenHelp={() => setShowHint(true)}
        onResetCategory={handleResetCategory}
        onAskResetAll={() => setShowReset(true)}
        categoryLabel={activeCategory.label}
        railMode={railMode}
        onRailChange={setRailMode}
        libraryMode={libraryMode}
        onLibChange={setLibraryMode}
        extraItems={
          onExit && (
            <>
              <button
                id="studio-notes-btn"
                onClick={() => (setMenuOpen(false), setNotesOpen(true))}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-[12.5px] hover:bg-black/5 cursor-pointer text-black"
              >
                <span className="flex items-center gap-2">
                  <NotebookPen className="w-4 h-4 text-[#174d33]" />
                  <span className="font-serif text-[14px] font-medium">Design notes</span>
                </span>
                {notes && <span className="w-2 h-2 rounded-full bg-[#174d33]" aria-label="has notes" />}
              </button>
              <button
                id="studio-save-btn"
                onClick={() => (setMenuOpen(false), void finish('save'))}
                disabled={busy}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 text-[12.5px] hover:bg-black/5 cursor-pointer text-black disabled:opacity-40"
              >
                <Save className="w-4 h-4 text-[#174d33]" />
                <span className="font-serif text-[14px] font-medium">Save draft</span>
              </button>
              <div className="h-px bg-black/10 mx-2" />
            </>
          )
        }
      />

      {/* Design Summary Modal */}
      <DesignSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        currentGarment={currentGarment}
        selection={currentSelection}
        beltLatkan={beltLatkan}
        onSave={handleSave}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmModal
        isOpen={showReset}
        onConfirm={handleResetAll}
        onCancel={() => setShowReset(false)}
      />

      {/* First-visit Studio Welcome Guidance */}
      <WelcomeHintModal
        isOpen={showHint}
        onDismiss={() => setShowHint(false)}
        garmentName={garmentConfig.name}
      />

      {/* Notes: instructions that the options can't express */}
      {notesOpen && (
        <div className="absolute inset-0 z-[60] flex items-end font-sans" role="dialog" aria-modal="true" aria-label="Design notes">
          <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setNotesOpen(false)} />
          <div className="relative w-full bg-white rounded-t-[28px] p-5 animate-sheet text-black">
            <h2 className="font-serif text-[21px] font-semibold">Design notes</h2>
            <p className="text-[12.5px] text-black/55 mt-1 mb-3">Anything the options can’t show — embroidery, colours, length tweaks, fabric placement.</p>
            <textarea
              id="studio-notes-input"
              value={notes}
              maxLength={600}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Add gold zari on the sleeve hem; keep the back tie in a contrast colour."
              className="w-full min-h-[120px] p-3 rounded-2xl border border-black/15 text-[14px] outline-none focus:border-[#174d33] resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-black/45">{notes.length}/600</span>
              <button onClick={() => setNotesOpen(false)} className="h-10 px-5 rounded-full bg-[#174d33] text-white text-[14px] font-semibold">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaving with unsaved changes */}
      {leaveOpen && onExit && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 font-sans" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLeaveOpen(false)} />
          <div className="relative w-full bg-white rounded-[24px] p-5 text-black">
            <h2 className="font-serif text-[21px] font-semibold">Save your changes?</h2>
            <p className="text-[13.5px] text-black/60 mt-1.5">You have changes that haven’t been saved.</p>
            <div className="flex flex-col gap-2 mt-5">
              <button id="leave-save" onClick={() => (setLeaveOpen(false), void finish('save'))} className="h-11 rounded-full bg-[#174d33] text-white font-semibold">
                Save draft and leave
              </button>
              <button
                id="leave-discard"
                onClick={() => (setLeaveOpen(false), onExit('back', { selection: currentSelection, beltLatkan, notes }))}
                className="h-11 rounded-full border border-black text-black font-semibold"
              >
                Discard changes
              </button>
              <button onClick={() => setLeaveOpen(false)} className="h-11 rounded-full text-[#174d33] font-semibold">
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      <ToastNotification message={toast} />
    </PhoneFrame>
  );
}
