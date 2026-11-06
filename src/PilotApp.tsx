import React, { useEffect, useRef, useState } from 'react';
import { clearAllMissionDrafts, clearMissionDraft, listMissionDraftIds, readMissionDraft, saveMissionDraft, type PendingMissionReport } from './offlineMission';
import { CaseEvidence } from './components/CaseEvidence';
import { LiveClientExperience } from './components/client/LiveClientExperience';
import { LiveAgentWorkspace } from './components/agent/LiveAgentWorkspace';
import { LivePartnerDashboard } from './components/partner/LivePartnerDashboard';
import { LiveAdminDashboard } from './components/admin/LiveAdminDashboard';
import { LayoutDashboard, LogOut, ShieldCheck, Video } from 'lucide-react';

type User = { id: string; role: 'CLIENT' | 'PARTNER' | 'FIELD_AGENT' | 'OPERATIONS_ADMIN'; email: string | null; phone: string | null };
type Listing = { id: string; title: string; commune: string; rental_mode: 'SHORT_STAY' | 'LONG_TERM'; price_cdf: number; partner_id?: string; status?: string; video_status?: string; duplicate_of?: string; verified_until?: string; verified_at?: string; verified_by?: string; partner_email?: string | null; partner_phone?: string | null; data?: { description?: string; furnished?: boolean; propertyType?: string; neighborhood?: string; amenities?: string[]; chargesCdf?: number; securityDepositMonths?: number; conditions?: string } };
type Mission = { id: string; listing_id: string; agent_id?: string; status: string; outcome?: string; report?: Record<string, unknown>; submitted_at?: string; created_at?: string };
type Booking = { id: string; listing_id: string; check_in: string; check_out: string; status: string; price_cdf: number; advance_cdf?: number; occupants?: number; payment_reference?: string; guest_email?: string | null; guest_phone?: string | null; hold_expires_at?: string; refund_due_cdf?: number; refund_status?: string };
type Document = { id: string; kind: string; approved_at: string | null };
type Ticket = { id: string; listing_id?: string; booking_id?: string; category: string; message: string; status: string; priority?: string; created_at?: string };
type Invoice = { id: string; amount_cdf: number; status: string; booking_id: string };
type Notification = { id: string; subject: string; body: string; created_at: string };
type LeaseApplication = { id: string; listing_id: string; status: string; message: string; agreed_rent_cdf?: number };
type Viewing = { id: string; listing_id: string; status: string; slots: string[]; scheduled_at?: string; completed_at?: string; outcome_note?: string };
type Block = { id: string; listing_id: string; check_in: string; check_out: string; reason: string };

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/v1${path}`, { credentials: 'include', ...options,
    headers: { ...(options.body && !(options.body instanceof Blob) ? { 'content-type': 'application/json' } : {}), ...options.headers } });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    const messages: Record<string,string> = {
      BREVO_AUTH_FAILED: 'Brevo refuse la clé API configurée. Vérifiez ou recréez une clé API v3 dans Brevo.',
      EMAIL_DELIVERY_UNAVAILABLE: 'L’envoi de l’e-mail est indisponible. Vérifiez l’expéditeur Brevo et réessayez.',
      INVALID_CREDENTIALS: 'Identifiant ou mot de passe incorrect.',
      INVALID_LOGIN: 'Saisissez une adresse e-mail ou un numéro de téléphone valide.',
      INVALID_REGISTRATION: 'Vérifiez l’e-mail et choisissez un mot de passe de 10 à 128 caractères.',
      INVALID_PHONE: 'Utilisez un numéro international, par exemple +243810000000.',
      PHONE_IN_USE: 'Ce numéro est déjà associé à un compte.',
      ACCOUNT_EXISTS: 'Ce compte possède déjà un mot de passe. Connectez-vous.',
      ACCOUNT_CLOSED: 'Ce compte est fermé.',
      CODE_REJECTED: 'Code incorrect ou expiré. Demandez un nouveau code si nécessaire.',
      WAIT_BEFORE_RETRY: 'Patientez une minute avant de demander un nouveau code.',
      RATE_LIMITED: 'Trop de tentatives. Réessayez plus tard.',
    };
    throw new Error(messages[data.error] || data.error || `Erreur HTTP ${response.status}`);
  }
  return data as T;
}

const post = <T,>(path: string, body?: unknown, headers?: Record<string,string>) =>
  api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers });

const checkLabels: Record<string,string> = {
  identityVerified: 'Identité vérifiée', mandateOrTitleChecked: 'Titre ou mandat contrôlé',
  physicalPresenceConfirmed: 'Logement présent sur place', waterSupplyTested: 'Eau testée',
  electricityTested: 'Électricité testée', roomsMatchedListing: 'Pièces conformes',
  pricingInCdfNoExcessiveDeposit: 'Prix et caution conformes', videoFilmedVerticalNoFaces: 'Vidéo contrôlée',
  safetyEgressChecked: 'Issues et serrures contrôlées',
};

const roleNames: Record<User['role'], string> = {
  CLIENT: 'Espace client', PARTNER: 'Espace bailleur et hôte',
  FIELD_AGENT: 'Espace agent terrain', OPERATIONS_ADMIN: 'Administration et opérations',
};

export default function PilotApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [message, setMessage] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Record<string,Document[]>>({});
  const [availability, setAvailability] = useState<Record<string,Array<{check_in:string;check_out:string}>>>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filters, setFilters] = useState({ commune: '', mode: '', furnished: '', maxPriceCdf: '' });
  const [blockDates, setBlockDates] = useState({ checkIn: '', checkOut: '', reason: '' });
  const [partnerListingOpen, setPartnerListingOpen] = useState(true);
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedAgentFor, setSelectedAgentFor] = useState<Record<string, string>>({});
  const [newPartnerFor, setNewPartnerFor] = useState<Record<string,string>>({});
  const [checks, setChecks] = useState<Record<string,boolean>>(Object.fromEntries(Object.keys(checkLabels).map((key) => [key,false])));
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracyMeters: number } | null>(null);
  const [outcome, setOutcome] = useState('PASS');
  const [notes, setNotes] = useState('');
  const [offlinePhotos, setOfflinePhotos] = useState<File[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [reportKey, setReportKey] = useState<string>(() => crypto.randomUUID());
  const [draftPending, setDraftPending] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [commune, setCommune] = useState('Gombe');
  const [rentalMode, setRentalMode] = useState<'SHORT_STAY'|'LONG_TERM'>('SHORT_STAY');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [chargesCdf, setChargesCdf] = useState('');
  const [securityDepositMonths, setSecurityDepositMonths] = useState(0);
  const [conditions, setConditions] = useState('');
  const [videoChecks, setVideoChecks] = useState<Record<string,Record<string,boolean>>>({});
  const [videoNotes, setVideoNotes] = useState<Record<string,string>>({});
  const [videoDuplicateReviewed, setVideoDuplicateReviewed] = useState<Record<string,boolean>>({});
  const [documentKind, setDocumentKind] = useState('TITLE');
  const actionBusy = useRef(false);
  const syncBusy = useRef(false);
  const bookingKeys = useRef<Record<string,string>>({});

  const refresh = async (actor: User | null = user) => {
    if (!actor) {
      const publicData = await api<{ listings: Listing[] }>('/listings');
      setListings(publicData.listings);
      return;
    }
    const listPath = actor.role === 'OPERATIONS_ADMIN' ? '/admin/listings' : actor.role === 'PARTNER' ? '/partner/listings' : actor.role === 'FIELD_AGENT' ? '/agent/listings' : '/listings';
    const tasks: Promise<unknown>[] = [api<{ listings: Listing[] }>(listPath).then((value) => setListings(value.listings))];
    if (actor.role === 'CLIENT') tasks.push(api<{ listingIds: string[] }>('/me/favorites').then((value) => setFavoriteIds(value.listingIds)));
    if (actor.role !== 'FIELD_AGENT') tasks.push(api<{ bookings: Booking[] }>('/bookings').then((value) => setBookings(value.bookings)));
    if (actor.role !== 'FIELD_AGENT') tasks.push(api<{ applications: LeaseApplication[] }>('/lease-applications').then((value) => setApplications(value.applications)));
    if (actor.role !== 'FIELD_AGENT') tasks.push(api<{ viewings: Viewing[] }>('/viewings').then((value) => setViewings(value.viewings)));
    tasks.push(api<{ tickets: Ticket[] }>('/tickets').then((value) => setTickets(value.tickets)));
    tasks.push(api<{ notifications: Notification[] }>('/notifications').then((value) => setNotifications(value.notifications)));
    if (['PARTNER','OPERATIONS_ADMIN'].includes(actor.role)) tasks.push(api<{ invoices: Invoice[] }>('/invoices').then((value) => setInvoices(value.invoices)));
    if (actor.role === 'PARTNER') tasks.push(api<{ blocks: Block[] }>('/partner/blocks').then((value) => setBlocks(value.blocks)));
    if (['FIELD_AGENT','OPERATIONS_ADMIN'].includes(actor.role)) tasks.push(api<{ missions: Mission[] }>('/missions').then((value) => setMissions(value.missions)));
    if (actor.role === 'OPERATIONS_ADMIN') tasks.push(api<{ users: User[] }>('/admin/users').then((value) => setUsers(value.users)));
    await Promise.all(tasks);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) void navigator.serviceWorker.register('/sw.js');
    api<{ user: User | null }>('/me').then(async ({ user }) => {
      setUser(user);
      await refresh(user);
    }).catch((error) => setMessage(String(error))).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const update = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void refresh(user).catch((error) => setMessage(String(error)));
    };
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('online', update);
    return () => { window.clearInterval(timer); window.removeEventListener('online', update); };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role && user.role !== 'CLIENT') return;
    const params = new URLSearchParams(Object.entries(filters).filter(([,value]) => value));
    const timer = window.setTimeout(() => {
      void api<{ listings: Listing[] }>(`/listings?${params}`).then((result) => setListings(result.listings)).catch((error) => setMessage(String(error)));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [filters, user?.role]);

  useEffect(() => {
    if (!user || !selectedMission || !draftLoaded) return;
    const mission = missions.find((item) => item.id === selectedMission);
    if (!mission || !['ASSIGNED', 'IN_PROGRESS'].includes(mission.status)) return;
    void saveMissionDraft(user.id, { missionId: mission.id, listingId: mission.listing_id, checks, gps, outcome, notes, photos: offlinePhotos, photoCaptions, idempotencyKey: reportKey, queued: draftPending })
      .catch(() => setMessage('Brouillon local non enregistré : stockage indisponible.'));
  }, [user, selectedMission, draftLoaded, checks, gps, outcome, notes, offlinePhotos, photoCaptions, reportKey, missions, draftPending]);

  const action = async (work: () => Promise<unknown>, success: string) => {
    if (actionBusy.current) return;
    actionBusy.current = true;
    setMessage('');
    try { await work(); setMessage(success); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { actionBusy.current = false; }
  };

  const loadDocuments = async (listingId: string) => {
    setSelectedListing(listingId);
    await action(async () => {
      const result = await api<{ documents: Document[] }>(`/listings/${listingId}/documents`);
      setDocuments((current) => ({ ...current, [listingId]: result.documents }));
    }, 'Pièces chargées.');
  };

  const upload = async (listingId: string, file: File, kind: string) => {
    await action(() => api(`/listings/${listingId}/documents`, { method: 'POST', body: file, headers: { 'content-type': file.type, 'x-document-kind': kind } }), 'Document privé chargé.');
    const result = await api<{ documents: Document[] }>(`/listings/${listingId}/documents`);
    setDocuments((current) => ({ ...current, [listingId]: result.documents }));
  };

  const selectFieldMission = async (mission: Mission) => {
    setDraftLoaded(false);
    setSelectedMission(mission.id);
    const draft = user ? await readMissionDraft(user.id, mission.id) : undefined;
    setChecks(draft?.checks || Object.fromEntries(Object.keys(checkLabels).map((key) => [key,false])));
    setGps(draft?.gps || null);
    setOutcome(draft?.outcome || 'PASS');
    setNotes(draft?.notes || '');
    setOfflinePhotos(draft?.photos || []);
    setPhotoCaptions((draft?.photos || []).map((_, index) => draft?.photoCaptions?.[index] || 'Preuve de mission'));
    setReportKey(draft?.idempotencyKey || crypto.randomUUID());
    setDraftPending(Boolean(draft?.queued));
    setDraftLoaded(true);
  };

  const submitFieldMission = async (mission: Mission) => {
    if (!user || !gps || syncBusy.current) return;
    const draft: PendingMissionReport = { missionId: mission.id, listingId: mission.listing_id, checks, gps, outcome, notes, photos: offlinePhotos, photoCaptions, idempotencyKey: reportKey, queued: true };
    try { await saveMissionDraft(user.id, draft); setDraftPending(true); }
    catch (error) {
      setMessage(`Brouillon local non enregistré : ${String(error)}`);
      if (!navigator.onLine) return;
    }
    if (!navigator.onLine) { setMessage('Rapport conservé sur cet appareil. Synchronisez au retour du réseau.'); return; }
    syncBusy.current = true;
    try {
      const photoIds: string[] = [];
      for (const [index, file] of draft.photos.entries()) {
        const uploaded = await api<{ document: Document }>(`/listings/${draft.listingId}/documents`, { method: 'POST', body: file, headers: { 'content-type': file.type, 'x-document-kind': 'INSPECTION_PHOTO', 'idempotency-key': `${draft.idempotencyKey}-${index}` } });
        photoIds.push(uploaded.document.id);
      }
      await post(`/missions/${draft.missionId}/report`, { outcome: draft.outcome, checks: draft.checks, gps: draft.gps, photoIds, photoCaptions: draft.photoCaptions || [], notes: draft.notes }, { 'idempotency-key': draft.idempotencyKey });
      await clearMissionDraft(user.id, draft.missionId);
      setDraftPending(false);
      setOfflinePhotos([]);
      setPhotoCaptions([]);
      setMessage('Rapport synchronisé.');
      await refresh();
    } catch (error) { setMessage(`Synchronisation en attente : ${String(error)}`); }
    finally { syncBusy.current = false; }
  };

  useEffect(() => {
    if (!draftPending || !selectedMission || !draftLoaded || !user || user.role !== 'FIELD_AGENT') return;
    const mission = missions.find((item) => item.id === selectedMission);
    if (!mission || !['ASSIGNED', 'IN_PROGRESS'].includes(mission.status)) return;
    const retry = () => { if (navigator.onLine) void submitFieldMission(mission); };
    window.addEventListener('online', retry);
    const timer = window.setTimeout(retry, 1000);
    return () => { window.removeEventListener('online', retry); window.clearTimeout(timer); };
  }, [draftPending, selectedMission, draftLoaded, user, missions, checks, gps, outcome, notes, offlinePhotos, photoCaptions, reportKey]);

  useEffect(() => {
    if (!user || user.role !== 'FIELD_AGENT' || !missions.length || selectedMission) return;
    void listMissionDraftIds(user.id).then((ids) => {
      const mission = missions.find((item) => ids.includes(item.id) && ['ASSIGNED', 'IN_PROGRESS'].includes(item.status))
        || missions.find((item) => ['ASSIGNED', 'IN_PROGRESS'].includes(item.status));
      if (mission) void selectFieldMission(mission);
    }).catch(() => setMessage('Impossible de relire les brouillons locaux.'));
  }, [user, missions, selectedMission]);

  if (!ready) return <main className="min-h-screen bg-slate-950 text-white p-8">Chargement…</main>;
  return <main className="nzubu-live min-h-screen bg-slate-950 text-slate-100">
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#accueil" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-xl font-black text-white shadow-lg shadow-rose-950/40">N</span><span><strong className="block text-lg leading-tight tracking-tight">NZUBU</strong><small className="text-slate-400">Kinshasa · Immobilier vidéo</small></span></a>
        {user ? <div className="flex items-center gap-3"><div className="text-right text-xs"><strong className="block text-white">{roleNames[user.role]}</strong><span className="text-slate-400">{user.email || user.phone}</span></div><button className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" onClick={async () => { try { await post('/auth/logout'); setUser(null); setFavoriteIds([]); setBookings([]); setApplications([]); setViewings([]); setTickets([]); setNotifications([]); setMissions([]); await refresh(null); setMessage('Déconnecté.'); } catch (error) { setMessage(String(error)); } }}><LogOut size={16} /> <span className="hidden sm:inline">Déconnexion</span></button></div> : <a href="#connexion" className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white">Se connecter</a>}
      </div>
    </header>
    <div id="accueil" className={user?.role === 'CLIENT' || !user ? 'mx-auto max-w-3xl space-y-0 px-0 sm:px-4' : 'mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6'}>
    {message && (user?.role === 'CLIENT' || !user) && <p role="status" className="fixed left-1/2 top-16 z-50 w-[min(92vw,44rem)] -translate-x-1/2 rounded-xl border border-amber-600 bg-slate-900 p-3 text-sm shadow-xl">{message}</p>}
    {(user?.role === 'CLIENT' || !user) && <LiveClientExperience listings={listings} bookings={bookings} viewings={viewings} applications={applications} tickets={tickets} notifications={notifications} filters={filters} onFilters={setFilters} favorites={favoriteIds} authenticated={user?.role === 'CLIENT'} onLogin={() => document.getElementById('connexion')?.scrollIntoView({ behavior: 'smooth' })} onFavorite={(id, saved) => void action(() => api(`/me/favorites/${id}`, { method: saved ? 'DELETE' : 'POST' }), saved ? 'Favori retiré.' : 'Favori enregistré.')} onAvailability={async (id) => (await api<{ unavailable: Array<{check_in:string;check_out:string;source:string}> }>(`/listings/${id}/availability`)).unavailable} onBooking={(listing, start, end, people) => { const slot = `${listing.id}:${start}:${end}:${people}`; bookingKeys.current[slot] ||= crypto.randomUUID(); void action(() => post('/bookings', { listingId: listing.id, checkIn: start, checkOut: end, occupants: people, acceptedTerms: true }, { 'idempotency-key': bookingKeys.current[slot] }), 'Demande enregistrée.'); }} onViewing={(listing, slot) => void action(() => post('/viewings', { listingId: listing.id, slots: [new Date(slot).toISOString()] }), 'Visite demandée.')} onApplication={(listing, message) => void action(() => post('/lease-applications', { listingId: listing.id, message }), 'Candidature reçue.')} onDeclarePayment={(id, reference) => void action(() => post(`/bookings/${id}/declare-payment`, { reference }), 'Paiement déclaré.')} onCancelBooking={(id) => void action(() => post(`/bookings/${id}/cancel`), 'Réservation annulée.')} onReportMedia={(id, message) => void action(() => post(`/listings/${id}/report-media`, { message }), 'Média signalé.')} onTicket={(message) => void action(() => post('/tickets', { category: 'ASSISTANCE', message }), 'Ticket créé.')} onCloseAccount={async () => { if (!window.confirm('Fermer votre compte ? Vos dossiers liés à un litige ouvert seront conservés avec accès restreint.')) return; try { await post('/me/close'); setUser(null); setFavoriteIds([]); setBookings([]); setApplications([]); setViewings([]); await refresh(null); setMessage('Compte fermé.'); } catch (error) { setMessage(String(error)); } }} />}
    {message && user && user.role !== 'CLIENT' && <p role="status" className="rounded bg-amber-900/50 p-3 text-sm">{message}</p>}

    {!user && <div className="mx-auto max-w-xl px-4 pb-28 pt-6"><section id="connexion" className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
      <span className="inline-flex rounded-xl bg-rose-500/15 p-3 text-rose-400"><LayoutDashboard size={24} /></span><h2 className="text-xl font-black">{authMode === 'login' ? 'Se connecter' : authMode === 'register' ? 'Créer mon compte' : 'Nouveau mot de passe'}</h2>
      <div className="flex gap-2" role="tablist" aria-label="Connexion et inscription"><button type="button" role="tab" aria-selected={authMode === 'login'} className={`rounded-lg px-4 py-2 text-sm font-bold ${authMode === 'login' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={() => { setAuthMode('login'); setPassword(''); setMessage(''); }}>Connexion</button><button type="button" role="tab" aria-selected={authMode === 'register'} className={`rounded-lg px-4 py-2 text-sm font-bold ${authMode === 'register' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={() => { setAuthMode('register'); setPassword(''); setMessage(''); }}>Inscription</button></div>
      {authMode === 'login' ? <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { const result = await post<{ user: User }>('/auth/login', { identifier, password }); setPassword(''); setUser(result.user); await refresh(result.user); setMessage('Connecté.'); } catch (error) { setMessage(String(error)); } }}>
        <label className="block text-sm">E-mail ou téléphone<input className="mt-1 w-full rounded bg-slate-800 p-3" autoComplete="username" required placeholder="E-mail ou +243810000000" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></label>
        <label className="block text-sm">Mot de passe<input className="mt-1 w-full rounded bg-slate-800 p-3" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="rounded bg-emerald-600 px-4 py-3 font-bold" type="submit">Se connecter</button>
        <p className="text-xs text-slate-400">Premier accès à un compte existant ? Ouvrez l’onglet Inscription pour définir votre mot de passe et vérifier votre e-mail.</p>
        <button type="button" className="text-sm text-sky-300 underline" onClick={() => { setAuthMode('reset'); setResetCodeSent(false); setPassword(''); setResetEmail(identifier.includes('@') ? identifier : ''); setMessage(''); }}>Mot de passe oublié ?</button>
      </form> : authMode === 'reset' ? <div className="space-y-3"><p className="text-sm text-slate-400">Un code de réinitialisation sera envoyé uniquement par e-mail.</p>
        <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await post('/auth/request-password-reset', { email: resetEmail }); setResetCodeSent(true); setMessage('Si ce compte existe, un code a été envoyé par e-mail.'); } catch (error) { setMessage(String(error)); } }}><label className="block text-sm">E-mail du compte<input className="mt-1 w-full rounded bg-slate-800 p-3" type="email" required disabled={resetCodeSent} value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} /></label>{!resetCodeSent && <button className="rounded bg-emerald-600 px-4 py-3 font-bold" type="submit">Recevoir un code</button>}</form>
        {resetCodeSent && <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await post('/auth/reset-password', { email: resetEmail, code, password }); setResetCodeSent(false); setCode(''); setPassword(''); setAuthMode('login'); setIdentifier(resetEmail); setMessage('Mot de passe modifié. Connectez-vous.'); } catch (error) { setMessage(String(error)); } }}><label className="block text-sm">Code reçu par e-mail<input className="mt-1 w-full rounded bg-slate-800 p-3" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></label><label className="block text-sm">Nouveau mot de passe<input className="mt-1 w-full rounded bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="rounded bg-emerald-600 px-4 py-3 font-bold" type="submit">Changer le mot de passe</button><button type="button" className="ml-3 text-sm text-sky-300 underline" onClick={() => { setResetCodeSent(false); setCode(''); }}>Renvoyer le code</button></form>}
      </div> : <div className="space-y-3">
        <p className="text-sm text-slate-400">L’e-mail est obligatoire pour recevoir le code de vérification. Le téléphone est facultatif et peut servir à la connexion.</p>
        <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await post('/auth/register', { email: destination, phone, password }); setCodeSent(true); setMessage('Code envoyé par e-mail.'); } catch (error) { setMessage(String(error)); } }}>
          <label className="block text-sm">E-mail<input className="mt-1 w-full rounded bg-slate-800 p-3" type="email" autoComplete="email" required disabled={codeSent} value={destination} onChange={(event) => setDestination(event.target.value)} /></label>
          <label className="block text-sm">Téléphone (facultatif)<input className="mt-1 w-full rounded bg-slate-800 p-3" type="tel" autoComplete="tel" placeholder="+243810000000" disabled={codeSent} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label className="block text-sm">Mot de passe<input className="mt-1 w-full rounded bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={codeSent} value={password} onChange={(event) => setPassword(event.target.value)} /><span className="text-xs text-slate-400">10 caractères minimum.</span></label>
          {!codeSent && <button className="rounded bg-emerald-600 px-4 py-3 font-bold" type="submit">Recevoir le code par e-mail</button>}
        </form>
        {codeSent && <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { const result = await post<{ user: User }>('/auth/verify-registration', { email: destination, code }); setPassword(''); setCode(''); setCodeSent(false); setUser(result.user); await refresh(result.user); setMessage('Compte vérifié et connecté.'); } catch (error) { setMessage(String(error)); } }}>
          <label className="block text-sm">Code reçu par e-mail<input className="mt-1 w-full rounded bg-slate-800 p-3" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></label>
          <div className="flex flex-wrap gap-3"><button className="rounded bg-emerald-600 px-4 py-3 font-bold" type="submit">Vérifier et créer mon compte</button><button className="text-sm text-sky-300 underline" type="button" onClick={() => { setCodeSent(false); setCode(''); }}>Modifier ou renvoyer le code</button></div>
        </form>}
      </div>}
    </section></div>}

    {user?.role === 'PARTNER' && <LivePartnerDashboard listings={listings} bookings={bookings} invoices={invoices} counts={{ blocks: blocks.length, viewings: viewings.length, applications: applications.length, refunds: bookings.filter((booking) => booking.refund_status === 'PENDING_PARTNER').length, tickets: tickets.filter((ticket) => ticket.status === 'OPEN').length, notifications: notifications.length }} onAccept={(id) => action(() => post(`/bookings/${id}/accept`), 'Dates bloquées 30 minutes.')} onConfirm={(id) => action(() => post(`/bookings/${id}/confirm`), 'Réservation confirmée.')} onCancel={(id) => { if (window.confirm('Annuler cette réservation ?')) void action(() => post(`/bookings/${id}/cancel`), 'Réservation annulée.'); }} onNewListing={() => { setPartnerListingOpen(true); window.setTimeout(() => document.getElementById('nouveau-logement')?.scrollIntoView({ behavior: 'smooth' }), 0); }} onOpenListing={(id) => { setPartnerListingOpen(true); window.setTimeout(() => { void loadDocuments(id); document.getElementById(`partner-listing-${id}`)?.scrollIntoView({ behavior: 'smooth' }); }, 0); }} onOpenSection={(id) => { setPartnerListingOpen(true); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 0); }} />}
    {user?.role === 'PARTNER' && <><button type="button" className="text-xs font-semibold text-amber-400 underline" onClick={() => setPartnerListingOpen((open) => !open)}>{partnerListingOpen ? 'Fermer la gestion des logements' : 'Gérer les pièces, vidéos et disponibilités'}</button>{partnerListingOpen && <><section id="nouveau-logement" className="space-y-3"><h2 className="text-xl font-bold">Proposer un logement</h2>
      <div className="flex flex-wrap gap-2"><input placeholder="Titre" className="rounded bg-slate-800 p-2" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /><input placeholder="Commune" className="rounded bg-slate-800 p-2" value={commune} onChange={(e) => setCommune(e.target.value)} /><select className="rounded bg-slate-800 p-2" value={rentalMode} onChange={(e) => setRentalMode(e.target.value as typeof rentalMode)}><option value="SHORT_STAY">Courte durée</option><option value="LONG_TERM">Longue durée</option></select><input type="number" placeholder="Prix CDF" className="rounded bg-slate-800 p-2" value={price} onChange={(e) => setPrice(e.target.value)} /><input type="number" placeholder="Charges CDF" className="rounded bg-slate-800 p-2" value={chargesCdf} onChange={(e) => setChargesCdf(e.target.value)} />{rentalMode === 'LONG_TERM' && <label className="text-sm">Dépôt (mois, maximum 3) <input type="number" min="0" max="3" className="w-20 rounded bg-slate-800 p-2" value={securityDepositMonths} onChange={(e) => setSecurityDepositMonths(Number(e.target.value))} /></label>}<label className="flex items-center gap-2"><input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />Meublé</label><textarea placeholder="Description" className="rounded bg-slate-800 p-2" value={description} onChange={(e) => setDescription(e.target.value)} /><textarea placeholder="Conditions" className="rounded bg-slate-800 p-2" value={conditions} onChange={(e) => setConditions(e.target.value)} /><button className="rounded bg-emerald-600 px-3" onClick={() => action(() => post('/listings', { title: newTitle, commune, rentalMode, priceCdf: Number(price), chargesCdf: Number(chargesCdf || 0), securityDepositMonths: rentalMode === 'LONG_TERM' ? securityDepositMonths : undefined, furnished, description, conditions }), 'Logement soumis.')}>Soumettre</button></div>
    </section><section id="mes-logements" className="space-y-3"><h2 className="text-xl font-bold">Mes logements et pièces</h2>{listings.length === 0 && <p className="text-sm text-slate-400">Aucun logement déposé. Commencez par le formulaire ci-dessus.</p>}{listings.map((listing) => <article id={`partner-listing-${listing.id}`} key={listing.id} className="rounded bg-slate-900 p-4 space-y-2"><p>{listing.title} · {listing.status}</p><button className="text-emerald-400 text-sm" onClick={() => loadDocuments(listing.id)}>Voir les pièces</button>{selectedListing === listing.id && <div className="space-y-2"><select className="rounded bg-slate-800 p-2" value={documentKind} onChange={(e) => setDocumentKind(e.target.value)}><option value="TITLE">Titre</option><option value="MANDATE">Mandat</option><option value="MEDIA_CONSENT">Consentement média</option><option value="IDENTITY">Identité</option></select><input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => { const file=e.target.files?.[0]; if(file) upload(listing.id,file,documentKind); }} />{(documents[listing.id] || []).map((doc) => <p key={doc.id} className="text-xs">{doc.kind} · {doc.approved_at ? 'approuvé' : 'en attente'} · <a className="underline" href={`/v1/documents/${doc.id}`} target="_blank">ouvrir</a></p>)}</div>}</article>)}</section></>}</>}

    {user?.role === 'PARTNER' && partnerListingOpen && <section id="videos" className="space-y-3"><h2 className="text-xl font-bold">Vidéos des logements</h2>{listings.length === 0 && <p className="text-sm text-slate-400">Déposez un logement pour envoyer sa vidéo.</p>}{listings.map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-3 text-sm"><p>{listing.title} · {listing.video_status || 'Vidéo manquante'}</p>{listing.video_status && <button className="mr-3 text-rose-300 underline" onClick={() => { const report = prompt('Décrivez le problème de confidentialité ou de contenu de cette vidéo'); if (report) void action(() => post(`/listings/${listing.id}/report-media`, { message: report }), 'Vidéo signalée à l’équipe.'); }}>Signaler la vidéo</button>}{['PENDING_DOCUMENTS','PENDING_INSPECTION'].includes(listing.status || '') && <input type="file" accept="video/mp4" onChange={(e) => { const file=e.target.files?.[0]; if(file) action(() => api(`/listings/${listing.id}/video`, { method: 'POST', body: file, headers: { 'content-type': 'video/mp4' } }), 'Vidéo envoyée pour revue.'); }} />}</div>)}</section>}

    {user?.role === 'PARTNER' && partnerListingOpen && <section id="disponibilites" className="space-y-3"><h2 className="text-xl font-bold">Indisponibilités hors NZUBU</h2>{listings.every((listing) => listing.rental_mode !== 'SHORT_STAY') && <p className="text-sm text-slate-400">Aucun logement de courte durée à bloquer.</p>}{blocks.length === 0 && <p className="text-sm text-slate-400">Aucune période indisponible enregistrée.</p>}<div className="flex flex-wrap gap-2"><input aria-label="Début indisponibilité" type="date" className="rounded bg-slate-800 p-2" value={blockDates.checkIn} onChange={(e) => setBlockDates({...blockDates,checkIn:e.target.value})} /><input aria-label="Fin indisponibilité" type="date" className="rounded bg-slate-800 p-2" value={blockDates.checkOut} onChange={(e) => setBlockDates({...blockDates,checkOut:e.target.value})} /><input aria-label="Motif" placeholder="Motif" className="rounded bg-slate-800 p-2" value={blockDates.reason} onChange={(e) => setBlockDates({...blockDates,reason:e.target.value})} /></div>{listings.filter((listing) => listing.rental_mode === 'SHORT_STAY').map((listing) => <div key={listing.id} className="flex gap-2 text-sm"><span>{listing.title}</span><button className="text-amber-300 underline" onClick={() => action(() => post(`/partner/listings/${listing.id}/blocks`, blockDates), 'Dates indisponibles enregistrées.')}>Bloquer ces dates</button></div>)}{blocks.map((block) => <div key={block.id} className="rounded bg-slate-900 p-2 text-sm">{listings.find((listing) => listing.id === block.listing_id)?.title} · {block.check_in.slice(0,10)} → {block.check_out.slice(0,10)} · {block.reason} <button className="ml-2 text-rose-300 underline" onClick={() => action(() => api(`/partner/blocks/${block.id}`, { method: 'DELETE' }), 'Indisponibilité retirée.')}>Retirer</button></div>)}</section>}

    {user?.role === 'FIELD_AGENT' && <LiveAgentWorkspace
      agent={user.email || user.phone || user.id.slice(0, 8)} missions={missions} listings={listings}
      selectedMission={selectedMission} checks={checks} gps={gps} photos={offlinePhotos}
      photoCaptions={photoCaptions} onPhotoCaptions={setPhotoCaptions}
      outcome={outcome} notes={notes} draftPending={draftPending} documents={documents}
      onSelect={(mission) => { void selectFieldMission(mission); }} onChecks={setChecks} onGps={setGps}
      onGpsError={setMessage} onPhotos={setOfflinePhotos} onOutcome={setOutcome} onNotes={setNotes}
      onSubmit={(mission) => { void submitFieldMission(mission); }}
      onLoadDocuments={(listingId) => { void loadDocuments(listingId); }}
      ticketCount={tickets.filter((ticket) => ticket.status === 'OPEN').length} notificationCount={notifications.length}
      onOpenSection={(id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
      onClearDrafts={() => { if (!window.confirm('Effacer tous les brouillons de missions enregistrés sur cet appareil ?')) return; void clearAllMissionDrafts(user.id).then(() => { setDraftPending(false); setSelectedMission(null); setMessage('Brouillons locaux effacés.'); }).catch((error) => setMessage(String(error))); }}
    />}

    {user?.role === 'OPERATIONS_ADMIN' && <LiveAdminDashboard
      listings={listings} missions={missions} users={users} tickets={tickets}
      counts={{ bookings: bookings.length, viewings: viewings.length, applications: applications.length, invoices: invoices.length, notifications: notifications.length }}
      onOpenSection={(id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
      onPublish={(id) => { void action(() => post(`/admin/listings/${id}/approve`), 'Logement publié pour 90 jours.'); }}
      onSuspend={(id) => { if (window.confirm('Suspendre cette annonce ?')) void action(() => post(`/admin/listings/${id}/suspend`), 'Logement suspendu.'); }}
      onResolveTicket={(id) => { const note = window.prompt('Décision et justification de résolution (minimum 10 caractères)'); if (note && note.trim().length >= 10) void action(() => post(`/admin/tickets/${id}/resolve`, { note: note.trim() }), 'Alerte résolue.'); }}
    />}
    {user?.role === 'OPERATIONS_ADMIN' && <><section id="comptes" className="space-y-3"><h2 className="text-xl font-bold">Comptes partenaires, agents et administrateurs</h2><p className="text-sm text-slate-400">Créez le compte avec une adresse e-mail accessible à son titulaire. Il ouvrira ensuite Inscription, recevra un code par e-mail et définira son propre mot de passe.</p>{users.length === 0 && <p className="text-sm text-slate-400">Aucun compte partenaire ou agent créé.</p>}<form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const form=new FormData(e.currentTarget); action(() => post('/admin/users', { email: form.get('email'), role: form.get('role') }), 'Compte créé. Son titulaire peut définir son mot de passe dans Inscription.'); }}><input name="email" type="email" required placeholder="E-mail" className="rounded bg-slate-800 p-2" /><select name="role" className="rounded bg-slate-800 p-2"><option value="PARTNER">Partenaire</option><option value="FIELD_AGENT">Agent</option><option value="OPERATIONS_ADMIN">Administrateur</option></select><button className="rounded bg-indigo-600 px-3">Créer</button></form>{users.map((entry) => <p key={entry.id} className="text-sm">{entry.email} · {entry.role}</p>)}</section>
      <section id="validations" className="space-y-3"><h2 className="text-xl font-bold">Validation des logements</h2>{listings.length === 0 && <p className="text-sm text-slate-400">Aucun dossier de logement reçu.</p>}{listings.map((listing) => <article id={`admin-listing-${listing.id}`} key={listing.id} className="rounded bg-slate-900 p-4 space-y-2"><p className="font-bold">{listing.title} · {listing.status}</p><button className="text-emerald-400" onClick={() => loadDocuments(listing.id)}>Voir les pièces</button>{selectedListing === listing.id && (documents[listing.id] || []).map((doc) => <p key={doc.id} className="text-sm">{doc.kind} · <a className="underline" href={`/v1/documents/${doc.id}`} target="_blank">ouvrir</a> · {doc.approved_at ? 'approuvé' : <button className="text-amber-400" onClick={() => action(async () => { await post(`/admin/documents/${doc.id}/approve`); await loadDocuments(listing.id); }, 'Pièce approuvée.')}>Approuver</button>}</p>)}<div className="flex flex-wrap gap-2"><button disabled={listing.status !== 'PENDING_DOCUMENTS'} className="rounded bg-indigo-600 px-3 py-1 disabled:opacity-40" onClick={() => action(() => post(`/admin/listings/${listing.id}/documents/approve`), 'Dossier validé.')}>Valider le dossier</button><button disabled={listing.status !== 'PENDING_APPROVAL'} className="rounded bg-emerald-600 px-3 py-1 disabled:opacity-40" onClick={() => action(() => post(`/admin/listings/${listing.id}/approve`), 'Logement publié.')}>Publier</button><button disabled={listing.status === 'SUSPENDED'} className="rounded bg-rose-600 px-3 py-1 disabled:opacity-40" onClick={() => { if (window.confirm('Suspendre cette annonce ?')) void action(() => post(`/admin/listings/${listing.id}/suspend`), 'Logement suspendu.'); }}>Suspendre</button></div>{listing.status === 'PENDING_INSPECTION' && <div>Assigner : <select className="rounded bg-slate-800 p-1" value={selectedAgentFor[listing.id] || ''} onChange={(e) => setSelectedAgentFor({ ...selectedAgentFor, [listing.id]: e.target.value })}><option value="">Agent</option>{users.filter((entry) => entry.role === 'FIELD_AGENT').map((agent) => <option key={agent.id} value={agent.id}>{agent.email}</option>)}</select><button disabled={!selectedAgentFor[listing.id]} className="ml-2 rounded bg-indigo-600 px-3 py-1 disabled:opacity-40" onClick={() => action(() => post('/admin/missions', { listingId: listing.id, agentId: selectedAgentFor[listing.id] }), 'Mission créée.')}>Créer mission</button></div>}</article>)}</section>
      <section id="missions-admin"><h2 className="text-xl font-bold">Missions</h2>{missions.length === 0 && <p className="text-sm text-slate-400">Aucune mission créée.</p>}{missions.map((mission) => <p key={mission.id} className="text-sm">{mission.id} · {mission.status} · {mission.outcome || 'sans avis'}</p>)}</section></>}

    {user?.role === 'OPERATIONS_ADMIN' && <section id="changement-partenaire" className="space-y-2"><h2 className="text-xl font-bold">Changement de partenaire ou mandataire</h2>{listings.length === 0 && <p className="text-sm text-slate-400">Aucun logement à transférer.</p>}{listings.map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-2 text-sm"><span>{listing.title} · </span><select aria-label={`Nouveau partenaire pour ${listing.title}`} className="rounded bg-slate-800 p-1" value={newPartnerFor[listing.id] || ''} onChange={(e) => setNewPartnerFor({...newPartnerFor,[listing.id]:e.target.value})}><option value="">Choisir le nouveau partenaire</option>{users.filter((entry) => entry.role === 'PARTNER').map((partner) => <option key={partner.id} value={partner.id}>{partner.email}</option>)}</select><button disabled={!newPartnerFor[listing.id]} className="ml-2 text-amber-300 underline disabled:opacity-50" onClick={() => { const reason=prompt('Motif du changement et preuve de décision'); if(reason) action(() => post(`/admin/listings/${listing.id}/change-partner`, { newPartnerId: newPartnerFor[listing.id], reason }), 'Anciennes validations révoquées ; nouveau dossier requis.'); }}>Transférer et suspendre</button></div>)}</section>}
    {user?.role === 'OPERATIONS_ADMIN' && <section id="reinspection" className="space-y-2"><h2 className="text-xl font-bold">Réinspection après suspension</h2>{!listings.some((listing) => listing.status === 'SUSPENDED') && <p className="text-sm text-slate-400">Aucune annonce suspendue à réinspecter.</p>}{listings.filter((listing) => listing.status === 'SUSPENDED').map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-2 text-sm">{listing.title} <button className="ml-2 text-amber-300 underline" onClick={() => { const reason=prompt('Motif de réouverture après résolution des tickets'); if(reason) action(() => post(`/admin/listings/${listing.id}/reinspect`, { reason }), 'Nouvelle inspection requise avant publication.'); }}>Démarrer une réinspection</button></div>)}</section>}

    {user?.role === 'OPERATIONS_ADMIN' && <section id="revue-videos" className="space-y-3"><h2 className="text-xl font-bold">Revue des vidéos</h2>{listings.length === 0 && <p className="text-sm text-slate-400">Aucune vidéo à examiner.</p>}{listings.map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-3 text-sm space-y-2"><p>{listing.title} · {listing.video_status || 'Aucune vidéo'}</p>{listing.video_status && <video controls preload="metadata" className="max-w-md w-full rounded bg-black" src={`/v1/listings/${listing.id}/video`} />}{listing.video_status === 'PENDING_REVIEW' && <div className="space-y-2">{Object.entries({ rightsConfirmed:'Droits de diffusion confirmés', noIdentifiablePeople:'Aucune personne identifiable', matchesListing:'Images conformes à la fiche', noSensitiveContent:'Aucun contenu sensible' }).map(([key,label]) => <label key={key} className="block"><input type="checkbox" checked={Boolean(videoChecks[listing.id]?.[key])} onChange={(e) => setVideoChecks({...videoChecks,[listing.id]:{...videoChecks[listing.id],[key]:e.target.checked}})} /> {label}</label>)}{listing.duplicate_of && <label className="block text-amber-300"><input type="checkbox" checked={Boolean(videoDuplicateReviewed[listing.id])} onChange={(e) => setVideoDuplicateReviewed({...videoDuplicateReviewed,[listing.id]:e.target.checked})} /> Doublon candidat avec {listing.duplicate_of} examiné</label>}<textarea className="w-full rounded bg-slate-800 p-2" placeholder="Note de revue" value={videoNotes[listing.id] || ''} onChange={(e) => setVideoNotes({...videoNotes,[listing.id]:e.target.value})} /><button disabled={!['rightsConfirmed','noIdentifiablePeople','matchesListing','noSensitiveContent'].every((key) => videoChecks[listing.id]?.[key]) || Boolean(listing.duplicate_of && (!videoDuplicateReviewed[listing.id] || !videoNotes[listing.id]?.trim()))} className="rounded bg-emerald-600 px-3 py-1 disabled:opacity-50" onClick={() => action(() => post(`/admin/listings/${listing.id}/video/approve`, { checks: videoChecks[listing.id], note: videoNotes[listing.id] || '', duplicateReviewed: Boolean(videoDuplicateReviewed[listing.id]) }), 'Vidéo approuvée.')}>Approuver la vidéo</button></div>}</div>)}</section>}

    {user && user.role === 'OPERATIONS_ADMIN' && <section id="reservations" className="space-y-3"><h2 className="text-xl font-bold">Réservations</h2>{bookings.length === 0 && <p className="text-sm text-slate-400">Aucune réservation à traiter.</p>}{bookings.map((booking) => <article key={booking.id} className="rounded bg-slate-900 p-4 space-y-2"><p>{booking.id} · {booking.status}</p><p className="text-sm">{booking.check_in} → {booking.check_out} · {Number(booking.price_cdf).toLocaleString('fr-CD')} CDF</p><div className="flex flex-wrap gap-2">{user.role === 'PARTNER' && booking.status === 'REQUESTED' && <button className="rounded bg-amber-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/accept`), 'Dates bloquées 30 minutes.')}>Accepter</button>}{user.role === 'CLIENT' && booking.status === 'HOST_ACCEPTED_TERMS' && <button className="rounded bg-sky-600 px-3 py-1" onClick={() => { const reference=prompt('Référence du paiement direct à l’hôte'); if(reference) action(() => post(`/bookings/${booking.id}/declare-payment`, { reference }), 'Paiement déclaré.'); }}>Déclarer le paiement</button>}{user.role === 'PARTNER' && booking.status === 'PAYMENT_DECLARED' && <button className="rounded bg-emerald-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/confirm`), 'Réservation confirmée.')}>Confirmer le paiement reçu</button>}{['CLIENT','PARTNER','OPERATIONS_ADMIN'].includes(user.role) && !['CANCELLED','COMPLETED'].includes(booking.status) && <button className="rounded bg-rose-700 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/cancel`), 'Réservation annulée.')}>Annuler</button>}{user.role === 'OPERATIONS_ADMIN' && booking.status === 'CONFIRMED' && <button className="rounded bg-indigo-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/complete`), 'Séjour clôturé et commission facturée.')}>Clôturer le séjour</button>}</div></article>)}</section>}
    {user && ['PARTNER', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="remboursements" className="space-y-2"><h2 className="text-xl font-bold">Remboursements directs à suivre</h2>{!bookings.some((booking) => booking.refund_status === 'PENDING_PARTNER') && <p className="text-sm text-slate-400">Aucun remboursement en attente.</p>}{bookings.filter((booking) => booking.refund_status === 'PENDING_PARTNER').map((booking) => <div key={booking.id} className="rounded bg-slate-900 p-3 text-sm"><p>{booking.id} · {Number(booking.refund_due_cdf || 0).toLocaleString('fr-CD')} CDF dus par l'hôte</p>{user.role === 'PARTNER' && <button className="text-emerald-400" onClick={() => { const reference=prompt('Référence du remboursement effectué au client'); if(reference) action(() => post(`/bookings/${booking.id}/refund-confirm`, {reference}), 'Remboursement déclaré.'); }}>Déclarer le remboursement effectué</button>}</div>)}</section>}
    {user && ['PARTNER', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="preuves-reservations" className="space-y-2"><h2 className="text-xl font-bold">Preuves des réservations</h2>{bookings.length === 0 && <p className="text-sm text-slate-400">Aucun séjour à documenter.</p>}{bookings.map((booking) => <div key={booking.id}><p className="text-xs text-slate-400">Réservation {booking.id}</p><CaseEvidence type="booking" id={booking.id} role={user.role} /></div>)}</section>}
    {user && ['PARTNER', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="visites" className="space-y-3"><h2 className="text-xl font-bold">Visites</h2>{viewings.length === 0 && <p className="text-sm text-slate-400">Aucune demande de visite pour le moment.</p>}{viewings.map((viewing) => <article key={viewing.id} className="rounded bg-slate-900 p-3 text-sm space-y-1"><p>{viewing.id} · {viewing.status}</p><p>Créneau demandé : {viewing.slots?.[0]?.slice(0,16)}{viewing.scheduled_at ? ` · Confirmé : ${viewing.scheduled_at.slice(0,16)}` : ''}</p>{viewing.outcome_note && <p>Compte rendu : {viewing.outcome_note}</p>}{user.role === 'OPERATIONS_ADMIN' && ['REQUESTED','SCHEDULED'].includes(viewing.status) && <div className="flex gap-3"><button className="text-emerald-300 underline" onClick={() => { const next = viewing.status === 'REQUESTED' ? 'SCHEDULED' : 'COMPLETED'; const note = next === 'COMPLETED' ? prompt('Compte rendu de la visite') : undefined; if (next === 'COMPLETED' && !note) return; action(() => post(`/admin/viewings/${viewing.id}/status`, { status: next, scheduledAt: next === 'SCHEDULED' ? viewing.slots[0] : undefined, note }), 'Visite mise à jour.'); }}>{viewing.status === 'REQUESTED' ? 'Confirmer le créneau' : 'Clôturer avec compte rendu'}</button><button className="text-rose-300 underline" onClick={() => { const status = viewing.status === 'SCHEDULED' ? 'NO_SHOW' : 'CANCELLED'; const note = status === 'NO_SHOW' ? prompt('Motif et constat de l’absence') : undefined; if (status === 'NO_SHOW' && !note) return; action(() => post(`/admin/viewings/${viewing.id}/status`, { status, note }), 'Visite mise à jour.'); }}>{viewing.status === 'SCHEDULED' ? 'Signaler une absence' : 'Annuler'}</button></div>}</article>)}</section>}
    {user && ['PARTNER', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="dossiers" className="space-y-3"><h2 className="text-xl font-bold">Dossiers de location longue durée</h2>{applications.length === 0 && <p className="text-sm text-slate-400">Aucune candidature pour le moment.</p>}{applications.map((application) => <article key={application.id} className="rounded bg-slate-900 p-3 text-sm space-y-1"><p>{application.id} · {application.status}</p><p>{application.message}</p>{application.agreed_rent_cdf && <p>Loyer convenu : {Number(application.agreed_rent_cdf).toLocaleString('fr-CD')} CDF</p>}{user.role === 'OPERATIONS_ADMIN' && <select className="rounded bg-slate-800 p-1" defaultValue="" onChange={(e) => { if(!e.target.value) return; const signatureReference = e.target.value === 'SIGNED_EXTERNALLY' ? prompt('Référence du bail signé hors plateforme') : undefined; if(e.target.value === 'SIGNED_EXTERNALLY' && !signatureReference) return; action(() => post(`/admin/lease-applications/${application.id}/status`, { status: e.target.value, signatureReference }), 'Dossier mis à jour.'); }}><option value="">Faire avancer le dossier</option><option value="UNDER_REVIEW">En revue</option><option value="NEGOTIATING">Négociation</option><option value="LEASE_PREPARED">Bail préparé</option><option value="SIGNED_EXTERNALLY">Bail signé hors plateforme</option><option value="CANCELLED">Annulé</option></select>}</article>)}</section>}
    {user && ['PARTNER', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="preuves-baux" className="space-y-2"><h2 className="text-xl font-bold">Preuves des baux</h2>{applications.length === 0 && <p className="text-sm text-slate-400">Aucun bail à documenter.</p>}{applications.map((application) => <div key={application.id}><p className="text-xs text-slate-400">Dossier {application.id}</p><CaseEvidence type="lease" id={application.id} role={user.role} /></div>)}</section>}
    {user && user.role !== 'CLIENT' && <section id="assistance" className="space-y-3"><h2 className="text-xl font-bold">Assistance</h2>{user.role !== 'OPERATIONS_ADMIN' && <div className="flex flex-wrap gap-2"><input className="min-w-64 flex-1 rounded bg-slate-800 p-2" placeholder="Décrivez le problème rencontré" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} /><button className="rounded bg-indigo-600 px-3" onClick={() => action(async () => { await post('/tickets', { category: 'ASSISTANCE', message: ticketMessage }); setTicketMessage(''); }, 'Ticket créé.')}>Signaler</button></div>}{tickets.length === 0 && <p className="text-sm text-slate-400">Aucun ticket ouvert.</p>}{tickets.map((ticket) => <article key={ticket.id} className="rounded bg-slate-900 p-3 text-sm"><p>{ticket.category} · {ticket.status}</p><p>{ticket.message}</p>{user.role === 'OPERATIONS_ADMIN' && ticket.status === 'OPEN' && <button className="text-emerald-400" onClick={() => { const note=prompt('Décision et justification de résolution (minimum 10 caractères)'); if(note) action(() => post(`/admin/tickets/${ticket.id}/resolve`, { note }), 'Ticket résolu.'); }}>Marquer résolu</button>}</article>)}</section>}
    {user?.role === 'OPERATIONS_ADMIN' && <section id="commissions" className="space-y-2"><h2 className="text-xl font-bold">Commissions à suivre</h2><a className="text-sky-300 underline text-sm" href="/v1/invoices/export.csv" download="nzubu-commissions.csv">Télécharger le suivi CSV</a><p className="text-xs text-slate-400">Export de suivi interne ; la facture officielle reste à valider par la direction et la comptabilité.</p>{invoices.length === 0 && <p className="text-sm text-slate-400">Aucune commission facturée.</p>}{invoices.map((invoice) => <p key={invoice.id} className="rounded bg-slate-900 p-3 text-sm">{invoice.id} · {Number(invoice.amount_cdf).toLocaleString('fr-CD')} CDF · {invoice.status}</p>)}</section>}
    {user && ['PARTNER', 'FIELD_AGENT', 'OPERATIONS_ADMIN'].includes(user.role) && <section id="notifications" className="space-y-2"><h2 className="text-xl font-bold">Notifications</h2>{notifications.length === 0 && <p className="text-sm text-slate-400">Aucune notification.</p>}{notifications.map((notification) => <p key={notification.id} className="rounded bg-slate-900 p-3 text-sm"><strong>{notification.subject}</strong> · {notification.body}</p>)}</section>}
    </div>
  </main>;
}
