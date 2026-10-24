/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Track an Order: list of requests/orders and a detail page with the production timeline, stylist
// assignment, and the actions the business rules allow.

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Circle, Clock, FlaskConical, LifeBuoy, Mail, PackageSearch, Phone, UserRound } from 'lucide-react';
import { CONSULTATION, STATUS_LABEL, URGENCY_OPTIONS, garmentById, garmentName, isProduction, timelineFor } from '../data/catalog';
import { describeStudio } from '../data/describe';
import { api, demoBackend, IS_DEMO } from '../services';
import type { RequestDetail } from '../services/api';
import type { OrderRequest } from '../services/types';
import { useNav } from '../nav';
import { useSession } from '../state/session';
import { formatAddress } from '../ui/AddressForm';
import { GarmentArtFor } from '../ui/Silhouette';
import {
  Button,
  Chip,
  ConfirmDialog,
  DemoTag,
  EmptyState,
  ErrorBanner,
  Field,
  Note,
  Screen,
  SectionTitle,
  Sheet,
  Spinner,
  TextArea,
  formatDate,
  formatTime,
  useToast,
} from '../ui/kit';
import { SlotPicker } from './Checkout';

const phaseLabel = (r: OrderRequest) => (r.status === 'cancelled' ? 'Cancelled' : isProduction(r.status) ? 'Order' : 'Consultation request');

export const TrackListScreen: React.FC = () => {
  const nav = useNav();
  const { errorMessage } = useSession();
  const [items, setItems] = useState<OrderRequest[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const load = useCallback(() => {
    setError('');
    api.listRequests().then(setItems).catch((e) => setError(errorMessage(e)));
  }, [errorMessage]);
  useEffect(load, [load]);
  const shown = items?.filter((r) => filter === 'all' || !['delivered', 'cancelled'].includes(r.status));
  return (
    <Screen title="Track an order" onBack={nav.back}>
      <div className="flex gap-2 pt-2 pb-3">
        <Chip selected={filter === 'active'} onClick={() => setFilter('active')}>
          Active
        </Chip>
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
      </div>
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!items && !error && <Spinner />}
      {shown?.length === 0 && (
        <EmptyState
          icon={<PackageSearch className="w-7 h-7" />}
          title={filter === 'active' ? 'No active orders' : 'No orders yet'}
          body="When you request a consultation, you can follow it here from booking to delivery."
          action={<Button onClick={() => nav.go({ name: 'order', step: 1 })}>Place an order</Button>}
        />
      )}
      {shown?.map((r) => (
        <button
          key={r.id}
          id={`track-${r.reference}`}
          onClick={() => nav.go({ name: 'request', id: r.id })}
          className="w-full flex gap-3 p-3 mb-2.5 rounded-[20px] border border-black/10 text-left hover:border-black/25"
        >
          {r.designSnapshot.previewDataUrl ? (
            <img src={r.designSnapshot.previewDataUrl} alt="" className="w-16 h-20 object-cover rounded-xl flex-none" />
          ) : (
            <span className="w-16 h-20 rounded-xl bg-[#174D33]/[0.05] flex items-center justify-center flex-none">
              <GarmentArtFor garmentId={r.garmentId} className="w-11" />
            </span>
          )}
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-black/45">
              {phaseLabel(r)} · {r.reference}
            </span>
            <span className="block text-[15px] font-semibold truncate">{garmentName(garmentById(r.garmentId))}</span>
            <span className="inline-flex items-center gap-1.5 mt-1 text-[12.5px] font-medium text-[#174D33]">
              <Circle className="w-2 h-2 fill-current" /> {STATUS_LABEL[r.status]}
            </span>
            <span className="block text-[11.5px] text-black/45 mt-0.5">Updated {new Date(r.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </span>
        </button>
      ))}
    </Screen>
  );
};

export const RequestScreen: React.FC<{ id: string }> = ({ id }) => {
  const nav = useNav();
  const toast = useToast();
  const { errorMessage } = useSession();
  const [d, setD] = useState<RequestDetail | null>(null);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError('');
    api
      .getRequest(id)
      .then((x) => {
        setD(x);
        setLoadedAt(new Date().toISOString());
      })
      .catch((e) => setError(errorMessage(e)));
  }, [id, errorMessage]);
  useEffect(load, [load]);
  // re-check while open, so a scheduled assignment shows up without leaving the page
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (!d && error) return <Screen title="Request" onBack={nav.back}><ErrorBanner message={error} onRetry={load} /></Screen>;
  if (!d) return <Screen title="Request" onBack={nav.back}><Spinner /></Screen>;

  const { request: r, consultation: c, stylist, events } = d;
  const g = garmentById(r.garmentId);
  const tl = timelineFor(r.garmentId);
  const curIdx = tl.indexOf(r.status);
  const at = (s: string) => events.find((e) => e.to === s)?.at;
  const canChange = ['consultation_requested', 'stylist_assigned'].includes(r.status);
  const canCancel = !isProduction(r.status) && r.status !== 'cancelled';
  const due = new Date(Date.parse(c.slotStart) - CONSULTATION.assignLeadHours * 3600000);

  const demo = async (fn: () => Promise<RequestDetail>, msg: string) => {
    setBusy(true);
    try {
      setD(await fn());
      setLoadedAt(new Date().toISOString());
      toast(msg);
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={r.reference} subtitle={`${phaseLabel(r)} · ${garmentName(g)}`} onBack={nav.back}>
      {error && <ErrorBanner message={`Showing the last known status (updated ${formatTime(loadedAt)}). ${error}`} onRetry={load} />}

      {/* current status */}
      <div className="mt-3 p-4 rounded-[20px] bg-[#174D33] text-white flex gap-3">
        {r.designSnapshot.previewDataUrl ? (
          <img src={r.designSnapshot.previewDataUrl} alt="" className="w-16 h-24 object-cover rounded-xl bg-white flex-none" />
        ) : (
          <span className="w-16 h-24 rounded-xl bg-white flex items-center justify-center flex-none">
            <GarmentArtFor garmentId={r.garmentId} className="w-11" />
          </span>
        )}
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-white/70">Current status</div>
          <div id="request-status" className="font-serif text-[23px] font-semibold leading-tight">{STATUS_LABEL[r.status]}</div>
          <div className="text-[12px] text-white/75 mt-1">Last updated {new Date(r.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          <div className="text-[12px] text-white/75">
            Delivery: {r.expectedDelivery ? `${formatDate(r.expectedDelivery)} (confirmed)` : 'to be confirmed after your consultation'}
          </div>
        </div>
      </div>

      {r.urgency.feasibility === 'not_feasible' && (
        <Note icon={<Clock className="w-4 h-4" />}>
          <b>Your requested turnaround isn’t possible for this garment.</b> Your stylist will offer the earliest feasible date — nothing is
          confirmed for production until you approve it.
        </Note>
      )}

      {/* consultation & stylist */}
      {r.status !== 'cancelled' && !isProduction(r.status) && (
        <>
          <SectionTitle>Consultation</SectionTitle>
          <div className="rounded-[20px] border border-black/10 p-4">
            <div className="text-[15px] font-semibold">
              {formatDate(c.slotStart, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(c.slotStart)}
            </div>
            <div className="text-[12.5px] text-black/55">{c.mode === 'video' ? 'Video call' : 'Phone call'} · {c.durationMin} min</div>
            <div className="mt-3 pt-3 border-t border-black/[0.07]" id="stylist-card">
              {c.assignment === 'assigned' && stylist ? (
                <div className="flex gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#174D33]/[0.08] text-[#174D33] flex items-center justify-center flex-none">
                    <UserRound className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[14.5px] font-semibold">{stylist.name}</div>
                    <div className="text-[12px] text-black/55">
                      {stylist.title} · {stylist.experience}
                    </div>
                    {stylist.contactReleased && (
                      <div className="flex gap-2 mt-2">
                        <a href={`tel:${stylist.phone.replace(/\s/g, '')}`} className="h-8 px-3 rounded-full border border-black/15 text-[12.5px] font-semibold flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {stylist.phone}
                        </a>
                        <a href={`mailto:${stylist.email}`} className="h-8 w-8 rounded-full border border-black/15 flex items-center justify-center" aria-label="Email stylist">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : c.assignment === 'failed' ? (
                <p className="text-[13px]">We’re reassigning your stylist and will update you shortly.</p>
              ) : c.assignment === 'in_progress' ? (
                <p className="text-[13px]">Assigning your stylist now — your consultation is soon, so this happens straight away.</p>
              ) : (
                <p className="text-[13px] text-black/65">
                  Your stylist will be assigned by <b>{formatDate(due.toISOString(), { day: 'numeric', month: 'short' })}, {formatTime(due.toISOString())}</b> (2 hours
                  before your consultation). You’ll get a notification with their contact details.
                </p>
              )}
            </div>
          </div>
          {(canChange || canCancel) && (
            <div className="flex gap-2 mt-3">
              {canChange && (
                <Button variant="secondary" size="sm" onClick={() => nav.go({ name: 'reschedule', id: r.id })}>
                  Reschedule
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                  Cancel request
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* timeline */}
      <SectionTitle>Progress</SectionTitle>
      {r.status === 'cancelled' ? (
        <p className="text-[13.5px] text-black/60">This request was cancelled on {formatDate(at('cancelled'))}.</p>
      ) : (
        <ol id="timeline" className="relative">
          {tl.map((s, i) => {
            const done = i < curIdx;
            const current = i === curIdx;
            const ts = at(s);
            return (
              <li key={s} className="flex gap-3 pb-4 relative">
                {i < tl.length - 1 && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${i < curIdx ? 'bg-[#174D33]' : 'bg-black/10'}`} />}
                <span
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-none ${
                    done ? 'bg-[#174D33] text-white' : current ? 'bg-white border-2 border-[#174D33]' : 'bg-white border border-black/20'
                  }`}
                >
                  {done && <Check className="w-3.5 h-3.5" />}
                  {current && <span className="w-2.5 h-2.5 rounded-full bg-[#174D33]" />}
                </span>
                <span className="flex-1 -mt-0.5">
                  <span className={`block text-[14px] ${current ? 'font-semibold' : done ? 'font-medium' : 'text-black/45'}`}>{STATUS_LABEL[s]}</span>
                  {ts && <span className="block text-[11.5px] text-black/45">{new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* updates */}
      <SectionTitle>Updates</SectionTitle>
      {[...events].reverse().map((e) => (
        <div key={e.id} className="py-2.5 border-b border-black/[0.06] text-[13px]">
          <div className="flex items-center gap-2">
            <span className="font-medium">{e.message}</span>
            {e.actor === 'demo' && <DemoTag>Simulated</DemoTag>}
          </div>
          <div className="text-[11.5px] text-black/45">{new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
      ))}

      {/* details */}
      <SectionTitle>Details</SectionTitle>
      <div className="rounded-[20px] border border-black/10 p-4 text-[13px] space-y-1.5">
        <div>
          <span className="text-black/50">Urgency: </span>
          {URGENCY_OPTIONS.find((u) => u.id === r.urgency.optionId)?.label}
          {r.urgency.desiredDate && ` · needed by ${formatDate(r.urgency.desiredDate)}`}
        </div>
        <div>
          <span className="text-black/50">Fabric: </span>
          {r.fabric.length} {r.fabric.unit}
        </div>
        <div>
          <span className="text-black/50">Deliver to: </span>
          {formatAddress(r.addressSnapshot)}
        </div>
        <div>
          <span className="text-black/50">Price: </span>
          {r.pricing?.confirmed ? `${r.pricing.currency} ${r.pricing.amount}` : 'Agreed with your stylist — no payment taken in this app yet'}
        </div>
        {describeStudio(r.designSnapshot.studio).length > 0 && (
          <div className="pt-2 mt-2 border-t border-black/[0.07]">
            {describeStudio(r.designSnapshot.studio).map((x) => (
              <div key={x.label} className="flex justify-between">
                <span className="text-black/50">{x.label}</span>
                <span>{x.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="ghost" block className="mt-3" onClick={() => setIssueOpen(true)}>
        <LifeBuoy className="w-4 h-4" /> Report an issue
      </Button>

      {/* demo controls for presentations */}
      {IS_DEMO && r.status !== 'cancelled' && r.status !== 'delivered' && (
        <div className="mt-4 p-4 rounded-[20px] border border-dashed border-[#174D33]/50">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-[#174D33]" />
            <span className="text-[13px] font-semibold">Demo controls</span>
            <DemoTag />
          </div>
          <p className="text-[12px] text-black/55 mb-3 leading-relaxed">
            Simulates the stylist, workshop and warehouse so you can present the full journey. In production these updates come from Dori’s
            operations team and backend jobs.
          </p>
          <div className="flex flex-wrap gap-2">
            {r.status === 'consultation_requested' && c.assignment !== 'assigned' && (
              <Button size="sm" variant="secondary" id="demo-assign" disabled={busy} onClick={() => void demo(() => demoBackend.demo.fastForwardToAssignment(r.id), 'Clock moved to 2 h before the consultation')}>
                Jump to 2 h before consultation
              </Button>
            )}
            <Button size="sm" id="demo-advance" disabled={busy} onClick={() => void demo(() => demoBackend.demo.advance(r.id), 'Moved to the next stage')}>
              Advance to next stage
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this request?"
        body="Your consultation will be cancelled. Your design stays in Saved Designs."
        confirmLabel="Cancel request"
        danger
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false);
          void demo(() => api.cancelRequest(r.id), 'Request cancelled');
        }}
      />
      <Sheet
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Report an issue"
        footer={
          <Button
            block
            disabled={!issue.trim()}
            onClick={() => {
              setIssueOpen(false);
              setIssue('');
              toast('Thanks — support will follow up (demo: not sent anywhere).');
            }}
          >
            Send
          </Button>
        }
      >
        <Field label="What went wrong?">
          <TextArea maxLength={500} value={issue} onChange={(e) => setIssue(e.target.value)} />
        </Field>
        <p className="text-[12px] text-black/50">
          <DemoTag /> Support messaging isn’t connected in this demo.
        </p>
      </Sheet>
    </Screen>
  );
};

export const RescheduleScreen: React.FC<{ id: string }> = ({ id }) => {
  const nav = useNav();
  const toast = useToast();
  const { errorMessage } = useSession();
  const [slot, setSlot] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen
      title="Reschedule"
      onBack={nav.back}
      footer={
        <Button
          block
          loading={busy}
          disabled={!slot}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await api.rescheduleConsultation(id, slot!);
              toast('Consultation rescheduled');
              nav.back();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Confirm new time
        </Button>
      }
    >
      <div className="pt-3">
        {error && <ErrorBanner message={error} />}
        <div className="mb-3">
          <DemoTag>Demo availability</DemoTag>
        </div>
        <SlotPicker value={slot} onChange={setSlot} />
      </div>
    </Screen>
  );
};
