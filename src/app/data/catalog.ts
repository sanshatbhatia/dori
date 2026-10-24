/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Business configuration for the order journey. Labels, descriptions and availability live here so
// the business can change them without touching the screens.

import type { FabricType, Occasion, RequestStatus, SizeCode, StyleFamily, BodyType } from '../services/types';

export const FABRIC_TYPES: { id: FabricType; label: string; description: string }[] = [
  {
    id: 'half_stitched',
    label: 'Half-stitched fabric',
    description: 'Some panels are already cut or joined, e.g. a skirt with the blouse piece left open.',
  },
  {
    id: 'semi_stitched',
    label: 'Semi-stitched fabric',
    description: 'Mostly assembled with seams left open so it can be fitted to your measurements.',
  },
  {
    id: 'unstitched',
    label: 'Unstitched / plain fabric',
    description: 'A length of fabric that has not been cut or stitched yet.',
  },
];

export const OCCASIONS: { id: Occasion; label: string; description: string }[] = [
  { id: 'casual', label: 'Casual', description: 'Everyday wear, outings and comfort' },
  { id: 'formal', label: 'Formal', description: 'Work, meetings and polished events' },
  { id: 'occasional', label: 'Occasional', description: 'Weddings, festivals and celebrations' },
];

export const STYLE_FAMILIES: { id: StyleFamily; label: string; description: string }[] = [
  { id: 'indian', label: 'Indian', description: 'Sarees, suits, lehengas, kurtis and blouses' },
  { id: 'western', label: 'Western', description: 'Dresses, tops, trousers, skirts and co-ords' },
  { id: 'indo_western', label: 'Indo-Western', description: 'Fusion silhouettes that blend both' },
];

export type Silhouette =
  | 'saree'
  | 'suit'
  | 'anarkali'
  | 'kurti'
  | 'blouse'
  | 'corset'
  | 'kaftan'
  | 'lehenga'
  | 'sharara'
  | 'dress'
  | 'shirt'
  | 'top'
  | 'trousers'
  | 'skirt'
  | 'coord'
  | 'jacket'
  | 'gown'
  | 'dhoti';

export interface GarmentDef {
  id: string;
  label: string;
  family: StyleFamily;
  silhouette: Silhouette;
  lining?: 'lined' | 'unlined';
  /** the Design Studio can build this garment (otherwise the reference-image route is used) */
  studio?: 'lehenga';
  /** which garment-specific size to suggest from the fit profile */
  sizeKey?: 'blouse' | 'kurti' | 'lehenga' | 'trousers' | 'dress';
}

export const GARMENT_CATALOGUE: GarmentDef[] = [
  // Indian
  { id: 'rtw_saree', label: 'Ready-to-wear saree', family: 'indian', silhouette: 'saree', sizeKey: 'blouse' },
  { id: 'palazzo_lined', label: 'Palazzo suit', lining: 'lined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'palazzo_unlined', label: 'Palazzo suit', lining: 'unlined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'salwar_lined', label: 'Salwar suit', lining: 'lined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'salwar_unlined', label: 'Salwar suit', lining: 'unlined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'pantsuit_lined', label: 'Pant suit', lining: 'lined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'pantsuit_unlined', label: 'Pant suit', lining: 'unlined', family: 'indian', silhouette: 'suit', sizeKey: 'kurti' },
  { id: 'anarkali_suit', label: 'Anarkali suit', family: 'indian', silhouette: 'anarkali', sizeKey: 'kurti' },
  { id: 'angrakha_suit', label: 'Angrakha suit', family: 'indian', silhouette: 'anarkali', sizeKey: 'kurti' },
  { id: 'simple_kurti', label: 'Simple kurti', family: 'indian', silhouette: 'kurti', sizeKey: 'kurti' },
  { id: 'anarkali_kurti', label: 'Anarkali kurti', family: 'indian', silhouette: 'anarkali', sizeKey: 'kurti' },
  { id: 'angrakha_kurti', label: 'Angrakha kurti', family: 'indian', silhouette: 'kurti', sizeKey: 'kurti' },
  { id: 'blouse_lined', label: 'Blouse', lining: 'lined', family: 'indian', silhouette: 'blouse', sizeKey: 'blouse' },
  { id: 'blouse_unlined', label: 'Blouse', lining: 'unlined', family: 'indian', silhouette: 'blouse', sizeKey: 'blouse' },
  { id: 'padded_blouse', label: 'Padded blouse / corset', family: 'indian', silhouette: 'corset', sizeKey: 'blouse' },
  { id: 'kaftan', label: 'Kaftan', family: 'indian', silhouette: 'kaftan', sizeKey: 'dress' },
  { id: 'lehenga_set', label: 'Lehenga set', family: 'indian', silhouette: 'lehenga', studio: 'lehenga', sizeKey: 'lehenga' },
  { id: 'sharara', label: 'Sharara', family: 'indian', silhouette: 'sharara', sizeKey: 'kurti' },
  // Western
  { id: 'dress', label: 'Dress', family: 'western', silhouette: 'dress', sizeKey: 'dress' },
  { id: 'shirt', label: 'Shirt', family: 'western', silhouette: 'shirt', sizeKey: 'blouse' },
  { id: 'top', label: 'Top', family: 'western', silhouette: 'top', sizeKey: 'blouse' },
  { id: 'trousers', label: 'Trousers / pants', family: 'western', silhouette: 'trousers', sizeKey: 'trousers' },
  { id: 'skirt', label: 'Skirt', family: 'western', silhouette: 'skirt', sizeKey: 'trousers' },
  { id: 'coord', label: 'Co-ord set', family: 'western', silhouette: 'coord', sizeKey: 'blouse' },
  { id: 'jacket', label: 'Jacket', family: 'western', silhouette: 'jacket', sizeKey: 'blouse' },
  // Indo-Western
  { id: 'saree_gown', label: 'Saree gown', family: 'indo_western', silhouette: 'gown', sizeKey: 'dress' },
  { id: 'dhoti_croptop', label: 'Dhoti pants with crop top', family: 'indo_western', silhouette: 'dhoti', sizeKey: 'blouse' },
  { id: 'iw_lehenga', label: 'Indo-Western lehenga', family: 'indo_western', silhouette: 'lehenga', studio: 'lehenga', sizeKey: 'lehenga' },
  { id: 'kurti_trousers', label: 'Kurti with contemporary trousers', family: 'indo_western', silhouette: 'kurti', sizeKey: 'kurti' },
  { id: 'fusion_coord', label: 'Fusion co-ord set', family: 'indo_western', silhouette: 'coord', sizeKey: 'blouse' },
];

export const garmentById = (id?: string) => GARMENT_CATALOGUE.find((g) => g.id === id);
export const garmentName = (g?: GarmentDef) => (g ? (g.lining ? `${g.label} (${g.lining === 'lined' ? 'with' : 'without'} lining)` : g.label) : '');

export const SIZES: { id: SizeCode; label: string }[] = [
  { id: 'XS', label: 'XS' },
  { id: 'S', label: 'S' },
  { id: 'M', label: 'M' },
  { id: 'L', label: 'L' },
  { id: 'XL', label: 'XL' },
  { id: 'XXL', label: 'XXL' },
  { id: 'custom', label: 'Custom' },
  { id: 'unsure', label: 'Not sure' },
];

/** Generic body measurements per size, in inches. An estimate only: fit differs by garment and cut. */
export const SIZE_GUIDE: { size: string; bust: string; waist: string; hip: string }[] = [
  { size: 'XS', bust: '30–32', waist: '24–26', hip: '33–35' },
  { size: 'S', bust: '32–34', waist: '26–28', hip: '35–37' },
  { size: 'M', bust: '34–36', waist: '28–30', hip: '37–39' },
  { size: 'L', bust: '36–38', waist: '30–32', hip: '39–41' },
  { size: 'XL', bust: '38–40', waist: '32–34', hip: '41–43' },
  { size: 'XXL', bust: '40–42', waist: '34–36', hip: '43–45' },
];

export const BODY_TYPES: { id: BodyType; label: string; description: string; tip: string }[] = [
  {
    id: 'apple',
    label: 'Apple',
    description: 'Fuller through the middle, with slimmer legs and hips.',
    tip: 'Empire waists, A-lines and V-necks draw the eye up and lengthen.',
  },
  {
    id: 'pear',
    label: 'Pear',
    description: 'Hips wider than the shoulders and bust.',
    tip: 'Detailed necklines and structured shoulders balance flared skirts.',
  },
  {
    id: 'hourglass',
    label: 'Hourglass',
    description: 'Bust and hips similar, with a defined waist.',
    tip: 'Fitted waists, wrap styles and peplums follow your shape.',
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Shoulders, waist and hips of similar width.',
    tip: 'Peplums, belts and tiers add curves where you want them.',
  },
  {
    id: 'unsure',
    label: 'Unsure',
    description: 'Not sure, or none of these feel right. That’s completely fine.',
    tip: 'Your stylist will suggest silhouettes during the consultation.',
  },
];

/** Turnaround options the customer can request. The business decides what is enabled. */
export const URGENCY_OPTIONS: { id: string; label: string; description: string; enabled: boolean }[] = [
  { id: 'standard', label: 'Standard', description: 'Usual turnaround, confirmed by your stylist after the consultation.', enabled: true },
  { id: 'priority', label: 'Priority', description: 'Faster than standard where production capacity allows.', enabled: true },
  { id: 'urgent_48h', label: '48-hour urgent request', description: 'Only for simple garments and only if the workshop can take it on.', enabled: true },
];

export const CONSULTATION = { durationMin: 30, openHour: 10, closeHour: 19, daysAhead: 14, assignLeadHours: 2 };

/** Customer-facing request lifecycle; production stages follow once an order is confirmed */
export const STATUS_LABEL: Record<RequestStatus, string> = {
  consultation_requested: 'Consultation requested',
  stylist_assigned: 'Stylist assigned',
  consultation_completed: 'Consultation completed',
  awaiting_approval: 'Design and order details approved',
  order_confirmed: 'Order confirmed',
  awaiting_fabric: 'Awaiting fabric pickup',
  fabric_received: 'Fabric received at warehouse',
  fabric_checked: 'Fabric and order details checked',
  cutting: 'Cutting and preparation',
  stitching: 'Stitching in progress',
  embroidery: 'Embroidery and additional work',
  finishing: 'Finishing and pressing',
  quality: 'Quality inspection',
  packaging: 'Packaging',
  ready_dispatch: 'Ready for dispatch',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const TIMELINE: RequestStatus[] = [
  'consultation_requested',
  'stylist_assigned',
  'consultation_completed',
  'awaiting_approval',
  'order_confirmed',
  'awaiting_fabric',
  'fabric_received',
  'fabric_checked',
  'cutting',
  'stitching',
  'embroidery',
  'finishing',
  'quality',
  'packaging',
  'ready_dispatch',
  'out_for_delivery',
  'delivered',
];

/** Stages that only apply to some garments */
export const timelineFor = (garmentId: string): RequestStatus[] => {
  const g = garmentById(garmentId);
  const embroidered = g && ['lehenga', 'anarkali', 'saree', 'blouse', 'corset', 'sharara', 'gown'].includes(g.silhouette);
  return TIMELINE.filter((s) => s !== 'embroidery' || embroidered);
};

/** Before the order is confirmed it is a consultation request, not a production order */
export const isProduction = (s: RequestStatus) => TIMELINE.indexOf(s) >= TIMELINE.indexOf('order_confirmed');
