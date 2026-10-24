/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services';
import { ApiError } from '../services/api';
import type { Customer } from '../services/types';

type Status = 'loading' | 'signed_out' | 'signed_in';

interface SessionCtx {
  status: Status;
  customer: Customer | null;
  /** why the customer was signed out (e.g. session expired), shown on the sign-in screen */
  notice: string;
  setCustomer: (c: Customer) => void;
  signedIn: () => Promise<Customer | null>;
  signOut: (notice?: string) => Promise<void>;
  /** turns any error into a message; auth errors sign the customer out */
  errorMessage: (e: unknown) => string;
}

const Ctx = createContext<SessionCtx | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [notice, setNotice] = useState('');

  const signOut = useCallback(async (n = '') => {
    await api.logout();
    setCustomerState(null);
    setNotice(n);
    setStatus('signed_out');
    sessionStorage.removeItem('dori.nav.v1');
  }, []);

  const errorMessage = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        if (e.code === 'SESSION_EXPIRED' || e.code === 'UNAUTHENTICATED') void signOut(e.message);
        return e.message;
      }
      return 'Something went wrong. Please try again.';
    },
    [signOut],
  );

  const signedIn = useCallback(async () => {
    try {
      const c = await api.me();
      setCustomerState(c);
      setNotice('');
      setStatus('signed_in');
      return c;
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'SESSION_EXPIRED' || e.code === 'UNAUTHENTICATED')) {
        await signOut(e.code === 'SESSION_EXPIRED' ? e.message : '');
      } else {
        // offline at start-up: stay signed out of protected screens until we can verify the session
        setNotice(e instanceof ApiError ? e.message : 'Could not reach Dori.');
        setStatus('signed_out');
      }
      return null;
    }
  }, [signOut]);

  useEffect(() => {
    if (api.restoreSession()) void signedIn();
    else setStatus('signed_out');
  }, [signedIn]);

  return (
    <Ctx.Provider value={{ status, customer, notice, setCustomer: setCustomerState, signedIn, signOut, errorMessage }}>
      {children}
    </Ctx.Provider>
  );
};

export const useSession = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside SessionProvider');
  return c;
};

/** For screens that only render when signed in */
export const useCustomer = () => {
  const { customer } = useSession();
  if (!customer) throw new Error('useCustomer requires a signed-in customer');
  return customer;
};
