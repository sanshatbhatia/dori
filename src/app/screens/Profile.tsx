/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// My Profile: personal details, addresses, fit profile, notifications, security, legal and the
// demo tools used for presentations.

import React, { useState } from 'react';
import { Bell, FileText, FlaskConical, LogOut, MapPin, Pencil, Phone, Ruler, Shield, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { BODY_TYPES } from '../data/catalog';
import { api, demoBackend } from '../services';
import { ApiError, type OtpChallenge } from '../services/api';
import { demoFlags, normalizePhone } from '../services/devBackend';
import type { FitProfile } from '../services/types';
import { useNav } from '../nav';
import { useCustomer, useSession } from '../state/session';
import { AddressForm, emptyAddress, formatAddress, validateAddress, type AddressInput } from '../ui/AddressForm';
import {
  Button,
  ConfirmDialog,
  DemoTag,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  ListRow,
  Note,
  Screen,
  SectionTitle,
  Toggle,
  formatDate,
  formatPhone,
  useToast,
} from '../ui/kit';
import { OtpStep } from './Auth';
import { BodyTypePicker, HeightPicker, MeasurementsView, SizePicker, StylePicker, validHeight } from './Personalize';

export const ProfileScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const { signOut } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const fp = c.fitProfile;
  return (
    <Screen title="My profile" onBack={nav.back}>
      <div className="flex items-center gap-3.5 py-4">
        <span className="w-16 h-16 rounded-full bg-[#174D33] text-white font-serif text-[28px] flex items-center justify-center">{c.fullName.charAt(0).toUpperCase()}</span>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-[23px] font-semibold leading-tight truncate">{c.fullName}</div>
          <div className="text-[13px] text-black/55 flex items-center gap-1.5">
            {formatPhone(c.phone)}
            {c.phoneVerified && (
              <span className="inline-flex items-center gap-0.5 text-[#174D33] text-[11.5px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
          {c.email && <div className="text-[13px] text-black/55 truncate">{c.email}</div>}
        </div>
      </div>
      {c.accountStatus === 'deletion_requested' && <Note>Account deletion requested. Our team will complete it as per the data-retention policy.</Note>}

      <SectionTitle>Account</SectionTitle>
      <ListRow id="profile-edit" icon={<UserRound className="w-4 h-4" />} title="Personal details" detail="Name and email" onClick={() => nav.go({ name: 'profile-edit' })} />
      <ListRow id="profile-phone" icon={<Phone className="w-4 h-4" />} title="Phone number" detail={formatPhone(c.phone)} onClick={() => nav.go({ name: 'phone-change' })} />
      <ListRow
        id="profile-addresses"
        icon={<MapPin className="w-4 h-4" />}
        title="Delivery addresses"
        detail={c.addresses.length ? `${c.addresses.length} saved` : 'None yet — needed before ordering'}
        onClick={() => nav.go({ name: 'addresses' })}
      />

      <SectionTitle>Fit & style</SectionTitle>
      <ListRow
        id="profile-fit"
        icon={<Ruler className="w-4 h-4" />}
        title="Size, height & body type"
        detail={[fp.usualSize && `Size ${fp.usualSize}`, fp.heightCm && `${fp.heightCm} cm`, fp.bodyType && BODY_TYPES.find((b) => b.id === fp.bodyType)?.label].filter(Boolean).join(' · ') || 'Not set'}
        onClick={() => nav.go({ name: 'fit' })}
      />

      <SectionTitle>Settings</SectionTitle>
      <ListRow icon={<Bell className="w-4 h-4" />} title="Notifications & privacy" onClick={() => nav.go({ name: 'notif-prefs' })} />
      <ListRow id="profile-security" icon={<Shield className="w-4 h-4" />} title="Security" detail="Sessions and account deletion" onClick={() => nav.go({ name: 'security' })} />
      <ListRow icon={<FileText className="w-4 h-4" />} title="Terms of service" onClick={() => nav.go({ name: 'legal', doc: 'terms' })} />
      <ListRow icon={<FileText className="w-4 h-4" />} title="Privacy policy" onClick={() => nav.go({ name: 'legal', doc: 'privacy' })} />
      <ListRow id="profile-demo" icon={<FlaskConical className="w-4 h-4" />} title="Demo tools" detail="For presentations and testing" onClick={() => nav.go({ name: 'demo-tools' })} />

      <Button variant="danger" block className="mt-6" id="profile-logout" onClick={() => setConfirmLogout(true)}>
        <LogOut className="w-4 h-4" /> Log out
      </Button>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        body="Your saved designs and orders stay in your account."
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => void signOut()}
      />
    </Screen>
  );
};

export const ProfileEditScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const toast = useToast();
  const { setCustomer, errorMessage } = useSession();
  const [name, setName] = useState(c.fullName);
  const [email, setEmail] = useState(c.email || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setError('');
    if (!name.trim()) return setError('Name cannot be empty.');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      setCustomer(await api.updateProfile({ fullName: name, email }));
      toast('Details saved');
      nav.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Personal details" onBack={nav.back} footer={<Button block loading={busy} onClick={() => void save()} id="profile-save">Save</Button>}>
      <div className="pt-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Full name">
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" optional hint="A secondary contact for receipts and updates.">
          <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Phone" hint="Change it from Phone number — it needs verification.">
          <Input value={formatPhone(c.phone)} disabled />
        </Field>
      </div>
    </Screen>
  );
};

export const PhoneChangeScreen: React.FC = () => {
  const nav = useNav();
  const toast = useToast();
  const { setCustomer } = useSession();
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (challenge) {
    return (
      <OtpStep
        title="Verify new number"
        challenge={challenge}
        onChallenge={setChallenge}
        onBack={() => setChallenge(null)}
        verify={(code) => api.confirmPhoneChange(challenge.phone, code)}
        resend={() => api.requestPhoneChange(challenge.phone)}
        onVerified={(c) => {
          setCustomer(c as never);
          toast('Phone number updated');
          nav.back();
        }}
      />
    );
  }
  return (
    <Screen
      title="Change phone number"
      onBack={nav.back}
      subtitle="Your phone number is your login. We’ll verify the new one with a code."
      footer={
        <Button
          block
          loading={busy}
          id="phone-change-send"
          onClick={async () => {
            setError('');
            if (!normalizePhone(phone)) return setError('Enter a valid 10-digit Indian mobile number.');
            setBusy(true);
            try {
              setChallenge(await api.requestPhoneChange(phone));
            } catch (e) {
              setError(e instanceof ApiError ? e.message : 'Could not send the code.');
            } finally {
              setBusy(false);
            }
          }}
        >
          Send code
        </Button>
      }
    >
      <div className="pt-4">
        <Field label="New mobile number" error={error}>
          <div className="flex gap-2">
            <span className="h-12 px-4 rounded-2xl border border-black/15 flex items-center text-[15px] font-medium">+91</span>
            <Input id="phone-change-input" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} invalid={!!error} />
          </div>
        </Field>
      </div>
    </Screen>
  );
};

export const AddressesScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const toast = useToast();
  const { setCustomer, errorMessage } = useSession();
  const [del, setDel] = useState<string>('');
  return (
    <Screen
      title="Delivery addresses"
      onBack={nav.back}
      footer={
        <Button block id="address-add" onClick={() => nav.go({ name: 'address-edit' })}>
          Add address
        </Button>
      }
    >
      {c.addresses.length === 0 && <EmptyState icon={<MapPin className="w-7 h-7" />} title="No addresses yet" body="Add a delivery address — it’s needed before you place an order." />}
      {c.addresses.map((a) => (
        <div key={a.id} className="p-4 rounded-[20px] border border-black/10 mb-2.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">{a.label}</span>
            {a.isDefault && <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#174D33] text-white">Default</span>}
          </div>
          <p className="text-[13px] text-black/60 mt-1">{formatAddress(a)}</p>
          <div className="flex gap-3 mt-2.5">
            <button className="text-[13px] font-semibold text-[#174D33] flex items-center gap-1" onClick={() => nav.go({ name: 'address-edit', id: a.id })}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            {!a.isDefault && (
              <button
                className="text-[13px] font-semibold text-[#174D33]"
                onClick={async () => {
                  try {
                    setCustomer(await api.saveAddress({ ...a, isDefault: true }));
                  } catch (e) {
                    toast(errorMessage(e));
                  }
                }}
              >
                Make default
              </button>
            )}
            <button className="text-[13px] font-semibold flex items-center gap-1" onClick={() => setDel(a.id)}>
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={!!del}
        title="Remove this address?"
        body="Requests already placed keep the address they were sent with."
        confirmLabel="Remove"
        danger
        onCancel={() => setDel('')}
        onConfirm={async () => {
          const id = del;
          setDel('');
          try {
            setCustomer(await api.deleteAddress(id));
            toast('Address removed');
          } catch (e) {
            toast(errorMessage(e));
          }
        }}
      />
    </Screen>
  );
};

export const AddressEditScreen: React.FC<{ id?: string }> = ({ id }) => {
  const nav = useNav();
  const c = useCustomer();
  const toast = useToast();
  const { setCustomer, errorMessage } = useSession();
  const existing = c.addresses.find((a) => a.id === id);
  const [value, setValue] = useState<AddressInput>(existing ? { ...existing } : { ...emptyAddress(), isDefault: c.addresses.length === 0 });
  const [errors, setErrors] = useState<ReturnType<typeof validateAddress>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      title={existing ? 'Edit address' : 'New address'}
      onBack={nav.back}
      footer={
        <Button
          block
          loading={busy}
          id="address-save"
          onClick={async () => {
            const e = validateAddress(value);
            setErrors(e);
            if (Object.keys(e).length) return;
            setBusy(true);
            setError('');
            try {
              setCustomer(await api.saveAddress(value));
              toast('Address saved');
              nav.back();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          Save address
        </Button>
      }
    >
      <div className="pt-4">
        {error && <ErrorBanner message={error} />}
        <AddressForm value={value} onChange={setValue} errors={errors} />
      </div>
    </Screen>
  );
};

export const FitScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const toast = useToast();
  const { setCustomer, errorMessage } = useSession();
  const [p, setP] = useState<FitProfile>(c.fitProfile);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const patch = (x: Partial<FitProfile>) => setP((y) => ({ ...y, ...x }));
  return (
    <Screen
      title="Fit profile"
      onBack={nav.back}
      footer={
        <Button
          block
          loading={busy}
          onClick={async () => {
            if (!validHeight(p.heightCm)) return setError('Enter a height between 120 and 215 cm.');
            setBusy(true);
            setError('');
            try {
              setCustomer(await api.updateFitProfile({ heightCm: p.heightCm, heightUnit: p.heightUnit, usualSize: p.usualSize, garmentSizes: p.garmentSizes, bodyType: p.bodyType, styles: p.styles }));
              toast('Fit profile saved');
              nav.back();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Save
        </Button>
      }
    >
      <div className="pt-3">
        {error && <ErrorBanner message={error} />}
        <HeightPicker profile={p} onChange={patch} />
        <SizePicker profile={p} onChange={patch} />
        <SectionTitle>Body type</SectionTitle>
        <BodyTypePicker value={p.bodyType} onChange={(b) => patch({ bodyType: b })} />
        <SectionTitle>Your style</SectionTitle>
        <StylePicker value={p.styles} onChange={(v) => patch({ styles: v })} />
        <SectionTitle>Measurements</SectionTitle>
        <MeasurementsView profile={c.fitProfile} />
      </div>
    </Screen>
  );
};

export const NotifPrefsScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const toast = useToast();
  const { setCustomer, errorMessage } = useSession();
  const [p, setP] = useState(c.notificationPrefs);
  const set = async (next: typeof p) => {
    setP(next);
    try {
      setCustomer(await api.updateNotificationPrefs(next));
    } catch (e) {
      toast(errorMessage(e));
      setP(c.notificationPrefs);
    }
  };
  return (
    <Screen title="Notifications & privacy" onBack={nav.back}>
      <SectionTitle>Order updates</SectionTitle>
      <Toggle checked label="In-app notifications" description="Always on for order and consultation updates." onChange={() => undefined} disabled />
      <Toggle checked={p.sms} label="SMS" description="Not connected in this demo" onChange={(v) => void set({ ...p, sms: v })} disabled />
      <Toggle checked={p.whatsapp} label="WhatsApp" description="Not connected in this demo" onChange={(v) => void set({ ...p, whatsapp: v })} disabled />
      <Toggle checked={p.email} label="Email" description={c.email ? 'Not connected in this demo' : 'Add an email in Personal details first'} onChange={(v) => void set({ ...p, email: v })} disabled />
      <SectionTitle>Privacy</SectionTitle>
      <Toggle checked={p.marketing} label="Style tips and offers" description="Occasional inspiration from Dori." onChange={(v) => void set({ ...p, marketing: v })} />
      <Note>Your designs, boards, measurements and addresses are private. Nothing is shared or made public without your explicit choice.</Note>
    </Screen>
  );
};

export const SecurityScreen: React.FC = () => {
  const nav = useNav();
  const c = useCustomer();
  const { signOut, setCustomer, errorMessage } = useSession();
  const toast = useToast();
  const session = api.restoreSession();
  const [confirm, setConfirm] = useState<'' | 'delete'>('');
  const [typed, setTyped] = useState('');
  return (
    <Screen title="Security" onBack={nav.back}>
      <SectionTitle>Sign-in</SectionTitle>
      <ListRow icon={<Phone className="w-4 h-4" />} title="Phone number (OTP login)" detail={`${formatPhone(c.phone)} · verified`} onClick={() => nav.go({ name: 'phone-change' })} />
      <SectionTitle>Active sessions</SectionTitle>
      <div className="p-4 rounded-[20px] border border-black/10">
        <div className="text-[14px] font-semibold">This device</div>
        <div className="text-[12.5px] text-black/55">{session?.device}</div>
        <div className="text-[12px] text-black/45 mt-1">
          Signed in {formatDate(session?.createdAt)} · expires {formatDate(session?.expiresAt)}
        </div>
      </div>
      <Button variant="secondary" block className="mt-3" onClick={() => void signOut('You have been signed out.')}>
        Sign out of this device
      </Button>
      <SectionTitle>Delete account</SectionTitle>
      <p className="text-[13px] text-black/60 leading-relaxed mb-3">
        We’ll remove your profile, designs and boards. Records we’re required to keep (for example invoices and orders in production) are retained
        for the legally required period and then deleted.
      </p>
      <Button variant="danger" block id="security-delete" disabled={c.accountStatus === 'deletion_requested'} onClick={() => setConfirm('delete')}>
        {c.accountStatus === 'deletion_requested' ? 'Deletion requested' : 'Request account deletion'}
      </Button>
      {confirm === 'delete' && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirm('')} />
          <div className="relative w-full bg-white rounded-[24px] p-5">
            <h2 className="font-serif text-[21px] font-semibold">Delete your account?</h2>
            <p className="text-[13px] text-black/60 mt-1.5">Type DELETE to confirm. This can’t be undone once processed.</p>
            <Input className="mt-3" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" id="delete-confirm-input" />
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" block onClick={() => setConfirm('')}>
                Cancel
              </Button>
              <Button
                variant="danger"
                block
                disabled={typed !== 'DELETE'}
                onClick={async () => {
                  setConfirm('');
                  try {
                    setCustomer(await api.requestAccountDeletion());
                    toast('Deletion requested');
                  } catch (e) {
                    toast(errorMessage(e));
                  }
                }}
              >
                Request deletion
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};

const LEGAL = {
  terms: [
    'Draft — for demonstration only. Final terms will be provided by Dori before launch.',
    'Consultation requests are not orders. An order is confirmed only after you approve the design, measurements, price and delivery date agreed with your stylist.',
    'Requested turnarounds, including urgent requests, are subject to the workshop’s capacity and are confirmed by your stylist.',
    'Generic size charts are estimates. Fit is based on the measurements your stylist records or verifies.',
  ],
  privacy: [
    'Draft — for demonstration only. The final privacy policy will be provided by Dori before launch.',
    'We use your phone number to sign you in, and your details to design, make and deliver your orders.',
    'Your measurements, addresses, reference images and designs are private to your account and your assigned stylist.',
    'You can request deletion of your account at any time from Security. Some records are retained where the law requires it.',
  ],
};

export const LegalScreen: React.FC<{ doc: 'terms' | 'privacy' }> = ({ doc }) => {
  const nav = useNav();
  return (
    <Screen title={doc === 'terms' ? 'Terms of service' : 'Privacy policy'} onBack={nav.back}>
      <div className="pt-3 space-y-3">
        <DemoTag>Draft</DemoTag>
        {LEGAL[doc].map((p, i) => (
          <p key={i} className="text-[14px] leading-relaxed text-black/75">
            {p}
          </p>
        ))}
      </div>
    </Screen>
  );
};

export const DemoToolsScreen: React.FC = () => {
  const nav = useNav();
  const toast = useToast();
  const { setCustomer, signedIn, errorMessage } = useSession();
  const [net, setNet] = useState(demoFlags.get().networkFailure);
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen title="Demo tools" onBack={nav.back}>
      <Note icon={<FlaskConical className="w-4 h-4" />}>
        This build runs in <b>test mode</b>: data is stored only on this device, the OTP is 123456, consultation times are samples, and stylist /
        warehouse updates are simulated. These tools help you present and test the app.
      </Note>
      <SectionTitle>Simulate</SectionTitle>
      <Toggle
        checked={net}
        label="Lost network connection"
        description="Every request fails, to show error and retry states."
        onChange={(v) => {
          demoFlags.set({ networkFailure: v });
          setNet(v);
        }}
      />
      <ListRow
        icon={<Ruler className="w-4 h-4" />}
        title="Stylist records measurements"
        detail="Acts as a stylist — customers can’t edit measurements"
        onClick={async () => {
          try {
            setCustomer(await demoBackend.demo.recordSampleMeasurements());
            toast('Sample measurements recorded by the demo stylist');
          } catch (e) {
            toast(errorMessage(e));
          }
        }}
      />
      <ListRow
        icon={<Shield className="w-4 h-4" />}
        title="Try editing measurements as the customer"
        detail="Shows the permission rule"
        onClick={async () => {
          try {
            const c = await api.me();
            await api.recordMeasurements({ role: 'customer', name: c.fullName }, c.id, { unit: 'in', bust: 30 });
          } catch (e) {
            toast(e instanceof ApiError ? e.message : 'Refused');
          }
        }}
      />
      <ListRow
        icon={<ShieldCheck className="w-4 h-4" />}
        title="Expire my session"
        detail="The next request signs you out"
        onClick={() => {
          demoBackend.demo.expireSession();
          void signedIn();
        }}
      />
      <SectionTitle>Reset</SectionTitle>
      <Button variant="danger" block onClick={() => setConfirm(true)}>
        Erase all demo data
      </Button>
      <ConfirmDialog
        open={confirm}
        title="Erase all demo data?"
        body="All demo accounts, designs and requests on this device are deleted."
        confirmLabel="Erase"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          demoBackend.demo.resetAll();
          window.location.reload();
        }}
      />
    </Screen>
  );
};
