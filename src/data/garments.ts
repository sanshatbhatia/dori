/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, ComponentOption, GarmentConfig, GarmentKey, SelectionState } from '../types';

const O = (id: string, name: string, extra?: Partial<ComponentOption>): ComponentOption => ({
  id,
  name,
  ...(extra || {}),
});

export const NECKS: ComponentOption[] = [
  O('notched', 'Notched Lapel'),
  O('sweetheart', 'Sweetheart'),
  O('princess', 'Princess'),
  O('round', 'Round'),
  O('square', 'Square'),
  O('vneck', 'V-Neck'),
  O('boat', 'Boat Neck'),
  O('halter', 'Halter'),
  O('high', 'High Neck'),
];

export const SLEEVES: ComponentOption[] = [
  O('flared', 'Flared Elbow'),
  O('threequarter', 'Three-Quarter'),
  O('full', 'Full'),
  O('elbow', 'Elbow'),
  O('bell', 'Bell'),
  O('short', 'Short'),
  O('cap', 'Cap'),
  O('sleeveless', 'Sleeveless'),
  O('puff', 'Puff'),
];

export const BACKS: ComponentOption[] = [
  O('roundBack', 'Round Back'),
  O('squareBack', 'Square Back'),
  O('deepBack', 'Deep Back'),
  O('keyholeBack', 'Keyhole'),
  O('tieBack', 'Tie Back'),
  O('cutOut', 'Cut-Out'),
];

export const BOTTOMS: ComponentOption[] = [
  O('pleated', 'Pleated Flare'),
  O('flared', 'Flared'),
  O('circular', 'Circular'),
  O('aline', 'A-Line'),
  O('panelled', 'Panelled'),
  O('straight', 'Straight'),
  O('tiered', 'Tiered'),
  O('mermaid', 'Mermaid'),
];

export const GARMENTS: Record<GarmentKey, GarmentConfig> = {
  lehenga: {
    name: 'Lehenga',
    desc: 'Bespoke bridal & festive lehenga ensemble with fitted blouse, flared skirt, and dupatta.',
    cats: [
      {
        id: 'blouseFront',
        label: 'Blouse Front',
        short: 'Blouse',
        slot: 'topStyle',
        opts: [
          O('fitted', 'Fitted'),
          O('peplum', 'Peplum'),
          O('corset', 'Corset'),
          O('wrap', 'Wrap'),
          O('jacket', 'Jacket'),
        ],
      },
      { id: 'neckline', label: 'Neckline', short: 'Neck', slot: 'neckline', opts: NECKS },
      { id: 'sleeves', label: 'Sleeves', short: 'Sleeve', slot: 'sleeves', opts: SLEEVES },
      { id: 'blouseBack', label: 'Blouse Back', short: 'Back', slot: 'back', opts: BACKS },
      { id: 'skirt', label: 'Skirt', short: 'Skirt', slot: 'bottom', opts: BOTTOMS },
      {
        id: 'skirtLength',
        label: 'Skirt Length',
        short: 'Length',
        slot: 'bottomLength',
        opts: [O('tea', 'Tea'), O('ankle', 'Ankle'), O('floor', 'Floor'), O('trail', 'Trail')],
      },
      {
        id: 'dupattaDrape',
        label: 'Dupatta Drape',
        short: 'Dupatta',
        slot: 'drape',
        opts: [
          O('oneShoulder', 'One Shoulder'),
          O('bothShoulders', 'Both Shoulders'),
          O('crossBody', 'Cross Body'),
          O('frontOpen', 'Front Open'),
          O('aroundBody', 'Around Body'),
        ],
      },
    ],
  },
};

// When an option forces another category to change, switch it to the look that goes with it
export const PREFERRED_WITH: Record<string, Record<string, string>> = {
  'blouseFront:corset': { neckline: 'square', sleeves: 'sleeveless' },
};

export function getDefaults(gk: GarmentKey = 'lehenga'): SelectionState {
  const g = GARMENTS[gk] || GARMENTS.lehenga;
  const s: SelectionState = {};
  g.cats.forEach((c) => {
    s[c.id] = c.opts[0].id;
  });
  s.blouseFront = 'fitted';
  s.neckline = 'notched';
  s.sleeves = 'flared';
  s.blouseBack = 'roundBack';
  s.skirt = 'pleated';
  s.skirtLength = 'floor';
  s.dupattaDrape = 'oneShoulder';
  return s;
}

export function checkCompatibilityReason(
  gk: GarmentKey,
  cat: Category,
  id: string,
  sel: SelectionState
): string | null {
  const g = GARMENTS[gk];
  const get = (slot: string) => {
    const c = g.cats.find((x) => x.slot === slot);
    return c ? sel[c.id] : null;
  };
  const top = get('topStyle');
  const neck = get('neckline');
  const bot = get('bottom');

  if (cat.slot === 'neckline' && top === 'corset' && ['sweetheart', 'square', 'vneck', 'princess'].indexOf(id) < 0) {
    return 'A corset bodice only carries a structured neckline — try Sweetheart or Square.';
  }

  if (cat.slot === 'sleeves') {
    if (neck === 'halter' && ['sleeveless', 'cap'].indexOf(id) < 0) {
      return 'A halter neckline leaves no shoulder seam to hang this sleeve from.';
    }
    if (top === 'corset' && ['sleeveless', 'cap', 'short', 'puff'].indexOf(id) < 0) {
      return "Corset construction can't carry a longer sleeve.";
    }
    if (top === 'jacket' && id === 'sleeveless') {
      return 'A jacket blouse is always sleeved.';
    }
  }

  if (cat.slot === 'back' && neck === 'halter' && ['deepBack', 'tieBack'].indexOf(id) < 0) {
    return 'A halter fastens at the neck, so the back stays open — Deep or Tie Back.';
  }

  if (cat.slot === 'bottom') {
    const len = get('bottomLength') || 'floor';
    const opt = cat.opts.find((o) => o.id === id);
    const geo = opt?.geo || id;
    
    if (geo === 'mermaid' && ['floor', 'trail'].indexOf(len) < 0) {
      return 'A mermaid line needs floor length or longer to hold its shape.';
    }
    if (geo === 'tiered' && ['tea', 'knee'].indexOf(len) > -1) {
      return 'Tiered skirts need room for the tiers — ankle or longer.';
    }
    if (geo === 'straight' && len === 'trail') {
      return "A straight skirt can't carry a trail.";
    }
  }

  if (cat.slot === 'bottomLength') {
    const botCat = g.cats.find((x) => x.slot === 'bottom');
    const botOpt = botCat?.opts.find((o) => o.id === bot);
    const geo = botOpt?.geo || bot;
    if (geo === 'mermaid' && ['floor', 'trail'].indexOf(id) < 0) {
      return 'A mermaid line needs floor length or longer to hold its shape.';
    }
    if (geo === 'tiered' && ['tea', 'knee'].indexOf(id) > -1) {
      return 'Tiered skirts need room for the tiers — ankle or longer.';
    }
    if (geo === 'straight' && id === 'trail') {
      return "A straight skirt can't carry a trail.";
    }
  }

  if (cat.slot === 'cuff' && sel.sleeves === 'short' && ['french', 'double'].indexOf(id) > -1) {
    return 'French cuffs need a long sleeve to fold back.';
  }

  return null;
}
