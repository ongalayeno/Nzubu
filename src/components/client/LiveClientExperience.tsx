import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Compass,
  FileText, Globe2, Heart, Info, Layers, MapPin, Search, Share2, ShieldCheck,
  Sparkles, Video, Volume2, VolumeX, Wifi, X,
} from 'lucide-react';
import { AvailabilityCalendar, type BusyPeriod } from './AvailabilityCalendar';
import { ListingVideo } from './ListingVideo';
import { CaseEvidence } from '../CaseEvidence';
import { ListingDetailModal } from './ListingDetailModal';
import { ListingComparatorModal } from './ListingComparatorModal';
import { DiasporaPaymentModal } from './DiasporaPaymentModal';
import { SponsoredVideoCard } from './SponsoredVideoCard';
import { ComplianceBadgeModal } from '../legal/ComplianceBadgeModal';
import { ProgressStepper } from '../common/ProgressStepper';
import { SecureChatModal } from '../common/SecureChatModal';
import { apiListingToPropertyListing, apiBookingToBookingRequest } from '../../utils/listingAdapter';
import { exportReceiptPdf } from '../../utils/exportReceiptPdf';
import { partitionAds } from '../../domain/ads';
import type { PropertyListing, SponsoredAd } from '../../types';

export type ClientListing = {
  id: string;
  title: string;
  commune: string;
  rental_mode: 'SHORT_STAY' | 'LONG_TERM';
  price_cdf: number;
  verified_at?: string;
  verified_by?: string;
  verified_until?: string;
  boosted_until?: string | null;
  video_status?: string;
  data?: {
    description?: string;
    furnished?: boolean;
    neighborhood?: string;
    amenities?: string[];
    chargesCdf?: number;
    securityDepositMonths?: number;
    conditions?: string;
    media?: { videoUrl?: string; videoThumbnail?: string; photos?: string[] };
    utilities?: any;
    [key: string]: any;
  };
};
export type ClientBooking = {
  id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  status: string;
  price_cdf: number;
  advance_cdf?: number;
  refund_due_cdf?: number;
  refund_status?: string;
  payment_reference?: string;
  payment_method?: string;
  hold_expires_at?: string;
};
export type ClientViewing = { id: string; listing_id: string; status: string; slots: string[]; scheduled_at?: string; outcome_note?: string };
export type ClientApplication = { id: string; listing_id: string; status: string; message: string; agreed_rent_cdf?: number };
export type ClientTicket = { id: string; category: string; message: string; status: string };
export type ClientNotification = { id: string; subject: string; body: string };
type Filter = { commune: string; mode: string; furnished: string; maxPriceCdf: string };
type Panel = 'details' | 'booking' | 'verification' | null;
type Tab = 'feed' | 'explore' | 'dossiers';
type Props = {
  listings: ClientListing[];
  bookings: ClientBooking[];
  viewings: ClientViewing[];
  applications: ClientApplication[];
  tickets: ClientTicket[];
  notifications: ClientNotification[];
  favorites: string[];
  filters: Filter;
  onFilters: (filters: Filter) => void;
  onFavorite: (id: string, saved: boolean) => void;
  onAvailability: (id: string) => Promise<BusyPeriod[]>;
  onBooking: (listing: ClientListing, checkIn: string, checkOut: string, occupants: number) => void;
  onViewing: (listing: ClientListing, slot: string) => void;
  onApplication: (listing: ClientListing, message: string) => void;
  onDeclarePayment: (id: string, reference: string, paymentMethod?: string, diasporaCurrency?: string, diasporaAmount?: number) => void;
  onCancelBooking: (id: string) => void;
  onReportMedia: (id: string, message: string) => void;
  onTicket: (message: string) => void;
  onCloseAccount: () => void;
  authenticated: boolean;
  onLogin: () => void;
  ads?: SponsoredAd[];
  onAdImpression?: (id: string) => void;
  onAdClick?: (id: string) => void;
  userEmail?: string;
};

const amount = (value: number) => Number(value || 0).toLocaleString('fr-CD');
const button = 'min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition active:scale-[.98]';

const VIDEO_CHAPTERS = [
  { label: 'Façade', time: '0:00' },
  { label: 'Salon', time: '0:12' },
  { label: 'Chambres', time: '0:24' },
  { label: 'Compteur & Eau', time: '0:34' },
];

function detectMobileMoneyOperator(phone: string) {
  const clean = phone.replace(/\s+/g, '');
  if (/(\+?243)?0?(81|82|83)/.test(clean)) return { name: 'Vodacom M-Pesa', code: '*111#', method: 'VODACOM_MPESA' as const };
  if (/(\+?243)?0?(97|98|99)/.test(clean)) return { name: 'Airtel Money', code: '*501#', method: 'AIRTEL_MONEY' as const };
  if (/(\+?243)?0?(84|85|89)/.test(clean)) return { name: 'Orange Money', code: '*144#', method: 'ORANGE_MONEY' as const };
  return null;
}

export function LiveClientExperience(props: Props) {
  const { listings, bookings, viewings, applications, tickets, notifications, filters, favorites, authenticated, ads = [] } = props;
  const [tab, setTab] = useState<Tab>('feed');
  const [index, setIndex] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [periods, setPeriods] = useState<BusyPeriod[]>([]);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [occupants, setOccupants] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [slot, setSlot] = useState('');
  const [applicationMessage, setApplicationMessage] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [dossierSection, setDossierSection] = useState('Séjours');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState('');
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ecoDataMode, setEcoDataMode] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'ENERGY'>('DEFAULT');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparator, setShowComparator] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [richDetailListing, setRichDetailListing] = useState<PropertyListing | null>(null);
  const [chatListing, setChatListing] = useState<PropertyListing | null>(null);
  const [diasporaTarget, setDiasporaTarget] = useState<{ listing: PropertyListing; bookingId?: string; amountCdf: number } | null>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<ClientBooking | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('+24381');
  const [paymentRef, setPaymentRef] = useState('');

  const communes = useMemo(
    () => Array.from(new Set(['Gombe', 'Ngaliema', 'Lingwala', ...listings.map((item) => item.commune)])).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const richListings = useMemo(
    () => listings.map((item) => apiListingToPropertyListing(item, favorites.includes(item.id))),
    [listings, favorites]
  );

  const sortedListings = useMemo(() => {
    const copy = [...listings];
    if (sortBy === 'PRICE_ASC') copy.sort((a, b) => a.price_cdf - b.price_cdf);
    else if (sortBy === 'PRICE_DESC') copy.sort((a, b) => b.price_cdf - a.price_cdf);
    else if (sortBy === 'ENERGY') {
      copy.sort((a, b) => {
        const score = (x: ClientListing) => (x.data?.utilities?.electricity?.type && x.data.utilities.electricity.type !== 'SNEL_GRID' ? 2 : 0) + (x.data?.utilities?.water?.reserveCapacityLiters ? 1 : 0);
        return score(b) - score(a);
      });
    }
    return copy;
  }, [listings, sortBy]);

  const { feedAds, bannerAds } = useMemo(() => {
    const { activeAds } = partitionAds(ads);
    return {
      feedAds: activeAds.filter((a) => a.format === 'VERTICAL_VIDEO_FEED'),
      bannerAds: activeAds.filter((a) => a.format === 'CATALOG_BANNER'),
    };
  }, [ads]);

  const feedItems = useMemo(() => {
    const items: Array<{ type: 'listing'; listing: ClientListing } | { type: 'ad'; ad: SponsoredAd }> = [];
    listings.forEach((listing, idx) => {
      items.push({ type: 'listing', listing });
      if (feedAds.length > 0 && (idx + 1) % 2 === 0) {
        items.push({ type: 'ad', ad: feedAds[Math.floor(idx / 2) % feedAds.length] });
      }
    });
    return items;
  }, [listings, feedAds]);

  const currentFeedItem = feedItems[index];
  const currentListing = currentFeedItem?.type === 'listing' ? currentFeedItem.listing : undefined;
  const selected = listings.find((item) => item.id === selectedId) || currentListing || listings[0];

  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, feedItems.length - 1))), [feedItems.length]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('listing');
    const found = feedItems.findIndex((item) => item.type === 'listing' && item.listing.id === id);
    if (found >= 0) setIndex(found);
  }, [feedItems]);
  useEffect(() => { setPanel(null); setCalendarLoaded(false); setPeriods([]); setPlaying(true); setActiveChapter(0); }, [index]);

  useEffect(() => {
    if (tab !== 'feed' || panel || richDetailListing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((c) => Math.min(c + 1, Math.max(0, feedItems.length - 1))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((c) => Math.max(0, c - 1)); }
      else if (e.key.toLowerCase() === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, panel, richDetailListing, feedItems.length]);

  const open = (item: ClientListing, next: Panel) => {
    setSelectedId(item.id);
    if (next === 'details') {
      setRichDetailListing(apiListingToPropertyListing(item, favorites.includes(item.id)));
      return;
    }
    setPanel(next);
    if (next === 'booking' && item.rental_mode === 'SHORT_STAY') void loadAvailability(item.id);
  };

  const loadAvailability = async (id: string) => {
    setCalendarLoaded(false);
    try { setPeriods(await props.onAvailability(id)); setCalendarLoaded(true); }
    catch { setPeriods([]); }
  };

  const login = () => { setPanel(null); props.onLogin(); };
  const requireLogin = (fn: () => void) => authenticated ? fn() : login();

  const share = async (item: ClientListing) => {
    const url = `${location.origin}${location.pathname}?listing=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else { await navigator.clipboard.writeText(url); setShareNote('Lien copié'); }
    } catch {
      setShareNote('Partage non disponible');
    }
  };

  const go = (next: Tab) => { setTab(next); setPanel(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const chooseCommune = (commune: string) => { props.onFilters({ ...filters, commune }); setIndex(0); };
  const listingName = (id: string) => listings.find((item) => item.id === id)?.title || `Logement ${id.slice(0, 8)}`;
  const toggleCompare = (id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const hasVideo = (item: ClientListing) => item.video_status === 'APPROVED' || Boolean(item.data?.media?.videoUrl);
  const startY = { current: 0 };
  const detectedOperator = detectMobileMoneyOperator(paymentPhone);

  return (
    <div className="client-app mx-auto min-h-[calc(100dvh-64px)] max-w-3xl bg-slate-950 text-white sm:border-x sm:border-slate-800">
      <div className="relative pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
        {tab === 'feed' && (
          <section
            aria-label="Feed vidéo des logements"
            className="relative mx-auto h-[calc(100dvh-9.25rem)] max-h-[1100px] max-w-xl overflow-hidden bg-slate-900"
            onTouchStart={(event) => { startY.current = event.touches[0].clientY; }}
            onTouchEnd={(event) => {
              const delta = event.changedTouches[0].clientY - startY.current;
              if (Math.abs(delta) > 65) setIndex((current) => Math.min(Math.max(0, current + (delta < 0 ? 1 : -1)), Math.max(0, feedItems.length - 1)));
            }}
          >
            {feedItems.length && currentFeedItem ? (
              currentFeedItem.type === 'ad' ? (
                <div className="relative h-full w-full">
                  <SponsoredVideoCard
                    ad={currentFeedItem.ad}
                    isActive={playing && !panel}
                    isMuted={muted}
                    onToggleMute={() => setMuted((m) => !m)}
                    onNextVideo={() => setIndex((c) => Math.min(c + 1, feedItems.length - 1))}
                    onPrevVideo={() => setIndex((c) => Math.max(0, c - 1))}
                    hasPrev={index > 0}
                    hasNext={index < feedItems.length - 1}
                    onAdClicked={(adId) => props.onAdClick?.(adId)}
                  />
                  <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
                    <button aria-label="Logement précédent" disabled={index === 0} onClick={() => setIndex(index - 1)} className="rounded-full bg-black/60 p-3 disabled:opacity-40"><ChevronUp /></button>
                    <button aria-label="Logement suivant" disabled={index >= feedItems.length - 1} onClick={() => setIndex(index + 1)} className="rounded-full bg-black/60 p-3 disabled:opacity-40"><ChevronDown /></button>
                  </div>
                </div>
              ) : (() => {
                const item = currentFeedItem.listing;
                const videoReady = hasVideo(item);
                const isBoosted = Boolean(item.boosted_until && new Date(item.boosted_until) > new Date());
                return (
                  <>
                    {videoReady ? (
                      <ListingVideo
                        key={item.id}
                        listingId={item.id}
                        immersive
                        active={playing && !panel && !ecoDataMode}
                        muted={muted}
                        fallbackVideoUrl={item.data?.media?.videoUrl}
                        fallbackPosterUrl={item.data?.media?.videoThumbnail || item.data?.media?.photos?.[0]}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-center text-sm text-slate-300">
                        <span><Video size={40} className="mx-auto mb-2" />Vidéo non disponible pour le moment</span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-45% to-black/90" />
                    <div className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar" aria-label="Filtrer par commune">
                      <button className={`${button} shrink-0 rounded-full ${!filters.commune ? 'bg-white text-slate-950' : 'bg-black/55'}`} onClick={() => chooseCommune('')}>Toutes communes</button>
                      {communes.map((commune) => (
                        <button key={commune} className={`${button} shrink-0 rounded-full ${filters.commune === commune ? 'bg-white text-slate-950' : 'bg-black/55'}`} onClick={() => chooseCommune(commune)}>{commune}</button>
                      ))}
                    </div>
                    <div className="absolute left-4 top-16 z-10 flex flex-wrap gap-1.5 pr-16 text-xs font-bold">
                      <button onClick={() => open(item, 'verification')} className="rounded-full bg-emerald-500/85 px-3 py-1.5">
                        <ShieldCheck className="mr-1 inline" size={14} /> Vérifié par NZUBU
                      </button>
                      {isBoosted && (
                        <span className="rounded-full bg-amber-500/90 px-2.5 py-1.5 text-slate-950">
                          <Sparkles className="mr-1 inline" size={12} /> Mis en avant
                        </span>
                      )}
                      <span className="rounded-full bg-black/55 px-3 py-1.5">{item.rental_mode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}</span>
                      <button onClick={() => setPlaying(!playing)} disabled={!videoReady} className="rounded-full bg-black/55 px-3 py-1.5 disabled:opacity-50">
                        <Video className="mr-1 inline" size={14} /> {!videoReady ? 'Vidéo indisponible' : playing ? 'Pause vidéo' : 'Lire la vidéo'}
                      </button>
                      <button onClick={() => setMuted(!muted)} className="rounded-full bg-black/55 px-2.5 py-1.5" aria-label="Son">
                        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <button onClick={() => setEcoDataMode(!ecoDataMode)} className={`rounded-full px-2.5 py-1.5 ${ecoDataMode ? 'bg-amber-400 text-slate-950' : 'bg-black/55'}`}>
                        <Wifi className="mr-1 inline" size={12} /> {ecoDataMode ? 'Éco-Data (-85%)' : '3G/4G'}
                      </button>
                    </div>

                    {/* Chapitres vidéo d'inspection */}
                    <div className="absolute left-4 top-32 z-10 flex gap-1.5 overflow-x-auto pr-16 no-scrollbar">
                      {VIDEO_CHAPTERS.map((chap, cIdx) => (
                        <button
                          key={chap.label}
                          onClick={() => setActiveChapter(cIdx)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-semibold backdrop-blur ${activeChapter === cIdx ? 'bg-rose-500 text-white' : 'bg-black/50 text-slate-200'}`}
                        >
                          {chap.label} ({chap.time})
                        </button>
                      ))}
                    </div>

                    <div className="client-rail absolute right-3 top-1/3 z-10 flex flex-col items-center gap-3 text-[11px] font-semibold">
                      <button aria-label="Logement précédent" disabled={index === 0} onClick={() => setIndex(index - 1)} className="rounded-full bg-black/55 p-2.5 disabled:opacity-40"><ChevronUp /></button>
                      <button aria-label={favorites.includes(item.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => requireLogin(() => props.onFavorite(item.id, favorites.includes(item.id)))} className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-black/55 p-2.5"><Heart fill={favorites.includes(item.id) ? 'currentColor' : 'none'} className={favorites.includes(item.id) ? 'text-rose-500' : ''} /></span>Aimer
                      </button>
                      <button onClick={() => open(item, 'verification')} className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-black/55 p-2.5"><ShieldCheck className="text-emerald-400" /></span>Contrôles
                      </button>
                      <button onClick={() => open(item, 'booking')} className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-rose-500 p-2.5"><CalendarDays /></span>{item.rental_mode === 'SHORT_STAY' ? 'Réserver' : 'Visiter'}
                      </button>
                      <button onClick={() => open(item, 'details')} className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-black/55 p-2.5"><Info /></span>Fiche
                      </button>
                      <button onClick={() => void share(item)} className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-black/55 p-2.5"><Share2 /></span>Partager
                      </button>
                      <button aria-label="Logement suivant" disabled={index >= feedItems.length - 1} onClick={() => setIndex(index + 1)} className="rounded-full bg-black/55 p-2.5 disabled:opacity-40"><ChevronDown /></button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pr-20">
                      <span className="text-2xl font-black">{amount(item.price_cdf)} CDF</span>
                      <span className="text-sm"> / {item.rental_mode === 'SHORT_STAY' ? 'nuit' : 'mois'}</span>
                      <h1 className="mt-1 line-clamp-2 text-lg font-black">{item.title}</h1>
                      <p className="mt-1 flex items-center gap-1 text-sm">
                        <MapPin size={14} className="text-rose-400" /> {item.commune}{item.data?.neighborhood || item.data?.quartier ? ` · ${item.data?.neighborhood || item.data?.quartier}` : ''}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-200">
                        {item.data?.amenities?.length ? item.data.amenities.join(' · ') : item.data?.utilities?.electricity?.type || 'Équipements vérifiés'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className={`${button} bg-rose-500 shadow-lg shadow-rose-950/60`} onClick={() => open(item, 'booking')}>
                          {item.rental_mode === 'SHORT_STAY' ? 'Demander à réserver' : 'Demander une visite'}
                        </button>
                        <button className={`${button} bg-white/20`} onClick={() => open(item, 'details')}>Détails</button>
                        <button className={`${button} bg-emerald-600/80`} onClick={() => setShowCompliance(true)}>Loi 15/025</button>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">
                        {index + 1} / {feedItems.length} · {item.rental_mode === 'SHORT_STAY' ? 'Avance de 20 % à l’hôte après acceptation' : 'Bail et dépôt selon conditions affichées'}
                      </p>
                      {shareNote && <p role="status" className="text-xs text-emerald-300">{shareNote}</p>}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <Video size={42} className="text-rose-500" />
                <h1 className="text-2xl font-black">Feed vidéo NZUBU</h1>
                <p className="text-slate-300">Aucun logement publié pour ces filtres. Les annonces vérifiées apparaîtront ici automatiquement.</p>
                <button className={`${button} bg-white text-slate-950`} onClick={() => { props.onFilters({ commune: '', mode: '', furnished: '', maxPriceCdf: '' }); go('explore'); }}>
                  Explorer les filtres
                </button>
              </div>
            )}
          </section>
        )}

        {tab === 'explore' && (
          <section className="space-y-5 px-4 py-5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-black">Explorer</h1>
              {compareIds.length > 0 && (
                <button onClick={() => setShowComparator(true)} className={`${button} bg-indigo-600 text-xs`}>
                  <Layers size={14} className="mr-1 inline" /> Comparer ({compareIds.length}/3)
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 flex items-center gap-2 rounded-xl bg-slate-800 px-3">
                <Search size={18} />
                <input aria-label="Commune" placeholder="Commune" className="min-h-11 w-full bg-transparent outline-none" value={filters.commune} onChange={(event) => props.onFilters({ ...filters, commune: event.target.value })} />
              </label>
              <select aria-label="Durée" className="min-h-11 rounded-xl bg-slate-800 px-3" value={filters.mode} onChange={(event) => props.onFilters({ ...filters, mode: event.target.value })}>
                <option value="">Toutes durées</option>
                <option value="SHORT_STAY">Courte durée</option>
                <option value="LONG_TERM">Bail résidentiel</option>
              </select>
              <select aria-label="Meublé" className="min-h-11 rounded-xl bg-slate-800 px-3" value={filters.furnished} onChange={(event) => props.onFilters({ ...filters, furnished: event.target.value })}>
                <option value="">Tous les logements</option>
                <option value="true">Meublé</option>
                <option value="false">Non meublé</option>
              </select>
              <input aria-label="Budget maximum CDF" type="number" min="1" placeholder="Budget max. CDF" className="min-h-11 rounded-xl bg-slate-800 px-3" value={filters.maxPriceCdf} onChange={(event) => props.onFilters({ ...filters, maxPriceCdf: event.target.value })} />
              <select aria-label="Trier par" className="min-h-11 rounded-xl bg-slate-800 px-3" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="DEFAULT">Tri : Recommandés</option>
                <option value="PRICE_ASC">Prix croissant</option>
                <option value="PRICE_DESC">Prix décroissant</option>
                <option value="ENERGY">Autonomie Énergie/Eau</option>
              </select>
            </div>

            {bannerAds.length > 0 && (
              <div className="space-y-2">
                {bannerAds.map((ad) => (
                  <div key={ad.id} className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-slate-900 p-3">
                    <img src={ad.thumbnailUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">{ad.badgeLabel}</span>
                      <p className="mt-1 truncate text-sm font-bold">{ad.title}</p>
                      <p className="truncate text-xs text-slate-300">{ad.tagline}</p>
                    </div>
                    <a
                      href={ad.ctaActionType === 'WHATSAPP' ? `https://wa.me/${ad.ctaTarget.replace(/\D/g, '')}` : ad.ctaTarget}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => props.onAdClick?.(ad.id)}
                      className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950"
                    >
                      {ad.ctaText}
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {sortedListings.map((item) => {
                const isCompared = compareIds.includes(item.id);
                const posterSrc = item.data?.media?.videoThumbnail || item.data?.media?.photos?.[0] || `/v1/listings/${item.id}/poster`;
                return (
                  <article key={item.id} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                    <img src={posterSrc} alt="" className="h-28 w-24 shrink-0 rounded-xl bg-slate-800 object-cover" />
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 font-bold">{item.title}</h2>
                      <p className="text-xs text-slate-400">{item.commune} · {item.rental_mode === 'SHORT_STAY' ? 'Courte durée' : 'Bail'}</p>
                      <p className="mt-1 text-sm font-bold text-amber-300">{amount(item.price_cdf)} CDF / {item.rental_mode === 'SHORT_STAY' ? 'nuit' : 'mois'}</p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <button className="text-sm font-semibold text-emerald-300" onClick={() => open(item, 'details')}>Fiche</button>
                        <button className="text-sm font-semibold text-rose-300" onClick={() => open(item, 'booking')}>{item.rental_mode === 'SHORT_STAY' ? 'Réserver' : 'Visiter'}</button>
                        <button className={`text-xs font-semibold ${isCompared ? 'text-indigo-300' : 'text-slate-400'}`} onClick={() => toggleCompare(item.id)}>
                          {isCompared ? '✓ Comparé' : '+ Comparer'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!sortedListings.length && <p className="rounded-xl bg-slate-900 p-5 text-slate-400">Aucun logement pour ces filtres. Les prochaines annonces publiées apparaîtront ici.</p>}
            </div>
          </section>
        )}

        {tab === 'dossiers' && (
          <section className="space-y-5 px-4 py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black">Mes dossiers</h1>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{bookings.length + viewings.length + applications.length} demandes</span>
            </div>
            {!authenticated && <button className={`${button} w-full bg-rose-500`} onClick={login}>Se connecter pour suivre mes demandes</button>}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['Séjours', 'Visites', 'Candidatures', 'Favoris', 'Assistance', 'Notifications', 'Compte'].map((name) => (
                <button key={name} onClick={() => setDossierSection(name)} className={`${button} shrink-0 ${dossierSection === name ? 'bg-rose-500' : 'bg-slate-800'}`}>{name}</button>
              ))}
            </div>
            {dossierSection === 'Séjours' && (
              <div className="space-y-3">
                <h2 className="font-bold">Mes réservations ({bookings.length})</h2>
                {!bookings.length && <Empty text="Aucun séjour demandé. Vos demandes, paiements directs et remboursements apparaîtront ici." />}
                {bookings.map((item) => {
                  const listingObj = richListings.find((l) => l.id === item.listing_id);
                  const mappedBooking = apiBookingToBookingRequest(item, listingObj);
                  return (
                    <article key={item.id} className="space-y-3 rounded-2xl bg-slate-900 p-4">
                      <strong>{listingName(item.listing_id)}</strong>
                      <p className="text-sm text-slate-300">{item.check_in.slice(0, 10)} → {item.check_out.slice(0, 10)} · {item.status}</p>
                      <ProgressStepper
                        accentColor="sky"
                        steps={[
                          { id: 'req', label: 'Demande', isCompleted: true, isCurrent: item.status === 'REQUESTED' },
                          { id: 'acc', label: 'Accord hôte', isCompleted: ['HOST_ACCEPTED_TERMS', 'PAYMENT_DECLARED', 'CONFIRMED', 'COMPLETED'].includes(item.status), isCurrent: item.status === 'HOST_ACCEPTED_TERMS' },
                          { id: 'pay', label: 'Paiement', isCompleted: ['PAYMENT_DECLARED', 'CONFIRMED', 'COMPLETED'].includes(item.status), isCurrent: item.status === 'PAYMENT_DECLARED' },
                          { id: 'conf', label: 'Confirmé', isCompleted: ['CONFIRMED', 'COMPLETED'].includes(item.status), isCurrent: ['CONFIRMED', 'COMPLETED'].includes(item.status) },
                        ]}
                      />
                      <p className="text-sm">Total : {amount(item.price_cdf)} CDF · Avance 20 % : {amount(item.advance_cdf || item.price_cdf * 0.2)} CDF</p>
                      {item.refund_status === 'PENDING_PARTNER' && <p className="text-amber-300">Remboursement attendu de l’hôte : {amount(item.refund_due_cdf || 0)} CDF</p>}
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'HOST_ACCEPTED_TERMS' && (
                          <>
                            <button className={`${button} bg-sky-600`} onClick={() => { setPaymentModalBooking(item); setPaymentRef(''); }}>
                              Déclarer mon paiement Mobile Money
                            </button>
                            {listingObj && (
                              <button
                                className={`${button} bg-indigo-600`}
                                onClick={() => setDiasporaTarget({ listing: listingObj, bookingId: item.id, amountCdf: item.advance_cdf || Math.round(item.price_cdf * 0.2) })}
                              >
                                <Globe2 size={14} className="mr-1 inline" /> Paiement Diaspora
                              </button>
                            )}
                          </>
                        )}
                        {['PAYMENT_DECLARED', 'CONFIRMED', 'COMPLETED'].includes(item.status) && (
                          <button className={`${button} bg-emerald-700`} onClick={() => exportReceiptPdf(mappedBooking)}>
                            <FileText size={14} className="mr-1 inline" /> Reçu PDF
                          </button>
                        )}
                        {!['CANCELLED', 'COMPLETED'].includes(item.status) && (
                          <button className={`${button} bg-rose-900`} onClick={() => { if (confirm('Annuler cette réservation ?')) props.onCancelBooking(item.id); }}>Annuler</button>
                        )}
                      </div>
                      <CaseEvidence type="booking" id={item.id} role="CLIENT" />
                    </article>
                  );
                })}
              </div>
            )}
            {dossierSection === 'Visites' && (
              <div className="space-y-3">
                <h2 className="font-bold">Mes visites ({viewings.length})</h2>
                {!viewings.length && <Empty text="Aucune visite demandée. Les créneaux et comptes rendus apparaîtront ici." />}
                {viewings.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-slate-900 p-4">
                    <strong>{listingName(item.listing_id)}</strong>
                    <p className="text-sm text-slate-300">{item.status} · Demandée : {item.slots?.[0]?.slice(0, 16) || 'créneau à préciser'}</p>
                    {item.scheduled_at && <p className="text-sm">Confirmée : {item.scheduled_at.slice(0, 16)}</p>}
                    {item.outcome_note && <p className="text-sm">Compte rendu : {item.outcome_note}</p>}
                  </article>
                ))}
              </div>
            )}
            {dossierSection === 'Candidatures' && (
              <div className="space-y-3">
                <h2 className="font-bold">Mes candidatures ({applications.length})</h2>
                {!applications.length && <Empty text="Aucune candidature déposée. Le suivi des baux et les preuves apparaîtront ici." />}
                {applications.map((item) => (
                  <article key={item.id} className="space-y-2 rounded-2xl bg-slate-900 p-4">
                    <strong>{listingName(item.listing_id)}</strong>
                    <p className="text-sm text-slate-300">{item.status} · {item.message}</p>
                    {item.agreed_rent_cdf && <p className="text-sm">Loyer convenu : {amount(item.agreed_rent_cdf)} CDF</p>}
                    <CaseEvidence type="lease" id={item.id} role="CLIENT" />
                  </article>
                ))}
              </div>
            )}
            {dossierSection === 'Favoris' && (
              <div className="space-y-3">
                <h2 className="font-bold">Mes favoris ({favorites.length})</h2>
                {!favorites.length && <Empty text="Aucun favori. Touchez le cœur dans le feed pour retrouver un logement ici." />}
                {favorites.map((id) => {
                  const item = listings.find((listing) => listing.id === id);
                  return item ? <button key={id} onClick={() => open(item, 'details')} className="block w-full rounded-2xl bg-slate-900 p-4 text-left font-semibold">{item.title}</button> : <p key={id} className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-400">Ce logement n’est plus publié.</p>;
                })}
              </div>
            )}
            {dossierSection === 'Assistance' && (
              <div className="space-y-3">
                <h2 className="font-bold">Assistance ({tickets.length})</h2>
                <textarea value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} placeholder="Décrivez votre problème" className="min-h-24 w-full rounded-xl bg-slate-800 p-3" />
                <button disabled={!ticketMessage.trim()} className={`${button} bg-indigo-600 disabled:opacity-40`} onClick={() => requireLogin(() => { props.onTicket(ticketMessage.trim()); setTicketMessage(''); })}>Envoyer un signalement</button>
                {!tickets.length && <Empty text="Aucun ticket. Vos échanges avec l’assistance apparaîtront ici." />}
                {tickets.map((item) => <p key={item.id} className="rounded-2xl bg-slate-900 p-4 text-sm"><strong>{item.category} · {item.status}</strong><br />{item.message}</p>)}
              </div>
            )}
            {dossierSection === 'Notifications' && (
              <div className="space-y-3">
                <h2 className="font-bold">Notifications ({notifications.length})</h2>
                {!notifications.length && <Empty text="Aucune notification pour le moment." />}
                {notifications.map((item) => <p key={item.id} className="rounded-2xl bg-slate-900 p-4 text-sm"><strong>{item.subject}</strong><br />{item.body}</p>)}
              </div>
            )}
            {dossierSection === 'Compte' && (
              <div className="space-y-3">
                <h2 className="font-bold">Mon compte</h2>
                <p className="text-sm text-slate-400">Gérez l’accès à vos données et à vos demandes.</p>
                {authenticated ? <button className={`${button} bg-rose-950 text-rose-200`} onClick={props.onCloseAccount}>Fermer mon compte</button> : <button className={`${button} bg-rose-500`} onClick={login}>Se connecter</button>}
              </div>
            )}
          </section>
        )}
      </div>

      <nav aria-label="Navigation client" className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[calc(5.25rem+env(safe-area-inset-bottom))] max-w-3xl items-start justify-around border-t border-slate-800 bg-[#03091c]/95 pt-2 backdrop-blur sm:border-x" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {([['feed', Video, 'Feed Vidéo'], ['explore', Compass, 'Explorer'], ['dossiers', ClipboardList, 'Dossiers']] as const).map(([name, Icon, label]) => (
          <button key={name} onClick={() => go(name)} aria-current={tab === name ? 'page' : undefined} className={`flex min-w-20 flex-col items-center gap-1 p-2 text-[11px] font-bold ${tab === name ? 'text-rose-500' : 'text-slate-400'}`}>
            <Icon size={22} /><span>{label}</span>{name === 'dossiers' && notifications.length > 0 && <span className="absolute ml-9 h-2 w-2 rounded-full bg-rose-500" />}
          </button>
        ))}
      </nav>

      {panel && selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={() => setPanel(null)}>
          <section role="dialog" aria-modal="true" aria-label={panel === 'booking' ? 'Demande' : 'Vérification'} onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-950 p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">{panel === 'verification' ? 'Contrôles NZUBU' : 'Faire une demande'}</p>
                <h2 className="mt-1 text-xl font-black">{selected.title}</h2>
              </div>
              <button aria-label="Fermer" onClick={() => setPanel(null)} className="rounded-full bg-slate-800 p-2"><X /></button>
            </div>
            {panel === 'verification' && (
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={18} /> Annonce publiée après revue terrain</p>
                <p>Vérifiée le {selected.verified_at?.slice(0, 10) || 'date non renseignée'} ; badge valide jusqu’au {selected.verified_until?.slice(0, 10) || 'date non renseignée'}.</p>
                <p>Contrôles : identité, droit de proposer, présence physique, eau, électricité, pièces, prix, vidéo et sécurité.</p>
                <p className="text-slate-400">La disponibilité et l’état du logement peuvent changer. Vérifiez les détails avant de vous engager.</p>
              </div>
            )}
            {panel === 'booking' && (
              <div className="space-y-4 text-sm">
                {!authenticated && <button className={`${button} w-full bg-rose-500`} onClick={login}>Se connecter pour continuer</button>}
                {selected.rental_mode === 'SHORT_STAY' ? (
                  <>
                    <p>Prix : {amount(selected.price_cdf)} CDF par nuit. L’avance de 20 % est versée directement à l’hôte après son acceptation.</p>
                    <button onClick={() => void loadAvailability(selected.id)} className="text-sky-300 underline">Actualiser les disponibilités</button>
                    <AvailabilityCalendar periods={periods} selectedStart={checkIn} selectedEnd={checkOut} onSelect={calendarLoaded ? (date) => { if (!checkIn || checkOut || date <= checkIn) { setCheckIn(date); setCheckOut(''); } else setCheckOut(date); } : undefined} />
                    {!calendarLoaded && <p className="text-amber-300">Chargement des disponibilités requis avant la demande.</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <label>Arrivée<input type="date" className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
                      <label>Départ<input type="date" className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
                    </div>
                    <label>Voyageurs<input type="number" min="1" max="20" className="mt-1 block w-24 rounded-lg bg-slate-800 p-2" value={occupants} onChange={(event) => setOccupants(Number(event.target.value))} /></label>
                    <p>Conditions : {selected.data?.conditions || 'À confirmer avec l’hôte'}</p>
                    <label className="flex gap-2"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /> J’accepte les conditions affichées et le paiement direct à l’hôte.</label>
                    <button disabled={!authenticated || !calendarLoaded || !checkIn || !checkOut || checkOut <= checkIn || !accepted || occupants < 1 || occupants > 20} className={`${button} w-full bg-rose-500 disabled:opacity-40`} onClick={() => { props.onBooking(selected, checkIn, checkOut, occupants); setPanel(null); go('dossiers'); }}>Envoyer ma demande de réservation</button>
                  </>
                ) : (
                  <>
                    <p>Prix : {amount(selected.price_cdf)} CDF par mois.</p>
                    <label>Créneau souhaité<input type="datetime-local" className="mt-1 block w-full rounded-lg bg-slate-800 p-2" value={slot} onChange={(event) => setSlot(event.target.value)} /></label>
                    <button disabled={!authenticated || !slot} className={`${button} w-full bg-rose-500 disabled:opacity-40`} onClick={() => { props.onViewing(selected, slot); setPanel(null); go('dossiers'); setDossierSection('Visites'); }}>Demander une visite</button>
                    <label>Candidature<textarea className="mt-1 block min-h-24 w-full rounded-lg bg-slate-800 p-2" placeholder="Présentez votre dossier" value={applicationMessage} onChange={(event) => setApplicationMessage(event.target.value)} /></label>
                    <button disabled={!authenticated || !applicationMessage.trim()} className={`${button} w-full bg-indigo-600 disabled:opacity-40`} onClick={() => { props.onApplication(selected, applicationMessage.trim()); setApplicationMessage(''); setPanel(null); go('dossiers'); setDossierSection('Candidatures'); }}>Déposer une candidature</button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {paymentModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setPaymentModalBooking(null)}>
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Déclarer le paiement Mobile Money</h3>
              <button onClick={() => setPaymentModalBooking(null)}><X size={18} /></button>
            </div>
            <label className="block text-xs text-slate-300">
              Votre numéro Mobile Money
              <input value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="+243 81..." />
            </label>
            {detectedOperator && (
              <p className="rounded-lg bg-emerald-950/60 p-2 text-xs text-emerald-300">
                Opérateur détecté : <strong>{detectedOperator.name}</strong> (composez {detectedOperator.code})
              </p>
            )}
            <label className="block text-xs text-slate-300">
              Référence de transaction (SMS / reçu)
              <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="Ex: MP-261114-9921" />
            </label>
            <button
              disabled={paymentRef.trim().length < 3}
              className={`${button} w-full bg-sky-600 disabled:opacity-40`}
              onClick={() => {
                props.onDeclarePayment(paymentModalBooking.id, paymentRef.trim(), detectedOperator?.method);
                setPaymentModalBooking(null);
              }}
            >
              Confirmer la référence
            </button>
          </div>
        </div>
      )}

      {richDetailListing && (
        <ListingDetailModal
          listing={richDetailListing}
          onClose={() => setRichDetailListing(null)}
          onOpenBooking={(l) => {
            const raw = listings.find((x) => x.id === l.id);
            setRichDetailListing(null);
            if (raw) open(raw, 'booking');
          }}
          onOpenViewing={(l) => {
            const raw = listings.find((x) => x.id === l.id);
            setRichDetailListing(null);
            if (raw) open(raw, 'booking');
          }}
          onOpenVerification={(l) => {
            const raw = listings.find((x) => x.id === l.id);
            setRichDetailListing(null);
            if (raw) open(raw, 'verification');
          }}
        />
      )}

      {showComparator && (
        <ListingComparatorModal
          listings={richListings.filter((l) => compareIds.includes(l.id))}
          onClose={() => setShowComparator(false)}
          onRemoveFromCompare={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          onOpenBooking={(l) => {
            const raw = listings.find((x) => x.id === l.id);
            setShowComparator(false);
            if (raw) open(raw, 'booking');
          }}
          onOpenViewing={(l) => {
            const raw = listings.find((x) => x.id === l.id);
            setShowComparator(false);
            if (raw) open(raw, 'booking');
          }}
        />
      )}

      {showCompliance && <ComplianceBadgeModal onClose={() => setShowCompliance(false)} />}

      {chatListing && (
        <SecureChatModal
          listing={chatListing}
          currentUserRole="CLIENT"
          currentUserName={props.userEmail || 'Client NZUBU'}
          onClose={() => setChatListing(null)}
        />
      )}

      {diasporaTarget && (
        <DiasporaPaymentModal
          listing={diasporaTarget.listing}
          booking={
            diasporaTarget.bookingId
              ? (() => {
                  const rawB = bookings.find((b) => b.id === diasporaTarget.bookingId);
                  return rawB ? apiBookingToBookingRequest(rawB, diasporaTarget.listing) : undefined;
                })()
              : undefined
          }
          onClose={() => setDiasporaTarget(null)}
          onSuccess={(payment) => {
            if (diasporaTarget.bookingId) {
              props.onDeclarePayment(
                diasporaTarget.bookingId,
                payment.guaranteeCertificateNumber || payment.id,
                'MAISHAPAY_CARD',
                payment.currency,
                payment.amountOriginal
              );
            }
            setDiasporaTarget(null);
          }}
        />
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-400">{text}</p>;
}
