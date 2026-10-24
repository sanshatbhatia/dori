/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Option preview pictures rendered from the Studio itself (public/assets/options/<category>-<option>.jpg)
export const OPTION_THUMBS = new Set<string>([
  'blouseBack-cutOut',
  'blouseBack-deepBack',
  'blouseBack-keyholeBack',
  'blouseBack-roundBack',
  'blouseBack-squareBack',
  'blouseBack-tieBack',
  'blouseFront-corset',
  'blouseFront-fitted',
  'blouseFront-jacket',
  'blouseFront-peplum',
  'dupattaDrape-aroundBody',
  'dupattaDrape-bothShoulders',
  'dupattaDrape-crossBody',
  'dupattaDrape-frontOpen',
  'dupattaDrape-oneShoulder',
  'neckline-boat',
  'neckline-halter',
  'neckline-high',
  'neckline-notched',
  'neckline-round',
  'neckline-square',
  'neckline-sweetheart',
  'neckline-vneck',
  'skirt-aline',
  'skirt-circular',
  'skirt-flared',
  'skirt-mermaid',
  'skirt-panelled',
  'skirt-pleated',
  'skirt-straight',
  'skirt-tiered',
  'sleeves-bell',
  'sleeves-cap',
  'sleeves-elbow',
  'sleeves-flared',
  'sleeves-full',
  'sleeves-puff',
  'sleeves-short',
  'sleeves-sleeveless',
  'sleeves-threequarter',
]);

export const optionThumb = (categoryId: string, optionId: string) =>
  OPTION_THUMBS.has(`${categoryId}-${optionId}`) ? `/assets/options/${categoryId}-${optionId}.jpg` : null;

/** whole-garment categories show the full picture; detail categories fill the card */
export const thumbFit = (categoryId: string) => (categoryId === 'skirt' || categoryId === 'dupattaDrape' ? 'object-contain' : 'object-cover');
