/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewMode } from '../types';

interface AvatarRendererProps {
  viewMode: ViewMode;
  layer: 'rearHair' | 'face' | 'frontHair' | 'backHead';
  skinTone?: string;
  /** The body below the face is already painted skin, so no drawn neck is needed */
  paintedSkin?: boolean;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  viewMode,
  layer,
  skinTone = 'url(#avatar-skin-grad)',
  paintedSkin = false,
}) => {
  const isBack = viewMode === 'back';

  // 1. REAR HAIR LAYER: Rendered behind neck & body
  if (layer === 'rearHair') {
    if (isBack) {
      return (
        <g id="avatar-rear-hair-back">
          {/* Main Back Hair Volume Flowing Down Spine */}
          <path
            d="M 230 42 C 196 42 184 70 182 105 C 180 135 186 168 188 198 C 190 220 196 242 204 260 C 212 274 222 284 230 286 C 238 284 248 274 256 260 C 264 242 270 220 272 198 C 274 168 280 135 278 105 C 276 70 264 42 230 42 Z"
            fill="url(#hair-dark-grad)"
            stroke="#121010"
            strokeWidth="1.2"
          />
          {/* Back Hair Texture Strands */}
          <path
            d="M 216 75 C 212 120 216 180 220 240"
            fill="none"
            stroke="#3a3434"
            strokeWidth="1.1"
            opacity="0.6"
          />
          <path
            d="M 244 75 C 248 120 244 180 240 240"
            fill="none"
            stroke="#3a3434"
            strokeWidth="1.1"
            opacity="0.6"
          />
          <path
            d="M 230 65 L 230 270"
            fill="none"
            stroke="#262222"
            strokeWidth="0.9"
            opacity="0.7"
          />
        </g>
      );
    }

    // Front View: the painted head image carries all the hair
    return null;
  }

  // 2. BACK VIEW HEAD: Rendered when viewMode === 'back'
  if (layer === 'backHead' || (isBack && layer === 'face')) {
    return (
      <g id="avatar-back-head" transform="translate(230 140) scale(1.18) translate(-230 -140)">
        {/* Rear Head Crown Volume */}
        <ellipse cx="230" cy="80" rx="32" ry="38" fill="url(#hair-dark-grad)" stroke="#121010" strokeWidth="1.2" />
        
        {/* Hair Specular Highlight on Crown */}
        <path
          d="M 212 60 C 220 54 240 54 248 60 C 242 66 218 66 212 60 Z"
          fill="#443e3e"
          opacity="0.5"
        />

        {/* Nape of the Neck Visible between hair sweep */}
        <path
          d="M 221 106 L 221 144 Q 230 148 239 144 L 239 106 Z"
          fill={skinTone}
          stroke="#2a1f18"
          strokeWidth="1.15"
        />
        {/* Subtle Nape Spine Shadow */}
        <line x1="230" y1="110" x2="230" y2="142" stroke="#2a1f18" strokeWidth="0.85" opacity="0.35" />

        {/* Earrings peeking from rear ears */}
        <circle cx="199" cy="98" r="2.2" fill="#7a5cb8" stroke="#3d2a68" strokeWidth="0.6" />
        <circle cx="261" cy="98" r="2.2" fill="#7a5cb8" stroke="#3d2a68" strokeWidth="0.6" />
      </g>
    );
  }

  // 3. FRONT VIEW: NECK BASE (the painted head image is drawn in the frontHair layer)
  if (layer === 'face') {
    if (paintedSkin) return null;
    return (
      <g id="avatar-face-head">
        {/* Neck Column */}
        <path d="M 216 118 L 215 146 Q 230 152 245 146 L 244 118 Z" fill={skinTone} />
        {/* Soft neck sides flowing into the shoulders */}
        <path d="M 216 134 Q 216 142 209 148" fill="none" stroke="#2a1f18" strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
        <path d="M 244 134 Q 244 142 251 148" fill="none" stroke="#2a1f18" strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
      </g>
    );
  }

  // 4. FRONT HEAD & HAIR: Rendered ON TOP of body & blouse, falling over the shoulder
  if (layer === 'frontHair') {
    if (isBack) return null;

    return (
      <g id="avatar-front-hair-sweep">
        {/* Painted head, face and long hair from the reference artwork */}
        <image
          href="/assets/dori-face.png"
          x={192.9}
          y={30.6}
          width={120.5}
          height={275.9}
          preserveAspectRatio="none"
        />
      </g>
    );
  }

  return null;
};
