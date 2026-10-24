/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FocusConfig, SlotKey } from '../types';

export const STAGE_W = 460;
export const STAGE_H = 820;
export const STAGE_CX = 230;

export const GREEN = '#174d33';
export const GOLD = '#b68235';
export const INK = '#2b2724';
export const FABRIC = '#5b8f72';

export const mir = (p: number[][]): number[][] => p.map((q) => [STAGE_W - q[0], q[1]]);

export const poly = (p: number[][]): string =>
  'polygon(' + p.map((q) => q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px').join(',') + ')';

export const svgPath = (pts: number[][]): string =>
  'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';

export function resample(pts: number[][], n: number): number[][] {
  const P = pts.concat([pts[0]]);
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
    seg.push(d);
    total += d;
  }
  const out: number[][] = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const t = (total * k) / n;
    while (i < seg.length - 1 && acc + seg[i] < t) {
      acc += seg[i];
      i++;
    }
    const f = seg[i] ? (t - acc) / seg[i] : 0;
    out.push([P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]);
  }
  return out;
}

export const scaleX = (pts: number[][], k: number): number[][] =>
  pts.map((p) => [STAGE_CX + (p[0] - STAGE_CX) * k, p[1]]);

// Halter armhole (left): from the underarm, cut in diagonally up to the neck
export const HALTER_STRAP_OUTER_L: number[][] = [
  [180, 207], [183, 197], [187.5, 187], [192.5, 176], [197.5, 165], [202, 155], [205.5, 148], [208, 143],
];

export const NECK: Record<string, { pts: number[][]; sh?: [number, number] }> = {
  // Sweetheart: rounded curves over the bust sweeping in to a soft V at centre front
  sweetheart: {
    pts: [
      [187, 155],
      [188.5, 163],
      [191, 171],
      [195, 179],
      [200, 186],
      [206, 191.5],
      [212, 195],
      [218, 197.2],
      [223, 198.8],
      [227, 201.5],
      [230, 205],
      [233, 201.5],
      [237, 198.8],
      [242, 197.2],
      [248, 195],
      [254, 191.5],
      [260, 186],
      [265, 179],
      [269, 171],
      [271.5, 163],
      [273, 155],
    ],
  },
  round: {
    pts: [
      [198, 150],
      [199, 160],
      [202, 171],
      [206, 180],
      [212, 188],
      [220, 193],
      [230, 195],
      [240, 193],
      [248, 188],
      [254, 180],
      [258, 171],
      [261, 160],
      [262, 150],
    ],
  },
  // Wide square neck with strap-width shoulders, starting on the sloped shoulder seam
  square: {
    pts: [
      [187, 155],
      [188.5, 166],
      [190, 184],
      [192, 192],
      [198, 195.5],
      [214, 196],
      [230, 196],
      [246, 196],
      [262, 195.5],
      [268, 192],
      [270, 184],
      [271.5, 166],
      [273, 155],
    ],
  },
  // Deep V: clean, nearly straight sides from the shoulder seam to a point above the bust line
  vneck: {
    pts: [
      [190, 155],
      [195, 162.5],
      [201, 173],
      [207, 183.5],
      [213, 193.5],
      [219, 202.5],
      [224.5, 209],
      [230, 215],
      [235.5, 209],
      [241, 202.5],
      [247, 193.5],
      [253, 183.5],
      [259, 173],
      [265, 162.5],
      [270, 155],
    ],
  },
  // Wide, shallow boat neck running out along the sloped shoulder seam
  boat: {
    pts: [
      [178, 156.5],
      [192, 156],
      [210, 161],
      [230, 163.5],
      [250, 161],
      [268, 156],
      [282, 156.5],
    ],
  },
  keyhole: {
    pts: [
      [198, 150],
      [208, 156],
      [218, 162],
      [222, 172],
      [220, 192],
      [222, 216],
      [225, 232],
      [230, 236],
      [235, 232],
      [238, 216],
      [240, 192],
      [238, 172],
      [242, 162],
      [252, 156],
      [262, 150],
    ],
  },
  // Halter: the bodice is gathered into a ruched casing at the base of the neck; braided
  // cords run from its ends up round the neck
  halter: {
    pts: [
      [209, 142],
      [216, 141.2],
      [223, 140.8],
      [230, 140.6],
      [237, 140.8],
      [244, 141.2],
      [251, 142],
    ],
  },
  // Wide scoop with a small centre notch, measured from the reference artwork
  notched: {
    pts: [
      [185.9, 155.4],
      [191.2, 163.3],
      [196.4, 172],
      [201.6, 177.3],
      [206.9, 179.9],
      [212.1, 181.6],
      [217.3, 184.2],
      [222.6, 185.5],
      [226.7, 188.5],
      [228.6, 193],
      [230.0, 200],
      [231.4, 193],
      [233.3, 188.5],
      [237.4, 185.5],
      [242.7, 184.2],
      [247.9, 181.6],
      [253.1, 179.9],
      [258.4, 177.3],
      [263.6, 172],
      [268.8, 163.3],
      [274.1, 155.4],
    ],
  },
  high: {
    pts: [
      [212, 134],
      [214, 142],
      [217, 148],
      [222, 154],
      [230, 156],
      [238, 154],
      [243, 148],
      [246, 142],
      [248, 134],
    ],
  },
  shirtOpen: {
    pts: [
      [202, 146],
      [212, 168],
      [230, 176],
      [248, 168],
      [258, 146],
    ],
  },
};

export const BACK_CUTS: Record<string, { pts: number[][] }> = {
  roundBack: {
    pts: [
      [198, 150],
      [200, 166],
      [204, 184],
      [210, 202],
      [218, 216],
      [230, 222],
      [242, 216],
      [250, 202],
      [256, 184],
      [260, 166],
      [262, 150],
    ],
  },
  squareBack: {
    pts: [
      [196, 148],
      [196, 198],
      [199, 207],
      [206, 210],
      [230, 210],
      [254, 210],
      [261, 207],
      [264, 198],
      [264, 148],
    ],
  },
  // Deep V back traced from the back reference painting
  deepBack: {
    pts: [
      [186.5, 155],
      [187.5, 163],
      [189, 172],
      [192.9, 180.8],
      [198, 191],
      [206, 201.7],
      [214.7, 212],
      [220, 217.4],
      [226, 222.7],
      [230, 226.5],
      [234, 222.7],
      [240, 217.4],
      [245.3, 212],
      [254, 201.7],
      [262, 191],
      [267.1, 180.8],
      [271, 172],
      [272.5, 163],
      [273.5, 155],
    ],
  },
  // Keyhole back: a high, shallow round neck; the teardrop keyhole below it is drawn separately
  keyholeBack: {
    pts: [
      [188, 154],
      [198, 156.5],
      [209, 159],
      [220, 160.6],
      [230, 161.2],
      [240, 160.6],
      [251, 159],
      [262, 156.5],
      [272, 154],
    ],
  },
  // Tie back: a wide, shallow round neck; the tied window lower down is drawn separately
  tieBack: {
    pts: [
      [188, 154],
      [196, 159],
      [205, 164],
      [214, 167.5],
      [222, 169.3],
      [230, 170],
      [238, 169.3],
      [246, 167.5],
      [255, 164],
      [264, 159],
      [272, 154],
    ],
  },
  // Cut-out back: the neckline dips gently to a closure at the nape; the big diamond
  // cut-out below it is drawn separately
  cutOut: {
    pts: [
      [188, 154],
      [198, 155.6],
      [209, 157.4],
      [220, 159.2],
      [230, 161],
      [240, 159.2],
      [251, 157.4],
      [262, 155.6],
      [272, 154],
    ],
  },
};

export const TOP: Record<string, { right: number[][]; hemC?: number[][] }> = {
  // Cropped choli measured from the reference artwork: armpit to a short hem above the midriff
  fitted: {
    right: [
      [281.6, 215],
      [278.6, 226],
      [276.6, 233],
      [274.1, 240],
      [272.3, 247],
      [270.6, 254],
      [270.1, 258],
    ],
    hemC: [
      [255.6, 259],
      [240.6, 259.5],
      [230.0, 260],
      [219.4, 259.5],
      [204.4, 259],
    ],
  },
  // Fitted bodice to the natural waist, then a pleated peplum flaring to the high hip
  peplum: {
    right: [
      [281.6, 215],
      [278.6, 226],
      [276.6, 233],
      [274.1, 240],
      [272.3, 247],
      [270.6, 254],
      [270.1, 258],
      [270.3, 262],
      [279.8, 269.5],
      [286.6, 276.9],
      [292.7, 284.4],
      [298.3, 291.8],
      [303.7, 299.3],
      [308.8, 306.7],
      [313.7, 314.2],
      [318.4, 321.6],
      [323.1, 329.1],
      [327.6, 336.5],
      [332.0, 344.0],
    ],
    hemC: [
      [324.7, 346.3],
      [317.4, 347.9],
      [310.1, 351.2],
      [302.9, 352.9],
      [295.6, 351.8],
      [288.3, 352.9],
      [281.0, 353.9],
      [273.7, 354.7],
      [266.4, 358.0],
      [259.1, 357.4],
      [251.9, 356.4],
      [244.6, 356.7],
      [237.3, 356.9],
      [230.0, 357.0],
      [222.7, 356.9],
      [215.4, 356.7],
      [208.1, 356.4],
      [200.9, 357.4],
      [193.6, 358.0],
      [186.3, 354.7],
      [179.0, 353.9],
      [171.7, 352.9],
      [164.4, 351.8],
      [157.1, 352.9],
      [149.9, 351.2],
      [142.6, 347.9],
      [135.3, 346.3],
    ],
  },
  // Structured corset: boned hourglass bodice to a pointed V hem over the skirt waistband
  corset: {
    right: [
      [281.6, 215],
      [280.4, 224],
      [278, 233],
      [274.6, 242],
      [271.4, 250],
      [269.6, 257],
      [269.4, 263],
      [270.4, 270],
      [271.6, 276],
    ],
    hemC: [
      [267.4, 276.4],
      [263.3, 277.3],
      [259.1, 278.7],
      [255.0, 280.6],
      [250.8, 282.9],
      [246.6, 285.6],
      [242.5, 288.6],
      [238.3, 292.1],
      [234.2, 295.9],
      [230, 300],
      [225.8, 295.9],
      [221.7, 292.1],
      [217.5, 288.6],
      [213.4, 285.6],
      [209.2, 282.9],
      [205.0, 280.6],
      [200.9, 278.7],
      [196.7, 277.3],
      [192.6, 276.4],
    ],
  },
  // Jacket set: a cropped choli underneath (the open jacket itself is drawn over it)
  jacket: {
    right: [
      [281.6, 215],
      [278.6, 226],
      [276.6, 233],
      [274.1, 240],
      [272.3, 247],
      [270.6, 254],
      [270.1, 258],
    ],
    hemC: [
      [255.6, 259],
      [240.6, 259.5],
      [230.0, 260],
      [219.4, 259.5],
      [204.4, 259],
    ],
  },
  bodice: {
    right: [
      [306, 216],
      [298, 266],
      [290, 330],
    ],
  },
  shirtBody: {
    right: [
      [310, 214],
      [306, 300],
      [302, 392],
      [300, 428],
    ],
  },
  kurta: {
    right: [
      [312, 216],
      [308, 320],
      [304, 450],
      [302, 536],
    ],
  },
};

export const COLLAR: Record<string, number[][]> = {
  classic: [[196, 140], [228, 196], [230, 176], [232, 196], [264, 140], [258, 131], [230, 166], [202, 131]],
  spread: [[186, 140], [226, 190], [230, 172], [234, 190], [274, 140], [266, 131], [230, 162], [194, 131]],
  buttonDown: [[198, 138], [226, 186], [230, 170], [234, 186], [262, 138], [256, 130], [230, 160], [204, 130]],
  band: [[199, 132], [261, 132], [261, 153], [199, 153]],
  cuban: [[190, 142], [224, 208], [230, 182], [236, 208], [270, 142], [262, 130], [230, 172], [198, 130]],
  wing: [[200, 136], [224, 178], [230, 164], [236, 178], [260, 136], [254, 130], [230, 156], [206, 130]],
};

export const SLV: Record<string, { L: number; w: [number, number, number] } | null> = {
  sleeveless: null,
  cap: { L: 46, w: [30, 29, 28] },
  short: { L: 98, w: [30, 28, 27] },
  elbow: { L: 152, w: [30, 27, 26] },
  flared: { L: 168, w: [30, 28, 54] },
  threequarter: { L: 214, w: [30, 27, 24] },
  full: { L: 274, w: [30, 26, 20] },
  puff: { L: 106, w: [32, 54, 27] },
  bell: { L: 252, w: [30, 26, 72] },
};

export const BOT: Record<string, { profile: [number, number][]; scallop?: boolean }> = {
  pleated: { profile: [[0, 40.5], [0.015, 40.7], [0.03, 41], [0.036, 43], [0.045, 47.5], [0.055, 51.5], [0.069, 54.6], [0.083, 58.1], [0.1, 62.4], [0.134, 70.3], [0.169, 77.3], [0.203, 84.2], [0.302, 104.6], [0.389, 120.6], [0.473, 138.6], [0.56, 156.6], [0.644, 173.6], [0.731, 190.6], [0.817, 208.6], [0.886, 221.6]] },
  aline: { profile: [[0, 40], [0.028, 43.2], [0.12, 78], [0.24, 98], [0.5, 138], [0.75, 172], [1, 204]] },
  circular: { profile: [[0, 40], [0.028, 43.2], [0.12, 84], [0.24, 114], [0.45, 162], [0.7, 202], [1, 230]] },
  panelled: { profile: [[0, 40], [0.028, 43.2], [0.12, 80], [0.24, 102], [0.5, 146], [0.75, 186], [1, 216]], scallop: true },
  flared: { profile: [[0, 40], [0.028, 43.2], [0.12, 78], [0.24, 96], [0.48, 126], [0.72, 176], [1, 222]] },
  straight: { profile: [[0, 40], [0.028, 43.2], [0.12, 72], [0.24, 82], [0.45, 88], [0.75, 94], [1, 102]] },
  // three gathered tiers, each a little deeper and fuller than the one above (seams at 0.29 and 0.62)
  tiered: { profile: [[0, 40], [0.028, 43.2], [0.08, 52], [0.29, 77], [0.296, 82], [0.45, 98], [0.62, 117], [0.626, 123], [0.8, 150], [1, 184]] },
  // fitted through the hips and thighs to the knee, then flaring out into a wide hem
  mermaid: { profile: [[0, 40], [0.028, 43.2], [0.1, 62], [0.2, 72], [0.32, 70], [0.44, 61], [0.53, 59], [0.6, 64], [0.68, 84], [0.78, 124], [0.89, 172], [1, 212]] },
  trouser: { profile: [[0, 40], [0.028, 43.2], [0.12, 72], [0.24, 80], [0.5, 78], [1, 74]] },
};

export const LENV: Record<string, number> = {
  knee: 215,
  tea: 275,
  midi: 331,
  ankle: 381,
  floor: 509,
  trail: 551,
};

export const FAB: Record<string, { c: string; op: number }> = {
  sage: { c: '#7e9f8a', op: 0.95 },
  net: { c: '#f6ece1', op: 0.55 },
  organza: { c: '#f6e4c8', op: 0.68 },
  silk: { c: '#eecfa0', op: 0.9 },
  banarasi: { c: '#e0bb80', op: 0.95 },
  velvet: { c: '#8a5f4a', op: 0.95 },
};

export interface FabricTheme {
  id: string;
  name: string;
  baseColor: string;
  topGradient: string;
  botGradient: string;
  drapeColor: string;
  drapeOpacity: number;
  outlineColor: string;
  accentColor: string;
  seamOpacity: number;
  borderStyle: 'gotapatti' | 'velvet' | 'lace' | 'wire' | 'classic';
  texKey: string;
}

export const FABRIC_THEMES: Record<string, FabricTheme> = {
  sage: {
    id: 'sage',
    name: 'Atelier Sage Linen',
    baseColor: '#7e9f8a',
    topGradient: 'linear-gradient(160deg, #88aa95 0%, #7e9f8a 60%, #6d8e79 100%)',
    botGradient: 'linear-gradient(165deg, #84a691 0%, #789984 65%, #658671 100%)',
    drapeColor: '#f4ede4',
    drapeOpacity: 0.88,
    outlineColor: '#243329',
    accentColor: '#c59d74',
    seamOpacity: 0.85,
    borderStyle: 'classic',
    texKey: 'plain',
  },
  banarasi: {
    id: 'banarasi',
    name: 'Banarasi Zari',
    baseColor: '#2b5f4a',
    topGradient: 'linear-gradient(160deg, #336e56 0%, #255541 55%, #193e2f 100%)',
    botGradient: 'linear-gradient(165deg, #2c634d 0%, #204c3a 60%, #153528 100%)',
    drapeColor: '#d6a84f',
    drapeOpacity: 0.92,
    outlineColor: '#121214',
    accentColor: '#e0b43c',
    seamOpacity: 0.85,
    borderStyle: 'gotapatti',
    texKey: 'banarasi',
  },
  velvet: {
    id: 'velvet',
    name: 'Royal Velvet',
    baseColor: '#582436',
    topGradient: 'linear-gradient(160deg, #662c41 0%, #4d1e2f 55%, #351320 100%)',
    botGradient: 'linear-gradient(165deg, #5c263a 0%, #431929 60%, #2e0f1b 100%)',
    drapeColor: '#7a3e52',
    drapeOpacity: 0.94,
    outlineColor: '#0e0b10',
    accentColor: '#d8b068',
    seamOpacity: 0.9,
    borderStyle: 'velvet',
    texKey: 'velvet',
  },
  silk: {
    id: 'silk',
    name: 'Silk Chiffon',
    baseColor: '#477860',
    topGradient: 'linear-gradient(160deg, #538c70 0%, #3e6d56 55%, #2a4c3b 100%)',
    botGradient: 'linear-gradient(165deg, #4b8066 0%, #37614d 60%, #244234 100%)',
    drapeColor: '#eecfa0',
    drapeOpacity: 0.88,
    outlineColor: '#141716',
    accentColor: '#9ecbb3',
    seamOpacity: 0.78,
    borderStyle: 'classic',
    texKey: 'silk',
  },
  organza: {
    id: 'organza',
    name: 'Organza',
    baseColor: '#5d8e78',
    topGradient: 'linear-gradient(160deg, #6fa38b 0%, #54846e 55%, #3b604e 100%)',
    botGradient: 'linear-gradient(165deg, #649680 0%, #4c7763 60%, #355646 100%)',
    drapeColor: '#f6e4c8',
    drapeOpacity: 0.76,
    outlineColor: '#161918',
    accentColor: '#c8ecd8',
    seamOpacity: 0.7,
    borderStyle: 'wire',
    texKey: 'organza',
  },
  net: {
    id: 'net',
    name: 'Sheer Net',
    baseColor: '#53826b',
    topGradient: 'linear-gradient(160deg, #659a80 0%, #497660 55%, #335544 100%)',
    botGradient: 'linear-gradient(165deg, #5b8d74 0%, #426c57 60%, #2c4a3b 100%)',
    drapeColor: '#f6ece1',
    drapeOpacity: 0.65,
    outlineColor: '#141615',
    accentColor: '#e4f2e9',
    seamOpacity: 0.65,
    borderStyle: 'lace',
    texKey: 'net',
  },
};

export const DRP: Record<string, number[][][]> = {
  // Pallu over the right shoulder, falling down the side to the hem
  oneShoulder: [
    [[248, 146], [276, 148], [288, 230], [298, 305], [320, 460], [342, 600], [354, 690], [306, 690], [296, 600], [278, 460], [266, 305], [258, 230]],
  ],
  // Draped over both shoulders, falling behind the arms on each side
  bothShoulders: [
    [[184, 148], [208, 146], [196, 230], [186, 330], [172, 470], [160, 640], [124, 640], [140, 470], [158, 330], [172, 230]],
    [[252, 146], [276, 148], [288, 230], [302, 330], [320, 470], [336, 640], [300, 640], [288, 470], [274, 330], [264, 230]],
  ],
  // From the right shoulder across the bodice to the left hip, then down
  crossBody: [
    [[248, 146], [276, 148], [270, 214], [226, 282], [186, 330], [176, 460], [166, 620], [130, 620], [146, 452], [160, 318], [208, 252], [250, 196]],
  ],
  // Two open panels framing the front of the lehenga
  frontOpen: [
    [[198, 148], [214, 150], [208, 300], [198, 460], [190, 690], [162, 690], [172, 460], [182, 300]],
    [[246, 150], [262, 148], [278, 300], [288, 460], [298, 690], [270, 690], [262, 460], [252, 300]],
  ],
  // Wrapped around the hips with the pallu tucked and falling at the right
  aroundBody: [
    [[168, 318], [292, 300], [300, 344], [176, 366]],
    [[272, 306], [304, 300], [326, 470], [338, 640], [302, 644], [292, 470]],
  ],
};

export const TEXL: Record<string, number> = {
  plain: 0,
  piping: 7,
  embroidered: -7,
  pleat: 12,
  buttons: -3,
  sheer: 6,
};

export const BASE_ZOOM = 0.647;

export const FOCUS: Record<SlotKey, FocusConfig> = {
  topStyle: { cy: 250, z: 0.95, view: 'detail' },
  neckline: { cy: 200, z: 1.35, view: 'detail' },
  collar: { cy: 186, z: 1.45, view: 'detail' },
  sleeves: { cy: 250, z: 1.05, view: 'detail' },
  cuff: { cy: 336, z: 1.15, view: 'detail' },
  back: { cy: 226, z: 1.1, view: 'back' },
  bottom: { cy: 520, z: 0.72, view: 'detail' },
  bottomLength: { cy: 550, z: 0.64, view: 'detail' },
  fabric: { cy: 396, z: 0.6, view: 'front' },
  drape: { cy: 384, z: 0.58, view: 'front' },
  waist: { cy: 330, z: 1.1, view: 'detail' },
  hemY: { cy: 376, z: 0.9, view: 'detail' },
  texture: { cy: 260, z: 0.95, view: 'front' },
  fit: { cy: 306, z: 0.72, view: 'front' },
};

export const PSC: Record<SlotKey, number> = {
  topStyle: 0.34,
  neckline: 0.46,
  collar: 0.5,
  sleeves: 0.36,
  cuff: 0.42,
  back: 0.38,
  bottom: 0.17,
  bottomLength: 0.14,
  fabric: 0.42,
  drape: 0.3,
  waist: 0.4,
  hemY: 0.3,
  texture: 0.3,
  fit: 0.24,
};

export const LEG_L: number[][] = [
  // Outer hip / upper thigh
  [161, 450],
  // Outer thigh - smooth clean taper
  [164, 485],
  [168, 530],
  [173, 575],
  // Knee - subtle gentle contour
  [175, 606],
  // Calf - smooth gentle curve
  [173, 650],
  [176, 705],
  // Ankle - slender silhouette
  [180, 755],
  // Stylized 2D foot
  [179, 780], // Heel back
  [180, 794], // Heel bottom
  [196, 794], // Sole ground contact
  [202, 791], // Sleek stylized toe
  [194, 770], // Instep
  // Inner leg going upward
  [189, 755], // Inner ankle
  [184, 705], // Inner calf
  [186, 650], // Inner knee
  [188, 606],
  // Inner thigh - smooth upward curve to crotch
  [191, 550],
  [198, 500],
  [210, 470],
  [228, 452], // Crotch
];

export const LEG_R: number[][] = mir(LEG_L);

export const BODY: number[][] = [
  // Neck top (matches the painted neck under the face)
  [218.2, 120], [244.8, 120],
  // Right shoulder, bust, waist, hip (sloped shoulders and slim waist from the reference artwork)
  [244.8, 128], [245.6, 133], [247.4, 137], [250.6, 140.5], [255, 143.8], [259.6, 148], [274.1, 155.4], [283.6, 157.4], [292.6, 160], [298.6, 168], [299.6, 180], [293.6, 196], [285.6, 210], [279.6, 222], [275.6, 236], [271.6, 250], [269.2, 257], [267.4, 263], [267.2, 268], [268.4, 274], [270.5, 282],
  [273.6, 300], [277.6, 330], [295.6, 368], [299.6, 410], [297.6, 435],
  // Right human-contoured leg
  ...LEG_R,
  // Perineum / crotch arch center
  [230, 451.5],
  // Left human-contoured leg
  ...[...LEG_L].reverse(),
  // Left hip (going up from [161, 450])
  [158, 435], [156, 410], [160, 368], [178, 330],
  // Left waist, bust, shoulder, neck
  [186.4, 300], [189.5, 282], [191.6, 274], [192.8, 268], [192.6, 263], [190.8, 257], [188.4, 250], [184.4, 236], [180.4, 222], [174.4, 210], [166.4, 196], [160.4, 180], [161.4, 168], [167.4, 160], [176.4, 157.4], [185.9, 155.4], [200.4, 148], [205, 143.8], [209.4, 140.5], [212.6, 137], [214.4, 133], [215.2, 128],
];

export const ARM_L: number[][] = [
  [164, 159], // Top shoulder cap
  [158, 159.5],
  [152, 161],
  [147, 164],
  [143, 169], // Outer shoulder round
  [140.5, 178],
  [140, 190], // Outer upper arm
  [140, 240], // Outer bicep
  [138, 290], // Outer elbow
  [136, 350], // Outer forearm
  [138, 412], // Outer wrist
  [135, 435], // Outer palm
  [140, 468], // Fingertips
  [144, 468], // Fingertips inner
  [149, 440], // Inner palm
  [155, 412], // Inner wrist
  [158, 350], // Inner forearm
  [161, 290], // Inner elbow
  [165, 240], // Inner bicep
  [168, 190], // Inner armpit
  [173, 156], // Inner shoulder joint
  [168, 148], // Shoulder joint top
];

export const ARM_R: number[][] = mir(ARM_L);

// Outstretched arms (sideways mannequin pose)
export const ARM_OUT_L: number[][] = [
  [164, 158], // Top shoulder cap (sits under the sloped shoulder seam)
  [156, 158.5], // Outer shoulder transition curve
  [146, 157],
  [134, 154],
  [122, 151], // Upper arm top
  [96, 152],  // Elbow top
  [70, 155],  // Forearm top
  [44, 158],  // Wrist top
  [28, 160],  // Palm top
  [14, 165],  // Fingertip outer
  [14, 169],  // Fingertip inner
  [28, 173],  // Palm bottom
  [44, 172],  // Wrist under
  [70, 174],  // Forearm under
  [96, 176],  // Elbow under
  [122, 178], // Bicep under
  [146, 180], // Underarm
  [168, 184], // Inner armpit
  [172, 162], // Inner shoulder joint
  [168, 159], // Shoulder joint top
];

export const ARM_OUT_R: number[][] = mir(ARM_OUT_L);

// Stretch pose swings the outstretched arms down into an A-pose around the shoulder joint
export const A_POSE_ANGLE = (58 * Math.PI) / 180;
export const A_POSE_PIVOT: [number, number] = [170, 162];
// The outstretched arm is lengthened from the shoulder to the wrist by this factor
export const ARM_REACH_SCALE = 1.9;
export const ARM_REACH_START = 150;
export const ARM_WRIST_X = 44;

export function colorMix(base: string, tint: 'white' | 'black', pct: number): string {
  return `color-mix(in oklab, ${base}, ${tint} ${Math.max(0, Math.min(100, Math.round(pct)))}%)`;
}

export function fillGradient(base: string, texKey: string, lift = 0): string {
  const t = (TEXL[texKey] != null ? TEXL[texKey] : 0) + lift;
  const startColor = t + 15 < 0 ? colorMix(base, 'black', -(t + 15)) : colorMix(base, 'white', t + 15);
  const midColor = t + 3 < 0 ? colorMix(base, 'black', -(t + 3)) : colorMix(base, 'white', t + 3);
  const endColor = 8 - t < 0 ? colorMix(base, 'white', -(8 - t)) : colorMix(base, 'black', 8 - t);
  return `linear-gradient(163deg, ${startColor} 0%, ${midColor} 62%, ${endColor} 100%)`;
}

// Painted artwork cut from the reference design, placed in stage units.
// Fabric and skin are textures that the garment shapes clip, so every option
// keeps the painted look; the rest are cut-outs drawn as they are.
export const PAINTED = {
  skirt: { href: '/assets/painted/skirt-texture.png', x: -70.7, y: 262.8, w: 698.4, h: 680.9 },
  blouse: { href: '/assets/painted/blouse-texture.png', x: -114.4, y: 131.9, w: 785.7, h: 419.0 },
  skin: { href: '/assets/painted/skin-texture.png', x: 138.8, y: 123.1, w: 192.1, h: 357.9 },
  armsStretch: { href: '/assets/painted/arms-stretch.png', x: 16.6, y: 255.8, w: 426.9, h: 146.7 },
  latkan: { href: '/assets/painted/latkan.png', x: 154.5, y: 278.5, w: 48.9, h: 182.5 },
  dupattaOneShoulder: { href: '/assets/painted/dupatta-one-shoulder.png', x: 261.0, y: 145.0, w: 228.7, h: 598.0 },
};
// Where the painted latkan hangs from the waistband (light size scales around it)
export const PAINTED_LATKAN_ANCHOR: [number, number] = [178.9, 285.5];

// Scalloped pleated hem traced from the reference artwork (left half, outer corner to centre front)
export const PAINTED_HEM_L: number[][] = [[11.3, 721.1], [18.3, 724.6], [25.3, 729.0], [32.3, 730.7], [35.8, 733.4], [39.3, 740.3], [46.2, 744.7], [53.2, 747.3], [60.2, 750.0], [67.2, 750.0], [74.2, 750.8], [77.7, 752.6], [81.2, 756.9], [88.1, 760.4], [95.1, 763.0], [102.1, 765.7], [109.1, 766.5], [116.1, 768.3], [123.1, 769.2], [130.0, 768.3], [133.5, 769.2], [137.0, 772.6], [144.0, 774.4], [151.0, 776.1], [158.0, 777.9], [168.5, 777.9], [178.9, 777.9], [185.9, 777.0], [192.9, 776.1], [199.9, 776.1], [203.4, 777.9], [206.9, 782.3], [213.9, 784.0], [220.8, 784.0], [226.4, 785.7], [230.0, 785.7]];

// Flared elbow sleeve in the stretch pose, traced from the reference artwork:
// armpit, down the inner edge, across the hem, and up the outer edge to the shoulder tip
export const PAINTED_FLARED_SLEEVE_L: number[][] = [[178.4, 215], [175.4, 219.2], [173.7, 226.2], [171.1, 233.1], [169.3, 240.1], [166.7, 247.1], [165.0, 254.1], [162.3, 261.1], [160.6, 268.1], [158.0, 275], [156.2, 282], [154.5, 289], [151.9, 296], [150.1, 303], [147.5, 310], [144.4, 312.5], [141.4, 310], [123.1, 303], [117.8, 296], [113.5, 289], [106.5, 282], [88.1, 275], [82.9, 268.1], [81.2, 261.1], [87.3, 254.1], [93.4, 247.1], [99.5, 240.1], [105.6, 233.1], [110.8, 226.2], [116.9, 219.2], [122.2, 212.2], [128.3, 205.2], [133.5, 198.2], [139.6, 191.2], [144.9, 184.2], [150.1, 177.3], [155.4, 170.3], [163.2, 163.3], [167.4, 160]];

// Stretch-pose arm skeleton traced from the reference artwork (left arm): shoulder joint, elbow and
// wrist, with the arm's half-width at each. Painted forearms, drawn upper arms and every sleeve
// are built along it, so they meet whichever blouse, neckline or sleeve is chosen.
export const PAINTED_ARM_L = {
  shoulder: [166, 190] as [number, number],
  elbow: [127, 274] as [number, number],
  wrist: [68, 342] as [number, number],
  halfWidth: [13, 8.8, 5.5] as [number, number, number],
  tip: [167.4, 160] as [number, number],
  armpit: [178.4, 215] as [number, number],
};

const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]];
const len = (v: number[]) => Math.hypot(v[0], v[1]);
const unit = (v: number[]) => [v[0] / len(v), v[1] / len(v)];
export const ARM_UPPER_LEN = len(sub(PAINTED_ARM_L.elbow, PAINTED_ARM_L.shoulder));
export const ARM_FORE_LEN = len(sub(PAINTED_ARM_L.wrist, PAINTED_ARM_L.elbow));

/** Point, direction and half-width at distance s down the left arm from the shoulder joint.
 *  n is the side facing away from the body. */
export function armAt(s: number) {
  const { shoulder: S, elbow: E, wrist: Wr, halfWidth: hw } = PAINTED_ARM_L;
  const t1 = unit(sub(E, S));
  const t2 = unit(sub(Wr, E));
  const p = s <= ARM_UPPER_LEN
    ? [S[0] + t1[0] * s, S[1] + t1[1] * s]
    : [E[0] + t2[0] * (s - ARM_UPPER_LEN), E[1] + t2[1] * (s - ARM_UPPER_LEN)];
  // ease the direction round the elbow so offset edges don't kink
  const k = Math.min(1, Math.max(0, (s - ARM_UPPER_LEN + 12) / 24));
  const e = k * k * (3 - 2 * k);
  const t = unit([t1[0] + (t2[0] - t1[0]) * e, t1[1] + (t2[1] - t1[1]) * e]);
  const w = s <= ARM_UPPER_LEN
    ? hw[0] + (hw[1] - hw[0]) * Math.max(0, s / ARM_UPPER_LEN)
    : hw[1] + (hw[2] - hw[1]) * Math.min(1, (s - ARM_UPPER_LEN) / ARM_FORE_LEN);
  return { p, t, w, n: [-t[1], t[0]] };
}

// Sleeve cut along the painted arm: length from the shoulder joint, ease over the arm,
// flare toward the hem (from flareFrom), and puff volume over the middle
export const PAINTED_SLEEVES: Record<string, { len: number; ease: number; flare: number; flareFrom?: number; puff: number }> = {
  cap: { len: 30, ease: 4, flare: 3, puff: 0 },
  short: { len: 52, ease: 3.5, flare: 2, puff: 0 },
  puff: { len: 56, ease: 3, flare: 0, puff: 9 },
  elbow: { len: 98, ease: 3, flare: 2, puff: 0 },
  threequarter: { len: 146, ease: 2.5, flare: 1, puff: 0 },
  full: { len: 178, ease: 2, flare: 0, puff: 0 },
  bell: { len: 176, ease: 3, flare: 26, flareFrom: 100, puff: 0 },
};

// Open-front jacket worn over the choli (left front panel; the right one is its mirror).
// Neck point, down the front opening to the hem, across to the side, up to the armpit,
// and along the shoulder seam back to the neck.
export const JACKET_PANEL_L: number[][] = [
  [199, 145.5], [195.6, 158], [192.4, 172], [190, 186], [188.5, 212], [189, 240], [191.5, 270], [195, 302], [199.5, 337], [204, 372],
  [186, 373.5], [166, 371.5], [146, 367],
  [150.5, 336], [157, 302], [165, 270], [171, 244], [176, 224], [178.4, 215],
  [175, 192], [172, 172], [167.4, 160], [174, 156.4], [181, 153.4], [188.5, 150], [194, 147.6],
];
// Inner edge of the front opening, top to hem: where the embroidered placket runs
export const JACKET_OPENING_L: number[][] = [
  [199, 145.5], [195.6, 158], [192.4, 172], [190, 186], [188.5, 212], [189, 240], [191.5, 270], [195, 302], [199.5, 337], [204, 372],
];

// Back view painted from design/reference-lehenga-back.webp (scripts/painted-assets/build_back.py)
export const PAINTED_BACK = {
  skirt: { href: '/assets/painted/skirt-texture-back.png', x: -70.7, y: 262.8, w: 698.4, h: 680.9 },
  blouse: { href: '/assets/painted/blouse-texture-back.png', x: -114.4, y: 131.9, w: 785.7, h: 419.0 },
  skin: { href: '/assets/painted/skin-texture-back.png', x: 138.8, y: 123.1, w: 192.1, h: 357.9 },
  head: { href: '/assets/painted/head-back.png', x: 195.5, y: 40.2, w: 92.5, h: 254.9 },
  armsStretch: { href: '/assets/painted/arms-stretch-back.png', x: 16.6, y: 255.8, w: 426.9, h: 155.4 },
  dupattaOneShoulder: { href: '/assets/painted/dupatta-one-shoulder-back.png', x: 279.3, y: 154.6, w: 185.9, h: 575.3 },
};

// Scalloped hem of the back painting (left half, outer corner to centre back)
export const PAINTED_HEM_BACK_L: number[][] = [[11.3, 728.1], [18.3, 732.5], [25.3, 736.0], [32.3, 744.7], [39.3, 748.2], [46.2, 750.8], [53.2, 751.7], [60.2, 757.8], [67.2, 760.4], [74.2, 763.0], [81.2, 764.8], [88.1, 765.7], [95.1, 766.5], [102.1, 767.4], [109.1, 771.8], [116.1, 773.5], [123.1, 776.1], [130.0, 777.0], [137.0, 777.0], [144.0, 777.9], [151.0, 778.8], [158.0, 778.8], [165.0, 776.1], [171.9, 779.6], [178.9, 780.5], [185.9, 780.5], [192.9, 781.4], [199.9, 780.5], [206.9, 781.4], [213.9, 784.0], [220.8, 784.0], [227.8, 784.9], [230, 784.9]];


// Halter seen from the back: an open back with a band across the lower back, laced up the
// centre; the neck cords cross in an X down to the top of the lacing
export const HALTER_BACK_TOP: number[][] = [[181, 210], [205, 211], [230, 211.5], [255, 211], [279, 210]];
export const HALTER_LACING = { top: 211.5, bottom: 259, gap: 6, loops: [216, 225.5, 235, 244.5] };

// Teardrop keyhole below the back neck, closed at the top by a button and loop
export const KEYHOLE_BACK = { top: 165, bottom: 236, half: 14, widest: 0.48 };

// Tie back window: open from below the shoulder blades down through the hem, its sides
// drawn together by two rows of tied cords
export const TIE_BACK_WINDOW = { top: 198, bottom: 262, topHalf: 36, bottomHalf: 29, r: 9, rows: [231, 250] };

// Cut-out back: a large diamond opening from a button at the nape to a button just above the
// hem, widest across the mid back
export const CUT_OUT_BACK = { top: 163, bottom: 251, half: 36, upperY: 200, lowerY: 225 };

// Dupatta drapes styled after the references (stage units, front view). Each piece has its outline,
// the edges that carry the gold zari border, and fold lines; `butis` scatters small motifs.
export type DrapePiece = { poly: number[][]; borders: number[][][]; folds: number[][][]; butis?: boolean };
const capeL: DrapePiece = {
  // over the shoulder like a cape, falling outside the arm to below the knee; embroidered front edge and hem
  poly: [[208,  160],  [186,  164],  [164,  170],  [140,  177],  [122,  184],  [104,  230],  [92,  320],  [84,  420],  [78,  520],  [72,  604],  [100,  622],  [130,  634],  [156,  640],  [176,  640],  [179,  500],  [183,  380],  [189,  280],  [198,  200]],
  borders: [[[208,  160],  [198,  200],  [189,  280],  [183,  380],  [179,  500],  [176,  640]], [[72,  604],  [100,  622],  [130,  634],  [156,  640],  [176,  640]]],
  folds: [[[186.7,  165.3],  [170.7,  240.0],  [160.7,  330.0],  [155.3,  430.0],  [150.0,  530.0],  [143.3,  632.7]],  [[193.3,  164.7],  [181.3,  240.0],  [173.3,  330.0],  [168.7,  430.0],  [164.0,  530.0],  [158.7,  635.3]],  [[150,  175],  [128,  260],  [116,  360],  [108,  460],  [100,  620]]],
  butis: true,
};
const mirP = (p: DrapePiece): DrapePiece => ({
  poly: p.poly.map(([x, y]) => [460 - x, y]),
  borders: p.borders.map((b) => b.map(([x, y]) => [460 - x, y])),
  folds: p.folds.map((b) => b.map(([x, y]) => [460 - x, y])),
  butis: p.butis,
});
export const DRAPES: Record<string, DrapePiece[]> = {
  bothShoulders: [capeL, mirP(capeL)],
  crossBody: [
    // over the left shoulder, falling down the side behind the arm
    {
      poly: [[256,  160],  [290,  166],  [322,  176],  [342,  186],  [352,  260],  [362,  380],  [372,  520],  [380,  640],  [356,  648],  [330,  652],  [320,  520],  [308,  380],  [296,  260],  [276,  190]],
      borders: [[[342,  186],  [352,  260],  [362,  380],  [372,  520],  [380,  640]], [[380,  640],  [356,  648],  [330,  652]]],
      folds: [[[298.7,  174.7],  [320.0,  260.0],  [333.3,  380.0],  [345.3,  520.0],  [354.7,  640.0]],  [[307.3,  177.3],  [328.0,  260.0],  [340.7,  380.0],  [352.7,  520.0],  [361.3,  640.0]]],
    },
    // pleated swag across the front from the left shoulder down to the right hip
    {
      poly: [[300,  172],  [262,  214],  [226,  254],  [190,  290],  [158,  318],  [150,  384],  [240,  346],  [290,  302],  [324,  244],  [338,  192]],
      borders: [[[338,  192],  [324,  244],  [290,  302],  [240,  346],  [150,  384]]],
      folds: [[[307.6,  176.0],  [274.4,  220.0],  [238.8,  263.6],  [200.0,  301.2],  [156.4,  331.2]],  [[315.2,  180.0],  [286.8,  226.0],  [251.6,  273.2],  [210.0,  312.4],  [154.8,  344.4]],  [[322.8,  184.0],  [299.2,  232.0],  [264.4,  282.8],  [220.0,  323.6],  [153.2,  357.6]],  [[330.4,  188.0],  [311.6,  238.0],  [277.2,  292.4],  [230.0,  334.8],  [151.6,  370.8]]],
    },
    // the end, tucked at the right hip and falling down the skirt
    {
      poly: [[150,  318],  [186,  334],  [182,  440],  [174,  560],  [168,  654],  [142,  660],  [116,  662],  [124,  540],  [134,  430],  [142,  340]],
      borders: [[[142,  340],  [134,  430],  [124,  540],  [116,  662]], [[116,  662],  [142,  660],  [168,  654]]],
      folds: [[[164,  340],  [158,  450],  [150,  560],  [142,  656]]],
    },
  ],
  aroundBody: [
    // pleated band from the right shoulder across the body to the left hip
    {
      poly: [[178,  164],  [206,  158],  [240,  200],  [270,  240],  [300,  275],  [330,  306],  [300,  372],  [256,  330],  [214,  282],  [176,  232],  [150,  184]],
      borders: [[[206,  158],  [240,  200],  [270,  240],  [300,  275],  [330,  306]], [[150,  184],  [176,  232],  [214,  282],  [256,  330],  [300,  372]]],
      folds: [[[196.7,  162.3],  [229.3,  205.3],  [260.7,  247.0],  [292.7,  284.2],  [325.0,  317.0]],  [[187.3,  166.7],  [218.7,  210.7],  [251.3,  254.0],  [285.3,  293.3],  [320.0,  328.0]],  [[178.0,  171.0],  [208.0,  216.0],  [242.0,  261.0],  [278.0,  302.5],  [315.0,  339.0]],  [[168.7,  175.3],  [197.3,  221.3],  [232.7,  268.0],  [270.7,  311.7],  [310.0,  350.0]],  [[159.3,  179.7],  [186.7,  226.7],  [223.3,  275.0],  [263.3,  320.8],  [305.0,  361.0]]],
    },
    // the end, falling from the left hip with a bordered hem
    {
      poly: [[300,  330],  [334,  300],  [348,  380],  [360,  500],  [370,  620],  [346,  630],  [318,  636],  [312,  500],  [304,  400]],
      borders: [[[334,  300],  [348,  380],  [360,  500],  [370,  620]], [[370,  620],  [346,  630],  [318,  636]]],
      folds: [[[318,  330],  [328,  420],  [336,  520],  [342,  628]]],
    },
  ],
};
