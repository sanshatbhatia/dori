/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Opens the existing Dori Design Studio with the order's context and takes its result back into
// the order draft. The Studio itself is unchanged apart from its entry/exit points.

import React from 'react';
import { DesignStudio } from '../../components/DesignStudio';
import { FABRIC_TYPES, OCCASIONS, garmentById, garmentName } from '../data/catalog';
import { api } from '../services';
import { useNav } from '../nav';
import { draftToDesign, useDraft } from '../state/orderDraft';
import { useCustomer, useSession } from '../state/session';

export const StudioScreen: React.FC = () => {
  const nav = useNav();
  const customer = useCustomer();
  const { errorMessage } = useSession();
  const { draft, update } = useDraft();
  const g = garmentById(draft.garmentId);

  const chips = [
    garmentName(g),
    draft.size && draft.size !== 'unsure' ? `Size ${draft.size}` : 'Size: stylist to confirm',
    OCCASIONS.find((o) => o.id === draft.occasion)?.label,
    draft.fabricType && `${FABRIC_TYPES.find((f) => f.id === draft.fabricType)?.label.split(' ')[0]} · ${draft.fabricLength || '?'} ${draft.fabricUnit}`,
    customer.fitProfile.heightCm ? `${customer.fitProfile.heightCm} cm` : undefined,
  ].filter(Boolean) as string[];

  return (
    <DesignStudio
      initial={draft.studio ? { selection: draft.studio.selection, beltLatkan: draft.studio.beltLatkan } : undefined}
      initialNotes={draft.studioNotes}
      context={{ title: g ? g.label : 'Design Studio', size: draft.size && draft.size !== 'unsure' ? draft.size : undefined, chips }}
      doneLabel="Done"
      onExit={async (action, r) => {
        if (action === 'back') {
          nav.back();
          return;
        }
        const studio = { studioGarment: 'lehenga' as const, selection: r.selection, beltLatkan: r.beltLatkan };
        const patch = { method: 'studio' as const, studio, studioNotes: r.notes, previewDataUrl: r.previewDataUrl || draft.previewDataUrl };
        update(patch);
        if (action === 'done') {
          nav.go({ name: 'design-summary' });
          return;
        }
        // Save draft: keeps the design in Saved Designs without creating an order
        try {
          const saved = await api.saveDesign({ ...draftToDesign({ ...draft, ...patch }, customer), status: 'draft' });
          update({ designId: saved.id });
          return 'Saved to Saved Designs — no order has been placed.';
        } catch (e) {
          throw new Error(errorMessage(e));
        }
      }}
    />
  );
};
