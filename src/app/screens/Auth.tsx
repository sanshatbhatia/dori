/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sign in / sign up with phone number + OTP. In this build the OTP is the demo code (no SMS is
// sent); the screens are labelled accordingly.

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, ShieldCheck } from 'lucide-react';
import { api } from '../services';
import { ApiError, type OtpChallenge } from '../services/api';
import { normalizePhone } from '../services/devBackend';
import { useSession } from '../state/session';
import { Button, DemoTag, ErrorBanner, Field, Input, Note, Screen, formatPhone } from '../ui/kit';

type Step = 'welcome' | 'phone' | 'otp' | 'details';

export const Wordmark: React.FC<{ size?: number; className?: string }> = ({ size = 44, className }) => (
  <span className={`font-serif font-semibold tracking-[0.02em] text-[#174D33] ${className || ''}`} style={{ fontSize: size, lineHeight: 1 }}>
    Dori
  </span>
);

export const AuthFlow: React.FC = () => {
  const { notice, signedIn } = useSession();
  const [step, setStep] = useState<Step>('welcome');
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [signupToken, setSignupToken] = useState('');

  if (step === 'welcome') {
    return (
      <div className="flex-1 flex flex-col bg-white font-sans text-black px-6 pt-16 pb-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Wordmark size={64} />
          <p className="font-serif text-[22px] mt-4 leading-snug">Design it. We’ll tailor it.</p>
          <p className="text-[13.5px] text-black/55 mt-2 max-w-[280px] leading-relaxed">
            Custom clothing designed by you, refined with a stylist and made by Dori’s tailors.
          </p>
          {notice && (
            <div className="mt-6 w-full">
              <ErrorBanner message={notice} />
            </div>
          )}
        </div>
        <Button block id="auth-start" onClick={() => setStep('phone')}>
          Continue with phone number
        </Button>
        <p className="text-center text-[11.5px] text-black/45 mt-4 leading-relaxed">
          New or returning — we’ll recognise your number. By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    );
  }

  if (step === 'phone') {
    return (
      <PhoneStep
        phone={phone}
        onPhone={setPhone}
        onBack={() => setStep('welcome')}
        onSent={(c) => {
          setChallenge(c);
          setStep('otp');
        }}
      />
    );
  }

  if (step === 'otp' && challenge) {
    return (
      <OtpStep
        challenge={challenge}
        onChallenge={setChallenge}
        onBack={() => setStep('phone')}
        verify={(code) => api.verifyOtp(challenge.phone, code)}
        resend={() => api.requestOtp(challenge.phone)}
        onVerified={async (r) => {
          if (r.kind === 'signed_in') await signedIn();
          else {
            setSignupToken(r.signupToken);
            setStep('details');
          }
        }}
      />
    );
  }

  return <DetailsStep signupToken={signupToken} onDone={() => void signedIn()} onRestart={() => setStep('phone')} />;
};

const PhoneStep: React.FC<{ phone: string; onPhone: (p: string) => void; onBack: () => void; onSent: (c: OtpChallenge) => void }> = ({
  phone,
  onPhone,
  onBack,
  onSent,
}) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!normalizePhone(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      onSent(await api.requestOtp(phone));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen
      onBack={onBack}
      title="Your phone number"
      subtitle="We’ll send a one-time code to verify it. Your number is your Dori login."
      footer={
        <Button block loading={loading} id="phone-continue" onClick={() => void submit()}>
          Send code
        </Button>
      }
    >
      <form onSubmit={submit} className="pt-4">
        <Field label="Mobile number" error={error}>
          <div className="flex gap-2">
            <span className="h-12 px-4 rounded-2xl border border-black/15 flex items-center text-[15px] font-medium">+91</span>
            <Input
              id="phone-input"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              maxLength={14}
              value={phone}
              invalid={!!error}
              onChange={(e) => onPhone(e.target.value.replace(/[^\d ]/g, ''))}
              autoFocus
            />
          </div>
        </Field>
      </form>
      <Note icon={<ShieldCheck className="w-4 h-4" />}>
        <span className="flex items-center gap-2 mb-1">
          <DemoTag>Test mode</DemoTag>
        </span>
        No SMS is sent in this demo. On the next screen use the test code <b>123456</b>.
      </Note>
    </Screen>
  );
};

export const OtpStep: React.FC<{
  challenge: OtpChallenge;
  onChallenge: (c: OtpChallenge) => void;
  onBack: () => void;
  verify: (code: string) => Promise<unknown>;
  resend: () => Promise<OtpChallenge>;
  onVerified: (r: never) => void | Promise<void>;
  title?: string;
}> = ({ challenge, onChallenge, onBack, verify, resend, onVerified, title = 'Enter the code' }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const resendIn = Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000));
  const expired = Date.parse(challenge.expiresAt) < now;
  const code = digits.join('');

  const submit = async (c = code) => {
    if (c.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await verify(c);
      await onVerified(r as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify. Try again.');
      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      // pasted code
      const next = clean.slice(0, 6).split('');
      while (next.length < 6) next.push('');
      setDigits(next);
      if (clean.length >= 6) void submit(clean.slice(0, 6));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (clean && i === 5 && next.join('').length === 6) void submit(next.join(''));
  };

  return (
    <Screen
      onBack={onBack}
      title={title}
      subtitle={`Sent to ${formatPhone(challenge.phone)}`}
      footer={
        <Button block loading={loading} id="otp-verify" onClick={() => void submit()} disabled={expired}>
          Verify
        </Button>
      }
    >
      <div className="flex gap-2 justify-between pt-6" role="group" aria-label="One-time code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`otp-${i}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            className={`w-12 h-14 rounded-2xl border text-center text-[22px] font-semibold outline-none focus:border-[#174D33] focus:ring-2 focus:ring-[#174D33]/15 ${
              error ? 'border-black' : 'border-black/15'
            }`}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
      {expired && !error && <div className="mt-4"><ErrorBanner message="This code has expired. Request a new one." /></div>}
      <div className="mt-5 text-center text-[13px] text-black/60">
        {resendIn > 0 ? (
          <span>Resend code in {resendIn}s</span>
        ) : (
          <button
            id="otp-resend"
            className="font-semibold text-[#174D33] underline underline-offset-2"
            onClick={async () => {
              setError('');
              try {
                onChallenge(await resend());
                setDigits(Array(6).fill(''));
              } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Could not resend. Try again.');
              }
            }}
          >
            Resend code
          </button>
        )}
      </div>
      {challenge.demoCode && (
        <Note icon={<MessageSquareText className="w-4 h-4" />}>
          <span className="flex items-center gap-2 mb-1">
            <DemoTag>Test mode</DemoTag>
          </span>
          Test code: <b>{challenge.demoCode}</b>. A real SMS code would arrive here once an SMS provider is connected.
        </Note>
      )}
    </Screen>
  );
};

const DetailsStep: React.FC<{ signupToken: string; onDone: () => void; onRestart: () => void }> = ({ signupToken, onDone, onRestart }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Please enter your full name.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await api.completeSignup(signupToken, { fullName: name, email });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OTP_EXPIRED') {
        onRestart();
        return;
      }
      setErrors({ form: err instanceof ApiError ? err.message : 'Could not create your account. Try again.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen
      title="Welcome to Dori"
      subtitle="Your number is verified. Tell us your name to create your account."
      footer={
        <Button block loading={loading} id="signup-continue" onClick={() => void submit()}>
          Create account
        </Button>
      }
    >
      <div className="pt-4">
        {errors.form && <ErrorBanner message={errors.form} />}
        <Field label="Full name" error={errors.name}>
          <Input id="signup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} autoFocus />
        </Field>
        <Field label="Email address" optional error={errors.email} hint="For order receipts and updates. You can add it later.">
          <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
        </Field>
        <p className="text-[12px] text-black/50 leading-relaxed">
          You’ll add a delivery address before placing your first order.
        </p>
      </div>
    </Screen>
  );
};
