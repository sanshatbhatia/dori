/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Place an Order, steps 1–6: fabric type, fabric quantity, occasion, style family, garment, and how
// to define the design (Design Studio or a reference image).

import React, { useState } from 'react';
import { Image as ImageIcon, Info, Layers, Palette, RotateCcw, Ruler, Scissors, Sparkles, SquareDashed } from 'lucide-react';
import {
  FABRIC_TYPES,
  GARMENT_CATALOGUE,
  OCCASIONS,
  SIZES,
  STYLE_FAMILIES,
  garmentById,
  garmentName,
  type GarmentDef,
} from '../data/catalog';
import type { FabricType } from '../services/types';
import { useNav } from '../nav';
import { useDraft, type OrderDraft } from '../state/orderDraft';
import { useCustomer } from '../state/session';
import { GarmentArt } from '../ui/Silhouette';
import { Button, Chip, Choice, ConfirmDialog, Field, Input, Note, Screen } from '../ui/kit';
import { SizeGuideSheet } from './Personalize';

export const ORDER_STEPS = ['Fabric', 'Fabric size', 'Occasion', 'Style', 'Garment', 'Design'];

const FabricGlyph: React.FC<{ type: FabricType }> = ({ type }) =>
  type === 'half_stitched' ? <Scissors className="w-6 h-6" /> : type === 'semi_stitched' ? <Layers className="w-6 h-6" /> : <SquareDashed className="w-6 h-6" />;

export const fabricLengthError = (d: OrderDraft) => {
  const v = Number(d.fabricLength);
  if (!d.fabricLength) return 'Enter how much fabric you have.';
  if (!isFinite(v) || v <= 0) return 'Enter a number greater than 0.';
  if (v > 50) return 'That seems too long — check the unit.';
  if (d.fabricWidth && (!isFinite(Number(d.fabricWidth)) || Number(d.fabricWidth) <= 0)) return 'Width must be a positive number.';
  return '';
};

/** first step that still needs an answer (used to resume an order) */
export const firstIncompleteStep = (d: OrderDraft) => {
  if (!d.fabricType) return 1;
  if (fabricLengthError(d)) return 2;
  if (!d.occasion) return 3;
  if (!d.family) return 4;
  if (!d.garmentId) return 5;
  return 6;
};

export const OrderStepScreen: React.FC<{ step: number }> = ({ step }) => {
  const nav = useNav();
  const customer = useCustomer();
  const { draft, update, resetDraft } = useDraft();
  const [touched, setTouched] = useState(false);
  const [guide, setGuide] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const goStep = (s: number) => nav.go({ name: 'order', step: s });
  const garment = garmentById(draft.garmentId);
  const exit = () => nav.backTo('home', { name: 'home' });

  // ---- step 0: resume or start again ----
  if (step === 0) {
    const next = firstIncompleteStep(draft);
    return (
      <Screen title="Your order in progress" onBack={exit} subtitle="Pick up where you left off, or start a new order.">
        <div className="pt-4">
          <SummaryLine label="Fabric" value={FABRIC_TYPES.find((f) => f.id === draft.fabricType)?.label} />
          <SummaryLine label="Quantity" value={draft.fabricLength ? `${draft.fabricLength} ${draft.fabricUnit}` : undefined} />
          <SummaryLine label="Occasion" value={OCCASIONS.find((o) => o.id === draft.occasion)?.label} />
          <SummaryLine label="Style" value={STYLE_FAMILIES.find((s) => s.id === draft.family)?.label} />
          <SummaryLine label="Garment" value={garmentName(garment)} />
          <SummaryLine label="Design" value={draft.method === 'studio' ? (draft.studio ? 'Designed in the Studio' : 'Studio — not started') : draft.method === 'reference' ? `${draft.references.length} reference image(s)` : undefined} />
          <div className="flex flex-col gap-2 mt-6">
            <Button block id="resume-continue" onClick={() => nav.replace(next === 6 && (draft.studio || draft.references.length) ? { name: 'design-summary' } : { name: 'order', step: next })}>
              Continue
            </Button>
            <Button variant="secondary" block id="resume-new" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="w-4 h-4" /> Start a new order
            </Button>
          </div>
          <p className="text-[12px] text-black/50 mt-4 leading-relaxed">
            Starting over clears this order. Designs you saved stay in Saved Designs.
          </p>
        </div>
        <ConfirmDialog
          open={confirmReset}
          title="Start a new order?"
          body="Your current answers will be cleared. Saved designs are not affected."
          confirmLabel="Start new"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetDraft();
            nav.replace({ name: 'order', step: 1 });
          }}
        />
      </Screen>
    );
  }

  const common = {
    onBack: step === 1 ? exit : nav.back,
    progress: { step, total: ORDER_STEPS.length, label: ORDER_STEPS[step - 1] },
  };

  // ---- step 1: fabric type ----
  if (step === 1) {
    return (
      <Screen
        {...common}
        title="What type of fabric do you have?"
        footer={
          <Button block id="order-continue" disabled={!draft.fabricType} onClick={() => goStep(2)}>
            Continue
          </Button>
        }
      >
        <div className="pt-4">
          {FABRIC_TYPES.map((f) => (
            <Choice
              key={f.id}
              id={`fabric-${f.id}`}
              selected={draft.fabricType === f.id}
              onClick={() => update({ fabricType: f.id })}
              title={f.label}
              description={f.description}
              art={<FabricGlyph type={f.id} />}
            />
          ))}
          <Note icon={<Info className="w-4 h-4" />}>Not sure? Choose the closest — your stylist checks the fabric during the consultation.</Note>
        </div>
      </Screen>
    );
  }

  // ---- step 2: fabric size ----
  if (step === 2) {
    const err = fabricLengthError(draft);
    return (
      <Screen
        {...common}
        title="How much fabric do you have?"
        footer={
          <Button block id="order-continue" onClick={() => (setTouched(true), !err && goStep(3))}>
            Continue
          </Button>
        }
      >
        <div className="pt-4">
          <Field label="Length" error={touched ? err : ''}>
            <div className="flex gap-2">
              <Input
                id="fabric-length"
                inputMode="decimal"
                placeholder="e.g. 4.5"
                value={draft.fabricLength}
                onChange={(e) => update({ fabricLength: e.target.value.replace(/[^\d.]/g, '') })}
                invalid={touched && !!err}
              />
              <div className="flex gap-1.5">
                <Chip selected={draft.fabricUnit === 'm'} onClick={() => update({ fabricUnit: 'm' })}>
                  Metres
                </Chip>
                <Chip selected={draft.fabricUnit === 'yd'} onClick={() => update({ fabricUnit: 'yd' })}>
                  Yards
                </Chip>
              </div>
            </div>
          </Field>
          <Field label="Width" optional hint="Helps the stylist plan the cut, especially for wide skirts and dupattas.">
            <div className="flex gap-2">
              <Input inputMode="decimal" placeholder="e.g. 44" value={draft.fabricWidth} onChange={(e) => update({ fabricWidth: e.target.value.replace(/[^\d.]/g, '') })} />
              <div className="flex gap-1.5">
                <Chip selected={draft.fabricWidthUnit === 'in'} onClick={() => update({ fabricWidthUnit: 'in' })}>
                  Inches
                </Chip>
                <Chip selected={draft.fabricWidthUnit === 'cm'} onClick={() => update({ fabricWidthUnit: 'cm' })}>
                  cm
                </Chip>
              </div>
            </div>
          </Field>
          <Note icon={<Ruler className="w-4 h-4" />}>
            Whether an outfit can be made depends on the garment, the fabric you have and the parts it needs. Your stylist confirms this — we
            can’t promise it from the length alone.
          </Note>
        </div>
      </Screen>
    );
  }

  // ---- step 3: occasion ----
  if (step === 3) {
    return (
      <Screen
        {...common}
        title="What is this outfit for?"
        footer={
          <Button block id="order-continue" disabled={!draft.occasion} onClick={() => goStep(4)}>
            Continue
          </Button>
        }
      >
        <div className="pt-4">
          {OCCASIONS.map((o) => (
            <Choice key={o.id} id={`occasion-${o.id}`} selected={draft.occasion === o.id} onClick={() => update({ occasion: o.id })} title={o.label} description={o.description} />
          ))}
        </div>
      </Screen>
    );
  }

  // ---- step 4: style family ----
  if (step === 4) {
    return (
      <Screen
        {...common}
        title="Choose a style"
        footer={
          <Button block id="order-continue" disabled={!draft.family} onClick={() => goStep(5)}>
            Continue
          </Button>
        }
      >
        <div className="pt-4">
          {STYLE_FAMILIES.map((f) => (
            <Choice
              key={f.id}
              id={`family-${f.id}`}
              selected={draft.family === f.id}
              onClick={() => update({ family: f.id, ...(garment && garment.family !== f.id ? { garmentId: undefined, studio: undefined, method: undefined } : {}) })}
              title={f.label}
              description={f.description}
              art={<GarmentArt silhouette={f.id === 'indian' ? 'lehenga' : f.id === 'western' ? 'dress' : 'gown'} className="w-10 h-12" />}
            />
          ))}
        </div>
      </Screen>
    );
  }

  // ---- step 5: garment ----
  if (step === 5) {
    const items = GARMENT_CATALOGUE.filter((g) => g.family === draft.family);
    return (
      <Screen
        {...common}
        title="Choose the garment"
        subtitle={STYLE_FAMILIES.find((f) => f.id === draft.family)?.label}
        footer={
          <Button block id="order-continue" disabled={!garment} onClick={() => goStep(6)}>
            Continue
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-2.5 pt-4">
          {items.map((g) => (
            <GarmentCard
              key={g.id}
              g={g}
              selected={draft.garmentId === g.id}
              onClick={() =>
                update({
                  garmentId: g.id,
                  size: (g.sizeKey && customer.fitProfile.garmentSizes[g.sizeKey]) || customer.fitProfile.usualSize,
                  ...(g.id !== draft.garmentId ? { studio: undefined, previewDataUrl: undefined, method: g.studio ? draft.method : draft.method === 'studio' ? undefined : draft.method } : {}),
                })
              }
            />
          ))}
        </div>
        <p className="text-[12px] text-black/50 mt-4 leading-relaxed">
          Every garment is reviewed for feasibility with your stylist before anything is confirmed for production.
        </p>
      </Screen>
    );
  }

  // ---- step 6: design method ----
  const studioOk = !!garment?.studio;
  return (
    <Screen
      {...common}
      title="How would you like to define your outfit?"
      subtitle={garmentName(garment)}
      footer={
        <Button
          block
          id="order-continue"
          disabled={!draft.method || (draft.method === 'studio' && !studioOk)}
          onClick={() => nav.go(draft.method === 'studio' ? { name: 'studio' } : { name: 'reference' })}
        >
          {draft.method === 'studio' ? 'Open Design Studio' : draft.method === 'reference' ? 'Add reference images' : 'Continue'}
        </Button>
      }
    >
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold">Size for this garment</span>
          <button className="text-[13px] font-semibold text-[#174D33]" onClick={() => setGuide(true)}>
            Size guide
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto mb-1">
          {SIZES.map((s) => (
            <Chip key={s.id} id={`order-size-${s.id}`} selected={draft.size === s.id} onClick={() => update({ size: s.id })}>
              {s.label}
            </Chip>
          ))}
        </div>
        <p className="text-[12px] text-black/50 mb-5">From your profile — change it if this garment fits you differently. Your stylist verifies measurements.</p>

        <Choice
          id="method-studio"
          selected={draft.method === 'studio'}
          onClick={() => update({ method: 'studio' })}
          title="Design it yourself"
          description={studioOk ? 'Open the Dori Design Studio with your garment, size and occasion already set.' : 'The Studio doesn’t support this garment yet — upload a reference instead.'}
          art={<Palette className="w-6 h-6" />}
          disabled={!studioOk}
          badge={studioOk ? undefined : 'Coming soon'}
        />
        <Choice
          id="method-reference"
          selected={draft.method === 'reference'}
          onClick={() => update({ method: 'reference' })}
          title="Upload a reference image"
          description="Share photos of an outfit you love and tell us what to change."
          art={<ImageIcon className="w-6 h-6" />}
        />
        <Note icon={<Sparkles className="w-4 h-4" />}>Both routes lead to the same review and stylist consultation — nothing goes to production without it.</Note>
      </div>
      <SizeGuideSheet open={guide} onClose={() => setGuide(false)} />
    </Screen>
  );
};

const GarmentCard: React.FC<{ g: GarmentDef; selected: boolean; onClick: () => void }> = ({ g, selected, onClick }) => (
  <button
    id={`garment-${g.id}`}
    onClick={onClick}
    aria-pressed={selected}
    className={`text-left p-3 rounded-[20px] border transition flex flex-col ${selected ? 'border-[#174D33] ring-1 ring-[#174D33] bg-[#174D33]/[0.04]' : 'border-black/10 hover:border-black/25'}`}
  >
    <span className="h-24 rounded-2xl bg-[#174D33]/[0.04] flex items-center justify-center mb-2">
      <GarmentArt silhouette={g.silhouette} className="h-20" />
    </span>
    <span className="text-[13.5px] font-semibold leading-tight">{g.label}</span>
    <span className="flex flex-wrap gap-1 mt-1.5">
      {g.lining && (
        <span className="text-[10.5px] px-2 py-0.5 rounded-full border border-black/15 text-black/70">{g.lining === 'lined' ? 'With lining' : 'Without lining'}</span>
      )}
      {g.studio && <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#174D33] text-white">Design Studio</span>}
    </span>
  </button>
);

const SummaryLine: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-black/[0.06] text-[14px]">
    <span className="text-black/55">{label}</span>
    <span className={value ? 'font-medium text-right' : 'text-black/35'}>{value || 'Not set'}</span>
  </div>
);

