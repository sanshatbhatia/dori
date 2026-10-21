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
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  viewMode,
  layer,
  skinTone = 'url(#avatar-skin-grad)',
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

    // Front View: Rear hair peeking behind shoulders & neck
    return (
      <g id="avatar-rear-hair-front">
        {/* Right side hair silhouette behind shoulder */}
        <path
          d="M 252 64 C 268 76 278 102 276 135 C 274 160 268 185 264 205 C 260 215 254 220 250 224 C 252 208 256 180 256 150 C 256 120 248 95 242 78 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.1"
        />
        {/* Left side hair silhouette behind shoulder */}
        <path
          d="M 208 64 C 192 76 182 102 184 135 C 186 165 192 195 198 222 C 195 205 190 178 190 150 C 190 120 198 95 204 78 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.1"
        />
      </g>
    );
  }

  // 2. BACK VIEW HEAD: Rendered when viewMode === 'back'
  if (layer === 'backHead' || (isBack && layer === 'face')) {
    return (
      <g id="avatar-back-head">
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

  // 3. FRONT VIEW: FACE & HEAD BASE
  if (layer === 'face') {
    return (
      <g id="avatar-face-head">
        {/* Neck Column */}
        <path
          d="M 219 104 L 217 146 Q 230 152 243 146 L 241 104 Z"
          fill={skinTone}
          stroke="#2a1f18"
          strokeWidth="1.1"
        />
        {/* Neck Tendons & Clavicle Shading */}
        <path d="M 224 116 Q 227 136 226 148" fill="none" stroke="#2a1f18" strokeWidth="0.85" opacity="0.25" />
        <path d="M 236 116 Q 233 136 234 148" fill="none" stroke="#2a1f18" strokeWidth="0.85" opacity="0.25" />
        <ellipse cx="230" cy="148" rx="3.5" ry="2" fill="#2a1f18" opacity="0.18" />

        {/* Ears */}
        {/* Left Ear */}
        <path
          d="M 204 82 C 197 84 196 98 202 104 C 204 102 205 92 205 84 Z"
          fill={skinTone}
          stroke="#2a1f18"
          strokeWidth="1.0"
        />
        <path d="M 201 88 C 199 92 200 96 203 98" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.4" />
        {/* Left Earring (Blue-Purple Stud & Teardrop Jewel from Ref A) */}
        <g id="earring-left">
          <circle cx="201" cy="103" r="1.6" fill="#C7A66A" />
          <path
            d="M 201 104 L 199.5 109 Q 201 111.5 202.5 109 Z"
            fill="#6d4db8"
            stroke="#2d1c54"
            strokeWidth="0.65"
          />
          <circle cx="201" cy="107" r="0.6" fill="#c3b1e8" />
        </g>

        {/* Right Ear */}
        <path
          d="M 256 82 C 263 84 264 98 258 104 C 256 102 255 92 255 84 Z"
          fill={skinTone}
          stroke="#2a1f18"
          strokeWidth="1.0"
        />
        <path d="M 259 88 C 261 92 260 96 257 98" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.4" />
        {/* Right Earring */}
        <g id="earring-right">
          <circle cx="259" cy="103" r="1.6" fill="#C7A66A" />
          <path
            d="M 259 104 L 257.5 109 Q 259 111.5 260.5 109 Z"
            fill="#6d4db8"
            stroke="#2d1c54"
            strokeWidth="0.65"
          />
          <circle cx="259" cy="107" r="0.6" fill="#c3b1e8" />
        </g>

        {/* Sculpted Face Oval & Jawline */}
        <path
          d="M 204 74 C 203 92 206 104 218 114 C 224 119 230 120 236 114 C 248 104 251 92 250 74 C 250 56 242 46 230 46 C 218 46 204 56 204 74 Z"
          fill={skinTone}
          stroke="#2a1f18"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />

        {/* Soft Rosy Cheek Blush */}
        <ellipse cx="214" cy="94" rx="7.5" ry="4.5" fill="url(#blush-l)" opacity="0.5" />
        <ellipse cx="246" cy="94" rx="7.5" ry="4.5" fill="url(#blush-r)" opacity="0.5" />

        {/* Chin & Jaw Soft Contour */}
        <path
          d="M 226 116 Q 230 117.5 234 116"
          fill="none"
          stroke="#2a1f18"
          strokeWidth="0.85"
          opacity="0.3"
        />

        {/* EYEBROWS: Elegant Arched Brows */}
        {/* Left Eyebrow */}
        <path
          d="M 211 77 C 215 74.5 221 74.5 225 76.5"
          fill="none"
          stroke="#1b1717"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Right Eyebrow */}
        <path
          d="M 235 76.5 C 239 74.5 245 74.5 249 77"
          fill="none"
          stroke="#1b1717"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* EYES: Fashion-Game Expressive Almond Eyes (Reference A) */}
        {/* Left Eye */}
        <g id="avatar-left-eye">
          {/* Eyelid crease */}
          <path d="M 213 80 Q 218 78 224 80" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.45" />
          {/* Sclera (White) */}
          <path d="M 212 84.5 Q 218 80.5 224 84.5 Q 218 88.5 212 84.5 Z" fill="#ffffff" />
          {/* Iris Gradient */}
          <circle cx="218" cy="84.5" r="3.2" fill="url(#iris-grad)" />
          {/* Pupil */}
          <circle cx="218" cy="84.5" r="1.6" fill="#120e0e" />
          {/* Light Reflections */}
          <circle cx="217" cy="83.5" r="0.8" fill="#ffffff" />
          <circle cx="219.2" cy="85.5" r="0.45" fill="#ffffff" opacity="0.8" />
          {/* Upper Winged Eyeliner & Lashes */}
          <path
            d="M 210.5 84.5 Q 217 80.5 224.5 83.5 L 226 82.5"
            fill="none"
            stroke="#161212"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Lower Lash Line */}
          <path
            d="M 213 85.5 Q 218 88 223 85.5"
            fill="none"
            stroke="#2a1f18"
            strokeWidth="0.65"
            opacity="0.65"
          />
        </g>

        {/* Right Eye */}
        <g id="avatar-right-eye">
          {/* Eyelid crease */}
          <path d="M 226 80 Q 232 78 237 80" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.45" />
          {/* Sclera (White) */}
          <path d="M 226 84.5 Q 232 80.5 238 84.5 Q 232 88.5 226 84.5 Z" fill="#ffffff" />
          {/* Iris Gradient */}
          <circle cx="232" cy="84.5" r="3.2" fill="url(#iris-grad)" />
          {/* Pupil */}
          <circle cx="232" cy="84.5" r="1.6" fill="#120e0e" />
          {/* Light Reflections */}
          <circle cx="231" cy="83.5" r="0.8" fill="#ffffff" />
          <circle cx="233.2" cy="85.5" r="0.45" fill="#ffffff" opacity="0.8" />
          {/* Upper Winged Eyeliner & Lashes */}
          <path
            d="M 225.5 83.5 Q 233 80.5 239.5 84.5 L 241 82.5"
            fill="none"
            stroke="#161212"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Lower Lash Line */}
          <path
            d="M 227 85.5 Q 232 88 237 85.5"
            fill="none"
            stroke="#2a1f18"
            strokeWidth="0.65"
            opacity="0.65"
          />
        </g>

        {/* NOSE: Delicate Bridge & Sculpted Tip */}
        <g id="avatar-nose">
          {/* Bridge shadow */}
          <path d="M 229 82 Q 228.5 91 227.5 95" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.3" />
          {/* Tip and nostril curves */}
          <path
            d="M 226.5 96.5 Q 230 98 233.5 96.5"
            fill="none"
            stroke="#2a1f18"
            strokeWidth="0.95"
            strokeLinecap="round"
          />
          <path d="M 226 95.5 Q 225 96.5 226.5 97" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.4" />
          <path d="M 234 95.5 Q 235 96.5 233.5 97" fill="none" stroke="#2a1f18" strokeWidth="0.75" opacity="0.4" />
        </g>

        {/* LIPS: Red-Toned Glamour Lips with Cupid's Bow (Reference A) */}
        <g id="avatar-lips">
          {/* Upper Lip with Cupid's Bow */}
          <path
            d="M 223 105 Q 226.5 103.5 228.5 104.5 Q 230 105.2 231.5 104.5 Q 233.5 103.5 237 105 Q 234 107.5 230 107.5 Q 226 107.5 223 105 Z"
            fill="#b83232"
            stroke="#2a1f18"
            strokeWidth="0.8"
          />
          {/* Lower Lip (Lush Full Volume) */}
          <path
            d="M 223.5 105.5 Q 230 107.2 236.5 105.5 Q 235 110.5 230 110.5 Q 225 110.5 223.5 105.5 Z"
            fill="#d23e3e"
            stroke="#2a1f18"
            strokeWidth="0.8"
          />
          {/* Center Lip Crease */}
          <path
            d="M 224 105.5 Q 228.5 106.8 230 106.2 Q 231.5 106.8 236 105.5"
            fill="none"
            stroke="#721a1a"
            strokeWidth="0.7"
          />
          {/* Lip Gloss Highlight */}
          <ellipse cx="230" cy="108.2" rx="2.4" ry="0.8" fill="#ffffff" opacity="0.55" />
        </g>

        {/* Forehead Hairline Base (Hair crown silhouette) */}
        <path
          d="M 204 68 C 206 52 216 44 230 44 C 244 44 254 52 256 68 C 252 58 240 52 230 52 C 220 52 208 58 204 68 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.1"
        />
        {/* Soft Hair Parting on Left */}
        <path
          d="M 218 52 Q 224 55 232 53 Q 242 55 252 64"
          fill="none"
          stroke="#332d2d"
          strokeWidth="0.9"
        />

        {/* Delicate Maang Tikka & Bindi */}
        <line x1="230" y1="48" x2="230" y2="67" stroke="#C7A66A" strokeWidth="0.75" opacity="0.85" />
        <circle cx="230" cy="68" r="1.5" fill="#C7A66A" stroke="#2d1c54" strokeWidth="0.4" />
        <circle cx="230" cy="68" r="0.7" fill="#6d4db8" />
        <circle cx="230" cy="73.5" r="1.0" fill="#8f2424" opacity="0.9" />
      </g>
    );
  }

  // 4. FRONT HAIR SWEEP: Rendered ON TOP of body & blouse, falling over the shoulder
  if (layer === 'frontHair') {
    if (isBack) return null;

    return (
      <g id="avatar-front-hair-sweep">
        {/* Glamorous Side-Swept Locks flowing over right side of forehead */}
        <path
          d="M 218 50 C 230 48 246 54 256 66 C 262 76 264 92 262 108 C 260 114 254 116 250 110 C 252 98 250 82 244 72 C 236 60 224 54 218 50 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.1"
        />

        {/* Main Cascade Over Left Shoulder (Falling down chest/blouse along collarbone) */}
        {/* Outer Hair Mass */}
        <path
          d="M 205 66 C 196 78 190 98 188 120 C 186 142 190 165 192 188 C 194 205 190 222 184 236 C 182 238 180 236 180 232 C 182 215 184 195 183 175 C 182 150 178 125 182 100 C 186 80 196 68 205 66 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />

        {/* Inner Front Hair Lock draping across collarbone & upper blouse */}
        <path
          d="M 206 74 C 201 88 198 108 199 128 C 200 148 204 168 203 188 C 202 198 198 206 195 212 C 193 205 194 194 194 182 C 193 162 189 142 189 122 C 189 104 194 88 206 74 Z"
          fill="url(#hair-dark-grad)"
          stroke="#121010"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        {/* Hair Lustre & Specular Waves */}
        <path
          d="M 200 86 Q 194 110 192 135"
          fill="none"
          stroke="#423b3b"
          strokeWidth="1.2"
          opacity="0.65"
          strokeLinecap="round"
        />
        <path
          d="M 194 140 Q 196 165 197 190"
          fill="none"
          stroke="#423b3b"
          strokeWidth="1.1"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M 186 102 Q 184 130 185 160"
          fill="none"
          stroke="#302a2a"
          strokeWidth="0.8"
          opacity="0.5"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return null;
};
