import React, { useEffect, useRef, useState } from 'react';
import { clearMissionDraft, readMissionDraft, saveMissionDraft, type PendingMissionReport } from './offlineMission';

type User = { id: string; role: 'CLIENT' | 'PARTNER' | 'FIELD_AGENT' | 'OPERATIONS_ADMIN'; email: string | null; phone: string | null };
type Listing = { id: string; title: string; commune: string; rental_mode: 'SHORT_STAY' | 'LONG_TERM'; price_cdf: number; status?: string; video_status?: string; verified_until?: string };
type Mission = { id: string; listing_id: string; status: string; outcome?: string; report?: Record<string, unknown> };
type Booking = { id: string; listing_id: string; check_in: string; check_out: string; status: string; price_cdf: number; hold_expires_at?: string; refund_due_cdf?: number; refund_status?: string };
type Document = { id: string; kind: string; approved_at: string | null };
type Ticket = { id: string; category: string; message: string; status: string };
type Invoice = { id: string; amount_cdf: number; status: string; booking_id: string };
type Notification = { id: string; subject: string; body: string; created_at: string };
type LeaseApplication = { id: string; listing_id: string; status: string; message: string; agreed_rent_cdf?: number };

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/v1${path}`, { credentials: 'include', ...options,
    headers: { ...(options.body && !(options.body instanceof Blob) ? { 'content-type': 'application/json' } : {}), ...options.headers } });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    const messages: Record<string,string> = {
      BREVO_AUTH_FAILED: 'Brevo refuse la clé API configurée. Vérifiez ou recréez une clé API v3 dans Brevo.',
      EMAIL_DELIVERY_UNAVAILABLE: 'L’envoi de l’e-mail est indisponible. Vérifiez l’expéditeur Brevo et réessayez.',
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

export default function PilotApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Record<string,Document[]>>({});
  const [availability, setAvailability] = useState<Record<string,Array<{check_in:string;check_out:string}>>>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string,boolean>>(Object.fromEntries(Object.keys(checkLabels).map((key) => [key,false])));
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracyMeters: number } | null>(null);
  const [outcome, setOutcome] = useState('PASS');
  const [notes, setNotes] = useState('');
  const [offlinePhotos, setOfflinePhotos] = useState<File[]>([]);
  const [reportKey, setReportKey] = useState<string>(() => crypto.randomUUID());
  const [draftPending, setDraftPending] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [commune, setCommune] = useState('Gombe');
  const [rentalMode, setRentalMode] = useState<'SHORT_STAY'|'LONG_TERM'>('SHORT_STAY');
  const [price, setPrice] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [documentKind, setDocumentKind] = useState('TITLE');
  const actionBusy = useRef(false);
  const bookingKeys = useRef<Record<string,string>>({});

  const refresh = async (actor: User | null = user) => {
    if (!actor) {
      const publicData = await api<{ listings: Listing[] }>('/listings');
      setListings(publicData.listings);
      return;
    }
    const listPath = actor.role === 'OPERATIONS_ADMIN' ? '/admin/listings' : actor.role === 'PARTNER' ? '/partner/listings' : '/listings';
    const tasks: Promise<unknown>[] = [api<{ listings: Listing[] }>(listPath).then((value) => setListings(value.listings))];
    if (actor.role !== 'FIELD_AGENT') tasks.push(api<{ bookings: Booking[] }>('/bookings').then((value) => setBookings(value.bookings)));
    if (actor.role !== 'FIELD_AGENT') tasks.push(api<{ applications: LeaseApplication[] }>('/lease-applications').then((value) => setApplications(value.applications)));
    tasks.push(api<{ tickets: Ticket[] }>('/tickets').then((value) => setTickets(value.tickets)));
    tasks.push(api<{ notifications: Notification[] }>('/notifications').then((value) => setNotifications(value.notifications)));
    if (['PARTNER','OPERATIONS_ADMIN'].includes(actor.role)) tasks.push(api<{ invoices: Invoice[] }>('/invoices').then((value) => setInvoices(value.invoices)));
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
    if (!user || !selectedMission || !draftLoaded) return;
    const mission = missions.find((item) => item.id === selectedMission);
    if (!mission || mission.status !== 'ASSIGNED') return;
    void saveMissionDraft(user.id, { missionId: mission.id, listingId: mission.listing_id, checks, gps, outcome, notes, photos: offlinePhotos, idempotencyKey: reportKey })
      .then(() => setDraftPending(true))
      .catch(() => setMessage('Brouillon local non enregistré : stockage indisponible.'));
  }, [user, selectedMission, draftLoaded, checks, gps, outcome, notes, offlinePhotos, reportKey, missions]);

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
    setReportKey(draft?.idempotencyKey || crypto.randomUUID());
    setDraftPending(Boolean(draft));
    setDraftLoaded(true);
  };

  const submitFieldMission = async (mission: Mission) => {
    if (!user || !gps) return;
    const draft: PendingMissionReport = { missionId: mission.id, listingId: mission.listing_id, checks, gps, outcome, notes, photos: offlinePhotos, idempotencyKey: reportKey };
    await saveMissionDraft(user.id, draft);
    setDraftPending(true);
    if (!navigator.onLine) { setMessage('Rapport conservé sur cet appareil. Synchronisez au retour du réseau.'); return; }
    try {
      const photoIds: string[] = [];
      for (const [index, file] of draft.photos.entries()) {
        const uploaded = await api<{ document: Document }>(`/listings/${draft.listingId}/documents`, { method: 'POST', body: file, headers: { 'content-type': file.type, 'x-document-kind': 'INSPECTION_PHOTO', 'idempotency-key': `${draft.idempotencyKey}-${index}` } });
        photoIds.push(uploaded.document.id);
      }
      await post(`/missions/${draft.missionId}/report`, { outcome: draft.outcome, checks: draft.checks, gps: draft.gps, photoIds, notes: draft.notes }, { 'idempotency-key': draft.idempotencyKey });
      await clearMissionDraft(user.id, draft.missionId);
      setDraftPending(false);
      setOfflinePhotos([]);
      setMessage('Rapport synchronisé.');
      await refresh();
    } catch (error) { setMessage(`Synchronisation en attente : ${String(error)}`); }
  };

  if (!ready) return <main className="min-h-screen bg-slate-950 text-white p-8">Chargement…</main>;
  return <main className="min-h-screen bg-slate-950 text-slate-100 p-5 sm:p-8 space-y-6">
    <header className="flex flex-wrap justify-between gap-3 border-b border-slate-700 pb-4">
      <div><h1 className="text-2xl font-bold">NZUBU · Pilote API</h1><p className="text-sm text-slate-400">Données PostgreSQL · accès par rôle</p></div>
      {user && <div className="text-sm text-right"><p>{user.email || user.phone} · {user.role}</p><button className="text-rose-400" onClick={async () => { try { await post('/auth/logout'); setUser(null); setBookings([]); setMissions([]); await refresh(null); setMessage('Déconnecté.'); } catch (error) { setMessage(String(error)); } }}>Déconnexion</button></div>}
    </header>
    {message && <p role="status" className="rounded bg-amber-900/50 p-3 text-sm">{message}</p>}

    {!user && <section className="max-w-md space-y-3 rounded-xl bg-slate-900 p-5">
      <h2 className="font-bold">Connexion par code</h2>
      <input className="w-full rounded bg-slate-800 p-2" type="email" autoComplete="email" placeholder="Adresse e-mail" value={destination} onChange={(e) => setDestination(e.target.value)} />
      {!codeSent ? <button className="rounded bg-emerald-600 px-4 py-2" onClick={() => action(async () => { await post('/auth/request-code', { destination }); setCodeSent(true); }, 'Code envoyé.')}>Recevoir un code</button>
        : <><input className="w-full rounded bg-slate-800 p-2" placeholder="Code à 6 chiffres" value={code} onChange={(e) => setCode(e.target.value)} /><button className="rounded bg-emerald-600 px-4 py-2" onClick={async () => { try { const result = await post<{ user: User }>('/auth/verify-code', { destination, code }); setUser(result.user); await refresh(result.user); setMessage('Connecté.'); } catch (error) { setMessage(String(error)); } }}>Se connecter</button></>}
      <p className="text-xs text-slate-400">En développement sans clé Brevo, le code s’affiche dans les logs de l’API.</p>
    </section>}

    {(user?.role === 'CLIENT' || !user) && <section className="space-y-3"><h2 className="text-xl font-bold">Logements publiés</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <article key={listing.id} className="rounded-xl bg-slate-900 p-4 space-y-2">
        <h3 className="font-bold">{listing.title}</h3><p className="text-sm">{listing.commune} · {listing.rental_mode === 'SHORT_STAY' ? 'Séjour' : 'Bail'}</p>
        <p className="text-amber-300">{Number(listing.price_cdf).toLocaleString('fr-CD')} CDF / {listing.rental_mode === 'SHORT_STAY' ? 'nuit' : 'mois'}</p>
        <video controls playsInline preload="metadata" className="w-full rounded bg-black" src={`/v1/listings/${listing.id}/video`} />
        {user && listing.rental_mode === 'SHORT_STAY' && <div className="space-y-2"><button className="text-xs text-sky-300 underline" onClick={() => api<{unavailable:Array<{check_in:string;check_out:string}>}>(`/listings/${listing.id}/availability`).then((result) => setAvailability((current) => ({...current,[listing.id]:result.unavailable}))).catch((error) => setMessage(String(error)))}>Voir les dates indisponibles</button>{availability[listing.id]?.map((slot,index) => <p key={index} className="text-xs text-amber-300">{slot.check_in.slice(0,10)} → {slot.check_out.slice(0,10)}</p>)}<input type="date" className="rounded bg-slate-800 p-2" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /><input type="date" className="rounded bg-slate-800 p-2" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /><button className="block rounded bg-rose-600 px-3 py-2 text-sm" onClick={() => { const slot=`${listing.id}:${checkIn}:${checkOut}`; bookingKeys.current[slot] ||= crypto.randomUUID(); action(() => post('/bookings', { listingId: listing.id, checkIn, checkOut }, { 'idempotency-key': bookingKeys.current[slot] }), 'Demande enregistrée.'); }}>Demander une réservation</button></div>}
        {user && listing.rental_mode === 'LONG_TERM' && <div className="flex gap-2"><button className="rounded bg-rose-600 px-3 py-2 text-sm" onClick={() => action(() => post('/viewings', { listingId: listing.id, slots: [new Date(Date.now()+86400000).toISOString()] }), 'Visite demandée.')}>Demander une visite</button><button className="rounded bg-indigo-600 px-3 py-2 text-sm" onClick={() => { const message=prompt('Présentez brièvement votre candidature'); if(message) action(() => post('/lease-applications', { listingId: listing.id, message }), 'Candidature reçue.'); }}>Déposer une candidature</button></div>}
      </article>)}</div>{!listings.length && <p className="text-slate-400">Aucun logement publié.</p>}
    </section>}

    {user?.role === 'PARTNER' && <><section className="space-y-3"><h2 className="text-xl font-bold">Proposer un logement</h2>
      <div className="flex flex-wrap gap-2"><input placeholder="Titre" className="rounded bg-slate-800 p-2" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /><input placeholder="Commune" className="rounded bg-slate-800 p-2" value={commune} onChange={(e) => setCommune(e.target.value)} /><select className="rounded bg-slate-800 p-2" value={rentalMode} onChange={(e) => setRentalMode(e.target.value as typeof rentalMode)}><option value="SHORT_STAY">Courte durée</option><option value="LONG_TERM">Longue durée</option></select><input type="number" placeholder="Prix CDF" className="rounded bg-slate-800 p-2" value={price} onChange={(e) => setPrice(e.target.value)} /><button className="rounded bg-emerald-600 px-3" onClick={() => action(() => post('/listings', { title: newTitle, commune, rentalMode, priceCdf: Number(price) }), 'Logement soumis.')}>Soumettre</button></div>
    </section><section className="space-y-3"><h2 className="text-xl font-bold">Mes logements et pièces</h2>{listings.map((listing) => <article key={listing.id} className="rounded bg-slate-900 p-4 space-y-2"><p>{listing.title} · {listing.status}</p><button className="text-emerald-400 text-sm" onClick={() => loadDocuments(listing.id)}>Voir les pièces</button>{selectedListing === listing.id && <div className="space-y-2"><select className="rounded bg-slate-800 p-2" value={documentKind} onChange={(e) => setDocumentKind(e.target.value)}><option value="TITLE">Titre</option><option value="MANDATE">Mandat</option><option value="MEDIA_CONSENT">Consentement média</option><option value="IDENTITY">Identité</option></select><input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => { const file=e.target.files?.[0]; if(file) upload(listing.id,file,documentKind); }} />{(documents[listing.id] || []).map((doc) => <p key={doc.id} className="text-xs">{doc.kind} · {doc.approved_at ? 'approuvé' : 'en attente'} · <a className="underline" href={`/v1/documents/${doc.id}`} target="_blank">ouvrir</a></p>)}</div>}</article>)}</section></>}

    {user?.role === 'PARTNER' && <section className="space-y-3"><h2 className="text-xl font-bold">Vidéos des logements</h2>{listings.map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-3 text-sm"><p>{listing.title} · {listing.video_status || 'Vidéo manquante'}</p>{['PENDING_DOCUMENTS','PENDING_INSPECTION'].includes(listing.status || '') && <input type="file" accept="video/mp4" onChange={(e) => { const file=e.target.files?.[0]; if(file) action(() => api(`/listings/${listing.id}/video`, { method: 'POST', body: file, headers: { 'content-type': 'video/mp4' } }), 'Vidéo envoyée pour revue.'); }} />}</div>)}</section>}

    {user?.role === 'FIELD_AGENT' && <section className="space-y-4">
      <h2 className="text-xl font-bold">Missions assignées</h2>
      {missions.map((mission) => <article key={mission.id} className="rounded bg-slate-900 p-4 space-y-2">
        <p>{mission.id} · {mission.status} · Logement {mission.listing_id}</p>
        <button className="text-emerald-400" onClick={() => selectFieldMission(mission)}>Ouvrir</button>
        {selectedMission === mission.id && mission.status === 'ASSIGNED' && <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">{Object.entries(checkLabels).map(([key,label]) => <label key={key} className="flex gap-2"><input type="checkbox" checked={checks[key]} onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })} />{label}</label>)}</div>
          <button className="rounded bg-slate-700 px-3 py-2" onClick={() => navigator.geolocation.getCurrentPosition((pos) => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracyMeters: pos.coords.accuracy }), () => setMessage('GPS refusé ou indisponible.'))}>Capturer le GPS</button>
          <span className="text-sm">{gps ? `${gps.latitude}, ${gps.longitude}` : 'GPS requis'}</span>
          <p>Photos de preuve : <input type="file" accept="image/png,image/jpeg" onChange={(e) => { const file=e.target.files?.[0]; if(file) setOfflinePhotos((current) => [...current,file]); }} /> {offlinePhotos.length} à transmettre</p>
          <select className="rounded bg-slate-800 p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="PASS">Favorable</option><option value="PASS_WITH_DISCLOSURES">Avec réserves</option><option value="NEEDS_CORRECTION">Corrections</option><option value="SAFETY_CONCERN">Alerte sécurité</option></select>
          <textarea placeholder="Observations" className="block w-full rounded bg-slate-800 p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {draftPending && <p className="text-amber-300 text-sm">Brouillon local en attente de synchronisation.</p>}
          <button className="rounded bg-emerald-600 px-4 py-2" disabled={!gps} onClick={() => submitFieldMission(mission)}>{draftPending ? 'Synchroniser le rapport' : 'Transmettre ou conserver le rapport'}</button>
        </div>}
      </article>)}
    </section>}

    {user?.role === 'OPERATIONS_ADMIN' && <><section className="space-y-3"><h2 className="text-xl font-bold">Comptes partenaires et agents</h2><form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const form=new FormData(e.currentTarget); action(() => post('/admin/users', { email: form.get('email'), role: form.get('role') }), 'Compte créé.'); }}><input name="email" type="email" required placeholder="E-mail" className="rounded bg-slate-800 p-2" /><select name="role" className="rounded bg-slate-800 p-2"><option value="PARTNER">Partenaire</option><option value="FIELD_AGENT">Agent</option></select><button className="rounded bg-indigo-600 px-3">Créer</button></form>{users.map((entry) => <p key={entry.id} className="text-sm">{entry.email} · {entry.role}</p>)}</section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Validation des logements</h2>{listings.map((listing) => <article key={listing.id} className="rounded bg-slate-900 p-4 space-y-2"><p className="font-bold">{listing.title} · {listing.status}</p><button className="text-emerald-400" onClick={() => loadDocuments(listing.id)}>Voir les pièces</button>{selectedListing === listing.id && (documents[listing.id] || []).map((doc) => <p key={doc.id} className="text-sm">{doc.kind} · <a className="underline" href={`/v1/documents/${doc.id}`} target="_blank">ouvrir</a> · {doc.approved_at ? 'approuvé' : <button className="text-amber-400" onClick={() => action(async () => { await post(`/admin/documents/${doc.id}/approve`); await loadDocuments(listing.id); }, 'Pièce approuvée.')}>Approuver</button>}</p>)}<div className="flex flex-wrap gap-2"><button className="rounded bg-indigo-600 px-3 py-1" onClick={() => action(() => post(`/admin/listings/${listing.id}/documents/approve`), 'Dossier validé.')}>Valider le dossier</button><button className="rounded bg-emerald-600 px-3 py-1" onClick={() => action(() => post(`/admin/listings/${listing.id}/approve`), 'Logement publié.')}>Publier</button><button className="rounded bg-rose-600 px-3 py-1" onClick={() => action(() => post(`/admin/listings/${listing.id}/suspend`), 'Logement suspendu.')}>Suspendre</button></div>{listing.status === 'PENDING_INSPECTION' && <div>Assigner : <select className="rounded bg-slate-800 p-1" onChange={(e) => setSelectedMission(e.target.value)}><option value="">Agent</option>{users.filter((entry) => entry.role === 'FIELD_AGENT').map((agent) => <option key={agent.id} value={agent.id}>{agent.email}</option>)}</select><button className="ml-2 rounded bg-indigo-600 px-3 py-1" onClick={() => action(() => post('/admin/missions', { listingId: listing.id, agentId: selectedMission }), 'Mission créée.')}>Créer mission</button></div>}</article>)}</section>
      <section><h2 className="text-xl font-bold">Missions</h2>{missions.map((mission) => <p key={mission.id} className="text-sm">{mission.id} · {mission.status} · {mission.outcome || 'sans avis'}</p>)}</section></>}

    {user?.role === 'OPERATIONS_ADMIN' && <section className="space-y-3"><h2 className="text-xl font-bold">Revue des vidéos</h2>{listings.map((listing) => <div key={listing.id} className="rounded bg-slate-900 p-3 text-sm space-y-2"><p>{listing.title} · {listing.video_status || 'Aucune vidéo'}</p>{listing.video_status && <video controls preload="metadata" className="max-w-md w-full rounded bg-black" src={`/v1/listings/${listing.id}/video`} />}{listing.video_status === 'PENDING_REVIEW' && <button className="rounded bg-emerald-600 px-3 py-1" onClick={() => action(() => post(`/admin/listings/${listing.id}/video/approve`), 'Vidéo approuvée.')}>Approuver la vidéo</button>}</div>)}</section>}

    {user && bookings.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">Réservations</h2>{bookings.map((booking) => <article key={booking.id} className="rounded bg-slate-900 p-4 space-y-2"><p>{booking.id} · {booking.status}</p><p className="text-sm">{booking.check_in} → {booking.check_out} · {Number(booking.price_cdf).toLocaleString('fr-CD')} CDF</p><div className="flex flex-wrap gap-2">{user.role === 'PARTNER' && booking.status === 'REQUESTED' && <button className="rounded bg-amber-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/accept`), 'Dates bloquées 30 minutes.')}>Accepter</button>}{user.role === 'CLIENT' && booking.status === 'HOST_ACCEPTED_TERMS' && <button className="rounded bg-sky-600 px-3 py-1" onClick={() => { const reference=prompt('Référence du paiement direct à l’hôte'); if(reference) action(() => post(`/bookings/${booking.id}/declare-payment`, { reference }), 'Paiement déclaré.'); }}>Déclarer le paiement</button>}{user.role === 'PARTNER' && booking.status === 'PAYMENT_DECLARED' && <button className="rounded bg-emerald-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/confirm`), 'Réservation confirmée.')}>Confirmer le paiement reçu</button>}{['CLIENT','PARTNER','OPERATIONS_ADMIN'].includes(user.role) && !['CANCELLED','COMPLETED'].includes(booking.status) && <button className="rounded bg-rose-700 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/cancel`), 'Réservation annulée.')}>Annuler</button>}{user.role === 'OPERATIONS_ADMIN' && booking.status === 'CONFIRMED' && <button className="rounded bg-indigo-600 px-3 py-1" onClick={() => action(() => post(`/bookings/${booking.id}/complete`), 'Séjour clôturé et commission facturée.')}>Clôturer le séjour</button>}</div></article>)}</section>}
    {user && bookings.some((booking) => booking.refund_status === 'PENDING_PARTNER') && <section className="space-y-2"><h2 className="text-xl font-bold">Remboursements directs à suivre</h2>{bookings.filter((booking) => booking.refund_status === 'PENDING_PARTNER').map((booking) => <div key={booking.id} className="rounded bg-slate-900 p-3 text-sm"><p>{booking.id} · {Number(booking.refund_due_cdf || 0).toLocaleString('fr-CD')} CDF dus par l'hôte</p>{user.role === 'PARTNER' && <button className="text-emerald-400" onClick={() => { const reference=prompt('Référence du remboursement effectué au client'); if(reference) action(() => post(`/bookings/${booking.id}/refund-confirm`, {reference}), 'Remboursement déclaré.'); }}>Déclarer le remboursement effectué</button>}</div>)}</section>}
    {user && applications.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">Dossiers de location longue durée</h2>{applications.map((application) => <article key={application.id} className="rounded bg-slate-900 p-3 text-sm space-y-1"><p>{application.id} · {application.status}</p><p>{application.message}</p>{application.agreed_rent_cdf && <p>Loyer convenu : {Number(application.agreed_rent_cdf).toLocaleString('fr-CD')} CDF</p>}{user.role === 'OPERATIONS_ADMIN' && <select className="rounded bg-slate-800 p-1" defaultValue="" onChange={(e) => { if(e.target.value) action(() => post(`/admin/lease-applications/${application.id}/status`, { status: e.target.value }), 'Dossier mis à jour.'); }}><option value="">Faire avancer le dossier</option><option value="UNDER_REVIEW">En revue</option><option value="NEGOTIATING">Négociation</option><option value="LEASE_PREPARED">Bail préparé</option><option value="CANCELLED">Annulé</option></select>}</article>)}</section>}
    {user && <section className="space-y-3"><h2 className="text-xl font-bold">Assistance</h2>{user.role !== 'OPERATIONS_ADMIN' && <div className="flex flex-wrap gap-2"><input className="min-w-64 flex-1 rounded bg-slate-800 p-2" placeholder="Décrivez le problème rencontré" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} /><button className="rounded bg-indigo-600 px-3" onClick={() => action(async () => { await post('/tickets', { category: 'ASSISTANCE', message: ticketMessage }); setTicketMessage(''); }, 'Ticket créé.')}>Signaler</button></div>}{tickets.map((ticket) => <article key={ticket.id} className="rounded bg-slate-900 p-3 text-sm"><p>{ticket.category} · {ticket.status}</p><p>{ticket.message}</p>{user.role === 'OPERATIONS_ADMIN' && ticket.status === 'OPEN' && <button className="text-emerald-400" onClick={() => action(() => post(`/admin/tickets/${ticket.id}/resolve`), 'Ticket résolu.')}>Marquer résolu</button>}</article>)}</section>}
    {user && invoices.length > 0 && <section className="space-y-2"><h2 className="text-xl font-bold">Factures de commission</h2>{invoices.map((invoice) => <p key={invoice.id} className="rounded bg-slate-900 p-3 text-sm">{invoice.id} · {Number(invoice.amount_cdf).toLocaleString('fr-CD')} CDF · {invoice.status}</p>)}</section>}
    {user && notifications.length > 0 && <section className="space-y-2"><h2 className="text-xl font-bold">Notifications</h2>{notifications.map((notification) => <p key={notification.id} className="rounded bg-slate-900 p-3 text-sm"><strong>{notification.subject}</strong> · {notification.body}</p>)}</section>}
  </main>;
}
