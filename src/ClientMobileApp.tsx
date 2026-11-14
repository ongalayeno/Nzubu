/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Video,
  Search,
  Inbox,
  Server,
  CheckCircle2,
  WifiOff,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  PropertyListing,
  BookingRequest,
  ViewingRequest,
  SponsoredAd,
} from './types';
import {
  INITIAL_LISTINGS,
  INITIAL_BOOKINGS,
  INITIAL_VIEWINGS,
  INITIAL_SPONSORED_ADS,
} from './data/mockData';
import { isListingPublic } from './domain/listing';
import { hasBookingConflict } from './domain/booking';
import { usePersistentState } from './hooks/usePersistentState';
import { TikTokFeed } from './components/client/TikTokFeed';
import { ExploreGrid } from './components/client/ExploreGrid';
import { ClientRequestsView } from './components/client/ClientRequestsView';
import { VerifiedBadgeDrawer } from './components/client/VerifiedBadgeDrawer';
import { BookingModal } from './components/client/BookingModal';
import { ViewingModal } from './components/client/ViewingModal';
import { ListingDetailModal } from './components/client/ListingDetailModal';
import {
  apiAdToSponsoredAd,
  apiBookingToBookingRequest,
  apiListingToPropertyListing,
} from './utils/listingAdapter';

export default function ClientMobileApp() {
  const [clientSubTab, setClientSubTab] = useState<'FEED' | 'EXPLORE' | 'REQUESTS'>('FEED');

  const [listings, setListings] = usePersistentState<PropertyListing[]>('nzubu:client:listings:v1', INITIAL_LISTINGS);
  const [bookings, setBookings] = usePersistentState<BookingRequest[]>('nzubu:client:bookings:v1', INITIAL_BOOKINGS);
  const [viewings, setViewings] = usePersistentState<ViewingRequest[]>('nzubu:client:viewings:v1', INITIAL_VIEWINGS);
  const [sponsoredAds, setSponsoredAds] = usePersistentState<SponsoredAd[]>('nzubu:client:ads:v1', INITIAL_SPONSORED_ADS);

  const [feedCommuneFilter, setFeedCommuneFilter] = useState<string>('ALL');
  const [feedModeFilter, setFeedModeFilter] = useState<string>('ALL');

  const [detailListing, setDetailListing] = useState<PropertyListing | null>(null);
  const [verificationListing, setVerificationListing] = useState<PropertyListing | null>(null);
  const [bookingListing, setBookingListing] = useState<PropertyListing | null>(null);
  const [viewingListing, setViewingListing] = useState<PropertyListing | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Optional live server connection (configurable directly on phone)
  const defaultServerUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  const [apiBaseUrl, setApiBaseUrl] = usePersistentState<string>('nzubu:client:apiBaseUrl', defaultServerUrl);
  const [serverDraftUrl, setServerDraftUrl] = useState<string>(apiBaseUrl);
  const [serverConnected, setServerConnected] = useState<boolean>(false);
  const [serverEmail, setServerEmail] = useState<string>('client@nzubu.cd');
  const [serverPassword, setServerPassword] = useState<string>('NzubuPilot2026!');
  const [authenticatedUser, setAuthenticatedUser] = useState<{ email?: string; role?: string } | null>(null);
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  const syncFromServer = async (base: string) => {
    const cleanBase = base.trim().replace(/\/+$/, '');
    if (!cleanBase) {
      setServerConnected(false);
      return;
    }
    try {
      const [listingsRes, adsRes, meRes] = await Promise.all([
        fetch(`${cleanBase}/v1/listings`, { credentials: 'include' }),
        fetch(`${cleanBase}/v1/ads`, { credentials: 'include' }),
        fetch(`${cleanBase}/v1/me`, { credentials: 'include' }),
      ]);
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        if (Array.isArray(data?.listings) && data.listings.length > 0) {
          const mapped = data.listings.map((item: any) => apiListingToPropertyListing(item));
          setListings(mapped);
        }
        setServerConnected(true);
      }
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        if (Array.isArray(adsData?.ads)) {
          setSponsoredAds(adsData.ads.map((a: any) => apiAdToSponsoredAd(a)));
        }
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setAuthenticatedUser(meData?.user || null);
        if (meData?.user) {
          const bRes = await fetch(`${cleanBase}/v1/bookings`, { credentials: 'include' });
          if (bRes.ok) {
            const bData = await bRes.json();
            if (Array.isArray(bData?.bookings)) {
              setBookings(bData.bookings.map((b: any) => apiBookingToBookingRequest(b)));
            }
          }
        }
      }
    } catch {
      setServerConnected(false);
    }
  };

  useEffect(() => {
    if (apiBaseUrl) {
      void syncFromServer(apiBaseUrl);
    }
  }, [apiBaseUrl]);

  const activeFeedListings = listings.filter((item) => {
    if (!isListingPublic(item)) return false;
    if (feedCommuneFilter !== 'ALL' && item.commune !== feedCommuneFilter) return false;
    if (feedModeFilter !== 'ALL' && item.rentalMode !== feedModeFilter) return false;
    return true;
  });

  const handleToggleFavorite = (listingId: string) => {
    const target = listings.find((l) => l.id === listingId);
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
    if (serverConnected && apiBaseUrl && authenticatedUser) {
      const cleanBase = apiBaseUrl.trim().replace(/\/+$/, '');
      void fetch(`${cleanBase}/v1/me/favorites/${listingId}`, {
        method: target?.isFavorite ? 'DELETE' : 'POST',
        credentials: 'include',
      }).catch(() => {});
    }
  };

  const handleAdClicked = (adId: string) => {
    setSponsoredAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, clicksCount: ad.clicksCount + 1 } : ad))
    );
    if (serverConnected && apiBaseUrl) {
      const cleanBase = apiBaseUrl.trim().replace(/\/+$/, '');
      void fetch(`${cleanBase}/v1/ads/${adId}/click`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }
  };

  const handleCreateBooking = (newBookingData: Partial<BookingRequest>) => {
    const conflict = hasBookingConflict(
      bookings,
      {
        listingId: newBookingData.listingId || '',
        checkInDate: newBookingData.checkInDate || '',
        checkOutDate: newBookingData.checkOutDate || '',
      },
      ['CONFIRMED']
    );
    if (conflict) {
      triggerToast('Ces dates sont déjà réservées.');
      return;
    }

    const newBooking: BookingRequest = {
      id: `bkg-${Date.now()}`,
      listingId: newBookingData.listingId || '',
      listingTitle: newBookingData.listingTitle || '',
      commune: newBookingData.commune || 'Gombe',
      guestName: newBookingData.guestName || 'Client NZUBU',
      guestPhone: newBookingData.guestPhone || '+243 82 000 0000',
      checkInDate: newBookingData.checkInDate || '2026-11-12',
      checkOutDate: newBookingData.checkOutDate || '2026-11-15',
      nightsCount: newBookingData.nightsCount || 3,
      adultsCount: newBookingData.adultsCount || 2,
      totalPriceCdf: newBookingData.totalPriceCdf || 250000,
      advanceAmountCdf: newBookingData.advanceAmountCdf || 50000,
      balanceDueArrivalCdf: newBookingData.balanceDueArrivalCdf || 200000,
      status: 'REQUESTED',
      paymentMethod: newBookingData.paymentMethod || 'VODACOM_MPESA',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      hostPhone: newBookingData.hostPhone || '+243 81 555 4949',
    };

    setBookings((prev) => [newBooking, ...prev]);

    if (serverConnected && apiBaseUrl && authenticatedUser) {
      const cleanBase = apiBaseUrl.trim().replace(/\/+$/, '');
      void fetch(`${cleanBase}/v1/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          listingId: newBooking.listingId,
          checkIn: newBooking.checkInDate,
          checkOut: newBooking.checkOutDate,
          occupants: newBooking.adultsCount,
          acceptedTerms: true,
        }),
      }).catch(() => {});
    }

    triggerToast('Demande de réservation enregistrée !');
  };

  const handleCreateViewing = (newViewingData: Partial<ViewingRequest>) => {
    const newViewing: ViewingRequest = {
      id: `vw-${Date.now()}`,
      listingId: newViewingData.listingId || '',
      listingTitle: newViewingData.listingTitle || '',
      commune: newViewingData.commune || 'Ngaliema',
      clientName: newViewingData.clientName || 'Client NZUBU',
      clientPhone: newViewingData.clientPhone || '+243 82 000 0000',
      slots: newViewingData.slots || ['2026-11-06 10:00'],
      status: 'REQUESTED',
      meetingPoint: newViewingData.meetingPoint || 'Repère local convenu',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setViewings((prev) => [newViewing, ...prev]);
    triggerToast('Demande de visite envoyée !');
  };

  const handleDeclarePayment = (bookingId: string, reference: string) => {
    if (!reference.trim()) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'PAYMENT_DECLARED', paymentReference: reference.trim() }
          : b
      )
    );
    triggerToast('Référence de paiement enregistrée !');
  };

  const handleServerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBase = serverDraftUrl.trim().replace(/\/+$/, '');
    if (!cleanBase) return;
    setApiBaseUrl(cleanBase);
    try {
      const res = await fetch(`${cleanBase}/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: serverEmail, password: serverPassword }),
      });
      if (!res.ok) {
        triggerToast('Échec de connexion au serveur.');
        return;
      }
      const data = await res.json();
      setAuthenticatedUser(data.user || null);
      await syncFromServer(cleanBase);
      triggerToast('Connecté au serveur NZUBU !');
    } catch {
      triggerToast('Serveur inaccessible depuis le téléphone.');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Main Full-Screen Client Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {clientSubTab === 'FEED' && (
          <TikTokFeed
            listings={activeFeedListings}
            sponsoredAds={sponsoredAds}
            onOpenDetails={(l) => setDetailListing(l)}
            onOpenVerification={(l) => setVerificationListing(l)}
            onOpenBooking={(l) => setBookingListing(l)}
            onOpenViewing={(l) => setViewingListing(l)}
            onToggleFavorite={handleToggleFavorite}
            activeCommuneFilter={feedCommuneFilter}
            onChangeCommuneFilter={(c) => setFeedCommuneFilter(c)}
            activeModeFilter={feedModeFilter}
            onChangeModeFilter={(m) => setFeedModeFilter(m)}
            onAdClicked={handleAdClicked}
          />
        )}

        {clientSubTab === 'EXPLORE' && (
          <ExploreGrid
            listings={listings.filter((item) => isListingPublic(item))}
            sponsoredAds={sponsoredAds}
            onOpenDetails={(l) => setDetailListing(l)}
            onOpenBooking={(l) => setBookingListing(l)}
            onOpenViewing={(l) => setViewingListing(l)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {clientSubTab === 'REQUESTS' && (
          <div className="h-full overflow-y-auto">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70">
              <div className="flex items-center gap-2 text-xs">
                {serverConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Serveur réel connecté
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
                    <WifiOff className="w-3.5 h-3.5" />
                    Mode autonome (test mobile)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowServerConfig((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Server className="w-3.5 h-3.5 text-sky-400" />
                {showServerConfig ? 'Fermer' : 'Serveur API'}
              </button>
            </div>

            {showServerConfig && (
              <form
                onSubmit={handleServerLogin}
                className="m-4 space-y-2.5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs"
              >
                <p className="font-bold text-white">Connecter l’APK à un serveur NZUBU déployé</p>
                <input
                  type="url"
                  placeholder="https://votre-serveur-nzubu.onrender.com"
                  value={serverDraftUrl}
                  onChange={(e) => setServerDraftUrl(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
                {!authenticatedUser ? (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="email"
                      placeholder="E-mail client"
                      value={serverEmail}
                      onChange={(e) => setServerEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-800 px-3 py-2 text-white"
                    />
                    <input
                      type="password"
                      placeholder="Mot de passe"
                      value={serverPassword}
                      onChange={(e) => setServerPassword(e.target.value)}
                      className="w-full rounded-xl bg-slate-800 px-3 py-2 text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Connecter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApiBaseUrl('');
                          setServerDraftUrl('');
                          setServerConnected(false);
                          setAuthenticatedUser(null);
                          setListings(INITIAL_LISTINGS);
                          triggerToast('Revenu au mode autonome local.');
                        }}
                        className="rounded-xl bg-slate-800 px-3 py-2 font-semibold text-slate-300"
                      >
                        Mode local
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300">Connecté : {authenticatedUser.email}</span>
                    <button
                      type="button"
                      onClick={() => setAuthenticatedUser(null)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-rose-300"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Déconnexion
                    </button>
                  </div>
                )}
              </form>
            )}

            <ClientRequestsView
              bookings={bookings}
              viewings={viewings}
              favorites={listings.filter((l) => l.isFavorite)}
              onDeclarePayment={handleDeclarePayment}
              onOpenDetails={(l) => setDetailListing(l)}
            />
          </div>
        )}
      </main>

      {/* Native-like Bottom Navigation Bar */}
      <nav className="h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 grid grid-cols-3 items-center z-40 px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setClientSubTab('FEED')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            clientSubTab === 'FEED' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight mt-1">Feed Vidéo</span>
        </button>

        <button
          onClick={() => setClientSubTab('EXPLORE')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            clientSubTab === 'EXPLORE' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight mt-1">Explorer</span>
        </button>

        <button
          onClick={() => setClientSubTab('REQUESTS')}
          className={`flex flex-col items-center justify-center h-full transition-colors relative ${
            clientSubTab === 'REQUESTS' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight mt-1">Dossiers</span>
          {bookings.length > 0 && (
            <span className="absolute top-2 right-8 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </nav>

      {/* Modals */}
      {detailListing && (
        <ListingDetailModal
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onOpenBooking={() => {
            const target = detailListing;
            setDetailListing(null);
            setBookingListing(target);
          }}
          onOpenViewing={() => {
            const target = detailListing;
            setDetailListing(null);
            setViewingListing(target);
          }}
          onOpenVerification={() => {
            const target = detailListing;
            setDetailListing(null);
            setVerificationListing(target);
          }}
        />
      )}

      {verificationListing && (
        <VerifiedBadgeDrawer
          listing={verificationListing}
          onClose={() => setVerificationListing(null)}
        />
      )}

      {bookingListing && (
        <BookingModal
          listing={bookingListing}
          onClose={() => setBookingListing(null)}
          onSubmitBooking={handleCreateBooking}
        />
      )}

      {viewingListing && (
        <ViewingModal
          listing={viewingListing}
          onClose={() => setViewingListing(null)}
          onSubmitViewing={handleCreateViewing}
        />
      )}

      {actionToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/95 border border-slate-700 px-4 py-2 text-xs font-semibold text-white shadow-xl">
          {actionToast}
        </div>
      )}
    </div>
  );
}
