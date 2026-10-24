/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GARMENTS } from '../../data/garments';
import type { StudioConfig } from '../services/types';

/** Human-readable list of the Studio choices, in the Studio's own category order */
export const describeStudio = (cfg?: StudioConfig): { label: string; value: string }[] => {
  if (!cfg) return [];
  const g = GARMENTS[cfg.studioGarment];
  const out = g.cats
    .filter((c) => !(c.slot === 'drape' && cfg.selection.blouseFront === 'jacket'))
    .map((c) => ({ label: c.label, value: c.opts.find((o) => o.id === cfg.selection[c.id])?.name || '—' }));
  if (cfg.selection.blouseFront === 'jacket') out.push({ label: 'Dupatta Drape', value: 'None (jacket set)' });
  out.push({ label: 'Latkan', value: cfg.beltLatkan === 'none' ? 'None' : cfg.beltLatkan === 'light' ? 'Light' : 'Heavy' });
  return out;
};
