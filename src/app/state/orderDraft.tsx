/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The order in progress. Every step reads and writes this one draft, which is kept on the device
// so moving between sections (or a refresh) never loses the customer's answers.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { garmentById } from '../data/catalog';
import type {
  Customer,
  Design,
  FabricType,
  ID,
  Occasion,
  ReferenceImage,
  SizeCode,
  StudioConfig,
  StyleFamily,
} from '../services/types';
import { useSession } from './session';

export interface OrderDraft {
  fabricType?: FabricType;
  fabricLength: string;
  fabricUnit: 'm' | 'yd';
  fabricWidth: string;
  fabricWidthUnit: 'in' | 'cm';
  occasion?: Occasion;
  family?: StyleFamily;
  garmentId?: string;
  size?: SizeCode;
  method?: 'studio' | 'reference';
  studio?: StudioConfig;
  studioNotes: string;
  previewDataUrl?: string;
  references: ReferenceImage[];
  referenceUrl: string;
  changeNotes: string;
  /** the customer's final words — kept apart from everything selected automatically */
  description: string;
  designId?: ID;
  inspiredBy?: ID;
  urgencyId?: string;
  desiredDate: string;
  slotStart?: string;
  mode: 'video' | 'phone';
  addressId?: ID;
  /** one key per draft, so repeating a submission can't create a second request */
  idempotencyKey: string;
}

const newKey = () => `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const emptyDraft = (): OrderDraft => ({
  fabricLength: '',
  fabricUnit: 'm',
  fabricWidth: '',
  fabricWidthUnit: 'in',
  references: [],
  studioNotes: '',
  referenceUrl: '',
  changeNotes: '',
  description: '',
  desiredDate: '',
  mode: 'video',
  idempotencyKey: newKey(),
});

/** design record for saving, built from the draft (structured data, not just the picture) */
export const draftToDesign = (d: OrderDraft, c: Customer) => {
  const g = garmentById(d.garmentId);
  return {
    id: d.designId,
    title: g ? g.label : 'Untitled design',
    garmentId: d.garmentId || 'lehenga_set',
    styleFamily: d.family,
    occasion: d.occasion,
    size: d.size || (g?.sizeKey ? c.fitProfile.garmentSizes[g.sizeKey] : undefined) || c.fitProfile.usualSize,
    lining: g?.lining,
    method: d.method || 'studio',
    studio: d.method === 'studio' ? d.studio : undefined,
    studioNotes: d.method === 'studio' ? d.studioNotes || undefined : undefined,
    references: d.method === 'reference' ? d.references : [],
    referenceUrl: d.method === 'reference' ? d.referenceUrl || undefined : undefined,
    changeNotes: d.method === 'reference' ? d.changeNotes || undefined : undefined,
    fabric: d.fabricType
      ? {
          type: d.fabricType,
          length: Number(d.fabricLength) || 0,
          unit: d.fabricUnit,
          width: Number(d.fabricWidth) || undefined,
          widthUnit: d.fabricWidth ? d.fabricWidthUnit : undefined,
        }
      : undefined,
    description: d.description || undefined,
    previewDataUrl: d.method === 'studio' ? d.previewDataUrl : d.references[0]?.dataUrl,
    inspiredBy: d.inspiredBy,
    status: 'saved' as const,
  };
};

/** reopen a saved design as the order in progress */
export const designToDraft = (x: Design): OrderDraft => ({
  ...emptyDraft(),
  fabricType: x.fabric?.type,
  fabricLength: x.fabric?.length ? String(x.fabric.length) : '',
  fabricUnit: x.fabric?.unit || 'm',
  fabricWidth: x.fabric?.width ? String(x.fabric.width) : '',
  fabricWidthUnit: x.fabric?.widthUnit || 'in',
  occasion: x.occasion,
  family: x.styleFamily || garmentById(x.garmentId)?.family,
  garmentId: x.garmentId,
  size: x.size,
  method: x.method,
  studio: x.studio,
  studioNotes: x.studioNotes || '',
  previewDataUrl: x.method === 'studio' ? x.previewDataUrl : undefined,
  references: x.references,
  referenceUrl: x.referenceUrl || '',
  changeNotes: x.changeNotes || '',
  description: x.description || '',
  designId: x.id,
  inspiredBy: x.inspiredBy,
});

interface DraftCtx {
  draft: OrderDraft;
  update: (patch: Partial<OrderDraft>) => void;
  replaceDraft: (d: OrderDraft) => void;
  resetDraft: () => void;
  hasProgress: boolean;
}

const Ctx = createContext<DraftCtx | null>(null);

export const OrderDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customer } = useSession();
  const key = customer ? `dori.draft.${customer.id}` : '';
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      setDraft(raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft());
    } catch {
      setDraft(emptyDraft());
    }
  }, [key]);

  const persist = useCallback(
    (d: OrderDraft) => {
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(d));
      } catch {
        // storage full (large reference images): keep the draft in memory for this visit
      }
    },
    [key],
  );

  const update = useCallback(
    (patch: Partial<OrderDraft>) =>
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      }),
    [persist],
  );
  const replaceDraft = useCallback(
    (d: OrderDraft) => {
      persist(d);
      setDraft(d);
    },
    [persist],
  );
  const resetDraft = useCallback(() => replaceDraft(emptyDraft()), [replaceDraft]);

  const hasProgress = !!(draft.fabricType || draft.garmentId || draft.studio || draft.references.length);

  return <Ctx.Provider value={{ draft, update, replaceDraft, resetDraft, hasProgress }}>{children}</Ctx.Provider>;
};

export const useDraft = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDraft outside OrderDraftProvider');
  return c;
};
