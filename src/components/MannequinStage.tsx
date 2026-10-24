/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArmPose, Category, GarmentKey, SelectionState, ViewMode, BeltLatkanMode, LatkanBoxOrientation } from '../types';
import { Sparkles, ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import {
  ARM_L,
  ARM_R,
  ARM_OUT_L,
  A_POSE_ANGLE,
  A_POSE_PIVOT,
  ARM_REACH_SCALE,
  ARM_REACH_START,
  ARM_WRIST_X,
  BACK_CUTS,
  BASE_ZOOM,
  BODY,
  BOT,
  COLLAR,
  DRP,
  FAB,
  FABRIC,
  FABRIC_THEMES,
  FOCUS,
  GOLD,
  LEG_L,
  LEG_R,
  LENV,
  NECK,
  PAINTED,
  PAINTED_LATKAN_ANCHOR,
  PAINTED_BACK,
  KEYHOLE_BACK,
  TIE_BACK_WINDOW,
  CUT_OUT_BACK,
  PAINTED_HEM_BACK_L,
  HALTER_STRAP_OUTER_L,
  HALTER_BACK_TOP,
  HALTER_LACING,
  PAINTED_ARM_L,
  PAINTED_SLEEVES,
  ARM_UPPER_LEN,
  ARM_FORE_LEN,
  armAt,
  PAINTED_HEM_L,
  PAINTED_FLARED_SLEEVE_L,
  JACKET_PANEL_L,
  JACKET_OPENING_L,
  SLV,
  STAGE_CX,
  STAGE_H,
  STAGE_W,
  TOP,
  fillGradient,
  mir,
  poly,
  svgPath,
  resample,
  scaleX,
} from '../data/geometry';
import { GARMENTS } from '../data/garments';
import { AvatarRenderer } from './AvatarRenderer';

interface MannequinStageProps {
  currentGarment: GarmentKey;
  selection: SelectionState;
  activeCategory: Category;
  viewMode: ViewMode;
  onSetViewMode: (v: ViewMode) => void;
  armPose?: ArmPose;
  onSetArmPose?: (p: ArmPose) => void;
  beltLatkan?: BeltLatkanMode;
  onSetBeltLatkan?: (b: BeltLatkanMode) => void;
  latkanBoxOrientation?: LatkanBoxOrientation;
  onSetLatkanBoxOrientation?: (o: LatkanBoxOrientation) => void;
  loadingSlot: string;
  onSelectCategorySlot?: (slot: string) => void;
  /** The floating category rail covers the stage's left edge */
  railOnLeft?: boolean;
}

export const MannequinStage: React.FC<MannequinStageProps> = ({
  currentGarment,
  selection,
  activeCategory,
  viewMode,
  onSetViewMode,
  armPose: propsArmPose,
  onSetArmPose: propsOnSetArmPose,
  beltLatkan: propsBeltLatkan,
  onSetBeltLatkan: propsOnSetBeltLatkan,
  latkanBoxOrientation: propsLatkanBoxOrientation,
  onSetLatkanBoxOrientation: propsOnSetLatkanBoxOrientation,
  loadingSlot,
  onSelectCategorySlot,
  railOnLeft = false,
}) => {
  const [internalArmPose, setInternalArmPose] = useState<ArmPose>('resting');
  const armPose = propsArmPose ?? internalArmPose;
  const setArmPose = propsOnSetArmPose ?? setInternalArmPose;

  const [internalBeltLatkan, setInternalBeltLatkan] = useState<BeltLatkanMode>(
    currentGarment === 'lehenga' ? 'heavy' : 'none'
  );
  const beltLatkan = propsBeltLatkan ?? internalBeltLatkan;
  const setBeltLatkan = propsOnSetBeltLatkan ?? setInternalBeltLatkan;

  const [internalLatkanBoxOrientation, setInternalLatkanBoxOrientation] = useState<LatkanBoxOrientation>('horizontal');
  const latkanBoxOrientation = propsLatkanBoxOrientation ?? internalLatkanBoxOrientation;
  const setLatkanBoxOrientation = propsOnSetLatkanBoxOrientation ?? setInternalLatkanBoxOrientation;

  const isBack = viewMode === 'back';
  const g = GARMENTS[currentGarment];
  // Lehenga uses the painted fabric, skin and trims from the reference artwork
  const painted = currentGarment === 'lehenga';
  // Painted artwork for the side being viewed
  const PV = viewMode === 'back' ? PAINTED_BACK : PAINTED;

  const optOf = (c: Category) => c.opts.find((o) => o.id === selection[c.id]) || c.opts[0];
  const bySlot = (s: string) => {
    const c = g.cats.find((x) => x.slot === s);
    return c ? optOf(c) : null;
  };
  const geo = (s: string, fb: string) => {
    const o = bySlot(s);
    return o ? o.geo || o.id : fb;
  };
  const val = (s: string, fb: number): number => {
    const o = bySlot(s);
    return o && o.val != null ? o.val : fb;
  };

  const fabId = (bySlot('fabric') || {}).id || (bySlot('texture') || {}).id || 'sage';
  const fabTheme = FABRIC_THEMES[fabId] || FABRIC_THEMES.sage;
  const texKey = (bySlot('texture') || {}).id || (bySlot('topStyle') || {}).tex || fabTheme.texKey || 'plain';
  const topFill = currentGarment === 'shirt' ? fillGradient(FABRIC, texKey, 3) : fabTheme.topGradient;
  const topGradColors = (() => {
    const matches = topFill.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    if (matches && matches.length >= 2) {
      return {
        start: matches[0],
        mid: matches[Math.floor(matches.length / 2)],
        end: matches[matches.length - 1],
      };
    }
    return {
      start: fabTheme.baseColor,
      mid: fabTheme.baseColor,
      end: fabTheme.baseColor,
    };
  })();
  const botFill = currentGarment === 'shirt' ? fillGradient(FABRIC, texKey, -5) : fabTheme.botGradient;
  const botGradColors = (() => {
    const matches = botFill.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    if (matches && matches.length >= 2) {
      return {
        start: matches[0],
        mid: matches[Math.floor(matches.length / 2)],
        end: matches[matches.length - 1],
      };
    }
    return {
      start: fabTheme.baseColor,
      mid: fabTheme.baseColor,
      end: fabTheme.baseColor,
    };
  })();
  const fab = FAB[fabId] || FAB.organza;
  const bodyFill = 'linear-gradient(152deg, #f1d7bd, #e2c1a1)';

  const fitK = val('fit', 1);
  const hemY = val('hemY', 0) || null;
  const topStyleId = geo('topStyle', 'fitted');
  const neckId = currentGarment === 'shirt' ? 'shirtOpen' : geo('neckline', 'round');

  // Shoulders slope down from the neckline to the shoulder tip, as painted
  const shL = (n: { pts?: number[][]; sh?: [number, number] }) =>
    n.sh
      ? [n.sh, [(n.sh[0] + 194) / 2, (n.sh[1] + 140) / 2], [194, 140]]
      : [[167.4, 160], [174.4, 157.6], [180.4, 156.2]];
  const shR = (n: { pts?: number[][]; sh?: [number, number] }) =>
    n.sh
      ? [[STAGE_W - n.sh[0], n.sh[1]]]
      : mir([[180.4, 156.2], [174.4, 157.6], [167.4, 160]]);

  // Sleeves Configuration & Dynamic Path Builder
  const sleeveId = geo('sleeves', 'threequarter');

  // Stretched pose sleeve reach (along the arm), hem drop and underside sag
  const stretchDims = (sId: string) => {
    if (sId === 'cap') return { reach: 28, hemDrop: 2, maxSag: 1 };
    if (sId === 'short') return { reach: 50, hemDrop: 2, maxSag: 1 };
    if (sId === 'elbow') return { reach: 74, hemDrop: 2, maxSag: 1 };
    if (sId === 'flared') return { reach: 74, hemDrop: 46, maxSag: 8 };
    if (sId === 'threequarter') return { reach: 94, hemDrop: 2, maxSag: 1 };
    if (sId === 'bell') return { reach: 110, hemDrop: 44, maxSag: 16 };
    if (sId === 'puff') return { reach: 56, hemDrop: 14, maxSag: 10 };
    return { reach: 114, hemDrop: 3, maxSag: 2 };
  };

  // Stretch pose: the left arm lengthens to full reach (the base outstretched arm is
  // drawn short) and swings down from the shoulder into a relaxed A-pose.
  // Points at the armpit stay put and the bend ramps up along the upper arm,
  // so the sleeve's inner edge settles against the bodice side seam.
  const bendArm = (pts: number[][]): number[][] =>
    pts.map(([x0, y]) => {
      // Stretch the arm between the shoulder and the wrist; the hand keeps its size
      const x = x0 >= ARM_REACH_START ? x0
        : x0 >= ARM_WRIST_X ? ARM_REACH_START - (ARM_REACH_START - x0) * ARM_REACH_SCALE
        : ARM_REACH_START - (ARM_REACH_START - ARM_WRIST_X) * ARM_REACH_SCALE - (ARM_WRIST_X - x0);
      const t = Math.min(1, Math.max(0, (A_POSE_PIVOT[0] - 6 - x) / 36));
      const a = -A_POSE_ANGLE * t * t * (3 - 2 * t);
      const dx = x - A_POSE_PIVOT[0];
      const dy = y - A_POSE_PIVOT[1];
      return [
        A_POSE_PIVOT[0] + dx * Math.cos(a) - dy * Math.sin(a),
        A_POSE_PIVOT[1] + dx * Math.sin(a) + dy * Math.cos(a),
      ];
    });
  const armOutL = bendArm(ARM_OUT_L);
  const armOutR = mir(armOutL);
  const bentXY = (x: number, y: number) => bendArm([[x, y]])[0].map((v) => Math.round(v * 10) / 10).join(' ');

  // Stretch pose on the painted lehenga: sleeves are cut along the painted arm skeleton
  // (armpit, down the inner edge, across the hem, up the outer edge to the shoulder tip)
  const paintedSleeveL = (sId: string): number[][] | null => {
    if (sId === 'flared') return PAINTED_FLARED_SLEEVE_L;
    const spec = PAINTED_SLEEVES[sId];
    if (!spec) return null;
    const { len, ease, flare, puff } = spec;
    const flareFrom = spec.flareFrom ?? len * 0.6;
    const s0 = 14;
    const steps = Math.max(6, Math.round((len - s0) / 6));
    const edge = (side: 1 | -1) =>
      Array.from({ length: steps + 1 }, (_, i) => {
        const sAt = s0 + ((len - s0) * i) / steps;
        const a = armAt(sAt);
        const f = Math.max(0, (sAt - flareFrom) / Math.max(1, len - flareFrom));
        const extra = ease + flare * Math.pow(f, 1.3) + puff * Math.sin((Math.PI * sAt) / len);
        return [a.p[0] + side * a.n[0] * (a.w + extra), a.p[1] + side * a.n[1] * (a.w + extra)];
      });
    const inner = edge(-1);
    const outer = edge(1).reverse();
    const top = armAt(0);
    const cap = [top.p[0] + top.n[0] * (top.w + ease) - top.t[0] * 6, top.p[1] + top.n[1] * (top.w + ease) - top.t[1] * 6];
    return [PAINTED_ARM_L.armpit, ...inner, ...outer, cap, PAINTED_ARM_L.tip];
  };

  // Bare upper arm (shoulder to just past the elbow) that the painted forearm continues from
  const paintedUpperArmSide = (sd: 1 | -1): number[][] => {
    const s1 = ARM_UPPER_LEN + 34;
    const steps = 16;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const a = armAt(-16 + ((s1 + 16) * i) / steps);
      return [a.p[0] + sd * a.n[0] * a.w, a.p[1] + sd * a.n[1] * a.w];
    });
  };
  const paintedUpperArmL = (): number[][] => [...paintedUpperArmSide(1), ...paintedUpperArmSide(-1).reverse()];
  // Where the painted forearm fades in over the drawn arm (just below the painted sleeve hem,
  // so the part of the forearm the painting hid under its sleeve is never shown)
  const forearmFade = () => [armAt(ARM_UPPER_LEN + 16).p, armAt(ARM_UPPER_LEN + 30).p];

  // The painted forearm takes over from the elbow down; nothing of it shows above the elbow
  const paintedForearmClipL = (): number[][] => {
    const e = armAt(ARM_UPPER_LEN + 12);
    const w = armAt(ARM_UPPER_LEN + ARM_FORE_LEN + 70);
    return [
      [e.p[0] + e.n[0] * 30, e.p[1] + e.n[1] * 30],
      [e.p[0] - e.n[0] * 30, e.p[1] - e.n[1] * 30],
      [w.p[0] - w.n[0] * 45, w.p[1] - w.n[1] * 45],
      [w.p[0] + w.n[0] * 45, w.p[1] + w.n[1] * 45],
    ];
  };

  const buildLeftSleevePath = (sId: string, pose: string, tip: number[], underarm: number[]): number[][] => {
    const s = SLV[sId];
    if (!s) {
      // Anatomically sculpted armscye (armhole) for sleeveless bodice
      // Clean, elegant S-curve scoop around the shoulder joint
      return [
        underarm,
        [underarm[0] + 2, underarm[1] - 8],
        [underarm[0] + 6, underarm[1] - 22],
        [tip[0] + 3, tip[1] + 38],
        [tip[0] + 4, tip[1] + 24],
        [tip[0] + 2, tip[1] + 11],
        tip,
      ];
    }

    if (pose === 'stretched' && painted) return paintedSleeveL(sId)!;
    if (pose === 'stretched') {
      const { reach, hemDrop, maxSag } = stretchDims(sId);

      const xEnd = 164 - reach;
      const yArmTopEnd = 146 + reach * 0.1;
      const yArmBotEnd = 178 - reach * 0.05;
      const yHemBot = yArmBotEnd + hemDrop;

      // 1. Underarm to sleeve hem: once the arm swings down, the sleeve's inner
      // edge runs from the armpit to the hem corner along the bodice side
      const corner = bendArm([[xEnd, yHemBot]])[0];
      const underPts: number[][] = [];
      const sagSteps = 6;
      for (let i = 0; i <= sagSteps; i++) {
        const f = i / sagSteps;
        const bow = Math.sin(f * Math.PI) * Math.min(maxSag, 8) * 0.5;
        underPts.push([underarm[0] + f * (corner[0] - underarm[0]) - bow, underarm[1] + f * (corner[1] - underarm[1])]);
      }

      // 2. Sleeve hem across
      const hemPts: number[][] = [];
      const hemSteps = 5;
      for (let i = hemSteps - 1; i >= 0; i--) {
        const f = i / hemSteps;
        const x = xEnd - Math.sin(f * Math.PI) * (sId === 'bell' ? 8 : sId === 'flared' ? 5 : 0);
        const y = (yArmTopEnd - 2) + f * (yHemBot - (yArmTopEnd - 2));
        hemPts.push([x, y]);
      }

      // 3. Sleeve outer edge returning smoothly over shoulder crown to shoulder tip
      const topPtsList: number[][] = [];
      if (sId === 'puff') {
        topPtsList.push(
          [xEnd, yArmTopEnd - 2],
          [xEnd + reach * 0.25, 142],
          [xEnd + reach * 0.5, 134],
          [xEnd + reach * 0.72, 132],
          [152, 136],
          [160, 141],
          tip
        );
      } else {
        const topSteps = 8;
        for (let i = 1; i <= topSteps; i++) {
          const f = i / topSteps;
          const x = xEnd + f * (tip[0] - xEnd);
          // Subtle convex arch over the outstretched shoulder deltoid
          const curveLift = Math.sin(f * Math.PI) * (reach > 40 ? 2.5 : 1.2);
          const y = (yArmTopEnd - 2) + f * (tip[1] - (yArmTopEnd - 2)) - curveLift;
          topPtsList.push([x, y]);
        }
      }

      return [...underPts, ...bendArm([...hemPts, ...topPtsList])];
    } else {
      // Natural anatomical resting pose with rounded, curved shoulder cap

      // Cap sleeve: hugs and rounds gracefully over the shoulder ball
      if (sId === 'cap') {
        const outerCapPts: number[][] = [
          tip,
          [tip[0] - 4, tip[1] + 0.5],
          [tip[0] - 9.5, tip[1] + 2],
          [tip[0] - 15, tip[1] + 5],
          [tip[0] - 20, tip[1] + 9.5],
          [tip[0] - 24, tip[1] + 15.5],
          [tip[0] - 26.5, tip[1] + 23],
          [tip[0] - 27.5, tip[1] + 31],
          [tip[0] - 27, tip[1] + 39], // outer hem endpoint at ~ [138, 185]
        ];

        const oEnd = outerCapPts[outerCapPts.length - 1];
        const capHemPts: number[][] = [
          oEnd,
          [oEnd[0] + 3, oEnd[1] + 5],
          [oEnd[0] + 7, oEnd[1] + 10],
          [oEnd[0] + 11.5, oEnd[1] + 15],
          [underarm[0] + 1, underarm[1] - 4],
          underarm,
        ];

        const hemToOuter = capHemPts.slice(0, -1).reverse();
        const outerToTip = outerCapPts.slice(1).reverse();
        return [...hemToOuter, ...outerToTip];
      }

      // Puff sleeve: voluminous rounded gathers blooming over shoulder
      if (sId === 'puff') {
        const puffCrown: number[][] = [
          tip,
          [tip[0] - 4, tip[1] - 8],
          [tip[0] - 12, tip[1] - 14],
          [tip[0] - 23, tip[1] - 15],
          [tip[0] - 34, tip[1] - 11],
          [tip[0] - 42, tip[1] - 1],
          [tip[0] - 47, tip[1] + 14],
          [tip[0] - 48, tip[1] + 32],
          [tip[0] - 45, tip[1] + 50],
          [tip[0] - 39, tip[1] + 68],
          [tip[0] - 30, tip[1] + 85],
          [tip[0] - 20, tip[1] + 99], // outer hem at ~ [145, 245]
        ];
        const oEnd = puffCrown[puffCrown.length - 1];
        const puffHemPts: number[][] = [
          oEnd,
          [oEnd[0] + 6, oEnd[1] + 2],
          [oEnd[0] + 13, oEnd[1] + 2],
          [165, 245],
        ];
        const innerJunction = [165, 245];
        const hemToOuter = puffHemPts.slice(0, -1).reverse();
        const outerToTip = puffCrown.slice(1).reverse();
        return [
          innerJunction,
          ...hemToOuter,
          ...outerToTip,
        ];
      }

      // Smooth, convex shoulder cap crown rounding seamlessly over deltoid
      const capCrown: number[][] = [
        tip,
        [tip[0] - 3.5, tip[1] + 0.4],
        [tip[0] - 8.5, tip[1] + 1.8],
        [tip[0] - 14, tip[1] + 4.8],
        [tip[0] - 19, tip[1] + 9.2],
        [tip[0] - 23, tip[1] + 15],
        [tip[0] - 25.5, tip[1] + 22.5],
        [tip[0] - 26.8, tip[1] + 31],
        [tip[0] - 27, tip[1] + 40], // reaches ~ [138, 186]
      ];

      // Down the arm from y = 186 to sleeve length s.L
      const hemYTarget = 150 + s.L;
      const armSteps = Math.max(6, Math.round(s.L / 20));
      const outerArmPts: number[][] = [];
      const innerArmPts: number[][] = [];

      // Anatomical outer arm contour with tailoring ease ensuring complete coverage of the bare arm
      const getArmOuterX = (cy: number) => {
        if (cy <= 186) return 138;
        if (cy <= 240) return 138 + ((cy - 186) / 54) * (138.5 - 138);
        if (cy <= 290) return 138.5 + ((cy - 240) / 50) * (136.5 - 138.5);
        if (cy <= 350) return 136.5 + ((cy - 290) / 60) * (134.5 - 136.5);
        return 134.5 + ((cy - 350) / 62) * (136.5 - 134.5);
      };

      // Anatomical inner arm contour with tailoring ease ensuring complete coverage of the bare arm
      const getArmInnerX = (cy: number) => {
        if (cy <= 190) return 170 + ((190 - cy) / 6) * (172 - 170);
        if (cy <= 240) return 170 + ((cy - 190) / 50) * (167 - 170);
        if (cy <= 290) return 167 + ((cy - 240) / 50) * (163 - 167);
        if (cy <= 350) return 163 + ((cy - 290) / 60) * (160 - 163);
        return 160 + ((cy - 350) / 62) * (157 - 160);
      };

      for (let i = 0; i <= armSteps; i++) {
        const f = i / armSteps;
        const cy = 186 + f * (hemYTarget - 186);

        if (sId === 'bell') {
          // Bell flare below elbow
          const bellFlare = cy > 260 ? Math.pow((cy - 260) / (hemYTarget - 260), 1.5) * 36 : 0;
          outerArmPts.push([getArmOuterX(cy) - bellFlare, cy]);
          innerArmPts.push([getArmInnerX(cy) + bellFlare * 0.7, cy]);
        } else {
          outerArmPts.push([getArmOuterX(cy), cy]);
          innerArmPts.push([getArmInnerX(cy), cy]);
        }
      }

      // Natural junction point where the inner sleeve connects directly to the bodice side seam
      // Eliminates the sharp triangular apex or unnatural detour to underarm [154, 214]
      const junctionY = Math.min(hemYTarget - 6, 260);
      const junctionPt = [getArmInnerX(junctionY), junctionY];

      // Inner arm points from the junction point down to the sleeve hem
      const validInnerPts: number[][] = [junctionPt];
      for (const p of innerArmPts) {
        if (p[1] > junctionY + 3) {
          validInnerPts.push(p);
        }
      }
      if (validInnerPts.length === 1) {
        validInnerPts.push(innerArmPts[innerArmPts.length - 1]);
      }

      // Sleeve hem across
      const oEnd = outerArmPts[outerArmPts.length - 1];
      const iEnd = validInnerPts[validInnerPts.length - 1];
      const hemPts: number[][] = [
        iEnd,
        [(iEnd[0] * 2 + oEnd[0]) / 3, (iEnd[1] * 2 + oEnd[1]) / 3 + 1.5],
        [(iEnd[0] + oEnd[0] * 2) / 3, (iEnd[1] + oEnd[1] * 2) / 3 + 1.5],
        oEnd,
      ];

      // Assemble full sleeve path:
      // junctionPt -> down inner arm -> hem -> up outer arm -> shoulder cap curve -> tip
      const outerPath = [...outerArmPts.slice(0, -1)].reverse();
      const capPath = [...capCrown.slice(1)].reverse();

      return [
        ...validInnerPts,
        ...hemPts.slice(1),
        ...outerPath,
        ...capPath,
      ];
    }
  };

  // Top / Blouse / Bodice & Sleeves: Unified Continuous Silhouette
  // The jacket set's choli sits under the jacket's own sleeves, so it is cut sleeveless
  const bodiceSleeveId = painted && topStyleId === 'jacket' ? 'sleeveless' : sleeveId;

  const topPts = () => {
    const b = TOP[topStyleId] || TOP.fitted;
    const n = (isBack ? BACK_CUTS[geo('back', 'roundBack')] : NECK[neckId]) || NECK.round;
    const right = b.right.map((p) => p.slice());
    if (hemY != null) right[right.length - 1] = [right[right.length - 1][0], hemY];
    const hemC = isBack && topStyleId !== 'peplum' ? [] : b.hemC || [];
    const shR_pts = shR(n);
    const shL_pts = shL(n);
    const tipR = shR_pts[shR_pts.length - 1];
    const tipL = shL_pts[0];
    const underarmR = right[0];
    const underarmL: [number, number] = [STAGE_W - underarmR[0], underarmR[1]];

    const s = SLV[bodiceSleeveId];

    // 1. Sleeveless: standard sleeveless bodice silhouette with armhole scoop
    if (!s) {
      // On the painted figure the armhole curves up to a strap that starts inside the
      // shoulder tip, so no fabric juts out over the arm
      const halter = painted && neckId === 'halter' && !isBack;
      const halterBack = painted && neckId === 'halter' && isBack;
      const strapL = halter ? [HALTER_STRAP_OUTER_L[HALTER_STRAP_OUTER_L.length - 1]] : halterBack ? [] : [[180.5, 157]];
      const leftSleevePath = halter
        ? [underarmL, ...HALTER_STRAP_OUTER_L.slice(0, -1)]
        : halterBack
        ? [underarmL]
        : painted
        ? [underarmL, [175.5, 206], [173.5, 192], [174.5, 176], [177, 165]]
        : buildLeftSleevePath(bodiceSleeveId, armPose, tipL, underarmL);
      const rightSleevePath = mir(leftSleevePath).reverse();
      const combined = [
        ...(painted ? strapL : shL_pts),
        ...(halterBack ? HALTER_BACK_TOP : n.pts),
        ...(painted ? mir(strapL) : shR_pts),
        ...rightSleevePath,
        ...right.slice(1),
        ...hemC,
        ...mir(right).reverse().slice(0, -1),
        ...leftSleevePath,
      ];
      return resample(scaleX(combined, fitK), 140);
    }

    // 2. Cap sleeve or outstretched pose: underarm connects cleanly at underarm point
    if (bodiceSleeveId === 'cap' || armPose === 'stretched') {
      const leftSleevePath = buildLeftSleevePath(bodiceSleeveId, armPose, tipL, underarmL);
      const rightSleevePath = mir(leftSleevePath).reverse();
      const combined = [
        ...shL_pts,
        ...n.pts,
        ...shR_pts,
        ...rightSleevePath,
        ...right.slice(1),
        ...hemC,
        ...mir(right).reverse().slice(0, -1),
        ...leftSleevePath,
      ];
      return resample(scaleX(combined, fitK), 240);
    }

    // 3. Resting pose with sleeves (short, puff, elbow, threequarter, full, bell):
    // The sleeve inner edge merges directly into the torso side seam at the natural junction point.
    // This completely eliminates the sharp triangular wedge between the blouse and sleeves.
    const hemYTarget = bodiceSleeveId === 'puff' ? 245 : 150 + s.L;
    const junctionY = Math.min(hemYTarget - 6, 260);

    const leftSleevePath = buildLeftSleevePath(bodiceSleeveId, armPose, tipL, underarmL);
    const rightSleevePath = mir(leftSleevePath).reverse();

    const junctionPtL = leftSleevePath[0];
    const junctionPtR = [STAGE_W - junctionPtL[0], junctionPtL[1]];

    // Filter torso side points strictly below junctionY, seamlessly starting at junctionPt
    const torsoRightBelowJunction = right.filter((p) => p[1] > junctionY + 2);
    const torsoRightSeam = [junctionPtR, ...torsoRightBelowJunction];
    const torsoLeftSeam = mir(torsoRightSeam).reverse();

    const combined = [
      ...shL_pts,
      ...n.pts,
      ...shR_pts,
      ...rightSleevePath,
      ...torsoRightSeam.slice(1),
      ...hemC,
      ...torsoLeftSeam.slice(0, -1),
      ...leftSleevePath,
    ];

    return resample(scaleX(combined, fitK), 240);
  };

  const sleeveAnchors = () => {
    const b = TOP[topStyleId] || TOP.fitted;
    const n = (isBack ? BACK_CUTS[geo('back', 'roundBack')] : NECK[neckId]) || NECK.round;
    const shR_pts = shR(n);
    const shL_pts = shL(n);
    const tipR = shR_pts[shR_pts.length - 1];
    const tipL = shL_pts[0];
    const underarmR = b.right[0];
    const underarmL = [STAGE_W - underarmR[0], underarmR[1]];

    const [scaledTipL] = scaleX([tipL], fitK);
    const [scaledUnderL] = scaleX([underarmL], fitK);
    const [scaledTipR] = scaleX([tipR], fitK);
    const [scaledUnderR] = scaleX([underarmR], fitK);

    return { scaledTipL, scaledUnderL, scaledTipR, scaledUnderR };
  };

  const sleevePts = (side: 'l' | 'r') => {
    const s = SLV[sleeveId];
    if (!s) return null;

    if (armPose === 'stretched' && painted) {
      const path = paintedSleeveL(sleeveId);
      if (!path) return null;
      const p = resample(scaleX(path, fitK), 40);
      return side === 'r' ? mir(p) : p;
    }
    if (armPose === 'stretched') {
      const { reach, hemDrop, maxSag } = stretchDims(sleeveId);

      const xEnd = 164 - reach;
      const yArmTopEnd = 146 + reach * 0.1;
      const yArmBotEnd = 178 - reach * 0.05;
      const yHemBot = yArmBotEnd + hemDrop;

      const topPtsList: number[][] = [];
      if (sleeveId === 'puff') {
        topPtsList.push([164, 144]);
        topPtsList.push([150, 134]);
        topPtsList.push([132, 136]);
        topPtsList.push([xEnd, yArmTopEnd - 2]);
      } else {
        const topSteps = 6;
        for (let i = 0; i <= topSteps; i++) {
          const f = i / topSteps;
          const x = 164 - f * reach;
          const y = 146 + f * reach * 0.1 - 2;
          topPtsList.push([x, y]);
        }
      }

      const hemPtsList: number[][] = [];
      const hemSteps = 4;
      for (let i = 1; i <= hemSteps; i++) {
        const f = i / hemSteps;
        const x = xEnd - Math.sin(f * Math.PI) * (sleeveId === 'bell' ? 8 : sleeveId === 'flared' ? 5 : 0);
        const y = (yArmTopEnd - 2) + f * (yHemBot - (yArmTopEnd - 2));
        hemPtsList.push([x, y]);
      }

      const outer = bendArm([...topPtsList, ...hemPtsList]);
      const corner = outer[outer.length - 1];
      const armpit = [178.4, 215];
      const underPtsList: number[][] = [];
      const sagSteps = 8;
      for (let i = 1; i <= sagSteps; i++) {
        const f = i / sagSteps;
        const bow = Math.sin(f * Math.PI) * Math.min(maxSag, 8) * 0.5;
        underPtsList.push([corner[0] + f * (armpit[0] - corner[0]) - bow, corner[1] + f * (armpit[1] - corner[1])]);
      }

      const armholePts = [[166, 186], [170, 160], [164, 144]];
      const allPts = [...outer, ...underPtsList, ...armholePts];
      const p = resample(scaleX(allPts, fitK), 34);
      return side === 'r' ? mir(p) : p;
    }

    // Natural anatomical resting sleeve polygon connecting smoothly over shoulder cap to underarm
    const b = TOP[topStyleId] || TOP.fitted;
    const n = (isBack ? BACK_CUTS[geo('back', 'roundBack')] : NECK[neckId]) || NECK.round;
    const right = b.right.map((p) => p.slice());
    const shL_pts = shL(n);
    const tipL = shL_pts[0];
    const underarmR = right[0];
    const underarmL: [number, number] = [STAGE_W - underarmR[0], underarmR[1]];

    const leftPath = buildLeftSleevePath(sleeveId, 'resting', tipL, underarmL);
    if (!leftPath || leftPath.length === 0) return null;

    // Connect tipL back to junction startPt along the armscye seam curve
    const startPt = leftPath[0];
    const armscyeSteps = 8;
    const armscyePts: number[][] = [];
    for (let i = 1; i < armscyeSteps; i++) {
      const f = i / armscyeSteps;
      const p0 = tipL;
      const p1 = [tipL[0] + 5, tipL[1] * 0.6 + startPt[1] * 0.4];
      const p2 = [startPt[0] + 4, tipL[1] * 0.25 + startPt[1] * 0.75];
      const p3 = startPt;
      const cx =
        Math.pow(1 - f, 3) * p0[0] +
        3 * Math.pow(1 - f, 2) * f * p1[0] +
        3 * (1 - f) * Math.pow(f, 2) * p2[0] +
        Math.pow(f, 3) * p3[0];
      const cy =
        Math.pow(1 - f, 3) * p0[1] +
        3 * Math.pow(1 - f, 2) * f * p1[1] +
        3 * (1 - f) * Math.pow(f, 2) * p2[1] +
        Math.pow(f, 3) * p3[1];
      armscyePts.push([cx, cy]);
    }

    const closedLeft = [...leftPath, ...armscyePts];
    const resampled = resample(scaleX(closedLeft, fitK), 64);
    return side === 'r' ? mir(resampled) : resampled;
  };

  // Cuffs
  const cuffH = val('cuff', 0);
  const cuffPts = (side: 'l' | 'r') => {
    const s = SLV[sleeveId];
    if (!s || !cuffH) return null;

    if (armPose === 'stretched') {
      const { reach } = stretchDims(sleeveId);

      const xEnd = 164 - reach;
      const cuffW = Math.max(6, Math.min(16, cuffH * 0.35));
      const x1 = xEnd + cuffW;
      const x2 = xEnd;
      const yTop1 = 146 + (164 - x1) * 0.1 - 2;
      const yTop2 = 146 + reach * 0.1 - 2;
      const yBot1 = 178 - (164 - x1) * 0.05 + 2;
      const yBot2 = 178 - reach * 0.05 + 2;

      const p = scaleX(
        bendArm([
          [x1, yTop1],
          [x2, yTop2],
          [x2, yBot2],
          [x1, yBot1],
        ]),
        fitK
      );
      return side === 'r' ? mir(p) : p;
    }

    const y2 = 150 + s.L;
    const y1 = y2 - cuffH;
    const t2 = s.L;
    const t1 = s.L - cuffH;
    const x2 = t2 <= 150 ? 159 - 0.065 * t2 : 149.25 - 0.03 * (t2 - 150);
    const x1 = t1 <= 150 ? 159 - 0.065 * t1 : 149.25 - 0.03 * (t1 - 150);
    const wEnd = s.w[2];
    const wMid = s.w[1] + (s.w[2] - s.w[1]) * (t1 / s.L > 0.5 ? 1 : 0.6);
    const p = scaleX(
      [
        [x1 - wMid / 2 - 1, y1],
        [x1 + wMid / 2 + 1, y1],
        [x2 + wEnd / 2 + 1.5, y2],
        [x2 - wEnd / 2 - 1.5, y2],
      ],
      fitK
    );
    return side === 'r' ? mir(p) : p;
  };

  const gravityFoldPaths = (side: 'l' | 'r') => {
    if (armPose !== 'stretched') return [];
    if (!SLV[sleeveId] || sleeveId === 'sleeveless' || sleeveId === 'cap') return [];
    // Short, elbow, and three-quarter are simple tailored sleeves (no baggy droop or baggy fold ripples)
    if (sleeveId === 'short' || sleeveId === 'elbow' || sleeveId === 'threequarter') return [];

    if (sleeveId !== 'bell' || painted) return [];
    const { reach, hemDrop, maxSag } = stretchDims(sleeveId);

    const xEnd = 164 - reach;
    const yHemBot = 178 - reach * 0.05 + hemDrop;

    const raw = [
      `M ${bentXY(166, 178)} Q ${bentXY(xEnd + (164 - xEnd) * 0.48, yHemBot + maxSag * 0.55)} ${bentXY(xEnd + 8, yHemBot - 10)}`,
      `M ${bentXY(158, 172)} Q ${bentXY(xEnd + (164 - xEnd) * 0.3, yHemBot + maxSag * 0.28)} ${bentXY(xEnd + 18, yHemBot - 20)}`,
      `M ${bentXY(168, 182)} Q ${bentXY(xEnd + (164 - xEnd) * 0.65, yHemBot + maxSag * 0.82)} ${bentXY(xEnd + 5, yHemBot - 5)}`,
    ];

    if (side === 'r') {
      return raw.map((d) =>
        d.replace(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)/g, (_m, x, _dec, y) => {
          const mx = Math.round(230 + (230 - parseFloat(x)));
          return `${mx} ${y}`;
        })
      );
    }
    return raw;
  };

  // Bottom Skirt / Pants
  const botGeo = currentGarment === 'shirt' ? 'trouser' : geo('bottom', 'aline');
  const lenId = currentGarment === 'shirt' ? 'floor' : (bySlot('bottomLength') || { id: 'floor' }).id;
  // Lehenga waistband sits where the painted skirt's waistband starts
  const botTop = currentGarment === 'dress' ? hemY || 330 : currentGarment === 'shirt' ? 300 : currentGarment === 'lehenga' ? 273 : 298;

  const botPts = (bg: string, lg: string, topY: number) => {
    const sk = BOT[bg] || BOT.aline;
    const hh = LENV[lg] || 400;
    const top = topY;
    const scaledProfile = sk.profile.map((p) => [p[0], p[1] * fitK]);
    const right = scaledProfile.map((p) => [STAGE_CX + p[1], top + p[0] * hh]);
    const left = scaledProfile.map((p) => [STAGE_CX - p[1], top + p[0] * hh]).reverse();
    const hem: number[][] = [];
    if (sk.scallop) {
      const hw = scaledProfile[scaledProfile.length - 1][1];
      const y = top + hh;
      for (let i = 1; i < 8; i++) {
        hem.push([STAGE_CX + hw - (2 * hw * i) / 8, i % 2 ? y - 16 : y]);
      }
    } else if (painted && bg === 'pleated') {
      // Scalloped hem traced from the painting, fitted to this skirt's width and length
      const [lastT, hw] = scaledProfile[scaledProfile.length - 1];
      const cornerY = top + lastT * hh;
      const hemL = isBack ? PAINTED_HEM_BACK_L : PAINTED_HEM_L;
      const [x0, y0] = hemL[0];
      const span = STAGE_CX - x0;
      const lenK = hh / LENV.floor;
      const half = hemL.map(([x, y]) => [(STAGE_CX - x) / span, (y - y0) * lenK]);
      half.forEach(([u, dy]) => hem.push([STAGE_CX + u * hw, cornerY + dy]));
      [...half].reverse().forEach(([u, dy]) => hem.push([STAGE_CX - u * hw, cornerY + dy]));
    } else if (currentGarment !== 'shirt') {
      // Rounded hem: from the side corners down to the lowest point at centre front
      const [lastT, hw] = scaledProfile[scaledProfile.length - 1];
      const cornerY = top + lastT * hh;
      const centerY = top + hh + (lastT < 1 ? 0 : 8);
      const hemSteps = bg === 'tiered' || bg === 'mermaid' ? 44 : 12;
      for (let i = 1; i < hemSteps; i++) {
        const f = i / hemSteps;
        const wave = bg === 'tiered' ? Math.sin(f * Math.PI * 22) * 1.4 : bg === 'mermaid' ? Math.sin(f * Math.PI * 16) * 2.2 : 0;
        hem.push([STAGE_CX + hw - 2 * hw * f, cornerY + Math.sin(f * Math.PI) * (centerY - cornerY) + wave]);
      }
    }

    // Top waist anatomical curve across the front
    const wTop = scaledProfile[0][1];
    const waistDip = currentGarment === 'shirt' ? 2 : painted ? 2.5 : 4.5;
    const waistCurveSteps = 10;
    const waistTopCurve: number[][] = [];
    for (let i = 1; i < waistCurveSteps; i++) {
      const f = i / waistCurveSteps;
      const x = STAGE_CX - wTop + 2 * wTop * f;
      const y = top + Math.sin(f * Math.PI) * waistDip;
      waistTopCurve.push([x, y]);
    }

    return resample([...right, ...hem, ...left, ...waistTopCurve], 240);
  };

  const skirtFolds = () => {
    if (currentGarment === 'shirt') return [];
    const sk = BOT[botGeo] || BOT.aline;
    const hh = LENV[lenId] || 400;
    const top = botTop;
    const hemY = top + hh;
    const hw = sk.profile[sk.profile.length - 1][1] * fitK;
    const wBot = 53.5 * fitK;
    const midW = sk.profile[Math.floor(sk.profile.length / 2)][1] * fitK;

    const folds: { d: string; opacity: number }[] = [];
    const ratios = [-0.74, -0.5, -0.26, 0, 0.26, 0.5, 0.74];
    const waistDip = 4.5;
    const wbHeight = currentGarment === 'lehenga' ? 15 : 0;

    ratios.forEach((r) => {
      const xTop = STAGE_CX + r * wBot * 0.92;
      const yStart = top + wbHeight + Math.cos((r * Math.PI) / 2) * waistDip;
      const xMid = STAGE_CX + r * midW * 0.94;
      const xBot = STAGE_CX + r * hw * 0.98;
      const yMid = top + wbHeight + (hh - wbHeight) * 0.48;

      folds.push({
        d: `M ${xTop.toFixed(1)} ${yStart.toFixed(1)} Q ${xMid.toFixed(1)} ${yMid.toFixed(1)} ${xBot.toFixed(1)} ${hemY.toFixed(1)}`,
        opacity: Math.abs(r) === 0 ? 0.22 : 0.16,
      });
    });

    return folds;
  };

  const skirtTiers = () => {
    if (currentGarment !== 'lehenga' && currentGarment !== 'dress') return [];
    if (botGeo !== 'tiered') return [];
    const hh = LENV[lenId] || 400;
    const top = botTop;
    return [top + hh * 0.29, top + hh * 0.62];
  };

  // Dupatta / Pallu Drape
  // A jacket set is worn without a dupatta
  const drapeId = topStyleId === 'jacket' ? '' : geo('drape', '');
  const pieces = drapeId && DRP[drapeId] ? DRP[drapeId].filter(Boolean).map((p) => resample(isBack ? mir(p) : p, 26)) : [];
  const dupCat = g.cats.find((c) => c.slot === 'drape' || c.slot === 'fabric');
  const hemBack = hemY != null ? hemY : topStyleId === 'kurta' ? 536 : topStyleId === 'shirtBody' ? 428 : 330;
  const waistV = val('waist', -1);

  // Waistband
  const waistBand = (v: number) => {
    const h = 14 + v * 6;
    const y = 298;
    const w = 52 * fitK;
    const dip = 4.5;
    const steps = 8;
    const topPts: number[][] = [];
    const botPtsList: number[][] = [];
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const x = STAGE_CX - w + 2 * w * f;
      topPts.push([x, y + Math.sin(f * Math.PI) * dip]);
      botPtsList.push([x, y + h + Math.sin(f * Math.PI) * dip]);
    }
    const base = [...topPts, ...botPtsList.reverse()];
    if (v >= 2) {
      const sX = STAGE_CX + w - 4;
      const sY = y + h;
      return base.concat([[sX + 10, sY + 62], [sX - 14, sY + 58], [sX - 4, sY]]);
    }
    return base;
  };

  // 2D Game Style Linework & Details Generators
  const skirtBorderData = () => {
    if (currentGarment === 'shirt') return null;
    const sk = BOT[botGeo] || BOT.aline;
    const hh = LENV[lenId] || 400;
    const top = botTop;
    const hemY = top + hh;
    const hw = sk.profile[sk.profile.length - 1][1] * fitK;

    const upperPts: [number, number][] = [];
    const midPts: [number, number][] = [];
    const lowerPts: [number, number][] = [];

    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const x = STAGE_CX - hw * 0.98 + 2 * hw * 0.98 * f;
      const lift = Math.sin(f * Math.PI) * 8;
      upperPts.push([x, hemY - 26 + lift]);
      midPts.push([x, hemY - 13 + lift]);
      lowerPts.push([x, hemY - 3 + lift]);
    }

    const chevrons: string[] = [];
    for (let i = 0; i < upperPts.length - 1; i++) {
      const p1 = upperPts[i];
      const p2 = midPts[i];
      const p3 = upperPts[i + 1];
      const p4 = midPts[i + 1];
      chevrons.push(
        `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${((p2[0] + p4[0]) / 2).toFixed(1)} ${((p2[1] + p4[1]) / 2).toFixed(1)} L ${p3[0].toFixed(1)} ${p3[1].toFixed(1)}`
      );
    }

    return {
      upper: 'M ' + upperPts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '),
      mid: 'M ' + midPts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '),
      lower: 'M ' + lowerPts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '),
      chevrons,
      lowerPts,
      hw,
      hemY,
    };
  };

  const necklineData = () => {
    const n = (isBack ? BACK_CUTS[geo('back', 'roundBack')] : NECK[neckId]) || NECK.round;
    const pts = scaleX(n.pts, fitK);
    return {
      d: 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '),
      pts,
    };
  };

interface BlouseDetailsResult {
  isBack: boolean;
  isNotched?: boolean;
  isPeplum?: boolean;
  smockingLines?: { d: string; accentD: string; y: number }[];
  smockingGathers?: string[];
  waistSeam?: string;
  waistFrillUpper?: string;
  peplumFlutes?: { d: string; shadow: string | null }[];
  peplumPleats?: { crease: string; shadow: string; ridge: string; fold: string }[];
  peplumDarts?: string[];
  peplumHemStitch?: string;
  peplumShade?: string;
  isCorset?: boolean;
  corsetSeams?: string[];
  corsetPanels?: { d: string; light: boolean }[];
  corsetHem?: string;
  corsetNeckStitch?: string;
  corsetLacing?: string[];
  corsetLaceTop?: number;
  hemRuffleLine?: string;
  hemRuffleAccent?: string;
  spine?: string;
  tieBow?: string | null;
  doriLeft?: string | null;
  doriRight?: string | null;
  latkanL?: { x: number; y: number } | null;
  latkanR?: { x: number; y: number } | null;
  hasLowerTie?: boolean;
  lowerTieBow?: string;
  lowerDoriL?: string;
  lowerDoriR?: string;
  lowerLatkanL?: { x: number; y: number } | null;
  lowerLatkanR?: { x: number; y: number } | null;
  showPotli?: boolean;
  dori?: { y: number; xl: number; xr: number; tailEnd: number } | null;
  keyhole?: boolean;
  tieWindow?: boolean;
  cutWindow?: boolean;
  potliYs?: number[];
  dartLeft?: string;
  dartRight?: string;
  hemBorder?: string;
  princessLeft?: string;
  princessRight?: string;
  cupLeft?: string;
  cupRight?: string;
  underbustPatti?: string;
  centerSeam?: string;
  hemUpperPatti?: string;
  hemMidPatti?: string;
  hemLine?: string;
}

  const blouseDetails = (): BlouseDetailsResult | null => {
    if (currentGarment !== 'lehenga' && currentGarment !== 'saree' && currentGarment !== 'dress') return null;
    const b = TOP[topStyleId] || TOP.fitted;
    const hem = hemY != null ? hemY : (b.right[b.right.length - 1] ? b.right[b.right.length - 1][1] : 288);
    const n = (isBack ? BACK_CUTS[geo('back', 'roundBack')] : NECK[neckId]) || NECK.round;
    const neckLowestY = Math.max(...n.pts.map((p) => p[1]));

    // CORSET TOP: boned panels with double topstitched seams curving in to the waist,
    // finished in a pointed V hem below the waist
    if (topStyleId === 'corset') {
      const hemC = b.hemC || [];
      const hemAt = (x: number) => {
        let best = hemC[0];
        for (const q of hemC) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q;
        // the back has a straight hem at the waist
        return isBack ? 274 : best ? best[1] : 276;
      };
      const neckAt = (x: number) => {
        let best = n.pts[0];
        for (const q of n.pts) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q;
        return best ? best[1] : 180;
      };
      // seam paths from the neckline to the hem, curving in toward the waist (offsets from centre)
      const seamDefs = [
        { top: 16, waist: 9, hemX: 8 },
        { top: 32, waist: 20, hemX: 21 },
        { top: 46, waist: 31, hemX: 33 },
      ];
      const seamPath = (sd: number, sdef: { top: number; waist: number; hemX: number }, inset = 0) => {
        const xt = STAGE_CX + sd * (sdef.top + inset) * fitK;
        const xw = STAGE_CX + sd * (sdef.waist + inset) * fitK;
        const xh = STAGE_CX + sd * (sdef.hemX + inset) * fitK;
        const yt = Math.max(neckAt(xt) + 1.5, 160);
        return `M ${xt.toFixed(1)} ${yt.toFixed(1)} C ${xt.toFixed(1)} ${(yt + 40).toFixed(1)} ${xw.toFixed(1)} 236 ${xw.toFixed(1)} 256 L ${xh.toFixed(1)} ${(hemAt(xh) - 0.5).toFixed(1)}`;
      };
      const seams: string[] = [];
      const panels: { d: string; light: boolean }[] = [];
      [-1, 1].forEach((sd) =>
        seamDefs.forEach((sdef, i) => {
          if (isBack && i === 0) return;
          seams.push(seamPath(sd, sdef, -1.3), seamPath(sd, sdef, 1.3));
          // panel shading strip just outside each seam (alternating light and shade reads as boned panels)
          panels.push({ d: `${seamPath(sd, sdef, 1.6)}`, light: i % 2 === 0 });
        })
      );
      const hemPts = [[STAGE_CX + 41.6 * fitK, 276], ...hemC, [STAGE_CX - 41.6 * fitK, 276]];
      const corsetHem = 'M ' + hemPts.map((q) => `${(STAGE_CX + (q[0] - STAGE_CX) * 0.97).toFixed(1)} ${(q[1] - 3.2).toFixed(1)}`).join(' L ');
      const necks = n.pts.map((q) => [STAGE_CX + (q[0] - STAGE_CX) * fitK, q[1] + 3.5]);
      const corsetNeckStitch = 'M ' + necks.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ');
      const lacing: string[] = [];
      if (isBack) {
        for (let y = neckLowestY + 5; y < 262; y += 11) {
          lacing.push(`M ${STAGE_CX - 6} ${y} L ${STAGE_CX + 6} ${y + 9}`, `M ${STAGE_CX + 6} ${y} L ${STAGE_CX - 6} ${y + 9}`);
        }
      }
      return {
        isBack,
        isCorset: true,
        corsetSeams: seams,
        corsetPanels: panels,
        corsetHem,
        corsetNeckStitch: isBack ? undefined : corsetNeckStitch,
        corsetLacing: lacing,
        corsetLaceTop: neckLowestY + 3,
      };
    }

    // PEPLUM TOP: fitted bodice with princess darts to a natural-waist seam, then
    // inverted box pleats opening into a flared peplum with a stitched hem
    if (topStyleId === 'peplum') {
      const waistY = 262;
      const hemSideY = hem || 344;
      const hemC = b.hemC || [];
      // hem height at x (front hem curves lower at centre)
      const hemAt = (x: number) => {
        let best = hemC[0];
        for (const q of hemC) if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q;
        return best ? best[1] : hemSideY;
      };
      const waistHalf = 40.3 * fitK;
      const hemHalf = 102 * fitK;
      const pleatW = [18, 34]; // pleat centres at the waist seam (from centre front)
      const pleatH = [34, 76]; // pleat centres at the hem
      const pleats: { crease: string; shadow: string; ridge: string; fold: string }[] = [];
      [-1, 1].forEach((sd) =>
        pleatW.forEach((pw, i) => {
          const xw = STAGE_CX + sd * pw * fitK;
          const xh = STAGE_CX + sd * pleatH[i] * fitK;
          const yh = hemAt(xh);
          const spread = 5 + i * 2;
          const mid = (waistY + yh) / 2;
          pleats.push({
            crease: `M ${xw} ${waistY + 1} C ${xw + sd * 2} ${mid - 10} ${xh - sd * 4} ${mid + 14} ${xh} ${yh - 1}`,
            shadow: `M ${xw} ${waistY + 1} C ${xw + sd * 2} ${mid - 10} ${xh - sd * 4} ${mid + 14} ${xh} ${yh} L ${xh + sd * spread} ${yh - 0.5} C ${xh + sd * spread - sd * 6} ${mid + 14} ${xw + sd * 3} ${mid - 10} ${xw + sd * 1.2} ${waistY + 1} Z`,
            ridge: `M ${xw - sd * 2} ${waistY + 12} C ${xw - sd * 1.5} ${mid - 4} ${xh - sd * 10} ${mid + 14} ${xh - sd * 7} ${yh - 4}`,
            fold: `M ${xw} ${waistY + 1} C ${xw + sd * 3} ${mid - 10} ${xh + sd * 2} ${mid + 14} ${xh + sd * (spread + 6)} ${yh} L ${xh + sd * (spread + 14)} ${yh - 1} C ${xh + sd * 8} ${mid + 14} ${xw + sd * 6} ${mid - 10} ${xw + sd * 2} ${waistY + 1} Z`,
          });
        })
      );
      const darts = [-1, 1].map((sd) => {
        const xt = STAGE_CX + sd * 24;
        const xb = STAGE_CX + sd * pleatW[0] * fitK;
        return `M ${xt} ${Math.max(neckLowestY + 14, 204)} C ${xt - sd * 1} 228 ${xb + sd * 2} 248 ${xb} ${waistY}`;
      });
      const sideDarts = [-1, 1].map((sd) => {
        const xb = STAGE_CX + sd * pleatW[1] * fitK;
        return `M ${xb + sd * 6} 226 Q ${xb + sd * 3} 246 ${xb} ${waistY}`;
      });
      const waistSeam = `M ${STAGE_CX - waistHalf} ${waistY} Q ${STAGE_CX} ${waistY + 3} ${STAGE_CX + waistHalf} ${waistY}`;
      const hemPts = [[STAGE_CX + hemHalf, hemSideY], ...hemC, [STAGE_CX - hemHalf, hemSideY]];
      const hemStitch = 'M ' + hemPts.map((q, i) => `${(STAGE_CX + (q[0] - STAGE_CX) * 0.985).toFixed(1)} ${(q[1] - 4.5).toFixed(1)}`).join(' L ');
      const peplumShade = `M ${STAGE_CX - waistHalf} ${waistY} Q ${STAGE_CX} ${waistY + 3} ${STAGE_CX + waistHalf} ${waistY} L ${STAGE_CX + waistHalf + 2} ${waistY + 6} Q ${STAGE_CX} ${waistY + 9} ${STAGE_CX - waistHalf - 2} ${waistY + 6} Z`;

      return {
        isBack,
        isPeplum: true,
        waistSeam,
        peplumPleats: pleats,
        peplumDarts: isBack ? [] : [...darts, ...sideDarts],
        peplumHemStitch: hemStitch,
        peplumShade,
        spine: isBack ? `M ${STAGE_CX} ${neckLowestY + 2} L ${STAGE_CX} ${hemAt(STAGE_CX)}` : undefined,
      };
    }

    if (isBack) {
      const backStyle = geo('back', 'roundBack');
      const tieY = Math.min(neckLowestY + 12, 185);
      // The painted deep V back is clean, with no ties
      const plainV = painted && backStyle === 'deepBack';
      // The tie back is an open window laced with tied cords (drawn on its own)
      const tieWindow = backStyle === 'tieBack';
      const cutWindow = backStyle === 'cutOut';
      const hasLowerTie = !plainV && backStyle === 'deepBack';
      const keyhole = backStyle === 'keyholeBack';
      const showPotli = !hasLowerTie && (backStyle === 'roundBack' || backStyle === 'squareBack');
      const potliYs = [182, 202, 222, 242, 262].filter((y) => y > neckLowestY + 4 && y < hem - 8);

      // Dori: cords tied to both edges of the back opening, knotted in a bow at the centre,
      // with two tails ending in latkans just below the blouse hem
      const backPts = scaleX(n.pts, fitK);
      const leftEdge = backPts.slice(0, Math.ceil(backPts.length / 2));
      const edgeX = (y: number) => {
        for (let i = 0; i < leftEdge.length - 1; i++) {
          const [a, b] = [leftEdge[i], leftEdge[i + 1]];
          if ((y - a[1]) * (y - b[1]) <= 0 && a[1] !== b[1]) return a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
        }
        return leftEdge[0][0];
      };
      const openTop = Math.min(...backPts.map((q) => q[1]));
      // tied just below the top of the opening, across the upper back
      const doriY = openTop + 7;
      const dori = plainV || hasLowerTie || keyhole || tieWindow || cutWindow
        ? null
        : { y: doriY, xl: edgeX(doriY), xr: STAGE_W - edgeX(doriY), tailEnd: hem + 7 };

      const lowerTieY = hem - 10;

      return {
        isBack: true,
        spine: `M ${STAGE_CX} ${neckLowestY + 1} L ${STAGE_CX} ${hem}`,
        // Upper Nape Tie Dori
        tieBow: plainV ? null : `M ${STAGE_CX - 12} ${tieY - 4} Q ${STAGE_CX - 5} ${tieY - 8} ${STAGE_CX} ${tieY} Q ${STAGE_CX + 5} ${tieY - 8} ${STAGE_CX + 12} ${tieY - 4}`,
        doriLeft: plainV ? null : `M ${STAGE_CX - 3} ${tieY} C ${STAGE_CX - 12} ${tieY + 20} ${STAGE_CX - 24} ${tieY + 44} ${STAGE_CX - 18} ${tieY + 68}`,
        doriRight: plainV ? null : `M ${STAGE_CX + 3} ${tieY} C ${STAGE_CX + 12} ${tieY + 20} ${STAGE_CX + 24} ${tieY + 44} ${STAGE_CX + 18} ${tieY + 68}`,
        latkanL: plainV ? null : { x: STAGE_CX - 18, y: tieY + 68 },
        latkanR: plainV ? null : { x: STAGE_CX + 18, y: tieY + 68 },
        // Lower Waist Tie Dori
        hasLowerTie,
        lowerTieBow: `M ${STAGE_CX - 10} ${lowerTieY - 3} Q ${STAGE_CX - 4} ${lowerTieY - 6} ${STAGE_CX} ${lowerTieY} Q ${STAGE_CX + 4} ${lowerTieY - 6} ${STAGE_CX + 10} ${lowerTieY - 3}`,
        lowerDoriL: `M ${STAGE_CX - 2} ${lowerTieY} C ${STAGE_CX - 10} ${lowerTieY + 16} ${STAGE_CX - 18} ${lowerTieY + 32} ${STAGE_CX - 14} ${lowerTieY + 48}`,
        lowerDoriR: `M ${STAGE_CX + 2} ${lowerTieY} C ${STAGE_CX + 10} ${lowerTieY + 16} ${STAGE_CX + 18} ${lowerTieY + 32} ${STAGE_CX + 14} ${lowerTieY + 48}`,
        lowerLatkanL: { x: STAGE_CX - 14, y: lowerTieY + 48 },
        lowerLatkanR: { x: STAGE_CX + 14, y: lowerTieY + 48 },
        // Potli buttons
        showPotli,
        potliYs,
        dori,
        keyhole,
        tieWindow,
        cutWindow,
        // Tailored Back Darts
        dartLeft: `M ${STAGE_CX - 34} ${Math.max(170, neckLowestY)} Q ${STAGE_CX - 30} 230 ${STAGE_CX - 26} ${hem}`,
        dartRight: `M ${STAGE_CX + 34} ${Math.max(170, neckLowestY)} Q ${STAGE_CX + 28} 230 ${STAGE_CX + 24} ${hem}`,
        hemBorder: `M ${STAGE_CX - 58} ${hem} Q ${STAGE_CX} ${hem - 3} ${STAGE_CX + 58} ${hem}`,
      };
    }

    // FRONT VIEW:
    if (neckId === 'notched') {
      return {
        isBack: false,
        isNotched: true,
        princessLeft: `M ${STAGE_CX - 22} 174 Q ${STAGE_CX - 26} 220 ${STAGE_CX - 24} ${hem}`,
        princessRight: `M ${STAGE_CX + 22} 174 Q ${STAGE_CX + 26} 220 ${STAGE_CX + 24} ${hem}`,
        hemLine: `M ${STAGE_CX - 60} ${hem} Q ${STAGE_CX} ${hem - 4} ${STAGE_CX + 60} ${hem}`,
      };
    }

    // 1. Sculpted Princess Seams
    const princessLeft = `M ${STAGE_CX - 60} 186 C ${STAGE_CX - 40} 206 ${STAGE_CX - 36} 230 ${STAGE_CX - 33} 256 C ${STAGE_CX - 32} 268 ${STAGE_CX - 33} 278 ${STAGE_CX - 34} ${hem}`;
    const princessRight = `M ${STAGE_CX + 60} 186 C ${STAGE_CX + 40} 206 ${STAGE_CX + 36} 230 ${STAGE_CX + 33} 256 C ${STAGE_CX + 32} 268 ${STAGE_CX + 33} 278 ${STAGE_CX + 34} ${hem}`;

    // 2. Sculpted Bustier Cups & Underbust Arch
    const cupLeft = `M ${STAGE_CX - 50} 252 Q ${STAGE_CX - 25} 263 ${STAGE_CX} 256`;
    const cupRight = `M ${STAGE_CX} 256 Q ${STAGE_CX + 25} 263 ${STAGE_CX + 50} 252`;
    const underbustPatti = `M ${STAGE_CX - 48} 261 Q ${STAGE_CX} 268 ${STAGE_CX + 48} 261`;

    // 3. Center Front Seam
    const centerSeam = `M ${STAGE_CX} ${neckLowestY} L ${STAGE_CX} ${hem}`;

    // 4. Structured Waistband Patti (Hem Border)
    const hemUpperPatti = `M ${STAGE_CX - 58} ${hem - 8} Q ${STAGE_CX} ${hem - 12} ${STAGE_CX + 58} ${hem - 8}`;
    const hemMidPatti = `M ${STAGE_CX - 59} ${hem - 4} Q ${STAGE_CX} ${hem - 8} ${STAGE_CX + 59} ${hem - 4}`;
    const hemLine = `M ${STAGE_CX - 60} ${hem} Q ${STAGE_CX} ${hem - 4} ${STAGE_CX + 60} ${hem}`;

    return {
      isBack: false,
      princessLeft,
      princessRight,
      cupLeft,
      cupRight,
      underbustPatti,
      centerSeam,
      hemUpperPatti,
      hemMidPatti,
      hemLine,
    };
  };

  const drapePleatLines = (pts: number[][]) => {
    if (pts.length < 6) return [];
    const n = Math.floor(pts.length / 2);
    const leftSide = pts.slice(0, n);
    const rightSide = pts.slice(n).reverse();
    const len = Math.min(leftSide.length, rightSide.length);
    if (len < 3) return [];

    const lines: string[] = [];
    [0.35, 0.65].forEach((ratio) => {
      const p1 = [leftSide[0][0] * (1 - ratio) + rightSide[0][0] * ratio, leftSide[0][1] * (1 - ratio) + rightSide[0][1] * ratio];
      const pMid = [leftSide[Math.floor(len / 2)][0] * (1 - ratio) + rightSide[Math.floor(len / 2)][0] * ratio, leftSide[Math.floor(len / 2)][1] * (1 - ratio) + rightSide[Math.floor(len / 2)][1] * ratio];
      const pEnd = [leftSide[len - 1][0] * (1 - ratio) + rightSide[len - 1][0] * ratio, leftSide[len - 1][1] * (1 - ratio) + rightSide[len - 1][1] * ratio];
      lines.push(`M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q ${pMid[0].toFixed(1)} ${pMid[1].toFixed(1)} ${pEnd[0].toFixed(1)} ${pEnd[1].toFixed(1)}`);
    });
    return lines;
  };

  const paintedImage = (a: { href: string; x: number; y: number; w: number; h: number }, clip?: string) => (
    <image
      href={a.href}
      x={a.x}
      y={a.y}
      width={a.w}
      height={a.h}
      preserveAspectRatio="none"
      clipPath={clip ? `url(#${clip})` : undefined}
    />
  );

  // Braided cord (halter ties): dark edge, base, and two offset strands for the twist
  const braidedCord = (d: string, key: string, w = 1.8) => (
    <g key={key} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={fabTheme.outlineColor} strokeWidth={w + 0.7} opacity="0.5" />
      <path d={d} stroke="#86a690" strokeWidth={w} />
      <path d={d} stroke="#c3d6c8" strokeWidth={w * 0.55} strokeDasharray="1.1 1.1" />
      <path d={d} stroke="#5f826b" strokeWidth={w * 0.55} strokeDasharray="1.1 1.1" strokeDashoffset="1.1" />
    </g>
  );

  // Tassel (latkan): gold cap bead, rounded wrapped head, a bound neck, then a full skirt of
  // fine threads that flare slightly and end unevenly. (x, y) is where it hangs from; L its length.
  const tassel = (x: number, y: number, L: number, key: string) => {
    const k = L / 16;
    const capR = 1.25 * k;
    const headTop = y + capR * 1.6;
    const headBot = headTop + 4.2 * k;
    const hw = 2.3 * k; // head half-width
    const bandH = 1.3 * k;
    const sTop = headBot + bandH;
    const sBot = y + L;
    const sw = 2.1 * k, bw = 3.4 * k; // skirt half-width at top and bottom
    const n = 13;
    const threads = Array.from({ length: n }, (_, i) => {
      const f = i / (n - 1) - 0.5;
      const x0 = x + f * 2 * sw;
      const x1 = x + f * 2 * bw;
      const end = sBot - (((i * 7) % 5) * 0.35 + Math.abs(f) * 1.2) * k;
      const sway = (i % 3 - 1) * 0.25 * k;
      return { d: `M ${x0} ${sTop} Q ${(x0 + x1) / 2 + sway} ${(sTop + end) / 2} ${x1} ${end}`, i };
    });
    return (
      <g key={key} className="tassel">
        {/* thread skirt: a soft base, then individual threads in light and dark gold */}
        <path
          d={`M ${x - sw} ${sTop} L ${x + sw} ${sTop} Q ${x + bw * 0.98} ${(sTop + sBot) / 2} ${x + bw} ${sBot - 1.2 * k} Q ${x} ${sBot + 0.4 * k} ${x - bw} ${sBot - 1.2 * k} Q ${x - bw * 0.98} ${(sTop + sBot) / 2} ${x - sw} ${sTop} Z`}
          fill="url(#tassel-gold)"
          opacity="0.95"
        />
        {threads.map((t) => (
          <path key={t.i} d={t.d} fill="none" stroke={t.i % 3 === 0 ? '#7d5f22' : t.i % 3 === 1 ? '#f2dc9c' : '#c79f4c'} strokeWidth={0.32 * k} strokeLinecap="round" />
        ))}
        {/* wrapped head */}
        <path
          d={`M ${x - hw * 0.55} ${headTop} Q ${x - hw * 1.1} ${headTop + 1.6 * k} ${x - hw} ${headBot} L ${x + hw} ${headBot} Q ${x + hw * 1.1} ${headTop + 1.6 * k} ${x + hw * 0.55} ${headTop} Q ${x} ${headTop - 0.6 * k} ${x - hw * 0.55} ${headTop} Z`}
          fill="url(#tassel-gold)"
          stroke="#6b5222"
          strokeWidth={0.22 * k}
        />
        {[0.3, 0.55, 0.8].map((f) => (
          <path key={f} d={`M ${x - hw * (0.6 + f * 0.4)} ${headTop + f * (headBot - headTop)} Q ${x} ${headTop + f * (headBot - headTop) + 0.5 * k} ${x + hw * (0.6 + f * 0.4)} ${headTop + f * (headBot - headTop)}`} fill="none" stroke="#7d5f22" strokeWidth={0.18 * k} opacity="0.7" />
        ))}
        {/* bound neck */}
        <rect x={x - sw - 0.25 * k} y={headBot} width={(sw + 0.25 * k) * 2} height={bandH} rx={0.4 * k} fill="#a9843c" stroke="#6b5222" strokeWidth={0.18 * k} />
        <line x1={x - sw} y1={headBot + bandH / 2} x2={x + sw} y2={headBot + bandH / 2} stroke="#f2dc9c" strokeWidth={0.2 * k} />
        {/* cap bead */}
        <circle cx={x} cy={y + capR * 0.6} r={capR} fill="url(#tassel-bead)" stroke="#6b5222" strokeWidth={0.2 * k} />
      </g>
    );
  };

  // Focus & Camera Zoom
  const f = FOCUS[activeCategory.slot] || FOCUS.topStyle;
  const isDetail = viewMode === 'detail';
  const fade = isDetail && ['neckline', 'collar', 'topStyle', 'sleeves', 'back', 'texture', 'cuff'].includes(activeCategory.slot) ? 0.65 : 1;
  // The painted back is framed like the front: the whole figure
  const k = isDetail ? f.z : isBack && !painted ? 0.66 : BASE_ZOOM;
  const fy = isDetail ? f.cy : isBack && !painted ? 320 : 380;
  // Centre the full figure in the space right of the floating rail rather than on the screen
  const fx = railOnLeft && !isDetail ? 29 : 0;


  // Active layer loading effect
  const isLayerLoading = (slotShort: string) => loadingSlot.toLowerCase() === slotShort.toLowerCase();

  return (
    <div className="flex-1 relative overflow-hidden min-h-0 bg-[#f7f4ef]">
      {/* Zoomable Stage Container */}
      <div
        id="mannequin-stage"
        className="absolute left-1/2 top-1/2 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center"
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          marginLeft: `-${STAGE_W / 2}px`,
          marginTop: `-${STAGE_H / 2}px`,
          transform: `scale(${k}) translate(${fx}px, ${410 - fy}px)`,
        }}
      >
        {/* Floor Shadow */}
        <div className="absolute left-[50px] top-[764px] w-[360px] h-[36px] rounded-full bg-[radial-gradient(ellipse_at_50%_50%,rgba(146,114,88,0.22),rgba(146,114,88,0)_72%)]" />

        {/* Avatar Body Form (Torso, Hips & Human Legs) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#fdeee2] via-[#f9e0cf] to-[#eec6ad]"
          style={{ clipPath: poly(scaleX(BODY, fitK)), display: painted && (lenId === 'floor' || lenId === 'trail') ? 'none' : undefined }}
        />
        {/* Soft Natural Waist & Navel Accent */}
        {!isBack && (
          <div className="absolute left-[228px] top-[316px] w-[5px] h-[7px] rounded-full bg-[#ba8066]/35 shadow-inner pointer-events-none" />
        )}

        {/* Layer 1: Skirt / Bottom */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isLayerLoading('skirt') || isLayerLoading('saree') || isLayerLoading('shape') ? 'animate-shim' : ''
          }`}
          style={{
            background: currentGarment === 'shirt' ? bodyFill : botFill,
            opacity: currentGarment === 'shirt' ? 0.85 : 1,
            clipPath:
              currentGarment === 'shirt'
                ? poly(botPts('trouser', 'floor', 300))
                : poly(botPts(botGeo, lenId, botTop)),
          }}
        />

        {/* Layer 2: Waistband */}
        {waistV > 0 && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: fillGradient(fab.c, 'sheer', 2),
              opacity: 0.95,
              clipPath: poly(waistBand(waistV)),
            }}
          />
        )}

        {/* Layer 2.5: Arms & Hands Base Mannequin (Rendered ON TOP of Skirt/Lehenga & Waistband for clear visibility) */}
        <div
          id="mannequin-arms-hands-layer"
          hidden={painted && armPose === 'stretched'}
          className="absolute inset-0 transition-all duration-500 pointer-events-none"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(43, 31, 24, 0.18))',
          }}
        >
          {armPose === 'resting' ? (
            <>
              {/* Left Arm Base & Canvas Texture */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#fde9dc] via-[#f9e0cf] to-[#efc9b0]"
                style={{ clipPath: poly(scaleX(ARM_L, fitK)) }}
              />
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  clipPath: poly(scaleX(ARM_L, fitK)),
                  backgroundImage:
                    'repeating-linear-gradient(46deg, rgba(196,146,112,0.12) 0 1px, transparent 1px 8px), repeating-linear-gradient(-46deg, rgba(196,146,112,0.1) 0 1px, transparent 1px 8px)',
                }}
              />
              {/* Right Arm Base & Canvas Texture */}
              <div
                className="absolute inset-0 bg-gradient-to-bl from-[#fde9dc] via-[#f9e0cf] to-[#efc9b0]"
                style={{ clipPath: poly(scaleX(ARM_R, fitK)) }}
              />
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  clipPath: poly(scaleX(ARM_R, fitK)),
                  backgroundImage:
                    'repeating-linear-gradient(-46deg, rgba(196,146,112,0.12) 0 1px, transparent 1px 8px), repeating-linear-gradient(46deg, rgba(196,146,112,0.1) 0 1px, transparent 1px 8px)',
                }}
              />
            </>
          ) : (
            <>
              {/* Outstretched Arms Base */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#fde9dc] via-[#f9e0cf] to-[#efc9b0]"
                style={{ clipPath: poly(scaleX(armOutL, fitK)) }}
              />
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  clipPath: poly(scaleX(armOutL, fitK)),
                  backgroundImage:
                    'repeating-linear-gradient(46deg, rgba(196,146,112,0.12) 0 1px, transparent 1px 8px), repeating-linear-gradient(-46deg, rgba(196,146,112,0.1) 0 1px, transparent 1px 8px)',
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-l from-[#fde9dc] via-[#f9e0cf] to-[#efc9b0]"
                style={{ clipPath: poly(scaleX(armOutR, fitK)) }}
              />
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  clipPath: poly(scaleX(armOutR, fitK)),
                  backgroundImage:
                    'repeating-linear-gradient(-46deg, rgba(196,146,112,0.12) 0 1px, transparent 1px 8px), repeating-linear-gradient(46deg, rgba(196,146,112,0.1) 0 1px, transparent 1px 8px)',
                }}
              />
            </>
          )}
        </div>

        {/* Layer 3: Top / Blouse / Bodice & Sleeves (Unified Connected Garment) */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isLayerLoading('blouse') || isLayerLoading('bodice') || isLayerLoading('front') || isLayerLoading('sleeve') ? 'animate-shim' : ''
          }`}
          style={{
            background: topFill,
            clipPath: poly(topPts()),
          }}
        />

        {/* Layer 6 & 7: Cuffs */}
        {cuffPts('l') && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: fillGradient(FABRIC, 'plain', -16),
              clipPath: poly(cuffPts('l')!),
            }}
          />
        )}
        {cuffPts('r') && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: fillGradient(FABRIC, 'plain', -16),
              clipPath: poly(cuffPts('r')!),
            }}
          />
        )}

        {/* Layer 8: Shirt Collar */}
        {currentGarment === 'shirt' && !isBack && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: fillGradient(FABRIC, 'plain', -13),
              clipPath: poly(COLLAR[geo('collar', 'classic')] || COLLAR.classic),
            }}
          />
        )}

        {/* Layer 9 & 10: Dupatta / Drape Pieces */}
        {pieces[0] && !painted && (
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              isLayerLoading('dupatta') || isLayerLoading('drape') ? 'animate-shim' : ''
            }`}
            style={{
              background: currentGarment === 'shirt' ? fillGradient(fab.c, 'sheer', -6) : fabTheme.drapeColor,
              opacity: Math.min(1, fabTheme.drapeOpacity + 0.05) * fade,
              clipPath: poly(pieces[0]),
            }}
          />
        )}
        {pieces[1] && !painted && (
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: currentGarment === 'shirt' ? fillGradient(fab.c, 'sheer', -6) : fabTheme.drapeColor,
              opacity: Math.min(1, fabTheme.drapeOpacity + 0.05) * fade,
              clipPath: poly(pieces[1]),
            }}
          />
        )}

        {/* SVG Overlay for Textures, 2D Game Linework, and Fabric Borders */}
        <svg className="absolute inset-0 pointer-events-none" width={STAGE_W} height={STAGE_H}>
          <defs>
            <radialGradient id="bust-highlight-l" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bust-highlight-r" cx="55%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <pattern id="net-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.4)" />
              <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.4)" />
            </pattern>
            <pattern id="banarasi-butis" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M12,4 C14,8 18,10 12,16 C6,10 10,8 12,4 Z" fill={GOLD} opacity="0.6" />
              <circle cx="12" cy="18" r="2" fill={GOLD} opacity="0.5" />
            </pattern>
            <linearGradient id="wood-joint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eed0ab" />
              <stop offset="45%" stopColor="#d5a87e" />
              <stop offset="100%" stopColor="#b38258" />
            </linearGradient>
            {/* Avatar 2D Fashion Character Gradients */}
            <linearGradient id="avatar-skin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdeee2" />
              <stop offset="45%" stopColor="#f9e0cf" />
              <stop offset="100%" stopColor="#efcab2" />
            </linearGradient>
            <linearGradient id="hair-dark-grad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#282226" />
              <stop offset="35%" stopColor="#181518" />
              <stop offset="70%" stopColor="#0f0c0f" />
              <stop offset="100%" stopColor="#070607" />
            </linearGradient>
            <radialGradient id="iris-grad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#5d3921" />
              <stop offset="60%" stopColor="#382010" />
              <stop offset="100%" stopColor="#170c05" />
            </radialGradient>
            <radialGradient id="blush-l" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e27373" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e27373" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="blush-r" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e27373" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e27373" stopOpacity="0" />
            </radialGradient>
            {/* Mannequin Arm Opaque Canvas Texture Gradients & Shadow Filter */}
            <linearGradient id="mannequin-arm-l" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdebdf" />
              <stop offset="50%" stopColor="#f9e0cf" />
              <stop offset="100%" stopColor="#eec6ad" />
            </linearGradient>
            <linearGradient id="mannequin-arm-r" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fdebdf" />
              <stop offset="50%" stopColor="#f9e0cf" />
              <stop offset="100%" stopColor="#eec6ad" />
            </linearGradient>
            <pattern id="mannequin-canvas-texture" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="rgba(196,146,112,0.12)" strokeWidth="0.75" />
            </pattern>
            <filter id="arm-shadow" x="-20%" y="-10%" width="140%" height="120%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#2b1f18" floodOpacity="0.14" />
            </filter>
            <linearGradient id="top-fabric-grad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={topGradColors.start} />
              <stop offset="55%" stopColor={topGradColors.mid} />
              <stop offset="100%" stopColor={topGradColors.end} />
            </linearGradient>
            <linearGradient id="peplum-flare-depth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.0" />
              <stop offset="45%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="bot-fabric-grad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={botGradColors.start} />
              <stop offset="55%" stopColor={botGradColors.mid} />
              <stop offset="100%" stopColor={botGradColors.end} />
            </linearGradient>
            <clipPath id="skirt-clip">
              <path d={svgPath(currentGarment === 'shirt' ? botPts('trouser', 'floor', 300) : botPts(botGeo, lenId, botTop))} />
            </clipPath>
            <linearGradient id="jacket-fold-shade" x1="0" y1="0" x2="1" y2="0.25">
              <stop offset="0" stopColor="#8a7055" stopOpacity="0.16" />
              <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="1" stopColor="#8a7055" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="lacing-shade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7a5444" stopOpacity="0.3" />
              <stop offset="0.5" stopColor="#7a5444" stopOpacity="0" />
              <stop offset="1" stopColor="#7a5444" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="tassel-gold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#9c7a33" />
              <stop offset="0.35" stopColor="#e3c47a" />
              <stop offset="0.55" stopColor="#f0d998" />
              <stop offset="1" stopColor="#8c6c2b" />
            </linearGradient>
            <radialGradient id="tassel-bead" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#fbeec2" />
              <stop offset="0.5" stopColor="#d9b867" />
              <stop offset="1" stopColor="#8c6c2b" />
            </radialGradient>
            <filter id="tier-soften" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <linearGradient id="tier-overhang" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1e3326" stopOpacity="0.3" />
              <stop offset="1" stopColor="#1e3326" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="midriff-side-shade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b9826a" stopOpacity="0.32" />
              <stop offset="0.22" stopColor="#b9826a" stopOpacity="0.06" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="0.78" stopColor="#b9826a" stopOpacity="0.06" />
              <stop offset="1" stopColor="#b9826a" stopOpacity="0.32" />
            </linearGradient>
            <linearGradient id="midriff-top-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9c6a55" stopOpacity="0.28" />
              <stop offset="1" stopColor="#9c6a55" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="midriff-bottom-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9c6a55" stopOpacity="0" />
              <stop offset="1" stopColor="#9c6a55" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="painted-upper-arm-skin" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f4d6c2" />
              <stop offset="45%" stopColor="#fae1ce" />
              <stop offset="100%" stopColor="#f3d2bd" />
            </linearGradient>
            {painted && (() => {
              const [a, b] = forearmFade();
              return (
                <>
                  <linearGradient id="forearm-fade-l" gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
                    <stop offset="0" stopColor="#000" />
                    <stop offset="1" stopColor="#fff" />
                  </linearGradient>
                  <linearGradient id="forearm-fade-r" gradientUnits="userSpaceOnUse" x1={STAGE_W - a[0]} y1={a[1]} x2={STAGE_W - b[0]} y2={b[1]}>
                    <stop offset="0" stopColor="#000" />
                    <stop offset="1" stopColor="#fff" />
                  </linearGradient>
                  <mask id="painted-forearm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
                    <path d={svgPath(paintedForearmClipL())} fill="url(#forearm-fade-l)" />
                    <path d={svgPath(mir(paintedForearmClipL()))} fill="url(#forearm-fade-r)" />
                  </mask>
                </>
              );
            })()}
            <clipPath id="below-collar-clip">
              <rect x="0" y="150" width={STAGE_W} height={STAGE_H} />
            </clipPath>
            {/* The outstretched arm is in front of the painted dupatta below the shoulder (cloth painted
                over it would be leftover painting floating over the arm) */}
            <clipPath id="dupatta-off-arm-clip">
              <path
                clipRule="evenodd"
                d={`M 0 0 H ${STAGE_W} V ${STAGE_H} H 0 Z ${
                  armPose === 'stretched'
                    ? svgPath(
                        mir(
                          (() => {
                            const s0 = 30, s1 = ARM_UPPER_LEN + ARM_FORE_LEN + 60, n = 24;
                            const side = (sd: 1 | -1) =>
                              Array.from({ length: n + 1 }, (_, i) => {
                                const a = armAt(s0 + ((s1 - s0) * i) / n);
                                const m = a.w + 0.6; // just the arm itself: the cloth falls behind it
                                return [a.p[0] + sd * a.n[0] * m, a.p[1] + sd * a.n[1] * m];
                              });
                            return [...side(1), ...side(-1).reverse()];
                          })()
                        )
                      )
                    : ''
                }`}
              />
            </clipPath>
            <clipPath id="above-skirt-clip">
              <rect x="0" y="0" width={STAGE_W} height={botTop + 1} />
            </clipPath>
            <clipPath id="body-clip">
              <path d={svgPath(scaleX(BODY, fitK))} />
            </clipPath>
            <clipPath id="top-clip">
              <path d={svgPath(topPts())} />
            </clipPath>
            {sleevePts('l') && (
              <clipPath id="sleeve-clip-l">
                <path d={svgPath(sleevePts('l')!)} />
              </clipPath>
            )}
            {sleevePts('r') && (
              <clipPath id="sleeve-clip-r">
                <path d={svgPath(sleevePts('r')!)} />
              </clipPath>
            )}
          </defs>

          {/* Avatar Rear Hair (Layer Behind Shoulders & Torso) */}
          {!(painted && isBack) && <AvatarRenderer viewMode={viewMode} layer="rearHair" />}

          {/* Painted skin across the torso (shows at the neckline and midriff) */}
          {/* (stops at the skirt waistband so no skin peeks out beside it) */}
          {painted && (
            <g clipPath="url(#above-skirt-clip)">{paintedImage(PV.skin, 'body-clip')}</g>
          )}
          {/* Neck sides curving out into the shoulders */}
          {painted && !isBack && (
            <g opacity="0.35" fill="none" stroke="#9c6a55" strokeWidth="0.7" strokeLinecap="round">
              <path d="M 218 124 C 217.6 132 214 138.5 205 143.8" />
              <path d="M 245 124 C 245.4 132 249 138.5 258 143.8" />
            </g>
          )}
          {/* Midriff modelling: rounded sides and soft shade under the blouse and above the waistband */}
          {painted && !isBack && (
            <g clipPath="url(#body-clip)">
              <rect x={STAGE_CX - 46} y={250} width={92} height={34} fill="url(#midriff-side-shade)" />
              <rect x={STAGE_CX - 46} y={256} width={92} height={10} fill="url(#midriff-top-shade)" />
              <rect x={STAGE_CX - 46} y={botTop - 5} width={92} height={6} fill="url(#midriff-bottom-shade)" />
            </g>
          )}

          {/* Avatar Anatomy & 2D Game Cel Linework */}
          <g id="mannequin-linework">
            {/* Clavicle / Collarbones (the painted skin carries its own) */}
            {!isBack && !painted && (
              <>
                <path d="M 196 148 Q 212 155 226 153" fill="none" stroke="#2a1f18" strokeWidth="1.15" opacity="0.45" strokeLinecap="round" />
                <path d="M 264 148 Q 248 155 234 153" fill="none" stroke="#2a1f18" strokeWidth="1.15" opacity="0.45" strokeLinecap="round" />
              </>
            )}

            {/* Avatar 2D Fashion Game Character Head, Face & Jewelry */}
            {!(painted && isBack) && <AvatarRenderer viewMode={viewMode} layer={isBack ? 'backHead' : 'face'} paintedSkin={painted} />}

            {/* Clean 2D Stylized Mannequin Legs */}
            <g id="mannequin-legs" display={painted && (lenId === 'floor' || lenId === 'trail') ? 'none' : undefined}>
              {/* Subtle 2D Ground Shadow under feet */}
              <ellipse
                cx={scaleX([[190, 794]], fitK)[0][0]}
                cy={795}
                rx={14 * fitK}
                ry={2.5}
                fill="rgba(43,31,24,0.22)"
              />
              <ellipse
                cx={STAGE_W - scaleX([[190, 794]], fitK)[0][0]}
                cy={795}
                rx={14 * fitK}
                ry={2.5}
                fill="rgba(43,31,24,0.22)"
              />

              {/* Left Leg: Flat 2D Linen Fill, Subtle Canvas Texture & Crisp Outline */}
              <path d={svgPath(scaleX(LEG_L, fitK))} fill="#f9e0cf" />
              <path d={svgPath(scaleX(LEG_L, fitK))} fill="url(#mannequin-canvas-texture)" opacity="0.35" />
              <path
                d={svgPath(scaleX(LEG_L, fitK))}
                fill="none"
                stroke="#2a1f18"
                strokeWidth="1.25"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* Right Leg: Flat 2D Linen Fill, Subtle Canvas Texture & Crisp Outline */}
              <path d={svgPath(scaleX(LEG_R, fitK))} fill="#f9e0cf" />
              <path d={svgPath(scaleX(LEG_R, fitK))} fill="url(#mannequin-canvas-texture)" opacity="0.35" />
              <path
                d={svgPath(scaleX(LEG_R, fitK))}
                fill="none"
                stroke="#2a1f18"
                strokeWidth="1.25"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* Minimal 2D Fashion Croquis Knee Accent */}
              {(() => {
                const xLK = scaleX([[181, 606]], fitK)[0][0];
                const xRK = STAGE_W - xLK;
                return (
                  <g id="minimal-2d-knees" opacity="0.45">
                    {/* Left Knee minimal 2D mark */}
                    <path
                      d={`M ${xLK - 6} 606 Q ${xLK} 604 ${xLK + 6} 606`}
                      fill="none"
                      stroke="#2a1f18"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                    />
                    {/* Right Knee minimal 2D mark */}
                    <path
                      d={`M ${xRK - 6} 606 Q ${xRK} 604 ${xRK + 6} 606`}
                      fill="none"
                      stroke="#2a1f18"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })()}
            </g>
          </g>

          {/* Skirt Texture & Fill Overlay */}
          <g clipPath="url(#skirt-clip)">
            {painted ? (
              botGeo === 'tiered' || botGeo === 'mermaid' ? (
                // the painted pleats don't belong on a gathered tiered skirt: soften them away
                <g filter="url(#tier-soften)">{paintedImage(PV.skirt)}</g>
              ) : (
                paintedImage(PV.skirt)
              )
            ) : (
              <path
                d={svgPath(currentGarment === 'shirt' ? botPts('trouser', 'floor', 300) : botPts(botGeo, lenId, botTop))}
                fill="url(#bot-fabric-grad)"
                opacity={fab.op}
              />
            )}
            {texKey === 'net' && <rect width={STAGE_W} height={STAGE_H} fill="url(#net-mesh)" />}
            {texKey === 'banarasi' && <rect width={STAGE_W} height={STAGE_H} fill="url(#banarasi-butis)" />}
            {texKey === 'velvet' && (
              <rect width={STAGE_W} height={STAGE_H} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            )}
            {texKey === 'organza' && <rect width={STAGE_W} height={STAGE_H} fill="rgba(255,255,255,0.15)" />}
          </g>

          {/* Skirt 2D Game Linework: Kali Seams, Folds & Tiers */}
          <g id="skirt-linework">
            {/* Vertical Kali Panel Seams */}
            {(!painted || botGeo === 'panelled') && skirtFolds().map((fold, idx) => (
              <g key={`skirt-fold-${idx}`}>
                {/* Dark ink line */}
                <path
                  d={fold.d}
                  fill="none"
                  stroke={fabTheme.outlineColor}
                  strokeWidth={botGeo === 'panelled' ? 1.4 : 1.15}
                  strokeDasharray={botGeo === 'panelled' ? '5 3' : undefined}
                  opacity={fabTheme.seamOpacity}
                  strokeLinecap="round"
                />
                {/* Companion gold thread line for Banarasi */}
                {fabId === 'banarasi' && (
                  <path
                    d={fold.d}
                    fill="none"
                    stroke={fabTheme.accentColor}
                    strokeWidth="0.8"
                    opacity="0.7"
                    transform="translate(1.2, 0)"
                  />
                )}
              </g>
            ))}

            {/* Mermaid skirt: curved panel seams that hug the hips and flare below the knee, godet folds
                in the flare, tonal leaf embroidery up each panel and a scatter of sequins */}
            {botGeo === 'mermaid' && (() => {
              const sk = BOT.mermaid.profile;
              const hh = LENV[lenId] || 400;
              const halfAt = (tt: number) => {
                for (let i = 0; i < sk.length - 1; i++) {
                  const [t0, w0] = sk[i], [t1, w1] = sk[i + 1];
                  if (tt >= t0 && tt <= t1) return (w0 + ((tt - t0) / (t1 - t0 || 1)) * (w1 - w0)) * fitK;
                }
                return sk[sk.length - 1][1] * fitK;
              };
              const Y = (tt: number) => botTop + tt * hh + (tt > 0.9 ? Math.sin(Math.PI * 0.5) * 6 * ((tt - 0.9) / 0.1) : 0);
              const seamAt = (f: number, tt: number) => [STAGE_CX + f * halfAt(tt) * 0.98, Y(tt)];
              const path = (f: number, t0: number, t1: number, n = 30) =>
                'M ' + Array.from({ length: n + 1 }, (_, i) => seamAt(f, t0 + ((t1 - t0) * i) / n).map((v) => v.toFixed(1)).join(' ')).join(' L ');
              const seams = [-0.62, -0.2, 0.2, 0.62];
              const godets = [-0.86, -0.41, 0, 0.41, 0.86];
              // deterministic sequin scatter
              const sequins: number[][] = [];
              for (let i = 0; i < 140; i++) {
                const tt = 0.06 + (((i * 37) % 97) / 97) * 0.92;
                const f = ((((i * 53) % 89) / 89) * 2 - 1) * 0.92;
                sequins.push([STAGE_CX + f * halfAt(tt), Y(tt), (i % 3) * 0.25 + 0.5]);
              }
              return (
                <g id="mermaid-skirt" clipPath="url(#skirt-clip)" fill="none" strokeLinecap="round">
                  {/* soft shading: the fitted part rounds over the hips, the flare falls into shade at the sides */}
                  {seams.map((f, i) => (
                    <path key={`sh${i}`} d={path(f, 0.03, 1)} stroke="rgba(15,35,24,0.12)" strokeWidth="6" />
                  ))}
                  {/* godet folds opening out below the knee */}
                  {godets.map((f, i) => (
                    <g key={`g${i}`}>
                      <path d={path(f, 0.6, 0.99)} stroke="rgba(15,35,24,0.18)" strokeWidth="1.2" />
                      <path d={path(f + 0.06, 0.62, 0.99)} stroke="rgba(255,255,255,0.12)" strokeWidth="2.4" />
                    </g>
                  ))}
                  {/* tonal leaf embroidery: chevrons climbing each panel */}
                  {[-0.41, 0, 0.41].map((f, pi) =>
                    Array.from({ length: 12 }, (_, i) => {
                      const tt = 0.08 + i * 0.075;
                      const [x, y] = seamAt(f, tt);
                      const w = Math.max(5, halfAt(tt) * 0.12);
                      return (
                        <path
                          key={`c${pi}-${i}`}
                          d={`M ${x - w} ${y + w * 0.9} L ${x} ${y} L ${x + w} ${y + w * 0.9}`}
                          stroke="rgba(25,55,38,0.35)"
                          strokeWidth="0.7"
                        />
                      );
                    })
                  )}
                  {/* panel seams */}
                  {seams.map((f, i) => (
                    <path key={`s${i}`} d={path(f, 0.03, 1)} stroke={fabTheme.outlineColor} strokeWidth="0.75" opacity="0.5" />
                  ))}
                  {/* sequins catching the light */}
                  {sequins.map(([x, y, r], i) => (
                    <circle key={`q${i}`} cx={x} cy={y} r={r} fill={i % 4 ? '#dfe9e2' : '#f6f2e4'} opacity={0.55} stroke="none" />
                  ))}
                </g>
              );
            })()}

            {/* Tiered skirt: gathered seams with a soft overhang shadow, and gathers fanning down each tier */}
            {botGeo === 'tiered' && (() => {
              const sk = BOT.tiered.profile;
              const hh = LENV[lenId] || 400;
              const halfAt = (tt: number) => {
                for (let i = 0; i < sk.length - 1; i++) {
                  const [t0, w0] = sk[i], [t1, w1] = sk[i + 1];
                  if (tt >= t0 && tt <= t1) return (w0 + ((tt - t0) / (t1 - t0 || 1)) * (w1 - w0)) * fitK;
                }
                return sk[sk.length - 1][1] * fitK;
              };
              const tierTs = [0.028, 0.293, 0.623, 1];
              const sag = (x: number, hw: number, amt: number) => amt * (1 - Math.min(1, ((x - STAGE_CX) / hw) ** 2));
              const seams = [0.293, 0.623].map((tt) => {
                const y = botTop + tt * hh;
                const hw = halfAt(tt + 0.004) + 1;
                const n = 40;
                const pts = Array.from({ length: n + 1 }, (_, i) => {
                  const x = STAGE_CX - hw + (2 * hw * i) / n;
                  return [x, y + sag(x, hw, 8) + (i % 2 ? 0.5 : -0.2)];
                });
                return { y, hw, pts };
              });
              const line = (pts: number[][]) => 'M ' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ');
              return (
                <g id="tiered-skirt" clipPath="url(#skirt-clip)" fill="none" strokeLinecap="round">
                  {/* gathers: a dense row of short fold lines just under the waistband and each seam (where
                      the fabric is gathered in), and a few long soft folds running down each tier */}
                  {tierTs.slice(0, 3).map((t0, ti) => {
                    const t1 = tierTs[ti + 1];
                    const span = (t1 - t0) * hh;
                    const hw0 = halfAt(t0 + 0.01), hw1 = halfAt(t1 - 0.004);
                    const dip = ti ? 8 : 0;
                    const y0 = botTop + t0 * hh + (ti ? 1.2 : 16);
                    const at = (f: number, d: number) => {
                      const x0 = STAGE_CX + f * 2 * hw0 * 0.95;
                      const x1 = STAGE_CX + f * 2 * (hw0 + (hw1 - hw0) * (d / span)) * 0.96;
                      return { x0, x1, ys: y0 + sag(x0, hw0, dip) };
                    };
                    const nShort = 26 + ti * 8;
                    const nLong = 5 + ti * 2;
                    return (
                      <g key={ti}>
                        {Array.from({ length: nShort }, (_, i) => {
                          const f = (i + 0.5) / nShort - 0.5;
                          const len = 4 + ((i * 7) % 5) * 1.6 + ti * 1.5;
                          const { x0, x1, ys } = at(f, len);
                          return <path key={`s${i}`} d={`M ${x0} ${ys} L ${x1} ${ys + len}`} stroke={fabTheme.outlineColor} strokeWidth="0.5" opacity="0.42" />;
                        })}
                        {Array.from({ length: nLong }, (_, i) => {
                          const f = (i + 0.5) / nLong - 0.5 + (i % 2 ? 0.02 : -0.02);
                          const len = span * (0.6 + ((i * 3) % 3) * 0.12);
                          const { x0, x1, ys } = at(f, len);
                          return (
                            <g key={`l${i}`}>
                              <path d={`M ${x0} ${ys + 3} Q ${(x0 + x1) / 2 + (i % 2 ? 1 : -1)} ${ys + len / 2} ${x1} ${ys + len}`} stroke={fabTheme.outlineColor} strokeWidth="0.6" opacity="0.22" />
                              <path d={`M ${x0 + 2.2} ${ys + 4} Q ${(x0 + x1) / 2 + 2.4} ${ys + len / 2} ${x1 + 2.6} ${ys + len * 0.9}`} stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                  {/* hem stitching just above the wavy hem */}
                  {(() => {
                    const hw = halfAt(1) - 1;
                    const n = 44;
                    const yb = botTop + hh;
                    const pts = Array.from({ length: n + 1 }, (_, i) => {
                      const f = i / n;
                      return [STAGE_CX - hw + 2 * hw * f, yb + Math.sin(f * Math.PI) * 8 + Math.sin(f * Math.PI * 22) * 1.4 - 5];
                    });
                    return <path d={line(pts)} stroke={fabTheme.outlineColor} strokeWidth="0.5" opacity="0.35" strokeDasharray="1.6 1.2" />;
                  })()}
                  {/* each tier overhangs the next: shadow just below the seam, then the gathered seam */}
                  {seams.map((sm, i) => (
                    <g key={i}>
                      <path d={`${line(sm.pts)} L ${sm.pts[sm.pts.length - 1][0]} ${sm.y + 18} L ${sm.pts[0][0]} ${sm.y + 18} Z`} fill="url(#tier-overhang)" stroke="none" opacity="0.7" transform="translate(0 0.5)" />
                      <path d={line(sm.pts)} stroke={fabTheme.outlineColor} strokeWidth="1" opacity="0.65" />
                      <path d={line(sm.pts.map(([x, y]) => [x, y - 1.6]))} stroke="rgba(255,255,255,0.22)" strokeWidth="1.1" />
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* 2D Game Hem Gotapatti / Zari Border Artwork */}
            {(() => {
              const border = skirtBorderData();
              if (!border || painted) return null;
              return (
                <g id="skirt-hem-border">
                  {/* Upper Border Outline */}
                  <path
                    d={border.upper}
                    fill="none"
                    stroke={fabTheme.outlineColor}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  {/* Mid Accent Line (Piping / Zari) */}
                  <path
                    d={border.mid}
                    fill="none"
                    stroke={fabTheme.accentColor}
                    strokeWidth={fabTheme.borderStyle === 'velvet' ? '2.4' : '1.15'}
                    strokeDasharray={fabId === 'banarasi' ? '4 2' : fabTheme.borderStyle === 'classic' ? '4 2' : undefined}
                    opacity="0.85"
                  />
                  {/* Lower Hem Inner Outline */}
                  <path
                    d={border.lower}
                    fill="none"
                    stroke={fabTheme.outlineColor}
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                  {/* Banarasi Gotapatti Chevron Embroidery & Scallop Beads */}
                  {fabTheme.borderStyle === 'gotapatti' && (
                    <>
                      {border.chevrons.map((chD, i) => (
                        <path key={`ch-${i}`} d={chD} fill="none" stroke={fabTheme.accentColor} strokeWidth="1.1" />
                      ))}
                      {border.lowerPts.map((p, i) => (
                        <circle
                          key={`hb-${i}`}
                          cx={p[0]}
                          cy={p[1] + 1.5}
                          r="2.2"
                          fill={fabTheme.accentColor}
                          stroke={fabTheme.outlineColor}
                          strokeWidth="0.8"
                        />
                      ))}
                    </>
                  )}
                  {/* Net Scalloped Lace Loops */}
                  {fabTheme.borderStyle === 'lace' &&
                    border.lowerPts.map((p, i) => (
                      <path
                        key={`lace-${i}`}
                        d={`M ${p[0] - 6} ${p[1]} Q ${p[0]} ${p[1] + 5} ${p[0] + 6} ${p[1]}`}
                        fill="none"
                        stroke={fabTheme.outlineColor}
                        strokeWidth="1"
                        opacity="0.75"
                      />
                    ))}
                  {/* Organza Ruffled Lettuce-Edge Wire Effect */}
                  {fabTheme.borderStyle === 'wire' && (
                    <path
                      d={border.lower}
                      fill="none"
                      stroke={fabTheme.accentColor}
                      strokeWidth="0.9"
                      strokeDasharray="5 3"
                    />
                  )}
                </g>
              );
            })()}

            {/* Skirt Outer Silhouette Thin Outline */}
            <path 
              d={svgPath(currentGarment === 'shirt' ? botPts('trouser', 'floor', 300) : botPts(botGeo, lenId, botTop))}
              fill="none"
              stroke={fabTheme.outlineColor}
              strokeWidth={painted ? 0.8 : 1.5}
              opacity={painted ? 0.55 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Lehenga Latkan: painted gold beads and tassel hanging from the waistband */}
            {currentGarment === 'lehenga' && beltLatkan !== 'none' && !isBack && (() => {
              const k = beltLatkan === 'light' ? 0.72 : 1;
              const [ax, ay] = PAINTED_LATKAN_ANCHOR;
              return (
                <g
                  id="waist-latkan"
                  className="transition-opacity duration-300"
                  transform={`translate(${ax} ${ay}) scale(${k}) translate(${-ax} ${-ay})`}
                >
                  {/* gold cord from the waistband with graduated beads, ending in a full tassel */}
                  {(() => {
                    const cordEnd = ay + 116;
                    const beads = [ay + 22, ay + 46, ay + 68, ay + 88, ay + 104];
                    return (
                      <g>
                        <path d={`M ${ax} ${ay} C ${ax - 1} ${ay + 40} ${ax + 1} ${ay + 80} ${ax} ${cordEnd}`} fill="none" stroke="#6b5222" strokeWidth="2.6" opacity="0.5" strokeLinecap="round" />
                        <path d={`M ${ax} ${ay} C ${ax - 1} ${ay + 40} ${ax + 1} ${ay + 80} ${ax} ${cordEnd}`} fill="none" stroke="#c9a24e" strokeWidth="2" strokeLinecap="round" />
                        <path d={`M ${ax} ${ay} C ${ax - 1} ${ay + 40} ${ax + 1} ${ay + 80} ${ax} ${cordEnd}`} fill="none" stroke="#f0d998" strokeWidth="0.9" strokeDasharray="1.4 1.4" strokeLinecap="round" />
                        {beads.map((by, i) => (
                          <g key={i}>
                            <ellipse cx={ax} cy={by} rx={2.6 + i * 0.35} ry={2.9 + i * 0.4} fill="url(#tassel-bead)" stroke="#6b5222" strokeWidth="0.4" />
                            <circle cx={ax} cy={by - 4.2 - i * 0.4} r="0.9" fill="#d9b867" stroke="#6b5222" strokeWidth="0.25" />
                          </g>
                        ))}
                        {tassel(ax, cordEnd, 52, 'skirt-tassel')}
                      </g>
                    );
                  })()}
                </g>
              );
            })()}

            {(currentGarment === 'saree' || currentGarment === 'dress') && beltLatkan !== 'none' && (() => {
              const w = 50 * fitK;
              const yTop = 301;
              const h = beltLatkan === 'heavy' ? 12 : 6;
              const dip = 4.5;
              const xL = STAGE_CX - w;
              const xR = STAGE_CX + w;
              const beltD = `M ${xL.toFixed(1)} ${yTop} Q ${STAGE_CX} ${(yTop + dip).toFixed(1)} ${xR.toFixed(1)} ${yTop} L ${xR.toFixed(1)} ${yTop + h} Q ${STAGE_CX} ${(yTop + h + dip).toFixed(1)} ${xL.toFixed(1)} ${yTop + h} Z`;
              const xTie = xL + 4;
              const yTie = yTop + h;

              return (
                <g id="saree-kamarbandh-belt-and-latkan">
                  {/* Belt Base */}
                  <path
                    d={beltD}
                    fill={beltLatkan === 'heavy' ? fabTheme.accentColor : fabTheme.baseColor}
                    stroke={fabTheme.outlineColor}
                    strokeWidth={beltLatkan === 'heavy' ? '1.4' : '1.1'}
                  />
                  <path
                    d={beltD}
                    fill="url(#top-fabric-grad)"
                    opacity="0.3"
                  />
                  {beltLatkan === 'heavy' && (
                    <>
                      <path
                        d={`M ${(xL + 2).toFixed(1)} ${yTop + h / 2} Q ${STAGE_CX} ${(yTop + h / 2 + dip).toFixed(1)} ${(xR - 2).toFixed(1)} ${yTop + h / 2}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                        opacity="0.85"
                      />
                      <circle cx={STAGE_CX} cy={yTop + h / 2 + dip} r={4.5} fill={fabTheme.accentColor} stroke={fabTheme.outlineColor} strokeWidth="1" />
                      <circle cx={STAGE_CX} cy={yTop + h / 2 + dip} r={1.8} fill="#ffffff" />
                    </>
                  )}
                  {/* Hanging Latkan on Hip */}
                  <g id="saree-hip-latkan">
                    <circle cx={xTie} cy={yTie} r={2} fill={fabTheme.accentColor} stroke={fabTheme.outlineColor} strokeWidth="0.8" />
                    <path
                      d={`M ${xTie} ${yTie} C ${xTie - 6} ${yTie + 20} ${xTie - 8} ${yTie + 45} ${xTie - 4} ${yTie + 70}`}
                      fill="none"
                      stroke={fabTheme.outlineColor}
                      strokeWidth="1.1"
                    />
                    <circle cx={xTie - 6} cy={yTie + 50} r={2.2} fill={fabTheme.accentColor} stroke={fabTheme.outlineColor} strokeWidth="0.8" />
                    <path
                      d={`M ${xTie - 8} ${yTie + 70} L ${xTie} ${yTie + 70} L ${xTie - 4} ${yTie + 65} Z`}
                      fill={fabTheme.accentColor}
                      stroke={fabTheme.outlineColor}
                      strokeWidth="0.9"
                    />
                    <path
                      d={`M ${xTie - 9} ${yTie + 80} L ${xTie + 1} ${yTie + 80} L ${xTie - 4} ${yTie + 70} Z`}
                      fill={fabTheme.baseColor}
                      stroke={fabTheme.outlineColor}
                      strokeWidth="1"
                    />
                    <line x1={xTie - 7} y1={yTie + 80} x2={xTie - 8} y2={yTie + 86} stroke={fabTheme.accentColor} strokeWidth="0.8" strokeLinecap="round" />
                    <line x1={xTie - 4} y1={yTie + 80} x2={xTie - 4} y2={yTie + 87} stroke={fabTheme.accentColor} strokeWidth="0.9" strokeLinecap="round" />
                    <line x1={xTie - 1} y1={yTie + 80} x2={xTie} y2={yTie + 86} stroke={fabTheme.accentColor} strokeWidth="0.8" strokeLinecap="round" />
                    {beltLatkan === 'heavy' && (
                      <>
                        <path
                          d={`M ${xTie + 2} ${yTie + 1} C ${xTie - 2} ${yTie + 22} ${xTie - 4} ${yTie + 50} ${xTie - 8} ${yTie + 88}`}
                          fill="none"
                          stroke={fabTheme.outlineColor}
                          strokeWidth="1.1"
                        />
                        <circle cx={xTie - 4} cy={yTie + 65} r={2} fill={fabTheme.accentColor} stroke={fabTheme.outlineColor} strokeWidth="0.8" />
                        <path
                          d={`M ${xTie - 12} ${yTie + 98} L ${xTie - 4} ${yTie + 98} L ${xTie - 8} ${yTie + 88} Z`}
                          fill={fabTheme.baseColor}
                          stroke={fabTheme.outlineColor}
                          strokeWidth="1"
                        />
                        <line x1={xTie - 10} y1={yTie + 98} x2={xTie - 11} y2={yTie + 104} stroke={fabTheme.accentColor} strokeWidth="0.8" strokeLinecap="round" />
                        <line x1={xTie - 8} y1={yTie + 98} x2={xTie - 8} y2={yTie + 105} stroke={fabTheme.accentColor} strokeWidth="0.9" strokeLinecap="round" />
                        <line x1={xTie - 6} y1={yTie + 98} x2={xTie - 5} y2={yTie + 104} stroke={fabTheme.accentColor} strokeWidth="0.8" strokeLinecap="round" />
                      </>
                    )}
                  </g>
                </g>
              );
            })()}
          </g>

          {/* Mannequin Arms & Hands (Rendered ON TOP of Skirt/Lehenga - Fully Opaque so no skirt linework shows through) */}
          <g id="arms-and-hands-linework">
            {armPose === 'resting' ? (
              <g id="resting-arms-top" filter="url(#arm-shadow)">
                {/* Left Arm Opaque Linen Base & Texture (Hides underlying skirt pleats & linework) */}
                <path
                  d={svgPath(scaleX(ARM_L, fitK))}
                  fill="#f9e0cf"
                />
                <path
                  d={svgPath(scaleX(ARM_L, fitK))}
                  fill="url(#mannequin-arm-l)"
                />
                <path
                  d={svgPath(scaleX(ARM_L, fitK))}
                  fill="url(#mannequin-canvas-texture)"
                  opacity="0.45"
                />

                {/* Right Arm Opaque Linen Base & Texture (Hides underlying skirt pleats & linework) */}
                <path
                  d={svgPath(scaleX(ARM_R, fitK))}
                  fill="#f9e0cf"
                />
                <path
                  d={svgPath(scaleX(ARM_R, fitK))}
                  fill="url(#mannequin-arm-r)"
                />
                <path
                  d={svgPath(scaleX(ARM_R, fitK))}
                  fill="url(#mannequin-canvas-texture)"
                  opacity="0.45"
                />

                {/* Left and Right Arm Outlines */}
                <path
                  d={svgPath(scaleX(ARM_L, fitK))}
                  fill="none"
                  stroke="#2a1f18"
                  strokeWidth="1.25"
                  opacity="0.8"
                  strokeLinejoin="round"
                />
                <path
                  d={svgPath(scaleX(ARM_R, fitK))}
                  fill="none"
                  stroke="#2a1f18"
                  strokeWidth="1.25"
                  opacity="0.8"
                  strokeLinejoin="round"
                />

                {/* Left Hand Form: Thumb & Finger Creases */}
                <path
                  d={`M ${scaleX([[137, 432]], fitK)[0][0]} 432 C ${scaleX([[140, 438]], fitK)[0][0]} 438 ${scaleX([[143, 442]], fitK)[0][0]} 442 ${scaleX([[147, 444]], fitK)[0][0]} 444`}
                  fill="none"
                  stroke="#2b241e"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                <path
                  d={`M ${scaleX([[142, 444]], fitK)[0][0]} 444 L ${scaleX([[142, 465]], fitK)[0][0]} 465`}
                  fill="none"
                  stroke="#2b241e"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  opacity="0.55"
                />

                {/* Right Hand Form: Thumb & Finger Creases */}
                <path
                  d={`M ${scaleX([[STAGE_W - 137, 432]], fitK)[0][0]} 432 C ${scaleX([[STAGE_W - 140, 438]], fitK)[0][0]} 438 ${scaleX([[STAGE_W - 143, 442]], fitK)[0][0]} 442 ${scaleX([[STAGE_W - 147, 444]], fitK)[0][0]} 444`}
                  fill="none"
                  stroke="#2b241e"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                <path
                  d={`M ${scaleX([[STAGE_W - 142, 444]], fitK)[0][0]} 444 L ${scaleX([[STAGE_W - 142, 465]], fitK)[0][0]} 465`}
                  fill="none"
                  stroke="#2b241e"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  opacity="0.55"
                />

                {/* Traditional Gold Bangles (Churi) on Wrists */}
                <g id="wrist-bangles-resting" opacity="0.92">
                  <path d={`M ${scaleX([[134, 420]], fitK)[0][0]} 420 Q ${scaleX([[142, 423]], fitK)[0][0]} 423 ${scaleX([[148, 420]], fitK)[0][0]} 420`} fill="none" stroke="#C7A66A" strokeWidth="1.6" strokeLinecap="round" />
                  <path d={`M ${scaleX([[135, 424]], fitK)[0][0]} 424 Q ${scaleX([[142, 427]], fitK)[0][0]} 427 ${scaleX([[148, 424]], fitK)[0][0]} 424`} fill="none" stroke="#b58d44" strokeWidth="1.3" strokeLinecap="round" />
                  <path d={`M ${scaleX([[STAGE_W - 148, 420]], fitK)[0][0]} 420 Q ${scaleX([[STAGE_W - 142, 423]], fitK)[0][0]} 423 ${scaleX([[STAGE_W - 134, 420]], fitK)[0][0]} 420`} fill="none" stroke="#C7A66A" strokeWidth="1.6" strokeLinecap="round" />
                  <path d={`M ${scaleX([[STAGE_W - 148, 424]], fitK)[0][0]} 424 Q ${scaleX([[STAGE_W - 142, 427]], fitK)[0][0]} 427 ${scaleX([[STAGE_W - 135, 424]], fitK)[0][0]} 424`} fill="none" stroke="#b58d44" strokeWidth="1.3" strokeLinecap="round" />
                </g>
              </g>
            ) : (
              <g id="outstretched-arms-linework" filter="url(#arm-shadow)">
                {painted && (
                  <g id="painted-upper-arms">
                    {[paintedUpperArmL(), mir(paintedUpperArmL())].map((pts, i) => (
                      <path key={`upper-arm-${i}`} d={svgPath(pts)} fill="url(#painted-upper-arm-skin)" />
                    ))}
                    {[1, -1].flatMap((sd) => [paintedUpperArmSide(sd as 1 | -1), mir(paintedUpperArmSide(sd as 1 | -1))]).map((pts, i) => (
                      <path
                        key={`upper-arm-edge-${i}`}
                        d={'M ' + pts.map((q) => q.join(' ')).join(' L ')}
                        fill="none"
                        stroke="#c99a84"
                        strokeWidth="0.7"
                        strokeOpacity="0.55"
                      />
                    ))}
                  </g>
                )}
                <g display={painted ? 'none' : undefined}>
                {/* Outstretched Arms Opaque Fills (Hides underlying background / linework) */}
                <path
                  d={svgPath(scaleX(armOutL, fitK))}
                  fill="#f9e0cf"
                />
                <path
                  d={svgPath(scaleX(armOutL, fitK))}
                  fill="url(#mannequin-arm-l)"
                />
                <path
                  d={svgPath(scaleX(armOutL, fitK))}
                  fill="url(#mannequin-canvas-texture)"
                  opacity="0.45"
                />
                <path
                  d={svgPath(scaleX(armOutR, fitK))}
                  fill="#f9e0cf"
                />
                <path
                  d={svgPath(scaleX(armOutR, fitK))}
                  fill="url(#mannequin-arm-r)"
                />
                <path
                  d={svgPath(scaleX(armOutR, fitK))}
                  fill="url(#mannequin-canvas-texture)"
                  opacity="0.45"
                />

                {!painted && (
                  <>
                    <path d={svgPath(scaleX(armOutL, fitK))} fill="none" stroke="#2a1f18" strokeWidth="1.25" opacity="0.8" strokeLinejoin="round" />
                    <path d={svgPath(scaleX(armOutR, fitK))} fill="none" stroke="#2a1f18" strokeWidth="1.25" opacity="0.8" strokeLinejoin="round" />
                  </>
                )}

                </g>

                {/* Painted forearms and hands from the reference artwork */}
                {/* (the front painting's forearms fit the arm skeleton, so the back view uses them too) */}
                {painted && <g mask="url(#painted-forearm-mask)">{paintedImage(PAINTED.armsStretch)}</g>}

                {/* Gold Bangles (Churi) for Outstretched Arms */}
                <g id="wrist-bangles-stretched" opacity="0.92" display={painted ? 'none' : undefined}>
                  {[50, 55].map((bx, i) =>
                    [
                      bendArm([[bx, 157], [bx - 1.5, 166], [bx, 175]]),
                      mir(bendArm([[bx, 157], [bx - 1.5, 166], [bx, 175]])),
                    ].map((b, j) => {
                      const [p0, p1, p2] = scaleX(b, fitK);
                      return (
                      <path
                        key={`bangle-${i}-${j}`}
                        d={`M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`}
                        fill="none"
                        stroke={i === 0 ? '#C7A66A' : '#b58d44'}
                        strokeWidth={i === 0 ? 1.6 : 1.3}
                        strokeLinecap="round"
                      />
                      );
                    })
                  )}
                </g>

              </g>
            )}
          </g>

          {/* Peplum soft drop shadow on the skirt */}
          {topStyleId === 'peplum' && !isBack && (
            <path
              d={`M ${STAGE_CX - 102 * fitK} 344 Q ${STAGE_CX} 366 ${STAGE_CX + 102 * fitK} 344 Q ${STAGE_CX} 372 ${STAGE_CX - 102 * fitK} 344 Z`}
              fill="rgba(0,0,0,0.16)"
            />
          )}

          {/* Blouse Fabric Base, Texture & Cel Shading Overlay */}
          {/* (a flat fill matched to the painted fabric backs the texture where it doesn't reach, e.g. a collar) */}
          {painted && <path d={svgPath(topPts())} fill="#82a18b" />}
          {painted ? (
            paintedImage(PV.blouse, 'top-clip')
          ) : (
            <path d={svgPath(topPts())} fill="url(#top-fabric-grad)" />
          )}
          <g clipPath="url(#top-clip)">
            {texKey === 'net' && <rect width={STAGE_W} height={STAGE_H} fill="url(#net-mesh)" />}
            {texKey === 'banarasi' && <rect width={STAGE_W} height={STAGE_H} fill="url(#banarasi-butis)" />}
            {texKey === 'velvet' && (
              <rect width={STAGE_W} height={STAGE_H} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            )}
            {texKey === 'organza' && <rect width={STAGE_W} height={STAGE_H} fill="rgba(255,255,255,0.15)" />}

            {/* Blouse 2D Cel Shading & Volume Highlights */}
            {!isBack && currentGarment !== 'shirt' && !painted && (
              <>
                <ellipse cx="204" cy="226" rx="23" ry="18" fill="url(#bust-highlight-l)" />
                <ellipse cx="256" cy="226" rx="23" ry="18" fill="url(#bust-highlight-r)" />
                {topStyleId !== 'peplum' ? (
                  <path d="M 180 258 Q 230 266 280 258 L 280 263 Q 230 271 180 263 Z" fill="rgba(0,0,0,0.14)" />
                ) : (
                  <>
                    {/* Flared peplum falls into shade toward the hem */}
                    <path d={`M ${STAGE_CX - 41} 262 L ${STAGE_CX + 41} 262 L ${STAGE_CX + 104} 358 L ${STAGE_CX - 104} 358 Z`} fill="url(#peplum-flare-depth)" opacity="0.28" />
                  </>
                )}
              </>
            )}
            {isBack && currentGarment !== 'shirt' && !painted && (
              <rect x="228" y="150" width="4" height="140" fill="rgba(0,0,0,0.12)" />
            )}
          </g>

          {/* Halter front: soft gathers fanning down from the ruched neck casing */}
          {painted && neckId === 'halter' && !isBack && bodiceSleeveId === 'sleeveless' && (
            <g id="halter-gathers" clipPath="url(#top-clip)" fill="none" strokeLinecap="round">
              {Array.from({ length: 9 }, (_, i) => {
                const k = i - 4;
                const x0 = STAGE_CX + k * 4.4 * fitK;
                const x1 = STAGE_CX + k * 9.5 * fitK;
                const bow = k * 1.6;
                const end = 222 + Math.abs(k) * 5 + (i % 2) * 8;
                return (
                  <g key={i}>
                    <path d={`M ${x0} 147.5 Q ${(x0 + x1) / 2 + bow} 186 ${x1} ${end}`} stroke="rgba(0,0,0,0.16)" strokeWidth="0.9" />
                    <path d={`M ${x0 + 1.4} 148 Q ${(x0 + x1) / 2 + bow + 1.6} 186 ${x1 + 2} ${end - 6}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1.3" />
                  </g>
                );
              })}
              {/* ruched casing: a stitched band with tight puckers */}
              <path d={`M ${STAGE_CX - 21 * fitK} 147.6 Q ${STAGE_CX} 148.3 ${STAGE_CX + 21 * fitK} 147.6`} stroke={fabTheme.outlineColor} strokeWidth="0.7" opacity="0.5" />
              {Array.from({ length: 17 }, (_, i) => {
                const x = STAGE_CX + (i - 8) * 2.45 * fitK;
                return <path key={`pk-${i}`} d={`M ${x} 142 Q ${x + (i % 2 ? 0.45 : -0.45)} 144.6 ${x} 147`} stroke="rgba(0,0,0,0.16)" strokeWidth="0.45" />;
              })}
            </g>
          )}

          {/* Blouse 2D Game Linework: Silhouette, Neckline, Seams & Darts */}
          <g id="blouse-linework">
            {/* Blouse Clickable Hit Area */}
            {onSelectCategorySlot && (
              <path
                d={svgPath(topPts())}
                fill="transparent"
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectCategorySlot('topStyle')}
              >
                <title>Blouse Bodice: Click to customize blouse style</title>
              </path>
            )}

            {/* Blouse Outer Silhouette Thin Black Outline */}
            <path 
              d={svgPath(topPts())}
              fill="none"
              stroke={fabTheme.outlineColor}
              strokeWidth={painted ? 0.8 : 1.55}
              opacity={painted ? 0.55 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Inner Neckline Linework, Piping & Scalloped Moti Beads */}
            {(() => {
              const neck = necklineData();
              return (
                <g id="neckline-linework">
                  <path
                    d={neck.d}
                    fill="none"
                    stroke={fabTheme.outlineColor}
                    strokeWidth={painted ? 0.8 : 1.55}
                    opacity={painted && neckId === 'halter' ? 0 : painted ? 0.6 : 1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {!painted && (
                    <path
                      d={neck.d}
                      fill="none"
                      stroke={fabTheme.accentColor}
                      strokeWidth="1.05"
                      opacity="0.9"
                      transform="translate(0, 1.2)"
                    />
                  )}
                </g>
              );
            })()}

            {/* Haute Couture Tailoring Details */}
            {(() => {
              const bDet = blouseDetails();
              if (!bDet) return null;
              if (bDet.isCorset) {
                return (
                  <g id="blouse-corset-details">
                    {/* Boned panels: soft light and shade either side of each seam */}
                    {bDet.corsetPanels?.map((pl, idx) => (
                      <path
                        key={`corset-panel-${idx}`}
                        d={pl.d}
                        fill="none"
                        stroke={pl.light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    ))}
                    {/* Double topstitched boning seams */}
                    {bDet.corsetSeams?.map((d, idx) => (
                      <path key={`corset-seam-${idx}`} d={d} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.75" strokeDasharray="2 1.4" opacity="0.95" strokeLinecap="round" />
                    ))}
                    {bDet.corsetSeams?.filter((_, idx) => idx % 2 === 0).map((d, idx) => (
                      <path key={`corset-seam-line-${idx}`} d={d} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.6" opacity="0.4" transform="translate(0.9 0)" strokeLinecap="round" />
                    ))}
                    {/* Topstitching along the neckline and the pointed hem */}
                    {bDet.corsetNeckStitch && (
                      <path d={bDet.corsetNeckStitch} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.75" strokeDasharray="2 1.4" opacity="0.95" strokeLinecap="round" />
                    )}
                    {bDet.corsetHem && (
                      <path d={bDet.corsetHem} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.75" strokeDasharray="2 1.4" opacity="0.95" strokeLinecap="round" />
                    )}
                    {/* Back view: centre-back lacing */}
                    {bDet.corsetLacing && bDet.corsetLacing.length > 0 && (
                      <g id="corset-back-lacing">
                        <path d={`M ${STAGE_CX - 6} ${bDet.corsetLaceTop} L ${STAGE_CX - 6} 272 M ${STAGE_CX + 6} ${bDet.corsetLaceTop} L ${STAGE_CX + 6} 272`} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.9" opacity="0.55" />
                        {bDet.corsetLacing.map((d, idx) => (
                          <path key={`lace-${idx}`} d={d} fill="none" stroke={fabTheme.accentColor} strokeWidth="1" strokeLinecap="round" />
                        ))}
                      </g>
                    )}
                  </g>
                );
              }

              if (bDet.isPeplum) {
                return (
                  <g id="blouse-peplum-details">
                    {/* Soft shadow where the peplum leaves the waist seam */}
                    {bDet.peplumShade && <path d={bDet.peplumShade} fill="rgba(0,0,0,0.05)" />}

                    {/* Inverted box pleats: valley shadow, crease and lit ridge */}
                    {bDet.peplumPleats?.map((pl, idx) => (
                      <g key={`peplum-pleat-${idx}`}>
                        <path d={pl.fold} fill="rgba(0,0,0,0.06)" />
                        <path d={pl.shadow} fill="rgba(0,0,0,0.12)" />
                        <path d={pl.crease} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.85" opacity="0.5" strokeLinecap="round" />
                        <path d={pl.ridge} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.2" strokeLinecap="round" />
                      </g>
                    ))}

                    {/* Princess darts shaping the bodice into the waist */}
                    {bDet.peplumDarts?.map((d, idx) => (
                      <path key={`peplum-dart-${idx}`} d={d} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.85" opacity="0.5" strokeLinecap="round" />
                    ))}

                    {/* Centre back seam */}
                    {bDet.spine && <path d={bDet.spine} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />}

                    {/* Natural waist seam */}
                    {bDet.waistSeam && (
                      <path d={bDet.waistSeam} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.1" opacity="0.7" strokeLinecap="round" />
                    )}

                    {/* Stitched hem */}
                    {bDet.peplumHemStitch && (
                      <path d={bDet.peplumHemStitch} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />
                    )}
                  </g>
                );
              }

              if (bDet.isBack) {
                return (
                  <g id="blouse-back-details">
                    {/* Spine seam */}
                    {!bDet.tieWindow && !bDet.cutWindow && <path d={bDet.spine!} fill="none" stroke={fabTheme.outlineColor} strokeWidth={painted ? 0.8 : 1.1} opacity={painted ? 0.45 : 0.6} strokeLinecap="round" />}
                    {/* Tailored back darts */}
                    {!painted && <path d={bDet.dartLeft!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.1" opacity="0.6" strokeLinecap="round" />}
                    {!painted && <path d={bDet.dartRight!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.1" opacity="0.6" strokeLinecap="round" />}

                    {/* Back Hem Border */}
                    {!painted && <path d={bDet.hemBorder!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" strokeLinecap="round" />}

                    {/* Potli Buttons (fabric covered buttons with thread loops along back seam) */}
                    {bDet.showPotli && bDet.potliYs && bDet.potliYs.map((py, idx) => (
                      <g key={`potli-${idx}`} id={`potli-button-${idx}`}>
                        <path
                          d={`M ${STAGE_CX - 1} ${py - 3} C ${STAGE_CX - 4.5} ${py - 2} ${STAGE_CX - 4.5} ${py + 2} ${STAGE_CX - 1} ${py + 3}`}
                          fill="none"
                          stroke={fabTheme.outlineColor}
                          strokeWidth="0.85"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={STAGE_CX + 1}
                          cy={py}
                          r="2.4"
                          fill={fabTheme.accentColor}
                          stroke={fabTheme.outlineColor}
                          strokeWidth="0.95"
                        />
                        <circle cx={STAGE_CX + 0.5} cy={py - 0.5} r="0.65" fill="#ffffff" opacity="0.7" />
                      </g>
                    ))}

                    {/* Cut-out back: a large diamond opening from a button at the nape to a button just
                        above the hem, widest across the mid back, piped in gold */}
                    {bDet.cutWindow && (() => {
                      const { top, bottom, half, upperY, lowerY } = CUT_OUT_BACK;
                      const cx = STAGE_CX;
                      // straight edges with softly rounded side corners, pinched at the top and bottom
                      const sideL = (y: number) => [cx - half + (y > (upperY + lowerY) / 2 ? 1 : 0), y];
                      const [ux, uy] = sideL(upperY), [lx, ly] = sideL(lowerY);
                      const d = `M ${cx} ${top} L ${ux + 3} ${uy - 4} Q ${ux} ${uy} ${ux} ${uy + 4} L ${lx} ${ly - 4} Q ${lx} ${ly} ${lx + 3} ${ly + 3} L ${cx} ${bottom} L ${2 * cx - lx - 3} ${ly + 3} Q ${2 * cx - lx} ${ly} ${2 * cx - lx} ${ly - 4} L ${2 * cx - ux} ${uy + 4} Q ${2 * cx - ux} ${uy} ${2 * cx - ux - 3} ${uy - 4} Z`;
                      const button = (y: number) => (
                        <g>
                          <circle cx={cx} cy={y} r="1.9" fill={fabTheme.baseColor} stroke={fabTheme.outlineColor} strokeWidth="0.55" />
                          <circle cx={cx - 0.5} cy={y - 0.5} r="0.6" fill="#ffffff" opacity="0.5" />
                        </g>
                      );
                      return (
                        <g id="cut-out-back">
                          <clipPath id="cut-out-clip"><path d={d} /></clipPath>
                          <g clipPath="url(#cut-out-clip)">
                            {painted ? paintedImage(PV.skin) : <rect x={cx - half - 2} y={top} width={half * 2 + 4} height={bottom - top} fill="#f3d8bc" />}
                            <path d={d} fill="none" stroke="rgba(90,50,40,0.22)" strokeWidth="5" />
                          </g>
                          <path d={d} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.7" opacity="0.6" />
                          <path d={d} fill="none" stroke="#c8a24f" strokeWidth="0.9" opacity="0.9" />
                          {button(top - 1.2)}
                          {button(bottom + 1.6)}
                        </g>
                      );
                    })()}

                    {/* Tie back: an open window from below the shoulder blades through the hem, piped in
                        gold, its sides drawn together by two rows of thin cords tied in bows */}
                    {bDet.tieWindow && (() => {
                      const { top, bottom, topHalf, bottomHalf, r, rows } = TIE_BACK_WINDOW;
                      const cx = STAGE_CX;
                      const xL = (y: number) => cx - topHalf + ((y - (top + r)) / (bottom - (top + r))) * (topHalf - bottomHalf);
                      const win = `M ${cx - bottomHalf} ${bottom} L ${cx - topHalf} ${top + r} Q ${cx - topHalf} ${top} ${cx - topHalf + r} ${top} L ${cx + topHalf - r} ${top} Q ${cx + topHalf} ${top} ${cx + topHalf} ${top + r} L ${cx + bottomHalf} ${bottom} Z`;
                      const edge = `M ${cx - bottomHalf + 0.3} ${bottom - 3.5} L ${cx - topHalf} ${top + r} Q ${cx - topHalf} ${top} ${cx - topHalf + r} ${top} L ${cx + topHalf - r} ${top} Q ${cx + topHalf} ${top} ${cx + topHalf} ${top + r} L ${cx + bottomHalf - 0.3} ${bottom - 3.5}`;
                      const cord = (d: string, key: string) => (
                        <g key={key} fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d={d} stroke="#1f3328" strokeWidth="1.05" opacity="0.6" />
                          <path d={d} stroke="#3b5a47" strokeWidth="0.75" />
                        </g>
                      );
                      return (
                        <g id="tie-back-window">
                          <clipPath id="tie-back-clip"><path d={win} /></clipPath>
                          <g clipPath="url(#tie-back-clip)">
                            {painted ? paintedImage(PV.skin) : <rect x={cx - topHalf} y={top} width={topHalf * 2} height={bottom - top} fill="#f3d8bc" />}
                            <path d={edge} fill="none" stroke="rgba(90,50,40,0.22)" strokeWidth="5" />
                          </g>
                          <path d={edge} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.7" opacity="0.6" />
                          <path d={edge} fill="none" stroke="#c8a24f" strokeWidth="0.9" transform="translate(0 0)" opacity="0.9" strokeLinecap="round" />
                          {rows.map((y, i) => {
                            const xl = xL(y) + 0.6, xr = 2 * cx - xL(y) - 0.6;
                            const bx = cx - 4 + i * 2; // bows sit a little off centre, as tied by hand
                            const by = y + 1.2;
                            const tailLen = i === rows.length - 1 ? 34 : 15;
                            return (
                              <g key={i}>
                                {cord(`M ${xl} ${y} Q ${(xl + bx) / 2} ${y + 2} ${bx} ${by}`, `l${i}`)}
                                {cord(`M ${xr} ${y} Q ${(xr + bx) / 2} ${y + 2} ${bx} ${by}`, `r${i}`)}
                                {cord(`M ${bx} ${by} C ${bx - 6} ${by - 9} ${bx - 14} ${by - 5} ${bx - 9} ${by - 0.5} C ${bx - 6} ${by + 2} ${bx - 2} ${by + 1} ${bx} ${by}`, `bl${i}`)}
                                {cord(`M ${bx} ${by} C ${bx + 6} ${by - 8} ${bx + 15} ${by - 3} ${bx + 10} ${by + 1.5} C ${bx + 6} ${by + 3.5} ${bx + 2} ${by + 1.5} ${bx} ${by}`, `br${i}`)}
                                {cord(`M ${bx} ${by} C ${bx - 2} ${by + tailLen * 0.4} ${bx - 6} ${by + tailLen * 0.7} ${bx - 5} ${by + tailLen}`, `tl${i}`)}
                                {cord(`M ${bx} ${by} C ${bx + 2} ${by + tailLen * 0.45} ${bx + 4} ${by + tailLen * 0.8} ${bx + 6} ${by + tailLen + 3}`, `tr${i}`)}
                                <circle cx={bx} cy={by} r="0.9" fill="#3b5a47" stroke="#1f3328" strokeWidth="0.3" />
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}

                    {/* Keyhole: a teardrop opening below the neck, closed at the top with a fabric button
                        and loop, and the centre-back seam running down from its point */}
                    {bDet.keyhole && (() => {
                      const { top, bottom, half, widest } = KEYHOLE_BACK;
                      const cx = STAGE_CX;
                      const mid = top + (bottom - top) * widest;
                      const d = `M ${cx} ${top} C ${cx - half * 0.55} ${top + 2} ${cx - half} ${mid - 16} ${cx - half} ${mid} C ${cx - half} ${mid + 18} ${cx - 4} ${bottom - 12} ${cx} ${bottom} C ${cx + 4} ${bottom - 12} ${cx + half} ${mid + 18} ${cx + half} ${mid} C ${cx + half} ${mid - 16} ${cx + half * 0.55} ${top + 2} ${cx} ${top} Z`;
                      const neckY = 161.2;
                      return (
                        <g id="keyhole-back">
                          <clipPath id="keyhole-back-clip"><path d={d} /></clipPath>
                          <g clipPath="url(#keyhole-back-clip)">
                            {painted ? paintedImage(PV.skin) : <rect x={cx - half} y={top} width={half * 2} height={bottom - top} fill="#f3d8bc" />}
                            {/* the blouse edge casts a soft shadow into the opening */}
                            <path d={d} fill="none" stroke="rgba(90,50,40,0.22)" strokeWidth="5" />
                          </g>
                          <path d={d} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.8" opacity="0.65" />
                          {/* centre-back seam from the point of the keyhole to the hem */}
                          <path d={`M ${cx} ${bottom + 0.5} L ${cx} ${(TOP[topStyleId] || TOP.fitted).right.slice(-1)[0][1] - 1}`} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.7" opacity="0.45" />
                          {/* neck closure: fabric loop and covered button */}
                          <path d={`M ${cx - 3.2} ${neckY + 2.2} Q ${cx - 3.6} ${neckY - 0.6} ${cx - 0.8} ${neckY + 1.2}`} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.6" />
                          <circle cx={cx + 0.6} cy={neckY + 2.1} r="1.9" fill={fabTheme.baseColor} stroke={fabTheme.outlineColor} strokeWidth="0.55" />
                          <circle cx={cx + 0.1} cy={neckY + 1.6} r="0.6" fill="#ffffff" opacity="0.5" />
                        </g>
                      );
                    })()}

                    {/* Upper dori: tied across the opening in a bow, tails ending in latkans */}
                    {bDet.dori && (() => {
                      const { y, xl, xr, tailEnd } = bDet.dori;
                      const cx = STAGE_CX;
                      const gold = (d: string, key: string, w = 1.25) => (
                        <g key={key} fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d={d} stroke="#6b5222" strokeWidth={w + 0.6} opacity="0.55" />
                          <path d={d} stroke="#c9a24e" strokeWidth={w} />
                          <path d={d} stroke="#f0d998" strokeWidth={w * 0.5} strokeDasharray="1 1.1" />
                        </g>
                      );
                      const latkan = (x: number, ty: number, key: string) => tassel(x, ty, 15, key);
                      // knot sits a little below the cord line; tails swing slightly apart
                      const ky = y + 2.2;
                      const tl = cx - 7.5, tr = cx + 8; // clear of the potli buttons down the centre
                      return (
                        <g id="back-dori">
                          {/* cords from each edge of the opening to the knot */}
                          {gold(`M ${xl + 0.5} ${y} Q ${(xl + cx) / 2} ${y + 3.2} ${cx - 1} ${ky}`, 'cord-l')}
                          {gold(`M ${xr - 0.5} ${y} Q ${(xr + cx) / 2} ${y + 3.2} ${cx + 1} ${ky}`, 'cord-r')}
                          {/* where the cords are stitched to the opening's edges */}
                          <circle cx={xl + 0.6} cy={y} r="0.9" fill="#c9a24e" stroke="#6b5222" strokeWidth="0.35" />
                          <circle cx={xr - 0.6} cy={y} r="0.9" fill="#c9a24e" stroke="#6b5222" strokeWidth="0.35" />
                          {/* bow loops */}
                          {gold(`M ${cx} ${ky} C ${cx - 4} ${ky - 6} ${cx - 10} ${ky - 3.5} ${cx - 8} ${ky + 0.5} C ${cx - 6.5} ${ky + 3} ${cx - 2.5} ${ky + 1.2} ${cx} ${ky}`, 'loop-l', 1.1)}
                          {gold(`M ${cx} ${ky} C ${cx + 4} ${ky - 6} ${cx + 10} ${ky - 3.5} ${cx + 8} ${ky + 0.5} C ${cx + 6.5} ${ky + 3} ${cx + 2.5} ${ky + 1.2} ${cx} ${ky}`, 'loop-r', 1.1)}
                          {/* tails hanging over the blouse and past its hem */}
                          {gold(`M ${cx - 0.6} ${ky + 0.6} C ${cx - 3} ${ky + 18} ${tl + 1.5} ${tailEnd - 22} ${tl} ${tailEnd}`, 'tail-l', 1.1)}
                          {gold(`M ${cx + 0.6} ${ky + 0.6} C ${cx + 3} ${ky + 20} ${tr - 1.5} ${tailEnd - 20} ${tr} ${tailEnd + 4}`, 'tail-r', 1.1)}
                          <ellipse cx={cx} cy={ky} rx="1.8" ry="1.5" fill="#c9a24e" stroke="#6b5222" strokeWidth="0.45" />
                          {latkan(tl, tailEnd, 'lat-l')}
                          {latkan(tr, tailEnd + 4, 'lat-r')}
                        </g>
                      );
                    })()}

                    {/* Legacy upper dori (only when the back has no dori across its opening) */}
                    {!bDet.dori && !bDet.keyhole && !bDet.tieWindow && !bDet.cutWindow && (
                      <>
                    {bDet.tieBow && <path d={bDet.tieBow} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.3" strokeLinecap="round" />}
                    {bDet.doriLeft && <path d={bDet.doriLeft} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" strokeLinecap="round" />}
                    {bDet.doriRight && <path d={bDet.doriRight} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" strokeLinecap="round" />}

                    {/* Upper Latkan Left */}
                    {bDet.latkanL && (
                      <g id="latkan-upper-left">
                        {tassel(bDet.latkanL.x, bDet.latkanL.y, 15, 'upper-L')}
                      </g>
                    )}

                    {/* Upper Latkan Right */}
                    {bDet.latkanR && (
                      <g id="latkan-upper-right">
                        {tassel(bDet.latkanR.x, bDet.latkanR.y, 15, 'upper-R')}
                      </g>
                    )}

                      </>
                    )}

                    {/* Lower Waist Dori & Latkans (if tieBack, deepBack, or cutOut) */}
                    {bDet.hasLowerTie && (
                      <g id="blouse-lower-tie">
                        <path d={bDet.lowerTieBow!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.3" strokeLinecap="round" />
                        <path d={bDet.lowerDoriL!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.1" strokeLinecap="round" />
                        <path d={bDet.lowerDoriR!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.1" strokeLinecap="round" />
                        {/* Lower Latkan Left */}
                        {bDet.lowerLatkanL && (
                          <g id="latkan-lower-left">
                            {tassel(bDet.lowerLatkanL.x, bDet.lowerLatkanL.y, 14, 'lower-L')}
                          </g>
                        )}
                        {/* Lower Latkan Right */}
                        {bDet.lowerLatkanR && (
                          <g id="latkan-lower-right">
                            {tassel(bDet.lowerLatkanR.x, bDet.lowerLatkanR.y, 14, 'lower-R')}
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              }

              // The painted fabric carries the princess darts; the centre seam is drawn here so it
              // always starts at the neckline's centre point
              if (painted) {
                // (the gathered halter front has no centre seam)
                if (isBack || neckId === 'halter' || (topStyleId !== 'fitted' && topStyleId !== 'jacket')) return null;
                const neck = scaleX(NECK[neckId]?.pts || [], fitK);
                const atCentre = neck.filter((q) => Math.abs(q[0] - STAGE_CX) < 0.5);
                const top = atCentre.length ? Math.max(...atCentre.map((q) => q[1])) : Math.max(...neck.map((q) => q[1]));
                const hemC = TOP[topStyleId]?.hemC || [];
                const bottom = (hemC.find((q) => q[0] === STAGE_CX) || [STAGE_CX, 259])[1] - 1;
                if (top >= bottom - 4) return null;
                return (
                  <path
                    id="blouse-centre-seam"
                    d={`M ${STAGE_CX} ${top + 0.6} L ${STAGE_CX} ${bottom}`}
                    fill="none"
                    stroke={fabTheme.outlineColor}
                    strokeWidth="0.75"
                    opacity="0.5"
                    strokeLinecap="round"
                  />
                );
              }

              if (bDet.isNotched) {
                return (
                  <g id="blouse-front-notched-seams">
                    <path d={bDet.princessLeft!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.35" strokeLinecap="round" />
                    <path d={bDet.princessRight!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.35" strokeLinecap="round" />
                    <path d={bDet.hemLine!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.35" strokeLinecap="round" />
                  </g>
                );
              }

              return (
                <g id="blouse-front-darts">
                  {/* Sculpted Princess Seams */}
                  <path d={bDet.princessLeft!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" opacity="0.75" strokeLinecap="round" />
                  <path d={bDet.princessRight!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" opacity="0.75" strokeLinecap="round" />

                  {/* Bustier Cup Cradles & Underbust Patti */}
                  <path d={bDet.cupLeft!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.15" opacity="0.65" strokeLinecap="round" />
                  <path d={bDet.cupRight!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.15" opacity="0.65" strokeLinecap="round" />
                  <path d={bDet.underbustPatti!} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.95" opacity="0.75" strokeLinecap="round" />

                  {/* Center Front Seam */}
                  <path d={bDet.centerSeam!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.0" opacity="0.55" strokeLinecap="round" />

                  {/* Structured Choli Waistband Patti (Hem Border) */}
                  <path d={bDet.hemUpperPatti!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.2" strokeLinecap="round" />
                  <path d={bDet.hemMidPatti!} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.95" opacity="0.85" strokeLinecap="round" />
                  <path d={bDet.hemLine!} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.3" strokeLinecap="round" />
                </g>
              );
            })()}
          </g>

          {/* Sleeves Rendered On Top Layer (Seamlessly Unified with Blouse - No dividing yoke seam) */}
          {sleevePts('l') && sleevePts('r') && (
            <g id="sleeves-top-layer">
              {/* Sleeve 3D Cylindrical Volume Highlights */}
              <g clipPath="url(#sleeve-clip-l)">
                <path
                  d={svgPath(sleevePts('l')!)}
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="8"
                  opacity="0.45"
                />
              </g>
              <g clipPath="url(#sleeve-clip-r)">
                <path
                  d={svgPath(sleevePts('r')!)}
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="8"
                  opacity="0.45"
                />
              </g>

              {/* Gravity Fold Creases (Natural Draping Folds at Elbow & Forearm) */}
              <g clipPath="url(#sleeve-clip-l)">
              {gravityFoldPaths('l').map((d, idx) => (
                <path
                  key={`fold-l-${idx}`}
                  d={d}
                  fill="none"
                  stroke={fabTheme.outlineColor}
                  strokeWidth="1.1"
                  opacity="0.6"
                  strokeLinecap="round"
                />
              ))}
              </g>
              <g clipPath="url(#sleeve-clip-r)">
              {gravityFoldPaths('r').map((d, idx) => (
                <path
                  key={`fold-r-${idx}`}
                  d={d}
                  fill="none"
                  stroke={fabTheme.outlineColor}
                  strokeWidth="1.1"
                  opacity="0.6"
                  strokeLinecap="round"
                />
              ))}
              </g>

              {/* Sleeve Cuffs / Hem Border */}
              {cuffPts('l') && (
                <g id="cuff-l-top">
                  <path d={svgPath(cuffPts('l')!)} fill={topGradColors.start} opacity="0.95" />
                  <path d={svgPath(cuffPts('l')!)} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.4" strokeLinejoin="round" />
                  <path d={svgPath(cuffPts('l')!)} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.9" opacity="0.8" />
                </g>
              )}
              {cuffPts('r') && (
                <g id="cuff-r-top">
                  <path d={svgPath(cuffPts('r')!)} fill={topGradColors.start} opacity="0.95" />
                  <path d={svgPath(cuffPts('r')!)} fill="none" stroke={fabTheme.outlineColor} strokeWidth="1.4" strokeLinejoin="round" />
                  <path d={svgPath(cuffPts('r')!)} fill="none" stroke={fabTheme.accentColor} strokeWidth="0.9" opacity="0.8" />
                </g>
              )}

              {/* Bell Sleeve Subtle Flare Lines */}
              {sleeveId === 'bell' && armPose === 'resting' && (
                <g id="bell-sleeve-flares" opacity="0.45">
                  <path d="M 134 320 C 130 350 120 380 114 402" fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.95" strokeLinecap="round" />
                  <path d="M 148 315 C 146 348 144 378 142 400" fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.9" strokeLinecap="round" />
                  <path d={`M ${STAGE_W - 134} 320 C ${STAGE_W - 130} 350 ${STAGE_W - 120} 380 ${STAGE_W - 114} 402`} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.95" strokeLinecap="round" />
                  <path d={`M ${STAGE_W - 148} 315 C ${STAGE_W - 146} 348 ${STAGE_W - 144} 378 ${STAGE_W - 142} 400`} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.9" strokeLinecap="round" />
                </g>
              )}

              {/* Clickable Hit Areas for Sleeves (to switch directly to Sleeves customization) */}
              {onSelectCategorySlot && (
                <g id="interactive-sleeves-click-area" className="pointer-events-auto">
                  <path
                    d={svgPath(sleevePts('l')!)}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategorySlot('sleeves');
                    }}
                  >
                    <title>Sleeves: Click to customize sleeve style</title>
                  </path>
                  <path
                    d={svgPath(sleevePts('r')!)}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategorySlot('sleeves');
                    }}
                  >
                    <title>Sleeves: Click to customize sleeve style</title>
                  </path>
                </g>
              )}
            </g>
          )}

          {/* Stretched Pose Sleeve Hem Lines */}
          {armPose === 'stretched' && sleevePts('l') && !painted && (
            <g id="stretched-sleeve-cuffs">
              {(() => {
                const { reach, hemDrop } = stretchDims(sleeveId);
                const xEndL = 164 - reach;
                const hemL = scaleX(bendArm([[xEndL, 146 + reach * 0.1 - 2], [xEndL, 178 - reach * 0.05 + hemDrop + 1]]), fitK);
                const hemR = mir(hemL);

                return (
                  <>
                    <line x1={hemL[0][0]} y1={hemL[0][1]} x2={hemL[1][0]} y2={hemL[1][1]} stroke={fabTheme.outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={hemR[0][0]} y1={hemR[0][1]} x2={hemR[1][0]} y2={hemR[1][1]} stroke={fabTheme.outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                  </>
                );
              })()}
            </g>
          )}

          {/* Avatar Front Hair Cascade (Glossy locks falling over shoulder & bodice) */}
          {/* Jacket set: embroidered band at the choli hem, then the open jacket in the dupatta fabric */}
          {topStyleId === 'jacket' && currentGarment === 'lehenga' && (() => {
            const gold = '#c8a24f';
            const cloth = fabTheme.drapeColor;
            const panelL = scaleX(JACKET_PANEL_L, fitK);
            const panelR = mir(panelL);
            const backPanel = [...panelL.slice(JACKET_OPENING_L.length), ...mir(panelL.slice(JACKET_OPENING_L.length)).reverse()];
            const opening = scaleX(JACKET_OPENING_L, fitK);
            const line = (pts: number[][]) => 'M ' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ');
            const offset = (pts: number[][], d: number) => pts.map(([x, y]) => [x - d, y]);
            // placket motifs along the opening
            const motifs: number[][] = [];
            for (let i = 0; i < opening.length - 1; i++) {
              const [a, b] = [opening[i], opening[i + 1]];
              const steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
              for (let k = 0; k < steps; k++) {
                const f = (k + 0.5) / steps;
                motifs.push([a[0] + (b[0] - a[0]) * f - 3.2, a[1] + (b[1] - a[1]) * f]);
              }
            }
            const hemL = panelL.slice(JACKET_OPENING_L.length - 1, JACKET_OPENING_L.length + 3);
            const sleeves = [sleevePts('l'), sleevePts('r')].filter(Boolean) as number[][][];
            // cuff band on painted stretch-pose sleeves
            const cuffBand = (() => {
              const spec = PAINTED_SLEEVES[sleeveId];
              if (!painted || armPose !== 'stretched' || !spec) return null;
              const at = (sv: number, sd: 1 | -1) => {
                const a = armAt(sv);
                const e = spec.ease + spec.flare * Math.pow(Math.max(0, (sv - (spec.flareFrom ?? spec.len * 0.6)) / Math.max(1, spec.len - (spec.flareFrom ?? spec.len * 0.6))), 1.3);
                return [a.p[0] + sd * a.n[0] * (a.w + e), a.p[1] + sd * a.n[1] * (a.w + e)];
              };
              const l = [at(spec.len - 9, 1), at(spec.len, 1), at(spec.len, -1), at(spec.len - 9, -1)];
              return [l, mir(l)];
            })();
            // gold border along the hem of the painted flared sleeve
            const flaredHem =
              painted && armPose === 'stretched' && sleeveId === 'flared'
                ? (() => {
                    const h = PAINTED_FLARED_SLEEVE_L.filter(([x, y]) => y >= 274 && x <= 146);
                    return [h, mir(h)];
                  })()
                : null;
            return (
              <g id="jacket-set">
                {/* Choli hem band: gold-bordered embroidery strip */}
                {!isBack && (
                  <g id="choli-embroidered-band">
                    <path d={`M ${STAGE_CX - 39.8 * fitK} 247 Q ${STAGE_CX} 249 ${STAGE_CX + 39.8 * fitK} 247 L ${STAGE_CX + 40.1 * fitK} 259 Q ${STAGE_CX} 261 ${STAGE_CX - 40.1 * fitK} 259 Z`} fill="rgba(0,0,0,0.08)" />
                    <path d={`M ${STAGE_CX - 39.8 * fitK} 247.5 Q ${STAGE_CX} 249.5 ${STAGE_CX + 39.8 * fitK} 247.5`} fill="none" stroke={gold} strokeWidth="1.2" />
                    <path d={`M ${STAGE_CX - 40.1 * fitK} 258.2 Q ${STAGE_CX} 260.2 ${STAGE_CX + 40.1 * fitK} 258.2`} fill="none" stroke={gold} strokeWidth="1.2" />
                    {Array.from({ length: 11 }, (_, i) => {
                      const x = STAGE_CX + (i - 5) * 7 * fitK;
                      return (
                        <path
                          key={`band-motif-${i}`}
                          d={`M ${x} 250 L ${x + 2.6} 253.3 L ${x} 256.6 L ${x - 2.6} 253.3 Z`}
                          fill={i % 2 ? gold : cloth}
                          stroke={fabTheme.outlineColor}
                          strokeWidth="0.4"
                          strokeOpacity="0.6"
                        />
                      );
                    })}
                  </g>
                )}

                {/* Jacket sleeves over the choli sleeves */}
                {sleeves.map((pts, i) => (
                  <g key={`jacket-sleeve-${i}`}>
                    <path d={svgPath(pts)} fill={cloth} opacity="0.96" />
                    <path d={svgPath(pts)} fill="url(#jacket-fold-shade)" />
                    <path d={svgPath(pts)} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.8" opacity="0.45" strokeLinejoin="round" />
                  </g>
                ))}
                {flaredHem?.map((pts, i) => (
                  <g key={`jacket-flare-hem-${i}`}>
                    <path d={line(pts)} fill="none" stroke={gold} strokeWidth="2.6" strokeLinecap="round" />
                    <path d={line(pts.map(([x, y]) => [x + (i ? -1 : 1) * 2.2, y - 3.6]))} fill="none" stroke={gold} strokeWidth="0.8" strokeLinecap="round" />
                  </g>
                ))}
                {cuffBand?.map((pts, i) => (
                  <g key={`jacket-cuff-${i}`}>
                    <path d={svgPath(pts)} fill={gold} opacity="0.85" />
                    <path d={svgPath(pts)} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.5" opacity="0.5" />
                  </g>
                ))}

                {/* Jacket body: two open front panels, or the full back */}
                {(isBack ? [backPanel] : [panelL, panelR]).map((pts, i) => (
                  <g key={`jacket-panel-${i}`}>
                    <path d={svgPath(pts)} fill={cloth} opacity="0.97" />
                    <path d={svgPath(pts)} fill="url(#jacket-fold-shade)" />
                    <path d={svgPath(pts)} fill="none" stroke={fabTheme.outlineColor} strokeWidth="0.85" opacity="0.5" strokeLinejoin="round" />
                  </g>
                ))}

                {/* Gold zari placket along the front opening, with embroidered motifs */}
                {!isBack && [1, -1].map((sd) => {
                  const op = sd === 1 ? opening : mir(opening);
                  const ms = sd === 1 ? motifs : mir(motifs);
                  return (
                    <g key={`placket-${sd}`}>
                      <path d={line(op)} fill="none" stroke={gold} strokeWidth="1.4" strokeLinecap="round" />
                      <path d={line(offset(op, sd * 6.4))} fill="none" stroke={gold} strokeWidth="1.1" strokeLinecap="round" />
                      {ms.map(([x, y], k) => (
                        <circle key={`m-${k}`} cx={x} cy={y} r="1.5" fill={k % 2 ? gold : fabTheme.baseColor} stroke={fabTheme.outlineColor} strokeWidth="0.3" strokeOpacity="0.5" />
                      ))}
                    </g>
                  );
                })}

                {/* Gold hem border */}
                {[hemL.slice(isBack ? 1 : 0), mir(hemL.slice(isBack ? 1 : 0))].map((pts, i) => (
                  <g key={`jacket-hem-${i}`}>
                    <path d={line(pts)} fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
                    <path d={line(pts.map(([x, y]) => [x, y - 4]))} fill="none" stroke={gold} strokeWidth="0.8" strokeLinecap="round" />
                  </g>
                ))}
              </g>
            );
          })()}

          <AvatarRenderer viewMode={viewMode} layer="frontHair" />
          {/* Halter front: braided cords from the casing ends up round the neck, behind the long hair */}
          {painted && neckId === 'halter' && !isBack && bodiceSleeveId === 'sleeveless' && (
            <g id="halter-cords">
              <mask id="cord-under-hair" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
                <rect width={STAGE_W} height={STAGE_H} fill="#fff" />
                <image href="/assets/dori-face.png" x={192.9} y={30.6} width={120.5} height={275.9} preserveAspectRatio="none" style={{ filter: 'grayscale(1) contrast(4) brightness(1.15)' }} />
              </mask>
              <g mask="url(#cord-under-hair)" fill="none" strokeLinecap="round">
                {[1, -1].map((sd) => {
                  const X = (dx: number) => STAGE_CX + sd * dx * fitK;
                  // from the casing end, up the side of the neck, curving round behind it
                  const d = `M ${X(-20.2)} 142.6 C ${X(-17.6)} 138.4 ${X(-15.2)} 134 ${X(-13.4)} 129.4`;
                  return (
                    <g key={sd}>
                      {braidedCord(d, `cord-${sd}`, 1.7)}
                      {/* shadow where the cord passes behind the neck */}
                      <path d={`M ${X(-13.6)} 130 Q ${X(-11.4)} 128.4 ${X(-9.2)} 128.6`} stroke="rgba(120,80,60,0.3)" strokeWidth="1.4" />
                    </g>
                  );
                })}
              </g>
            </g>
          )}
          {/* Painted back of the head and the long hair, over the blouse */}
          {painted && isBack && paintedImage(PAINTED_BACK.head)}
          {/* Halter back: cords cross from the nape to the top of the lacing; the band laces up the
              centre and ties below the hem (cords stay behind the long hair) */}
          {painted && isBack && neckId === 'halter' && sleeveId === 'sleeveless' && topStyleId !== 'jacket' && (() => {
            const H = PAINTED_BACK.head;
            const { top, bottom, gap, loops } = HALTER_LACING;
            const xl = STAGE_CX - gap, xr = STAGE_CX + gap;
            const cord = (d: string, key: string, w = 1.4) => braidedCord(d, key, w);
            const ex = 2.6; // eyelets sit just inside each edge of the opening
            return (
              <g id="halter-back-lacing" fill="none" strokeLinecap="round">
                <mask id="back-cord-under-hair" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
                  <rect width={STAGE_W} height={STAGE_H} fill="#fff" />
                  <image href={H.href} x={H.x} y={H.y} width={H.w} height={H.h} preserveAspectRatio="none" style={{ filter: 'grayscale(1) contrast(4) brightness(1.15)' }} />
                </mask>
                {/* skin showing in the laced opening, with a soft shadow at the fabric edges */}
                <clipPath id="lacing-gap"><rect x={xl} y={top} width={xr - xl} height={bottom - top} /></clipPath>
                <g clipPath="url(#lacing-gap)">
                  {paintedImage(PV.skin)}
                  <rect x={xl} y={top} width={xr - xl} height={bottom - top} fill="url(#lacing-shade)" />
                </g>
                <path d={`M ${xl} ${top} L ${xl} ${bottom} M ${xr} ${top} L ${xr} ${bottom}`} stroke={fabTheme.outlineColor} strokeWidth="0.75" opacity="0.6" />
                {/* topstitched facing along both edges */}
                <path d={`M ${xl - 1.4} ${top + 1} L ${xl - 1.4} ${bottom - 1} M ${xr + 1.4} ${top + 1} L ${xr + 1.4} ${bottom - 1}`} stroke={fabTheme.outlineColor} strokeWidth="0.45" strokeDasharray="1.2 1" opacity="0.45" />
                {/* nothing of the cords shows outside the neck's edges above the shoulders */}
                <clipPath id="back-neck-cord-clip">
                  <path d={`M ${STAGE_CX - 15.3} 100 L ${STAGE_CX - 15.3} 131 L ${STAGE_CX - 40} 150 L ${STAGE_CX - 40} ${STAGE_H} L ${STAGE_CX + 40} ${STAGE_H} L ${STAGE_CX + 40} 150 L ${STAGE_CX + 15.3} 131 L ${STAGE_CX + 15.3} 100 Z`} />
                </clipPath>
                {/* crossed neck cords, from the nape to the top eyelets */}
                <g mask="url(#back-cord-under-hair)">
                  {/* each cord comes round the side of the neck from the front, then crosses down the back */}
                  {[1, -1].map((sd) => {
                    const X = (dx: number) => STAGE_CX + sd * dx;
                    const end = sd === 1 ? xr - ex : xl + ex;
                    return (
                      <g key={`neck-cord-${sd}`}>
                        {/* shade on the neck where the cord turns round it */}
                        <path d={`M ${X(-15.3)} 129.6 Q ${X(-14.9)} 131.8 ${X(-13.6)} 133.8`} stroke="rgba(110,70,55,0.28)" strokeWidth="2" strokeLinecap="round" />
                        {/* starts at the edge of the neck so its turn round to the front stays out of sight */}
                        <g clipPath="url(#back-neck-cord-clip)">
                          {cord(`M ${X(-15.4)} 130.4 C ${X(-12.4)} 131 ${X(-9)} 133.2 ${X(-6.4)} 137.4 C ${X(-3.4)} 143.6 ${X(-1)} 160 ${X(1.5)} 178 S ${end} ${loops[0] - 6} ${end} ${loops[0]}`, `x${sd}`)}
                        </g>
                      </g>
                    );
                  })}
                </g>
                {/* criss-cross lacing between the eyelets */}
                {loops.slice(0, -1).map((y, i) =>
                  cord(`M ${xl + ex} ${y} Q ${STAGE_CX} ${(y + loops[i + 1]) / 2 + 0.6} ${xr - ex} ${loops[i + 1]} M ${xr - ex} ${y} Q ${STAGE_CX} ${(y + loops[i + 1]) / 2 + 0.6} ${xl + ex} ${loops[i + 1]}`, `l${i}`)
                )}
                {/* metal eyelets */}
                {loops.map((y, i) => (
                  <g key={`eyelet-${i}`}>
                    {[xl + ex, xr - ex].map((x, j) => (
                      <g key={j}>
                        <circle cx={x} cy={y} r="1.35" fill="#e6cb86" stroke="#8a6a2f" strokeWidth="0.5" />
                        <circle cx={x} cy={y} r="0.55" fill="#5b4a2a" />
                      </g>
                    ))}
                  </g>
                ))}
                {/* bow at the bottom with two hanging ends tipped in gold */}
                {(() => {
                  const y = loops[loops.length - 1] + 2.5;
                  return (
                    <g>
                      {cord(`M ${STAGE_CX} ${y} C ${STAGE_CX - 7} ${y - 6} ${STAGE_CX - 9} ${y + 2} ${STAGE_CX} ${y}`, 'bow-l', 1.2)}
                      {cord(`M ${STAGE_CX} ${y} C ${STAGE_CX + 7} ${y - 6} ${STAGE_CX + 9} ${y + 2} ${STAGE_CX} ${y}`, 'bow-r', 1.2)}
                      {cord(`M ${STAGE_CX} ${y} C ${STAGE_CX - 3} ${y + 8} ${STAGE_CX - 5} ${y + 16} ${STAGE_CX - 4} ${y + 24}`, 'end-l', 1.2)}
                      {cord(`M ${STAGE_CX} ${y} C ${STAGE_CX + 3} ${y + 9} ${STAGE_CX + 4} ${y + 18} ${STAGE_CX + 3} ${y + 27}`, 'end-r', 1.2)}
                      <circle cx={STAGE_CX} cy={y} r="1.5" fill="#86a690" stroke={fabTheme.outlineColor} strokeWidth="0.4" />
                      <rect x={STAGE_CX - 5} y={y + 23} width="2" height="3.4" rx="0.8" fill="#c8a24f" />
                      <rect x={STAGE_CX + 2} y={y + 26} width="2" height="3.4" rx="0.8" fill="#c8a24f" />
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* Shirt Specific Linework: Collar & Placket Buttons */}
          {currentGarment === 'shirt' && !isBack && (
            <g id="shirt-details">
              <path
                d={svgPath(COLLAR[geo('collar', 'classic')] || COLLAR.classic)}
                fill="none"
                stroke={fabTheme.outlineColor}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <line x1={STAGE_CX} y1="170" x2={STAGE_CX} y2="420" stroke={fabTheme.outlineColor} strokeWidth="1.3" strokeDasharray="3 2" />
              {[200, 240, 280, 320, 360, 400].map((by) => (
                <circle key={by} cx={STAGE_CX} cy={by} r="2.8" fill="#ffffff" stroke={fabTheme.outlineColor} strokeWidth="1.1" />
              ))}
            </g>
          )}

          {/* Dupatta / Drape Textures & 2D Game Linework */}
          {painted && drapeId === 'oneShoulder' && (
            <g id="drape-painted" opacity={fade} clipPath="url(#dupatta-off-arm-clip)">
              {paintedImage(PV.dupattaOneShoulder)}
            </g>
          )}
          {!(painted && drapeId === 'oneShoulder') && pieces.map((pts, i) => (
            <g key={`drape-piece-${i}`} id={`drape-${i}`}>
              <clipPath id={`drape-clip-${i}`}>
                <path d={svgPath(pts)} />
              </clipPath>
              {/* Sheer dupatta fabric: the lehenga shows softly through */}
              <path
                d={svgPath(pts)}
                fill={currentGarment === 'shirt' ? fab.c : fabTheme.drapeColor}
                opacity={fabTheme.drapeOpacity * 0.86 * fade}
              />
              <g clipPath={`url(#drape-clip-${i})`}>
                {fabId === 'net' && <rect width={STAGE_W} height={STAGE_H} fill="url(#net-mesh)" />}
                {fabId === 'banarasi' && <rect width={STAGE_W} height={STAGE_H} fill="url(#banarasi-butis)" />}
                {fabId === 'velvet' && (
                  <rect width={STAGE_W} height={STAGE_H} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                )}
                {fabId === 'organza' && <rect width={STAGE_W} height={STAGE_H} fill="rgba(255,255,255,0.15)" />}
              </g>
              {/* Longitudinal Drape Pleat Lines */}
              {drapePleatLines(pts).map((plD, pIdx) => (
                <path
                  key={`dr-pleat-${pIdx}`}
                  d={plD}
                  fill="none"
                  stroke={fabTheme.outlineColor}
                  strokeWidth="1.1"
                  opacity="0.7"
                  strokeLinecap="round"
                />
              ))}
              {/* Drape Thin Black Outline */}
              <path 
                d={svgPath(pts)}
                fill="none"
                stroke={fabTheme.outlineColor}
                strokeWidth="1.45"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Inset Kinari / Zari Border Piping */}
              <path 
                d={svgPath(pts)}
                fill="none"
                stroke={fabTheme.accentColor}
                strokeWidth="2.2"
                strokeDasharray={fabId === 'banarasi' ? '3 2' : undefined}
                opacity="0.9"
              />
            </g>
          ))}
        </svg>

        {/* Back View Seams & Closures (a corset laces up instead) */}
        {isBack && !painted && topStyleId !== 'corset' && topStyleId !== 'jacket' && (
          <>
            {/* Center back seam */}
            <div
              className="absolute left-[229px] top-[160px] w-0 border-l-[1.5px] border-[#2b2724]/30"
              style={{ height: `${hemBack - 168}px` }}
            />
            {/* Fabric button closures */}
            {[0, 1, 2, 3, 4]
              .map((i) => {
                const y = 188 + i * Math.max(26, (hemBack - 210) / 5);
                return y < hemBack - 24 ? y : null;
              })
              .filter(Boolean)
              .map((y, idx) => (
                <div
                  key={idx}
                  className="absolute left-[224px] w-[11px] h-[11px] rounded-full bg-[#f7f4ef] border border-[#2b2724]/40 shadow-xs"
                  style={{ top: `${y}px` }}
                />
              ))}
          </>
        )}
      </div>

      {/* Top Controls Header (View Mode, Arm Pose Switcher, and Latkan Horizontal Box inside phone stage) */}
      <div className="absolute top-2 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 z-20 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {/* View Switcher Controls (Front | Detail | Back) */}
          <div className="flex rounded-lg overflow-hidden border border-[#3c342c]/20 bg-[#f7f4ef]/90 backdrop-blur-md shadow-xs">
            {(['front', 'detail', 'back'] as ViewMode[]).map((mode) => {
              const isCurrent = viewMode === mode;
              return (
                <button
                  key={mode}
                  id={`stage-view-btn-${mode}`}
                  onClick={() => onSetViewMode(mode)}
                  className={`px-2 py-1 text-[9.5px] uppercase tracking-[0.12em] font-sans transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#174d33] text-[#f7f4ef] font-semibold'
                      : 'text-[#5a534c] hover:bg-black/5'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Arm Pose Switcher (Resting | Stretched with Gravity Drape) */}
          <div className="flex rounded-lg overflow-hidden border border-[#3c342c]/20 bg-[#f7f4ef]/90 backdrop-blur-md shadow-xs">
            <button
              id="stage-pose-btn-resting"
              onClick={() => setArmPose('resting')}
              title="Resting arms along torso"
              className={`px-2 py-1 text-[9.5px] uppercase tracking-wider font-sans transition-all cursor-pointer flex items-center gap-1 ${
                armPose === 'resting'
                  ? 'bg-[#174d33] text-[#f7f4ef] font-semibold'
                  : 'text-[#5a534c] hover:bg-black/5'
              }`}
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v3" />
                <path d="M8 10v10" />
                <path d="M16 10v10" />
              </svg>
              <span>Rest</span>
            </button>
            <button
              id="stage-pose-btn-stretched"
              onClick={() => setArmPose('stretched')}
              title="Stretch arms sideways to view sleeve gravity drop"
              className={`px-2 py-1 text-[9.5px] uppercase tracking-wider font-sans transition-all cursor-pointer flex items-center gap-1 ${
                armPose === 'stretched'
                  ? 'bg-[#174d33] text-[#f7f4ef] font-semibold'
                  : 'text-[#5a534c] hover:bg-black/5'
              }`}
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h16" />
                <path d="M12 4v8" />
              </svg>
              <span>Stretch</span>
            </button>
          </div>

          {/* Floating Horizontal Box Specifically for Latkan */}
          {latkanBoxOrientation === 'horizontal' ? (
            <div
              id="stage-latkan-horizontal-box"
              className="flex items-center rounded-lg overflow-hidden border border-[#3c342c]/20 bg-[#f7f4ef]/90 backdrop-blur-md shadow-xs animate-fade"
            >
              <div
                title="Belt & Latkan Customization (Horizontal Box)"
                className="flex items-center gap-1 px-1.5 py-1 text-[9px] uppercase tracking-wider font-semibold text-[#174d33] border-r border-[#3c342c]/15 bg-[#174d33]/5"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#b68235]" />
                <span className="hidden xs:inline">Belt</span>
                <span>Latkan</span>
              </div>
              {(['none', 'light', 'heavy'] as BeltLatkanMode[]).map((mode) => {
                const isCurrent = beltLatkan === mode;
                return (
                  <button
                    key={mode}
                    id={`stage-latkan-btn-${mode}`}
                    onClick={() => setBeltLatkan(mode)}
                    title={`Belt (Latkan): ${mode === 'none' ? 'No Belt' : `${mode} size`}`}
                    className={`px-1.5 py-1 text-[9px] uppercase tracking-wider font-sans transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#174d33] text-[#f7f4ef] font-semibold'
                        : 'text-[#5a534c] hover:bg-black/5'
                    }`}
                  >
                    {mode === 'none' ? 'None' : mode}
                  </button>
                );
              })}
              <button
                id="stage-latkan-switch-to-vertical"
                onClick={() => setLatkanBoxOrientation('vertical')}
                title="Switch Latkan to Vertical Floating Box"
                className="px-1 py-1 text-[#5a534c] hover:bg-black/5 hover:text-[#174d33] border-l border-[#3c342c]/15 transition-colors"
              >
                <ArrowUpDown className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            /* Compact Header Badge when Vertical Box is Active */
            <button
              id="stage-latkan-vert-indicator"
              onClick={() => setLatkanBoxOrientation('horizontal')}
              title="Latkan is currently in the floating vertical box on the right. Click to switch to horizontal box."
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#3c342c]/20 bg-[#f7f4ef]/90 backdrop-blur-md shadow-xs pointer-events-auto text-[9px] font-semibold text-[#174d33] hover:bg-black/5 transition-all"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#b68235]" />
              <span>Latkan: <span className="capitalize">{beltLatkan}</span></span>
              <ArrowLeftRight className="w-2.5 h-2.5 text-[#5a534c]" />
            </button>
          )}
        </div>

        {/* Rendering Feedback */}
        {loadingSlot && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#3c342c]/20 bg-[#f7f4ef]/95 font-mono text-[9px] uppercase tracking-wider text-[#5a534c] shadow-xs pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b68235] animate-ping" />
            <span>{loadingSlot}</span>
          </div>
        )}
      </div>

      {/* Floating Vertical Box specifically for Latkan (just like the floating vertical category rail) */}
      {latkanBoxOrientation === 'vertical' && (
        <aside
          id="floating-latkan-vertical-box"
          aria-label="Floating Latkan Vertical Box"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 p-1.5 rounded-[22px] bg-[#eae9e9]/88 backdrop-blur-md border border-[#3c342c]/18 shadow-md z-30 pointer-events-auto select-none animate-fade"
        >
          {/* Box Header Label */}
          <div className="flex flex-col items-center gap-0.5 pb-1 border-b border-[#3c342c]/15 w-full text-center">
            <Sparkles className="w-3.5 h-3.5 text-[#b68235]" />
            <span className="text-[7.5px] uppercase tracking-wider font-bold text-[#174d33] leading-none">
              Latkan
            </span>
          </div>

          {/* 3 Size/Option Buttons: None, Light, Heavy */}
          {(['none', 'light', 'heavy'] as BeltLatkanMode[]).map((mode) => {
            const isCurrent = beltLatkan === mode;
            return (
              <button
                key={mode}
                id={`stage-latkan-vert-btn-${mode}`}
                onClick={() => setBeltLatkan(mode)}
                title={`Belt & Latkan: ${mode === 'none' ? 'No Belt / Clean' : `${mode} size`}`}
                className={`w-[48px] py-1.5 px-1 text-[9px] uppercase tracking-wider font-sans rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                  isCurrent
                    ? 'bg-[#174d33] text-[#f7f4ef] font-semibold shadow-xs ring-1 ring-[#174d33]/20'
                    : 'text-[#5a534c] hover:bg-black/5 hover:text-[#2b2724]'
                }`}
              >
                <span>{mode === 'none' ? 'None' : mode}</span>
                <span className="text-[7px] font-mono opacity-70">
                  {mode === 'none' ? 'off' : mode === 'light' ? 'dainty' : 'bridal'}
                </span>
              </button>
            );
          })}

          {/* Switch back to Horizontal Box button */}
          <button
            id="stage-latkan-switch-to-horizontal"
            onClick={() => setLatkanBoxOrientation('horizontal')}
            title="Switch Latkan to Horizontal Top Box"
            className="w-[48px] py-1 flex items-center justify-center gap-0.5 text-[#5a534c] hover:bg-black/5 hover:text-[#174d33] rounded-lg border-t border-[#3c342c]/12 mt-0.5 transition-colors text-[8px]"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Horiz</span>
          </button>
        </aside>
      )}

    </div>
  );
};
