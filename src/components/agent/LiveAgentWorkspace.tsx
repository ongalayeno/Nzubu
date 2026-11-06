import React, { useEffect, useRef, useState } from 'react';
import { Archive, Camera, CheckCircle2, ClipboardCheck, LocateFixed, MapPin, Phone, Send, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import type { FieldMission } from '../../types';
import { exportMissionPdf } from '../../utils/exportMissionPdf';

type Listing = { id: string; title: string; commune: string; partner_email?: string | null; partner_phone?: string | null; data?: { neighborhood?: string; description?: string } };
type Mission = { id: string; listing_id: string; status: string; outcome?: string; report?: Record<string, unknown>; submitted_at?: string; created_at?: string };
type Document = { id: string; kind: string; approved_at: string | null };
type Gps = { latitude: number; longitude: number; accuracyMeters: number };
type Props = {
  agent: string;
  missions: Mission[];
  listings: Listing[];
  selectedMission: string | null;
  checks: Record<string, boolean>;
  gps: Gps | null;
  photos: File[];
  photoCaptions: string[];
  outcome: string;
  notes: string;
  draftPending: boolean;
  documents: Record<string, Document[]>;
  onSelect: (mission: Mission) => void;
  onChecks: (checks: Record<string, boolean>) => void;
  onGps: (gps: Gps) => void;
  onGpsError: (message: string) => void;
  onPhotos: (photos: File[]) => void;
  onPhotoCaptions: (captions: string[]) => void;
  onOutcome: (outcome: string) => void;
  onNotes: (notes: string) => void;
  onSubmit: (mission: Mission) => void;
  onClearDrafts: () => void;
  onLoadDocuments: (listingId: string) => void;
  onOpenSection: (id: string) => void;
  ticketCount: number;
  notificationCount: number;
};

const checklist = [
  ['identityVerified', 'Identité du proposant rencontrée', 'Pièce officielle comparée sur place et personne autorisée.'],
  ['mandateOrTitleChecked', 'Droit de proposer : titre ou mandat', 'Examen du titre ou du mandat écrit.'],
  ['physicalPresenceConfirmed', 'Existence physique et présence sur site', 'Contrôle du logement réel avec capture GPS.'],
  ['waterSupplyTested', 'Eau courante et réserve', 'Robinet et réserve d’eau vérifiés sur place.'],
  ['electricityTested', 'Électricité et secours', 'Alimentation, prises et dispositif de secours observés.'],
  ['roomsMatchedListing', 'Concordance des pièces à montrer', 'Nombre et état des pièces comparés à l’annonce.'],
  ['pricingInCdfNoExcessiveDeposit', 'Prix en CDF et dépôt', 'Prix affiché et conditions examinés.'],
  ['videoFilmedVerticalNoFaces', 'Vidéo verticale sans visages tiers', 'Média comparé au logement et respect de la vie privée.'],
  ['safetyEgressChecked', 'Issues de secours et serrures', 'Accès, évacuation et verrous observés.'],
] as const;
const outcomes = [
  ['PASS', 'Favorable'], ['PASS_WITH_DISCLOSURES', 'Réserves visibles'],
  ['NEEDS_CORRECTION', 'Correctifs requis'], ['SAFETY_CONCERN', 'Alerte sécurité'],
] as const;
const active = (mission: Mission) => ['ASSIGNED', 'IN_PROGRESS'].includes(mission.status);
const statusLabel: Record<string, string> = { ASSIGNED: 'À inspecter', IN_PROGRESS: 'En cours', REPORT_SUBMITTED: 'Rapport soumis', APPROVED: 'Validé', NEEDS_CORRECTION: 'À corriger' };

export function LiveAgentWorkspace({ agent, missions, listings, selectedMission, checks, gps, photos, photoCaptions, outcome, notes, draftPending, documents, onSelect, onChecks, onGps, onGpsError, onPhotos, onPhotoCaptions, onOutcome, onNotes, onSubmit, onClearDrafts, onLoadDocuments, onOpenSection, ticketCount, notificationCount }: Props) {
  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVES'>('ACTIVE');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveCommune, setArchiveCommune] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [pdfError, setPdfError] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Compteur SNEL / Disjoncteur');
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  const activeMissions = missions.filter(active);
  const archives = missions.filter((mission) => !active(mission));
  const communes = [...new Set(archives.map((mission) => listings.find((item) => item.id === mission.listing_id)?.commune).filter((value): value is string => !!value))];
  const visible = tab === 'ACTIVE' ? activeMissions : archives.filter((mission) => {
    const item = listings.find((entry) => entry.id === mission.listing_id);
    const query = archiveQuery.trim().toLocaleLowerCase();
    return (!query || `${mission.id} ${item?.title || ''} ${item?.commune || ''}`.toLocaleLowerCase().includes(query))
      && (!archiveCommune || item?.commune === archiveCommune);
  }).sort((a, b) => (newestFirst ? -1 : 1) * (Date.parse(a.submitted_at || a.created_at || '') - Date.parse(b.submitted_at || b.created_at || '')));
  const selected = missions.find((mission) => mission.id === selectedMission && (tab === 'ACTIVE' ? active(mission) : !active(mission)));
  const listing = listings.find((item) => item.id === selected?.listing_id);
  const checkedCount = checklist.filter(([key]) => checks[key]).length;
  const canSubmit = !!selected && !!gps && (outcome !== 'PASS' || (checkedCount === checklist.length && photos.length > 0));
  const archivedChecks = selected?.report?.checks as Record<string, boolean> | undefined;
  const archivedGps = selected?.report?.gps as Gps | undefined;
  const archivedPhotoIds = selected?.report?.photoIds as string[] | undefined;

  const exportPdf = async () => {
    if (!selected) return;
    setPdfError('');
    const report = selected.report || {};
    try {
      await exportMissionPdf({
        id: selected.id, listingId: selected.listing_id, unitTitle: listing?.title || 'Logement',
        commune: listing?.commune || '', quartier: listing?.data?.neighborhood || '', landmark: '',
        contactPerson: listing?.partner_email || 'Non renseigné', contactPhone: listing?.partner_phone || '',
        scheduledTime: selected.created_at || '', agentId: agent, agentName: agent,
        status: selected.status as FieldMission['status'],
        checklist: Object.fromEntries(checklist.map(([key]) => [key, Boolean(archivedChecks?.[key])])) as FieldMission['checklist'],
        decisionOutcome: selected.outcome as FieldMission['decisionOutcome'],
        notes: typeof report.notes === 'string' ? report.notes : '', gpsCoordinates: archivedGps,
        photos: (archivedPhotoIds || []).map((id, index) => ({ id, url: '', caption: (report.photoCaptions as string[] | undefined)?.[index] || `Preuve ${index + 1}`, capturedAt: '' })),
        completedAt: selected.submitted_at,
      });
    } catch { setPdfError('Le rapport PDF n’a pas pu être généré. Réessayez.'); }
  };

  const captureGps = () => {
    if (!navigator.geolocation) { onGpsError('GPS indisponible sur cet appareil.'); return; }
    setCaptureBusy(true);
    navigator.geolocation.getCurrentPosition((position) => { onGps({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy }); setCaptureBusy(false); }, () => { onGpsError('GPS refusé ou indisponible. Réessayez sur place.'); setCaptureBusy(false); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });
  };

  return <section id="missions" className="mx-auto max-w-5xl space-y-6" aria-label="Espace agent de terrain">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-emerald-400">PWA agent terrain · Kinshasa</span><span className="rounded-full bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-300">{agent}</span></div><h1 className="mt-2 text-2xl font-black sm:text-3xl">Contrôles terrain & archives des inspections</h1><p className="mt-1 text-sm text-slate-400">Vérification physique, GPS de présence, photos et historique des missions.</p></div><span className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${online ? 'border-emerald-700 text-emerald-300' : 'border-amber-700 text-amber-300'}`}>{online ? <Wifi size={16} /> : <WifiOff size={16} />}{online ? 'Réseau disponible' : 'Hors ligne · Brouillon local'}</span></div>
    {!online && <p role="status" className="rounded-xl border border-amber-700/50 bg-amber-500/10 p-3 text-xs text-amber-200">Conservez cette page ouverte pendant la mission. Après un rechargement hors ligne, une reconnexion sera nécessaire pour retrouver les dossiers.</p>}
    <div className="flex w-fit gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1" role="tablist" aria-label="Missions de terrain"><button type="button" role="tab" aria-selected={tab === 'ACTIVE'} onClick={() => setTab('ACTIVE')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ${tab === 'ACTIVE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}><ClipboardCheck size={16} /> Missions actives ({activeMissions.length})</button><button type="button" role="tab" aria-selected={tab === 'ARCHIVES'} onClick={() => setTab('ARCHIVES')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ${tab === 'ARCHIVES' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}><Archive size={16} /> Archives ({archives.length})</button></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Fonctions de mission">{[
      ['Fiche et contact du logement', 'Coordonnées et pièces accessibles sur mission assignée'],
      ['Position GPS', 'Capture réelle sur le lieu de l’inspection'],
      ['Grille de 9 contrôles', 'Identité, mandat, eau, électricité, sécurité et média'],
      ['Photos de preuve', 'Jusqu’à 3 clichés conservés avec le brouillon'],
      ['Avis et rapport', 'Favorable, réserves, correctifs ou alerte sécurité'],
      ['Travail hors ligne', 'Brouillon local et synchronisation au retour du réseau'],
    ].map(([title, description]) => <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><strong className="block text-xs text-slate-200">{title}</strong><span className="mt-1 block text-[11px] text-slate-400">{activeMissions.length ? description : 'En attente d’une mission · ' + description}</span></div>)}</div>
    <div role="tabpanel" className="space-y-4"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">{tab === 'ACTIVE' ? 'Missions assignées en attente d’inspection' : 'Rapports soumis et inspections validées'}</h2>{tab === 'ARCHIVES' && <div className="flex flex-wrap gap-2"><input aria-label="Rechercher une archive" value={archiveQuery} onChange={(event) => setArchiveQuery(event.target.value)} placeholder="Rechercher une mission ou un logement" className="min-w-56 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs" /><select aria-label="Filtrer les archives par commune" value={archiveCommune} onChange={(event) => setArchiveCommune(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs"><option value="">Toutes les communes</option>{communes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}</select><button type="button" onClick={() => setNewestFirst((value) => !value)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">{newestFirst ? 'Plus récentes' : 'Plus anciennes'}</button></div>}{visible.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">{tab === 'ACTIVE' ? 'Aucune mission assignée pour le moment. Cet espace apparaîtra dès qu’une mission vous sera attribuée.' : archives.length ? 'Aucun rapport ne correspond à ces filtres.' : 'Aucune inspection archivée pour le moment.'}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{visible.map((mission) => { const item = listings.find((entry) => entry.id === mission.listing_id); return <button key={mission.id} type="button" onClick={() => onSelect(mission)} className={`rounded-2xl border p-5 text-left ${selectedMission === mission.id ? 'border-emerald-500 bg-slate-900' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-emerald-400">{mission.id.slice(0, 8)}</span><span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-amber-300">{statusLabel[mission.status] || mission.status}</span></div><strong className="mt-3 block text-sm">{item?.title || `Logement ${mission.listing_id.slice(0, 8)}`}</strong><span className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin size={14} />{item?.commune || 'Commune non renseignée'}{item?.data?.neighborhood ? ` · ${item.data.neighborhood}` : ''}</span></button>; })}</div></div>

    {selected && <article className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4"><div><span className="text-xs font-bold uppercase text-emerald-400">{tab === 'ACTIVE' ? 'Inspection sur site' : 'Rapport archivé'}</span><h2 className="mt-2 text-xl font-black">{listing?.title || 'Logement à inspecter'}</h2><p className="mt-1 text-sm text-slate-400">{listing?.commune || 'Commune non renseignée'}{listing?.data?.neighborhood ? ` · ${listing.data.neighborhood}` : ''}</p>{listing?.data?.description && <p className="mt-2 max-w-2xl text-xs text-slate-400">{listing.data.description}</p>}</div><div className="flex flex-wrap gap-2">{listing?.partner_phone ? <a href={`tel:${listing.partner_phone}`} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold"><Phone size={15} /> Appeler le contact</a> : <span className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400">Téléphone non renseigné</span>}{listing?.partner_email ? <a href={`mailto:${listing.partner_email}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold">Écrire au partenaire</a> : <span className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400">Courriel non renseigné</span>}</div></div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold"><LocateFixed size={17} className="text-emerald-400" /> Preuve de présence physique · GPS</h3><p className="mt-1 text-xs text-slate-400">Capture sur place requise avant l’envoi du rapport.</p></div>{tab === 'ACTIVE' && <button type="button" disabled={captureBusy} onClick={captureGps} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{captureBusy ? 'Capture…' : 'Capturer position GPS'}</button>}</div><p className={`mt-3 rounded-lg px-3 py-2 text-xs ${gps && tab === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{tab === 'ACTIVE' ? gps ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} · précision ${Math.round(gps.accuracyMeters)} m` : 'Aucune coordonnée GPS enregistrée.' : selected.report?.gps ? 'Position GPS jointe au rapport.' : 'Aucune position dans le rapport.'}</p></div>
      <section className="space-y-2"><button type="button" onClick={() => onLoadDocuments(selected.listing_id)} className="text-xs font-semibold text-sky-300 underline">Consulter les pièces du logement</button>{(documents[selected.listing_id] || []).map((document) => <p key={document.id} className="text-xs text-slate-300">{document.kind} · {document.approved_at ? 'approuvée' : 'en attente'} · <a className="underline" href={`/v1/documents/${document.id}`} target="_blank" rel="noreferrer">Ouvrir</a></p>)}</section>
      {tab === 'ACTIVE' ? <><section className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide">Grille de contrôle physique obligatoire</h3><span className="font-mono text-xs text-emerald-400">{checkedCount} / {checklist.length} critères</span></div>{checklist.map(([key, label, description], index) => <label key={key} className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4"><input type="checkbox" checked={Boolean(checks[key])} onChange={(event) => onChecks({ ...checks, [key]: event.target.checked })} className="mt-1 accent-emerald-500" /><span><strong className="block text-sm">{index + 1}. {label}</strong><span className="block text-xs text-slate-400">{description}</span></span></label>)}</section>
        <section className="space-y-3 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-xs font-bold uppercase"><Camera size={17} className="text-emerald-400" /> Preuves photographiques de mission</h3><span className="font-mono text-xs text-slate-400">{photos.length} / 3 photos</span></div>
          <p className="text-xs text-slate-400">Joignez jusqu’à 3 photos prises sur site. Au moins une photo est nécessaire pour un avis favorable.</p>
          <label className="block text-xs font-semibold">Catégorie du prochain cliché<select value={photoCategory} onChange={(event) => setPhotoCategory(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2 sm:w-auto"><option>Compteur SNEL / Disjoncteur</option><option>Salon / Pièce principale</option><option>Façade / Eau</option><option>Autre constat</option></select></label>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={photos.length >= 3} onClick={() => photoInput.current?.click()} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold disabled:opacity-50">Prendre / Téléverser photo</button>{[['Compteur SNEL / Disjoncteur', '+ Compteur SNEL'], ['Salon / Pièce principale', '+ Salon'], ['Façade / Eau', '+ Façade / Eau']].map(([category, label]) => <button key={category} type="button" disabled={photos.length >= 3} onClick={() => { setPhotoCategory(category); photoInput.current?.click(); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-50">{label}</button>)}</div>
          <input ref={photoInput} aria-label="Choisir les photos de mission" type="file" accept="image/png,image/jpeg" capture="environment" multiple disabled={photos.length >= 3} onChange={(event) => { const added = Array.from(event.target.files || []).slice(0, 3 - photos.length); onPhotos([...photos, ...added]); onPhotoCaptions([...photoCaptions, ...added.map(() => photoCategory)]); event.target.value = ''; }} className="sr-only" />
          {photos.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">Aucune photo jointe au rapport.</p>}
          {photos.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-800 p-2 text-xs"><span className="truncate">{index + 1}. {photoCaptions[index] || 'Preuve'} · {file.name}</span><button type="button" onClick={() => { onPhotos(photos.filter((_, position) => position !== index)); onPhotoCaptions(photoCaptions.filter((_, position) => position !== index)); }} className="text-rose-300 underline">Retirer</button></div>)}
        </section>
        <section className="space-y-3"><h3 className="text-xs font-bold uppercase">Avis & recommandation de l’agent</h3><div className="grid gap-2 sm:grid-cols-4">{outcomes.map(([value, label]) => <button key={value} type="button" aria-pressed={outcome === value} onClick={() => onOutcome(value)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${outcome === value ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{value === 'SAFETY_CONCERN' && <ShieldAlert size={14} className="mr-1 inline" />}{label}</button>)}</div><label className="block text-xs font-bold">Observations de terrain<textarea value={notes} onChange={(event) => onNotes(event.target.value)} maxLength={5000} placeholder="Décrivez les constats sur place." className="mt-2 block min-h-24 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm font-normal text-white" /></label></section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4"><div className="space-y-1 text-xs text-slate-400">{!gps && <p className="text-amber-300">Position GPS requise avant envoi.</p>}{outcome === 'PASS' && checkedCount !== checklist.length && <p>Un avis favorable exige les 9 critères cochés.</p>}{outcome === 'PASS' && photos.length === 0 && <p>Ajoutez une photo pour permettre la validation.</p>}{draftPending && <p className="text-amber-300">Rapport enregistré localement, synchronisation en attente.</p>}</div><button type="button" disabled={!canSubmit} onClick={() => onSubmit(selected)} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} />{draftPending ? 'Synchroniser le rapport' : online ? 'Transmettre le rapport' : 'Conserver pour synchronisation'}</button></div></> : <div className="space-y-3 text-sm text-slate-300"><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Statut : {statusLabel[selected.status] || selected.status}</p><p>Avis : {outcomes.find(([value]) => value === selected.outcome)?.[1] || selected.outcome || 'Non renseigné'}</p><p>Transmis : {selected.submitted_at?.slice(0, 16) || 'Date indisponible'}</p>{archivedGps && <p>GPS : {archivedGps.latitude.toFixed(6)}, {archivedGps.longitude.toFixed(6)} · précision {Math.round(archivedGps.accuracyMeters)} m</p>}<p>Photos jointes : {archivedPhotoIds?.length || 0}</p>{((selected.report?.photoCaptions as string[] | undefined) || []).map((caption, index) => <p key={`${index}-${caption}`} className="text-xs text-slate-400">{index + 1}. {caption}</p>)}<div className="grid gap-1 sm:grid-cols-2">{checklist.map(([key, label]) => <p key={key} className={archivedChecks?.[key] ? 'text-emerald-300' : 'text-slate-400'}>{archivedChecks?.[key] ? '✓' : '○'} {label}</p>)}</div>{typeof selected.report?.notes === 'string' && <p>Observations : {selected.report.notes}</p>}<button type="button" onClick={() => { void exportPdf(); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-sky-300">Exporter le rapport PDF</button>{pdfError && <p role="alert" className="text-rose-300">{pdfError}</p>}</div>}
    </article>}
    <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => onOpenSection('assistance')} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-emerald-500"><strong className="block text-sm">Assistance et signalements</strong><span className="mt-1 block text-xs text-slate-400">{ticketCount} ticket(s) ouvert(s) · Disponible même sans mission</span></button><button type="button" onClick={() => onOpenSection('notifications')} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-emerald-500"><strong className="block text-sm">Notifications</strong><span className="mt-1 block text-xs text-slate-400">{notificationCount} notification(s)</span></button></div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Vos brouillons restent sur cet appareil jusqu’à leur synchronisation.</span><button type="button" onClick={onClearDrafts} className="text-rose-300 underline">Effacer les brouillons de cet appareil</button></div>
  </section>;
}
