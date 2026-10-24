/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dori garment line illustrations (flat sketches) in the brand green.

import React from 'react';
import type { Silhouette as Sil } from '../data/catalog';
import { garmentById } from '../data/catalog';

const S = { fill: 'rgba(23,77,51,0.06)', stroke: '#174D33', strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const L = { fill: 'none', stroke: '#174D33', strokeWidth: 1, strokeLinecap: 'round' as const, opacity: 0.55 };

// blouse/top pieces reused across garments
const crop = (y = 22) => (
  <path {...S} d={`M38 ${y} Q50 ${y + 9} 62 ${y} L72 ${y + 4} L80 ${y + 15} L72 ${y + 19} L68 ${y + 13} L67 ${y + 28} Q50 ${y + 31} 33 ${y + 28} L32 ${y + 13} L28 ${y + 19} L20 ${y + 15} L28 ${y + 4} Z`} />
);

const ART: Record<Sil, React.ReactNode> = {
  blouse: (
    <>
      {crop(38)}
      <path {...L} d="M50 47 L50 66 M42 50 Q44 58 41 66 M58 50 Q56 58 59 66" />
    </>
  ),
  corset: (
    <>
      <path {...S} d="M34 42 Q42 36 50 42 Q58 36 66 42 L64 58 Q66 70 68 80 Q50 84 32 80 Q34 70 36 58 Z" />
      <path {...L} d="M50 42 L50 82 M42 41 Q40 62 40 81 M58 41 Q60 62 60 81" />
    </>
  ),
  kurti: (
    <>
      <path {...S} d="M38 14 Q50 22 62 14 L74 19 L84 44 L76 47 L68 30 L68 100 L32 100 L32 30 L24 47 L16 44 L26 19 Z" />
      <path {...L} d="M50 18 L50 40 M32 86 L36 100 M68 86 L64 100" />
    </>
  ),
  anarkali: (
    <>
      <path {...S} d="M40 12 Q50 20 60 12 L70 16 L82 42 L75 45 L66 28 L64 46 Q82 80 90 112 Q50 118 10 112 Q18 80 36 46 L34 28 L25 45 L18 42 L30 16 Z" />
      <path {...L} d="M36 46 Q50 50 64 46 M44 50 L34 112 M56 50 L66 112 M50 50 L50 114" />
    </>
  ),
  suit: (
    <>
      <path {...S} d="M38 12 Q50 20 62 12 L72 17 L82 40 L75 43 L67 27 L67 76 L33 76 L33 27 L25 43 L18 40 L28 17 Z" />
      <path {...S} d="M36 76 L34 114 L46 114 L50 82 L54 114 L66 114 L64 76" />
      <path {...L} d="M50 16 L50 36" />
    </>
  ),
  saree: (
    <>
      <path {...S} d="M40 20 Q50 26 60 20 L62 36 Q62 44 60 50 Q66 80 66 114 L34 114 Q34 80 40 50 Q38 44 38 36 Z" />
      <path {...S} d="M60 20 Q70 40 46 56 Q30 66 36 80 L42 78 Q40 68 52 60 Q74 44 66 20 Z" />
      <path {...L} d="M44 82 L42 114 M50 82 L50 114 M56 82 L58 114" />
    </>
  ),
  lehenga: (
    <>
      {crop(14)}
      <path {...S} d="M34 48 Q50 52 66 48 Q80 80 92 114 Q50 120 8 114 Q20 80 34 48 Z" />
      <path {...L} d="M42 52 L30 116 M50 53 L50 118 M58 52 L70 116" />
      <path {...L} d="M62 16 Q80 40 70 70" opacity={0.8} />
    </>
  ),
  sharara: (
    <>
      <path {...S} d="M38 10 Q50 18 62 10 L72 15 L82 38 L75 41 L67 25 L67 62 L33 62 L33 25 L25 41 L18 38 L28 15 Z" />
      <path {...S} d="M34 62 L66 62 L68 82 Q84 100 86 114 L56 114 L50 86 L44 114 L14 114 Q16 100 32 82 Z" />
    </>
  ),
  kaftan: (
    <>
      <path {...S} d="M40 14 Q50 22 60 14 L92 30 L86 50 L66 42 L70 110 L30 110 L34 42 L14 50 L8 30 Z" />
      <path {...L} d="M50 18 L50 44 M34 42 L66 42" />
    </>
  ),
  dress: (
    <>
      <path {...S} d="M40 14 Q50 22 60 14 L70 18 L76 30 L68 33 L64 26 L63 46 Q76 72 82 98 Q50 104 18 98 Q24 72 37 46 L36 26 L32 33 L24 30 L30 18 Z" />
      <path {...L} d="M37 46 Q50 50 63 46 M46 50 L40 100 M54 50 L60 100" />
    </>
  ),
  shirt: (
    <>
      <path {...S} d="M40 14 L50 24 L60 14 L72 19 L86 64 L78 66 L68 34 L68 92 L32 92 L32 34 L22 66 L14 64 L28 19 Z" />
      <path {...S} d="M40 14 L46 30 L50 24 L54 30 L60 14" />
      <path {...L} d="M50 26 L50 92" />
      {[40, 52, 64, 76].map((y) => (
        <circle key={y} cx="52.5" cy={y} r="1" fill="#174D33" />
      ))}
    </>
  ),
  top: (
    <>
      <path {...S} d="M38 22 Q50 30 62 22 L74 26 L80 40 L72 43 L68 36 L68 62 Q76 70 78 80 Q50 84 22 80 Q24 70 32 62 L32 36 L28 43 L20 40 L26 26 Z" />
      <path {...L} d="M32 62 Q50 66 68 62" />
    </>
  ),
  trousers: (
    <>
      <path {...S} d="M32 16 L68 16 L72 112 L56 112 L50 42 L44 112 L28 112 Z" />
      <path {...L} d="M32 24 L68 24 M50 24 L50 42" />
    </>
  ),
  skirt: (
    <>
      <path {...S} d="M36 30 L64 30 L66 38 Q80 74 86 100 Q50 106 14 100 Q20 74 34 38 Z" />
      <path {...L} d="M34 38 L66 38 M44 40 L36 102 M56 40 L64 102" />
    </>
  ),
  coord: (
    <>
      <path {...S} d="M40 8 L50 16 L60 8 L70 12 L80 40 L73 42 L66 24 L66 52 L34 52 L34 24 L27 42 L20 40 L30 12 Z" />
      <path {...S} d="M34 56 L66 56 L69 114 L55 114 L50 70 L45 114 L31 114 Z" />
      <path {...L} d="M50 18 L50 52" />
    </>
  ),
  jacket: (
    <>
      <path {...S} d="M38 14 L50 20 L62 14 L74 19 L86 66 L78 68 L68 36 L68 94 L32 94 L32 36 L22 68 L14 66 L26 19 Z" />
      <path {...S} d="M38 14 L44 40 L50 58 L56 40 L62 14 L56 24 L50 20 L44 24 Z" />
      <path {...L} d="M50 58 L50 94 M36 70 L44 70" />
    </>
  ),
  gown: (
    <>
      <path {...S} d="M38 18 Q50 24 62 18 L64 32 Q62 42 60 46 Q72 80 84 114 Q50 120 16 114 Q28 80 40 46 Q38 42 36 32 Z" />
      <path {...S} d="M62 18 Q74 40 50 60 Q38 70 40 84 L46 82 Q46 72 56 64 Q78 46 68 18 Z" />
      <path {...L} d="M46 86 L36 116 M54 86 L64 116" />
    </>
  ),
  dhoti: (
    <>
      {crop(10)}
      <path {...S} d="M32 46 L68 46 Q72 70 70 90 L72 112 L58 112 L56 92 Q52 76 50 66 Q48 76 44 92 L42 112 L28 112 L30 90 Q28 70 32 46 Z" />
      <path {...L} d="M40 50 Q50 64 60 50 M44 54 Q50 70 56 54" />
    </>
  ),
};

export const GarmentArt: React.FC<{ silhouette: Sil; className?: string }> = ({ silhouette, className }) => (
  <svg viewBox="0 0 100 124" className={className} aria-hidden="true">
    {ART[silhouette]}
  </svg>
);

export const GarmentArtFor: React.FC<{ garmentId?: string; className?: string }> = ({ garmentId, className }) => {
  const g = garmentById(garmentId);
  return <GarmentArt silhouette={g?.silhouette || 'kurti'} className={className} />;
};

/** body-type illustrations: a soft figure outline with the shoulder, waist and hip widths of each type */
export const BodyShape: React.FC<{ type: 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'unsure'; className?: string }> = ({ type, className }) => {
  // half-widths at shoulder, bust, waist, hip
  const [sh, bu, wa, hi] = {
    apple: [19, 20, 21, 18],
    pear: [15, 15, 13, 23],
    hourglass: [19, 19, 11, 20],
    rectangle: [17, 17, 15, 17],
    unsure: [17, 17, 15, 17],
  }[type];
  const c = 50;
  const pts = (k: 1 | -1) => [
    [c + k * 4.5, 16],
    [c + k * 5, 21],
    [c + k * sh, 27],
    [c + k * bu, 41],
    [c + k * wa, 56],
    [c + k * hi, 72],
    [c + k * hi * 0.78, 92],
    [c + k * hi * 0.55, 112],
  ];
  const L = pts(-1);
  const R = pts(1).reverse();
  const curve = (p: number[][]) => p.map((q, i) => (i === 0 ? `M ${q[0]} ${q[1]}` : `T ${q[0]} ${q[1]}`)).join(' ');
  const outline = `${curve(L)} L ${c} 112 L ${R[0][0]} ${R[0][1]} ${R.slice(1).map((q) => `T ${q[0]} ${q[1]}`).join(' ')} Z`;
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <circle cx="50" cy="8.5" r="6" fill="rgba(23,77,51,0.07)" stroke="#174D33" strokeWidth="1.4" />
      <path d={outline} fill="rgba(23,77,51,0.07)" stroke="#174D33" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray={type === 'unsure' ? '3 3' : undefined} />
      <path d={`M ${c - wa} 56 L ${c + wa} 56`} stroke="#174D33" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
      {type === 'unsure' && (
        <text x="50" y="70" textAnchor="middle" fontSize="18" fill="#174D33" fontFamily="serif">
          ?
        </text>
      )}
    </svg>
  );
};
