/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Order steps 7–10: design summary, next action (consultation or save for later), urgency,
// consultation slot, final review, submission and confirmation.

import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, CalendarCheck, CalendarDays, CheckCircle2, Clock, Info, MapPin, Phone, Plus, Video } from 'lucide-react';
import { CONSULTATION, FABRIC_TYPES, OCCASIONS, STATUS_LABEL, STYLE_FAMILIES, URGENCY_OPTIONS, garmentById, garmentName } from '../data/catalog';
import { describeStudio } from '../data/describe';
import { api } from '../services';
import { ApiError, type Slot } from '../services/api';
import type { Board, OrderRequest } from '../services/types';
import { useNav } from '../nav';
import { draftToDesign, emptyDraft, useDraft } from '../state/orderDraft';
import { useCustomer, useSession } from '../state/session';
import { formatAddress } from '../ui/AddressForm';
import { GarmentArtFor } from '../ui/Silhouette';
import { Button, Choice, DemoTag, ErrorBanner, Field, Input, Note, Screen, SectionTitle, Sheet, Spinner, TextArea, formatDate, formatTime, useToast } from '../ui/kit';
import { fabricLengthError } from './OrderFlow';

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 text-[13.5px]">
    <span className="text-black/55 flex-none">{label}</span>
    <span className={`text-right ${value ? 'font-medium' : 'text-black/35'}`}>{value || 'Not set'}</span>
  </div>
);

const Section: React.FC<{ title: string; onEdit?: () => void; children: React.ReactNode; id?: string }> = ({ title, onEdit, children, id }) => (
  <section id={id} className="rounded-[20px] border border-black/10 p-4 mb-3">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-black/55">{title}</h3>
      {onEdit && (
        <button onClick={onEdit} className="text-[13px] font-semibold text-[#174D33]">
          Edit
        </button>
      )}
    </div>
    {children}
  </section>
);

// ---- shared summary of the design -----------------------------------------------------------

const DesignBlock: React.FC<{ editable?: boolean }> = ({ editable = true }) => {
  const nav = useNav();
  const { draft } = useDraft();
  const g = garmentById(draft.garmentId);
  const choices = describeStudio(draft.studio);
  const fabric = FABRIC_TYPES.find((f) => f.id === draft.fabricType);
  return (
    <>
      <Section title="Fabric" onEdit={editable ? () => nav.go({ name: 'order', step: 1 }) : undefined}>
        <Row label="Type" value={fabric?.label} />
        <Row label="Quantity" value={draft.fabricLength ? `${draft.fabricLength} ${draft.fabricUnit === 'm' ? 'metres' : 'yards'}` : undefined} />
        {draft.fabricWidth && <Row label="Width" value={`${draft.fabricWidth} ${draft.fabricWidthUnit}`} />}
      </Section>
      <Section title="Garment" onEdit={editable ? () => nav.go({ name: 'order', step: 3 }) : undefined}>
        <Row label="Occasion" value={OCCASIONS.find((o) => o.id === draft.occasion)?.label} />
        <Row label="Style" value={STYLE_FAMILIES.find((s) => s.id === draft.family)?.label} />
        <Row label="Garment" value={garmentName(g)} />
        {g?.lining && <Row label="Lining" value={g.lining === 'lined' ? 'With lining' : 'Without lining'} />}
        <Row label="Size" value={draft.size === 'unsure' ? 'Not sure — stylist to advise' : draft.size} />
      </Section>
      <Section
        title={draft.method === 'reference' ? 'Reference' : 'Design'}
        onEdit={editable ? () => nav.go(draft.method === 'reference' ? { name: 'reference' } : { name: 'studio' }) : undefined}
        id="summary-design"
      >
        {draft.method === 'studio' && (
          <div className="flex gap-3">
            {draft.previewDataUrl ? (
              <img src={draft.previewDataUrl} alt="Design preview" className="w-24 h-40 object-cover rounded-2xl border border-black/10 flex-none" />
            ) : (
              <div className="w-24 h-40 rounded-2xl bg-[#174D33]/[0.05] flex items-center justify-center flex-none">
                <GarmentArtFor garmentId={draft.garmentId} className="w-16" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {choices.map((c) => (
                <div key={c.label} className="flex justify-between gap-2 text-[12.5px] py-0.5">
                  <span className="text-black/50">{c.label}</span>
                  <span className="font-medium text-right">{c.value}</span>
                </div>
              ))}
              {!choices.length && <p className="text-[13px] text-black/50">Not designed yet.</p>}
            </div>
          </div>
        )}
        {draft.method === 'studio' && draft.studioNotes && (
          <p className="text-[13px] mt-3 p-3 rounded-xl bg-black/[0.03]">
            <span className="block text-[11px] uppercase tracking-wider text-black/45 mb-0.5">Studio notes</span>
            {draft.studioNotes}
          </p>
        )}
        {draft.method === 'reference' && (
          <>
            <div className="flex gap-2 overflow-x-auto">
              {draft.references.map((r) => (
                <img key={r.id} src={r.dataUrl} alt={r.name} className="w-20 h-28 object-cover rounded-xl border border-black/10 flex-none" />
              ))}
            </div>
            {draft.referenceUrl && <Row label="Link" value={<span className="break-all">{draft.referenceUrl}</span>} />}
            {draft.changeNotes && (
              <p className="text-[13px] mt-2 p-3 rounded-xl bg-black/[0.03]">
                <span className="block text-[11px] uppercase tracking-wider text-black/45 mb-0.5">Changes requested</span>
                {draft.changeNotes}
              </p>
            )}
          </>
        )}
      </Section>
    </>
  );
};

// ---- step 7: design summary -----------------------------------------------------------------

export const DesignSummaryScreen: React.FC = () => {
  const nav = useNav();
  const { draft, update } = useDraft();
  return (
    <Screen
      onBack={nav.back}
      title="Your design"
      subtitle="Check everything, then add any final instructions."
      footer={
        <Button block id="summary-continue" onClick={() => nav.go({ name: 'next-action' })}>
          Continue
        </Button>
      }
    >
      <div className="pt-4">
        <DesignBlock />
        <SectionTitle>Final description</SectionTitle>
        <Field label="Anything else your stylist should know?" optional hint="Kept separate from the choices above — nothing here overwrites them.">
          <TextArea
            id="summary-description"
            maxLength={500}
            placeholder="e.g. I’d like a slightly longer blouse and a can-can under the skirt."
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
      </div>
    </Screen>
  );
};

// ---- step 8: next action --------------------------------------------------------------------

export const NextActionScreen: React.FC = () => {
  const nav = useNav();
  const customer = useCustomer();
  const toast = useToast();
  const { errorMessage } = useSession();
  const { draft, replaceDraft } = useDraft();
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [boardId, setBoardId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const missingFabric = !draft.fabricType || !!fabricLengthError(draft);

  const openSave = async () => {
    setSaveOpen(true);
    try {
      setBoards(await api.listBoards());
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const d = await api.saveDesign(draftToDesign(draft, customer));
      if (boardId) await api.addToBoard(boardId, { kind: 'design', refId: d.id });
      // saving never creates an order: the draft is cleared, the design lives in Saved Designs
      replaceDraft(emptyDraft());
      toast('Design saved. No order has been placed.');
      nav.reset([{ name: 'home' }, { name: 'saved' }]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen onBack={nav.back} title="What would you like to do next?">
      <div className="pt-4">
        <Choice
          id="next-consult"
          selected={false}
          onClick={() => (missingFabric ? nav.go({ name: 'order', step: draft.fabricType ? 2 : 1 }) : nav.go({ name: 'urgency' }))}
          title="Book a stylist consultation"
          description={missingFabric ? 'First tell us about your fabric — it’s needed for the consultation.' : 'Discuss your design with a stylist and move towards placing the order.'}
          art={<CalendarCheck className="w-6 h-6" />}
        />
        <Choice
          id="next-save"
          selected={false}
          onClick={() => void openSave()}
          title="Save for later"
          description="Keep this design in Saved Designs. No order is created and no slot is reserved."
          art={<Bookmark className="w-6 h-6" />}
        />
      </div>
      <Sheet
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save design"
        footer={
          <Button block loading={saving} id="save-confirm" onClick={() => void save()}>
            Save
          </Button>
        }
      >
        {error && <ErrorBanner message={error} />}
        <p className="text-[13px] text-black/55 mb-3">Add it to a board (optional).</p>
        {!boards && !error && <Spinner />}
        {boards?.map((b) => (
          <Choice key={b.id} selected={boardId === b.id} onClick={() => setBoardId(boardId === b.id ? '' : b.id)} title={b.title} description={`${b.items.length} saved`} />
        ))}
      </Sheet>
      {error && !saveOpen && <ErrorBanner message={error} />}
    </Screen>
  );
};

// ---- step 9: urgency ------------------------------------------------------------------------

export const UrgencyScreen: React.FC = () => {
  const nav = useNav();
  const { draft, update } = useDraft();
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dateError = draft.desiredDate && draft.desiredDate < minDate ? 'Choose a date from tomorrow onwards.' : '';
  return (
    <Screen
      onBack={nav.back}
      title="How soon do you need it?"
      footer={
        <Button block id="urgency-continue" disabled={!draft.urgencyId || !!dateError} onClick={() => nav.go({ name: 'consultation' })}>
          Continue
        </Button>
      }
    >
      <div className="pt-4">
        {URGENCY_OPTIONS.filter((o) => o.enabled).map((o) => (
          <Choice key={o.id} id={`urgency-${o.id}`} selected={draft.urgencyId === o.id} onClick={() => update({ urgencyId: o.id })} title={o.label} description={o.description} />
        ))}
        <Field label="Date you need it by" optional error={dateError}>
          <Input id="urgency-date" type="date" min={minDate} value={draft.desiredDate} onChange={(e) => update({ desiredDate: e.target.value })} invalid={!!dateError} />
        </Field>
        <Note icon={<Info className="w-4 h-4" />}>
          This is a request, not a guarantee. Your stylist checks it against the workshop’s schedule, and if it isn’t possible you’ll be told
          before anything is confirmed for production.
        </Note>
      </div>
    </Screen>
  );
};

// ---- step 10: consultation slot -------------------------------------------------------------

export const SlotPicker: React.FC<{ value?: string; onChange: (s: string) => void }> = ({ value, onChange }) => {
  const { errorMessage } = useSession();
  const [days, setDays] = useState<{ date: string; slots: Slot[] }[] | null>(null);
  const [error, setError] = useState('');
  const [day, setDay] = useState(0);
  const load = () => {
    setError('');
    setDays(null);
    api
      .listSlots(CONSULTATION.daysAhead)
      .then((d) => {
        setDays(d);
        const preset = value ? d.findIndex((x) => x.slots.some((s) => s.start === value)) : d.findIndex((x) => x.slots.some((s) => s.available));
        setDay(Math.max(0, preset));
      })
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, []);
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!days) return <Spinner label="Loading availability" />;
  const current = days[day];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {days.map((d, i) => {
          const dt = new Date(d.date);
          const open = d.slots.some((s) => s.available);
          return (
            <button
              key={d.date}
              id={`slot-day-${i}`}
              onClick={() => setDay(i)}
              disabled={!open}
              className={`flex-none w-14 py-2 rounded-2xl border text-center transition disabled:opacity-35 ${i === day ? 'bg-[#174D33] border-[#174D33] text-white' : 'border-black/10'}`}
            >
              <span className="block text-[11px] uppercase">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              <span className="block text-[18px] font-semibold">{dt.getDate()}</span>
              <span className="block text-[10px] opacity-70">{dt.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {current.slots.map((s) => (
          <button
            key={s.start}
            id={`slot-${new Date(s.start).getHours()}`}
            disabled={!s.available}
            onClick={() => onChange(s.start)}
            aria-pressed={value === s.start}
            className={`h-11 rounded-2xl border text-[13.5px] font-medium transition disabled:opacity-30 disabled:line-through ${
              value === s.start ? 'bg-[#174D33] border-[#174D33] text-white' : 'border-black/15'
            }`}
          >
            {formatTime(s.start)}
          </button>
        ))}
      </div>
      {!current.slots.some((s) => s.available) && <p className="text-[13px] text-black/55 mt-3">No times left on this day.</p>}
    </div>
  );
};

export const ConsultationScreen: React.FC = () => {
  const nav = useNav();
  const { draft, update } = useDraft();
  return (
    <Screen
      onBack={nav.back}
      title="Book your consultation"
      subtitle={`${CONSULTATION.durationMin}-minute session with a Dori stylist.`}
      footer={
        <Button block id="consult-continue" disabled={!draft.slotStart} onClick={() => nav.go({ name: 'review' })}>
          Review request
        </Button>
      }
    >
      <div className="pt-3">
        <div className="mb-3">
          <DemoTag>Demo availability</DemoTag>
          <span className="text-[12px] text-black/50 ml-2">Sample times — not real stylist calendars.</span>
        </div>
        <SlotPicker value={draft.slotStart} onChange={(s) => update({ slotStart: s })} />
        <SectionTitle>How would you like to meet?</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Choice selected={draft.mode === 'video'} onClick={() => update({ mode: 'video' })} title="Video call" art={<Video className="w-5 h-5" />} />
          <Choice selected={draft.mode === 'phone'} onClick={() => update({ mode: 'phone' })} title="Phone call" art={<Phone className="w-5 h-5" />} />
        </div>
        {draft.slotStart && (
          <Note icon={<CalendarDays className="w-4 h-4" />}>
            <b>
              {formatDate(draft.slotStart, { weekday: 'long', day: 'numeric', month: 'long' })} at {formatTime(draft.slotStart)}
            </b>
            <br />
            Your stylist is assigned and their contact details shared no later than 2 hours before this time.
          </Note>
        )}
      </div>
    </Screen>
  );
};

// ---- review & submit ------------------------------------------------------------------------

export const ReviewScreen: React.FC = () => {
  const nav = useNav();
  const customer = useCustomer();
  const { errorMessage, setCustomer } = useSession();
  const { draft, update, replaceDraft } = useDraft();
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; slot?: boolean } | null>(null);

  useEffect(() => {
    // refresh addresses (one may have just been added) and pick the default
    api.me().then((c) => {
      setCustomer(c);
      if (!draft.addressId || !c.addresses.some((a) => a.id === draft.addressId)) {
        const def = c.addresses.find((a) => a.isDefault) || c.addresses[0];
        if (def) update({ addressId: def.id });
      }
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const address = customer.addresses.find((a) => a.id === draft.addressId);
  const urgency = URGENCY_OPTIONS.find((u) => u.id === draft.urgencyId);
  const missing = [
    !draft.fabricType || fabricLengthError(draft) ? 'fabric details' : '',
    !draft.garmentId ? 'garment' : '',
    !draft.studio && !draft.references.length && !draft.referenceUrl ? 'design' : '',
    !urgency ? 'urgency' : '',
    !draft.slotStart ? 'consultation time' : '',
    !address ? 'delivery address' : '',
  ].filter(Boolean);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const design = await api.saveDesign(draftToDesign(draft, customer));
      update({ designId: design.id });
      const req = await api.submitRequest({
        design,
        fabric: design.fabric!,
        urgency: { optionId: draft.urgencyId!, desiredDate: draft.desiredDate || undefined },
        addressId: address!.id,
        slotStart: draft.slotStart!,
        mode: draft.mode,
        idempotencyKey: draft.idempotencyKey,
      });
      replaceDraft(emptyDraft());
      nav.reset([{ name: 'home' }, { name: 'confirmation', requestId: req.id }]);
    } catch (e) {
      const slot = e instanceof ApiError && e.code === 'SLOT_UNAVAILABLE';
      setError({ message: errorMessage(e), slot });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      onBack={nav.back}
      title="Review your request"
      footer={
        <>
          {missing.length > 0 && <p className="text-[12.5px] text-black/60 mb-2">Still needed: {missing.join(', ')}.</p>}
          <Button block id="review-submit" loading={submitting} disabled={missing.length > 0 || !agree} onClick={() => void submit()}>
            Request consultation
          </Button>
        </>
      }
    >
      <div className="pt-4">
        {error && (
          <div>
            <ErrorBanner message={error.message} onRetry={error.slot ? undefined : () => void submit()} />
            {error.slot && (
              <Button variant="secondary" block className="mb-4" onClick={() => nav.go({ name: 'consultation' })}>
                Choose another time
              </Button>
            )}
          </div>
        )}
        <Section title="Your details" onEdit={() => nav.go({ name: 'profile-edit' })}>
          <Row label="Name" value={customer.fullName} />
          <Row label="Phone" value={customer.phone} />
          {customer.email && <Row label="Email" value={customer.email} />}
        </Section>
        <Section title="Delivery address" id="review-address">
          {customer.addresses.length === 0 && (
            <Button variant="secondary" block id="review-add-address" onClick={() => nav.go({ name: 'address-edit', returnTo: 'review' })}>
              <Plus className="w-4 h-4" /> Add delivery address
            </Button>
          )}
          {customer.addresses.map((a) => (
            <Choice key={a.id} selected={draft.addressId === a.id} onClick={() => update({ addressId: a.id })} title={a.label} description={formatAddress(a)} art={<MapPin className="w-5 h-5" />} />
          ))}
          {customer.addresses.length > 0 && (
            <button className="text-[13px] font-semibold text-[#174D33]" onClick={() => nav.go({ name: 'address-edit', returnTo: 'review' })}>
              + Add another address
            </button>
          )}
        </Section>
        <DesignBlock />
        <Section title="Final description" onEdit={() => nav.go({ name: 'design-summary' })}>
          <p className="text-[13.5px] text-black/70">{draft.description || 'None'}</p>
        </Section>
        <Section title="Urgency" onEdit={() => nav.go({ name: 'urgency' })}>
          <Row label="Requested" value={urgency?.label} />
          <Row label="Needed by" value={draft.desiredDate ? formatDate(draft.desiredDate) : 'No specific date'} />
        </Section>
        <Section title="Consultation" onEdit={() => nav.go({ name: 'consultation' })}>
          <Row label="When" value={draft.slotStart && `${formatDate(draft.slotStart, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(draft.slotStart)}`} />
          <Row label="How" value={draft.mode === 'video' ? 'Video call' : 'Phone call'} />
        </Section>
        <Note icon={<Info className="w-4 h-4" />}>
          This sends a <b>consultation request</b>, not a production order. Price, any deposit and the delivery date are agreed with your stylist
          after the consultation. No payment is taken now.
        </Note>
        <label className="flex items-start gap-2.5 text-[13.5px] leading-snug">
          <input id="review-agree" type="checkbox" className="w-5 h-5 mt-0.5 accent-[#174D33] flex-none" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I understand the design and turnaround will be confirmed by my stylist, and I agree to the{' '}
            <button className="underline font-semibold" onClick={(e) => (e.preventDefault(), nav.go({ name: 'legal', doc: 'terms' }))}>
              terms
            </button>
            .
          </span>
        </label>
      </div>
    </Screen>
  );
};

// ---- confirmation ---------------------------------------------------------------------------

export const ConfirmationScreen: React.FC<{ requestId: string }> = ({ requestId }) => {
  const nav = useNav();
  const { errorMessage } = useSession();
  const [req, setReq] = useState<OrderRequest | null>(null);
  const [slot, setSlot] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .getRequest(requestId)
      .then((d) => {
        setReq(d.request);
        setSlot(d.consultation.slotStart);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [requestId, errorMessage]);
  const g = useMemo(() => garmentById(req?.garmentId), [req]);
  if (error) return <Screen title="Request" onBack={() => nav.reset({ name: 'home' })}><ErrorBanner message={error} /></Screen>;
  if (!req) return <Screen><Spinner /></Screen>;
  return (
    <Screen
      footer={
        <div className="flex flex-col gap-2">
          <Button block id="confirm-view" onClick={() => nav.replace({ name: 'request', id: req.id })}>
            View request status
          </Button>
          <Button variant="ghost" block onClick={() => nav.reset({ name: 'home' })}>
            Back to home
          </Button>
        </div>
      }
    >
      <div className="pt-10 text-center">
        <CheckCircle2 className="w-14 h-14 mx-auto text-[#174D33] stroke-[1.4]" />
        <h1 className="font-serif text-[28px] font-semibold mt-3">Consultation requested</h1>
        <p className="text-[13.5px] text-black/55 mt-1">Reference</p>
        <p id="confirm-reference" className="text-[22px] font-semibold tracking-wider">{req.reference}</p>
      </div>
      <div className="mt-6 rounded-[20px] border border-black/10 p-4">
        <Row label="Status" value={STATUS_LABEL[req.status]} />
        <Row label="Consultation" value={`${formatDate(slot, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(slot)}`} />
        <Row label="Garment" value={garmentName(g)} />
        <Row label="Urgency" value={URGENCY_OPTIONS.find((u) => u.id === req.urgency.optionId)?.label} />
      </div>
      <SectionTitle>What happens next</SectionTitle>
      <ol className="space-y-3">
        {[
          [Clock, 'A stylist is assigned at least 2 hours before your consultation, with their contact details.'],
          [CalendarDays, 'You meet, finalise the design, measurements, price and delivery date.'],
          [CheckCircle2, 'You approve the details — only then is the order confirmed for production.'],
        ].map(([Icon, text], i) => {
          const I = Icon as typeof Clock;
          return (
            <li key={i} className="flex gap-3 text-[13.5px] leading-snug">
              <I className="w-5 h-5 text-[#174D33] flex-none" />
              {text as string}
            </li>
          );
        })}
      </ol>
    </Screen>
  );
};
