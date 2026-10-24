/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Explore Styles: browse Dori's own inspiration (Studio renders and illustrations), save to boards
// and start a similar design.

import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, Palette, Search, Sparkles } from 'lucide-react';
import { OCCASIONS, STYLE_FAMILIES, garmentById, garmentName } from '../data/catalog';
import { EXPLORE_ITEMS } from '../data/explore';
import { api } from '../services';
import type { Board, ExploreItem } from '../services/types';
import { useNav } from '../nav';
import { emptyDraft, useDraft } from '../state/orderDraft';
import { useCustomer, useSession } from '../state/session';
import { GarmentArtFor } from '../ui/Silhouette';
import { Button, Chip, Choice, ConfirmDialog, EmptyState, ErrorBanner, Note, Screen, Sheet, Spinner, inputClass, useToast } from '../ui/kit';

const CATEGORIES = ['Lehengas', 'Wedding guest', 'Festive', 'Everyday kurtis', 'Blouses', 'Fusion', 'Office'];

export const ExploreImage: React.FC<{ item: ExploreItem; className?: string }> = ({ item, className = '' }) =>
  item.image.kind === 'render' ? (
    <img src={item.image.src} alt={item.title} className={`w-full object-cover bg-white ${className}`} loading="lazy" />
  ) : (
    <div className={`w-full bg-[#174D33]/[0.05] flex items-center justify-center ${className}`}>
      <GarmentArtFor garmentId={item.image.garmentId} className="w-3/5" />
    </div>
  );

export const ExploreCard: React.FC<{ item: ExploreItem; onOpen: () => void; onSave?: () => void; saved?: boolean }> = ({ item, onOpen, onSave, saved }) => (
  <div className="relative rounded-[18px] border border-black/10 overflow-hidden">
    <button onClick={onOpen} className="block w-full text-left" id={`explore-card-${item.id}`}>
      <ExploreImage item={item} className={item.image.kind === 'render' ? 'aspect-[3/5]' : 'aspect-[4/5]'} />
      <div className="p-2.5">
        <div className="text-[13.5px] font-semibold leading-tight">{item.title}</div>
        <div className="text-[11px] text-black/50 mt-0.5">{STYLE_FAMILIES.find((f) => f.id === item.family)?.label} · {OCCASIONS.find((o) => o.id === item.occasion)?.label}</div>
      </div>
    </button>
    {onSave && (
      <button
        aria-label={saved ? 'Saved' : 'Save to board'}
        onClick={onSave}
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-[#174D33]"
      >
        {saved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
      </button>
    )}
  </div>
);

const useBoards = () => {
  const { errorMessage } = useSession();
  const toast = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const refresh = () => api.listBoards().then(setBoards).catch(() => undefined);
  useEffect(() => {
    void refresh();
  }, []);
  const save = async (boardId: string, item: ExploreItem) => {
    try {
      await api.addToBoard(boardId, { kind: 'explore', refId: item.id });
      toast(`Saved to ${boards.find((b) => b.id === boardId)?.title}`);
      await refresh();
    } catch (e) {
      toast(errorMessage(e));
    }
  };
  const isSaved = (id: string) => boards.some((b) => b.items.some((i) => i.refId === id));
  return { boards, save, isSaved };
};

const SaveSheet: React.FC<{ item: ExploreItem | null; boards: Board[]; onClose: () => void; onPick: (boardId: string) => void }> = ({ item, boards, onClose, onPick }) => (
  <Sheet open={!!item} onClose={onClose} title="Save to board">
    {boards.map((b) => (
      <Choice key={b.id} id={`save-board-${b.title.replace(/\s/g, '-')}`} selected={!!item && b.items.some((i) => i.refId === item.id)} title={b.title} description={`${b.items.length} saved`} onClick={() => onPick(b.id)} />
    ))}
    <p className="text-[12px] text-black/50 mt-1">Boards are private to you.</p>
  </Sheet>
);

export const ExploreScreen: React.FC = () => {
  const nav = useNav();
  const { errorMessage } = useSession();
  const [items, setItems] = useState<ExploreItem[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [family, setFamily] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [cat, setCat] = useState<string>('');
  const [saving, setSaving] = useState<ExploreItem | null>(null);
  const { boards, save, isSaved } = useBoards();

  const load = () => {
    setError('');
    api.listExplore().then(setItems).catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items || []).filter(
      (i) =>
        (!family || i.family === family) &&
        (!occasion || i.occasion === occasion) &&
        (!cat || i.tags.includes(cat) || (cat === 'Fusion' && i.family === 'indo_western')) &&
        (!term || [i.title, i.description, ...i.tags, garmentName(garmentById(i.garmentId))].join(' ').toLowerCase().includes(term)),
    );
  }, [items, q, family, occasion, cat]);

  return (
    <Screen title="Explore styles" onBack={nav.back}>
      <div className="relative mt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
        <input id="explore-search" className={`${inputClass} pl-10`} placeholder="Search lehengas, kurtis, festive…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search styles" />
      </div>
      <div className="flex gap-2 overflow-x-auto py-3 -mx-4 px-4">
        <Chip selected={!family} onClick={() => setFamily('')}>
          All
        </Chip>
        {STYLE_FAMILIES.map((f) => (
          <Chip key={f.id} selected={family === f.id} onClick={() => setFamily(family === f.id ? '' : f.id)}>
            {f.label}
          </Chip>
        ))}
        <span className="w-px bg-black/10 flex-none" />
        {OCCASIONS.map((o) => (
          <Chip key={o.id} selected={occasion === o.id} onClick={() => setOccasion(occasion === o.id ? '' : o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
        {CATEGORIES.map((c) => (
          <Chip key={c} id={`explore-cat-${c.replace(/\s/g, '-')}`} selected={cat === c} onClick={() => setCat(cat === c ? '' : c)}>
            {c}
          </Chip>
        ))}
      </div>
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!items && !error && <Spinner />}
      {items && shown.length === 0 && <EmptyState icon={<Search className="w-7 h-7" />} title="No matches" body="Try a different search or clear a filter." />}
      <div className="columns-2 gap-2.5">
        {shown.map((i) => (
          <div key={i.id} className="break-inside-avoid mb-2.5">
            <ExploreCard item={i} onOpen={() => nav.go({ name: 'explore-item', id: i.id })} onSave={() => setSaving(i)} saved={isSaved(i.id)} />
          </div>
        ))}
      </div>
      {items && <p className="text-[11.5px] text-black/45 text-center mt-2">All images are Dori Studio renders or Dori illustrations.</p>}
      <SaveSheet item={saving} boards={boards} onClose={() => setSaving(null)} onPick={(b) => (void save(b, saving!), setSaving(null))} />
    </Screen>
  );
};

export const ExploreItemScreen: React.FC<{ id: string }> = ({ id }) => {
  const nav = useNav();
  const customer = useCustomer();
  const { hasProgress, replaceDraft } = useDraft();
  const item = EXPLORE_ITEMS.find((i) => i.id === id);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { boards, save, isSaved } = useBoards();
  if (!item) return <Screen title="Not found" onBack={nav.back}><ErrorBanner message="This style is no longer available." /></Screen>;
  const g = garmentById(item.garmentId);

  const start = () => {
    const size = (g?.sizeKey && customer.fitProfile.garmentSizes[g.sizeKey]) || customer.fitProfile.usualSize;
    replaceDraft({
      ...emptyDraft(),
      family: item.family,
      occasion: item.occasion,
      garmentId: item.garmentId,
      size,
      method: item.studio ? 'studio' : 'reference',
      studio: item.studio,
      inspiredBy: item.id,
      changeNotes: item.studio ? '' : `Inspired by “${item.title}” from Explore.`,
    });
    // with a Studio look, go straight to the Studio; fabric details are asked before booking
    nav.go(item.studio ? { name: 'studio' } : { name: 'order', step: 1 });
  };

  return (
    <Screen
      onBack={nav.back}
      title={item.title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSaving(true)} id="explore-save">
            {isSaved(item.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />} Save
          </Button>
          <Button block id="explore-similar" onClick={() => (hasProgress ? setConfirm(true) : start())}>
            {item.studio ? <Palette className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />} {item.studio ? 'Create a similar design' : 'Start an order like this'}
          </Button>
        </div>
      }
    >
      <div className="pt-2">
        <div className="rounded-[22px] overflow-hidden border border-black/10">
          <ExploreImage item={item} className={item.image.kind === 'render' ? 'aspect-[3/4] object-top' : 'aspect-[4/5]'} />
        </div>
        <p className="text-[14px] leading-relaxed mt-4">{item.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[garmentName(g), STYLE_FAMILIES.find((f) => f.id === item.family)?.label, OCCASIONS.find((o) => o.id === item.occasion)?.label, ...item.tags].map((t) => (
            <span key={t} className="text-[11.5px] px-2.5 py-1 rounded-full border border-black/10">
              {t}
            </span>
          ))}
        </div>
        <p className="text-[11.5px] text-black/45 mt-3">Source: {item.source}</p>
        <Note>
          {item.studio
            ? 'Opens the Design Studio with this look as your starting point — change anything you like.'
            : 'This garment isn’t in the Design Studio yet. We’ll start an order with this style; add your own reference photos and your stylist will work out the details.'}{' '}
          Inspiration isn’t a production-ready pattern — your stylist confirms fit and feasibility.
        </Note>
      </div>
      <SaveSheet item={saving ? item : null} boards={boards} onClose={() => setSaving(false)} onPick={(b) => (void save(b, item), setSaving(false))} />
      <ConfirmDialog
        open={confirm}
        title="Replace your order in progress?"
        body="Starting from this style replaces the order you haven’t finished."
        confirmLabel="Start new"
        onCancel={() => setConfirm(false)}
        onConfirm={() => (setConfirm(false), start())}
      />
    </Screen>
  );
};
