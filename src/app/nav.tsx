/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-app navigation stack. Screens are addressed by name and params kept in memory (and in
// sessionStorage so a refresh returns to the same place) — nothing private goes into the URL.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Route =
  | { name: 'auth' }
  | { name: 'personalize' }
  | { name: 'home' }
  | { name: 'notifications' }
  | { name: 'order'; step: number }
  | { name: 'studio' }
  | { name: 'reference' }
  | { name: 'design-summary' }
  | { name: 'next-action' }
  | { name: 'urgency' }
  | { name: 'consultation' }
  | { name: 'review' }
  | { name: 'confirmation'; requestId: string }
  | { name: 'track' }
  | { name: 'request'; id: string }
  | { name: 'reschedule'; id: string }
  | { name: 'saved' }
  | { name: 'explore' }
  | { name: 'explore-item'; id: string }
  | { name: 'profile' }
  | { name: 'profile-edit' }
  | { name: 'addresses' }
  | { name: 'address-edit'; id?: string; returnTo?: 'review' }
  | { name: 'phone-change' }
  | { name: 'fit' }
  | { name: 'notif-prefs' }
  | { name: 'security' }
  | { name: 'legal'; doc: 'terms' | 'privacy' }
  | { name: 'demo-tools' };

export type RouteName = Route['name'];

interface Nav {
  route: Route;
  stack: Route[];
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  /** clear history and start from this route, or this stack (e.g. after sign-in, or tab switches) */
  reset: (r: Route | Route[]) => void;
  /** go back to the most recent route with this name, or reset to it */
  backTo: (name: RouteName, fallback?: Route) => void;
}

const KEY = 'dori.nav.v1';
const NavCtx = createContext<Nav | null>(null);

export const NavProvider: React.FC<{ initial: Route; children: React.ReactNode }> = ({ initial, children }) => {
  const [stack, setStack] = useState<Route[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {
      /* ignore */
    }
    return [initial];
  });
  const commit = useCallback((next: Route[]) => {
    sessionStorage.setItem(KEY, JSON.stringify(next));
    setStack(next);
  }, []);

  const nav = useMemo<Nav>(
    () => ({
      route: stack[stack.length - 1],
      stack,
      go: (r) => commit([...stack, r]),
      replace: (r) => commit([...stack.slice(0, -1), r]),
      back: () => commit(stack.length > 1 ? stack.slice(0, -1) : [{ name: 'home' }]),
      reset: (r) => commit(Array.isArray(r) ? r : [r]),
      backTo: (name, fallback) => {
        const i = stack.map((r) => r.name).lastIndexOf(name);
        if (i >= 0) commit(stack.slice(0, i + 1));
        else commit([{ name: 'home' }, fallback || ({ name } as Route)]);
      },
    }),
    [stack, commit],
  );
  return <NavCtx.Provider value={nav}>{children}</NavCtx.Provider>;
};

export const useNav = () => {
  const n = useContext(NavCtx);
  if (!n) throw new Error('useNav outside NavProvider');
  return n;
};
