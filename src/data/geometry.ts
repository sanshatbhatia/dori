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

export const NECK: Record<string, { pts: number[][]; sh?: [number, number] }> = {
  sweetheart: {
    pts: [
      [187, 155],
      [202, 165],
      [208, 175],
      [215, 180],
      [221, 177],
      [226, 171],
      [230, 163],
      [234, 171],
      [239, 177],
      [245, 180],
      [252, 175],
      [258, 165],
      [273, 155],
    ],
  },
  princess: {
    pts: [
      [187, 155],
      [200, 160],
      [204, 174],
      [210, 186],
      [218, 196],
      [224, 204],
      [230, 208],
      [236, 204],
      [242, 196],
      [250, 186],
      [256, 174],
      [260, 160],
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
  vneck: {
    pts: [
      [187, 155],
      [204, 164],
      [209, 180],
      [215, 196],
      [222, 210],
      [230, 224],
      [238, 210],
      [245, 196],
      [251, 180],
      [256, 164],
      [273, 155],
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
  halter: {
    pts: [
      [208, 150],
      [216, 154],
      [223, 178],
      [226, 212],
      [230, 246],
      [234, 212],
      [237, 178],
      [244, 154],
      [252, 150],
    ],
    sh: [202, 154],
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
  deepBack: {
    pts: [
      [196, 148],
      [200, 175],
      [206, 206],
      [213, 238],
      [220, 268],
      [230, 294],
      [240, 268],
      [247, 238],
      [254, 206],
      [260, 175],
      [264, 148],
    ],
  },
  keyholeBack: {
    pts: [
      [198, 150],
      [212, 158],
      [220, 166],
      [221, 190],
      [220, 225],
      [224, 260],
      [230, 274],
      [236, 260],
      [240, 225],
      [239, 190],
      [240, 166],
      [248, 158],
      [262, 150],
    ],
  },
  tieBack: {
    pts: [
      [198, 148],
      [206, 175],
      [214, 212],
      [220, 252],
      [226, 280],
      [234, 280],
      [240, 252],
      [246, 212],
      [254, 175],
      [262, 148],
    ],
  },
  cutOut: {
    pts: [
      [196, 150],
      [204, 185],
      [216, 218],
      [230, 240],
      [244, 218],
      [256, 185],
      [264, 150],
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
  jacket: {
    right: [
      [306, 218],
      [302, 270],
      [298, 330],
      [294, 392],
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
  tiered: { profile: [[0, 40], [0.028, 43.2], [0.12, 80], [0.24, 100], [0.33, 118], [0.35, 132], [0.66, 162], [0.68, 176], [1, 218]] },
  mermaid: { profile: [[0, 40], [0.028, 43.2], [0.12, 74], [0.24, 82], [0.42, 82], [0.6, 80], [0.72, 88], [0.84, 146], [1, 210]] },
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
  // Neck top
  [216, 120], [244, 120],
  // Right shoulder, bust, waist, hip (sloped shoulders and slim waist from the reference artwork)
  [245.6, 138], [259.6, 148], [274.1, 155.4], [283.6, 157.4], [292.6, 160], [298.6, 168], [299.6, 180], [293.6, 196], [285.6, 210], [279.6, 222], [275.6, 236], [271.6, 250], [269.2, 257], [267.4, 263], [267.2, 268], [268.4, 274], [270.5, 282],
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
  [186.4, 300], [189.5, 282], [191.6, 274], [192.8, 268], [192.6, 263], [190.8, 257], [188.4, 250], [184.4, 236], [180.4, 222], [174.4, 210], [166.4, 196], [160.4, 180], [161.4, 168], [167.4, 160], [176.4, 157.4], [185.9, 155.4], [200.4, 148], [214.4, 138],
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
