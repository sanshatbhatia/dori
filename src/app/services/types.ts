/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dori customer-journey data model. Every service works through these types so the demo data
// provider can later be swapped for a real backend without touching the screens.

import type { BeltLatkanMode, SelectionState } from '../../types';

export type ID = string;
export type ISODate = string;

export interface Address {
  id: ID;
  label: string; // Home, Work, …
  line1: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export type SizeCode = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'custom' | 'unsure';
export type BodyType = 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'unsure';
export type HeightUnit = 'cm' | 'ftin';

export interface Measurements {
  bust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armLength?: number;
  blouseLength?: number;
  skirtLength?: number;
  unit: 'in' | 'cm';
  /** Who recorded them: measurements are verified by a stylist, never edited by the customer */
  recordedBy?: { role: 'stylist' | 'admin'; name: string };
  verifiedAt?: ISODate;
}

export interface FitProfile {
  heightCm?: number;
  heightUnit: HeightUnit;
  usualSize?: SizeCode;
  /** A customer's size often differs by garment, so it is kept per garment */
  garmentSizes: Partial<Record<'blouse' | 'kurti' | 'lehenga' | 'trousers' | 'dress', SizeCode>>;
  bodyType?: BodyType;
  measurements?: Measurements;
  updatedAt?: ISODate;
}

export interface NotificationPrefs {
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  marketing: boolean;
}

export interface Customer {
  id: ID;
  fullName: string;
  phone: string; // E.164, e.g. +919876543210
  phoneVerified: boolean;
  email?: string;
  addresses: Address[];
  fitProfile: FitProfile;
  /** onboarding progress: personalization can be skipped, address is needed before ordering */
  onboarding: { personalizationDone: boolean };
  notificationPrefs: NotificationPrefs;
  accountStatus: 'active' | 'deletion_requested';
  createdAt: ISODate;
}

export interface Session {
  token: string;
  customerId: ID;
  createdAt: ISODate;
  expiresAt: ISODate;
  device: string;
}

// ---- Order request inputs -------------------------------------------------------------------

export type FabricType = 'half_stitched' | 'semi_stitched' | 'unstitched';
export type Occasion = 'casual' | 'formal' | 'occasional';
export type StyleFamily = 'indian' | 'western' | 'indo_western';

export interface FabricInfo {
  type: FabricType;
  length: number;
  unit: 'm' | 'yd';
  width?: number;
  widthUnit?: 'in' | 'cm';
  notes?: string;
}

export interface ReferenceImage {
  id: ID;
  name: string;
  /** data URL in the demo (local only); a storage URL with a real backend */
  dataUrl: string;
  size: number;
  type: string;
}

/** The Studio's structured output: the design itself, independent of any preview picture */
export interface StudioConfig {
  studioGarment: 'lehenga';
  selection: SelectionState;
  beltLatkan: BeltLatkanMode;
}

export type DesignStatus = 'draft' | 'saved';

export interface Design {
  id: ID;
  ownerId: ID;
  title: string;
  garmentId: string; // catalogue id
  styleFamily?: StyleFamily;
  occasion?: Occasion;
  size?: SizeCode;
  lining?: 'lined' | 'unlined';
  method: 'studio' | 'reference';
  studio?: StudioConfig;
  references: ReferenceImage[];
  referenceUrl?: string;
  changeNotes?: string;
  fabric?: FabricInfo;
  /** instructions added in the Studio that the options can't express */
  studioNotes?: string;
  /** customer's own words, kept apart from the automatically selected data */
  description?: string;
  /** optional rendered preview (an image of the design, not the design data) */
  previewDataUrl?: string;
  /** explore item this design was inspired by */
  inspiredBy?: ID;
  notes?: string;
  status: DesignStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Board {
  id: ID;
  ownerId: ID;
  title: string;
  description?: string;
  visibility: 'private'; // sharing comes later; the field is ready for it
  /** saved designs and explore pins, in order */
  items: { kind: 'design' | 'explore'; refId: ID; addedAt: ISODate }[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---- Consultation & order ----------------------------------------------------------------

export type RequestStatus =
  | 'consultation_requested'
  | 'stylist_assigned'
  | 'consultation_completed'
  | 'awaiting_approval'
  | 'order_confirmed'
  | 'awaiting_fabric'
  | 'fabric_received'
  | 'fabric_checked'
  | 'cutting'
  | 'stitching'
  | 'embroidery'
  | 'finishing'
  | 'quality'
  | 'packaging'
  | 'ready_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Stylist {
  id: ID;
  name: string;
  title: string;
  experience: string;
  phone: string;
  email: string;
}

export interface Consultation {
  id: ID;
  customerId: ID;
  requestId: ID;
  slotStart: ISODate;
  durationMin: number;
  mode: 'video' | 'phone';
  assignment: 'pending' | 'in_progress' | 'assigned' | 'failed';
  stylistId?: ID;
  assignedAt?: ISODate;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface OrderEvent {
  id: ID;
  requestId: ID;
  from?: RequestStatus;
  to: RequestStatus;
  at: ISODate;
  actor: 'customer' | 'system' | 'stylist' | 'warehouse' | 'demo';
  message: string;
}

export interface OrderRequest {
  id: ID;
  reference: string; // human readable, e.g. DORI-7K4Q2
  customerId: ID;
  designId: ID;
  /** snapshot of the design at submission, so later edits don't change a submitted request */
  designSnapshot: Design;
  garmentId: string;
  fabric: FabricInfo;
  urgency: { optionId: string; desiredDate?: string; feasibility: 'pending_review' | 'feasible' | 'not_feasible' };
  addressId: ID;
  addressSnapshot: Address;
  consultationId: ID;
  status: RequestStatus;
  expectedDelivery?: ISODate; // only once confirmed by the business
  pricing?: { confirmed: boolean; amount?: number; currency?: string };
  idempotencyKey: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AppNotification {
  id: ID;
  customerId: ID;
  title: string;
  body: string;
  at: ISODate;
  read: boolean;
  requestId?: ID;
}

export interface ExploreItem {
  id: ID;
  title: string;
  garmentId: string;
  family: StyleFamily;
  occasion: Occasion;
  tags: string[];
  /** Dori's own illustration or a rendered Studio look */
  image: { kind: 'render'; src: string } | { kind: 'silhouette'; garmentId: string };
  /** a Studio starting point when the look can be built in the Studio */
  studio?: StudioConfig;
  source: string; // attribution
  description: string;
}
