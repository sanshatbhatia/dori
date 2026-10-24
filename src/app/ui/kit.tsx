/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dori UI kit: white surfaces, black text, forest green (#174D33) for actions, selection and
// navigation. Shades come from transparency of those three colours only.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ChevronRight, FlaskConical, Loader2, X } from 'lucide-react';

export const GREEN = '#174D33';

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');

// ---- layout ---------------------------------------------------------------------------------

export const Screen: React.FC<{
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  progress?: { step: number; total: number; label?: string };
  bodyClass?: string;
  id?: string;
}> = ({ title, subtitle, onBack, right, footer, children, progress, bodyClass, id }) => (
  <div id={id} className="flex-1 min-h-0 flex flex-col bg-white text-black font-sans">
    {(title || onBack || right) && (
      <header className="flex-none px-4 pt-2 pb-2">
        <div className="h-11 flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {title && <h1 className="font-serif text-[23px] font-semibold leading-tight truncate">{title}</h1>}
          </div>
          {right}
        </div>
        {subtitle && <p className="text-[13px] text-black/60 leading-snug mt-0.5">{subtitle}</p>}
        {progress && <Progress {...progress} />}
      </header>
    )}
    <main className={cx('flex-1 min-h-0 overflow-y-auto px-4 pb-6', bodyClass)}>{children}</main>
    {footer && <footer className="flex-none px-4 pt-3 pb-3 border-t border-black/[0.06] bg-white">{footer}</footer>}
  </div>
);

export const Progress: React.FC<{ step: number; total: number; label?: string }> = ({ step, total, label }) => (
  <div className="mt-2" aria-label={`Step ${step} of ${total}`}>
    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-black/50 mb-1.5">
      <span>{label}</span>
      <span>
        Step {step} of {total}
      </span>
    </div>
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx('h-[3px] flex-1 rounded-full', i < step ? 'bg-[#174D33]' : 'bg-black/10')} />
      ))}
    </div>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mt-6 mb-2.5">
    <h2 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-black/55">{children}</h2>
    {action}
  </div>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { selected?: boolean; interactive?: boolean }> = ({
  selected,
  interactive,
  className,
  ...rest
}) => (
  <div
    {...rest}
    className={cx(
      'rounded-[20px] bg-white border transition',
      selected ? 'border-[#174D33] ring-1 ring-[#174D33] bg-[#174D33]/[0.04]' : 'border-black/10',
      interactive && 'cursor-pointer hover:border-black/25 active:scale-[0.99]',
      className,
    )}
  />
);

// ---- controls -------------------------------------------------------------------------------

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; block?: boolean; size?: 'md' | 'sm' }
> = ({ variant = 'primary', loading, block, size = 'md', className, children, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 select-none',
      size === 'md' ? 'h-12 px-6 text-[15px]' : 'h-9 px-4 text-[13px]',
      variant === 'primary' && 'bg-[#174D33] text-white hover:bg-[#174D33]/90',
      variant === 'secondary' && 'border border-[#174D33] text-[#174D33] bg-white hover:bg-[#174D33]/5',
      variant === 'ghost' && 'text-[#174D33] hover:bg-[#174D33]/5',
      variant === 'danger' && 'border border-black text-black bg-white hover:bg-black/5',
      block && 'w-full',
      className,
    )}
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {children}
  </button>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, error, optional, children }) => (
  <label className="block mb-4">
    <span className="flex items-baseline justify-between mb-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      {optional && <span className="text-[11px] text-black/45">Optional</span>}
    </span>
    {children}
    {error ? (
      <span role="alert" className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-black">
        <AlertCircle className="w-3.5 h-3.5 text-[#174D33]" /> {error}
      </span>
    ) : (
      hint && <span className="block mt-1.5 text-[12px] text-black/50">{hint}</span>
    )}
  </label>
);

export const inputClass =
  'w-full h-12 px-4 rounded-2xl border border-black/15 bg-white text-[15px] text-black placeholder:text-black/35 outline-none focus:border-[#174D33] focus:ring-2 focus:ring-[#174D33]/15 transition';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...rest }, ref) => <input ref={ref} {...rest} className={cx(inputClass, invalid && 'border-black', className)} />,
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength: number }> = ({ value, maxLength, className, ...rest }) => (
  <div>
    <textarea
      {...rest}
      value={value}
      maxLength={maxLength}
      className={cx(inputClass, 'h-auto min-h-[110px] py-3 resize-none leading-relaxed', className)}
    />
    <div className="text-right text-[11px] text-black/45 mt-1">
      {String(value ?? '').length}/{maxLength}
    </div>
  </div>
);

export const Choice: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  art?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
  id?: string;
}> = ({ selected, onClick, title, description, art, disabled, badge, id }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={cx(
      'w-full text-left flex items-center gap-3.5 p-3.5 rounded-[20px] border transition mb-2.5 disabled:opacity-45',
      selected ? 'border-[#174D33] ring-1 ring-[#174D33] bg-[#174D33]/[0.04]' : 'border-black/10 hover:border-black/25',
    )}
  >
    {art && <span className="flex-none w-14 h-14 rounded-2xl bg-[#174D33]/[0.06] flex items-center justify-center text-[#174D33]">{art}</span>}
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-2">
        <span className="text-[15px] font-semibold">{title}</span>
        {badge && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-black/60">{badge}</span>}
      </span>
      {description && <span className="block text-[12.5px] text-black/55 leading-snug mt-0.5">{description}</span>}
    </span>
    <span
      className={cx(
        'flex-none w-6 h-6 rounded-full border flex items-center justify-center',
        selected ? 'bg-[#174D33] border-[#174D33] text-white' : 'border-black/20',
      )}
    >
      {selected && <Check className="w-3.5 h-3.5" />}
    </span>
  </button>
);

export const Chip: React.FC<{ selected?: boolean; onClick?: () => void; children: React.ReactNode; id?: string }> = ({
  selected,
  onClick,
  children,
  id,
}) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cx(
      'flex-none h-9 px-4 rounded-full text-[13px] font-medium border transition whitespace-nowrap',
      selected ? 'bg-[#174D33] border-[#174D33] text-white' : 'border-black/15 text-black hover:border-black/30',
    )}
  >
    {children}
  </button>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-45"
  >
    <span className="flex-1">
      <span className="block text-[14.5px] font-medium">{label}</span>
      {description && <span className="block text-[12px] text-black/50">{description}</span>}
    </span>
    <span className={cx('w-11 h-6 rounded-full p-0.5 transition', checked ? 'bg-[#174D33]' : 'bg-black/15')}>
      <span className={cx('block w-5 h-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </span>
  </button>
);

export const ListRow: React.FC<{ icon?: React.ReactNode; title: string; detail?: string; onClick?: () => void; id?: string; right?: React.ReactNode }> = ({
  icon,
  title,
  detail,
  onClick,
  id,
  right,
}) => (
  <button id={id} onClick={onClick} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-black/[0.06] last:border-0">
    {icon && <span className="w-9 h-9 rounded-full bg-[#174D33]/[0.07] text-[#174D33] flex items-center justify-center">{icon}</span>}
    <span className="flex-1 min-w-0">
      <span className="block text-[14.5px] font-medium">{title}</span>
      {detail && <span className="block text-[12px] text-black/50 truncate">{detail}</span>}
    </span>
    {right ?? <ChevronRight className="w-4 h-4 text-black/35" />}
  </button>
);

// ---- states ---------------------------------------------------------------------------------

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-black/50 gap-3" role="status">
    <Loader2 className="w-6 h-6 animate-spin text-[#174D33]" />
    <span className="text-[13px]">{label}…</span>
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <div className="flex flex-col items-center text-center px-6 py-12">
    <div className="w-16 h-16 rounded-full bg-[#174D33]/[0.07] text-[#174D33] flex items-center justify-center mb-4">{icon}</div>
    <h3 className="font-serif text-[21px] font-semibold">{title}</h3>
    <p className="text-[13.5px] text-black/55 mt-1.5 mb-5 leading-relaxed">{body}</p>
    {action}
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-black/80 bg-white mb-4">
    <AlertCircle className="w-4.5 h-4.5 mt-0.5 flex-none" />
    <div className="flex-1 text-[13px] leading-snug">{message}</div>
    {onRetry && (
      <button onClick={onRetry} className="text-[13px] font-semibold text-[#174D33] underline underline-offset-2">
        Retry
      </button>
    )}
  </div>
);

export const Note: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex gap-2.5 p-3.5 rounded-2xl bg-[#174D33]/[0.05] text-[12.5px] leading-relaxed text-black/75 mb-4">
    {icon && <span className="flex-none text-[#174D33] mt-0.5">{icon}</span>}
    <div>{children}</div>
  </div>
);

/** Marks demo-only behaviour so nothing simulated passes for a production feature */
export const DemoTag: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children = 'Demo', className }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 h-5 px-2 rounded-full border border-dashed border-[#174D33]/60 text-[10px] uppercase tracking-wider font-semibold text-[#174D33]',
      className,
    )}
  >
    <FlaskConical className="w-3 h-3" />
    {children}
  </span>
);

// ---- overlays -------------------------------------------------------------------------------

export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  open,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-end animate-fade" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-h-[86%] flex flex-col bg-white rounded-t-[28px] animate-sheet font-sans text-black">
        <div className="flex items-center px-5 pt-4 pb-2">
          <h2 className="flex-1 font-serif text-[21px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="px-5 pt-3 pb-5 border-t border-black/[0.06]">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}> = ({ open, title, body, confirmLabel, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 animate-fade" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full bg-white rounded-[24px] p-5 font-sans text-black">
        <h2 className="font-serif text-[21px] font-semibold">{title}</h2>
        <p className="text-[13.5px] text-black/60 mt-1.5 leading-relaxed">{body}</p>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" block onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---- toasts ---------------------------------------------------------------------------------

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msg, setMsg] = useState('');
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    if (t.current) clearTimeout(t.current);
    setMsg(m);
    t.current = setTimeout(() => setMsg(''), 3200);
  }, []);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div
          role="status"
          className="absolute bottom-24 left-1/2 z-[80] max-w-[86%] px-4 py-2.5 rounded-full bg-black text-white text-[13px] font-sans font-medium shadow-lg animate-toast text-center"
        >
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
};

export const formatDate = (iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', opts) : '';
export const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
export const formatPhone = (p: string) => (p.startsWith('+91') ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p);
