/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Address } from '../services/types';
import { Chip, Field, Input } from './kit';

export type AddressInput = Omit<Address, 'id'> & { id?: string };

export const emptyAddress = (): AddressInput => ({ label: 'Home', line1: '', locality: '', city: '', state: '', postalCode: '', isDefault: false });

export const validateAddress = (a: AddressInput) => {
  const e: Partial<Record<keyof AddressInput, string>> = {};
  if (!a.label.trim()) e.label = 'Add a label.';
  if (!a.line1.trim()) e.line1 = 'Enter the house / flat and street.';
  if (!a.locality.trim()) e.locality = 'Enter the locality or area.';
  if (!a.city.trim()) e.city = 'Enter the city.';
  if (!a.state.trim()) e.state = 'Enter the state.';
  if (!/^\d{6}$/.test(a.postalCode.trim())) e.postalCode = 'Enter a 6-digit PIN code.';
  return e;
};

export const AddressForm: React.FC<{ value: AddressInput; onChange: (a: AddressInput) => void; errors: Partial<Record<keyof AddressInput, string>> }> = ({
  value,
  onChange,
  errors,
}) => {
  const [customLabel, setCustomLabel] = useState(!['Home', 'Work'].includes(value.label));
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div>
      <Field label="Label" error={errors.label}>
        <div className="flex gap-2 mb-2">
          {['Home', 'Work'].map((l) => (
            <Chip
              key={l}
              selected={!customLabel && value.label === l}
              onClick={() => {
                setCustomLabel(false);
                onChange({ ...value, label: l });
              }}
            >
              {l}
            </Chip>
          ))}
          <Chip
            selected={customLabel}
            onClick={() => {
              setCustomLabel(true);
              onChange({ ...value, label: '' });
            }}
          >
            Other
          </Chip>
        </div>
        {customLabel && <Input placeholder="e.g. Mum’s place" value={value.label} onChange={set('label')} invalid={!!errors.label} />}
      </Field>
      <Field label="House / flat, building and street" error={errors.line1}>
        <Input id="addr-line1" autoComplete="address-line1" value={value.line1} onChange={set('line1')} invalid={!!errors.line1} />
      </Field>
      <Field label="Locality / area" error={errors.locality}>
        <Input id="addr-locality" autoComplete="address-line2" value={value.locality} onChange={set('locality')} invalid={!!errors.locality} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" error={errors.city}>
          <Input id="addr-city" autoComplete="address-level2" value={value.city} onChange={set('city')} invalid={!!errors.city} />
        </Field>
        <Field label="State" error={errors.state}>
          <Input id="addr-state" autoComplete="address-level1" value={value.state} onChange={set('state')} invalid={!!errors.state} />
        </Field>
      </div>
      <Field label="PIN code" error={errors.postalCode}>
        <Input
          id="addr-pin"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value.replace(/\D/g, '') })}
          invalid={!!errors.postalCode}
        />
      </Field>
      <label className="flex items-center gap-2.5 text-[14px] mb-2">
        <input
          type="checkbox"
          className="w-5 h-5 accent-[#174D33]"
          checked={value.isDefault}
          onChange={(e) => onChange({ ...value, isDefault: e.target.checked })}
        />
        Use as my default delivery address
      </label>
    </div>
  );
};

export const formatAddress = (a: Address) => `${a.line1}, ${a.locality}, ${a.city}, ${a.state} ${a.postalCode}`;
