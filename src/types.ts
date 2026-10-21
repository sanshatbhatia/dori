/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GarmentKey = 'lehenga';

export type ViewMode = 'front' | 'detail' | 'back';
export type ArmPose = 'resting' | 'stretched';

export type RailMode = 'circles' | 'labelled' | 'arc';

export type LibraryMode = 'cards' | 'filmstrip' | 'tray';

export type BeltLatkanMode = 'none' | 'light' | 'heavy';

export type LatkanBoxOrientation = 'horizontal' | 'vertical';

export type SlotKey =
  | 'topStyle'
  | 'neckline'
  | 'sleeves'
  | 'back'
  | 'bottom'
  | 'bottomLength'
  | 'fabric'
  | 'drape'
  | 'waist'
  | 'collar'
  | 'cuff'
  | 'fit'
  | 'hemY'
  | 'texture';

export interface ComponentOption {
  id: string;
  name: string;
  geo?: string;
  val?: number;
  tex?: string;
  badge?: string;
}

export interface Category {
  id: string;
  label: string;
  short: string;
  slot: SlotKey;
  opts: ComponentOption[];
}

export interface GarmentConfig {
  name: string;
  desc?: string;
  cats: Category[];
}

export type SelectionState = Record<string, string>;

export interface HistoryStep {
  g: GarmentKey;
  sel: SelectionState;
  beltLatkan?: BeltLatkanMode;
}

export interface FocusConfig {
  cy: number;
  z: number;
  view: ViewMode;
}
