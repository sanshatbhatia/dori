/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Bell, Bookmark, ChevronRight, Compass, PackageSearch, Scissors, UserRound } from 'lucide-react';
import { STATUS_LABEL, garmentById, garmentName } from '../data/catalog';
import { api } from '../services';
import type { AppNotification, Design, OrderRequest } from '../services/types';
import { useNav } from '../nav';
import { useDraft } from '../state/orderDraft';
import { useCustomer, useSession } from '../state/session';
import { GarmentArtFor } from '../ui/Silhouette';
import { Button, EmptyState, ErrorBanner, Screen, Spinner, formatDate } from '../ui/kit';
import { Wordmark } from './Auth';

const CARDS = [
  { id: 'order', title: 'Place an Order', body: 'Start a new custom-tailoring request.', icon: Scissors },
  { id: 'track', title: 'Track an Order', body: 'Follow an order from booking to delivery.', icon: PackageSearch },
  { id: 'explore', title: 'Explore Styles', body: 'Discover outfit inspiration and design ideas.', icon: Compass },
  { id: 'saved', title: 'Saved Designs', body: 'Open saved outfits, designs and boards.', icon: Bookmark },
  { id: 'profile', title: 'My Profile', body: 'Personal details, measurements, addresses and security.', icon: UserRound },
] as const;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const HomeScreen: React.FC = () => {
  const customer = useCustomer();
  const nav = useNav();
  const { hasProgress, draft } = useDraft();
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<{ requests: OrderRequest[]; designs: Design[] } | null>(null);
  const [error, setError] = useState('');
  const { errorMessage } = useSession();

  useEffect(() => {
    let live = true;
    Promise.all([api.listNotifications(), api.listRequests(), api.listDesigns()])
      .then(([n, requests, designs]) => {
        if (!live) return;
        setUnread(n.filter((x: AppNotification) => !x.read).length);
        setRecent({ requests: requests.slice(0, 2), designs: designs.slice(0, 3) });
      })
      .catch((e) => live && setError(errorMessage(e)));
    return () => {
      live = false;
    };
  }, [errorMessage]);

  const open = (id: (typeof CARDS)[number]['id']) => {
    if (id === 'order') nav.go(hasProgress ? { name: 'order', step: 0 } : { name: 'order', step: 1 });
    else nav.go({ name: id });
  };

  return (
    <Screen id="home">
      <div className="flex items-center pt-3">
        <Wordmark size={34} />
        <span className="flex-1" />
        <button
          id="home-notifications"
          onClick={() => nav.go({ name: 'notifications' })}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          className="relative w-11 h-11 rounded-full border border-black/10 flex items-center justify-center"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-[#174D33] ring-2 ring-white" />}
        </button>
      </div>
      <p className="font-serif text-[28px] leading-tight mt-5">
        {greeting()}, {customer.fullName.split(' ')[0]}
      </p>
      <p className="text-[13.5px] text-black/55 mt-1">What would you like to do today?</p>

      {hasProgress && (
        <button
          id="home-resume"
          onClick={() => nav.go({ name: 'order', step: 0 })}
          className="mt-4 w-full flex items-center gap-3 p-3 rounded-2xl bg-[#174D33] text-white text-left"
        >
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-wider text-white/70">Order in progress</span>
            <span className="block text-[14.5px] font-semibold">{garmentName(garmentById(draft.garmentId)) || 'Continue where you left off'}</span>
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div className="flex flex-col gap-3 mt-5">
        {CARDS.map(({ id, title, body, icon: Icon }) => (
          <button
            key={id}
            id={`home-card-${id}`}
            onClick={() => open(id)}
            className="h-[92px] w-full flex items-center gap-4 px-4 rounded-[22px] border border-black/10 bg-white text-left hover:border-[#174D33]/50 active:scale-[0.99] transition shadow-[0_1px_0_rgba(0,0,0,0.02)]"
          >
            <span className="w-14 h-14 rounded-2xl bg-[#174D33]/[0.07] text-[#174D33] flex items-center justify-center flex-none">
              <Icon className="w-6 h-6 stroke-[1.6]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-serif text-[21px] font-semibold leading-tight">{title}</span>
              <span className="block text-[12.5px] text-black/55 leading-snug mt-0.5">{body}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-black/30 flex-none" />
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} />
        </div>
      )}
      {recent && (recent.requests.length > 0 || recent.designs.length > 0) && (
        <div className="mt-7">
          <h2 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-black/50 mb-2.5">Recent</h2>
          {recent.requests.map((r) => (
            <button
              key={r.id}
              onClick={() => nav.go({ name: 'request', id: r.id })}
              className="w-full flex items-center gap-3 py-2.5 border-b border-black/[0.06] text-left"
            >
              <GarmentArtFor garmentId={r.garmentId} className="w-9 h-11" />
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-medium truncate">{garmentName(garmentById(r.garmentId))}</span>
                <span className="block text-[12px] text-black/50">
                  {r.reference} · {STATUS_LABEL[r.status]}
                </span>
              </span>
            </button>
          ))}
          {recent.designs.map((d) => (
            <button key={d.id} onClick={() => nav.go({ name: 'saved' })} className="w-full flex items-center gap-3 py-2.5 border-b border-black/[0.06] last:border-0 text-left">
              {d.previewDataUrl ? (
                <img src={d.previewDataUrl} alt="" className="w-9 h-11 object-cover rounded-lg" />
              ) : (
                <GarmentArtFor garmentId={d.garmentId} className="w-9 h-11" />
              )}
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-medium truncate">{d.title}</span>
                <span className="block text-[12px] text-black/50">Design · edited {formatDate(d.updatedAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
};

export const NotificationsScreen: React.FC = () => {
  const nav = useNav();
  const { errorMessage } = useSession();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    api
      .listNotifications()
      .then((n) => {
        setItems(n);
        if (n.some((x) => !x.read)) void api.markNotificationsRead();
      })
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, []);
  return (
    <Screen title="Notifications" onBack={nav.back} subtitle="In-app updates. SMS, WhatsApp and email aren’t connected in this demo.">
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!items && !error && <Spinner />}
      {items?.length === 0 && <EmptyState icon={<Bell className="w-7 h-7" />} title="All caught up" body="Updates about your requests and orders appear here." />}
      {items?.map((n) => (
        <button
          key={n.id}
          onClick={() => n.requestId && nav.go({ name: 'request', id: n.requestId })}
          className="w-full text-left flex gap-3 py-3.5 border-b border-black/[0.06]"
        >
          <span className={`mt-1.5 w-2 h-2 rounded-full flex-none ${n.read ? 'bg-transparent' : 'bg-[#174D33]'}`} />
          <span className="flex-1">
            <span className="block text-[14.5px] font-semibold">{n.title}</span>
            <span className="block text-[13px] text-black/60 leading-snug mt-0.5">{n.body}</span>
            <span className="block text-[11.5px] text-black/40 mt-1">{new Date(n.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </span>
        </button>
      ))}
      {items && items.length > 0 && (
        <Button variant="ghost" block onClick={() => nav.back()}>
          Done
        </Button>
      )}
    </Screen>
  );
};
