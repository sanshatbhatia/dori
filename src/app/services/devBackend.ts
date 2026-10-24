/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// DEMO DATA PROVIDER — test mode only.
// Keeps all data in this browser's localStorage, accepts the fixed test OTP, invents demo
// consultation availability and runs the stylist-assignment job in the browser. None of this is a
// production service: a real backend must provide SMS OTP, the database, file storage, the
// scheduler job and notifications. Demo controls (see `demo` below) let a presenter move requests
// through the workflow; every such change is recorded with actor "demo".

import { ApiError, type DoriApi, type OtpChallenge, type RequestDetail, type Slot, type SubmitRequestInput, type VerifyResult } from './api';
import type {
  AppNotification,
  Board,
  Consultation,
  Customer,
  Design,
  ID,
  Measurements,
  OrderEvent,
  OrderRequest,
  RequestStatus,
  Session,
  Stylist,
} from './types';
import { CONSULTATION, STATUS_LABEL, garmentById, timelineFor } from '../data/catalog';
import { EXPLORE_ITEMS } from '../data/explore';

const DB_KEY = 'dori.demo.db.v1';
const SESSION_KEY = 'dori.demo.session';
const FLAGS_KEY = 'dori.demo.flags';

export const DEMO_OTP = '123456';
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
const LEAD_MS = CONSULTATION.assignLeadHours * 3600 * 1000;

interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number;
  resendAt: number;
  attempts: number;
  purpose: 'login' | 'change_phone';
}

interface DB {
  customers: Customer[];
  sessions: Session[];
  otps: OtpRecord[];
  signupTokens: { token: string; phone: string; expiresAt: number }[];
  designs: Design[];
  boards: Board[];
  requests: OrderRequest[];
  events: OrderEvent[];
  consultations: Consultation[];
  notifications: AppNotification[];
}

const emptyDb = (): DB => ({
  customers: [],
  sessions: [],
  otps: [],
  signupTokens: [],
  designs: [],
  boards: [],
  requests: [],
  events: [],
  consultations: [],
  notifications: [],
});

/** fictional demo stylists — not real people */
export const DEMO_STYLISTS: Stylist[] = [
  { id: 'sty_1', name: 'Aanya (demo stylist)', title: 'Bridal & occasion wear', experience: '8 years', phone: '+91 00000 00001', email: 'stylist1@example.com' },
  { id: 'sty_2', name: 'Meher (demo stylist)', title: 'Everyday & Indo-Western', experience: '5 years', phone: '+91 00000 00002', email: 'stylist2@example.com' },
  { id: 'sty_3', name: 'Ira (demo stylist)', title: 'Tailoring & fit', experience: '11 years', phone: '+91 00000 00003', email: 'stylist3@example.com' },
];

const uid = (p: string) =>
  `${p}_${(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 16)}`;
const nowIso = () => new Date().toISOString();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? { ...emptyDb(), ...JSON.parse(raw) } : emptyDb();
  } catch {
    return emptyDb();
  }
}
function save(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export interface DemoFlags {
  networkFailure: boolean;
}
export const demoFlags = {
  get(): DemoFlags {
    try {
      return { networkFailure: false, ...JSON.parse(localStorage.getItem(FLAGS_KEY) || '{}') };
    } catch {
      return { networkFailure: false };
    }
  },
  set(f: Partial<DemoFlags>) {
    localStorage.setItem(FLAGS_KEY, JSON.stringify({ ...demoFlags.get(), ...f }));
  },
};

export const normalizePhone = (input: string): string | null => {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
};

// deterministic "busy" pattern for demo availability
const busy = (key: string) => {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 4 === 0;
};

class DemoBackend implements DoriApi {
  readonly mode = 'demo' as const;

  /** simulated network round trip; honours the demo "network failure" switch */
  private async net<T>(fn: (db: DB) => T, persist = true): Promise<T> {
    await sleep(280 + Math.random() * 220);
    if (demoFlags.get().networkFailure) throw new ApiError('NETWORK', 'No connection. Check your network and try again.');
    const db = load();
    const assigned = this.runAssignmentJob(db);
    const out = fn(db);
    if (persist || assigned) save(db);
    return out;
  }

  private currentSession(db: DB): Session {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) throw new ApiError('UNAUTHENTICATED', 'Please sign in.');
    const s = db.sessions.find((x) => x.token === token);
    if (!s) throw new ApiError('UNAUTHENTICATED', 'Please sign in.');
    if (Date.parse(s.expiresAt) < Date.now()) throw new ApiError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    return s;
  }
  private customer(db: DB): Customer {
    const s = this.currentSession(db);
    const c = db.customers.find((x) => x.id === s.customerId);
    if (!c) throw new ApiError('UNAUTHENTICATED', 'Please sign in.');
    return c;
  }
  /** records are only returned to their owner, whatever id is asked for */
  private owned<T extends { ownerId?: ID; customerId?: ID }>(db: DB, list: T[], pick: (x: T) => boolean): T {
    const me = this.customer(db).id;
    const item = list.find(pick);
    if (!item || (item.ownerId ?? item.customerId) !== me) throw new ApiError('NOT_FOUND', 'Not found.');
    return item;
  }

  private issueOtp(db: DB, phone: string, purpose: OtpRecord['purpose']): OtpChallenge {
    const existing = db.otps.find((o) => o.phone === phone && o.purpose === purpose);
    if (existing && existing.resendAt > Date.now()) {
      throw new ApiError('RESEND_COOLDOWN', `Please wait ${Math.ceil((existing.resendAt - Date.now()) / 1000)}s before requesting a new code.`);
    }
    db.otps = db.otps.filter((o) => !(o.phone === phone && o.purpose === purpose));
    const rec: OtpRecord = { phone, code: DEMO_OTP, expiresAt: Date.now() + OTP_TTL_MS, resendAt: Date.now() + RESEND_MS, attempts: 0, purpose };
    db.otps.push(rec);
    return { phone, expiresAt: new Date(rec.expiresAt).toISOString(), resendAvailableAt: new Date(rec.resendAt).toISOString(), demoCode: DEMO_OTP };
  }
  private checkOtp(db: DB, phone: string, code: string, purpose: OtpRecord['purpose']) {
    const rec = db.otps.find((o) => o.phone === phone && o.purpose === purpose);
    if (!rec) throw new ApiError('OTP_EXPIRED', 'This code has expired. Request a new one.');
    if (rec.expiresAt < Date.now()) throw new ApiError('OTP_EXPIRED', 'This code has expired. Request a new one.');
    if (rec.attempts >= 5) throw new ApiError('OTP_TOO_MANY', 'Too many attempts. Request a new code.');
    rec.attempts++;
    if (rec.code !== code) throw new ApiError('OTP_INVALID', 'That code is not correct.');
    db.otps = db.otps.filter((o) => o !== rec);
  }
  private startSession(db: DB, customerId: ID): Session {
    const s: Session = {
      token: uid('tok'),
      customerId,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      device: typeof navigator !== 'undefined' ? navigator.userAgent.split(') ')[0].split('(')[1] || 'This device' : 'This device',
    };
    db.sessions.push(s);
    localStorage.setItem(SESSION_KEY, s.token);
    return s;
  }

  // ---- auth --------------------------------------------------------------------------------
  requestOtp(phoneInput: string) {
    return this.net((db) => {
      const phone = normalizePhone(phoneInput);
      if (!phone) throw new ApiError('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number.');
      return this.issueOtp(db, phone, 'login');
    });
  }
  verifyOtp(phoneInput: string, code: string) {
    return this.net<VerifyResult>((db) => {
      const phone = normalizePhone(phoneInput);
      if (!phone) throw new ApiError('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number.');
      try {
        this.checkOtp(db, phone, code, 'login');
      } finally {
        save(db);
      }
      const existing = db.customers.find((c) => c.phone === phone);
      if (existing) return { kind: 'signed_in', session: this.startSession(db, existing.id) };
      const token = uid('signup');
      db.signupTokens.push({ token, phone, expiresAt: Date.now() + 30 * 60 * 1000 });
      return { kind: 'needs_signup', signupToken: token };
    });
  }
  completeSignup(signupToken: string, input: { fullName: string; email?: string }) {
    return this.net((db) => {
      const t = db.signupTokens.find((x) => x.token === signupToken && x.expiresAt > Date.now());
      if (!t) throw new ApiError('OTP_EXPIRED', 'Verification expired. Please verify your number again.');
      if (!input.fullName.trim()) throw new ApiError('VALIDATION', 'Please enter your full name.');
      const c: Customer = {
        id: uid('cus'),
        fullName: input.fullName.trim(),
        phone: t.phone,
        phoneVerified: true,
        email: input.email?.trim() || undefined,
        addresses: [],
        fitProfile: { heightUnit: 'cm', garmentSizes: {} },
        onboarding: { personalizationDone: false },
        notificationPrefs: { inApp: true, sms: false, whatsapp: false, email: false, marketing: false },
        accountStatus: 'active',
        createdAt: nowIso(),
      };
      db.customers.push(c);
      db.signupTokens = db.signupTokens.filter((x) => x !== t);
      const now = nowIso();
      for (const title of ['Wedding Looks', 'Festive Wear', 'Everyday Outfits', 'Office Wear']) {
        db.boards.push({ id: uid('brd'), ownerId: c.id, title, visibility: 'private', items: [], createdAt: now, updatedAt: now });
      }
      return this.startSession(db, c.id);
    });
  }
  restoreSession(): Session | null {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return null;
    return load().sessions.find((s) => s.token === token) || null;
  }
  async logout() {
    const token = localStorage.getItem(SESSION_KEY);
    const db = load();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    save(db);
    localStorage.removeItem(SESSION_KEY);
  }

  // ---- customer ----------------------------------------------------------------------------
  me() {
    return this.net((db) => structuredClone(this.customer(db)), false);
  }
  updateProfile(patch: { fullName?: string; email?: string }) {
    return this.net((db) => {
      const c = this.customer(db);
      if (patch.fullName !== undefined) {
        if (!patch.fullName.trim()) throw new ApiError('VALIDATION', 'Name cannot be empty.');
        c.fullName = patch.fullName.trim();
      }
      if (patch.email !== undefined) {
        const e = patch.email.trim();
        if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ApiError('VALIDATION', 'Enter a valid email address.');
        c.email = e || undefined;
      }
      return structuredClone(c);
    });
  }
  requestPhoneChange(newPhone: string) {
    return this.net((db) => {
      this.customer(db);
      const phone = normalizePhone(newPhone);
      if (!phone) throw new ApiError('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number.');
      if (db.customers.some((c) => c.phone === phone)) throw new ApiError('PHONE_IN_USE', 'This number is already linked to an account.');
      return this.issueOtp(db, phone, 'change_phone');
    });
  }
  confirmPhoneChange(newPhone: string, code: string) {
    return this.net((db) => {
      const c = this.customer(db);
      const phone = normalizePhone(newPhone);
      if (!phone) throw new ApiError('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number.');
      try {
        this.checkOtp(db, phone, code, 'change_phone');
      } finally {
        save(db);
      }
      c.phone = phone;
      c.phoneVerified = true;
      return structuredClone(c);
    });
  }
  saveAddress(a: Parameters<DoriApi['saveAddress']>[0]) {
    return this.net((db) => {
      const c = this.customer(db);
      for (const k of ['label', 'line1', 'locality', 'city', 'state'] as const) {
        if (!a[k]?.trim()) throw new ApiError('VALIDATION', 'Please fill in all address fields.');
      }
      if (!/^\d{6}$/.test(a.postalCode.trim())) throw new ApiError('VALIDATION', 'Enter a 6-digit PIN code.');
      const isDefault = a.isDefault || c.addresses.length === 0 || (a.id ? c.addresses.find((x) => x.id === a.id)?.isDefault : false) || false;
      if (isDefault) c.addresses.forEach((x) => (x.isDefault = false));
      if (a.id) {
        const i = c.addresses.findIndex((x) => x.id === a.id);
        if (i < 0) throw new ApiError('NOT_FOUND', 'Address not found.');
        c.addresses[i] = { ...a, id: a.id, isDefault };
      } else {
        c.addresses.push({ ...a, id: uid('adr'), isDefault });
      }
      return structuredClone(c);
    });
  }
  deleteAddress(id: ID) {
    return this.net((db) => {
      const c = this.customer(db);
      const wasDefault = c.addresses.find((x) => x.id === id)?.isDefault;
      c.addresses = c.addresses.filter((x) => x.id !== id);
      if (wasDefault && c.addresses[0]) c.addresses[0].isDefault = true;
      return structuredClone(c);
    });
  }
  updateFitProfile(patch: Parameters<DoriApi['updateFitProfile']>[0]) {
    return this.net((db) => {
      const c = this.customer(db);
      // measurements can never be changed through this call
      const { ...rest } = patch as Record<string, unknown>;
      delete rest.measurements;
      c.fitProfile = { ...c.fitProfile, ...(rest as typeof patch), measurements: c.fitProfile.measurements, updatedAt: nowIso() };
      return structuredClone(c);
    });
  }
  completePersonalization() {
    return this.net((db) => {
      const c = this.customer(db);
      c.onboarding.personalizationDone = true;
      return structuredClone(c);
    });
  }
  updateNotificationPrefs(prefs: Customer['notificationPrefs']) {
    return this.net((db) => {
      const c = this.customer(db);
      c.notificationPrefs = { ...prefs, inApp: true };
      return structuredClone(c);
    });
  }
  requestAccountDeletion() {
    return this.net((db) => {
      const c = this.customer(db);
      c.accountStatus = 'deletion_requested';
      this.notify(db, c.id, 'Account deletion requested', 'We have received your request. Records we must keep by law (e.g. invoices) are retained for the required period; everything else is removed.');
      return structuredClone(c);
    });
  }
  recordMeasurements(actor: { role: 'customer' | 'stylist' | 'admin'; name: string }, customerId: ID, m: Measurements) {
    return this.net((db) => {
      // permission rule enforced in the service, not just a disabled field in the UI
      if (actor.role !== 'stylist' && actor.role !== 'admin') {
        throw new ApiError('FORBIDDEN', 'Measurements can only be recorded or changed by your stylist.');
      }
      const c = db.customers.find((x) => x.id === customerId);
      if (!c) throw new ApiError('NOT_FOUND', 'Customer not found.');
      c.fitProfile.measurements = { ...m, recordedBy: { role: actor.role, name: actor.name }, verifiedAt: nowIso() };
      this.notify(db, c.id, 'Measurements updated', `${actor.name} recorded your measurements.`);
      return structuredClone(c);
    });
  }

  // ---- designs & boards --------------------------------------------------------------------
  listDesigns() {
    return this.net((db) => {
      const me = this.customer(db).id;
      return structuredClone(db.designs.filter((d) => d.ownerId === me).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }, false);
  }
  getDesign(id: ID) {
    return this.net((db) => structuredClone(this.owned(db, db.designs, (d) => d.id === id)), false);
  }
  saveDesign(input: Parameters<DoriApi['saveDesign']>[0]) {
    return this.net((db) => {
      const me = this.customer(db).id;
      const now = nowIso();
      if (input.id) {
        const d = this.owned(db, db.designs, (x) => x.id === input.id);
        Object.assign(d, input, { ownerId: me, updatedAt: now });
        return structuredClone(d);
      }
      const d: Design = { ...input, id: uid('dsn'), ownerId: me, createdAt: now, updatedAt: now } as Design;
      db.designs.push(d);
      return structuredClone(d);
    });
  }
  duplicateDesign(id: ID) {
    return this.net((db) => {
      const src = this.owned(db, db.designs, (x) => x.id === id);
      const now = nowIso();
      const d: Design = { ...structuredClone(src), id: uid('dsn'), title: `${src.title} (copy)`, createdAt: now, updatedAt: now };
      db.designs.push(d);
      return structuredClone(d);
    });
  }
  deleteDesign(id: ID) {
    return this.net((db) => {
      this.owned(db, db.designs, (x) => x.id === id);
      db.designs = db.designs.filter((d) => d.id !== id);
      db.boards.forEach((b) => (b.items = b.items.filter((i) => i.refId !== id)));
    });
  }
  listBoards() {
    return this.net((db) => {
      const me = this.customer(db).id;
      return structuredClone(db.boards.filter((b) => b.ownerId === me));
    }, false);
  }
  createBoard(title: string) {
    return this.net((db) => {
      const me = this.customer(db).id;
      if (!title.trim()) throw new ApiError('VALIDATION', 'Give the board a name.');
      const now = nowIso();
      const b: Board = { id: uid('brd'), ownerId: me, title: title.trim(), visibility: 'private', items: [], createdAt: now, updatedAt: now };
      db.boards.push(b);
      return structuredClone(b);
    });
  }
  renameBoard(id: ID, title: string) {
    return this.net((db) => {
      const b = this.owned(db, db.boards, (x) => x.id === id);
      if (!title.trim()) throw new ApiError('VALIDATION', 'Give the board a name.');
      b.title = title.trim();
      b.updatedAt = nowIso();
      return structuredClone(b);
    });
  }
  deleteBoard(id: ID) {
    return this.net((db) => {
      this.owned(db, db.boards, (x) => x.id === id);
      db.boards = db.boards.filter((b) => b.id !== id);
    });
  }
  addToBoard(boardId: ID, item: { kind: 'design' | 'explore'; refId: ID }) {
    return this.net((db) => {
      const b = this.owned(db, db.boards, (x) => x.id === boardId);
      if (item.kind === 'design') {
        this.owned(db, db.designs, (x) => x.id === item.refId);
        // a design lives on one board at a time: moving it takes it off the others
        db.boards.filter((x) => x.ownerId === b.ownerId).forEach((x) => (x.items = x.items.filter((i) => i.refId !== item.refId)));
      }
      if (!b.items.some((i) => i.refId === item.refId)) b.items.unshift({ ...item, addedAt: nowIso() });
      b.updatedAt = nowIso();
      return structuredClone(b);
    });
  }
  removeFromBoard(boardId: ID, refId: ID) {
    return this.net((db) => {
      const b = this.owned(db, db.boards, (x) => x.id === boardId);
      b.items = b.items.filter((i) => i.refId !== refId);
      b.updatedAt = nowIso();
      return structuredClone(b);
    });
  }

  // ---- explore -----------------------------------------------------------------------------
  async listExplore() {
    await sleep(200);
    if (demoFlags.get().networkFailure) throw new ApiError('NETWORK', 'No connection. Check your network and try again.');
    return EXPLORE_ITEMS;
  }

  // ---- scheduling, requests ----------------------------------------------------------------
  private takenSlots(db: DB) {
    return new Set(db.consultations.filter((c) => c.status === 'scheduled').map((c) => c.slotStart));
  }
  private slotsFor(db: DB, days: number) {
    const taken = this.takenSlots(db);
    const out: { date: string; slots: Slot[] }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let d = 0; d < days; d++) {
      const day = new Date(base.getTime() + d * 86400000);
      const slots: Slot[] = [];
      for (let h = CONSULTATION.openHour; h < CONSULTATION.closeHour; h++) {
        const start = new Date(day);
        start.setHours(h, 0, 0, 0);
        const iso = start.toISOString();
        const available = start.getTime() > Date.now() + 30 * 60000 && day.getDay() !== 0 && !busy(iso) && !taken.has(iso);
        slots.push({ start: iso, available });
      }
      out.push({ date: day.toISOString(), slots });
    }
    return out;
  }
  listSlots(days: number) {
    return this.net((db) => this.slotsFor(db, days), false);
  }
  private isSlotOpen(db: DB, start: string) {
    return this.slotsFor(db, CONSULTATION.daysAhead).some((d) => d.slots.some((s) => s.start === start && s.available));
  }
  submitRequest(input: SubmitRequestInput) {
    return this.net((db) => {
      const c = this.customer(db);
      // a repeated submission (refresh, double tap) returns the request already created
      const dup = db.requests.find((r) => r.customerId === c.id && r.idempotencyKey === input.idempotencyKey);
      if (dup) return structuredClone(dup);
      const address = c.addresses.find((a) => a.id === input.addressId);
      if (!address) throw new ApiError('VALIDATION', 'Add a delivery address before submitting.');
      if (!this.isSlotOpen(db, input.slotStart)) throw new ApiError('SLOT_UNAVAILABLE', 'That consultation slot was just taken. Please choose another time.');
      const design = this.owned(db, db.designs, (d) => d.id === input.design.id);
      const now = nowIso();
      const reqId = uid('req');
      const consult: Consultation = {
        id: uid('con'),
        customerId: c.id,
        requestId: reqId,
        slotStart: input.slotStart,
        durationMin: CONSULTATION.durationMin,
        mode: input.mode,
        // booked inside the 2-hour window: assignment starts straight away
        assignment: Date.parse(input.slotStart) - Date.now() <= LEAD_MS ? 'in_progress' : 'pending',
        status: 'scheduled',
      };
      const r: OrderRequest = {
        id: reqId,
        reference: `DORI-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        customerId: c.id,
        designId: design.id,
        designSnapshot: structuredClone(design),
        garmentId: design.garmentId,
        fabric: input.fabric,
        urgency: { ...input.urgency, feasibility: 'pending_review' },
        addressId: address.id,
        addressSnapshot: structuredClone(address),
        consultationId: consult.id,
        status: 'consultation_requested',
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };
      db.requests.push(r);
      db.consultations.push(consult);
      this.event(db, r, 'consultation_requested', 'customer', 'You requested a stylist consultation.');
      this.notify(db, c.id, 'Consultation requested', `Request ${r.reference} received. Your stylist will be assigned at least 2 hours before your consultation.`, r.id);
      this.runAssignmentJob(db);
      return structuredClone(r);
    });
  }
  listRequests() {
    return this.net((db) => {
      const me = this.customer(db).id;
      return structuredClone(db.requests.filter((r) => r.customerId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
  }
  private detail(db: DB, r: OrderRequest): RequestDetail {
    const consultation = db.consultations.find((c) => c.id === r.consultationId)!;
    const s = consultation.stylistId ? DEMO_STYLISTS.find((x) => x.id === consultation.stylistId) : undefined;
    const contactReleased = !!s && consultation.assignment === 'assigned';
    return {
      request: structuredClone(r),
      events: structuredClone(db.events.filter((e) => e.requestId === r.id).sort((a, b) => a.at.localeCompare(b.at))),
      consultation: structuredClone(consultation),
      stylist: s ? { ...s, phone: contactReleased ? s.phone : '', email: contactReleased ? s.email : '', contactReleased } : undefined,
    };
  }
  getRequest(id: ID) {
    return this.net((db) => this.detail(db, this.owned(db, db.requests, (r) => r.id === id)));
  }
  cancelRequest(id: ID) {
    return this.net((db) => {
      const r = this.owned(db, db.requests, (x) => x.id === id);
      if (timelineFor(r.garmentId).indexOf(r.status) >= timelineFor(r.garmentId).indexOf('order_confirmed')) {
        throw new ApiError('NOT_ALLOWED', 'This order is already in production. Contact your stylist to discuss changes.');
      }
      const con = db.consultations.find((c) => c.id === r.consultationId)!;
      con.status = 'cancelled';
      this.event(db, r, 'cancelled', 'customer', 'You cancelled this request.');
      return this.detail(db, r);
    });
  }
  rescheduleConsultation(requestId: ID, slotStart: string) {
    return this.net((db) => {
      const r = this.owned(db, db.requests, (x) => x.id === requestId);
      if (!['consultation_requested', 'stylist_assigned'].includes(r.status)) throw new ApiError('NOT_ALLOWED', 'This consultation can no longer be rescheduled.');
      const con = db.consultations.find((c) => c.id === r.consultationId)!;
      if (!this.isSlotOpen(db, slotStart)) throw new ApiError('SLOT_UNAVAILABLE', 'That slot is not available. Please choose another time.');
      con.slotStart = slotStart;
      if (con.assignment !== 'assigned') con.assignment = Date.parse(slotStart) - Date.now() <= LEAD_MS ? 'in_progress' : 'pending';
      this.notify(db, r.customerId, 'Consultation rescheduled', `Request ${r.reference} moved to ${new Date(slotStart).toLocaleString()}.`, r.id);
      this.runAssignmentJob(db);
      return this.detail(db, r);
    });
  }

  // ---- notifications -----------------------------------------------------------------------
  listNotifications() {
    return this.net((db) => {
      const me = this.customer(db).id;
      return structuredClone(db.notifications.filter((n) => n.customerId === me).sort((a, b) => b.at.localeCompare(a.at)));
    });
  }
  markNotificationsRead() {
    return this.net((db) => {
      const me = this.customer(db).id;
      db.notifications.filter((n) => n.customerId === me).forEach((n) => (n.read = true));
    });
  }

  // ---- internals ---------------------------------------------------------------------------
  private notify(db: DB, customerId: ID, title: string, body: string, requestId?: ID) {
    db.notifications.push({ id: uid('ntf'), customerId, title, body, at: nowIso(), read: false, requestId });
  }
  private event(db: DB, r: OrderRequest, to: RequestStatus, actor: OrderEvent['actor'], message: string) {
    db.events.push({ id: uid('evt'), requestId: r.id, from: r.status, to, at: nowIso(), actor, message });
    r.status = to;
    r.updatedAt = nowIso();
  }

  /**
   * Stylist assignment job. In production this is a backend scheduler (cron/queue) that runs
   * every few minutes; here it runs in the browser whenever the demo backend is used, and on a
   * timer while the app is open. Rule: assign no later than 2 hours before the consultation;
   * if the consultation was booked inside that window, assign immediately.
   */
  runAssignmentJob(db: DB) {
    let changed = false;
    for (const con of db.consultations) {
      if (con.status !== 'scheduled' || con.assignment === 'assigned') continue;
      const due = Date.parse(con.slotStart) - LEAD_MS;
      const r = db.requests.find((x) => x.id === con.requestId);
      if (!r || r.status === 'cancelled') continue;
      if (Date.now() < due && con.assignment === 'pending') continue;
      // round-robin over the demo roster, skipping stylists already booked at that time
      const busyIds = new Set(db.consultations.filter((c) => c !== con && c.slotStart === con.slotStart && c.stylistId).map((c) => c.stylistId));
      const s = DEMO_STYLISTS.find((x) => !busyIds.has(x.id));
      if (!s) {
        con.assignment = 'failed';
        this.notify(db, r.customerId, 'Finding your stylist', `We're reassigning request ${r.reference}. We'll update you shortly.`, r.id);
        changed = true;
        continue;
      }
      con.assignment = 'assigned';
      con.stylistId = s.id;
      con.assignedAt = nowIso();
      if (r.status === 'consultation_requested') this.event(db, r, 'stylist_assigned', 'system', `${s.name} is your stylist for this consultation.`);
      this.notify(db, r.customerId, 'Your stylist is assigned', `${s.name} will take your consultation. Contact details are on the request page.`, r.id);
      changed = true;
    }
    return changed;
  }

  // ---- demo controls (presenter only; recorded with actor "demo") --------------------------
  demo = {
    /** move the consultation so it is due for assignment now, then run the job */
    fastForwardToAssignment: async (requestId: ID) =>
      this.net((db) => {
        const r = this.owned(db, db.requests, (x) => x.id === requestId);
        const con = db.consultations.find((c) => c.id === r.consultationId)!;
        // simulates the clock reaching 2 hours before the consultation
        if (con.assignment === 'pending') con.assignment = 'in_progress';
        this.runAssignmentJob(db);
        return this.detail(db, r);
      }),
    advance: async (requestId: ID) =>
      this.net((db) => {
        const r = this.owned(db, db.requests, (x) => x.id === requestId);
        const tl = timelineFor(r.garmentId);
        const i = tl.indexOf(r.status);
        if (r.status === 'cancelled' || i < 0 || i >= tl.length - 1) return this.detail(db, r);
        const con = db.consultations.find((c) => c.id === r.consultationId)!;
        if (r.status === 'consultation_requested') {
          con.assignment = 'in_progress';
          this.runAssignmentJob(db);
          return this.detail(db, r);
        }
        const next = tl[i + 1];
        if (next === 'consultation_completed') con.status = 'completed';
        if (next === 'awaiting_approval') {
          const g = garmentById(r.garmentId);
          const complex = g && ['lehenga', 'anarkali', 'gown', 'corset', 'sharara'].includes(g.silhouette);
          r.urgency.feasibility = r.urgency.optionId === 'urgent_48h' && complex ? 'not_feasible' : 'feasible';
          if (r.urgency.feasibility === 'not_feasible') {
            this.notify(db, r.customerId, 'Requested turnaround not possible', `The 48-hour request for ${r.reference} can't be met for this garment. Your stylist will offer the earliest feasible date before anything is confirmed.`, r.id);
          }
        }
        if (next === 'order_confirmed') {
          r.pricing = { confirmed: false };
          r.expectedDelivery = new Date(Date.now() + 14 * 86400000).toISOString();
        }
        this.event(db, r, next, 'demo', STATUS_LABEL[next]);
        this.notify(db, r.customerId, STATUS_LABEL[next], `Request ${r.reference} is now: ${STATUS_LABEL[next].toLowerCase()}.`, r.id);
        return this.detail(db, r);
      }),
    recordSampleMeasurements: async () => {
      const db = load();
      const c = this.customer(db);
      return this.recordMeasurements({ role: 'stylist', name: DEMO_STYLISTS[0].name }, c.id, {
        unit: 'in',
        bust: 34,
        waist: 28,
        hip: 38,
        shoulder: 14.5,
        armLength: 22,
        blouseLength: 14,
        skirtLength: 41,
      });
    },
    expireSession: () => {
      const db = load();
      const token = localStorage.getItem(SESSION_KEY);
      const s = db.sessions.find((x) => x.token === token);
      if (s) s.expiresAt = new Date(Date.now() - 1000).toISOString();
      save(db);
    },
    resetAll: () => {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(FLAGS_KEY);
      sessionStorage.clear();
    },
    tick: () => {
      const db = load();
      if (this.runAssignmentJob(db)) {
        save(db);
        return true;
      }
      return false;
    },
  };
}

export const demoBackend = new DemoBackend();
