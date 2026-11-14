import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, CheckCircle2, Map, Megaphone, Scale, ShieldCheck, Users,
} from 'lucide-react';
import { InspectionStatsView } from './InspectionStatsView';
import { KinshasaRadarMap } from '../common/KinshasaRadarMap';
import { CreateSponsoredAdModal } from '../ads/CreateSponsoredAdModal';
import { ComplianceBadgeModal } from '../legal/ComplianceBadgeModal';
import { apiListingToPropertyListing, apiMissionToFieldMission } from '../../utils/listingAdapter';
import type { SponsoredAd } from '../../types';

type Listing = { id: string; title: string; commune: string; rental_mode: string; price_cdf: number; partner_id?: string; status?: string; video_status?: string; verified_until?: string; data?: { neighborhood?: string; [key: string]: any } };
type Mission = { id: string; listing_id: string; agent_id?: string; status: string; outcome?: string; report?: Record<string, unknown>; submitted_at?: string; created_at?: string };
type User = { id: string; email: string | null; role: string };
type Ticket = { id: string; listing_id?: string; category: string; message: string; status: string; priority?: string; created_at?: string };
type Props = {
  listings: Listing[];
  missions: Mission[];
  users: User[];
  tickets: Ticket[];
  counts: { bookings: number; viewings: number; applications: number; invoices: number; notifications: number };
  onOpenSection: (id: string) => void;
  onPublish: (id: string) => void;
  onSuspend: (id: string) => void;
  onResolveTicket: (id: string) => void;
  ads?: SponsoredAd[];
  onCreateAd?: (ad: Omit<SponsoredAd, 'id' | 'impressionsCount' | 'clicksCount' | 'startsAt' | 'expiresAt' | 'status'>) => void;
  onToggleAdStatus?: (id: string, status: 'ACTIVE' | 'PAUSED' | 'EXPIRED') => void;
};

const statusLabels: Record<string, string> = {
  PENDING_DOCUMENTS: 'Pièces à contrôler',
  PENDING_INSPECTION: 'Inspection à organiser',
  PENDING_APPROVAL: 'Revue marché en attente',
  PUBLISHED: 'Publié',
  SUSPENDED: 'Suspendu',
  REJECTED: 'Refusé',
};
const money = (value: number) => `${Number(value || 0).toLocaleString('fr-CD')} CDF`;

export function LiveAdminDashboard({
  listings, missions, users, tickets, counts, onOpenSection, onPublish, onSuspend, onResolveTicket,
  ads = [], onCreateAd, onToggleAdStatus,
}: Props) {
  const [tab, setTab] = useState<'REVIEW' | 'DISPATCH' | 'LEGAL' | 'STATS' | 'RADAR' | 'ADS'>('REVIEW');
  const [showAdModal, setShowAdModal] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);

  const openTickets = tickets.filter((ticket) => ticket.status === 'OPEN');
  const critical = openTickets.filter((ticket) => ticket.priority === 'CRITICAL');
  const reports = missions.filter((mission) => ['REPORT_SUBMITTED', 'APPROVED'].includes(mission.status));
  const review = listings.filter((listing) => listing.status === 'PENDING_APPROVAL').length;
  const published = listings.filter((listing) => listing.status === 'PUBLISHED').length;
  const agents = users.filter((user) => user.role === 'FIELD_AGENT');

  const richListings = useMemo(() => listings.map((l) => apiListingToPropertyListing(l as any)), [listings]);
  const richMissions = useMemo(
    () => missions.map((m) => apiMissionToFieldMission(m, listings.find((l) => l.id === m.listing_id) as any)),
    [missions, listings]
  );

  return (
    <section className="space-y-6" aria-label="Tableau de bord opérations et administration">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Administration & supervision opérations</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Back-Office Opérationnel NZUBU Kinshasa</h1>
          <p className="mt-1 text-sm text-slate-400">Revue des annonces, agents, séjours, dossiers, statistiques, radar et monétisation.</p>
        </div>
        <span className="rounded-xl border border-emerald-700/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">Compte administration connecté</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Logements publiés', `${published} / ${listings.length}`, 'Annonces actuellement publiées'],
          ['À revoir', String(review), 'Dossiers en attente de décision'],
          ['Rapports terrain reçus', String(reports.length), `${missions.filter((mission) => mission.status === 'REPORT_SUBMITTED').length} en attente de revue`],
          ['Alertes critiques', String(critical.length), `${openTickets.length} ticket(s) ouvert(s)`],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span className="text-xs text-slate-400">{label}</span>
            <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
            <span className="mt-2 block text-xs text-slate-400">{note}</span>
          </div>
        ))}
      </div>

      <div id="alertes-critiques" className={`space-y-3 rounded-2xl border p-5 ${critical.length ? 'border-rose-500/60 bg-rose-950/30' : 'border-slate-800 bg-slate-900/50'}`}>
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle size={18} className={critical.length ? 'text-rose-400' : 'text-slate-500'} /> Alertes prioritaires du back-office ({critical.length})
        </h2>
        {critical.length === 0 && <p className="text-xs text-slate-400">Aucune alerte critique ouverte. Les signalements terrain apparaîtront ici automatiquement.</p>}
        {critical.map((ticket) => {
          const listing = listings.find((item) => item.id === ticket.listing_id);
          const mission = missions.find((item) => item.listing_id === ticket.listing_id && item.outcome === 'SAFETY_CONCERN');
          const gps = mission?.report?.gps as { latitude: number; longitude: number; accuracyMeters?: number } | undefined;
          const photoIds = mission?.report?.photoIds as string[] | undefined;
          const agent = users.find((item) => item.id === mission?.agent_id);
          return (
            <article key={ticket.id} className="rounded-xl border border-rose-500/30 bg-slate-900 p-4 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-sm">{listing?.title || ticket.category}</strong>
                <span className="font-mono text-rose-300">{ticket.id.slice(0, 8)}</span>
              </div>
              <p className="mt-2 text-slate-300">{ticket.message}</p>
              <p className="mt-1 text-slate-400">{listing?.commune || 'Logement non associé'} · {ticket.created_at?.slice(0, 16) || 'Date non disponible'}{agent ? ` · Agent : ${agent.email}` : ''}</p>
              {gps && <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 font-mono text-emerald-300">GPS : {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}{gps.accuracyMeters ? ` · précision ${Math.round(gps.accuracyMeters)} m` : ''}</p>}
              {photoIds?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoIds.map((id) => (
                    <a key={id} href={`/v1/documents/${id}`} target="_blank" rel="noreferrer">
                      <img src={`/v1/documents/${id}`} alt="Preuve photographique de l’alerte" className="h-24 w-32 rounded-lg border border-slate-700 object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {listing && listing.status !== 'SUSPENDED' && <button type="button" onClick={() => onSuspend(listing.id)} className="rounded-lg border border-rose-500/50 px-3 py-2 font-bold text-rose-300">Suspendre l’annonce</button>}
                {listing && <button type="button" onClick={() => onOpenSection(`admin-listing-${listing.id}`)} className="rounded-lg border border-slate-700 px-3 py-2 font-bold text-slate-200">Voir le logement</button>}
                <button type="button" onClick={() => onResolveTicket(ticket.id)} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Résoudre avec justification</button>
              </div>
            </article>
          );
        })}
      </div>

      <div role="tablist" aria-label="Supervision administrative" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
        {([
          ['REVIEW', ShieldCheck, `Revue Marché & Badges (${listings.length})`],
          ['DISPATCH', Users, `Dispatching Agents (${missions.length})`],
          ['STATS', BarChart3, 'Statistiques & Baux PDF'],
          ['RADAR', Map, 'Radar Kinshasa'],
          ['ADS', Megaphone, `Monétisation (${ads.length})`],
          ['LEGAL', Scale, 'Registre légal & conformité RDC'],
        ] as const).map(([key, Icon, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-semibold ${tab === key ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === 'REVIEW' && (
        <div role="tabpanel" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Contrôle avant diffusion dans le feed</h2>
            <span className="text-xs text-slate-400">Publication après pièces, rapport terrain et vidéo approuvés</span>
          </div>
          {listings.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucun logement saisi. La revue est prête dès le premier dépôt partenaire.</p>}
          {listings.map((listing) => {
            const mission = missions.find((item) => item.listing_id === listing.id && ['REPORT_SUBMITTED', 'APPROVED'].includes(item.status));
            const agent = users.find((item) => item.id === mission?.agent_id);
            const partner = users.find((item) => item.id === listing.partner_id);
            return (
              <article key={listing.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs text-indigo-300">{listing.id.slice(0, 8)}</span>
                    <h3 className="mt-1 font-bold">{listing.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{listing.commune}{listing.data?.neighborhood ? ` · ${listing.data.neighborhood}` : ''} · {listing.rental_mode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}</p>
                    <p className="mt-1 font-mono text-xs text-amber-400">{money(listing.price_cdf)} / {listing.rental_mode === 'SHORT_STAY' ? 'nuit' : 'mois'}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    {statusLabels[listing.status || ''] || listing.status || 'État inconnu'}{listing.status === 'PUBLISHED' && listing.verified_until ? ` · badge jusqu’au ${listing.verified_until.slice(0, 10)}` : ''}
                  </span>
                </div>
                <div className="grid gap-3 text-xs sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"><span className="block text-slate-400">Agent inspecteur</span><strong>{agent?.email || (mission ? 'Compte agent' : 'Non assigné')}</strong><span className="mt-1 block text-slate-400">{mission ? `Rapport ${mission.status}` : 'Rapport non reçu'}</span></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"><span className="block text-slate-400">Partenaire / Mandant</span><strong>{partner?.email || 'Compte partenaire'}</strong></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"><span className="block text-slate-400">Contrôles</span><strong>Vidéo : {listing.video_status || 'Non envoyée'}</strong><span className="mt-1 block text-slate-400">Pièces et rapport à vérifier dans le dossier</span></div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => onOpenSection(`admin-listing-${listing.id}`)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold">Examiner le dossier</button>
                  {listing.status !== 'SUSPENDED' && <button type="button" onClick={() => onSuspend(listing.id)} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">Suspendre temporairement</button>}
                  {listing.status === 'PENDING_APPROVAL' && <button type="button" onClick={() => onPublish(listing.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold">Valider et publier pour 90 jours</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'DISPATCH' && (
        <div role="tabpanel" className="space-y-3">
          <h2 className="text-sm font-bold">Missions des agents terrain</h2>
          <p className="text-xs text-slate-400">{agents.length} agent(s) enregistré(s). L’assignation est disponible pour les logements en attente d’inspection.</p>
          {missions.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Aucune mission créée. Ajoutez un agent et préparez un logement pour l’inspection.</p>}
          {missions.map((mission) => {
            const listing = listings.find((item) => item.id === mission.listing_id);
            const agent = users.find((item) => item.id === mission.agent_id);
            return (
              <div key={mission.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs">
                <span><strong>{listing?.title || 'Logement'}</strong> · {agent?.email || 'Agent non assigné'}</span>
                <span>{mission.status} · {mission.outcome || 'Avis en attente'}</span>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenSection('validations')} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold">Assigner depuis un dossier logement</button>
            <button type="button" onClick={() => onOpenSection('missions-admin')} className="rounded-lg border border-indigo-500/40 px-3 py-2 text-xs font-bold text-indigo-300">Voir les missions</button>
          </div>
        </div>
      )}

      {tab === 'STATS' && (
        <div role="tabpanel">
          <InspectionStatsView missions={richMissions} listings={richListings} />
        </div>
      )}

      {tab === 'RADAR' && (
        <div role="tabpanel">
          <KinshasaRadarMap missions={richMissions} listings={richListings} />
        </div>
      )}

      {tab === 'ADS' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">Publicités sponsorisées (MaishaPay)</h2>
              <p className="text-xs text-slate-400">Campagnes vidéo et bannières catalogue diffusées dans l’espace client.</p>
            </div>
            <button type="button" onClick={() => setShowAdModal(true)} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950">
              + Nouvelle campagne
            </button>
          </div>
          {ads.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-xs text-slate-400">Aucune publicité enregistrée.</p>}
          {ads.map((ad) => (
            <div key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs">
              <div>
                <strong className="text-sm">{ad.title}</strong>
                <p className="mt-1 text-slate-400">{ad.advertiserName} · {ad.format} · {money(ad.pricePaidCdf)} · {ad.impressionsCount} vues / {ad.clicksCount} clics</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 font-bold ${ad.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{ad.status}</span>
                {onToggleAdStatus && (
                  <button
                    type="button"
                    onClick={() => onToggleAdStatus(ad.id, ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold hover:bg-slate-800"
                  >
                    {ad.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'LEGAL' && (
        <div role="tabpanel" id="registre-conformite" className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Scale size={17} /> Registre des contrôles applicatifs</h2>
            <button type="button" onClick={() => setShowCompliance(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Voir le certificat conformité RDC</button>
          </div>
          <p className="text-xs text-slate-400">Ce registre présente les contrôles du produit. Les décisions juridiques et la conformité réglementaire demandent une revue humaine.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {['Prix enregistrés en CDF', 'Dépôt de bail plafonné dans le formulaire', 'Documents privés et contrôle d’accès', 'Rapport physique et GPS avant publication', 'Vidéo revue avant publication', 'Badge vérifié avec durée de 90 jours', 'Paiement du séjour déclaré puis confirmé par l’hôte', 'Traçabilité des actions administratives'].map((label) => (
              <p key={label} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs">{label}</p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-800 pt-5">
        <h2 className="text-sm font-bold">Toutes les opérations</h2>
        <p className="text-xs text-slate-400">Chaque rubrique reste accessible même sans dossier ou service actif.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['validations', 'Annonces et pièces', `${listings.length} logement(s)`],
            ['missions-admin', 'Missions et dispatch', `${missions.length} mission(s)`],
            ['revue-videos', 'Revue des vidéos', 'Contrôle avant publication'],
            ['comptes', 'Comptes partenaires et agents', `${users.length} compte(s)`],
            ['changement-partenaire', 'Changement de partenaire', 'Transfert avec révocation des validations'],
            ['reinspection', 'Réinspection', `${listings.filter((item) => item.status === 'SUSPENDED').length} annonce(s) suspendue(s)`],
            ['reservations', 'Séjours', `${counts.bookings} réservation(s)`],
            ['remboursements', 'Remboursements', 'Suivi des remboursements directs'],
            ['preuves-reservations', 'Preuves des réservations', 'Pièces des séjours'],
            ['visites', 'Visites', `${counts.viewings} demande(s)`],
            ['dossiers', 'Candidatures et baux', `${counts.applications} dossier(s)`],
            ['preuves-baux', 'Preuves des baux', 'Contrôle des baux signés'],
            ['assistance', 'Tickets et alertes', `${openTickets.length} ticket(s) ouvert(s)`],
            ['commissions', 'Commissions', `${counts.invoices} facture(s)`],
            ['notifications', 'Notifications', `${counts.notifications} notification(s)`],
          ].map(([id, label, detail]) => (
            <button key={id} type="button" onClick={() => onOpenSection(id)} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:border-indigo-500/50">
              <strong className="block text-xs">{label}</strong>
              <span className="mt-1 block text-[11px] text-slate-400">{detail}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} /> Les données du compte sont actualisées après chaque action.</p>

      {showAdModal && (
        <CreateSponsoredAdModal
          onClose={() => setShowAdModal(false)}
          onAdCreated={(ad) => {
            onCreateAd?.(ad);
            setShowAdModal(false);
          }}
        />
      )}
      {showCompliance && <ComplianceBadgeModal onClose={() => setShowCompliance(false)} />}
    </section>
  );
}
