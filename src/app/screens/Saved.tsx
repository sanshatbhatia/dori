/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Saved Designs: a private, board-based library of designs and saved inspiration.

import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, CalendarCheck, Copy, FolderInput, Lock, MoreHorizontal, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { OCCASIONS, garmentById, garmentName } from '../data/catalog';
import { describeStudio } from '../data/describe';
import { EXPLORE_ITEMS } from '../data/explore';
import { api } from '../services';
import type { Board, Design } from '../services/types';
import { useNav } from '../nav';
import { designToDraft, useDraft } from '../state/orderDraft';
import { useSession } from '../state/session';
import { GarmentArtFor } from '../ui/Silhouette';
import { Button, Chip, Choice, ConfirmDialog, EmptyState, ErrorBanner, Field, Input, ListRow, Screen, Sheet, Spinner, TextArea, formatDate, useToast } from '../ui/kit';
import { firstIncompleteStep } from './OrderFlow';
import { ExploreCard } from './Explore';

export const DesignThumb: React.FC<{ d: Design; className?: string }> = ({ d, className = '' }) =>
  d.previewDataUrl ? (
    <img src={d.previewDataUrl} alt={d.title} className={`w-full object-cover bg-white ${className}`} />
  ) : (
    <div className={`w-full bg-[#174D33]/[0.05] flex items-center justify-center ${className}`}>
      <GarmentArtFor garmentId={d.garmentId} className="w-1/2" />
    </div>
  );

export const SavedScreen: React.FC = () => {
  const nav = useNav();
  const toast = useToast();
  const { errorMessage } = useSession();
  const { draft, hasProgress, replaceDraft } = useDraft();
  const [designs, setDesigns] = useState<Design[] | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [error, setError] = useState('');
  const [boardId, setBoardId] = useState<string>('all');
  const [open, setOpen] = useState<Design | null>(null);
  const [sheet, setSheet] = useState<'' | 'new-board' | 'rename-board' | 'move' | 'notes' | 'board-menu'>('');
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState<'' | 'delete-design' | 'delete-board' | 'replace-draft'>('');
  const [pending, setPending] = useState<(() => void) | null>(null);

  const load = useCallback(() => {
    setError('');
    Promise.all([api.listDesigns(), api.listBoards()])
      .then(([d, b]) => {
        setDesigns(d);
        setBoards(b);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [errorMessage]);
  useEffect(load, [load]);

  const board = boards.find((b) => b.id === boardId);
  const visible = board
    ? board.items.map((i) => (i.kind === 'design' ? designs?.find((d) => d.id === i.refId) : EXPLORE_ITEMS.find((x) => x.id === i.refId))).filter(Boolean)
    : designs;

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  /** opening a design replaces the order in progress — ask first if there is one */
  const withDraft = (d: Design, then: () => void) => {
    const go = () => {
      replaceDraft(designToDraft(d));
      setOpen(null);
      then();
    };
    if (hasProgress && draft.designId !== d.id) {
      setPending(() => go);
      setConfirm('replace-draft');
    } else go();
  };

  return (
    <Screen
      title="Saved designs"
      onBack={nav.back}
      right={
        <button id="board-new" onClick={() => (setText(''), setSheet('new-board'))} className="h-9 px-3 rounded-full border border-black/15 text-[13px] font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Board
        </button>
      }
    >
      <div className="flex gap-2 overflow-x-auto pt-2 pb-3 -mx-4 px-4">
        <Chip selected={boardId === 'all'} onClick={() => setBoardId('all')}>
          All designs
        </Chip>
        {boards.map((b) => (
          <Chip key={b.id} id={`board-${b.title.replace(/\s/g, '-')}`} selected={boardId === b.id} onClick={() => setBoardId(b.id)}>
            {b.title} · {b.items.length}
          </Chip>
        ))}
      </div>
      {board && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-black/50 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Private board
          </span>
          <button aria-label="Board options" id="board-menu" onClick={() => setSheet('board-menu')} className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!designs && !error && <Spinner />}
      {visible && visible.length === 0 && (
        <EmptyState
          icon={<Bookmark className="w-7 h-7" />}
          title={board ? 'This board is empty' : 'No saved designs yet'}
          body={board ? 'Save designs or inspiration here to keep them together.' : 'Designs you save from the Studio or the order flow appear here. They’re private to you.'}
          action={
            <Button variant="secondary" onClick={() => nav.go({ name: 'explore' })}>
              Explore styles
            </Button>
          }
        />
      )}
      <div className="columns-2 gap-2.5">
        {visible?.map((item) =>
          item && 'ownerId' in item ? (
            <button key={item.id} id={`design-card-${item.id}`} onClick={() => setOpen(item)} className="w-full mb-2.5 break-inside-avoid rounded-[18px] border border-black/10 overflow-hidden text-left">
              <DesignThumb d={item} className={item.method === 'reference' ? 'aspect-[3/4]' : 'aspect-[3/5]'} />
              <div className="p-2.5">
                <div className="text-[13.5px] font-semibold leading-tight">{item.title}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.occasion && <span className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-black/10">{OCCASIONS.find((o) => o.id === item.occasion)?.label}</span>}
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-black/10">{item.status === 'draft' ? 'Draft' : 'Saved'}</span>
                </div>
                <div className="text-[11px] text-black/45 mt-1">Edited {formatDate(item.updatedAt)}</div>
              </div>
            </button>
          ) : item ? (
            <div key={item.id} className="break-inside-avoid mb-2.5">
              <ExploreCard item={item} onOpen={() => nav.go({ name: 'explore-item', id: item.id })} />
            </div>
          ) : null,
        )}
      </div>

      {/* design actions */}
      <Sheet open={!!open && !sheet} onClose={() => setOpen(null)} title={open?.title || ''}>
        {open && (
          <>
            <div className="flex gap-3 mb-3">
              <DesignThumb d={open} className="!w-24 h-36 rounded-2xl border border-black/10" />
              <div className="flex-1 text-[12.5px]">
                <div className="font-semibold text-[13.5px]">{garmentName(garmentById(open.garmentId))}</div>
                {open.size && <div className="text-black/55">Size {open.size}</div>}
                {describeStudio(open.studio)
                  .slice(0, 5)
                  .map((x) => (
                    <div key={x.label} className="text-black/55">
                      {x.label}: <span className="text-black">{x.value}</span>
                    </div>
                  ))}
                {open.notes && <div className="mt-1.5 p-2 rounded-lg bg-black/[0.03]">{open.notes}</div>}
              </div>
            </div>
            {open.method === 'studio' && (
              <ListRow id="design-edit" icon={<Pencil className="w-4 h-4" />} title="Open and edit" detail="In the Design Studio" onClick={() => withDraft(open, () => nav.go({ name: 'studio' }))} />
            )}
            <ListRow
              id="design-consult"
              icon={<CalendarCheck className="w-4 h-4" />}
              title="Start a consultation"
              onClick={() =>
                withDraft(open, () => {
                  const d = designToDraft(open);
                  const step = firstIncompleteStep(d);
                  nav.go(step < 6 ? { name: 'order', step } : { name: 'urgency' });
                })
              }
            />
            <ListRow id="design-resume" icon={<FolderInput className="w-4 h-4" />} title="Resume the order flow" detail="Review every step" onClick={() => withDraft(open, () => nav.go({ name: 'design-summary' }))} />
            <ListRow icon={<Bookmark className="w-4 h-4" />} title="Move to a board" onClick={() => setSheet('move')} id="design-move" />
            <ListRow icon={<NotebookPen className="w-4 h-4" />} title={open.notes ? 'Edit notes' : 'Add notes'} onClick={() => (setText(open.notes || ''), setSheet('notes'))} />
            <ListRow icon={<Copy className="w-4 h-4" />} title="Duplicate" onClick={() => void run(() => api.duplicateDesign(open.id), 'Design duplicated').then(() => setOpen(null))} />
            <ListRow icon={<Trash2 className="w-4 h-4" />} title="Remove from saved designs" onClick={() => setConfirm('delete-design')} id="design-delete" />
          </>
        )}
      </Sheet>

      <Sheet open={sheet === 'move'} onClose={() => setSheet('')} title="Move to board">
        {boards.map((b) => (
          <Choice
            key={b.id}
            selected={b.items.some((i) => i.refId === open?.id)}
            title={b.title}
            onClick={() => {
              const d = open!;
              setSheet('');
              setOpen(null);
              void run(() => api.addToBoard(b.id, { kind: 'design', refId: d.id }), `Moved to ${b.title}`);
            }}
          />
        ))}
      </Sheet>

      <Sheet
        open={sheet === 'notes'}
        onClose={() => setSheet('')}
        title="Notes"
        footer={
          <Button
            block
            onClick={() => {
              const d = open!;
              setSheet('');
              setOpen({ ...d, notes: text });
              void run(() => api.saveDesign({ ...d, notes: text }), 'Notes saved');
            }}
          >
            Save notes
          </Button>
        }
      >
        <TextArea maxLength={400} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ideas, fabric to use, who it’s for…" />
      </Sheet>

      <Sheet
        open={sheet === 'new-board' || sheet === 'rename-board'}
        onClose={() => setSheet('')}
        title={sheet === 'new-board' ? 'New board' : 'Rename board'}
        footer={
          <Button
            block
            id="board-save"
            disabled={!text.trim()}
            onClick={() => {
              setSheet('');
              void (sheet === 'new-board' ? run(() => api.createBoard(text), 'Board created') : run(() => api.renameBoard(boardId, text), 'Board renamed'));
            }}
          >
            Save
          </Button>
        }
      >
        <Field label="Board name">
          <Input id="board-name" value={text} onChange={(e) => setText(e.target.value)} autoFocus maxLength={40} />
        </Field>
      </Sheet>

      <Sheet open={sheet === 'board-menu'} onClose={() => setSheet('')} title={board?.title || ''}>
        <ListRow icon={<Pencil className="w-4 h-4" />} title="Rename board" onClick={() => (setText(board?.title || ''), setSheet('rename-board'))} />
        <ListRow icon={<Trash2 className="w-4 h-4" />} title="Delete board" detail="Designs stay in All designs" onClick={() => (setSheet(''), setConfirm('delete-board'))} />
      </Sheet>

      <ConfirmDialog
        open={confirm === 'delete-design'}
        title="Remove this design?"
        body="It will be removed from Saved Designs and all boards. Requests you already submitted keep their own copy."
        confirmLabel="Remove"
        danger
        onCancel={() => setConfirm('')}
        onConfirm={() => {
          const d = open!;
          setConfirm('');
          setOpen(null);
          void run(() => api.deleteDesign(d.id), 'Design removed');
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete-board'}
        title="Delete this board?"
        body="The board is deleted; the designs on it stay in All designs."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirm('')}
        onConfirm={() => {
          setConfirm('');
          const id = boardId;
          setBoardId('all');
          void run(() => api.deleteBoard(id), 'Board deleted');
        }}
      />
      <ConfirmDialog
        open={confirm === 'replace-draft'}
        title="Replace your order in progress?"
        body="You have an unfinished order. Opening this design will replace it."
        confirmLabel="Open design"
        onCancel={() => setConfirm('')}
        onConfirm={() => {
          setConfirm('');
          pending?.();
        }}
      />
    </Screen>
  );
};
