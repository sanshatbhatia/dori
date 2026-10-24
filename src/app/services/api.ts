/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The one interface every screen talks to. In this build it is backed by the demo provider
// (devBackend.ts), which keeps data on this device only. A production backend (auth with real SMS
// OTP, database, storage, scheduler, notifications) implements the same interface.

import type {
  Address,
  AppNotification,
  Board,
  Consultation,
  Customer,
  Design,
  ExploreItem,
  FabricInfo,
  FitProfile,
  ID,
  Measurements,
  NotificationPrefs,
  OrderEvent,
  OrderRequest,
  Session,
  Stylist,
} from './types';

export type ApiErrorCode =
  | 'NETWORK'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_PHONE'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_TOO_MANY'
  | 'RESEND_COOLDOWN'
  | 'PHONE_IN_USE'
  | 'SLOT_UNAVAILABLE'
  | 'VALIDATION'
  | 'NOT_ALLOWED';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface OtpChallenge {
  phone: string;
  expiresAt: string;
  resendAvailableAt: string;
  /** shown only in demo mode so testers can sign in without SMS */
  demoCode?: string;
}

export type VerifyResult = { kind: 'signed_in'; session: Session } | { kind: 'needs_signup'; signupToken: string };

export interface Slot {
  start: string;
  available: boolean;
}

export interface SubmitRequestInput {
  design: Design;
  fabric: FabricInfo;
  urgency: { optionId: string; desiredDate?: string };
  addressId: ID;
  slotStart: string;
  mode: 'video' | 'phone';
  idempotencyKey: string;
}

export interface RequestDetail {
  request: OrderRequest;
  events: OrderEvent[];
  consultation: Consultation;
  /** contact details are only released once assigned and within the 2-hour window */
  stylist?: Stylist & { contactReleased: boolean };
}

export interface DoriApi {
  readonly mode: 'demo' | 'production';

  // auth
  requestOtp(phone: string): Promise<OtpChallenge>;
  verifyOtp(phone: string, code: string): Promise<VerifyResult>;
  completeSignup(signupToken: string, input: { fullName: string; email?: string }): Promise<Session>;
  restoreSession(): Session | null;
  logout(): Promise<void>;

  // customer
  me(): Promise<Customer>;
  updateProfile(patch: { fullName?: string; email?: string }): Promise<Customer>;
  requestPhoneChange(newPhone: string): Promise<OtpChallenge>;
  confirmPhoneChange(newPhone: string, code: string): Promise<Customer>;
  saveAddress(address: Omit<Address, 'id'> & { id?: ID }): Promise<Customer>;
  deleteAddress(id: ID): Promise<Customer>;
  updateFitProfile(patch: Partial<Omit<FitProfile, 'measurements'>>): Promise<Customer>;
  completePersonalization(): Promise<Customer>;
  updateNotificationPrefs(prefs: NotificationPrefs): Promise<Customer>;
  requestAccountDeletion(): Promise<Customer>;
  /** only a stylist or administrator may record measurements */
  recordMeasurements(actor: { role: 'customer' | 'stylist' | 'admin'; name: string }, customerId: ID, m: Measurements): Promise<Customer>;

  // designs & boards
  listDesigns(): Promise<Design[]>;
  getDesign(id: ID): Promise<Design>;
  saveDesign(design: Omit<Design, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { id?: ID }): Promise<Design>;
  duplicateDesign(id: ID): Promise<Design>;
  deleteDesign(id: ID): Promise<void>;
  listBoards(): Promise<Board[]>;
  createBoard(title: string): Promise<Board>;
  renameBoard(id: ID, title: string): Promise<Board>;
  deleteBoard(id: ID): Promise<void>;
  addToBoard(boardId: ID, item: { kind: 'design' | 'explore'; refId: ID }): Promise<Board>;
  removeFromBoard(boardId: ID, refId: ID): Promise<Board>;

  // explore
  listExplore(): Promise<ExploreItem[]>;

  // consultation & orders
  listSlots(days: number): Promise<{ date: string; slots: Slot[] }[]>;
  submitRequest(input: SubmitRequestInput): Promise<OrderRequest>;
  listRequests(): Promise<OrderRequest[]>;
  getRequest(id: ID): Promise<RequestDetail>;
  cancelRequest(id: ID): Promise<RequestDetail>;
  rescheduleConsultation(requestId: ID, slotStart: string): Promise<RequestDetail>;

  // notifications
  listNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<void>;
}
