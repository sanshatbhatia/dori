/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dori customer app shell: session, navigation and the screens around the existing Design Studio.

import React, { useEffect } from 'react';
import { Bookmark, Compass, FlaskConical, Home, PackageSearch, UserRound } from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { NavProvider, useNav, type Route } from './app/nav';
import { IS_DEMO, demoBackend } from './app/services';
import { OrderDraftProvider } from './app/state/orderDraft';
import { SessionProvider, useSession } from './app/state/session';
import { Spinner, ToastProvider } from './app/ui/kit';
import { AuthFlow, Wordmark } from './app/screens/Auth';
import { PersonalizeScreen } from './app/screens/Personalize';
import { HomeScreen, NotificationsScreen } from './app/screens/Home';
import { OrderStepScreen } from './app/screens/OrderFlow';
import { StudioScreen } from './app/screens/StudioScreen';
import { ReferenceScreen } from './app/screens/Reference';
import { ConfirmationScreen, ConsultationScreen, DesignSummaryScreen, NextActionScreen, ReviewScreen, UrgencyScreen } from './app/screens/Checkout';
import { RequestScreen, RescheduleScreen, TrackListScreen } from './app/screens/Tracking';
import { SavedScreen } from './app/screens/Saved';
import { ExploreItemScreen, ExploreScreen } from './app/screens/Explore';
import {
  AddressEditScreen,
  AddressesScreen,
  DemoToolsScreen,
  FitScreen,
  LegalScreen,
  NotifPrefsScreen,
  PhoneChangeScreen,
  ProfileEditScreen,
  ProfileScreen,
  SecurityScreen,
} from './app/screens/Profile';

const TABS = [
  { route: { name: 'home' } as Route, label: 'Home', icon: Home },
  { route: { name: 'explore' } as Route, label: 'Explore', icon: Compass },
  { route: { name: 'saved' } as Route, label: 'Saved', icon: Bookmark },
  { route: { name: 'track' } as Route, label: 'Orders', icon: PackageSearch },
  { route: { name: 'profile' } as Route, label: 'Profile', icon: UserRound },
];
const TAB_ROUTES = new Set(TABS.map((t) => t.route.name));

const TabBar: React.FC = () => {
  const nav = useNav();
  return (
    <nav className="flex-none flex border-t border-black/[0.07] bg-white px-2 pt-1.5 pb-1 font-sans" aria-label="Main">
      {TABS.map(({ route, label, icon: Icon }) => {
        const active = nav.route.name === route.name;
        return (
          <button
            key={label}
            id={`tab-${route.name}`}
            onClick={() => nav.reset(route.name === 'home' ? [route] : [{ name: 'home' }, route])}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-medium ${active ? 'text-[#174D33]' : 'text-black/45'}`}
          >
            <Icon className={`w-5 h-5 ${active ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
            {label}
          </button>
        );
      })}
    </nav>
  );
};

const DemoBanner: React.FC = () =>
  IS_DEMO ? (
    <div className="flex-none flex items-center justify-center gap-1.5 h-6 bg-[#174D33] text-white text-[10.5px] font-sans font-semibold tracking-wider uppercase">
      <FlaskConical className="w-3 h-3" /> Test mode · demo data on this device
    </div>
  ) : null;

/** shown beside the phone on wide screens, for presenting the demo */
const SidePanel: React.FC = () => (
  <div className="rounded-3xl bg-white p-5 font-sans text-black">
    <Wordmark size={36} />
    <p className="text-[13px] text-black/60 mt-2 leading-relaxed">Custom-fashion design, styling and managed tailoring.</p>
    <div className="mt-4 p-3 rounded-2xl bg-[#174D33]/[0.06] text-[12.5px] leading-relaxed">
      <b className="block mb-1">Test mode</b>
      Sign in with any Indian mobile number (e.g. 98765 43210) and the code <b>123456</b>. Data stays in this browser. Use Profile → Demo tools and
      the demo controls on each request to move it through the workflow.
    </div>
  </div>
);

const Screens: React.FC = () => {
  const nav = useNav();
  const r = nav.route;
  switch (r.name) {
    case 'personalize':
      return <PersonalizeScreen />;
    case 'home':
      return <HomeScreen />;
    case 'notifications':
      return <NotificationsScreen />;
    case 'order':
      return <OrderStepScreen key={r.step} step={r.step} />;
    case 'reference':
      return <ReferenceScreen />;
    case 'design-summary':
      return <DesignSummaryScreen />;
    case 'next-action':
      return <NextActionScreen />;
    case 'urgency':
      return <UrgencyScreen />;
    case 'consultation':
      return <ConsultationScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'confirmation':
      return <ConfirmationScreen requestId={r.requestId} />;
    case 'track':
      return <TrackListScreen />;
    case 'request':
      return <RequestScreen key={r.id} id={r.id} />;
    case 'reschedule':
      return <RescheduleScreen id={r.id} />;
    case 'saved':
      return <SavedScreen />;
    case 'explore':
      return <ExploreScreen />;
    case 'explore-item':
      return <ExploreItemScreen key={r.id} id={r.id} />;
    case 'profile':
      return <ProfileScreen />;
    case 'profile-edit':
      return <ProfileEditScreen />;
    case 'addresses':
      return <AddressesScreen />;
    case 'address-edit':
      return <AddressEditScreen id={r.id} />;
    case 'phone-change':
      return <PhoneChangeScreen />;
    case 'fit':
      return <FitScreen />;
    case 'notif-prefs':
      return <NotifPrefsScreen />;
    case 'security':
      return <SecurityScreen />;
    case 'legal':
      return <LegalScreen doc={r.doc} />;
    case 'demo-tools':
      return <DemoToolsScreen />;
    default:
      return <HomeScreen />;
  }
};

const Shell: React.FC = () => {
  const { status, customer } = useSession();
  const nav = useNav();

  // first-time customers go to Personalization; returning ones to Home. The profile (size, height,
  // body type, address) must be complete before any other screen — the Studio's mannequin needs it.
  const profileDone = !!customer?.onboarding.personalizationDone;
  useEffect(() => {
    if (status !== 'signed_in' || !customer) return;
    if (!profileDone) {
      if (nav.route.name !== 'personalize') nav.reset({ name: 'personalize' });
    } else if (nav.route.name === 'auth' || nav.route.name === 'personalize') nav.reset({ name: 'home' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, customer?.id, profileDone, nav.route.name]);

  // signing out (or an expired session) always lands on sign-in, never on a protected screen
  useEffect(() => {
    if (status === 'signed_out' && nav.route.name !== 'auth') nav.reset({ name: 'auth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // demo stand-in for the backend assignment job: run it while the app is open
  useEffect(() => {
    if (!IS_DEMO || status !== 'signed_in') return;
    const t = setInterval(() => demoBackend.demo.tick(), 30000);
    return () => clearInterval(t);
  }, [status]);

  if (status === 'loading') {
    return (
      <PhoneFrame sidePanel={<SidePanel />}>
        <div className="flex-1 flex items-center justify-center bg-white">
          <Spinner label="Opening Dori" />
        </div>
      </PhoneFrame>
    );
  }

  // protected screens need a session
  if (status === 'signed_out' || !customer) {
    return (
      <PhoneFrame sidePanel={<SidePanel />}>
        <ToastProvider>
          <DemoBanner />
          <AuthFlow />
        </ToastProvider>
      </PhoneFrame>
    );
  }

  if (nav.route.name === 'auth') return null;

  // the Design Studio brings its own frame, panels and controls
  if (nav.route.name === 'studio') return <StudioScreen />;

  return (
    <PhoneFrame sidePanel={<SidePanel />}>
      <ToastProvider>
        <DemoBanner />
        <div className="flex-1 min-h-0 flex flex-col relative">
          <Screens />
        </div>
        {TAB_ROUTES.has(nav.route.name) && <TabBar />}
      </ToastProvider>
    </PhoneFrame>
  );
};

export default function App() {
  return (
    <SessionProvider>
      <NavProvider initial={{ name: 'auth' }}>
        <OrderDraftProvider>
          <Shell />
        </OrderDraftProvider>
      </NavProvider>
    </SessionProvider>
  );
}
