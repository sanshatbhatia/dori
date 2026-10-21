/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
} from './types';
import { GARMENTS, getDefaults, checkCompatibilityReason, PREFERRED_WITH } from './data/garments';
import { PhoneFrame } from './components/PhoneFrame';
import { StudioHeader } from './components/StudioHeader';
import { MannequinStage } from './components/MannequinStage';
import { ComponentRail } from './components/ComponentRail';
import { DesignLibrary } from './components/DesignLibrary';
import {
  MenuDropdown,
  DesignSummaryModal,
  ResetConfirmModal,
  WelcomeHintModal,
  ToastNotification,
} from './components/StudioModals';
import { FOCUS } from './data/geometry';

export default function App() {
  const [currentGarment, setCurrentGarment] = useState<GarmentKey>('lehenga');
  const [selections, setSelections] = useState<Record<GarmentKey, SelectionState>>({
    lehenga: getDefaults('lehenga'),
  });

  const [activeCatIndex, setActiveCatIndex] = useState<number>(1); // e.g. Neckline by default
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [armPose, setArmPose] = useState<ArmPose>('stretched');
  const [railMode, setRailMode] = useState<RailMode>('circles');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('cards');
  const [beltLatkan, setBeltLatkan] = useState<BeltLatkanMode>('heavy');
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
      setActiveCatIndex(index);
      const cat = garmentConfig.cats[index];
      if (cat) {
        const focusConf = FOCUS[cat.slot];
        if (focusConf) {
          setViewMode(focusConf.view);
        }
      }
      setMenuOpen(false);
    },
    [garmentConfig.cats]
  );

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

  // Confirm save
  const handleSave = useCallback(() => {
    setShowSummary(false);
    flashToast('Design saved to your Dori atelier portfolio.');
  }, [flashToast]);

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
        onOpenHint={() => setShowHint(true)}
      />

      {/* Main Interactive Stage with Mannequin & Camera Focus */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
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
            if (idx >= 0) {
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

      {/* Floating Action Feedback Toast */}
      <ToastNotification message={toast} />
    </PhoneFrame>
  );
}
