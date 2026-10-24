/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Personalization & fit profile. Height, usual and per-garment sizes, an optional body-type
// discovery, and the (stylist-verified) measurement profile.

import React, { useState } from 'react';
import { Info, Lock, Ruler, Sparkles } from 'lucide-react';
import { BODY_TYPES, SIZES, SIZE_GUIDE } from '../data/catalog';
import { api } from '../services';
import type { BodyType, FitProfile, SizeCode } from '../services/types';
import { useSession, useCustomer } from '../state/session';
import { useNav } from '../nav';
import { AddressForm, emptyAddress, validateAddress, type AddressInput } from '../ui/AddressForm';
import { BodyShape } from '../ui/Silhouette';
import { Button, Chip, Choice, ErrorBanner, Field, Input, Note, Screen, SectionTitle, Sheet, formatDate, useToast } from '../ui/kit';

// ---- shared pickers -------------------------------------------------------------------------

export const cmToFtIn = (cm: number) => {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), inch: Math.round(totalIn % 12) };
};

export const HeightPicker: React.FC<{ profile: FitProfile; onChange: (p: Partial<FitProfile>) => void; error?: string }> = ({ profile, onChange, error }) => {
  const unit = profile.heightUnit;
  const { ft, inch } = profile.heightCm ? cmToFtIn(profile.heightCm) : { ft: 0, inch: 0 };
  return (
    <Field label="Height" error={error} hint="Used to proportion your Studio previews and guide lengths.">
      <div className="flex gap-2 mb-2">
        <Chip selected={unit === 'cm'} onClick={() => onChange({ heightUnit: 'cm' })}>
          Centimetres
        </Chip>
        <Chip selected={unit === 'ftin'} onClick={() => onChange({ heightUnit: 'ftin' })}>
          Feet & inches
        </Chip>
      </div>
      {unit === 'cm' ? (
        <div className="flex items-center gap-2">
          <Input
            id="height-cm"
            inputMode="numeric"
            placeholder="e.g. 162"
            value={profile.heightCm ? String(profile.heightCm) : ''}
            onChange={(e) => onChange({ heightCm: Number(e.target.value.replace(/\D/g, '')) || undefined })}
            invalid={!!error}
          />
          <span className="text-[14px] text-black/60">cm</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="5"
            value={profile.heightCm ? String(ft) : ''}
            onChange={(e) => {
              const f = Number(e.target.value.replace(/\D/g, '')) || 0;
              onChange({ heightCm: Math.round((f * 12 + inch) * 2.54) || undefined });
            }}
          />
          <span className="text-[14px] text-black/60">ft</span>
          <Input
            inputMode="numeric"
            placeholder="4"
            value={profile.heightCm ? String(inch) : ''}
            onChange={(e) => {
              const i = Math.min(11, Number(e.target.value.replace(/\D/g, '')) || 0);
              onChange({ heightCm: Math.round((ft * 12 + i) * 2.54) || undefined });
            }}
          />
          <span className="text-[14px] text-black/60">in</span>
        </div>
      )}
    </Field>
  );
};

export const validHeight = (cm?: number) => !cm || (cm >= 120 && cm <= 215);

const GARMENT_SIZE_KEYS: { key: keyof FitProfile['garmentSizes']; label: string }[] = [
  { key: 'blouse', label: 'Blouses & tops' },
  { key: 'kurti', label: 'Kurtis & suits' },
  { key: 'lehenga', label: 'Lehengas & skirts' },
  { key: 'trousers', label: 'Trousers' },
  { key: 'dress', label: 'Dresses' },
];

export const SizePicker: React.FC<{ profile: FitProfile; onChange: (p: Partial<FitProfile>) => void }> = ({ profile, onChange }) => {
  const [guide, setGuide] = useState(false);
  const [perGarment, setPerGarment] = useState(Object.keys(profile.garmentSizes).length > 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold">Usual clothing size</span>
        <button className="text-[13px] font-semibold text-[#174D33] flex items-center gap-1" onClick={() => setGuide(true)} id="size-guide-btn">
          <Ruler className="w-3.5 h-3.5" /> Size guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SIZES.map((s) => (
          <Chip key={s.id} id={`size-${s.id}`} selected={profile.usualSize === s.id} onClick={() => onChange({ usualSize: s.id })}>
            {s.label}
          </Chip>
        ))}
      </div>
      <Note icon={<Info className="w-4 h-4" />}>
        Sizes vary by garment and cut — your XL in a kurti may not be your XL in a blouse. Set different sizes per garment if that’s true for you.
      </Note>
      <button className="text-[13px] font-semibold text-[#174D33] mb-3" onClick={() => setPerGarment(!perGarment)}>
        {perGarment ? 'Hide' : 'Set'} sizes per garment
      </button>
      {perGarment &&
        GARMENT_SIZE_KEYS.map(({ key, label }) => (
          <div key={key} className="mb-3">
            <div className="text-[12.5px] text-black/60 mb-1.5">{label}</div>
            <div className="flex gap-1.5 overflow-x-auto">
              {SIZES.filter((s) => s.id !== 'custom').map((s) => (
                <Chip
                  key={s.id}
                  selected={profile.garmentSizes[key] === s.id}
                  onClick={() => onChange({ garmentSizes: { ...profile.garmentSizes, [key]: profile.garmentSizes[key] === s.id ? undefined : s.id } })}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      <SizeGuideSheet open={guide} onClose={() => setGuide(false)} />
    </div>
  );
};

export const SizeGuideSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onClose={onClose} title="Size guide">
    <p className="text-[13px] text-black/60 leading-relaxed mb-3">
      A general guide to body measurements (inches) for each size. <b>It is an estimate, not a guarantee of fit</b> — every garment and cut
      fits differently, and your stylist confirms your measurements before anything is made.
    </p>
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr className="text-left text-black/50">
          <th className="py-2 font-medium">Size</th>
          <th className="py-2 font-medium">Bust</th>
          <th className="py-2 font-medium">Waist</th>
          <th className="py-2 font-medium">Hip</th>
        </tr>
      </thead>
      <tbody>
        {SIZE_GUIDE.map((r) => (
          <tr key={r.size} className="border-t border-black/[0.07]">
            <td className="py-2.5 font-semibold">{r.size}</td>
            <td>{r.bust}</td>
            <td>{r.waist}</td>
            <td>{r.hip}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Sheet>
);

export const BodyTypePicker: React.FC<{ value?: BodyType; onChange: (b: BodyType) => void }> = ({ value, onChange }) => {
  const [discover, setDiscover] = useState(false);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {BODY_TYPES.filter((b) => b.id !== 'unsure').map((b) => (
          <button
            key={b.id}
            id={`body-${b.id}`}
            onClick={() => onChange(b.id)}
            aria-pressed={value === b.id}
            className={`text-left p-3 rounded-[20px] border transition ${value === b.id ? 'border-[#174D33] ring-1 ring-[#174D33] bg-[#174D33]/[0.04]' : 'border-black/10'}`}
          >
            <BodyShape type={b.id} className="w-12 h-14 mb-1" />
            <div className="text-[14.5px] font-semibold">{b.label}</div>
            <div className="text-[11.5px] text-black/55 leading-snug mt-0.5">{b.description}</div>
          </button>
        ))}
      </div>
      <Choice
        id="body-unsure"
        selected={value === 'unsure'}
        onClick={() => onChange('unsure')}
        title="Unsure / none of these"
        description="That’s fine — your stylist will guide you."
        art={<BodyShape type="unsure" className="w-10 h-12" />}
      />
      <Button variant="secondary" block id="body-discover" onClick={() => setDiscover(true)}>
        <Sparkles className="w-4 h-4" /> Help me discover
      </Button>
      {value && value !== 'unsure' && (
        <Note>
          <b>Styling idea:</b> {BODY_TYPES.find((b) => b.id === value)?.tip} This only shapes suggestions — you can order any garment.
        </Note>
      )}
      <DiscoverySheet open={discover} onClose={() => setDiscover(false)} onPick={(b) => (onChange(b), setDiscover(false))} />
    </div>
  );
};

const QUESTIONS: { q: string; options: { label: string; score: Partial<Record<BodyType, number>> }[] }[] = [
  {
    q: 'Compared with your hips, your shoulders are…',
    options: [
      { label: 'Wider', score: { apple: 2 } },
      { label: 'About the same', score: { hourglass: 1, rectangle: 2 } },
      { label: 'Narrower', score: { pear: 2 } },
    ],
  },
  {
    q: 'Your waist is…',
    options: [
      { label: 'Clearly defined', score: { hourglass: 2, pear: 1 } },
      { label: 'Slightly defined', score: { rectangle: 1, pear: 1 } },
      { label: 'Not very defined', score: { apple: 2, rectangle: 1 } },
    ],
  },
  {
    q: 'You tend to carry weight…',
    options: [
      { label: 'Around the middle', score: { apple: 2 } },
      { label: 'Around hips and thighs', score: { pear: 2 } },
      { label: 'Evenly', score: { hourglass: 1, rectangle: 1 } },
    ],
  },
];

const DiscoverySheet: React.FC<{ open: boolean; onClose: () => void; onPick: (b: BodyType) => void }> = ({ open, onClose, onPick }) => {
  const [answers, setAnswers] = useState<number[]>([]);
  const done = answers.length === QUESTIONS.length;
  const scores: Record<string, number> = {};
  answers.forEach((a, i) => Object.entries(QUESTIONS[i].options[a].score).forEach(([k, v]) => (scores[k] = (scores[k] || 0) + (v || 0))));
  const best = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'rectangle') as BodyType;
  const bt = BODY_TYPES.find((b) => b.id === best)!;
  return (
    <Sheet
      open={open}
      onClose={() => (setAnswers([]), onClose())}
      title="Discover your shape"
      footer={
        done && (
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setAnswers([])}>
              Start again
            </Button>
            <Button block id="discover-use" onClick={() => (onPick(best), setAnswers([]))}>
              Use {bt.label}
            </Button>
          </div>
        )
      }
    >
      {!done ? (
        <div>
          <p className="text-[12px] uppercase tracking-wider text-black/45 mb-2">
            Question {answers.length + 1} of {QUESTIONS.length}
          </p>
          <p className="font-serif text-[20px] mb-4">{QUESTIONS[answers.length].q}</p>
          {QUESTIONS[answers.length].options.map((o, i) => (
            <Choice key={o.label} selected={false} title={o.label} onClick={() => setAnswers([...answers, i])} id={`discover-q${answers.length}-${i}`} />
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <BodyShape type={best} className="w-24 h-28 mx-auto" />
          <p className="font-serif text-[24px] mt-2">You might feel at home with {bt.label}</p>
          <p className="text-[13px] text-black/60 mt-1 leading-relaxed">{bt.description}</p>
          <p className="text-[12.5px] text-black/50 mt-3 leading-relaxed">
            This is only a suggestion. Choose whichever description feels right — or none at all.
          </p>
        </div>
      )}
    </Sheet>
  );
};

export const MeasurementsView: React.FC<{ profile: FitProfile }> = ({ profile }) => {
  const m = profile.measurements;
  return (
    <div>
      <Note icon={<Lock className="w-4 h-4" />}>
        Measurements are taken or verified by your stylist and can only be changed by them. A standard size is not a substitute for a measurement
        profile — your stylist checks or retakes measurements for each order.
      </Note>
      {m ? (
        <div className="rounded-[20px] border border-black/10 p-4">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[14px]">
            {(
              [
                ['Bust', m.bust],
                ['Waist', m.waist],
                ['Hip', m.hip],
                ['Shoulder', m.shoulder],
                ['Arm length', m.armLength],
                ['Blouse length', m.blouseLength],
                ['Skirt length', m.skirtLength],
              ] as const
            )
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => (
                <div key={k}>
                  <div className="text-[11.5px] text-black/50">{k}</div>
                  <div className="font-semibold">
                    {v} {m.unit}
                  </div>
                </div>
              ))}
          </div>
          <p className="text-[12px] text-black/50 mt-3">
            Recorded by {m.recordedBy?.name} · {formatDate(m.verifiedAt)}
          </p>
        </div>
      ) : (
        <p className="text-[13.5px] text-black/55">No measurements yet. Your stylist will take them during your first consultation.</p>
      )}
    </div>
  );
};

// ---- onboarding flow ------------------------------------------------------------------------

const STEPS = ['About you', 'Your size', 'Body type', 'Measurements', 'Delivery address'];

export const PersonalizeScreen: React.FC = () => {
  const customer = useCustomer();
  const { setCustomer, errorMessage } = useSession();
  const nav = useNav();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(customer.fullName);
  const [profile, setProfile] = useState<FitProfile>(customer.fitProfile);
  const [address, setAddress] = useState<AddressInput>(emptyAddress());
  const [addrErrors, setAddrErrors] = useState<ReturnType<typeof validateAddress>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const patch = (p: Partial<FitProfile>) => setProfile((x) => ({ ...x, ...p }));

  const finish = async () => {
    const c = await api.completePersonalization();
    setCustomer(c);
    toast('Profile saved');
    nav.reset({ name: 'home' });
  };

  const next = async (skip = false) => {
    setError('');
    if (step === 0 && !skip) {
      if (!name.trim()) return setError('Please enter your name.');
      if (!validHeight(profile.heightCm)) return setError('Enter a height between 120 and 215 cm.');
    }
    if (step === 4 && !skip) {
      const e = validateAddress(address);
      setAddrErrors(e);
      if (Object.keys(e).length) return;
    }
    setLoading(true);
    try {
      if (!skip) {
        if (step === 0 && name.trim() !== customer.fullName) setCustomer(await api.updateProfile({ fullName: name }));
        if (step <= 2) setCustomer(await api.updateFitProfile({ heightCm: profile.heightCm, heightUnit: profile.heightUnit, usualSize: profile.usualSize, garmentSizes: profile.garmentSizes, bodyType: profile.bodyType }));
        if (step === 4) setCustomer(await api.saveAddress({ ...address, isDefault: true }));
      }
      if (step === STEPS.length - 1) await finish();
      else setStep(step + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      id="personalize"
      title={step === 0 ? `Hi ${customer.fullName.split(' ')[0]}` : STEPS[step]}
      subtitle={
        [
          'A few details help us tailor suggestions and previews to you.',
          'Pick the size you usually wear. You can be more specific per garment.',
          'Optional — this only personalises styling ideas. It never limits what you can order.',
          'How Dori handles your measurements.',
          'Required before you place an order. You can also add it later.',
        ][step]
      }
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      progress={{ step: step + 1, total: STEPS.length, label: STEPS[step] }}
      footer={
        <div className="flex flex-col gap-2">
          <Button block loading={loading} id="personalize-continue" onClick={() => void next(false)}>
            {step === STEPS.length - 1 ? 'Save and finish' : 'Save and continue'}
          </Button>
          {step !== 3 && (
            <Button variant="ghost" block id="personalize-skip" onClick={() => void next(true)} disabled={loading}>
              {step === 4 ? 'Add address later' : 'Skip for now'}
            </Button>
          )}
        </div>
      }
    >
      <div className="pt-4">
        {error && <ErrorBanner message={error} />}
        {step === 0 && (
          <>
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <HeightPicker profile={profile} onChange={patch} />
          </>
        )}
        {step === 1 && <SizePicker profile={profile} onChange={patch} />}
        {step === 2 && <BodyTypePicker value={profile.bodyType} onChange={(b) => patch({ bodyType: b })} />}
        {step === 3 && (
          <>
            <MeasurementsView profile={customer.fitProfile} />
            <SectionTitle>How it works</SectionTitle>
            <ol className="text-[13.5px] text-black/70 leading-relaxed list-decimal pl-5 space-y-1.5">
              <li>Book a consultation when you place an order.</li>
              <li>Your stylist takes or verifies your measurements.</li>
              <li>They’re saved to your profile for future orders and re-checked each time.</li>
            </ol>
          </>
        )}
        {step === 4 && <AddressForm value={address} onChange={setAddress} errors={addrErrors} />}
      </div>
    </Screen>
  );
};
