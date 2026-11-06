import React, { useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, Clock3, FileText, Plus, ShieldCheck } from 'lucide-react';

export type PartnerListing = { id: string; title: string; commune: string; rental_mode: 'SHORT_STAY' | 'LONG_TERM'; price_cdf: number; status?: string; verified_until?: string; data?: { neighborhood?: string } };
export type PartnerBooking = { id: string; listing_id: string; check_in: string; check_out: string; status: string; price_cdf: number; advance_cdf?: number; occupants?: number; hold_expires_at?: string; payment_reference?: string; guest_email?: string | null; guest_phone?: string | null };
export type PartnerInvoice = { id: string; amount_cdf: number; status: string; booking_id: string };

type Props = {
  listings: PartnerListing[];
  bookings: PartnerBooking[];
  invoices: PartnerInvoice[];
  onAccept: (id: string) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenListing: (id: string) => void;
  onNewListing: () => void;
  onOpenSection: (id: string) => void;
  counts: { blocks: number; viewings: number; applications: number; refunds: number; tickets: number; notifications: number };
};

const money = (value: number) => `${Number(value || 0).toLocaleString('fr-CD')} CDF`;
const day = (value: string) => value?.slice(0, 10);
const nights = (booking: PartnerBooking) => Math.max(0, Math.round((Date.parse(day(booking.check_out)) - Date.parse(day(booking.check_in))) / 86400000));

export function LivePartnerDashboard({ listings, bookings, invoices, onAccept, onConfirm, onCancel, onOpenListing, onNewListing, onOpenSection, counts }: Props) {
  const [tab, setTab] = useState<'BOOKINGS' | 'LISTINGS' | 'INVOICES'>('BOOKINGS');
  const verified = listings.filter((listing) => listing.status === 'PUBLISHED' && (!listing.verified_until || day(listing.verified_until) >= new Date().toISOString().slice(0, 10))).length;
  const revenue = bookings.filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status)).reduce((sum, booking) => sum + Number(booking.price_cdf), 0);
  const pending = bookings.filter((booking) => ['REQUESTED', 'HOST_ACCEPTED_TERMS', 'PAYMENT_DECLARED'].includes(booking.status)).length;

  return <section className="space-y-6" aria-label="Tableau de bord bailleur et hôte">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-amber-400">Espace bailleur & hôte</span><span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Compte partenaire</span></div>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Tableau de bord de vos logements à Kinshasa</h1>
        <p className="mt-1 text-sm text-slate-400">Gérez vos disponibilités, validez les demandes de séjour et suivez vos encaissements directs.</p></div>
      <button type="button" onClick={onNewListing} className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400"><Plus size={17} /> Déposer un nouveau logement</button>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Biens vérifiés', value: String(verified), note: `${listings.length} logement(s) au total`, color: 'text-white' },
        { label: 'Demandes séjours', value: String(bookings.length), note: `${pending} à traiter`, color: 'text-white' },
        { label: 'Valeur des séjours confirmés', value: money(revenue), note: 'Avance et solde à encaisser directement', color: 'text-rose-400' },
        { label: 'Commission NZUBU (10%)', value: money(invoices.reduce((sum, invoice) => sum + Number(invoice.amount_cdf), 0)), note: 'Facturée après séjour', color: 'text-slate-200' },
      ].map((metric) => <div key={metric.label} className="min-h-32 rounded-2xl border border-slate-800 bg-slate-900 p-4"><span className="block text-xs text-slate-400">{metric.label}</span><strong className={`mt-2 block text-xl font-black tabular-nums sm:text-2xl ${metric.color}`}>{metric.value}</strong><span className="mt-2 block text-xs text-slate-400">{metric.note}</span></div>)}
    </div>

    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs sm:text-sm" role="tablist" aria-label="Gestion du compte partenaire">
      {([['BOOKINGS', CalendarDays, `Demandes & Séjours (${bookings.length})`], ['LISTINGS', Building2, `Mes Logements (${listings.length})`], ['INVOICES', FileText, 'Facturation Commissions']] as const).map(([key, Icon, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-semibold ${tab === key ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}><Icon size={16} />{label}</button>)}
    </div>

    {tab === 'BOOKINGS' && <div role="tabpanel" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Demandes de séjour à traiter</h2><p className="text-xs text-slate-400">Vous encaissez directement l’avance de 20 % et le solde de 80 %.</p></div>
      {bookings.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucune demande de séjour pour le moment.</p>}
      {bookings.map((booking) => { const listing = listings.find((item) => item.id === booking.listing_id); const advance = Number(booking.advance_cdf ?? Math.round(Number(booking.price_cdf) * .2)); const expired = ['HOST_ACCEPTED_TERMS', 'PAYMENT_DECLARED'].includes(booking.status) && !!booking.hold_expires_at && Date.parse(booking.hold_expires_at) <= Date.now();
        const status = expired ? 'Délai de paiement expiré' : ({ REQUESTED: 'Nouvelle demande', HOST_ACCEPTED_TERMS: 'Dates bloquées · En attente du paiement', PAYMENT_DECLARED: 'Paiement déclaré · À vérifier', CONFIRMED: 'Confirmé · Avance reçue', COMPLETED: 'Séjour terminé', CANCELLED: 'Annulé' } as Record<string, string>)[booking.status] || booking.status;
        return <article key={booking.id} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4"><div><p className="text-xs font-bold text-slate-400"><span className="font-mono">{booking.id.slice(0, 8)}</span><span className="ml-2 text-white">Voyageur : {booking.guest_email || booking.guest_phone || 'Compte client'}</span></p><h3 className="mt-2 font-semibold text-white">{listing?.title || 'Logement'} — {listing?.commune || 'Kinshasa'}</h3><p className="mt-1 text-xs text-slate-400">Du {day(booking.check_in)} au {day(booking.check_out)} · <strong className="text-white">{nights(booking)} nuits</strong> · {booking.occupants || 1} voyageur(s)</p></div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' : 'border-amber-500/30 bg-amber-500/20 text-amber-300'}`}>{booking.status === 'CONFIRMED' ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{status}</span></div>
          <div className="grid gap-3 text-xs sm:grid-cols-3"><div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"><span className="block text-slate-400">Prix total séjour</span><strong className="font-mono text-sm text-white">{money(booking.price_cdf)}</strong></div><div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200"><span className="block font-bold">Avance 20 % due à vous</span><strong className="font-mono text-sm">{money(advance)}</strong></div><div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"><span className="block text-slate-400">Solde 80 % à l’arrivée</span><strong className="font-mono text-sm text-white">{money(Number(booking.price_cdf) - advance)}</strong></div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs"><span className="text-slate-400">Contact client : <strong className="text-white">{booking.guest_phone || booking.guest_email || 'Non renseigné'}</strong></span><div className="flex flex-wrap items-center gap-3">{booking.payment_reference && <span className="text-sky-300">Réf. déclarée : {booking.payment_reference}</span>}{booking.status === 'REQUESTED' && <button type="button" onClick={() => onAccept(booking.id)} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">Accepter · Bloquer 30 min</button>}{booking.status === 'PAYMENT_DECLARED' && !expired && <button type="button" onClick={() => onConfirm(booking.id)} className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400">Confirmer la réception de l’avance</button>}{booking.status === 'CONFIRMED' && <span className="flex items-center gap-1 font-semibold text-emerald-400"><CheckCircle2 size={15} />Dossier confirmé · commission calculée après le séjour</span>}{!['CANCELLED', 'COMPLETED'].includes(booking.status) && <button type="button" onClick={() => onCancel(booking.id)} className="text-rose-300 underline hover:text-rose-200">Annuler la réservation</button>}</div></div>
        </article>; })}</div>}

    {tab === 'LISTINGS' && <div role="tabpanel" className="space-y-3"><h2 className="font-bold">Vos logements</h2>{listings.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucun logement déposé.</p>}{listings.map((listing) => <article key={listing.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{listing.title}</h3><span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{({ PUBLISHED: 'Publié', PENDING_DOCUMENTS: 'Pièces à fournir', PENDING_INSPECTION: 'Inspection à venir', PENDING_APPROVAL: 'Validation en attente', SUSPENDED: 'Suspendu' } as Record<string, string>)[listing.status || ''] || listing.status}</span></div><p className="mt-1 text-xs text-slate-400">{listing.commune}{listing.data?.neighborhood ? ` · ${listing.data.neighborhood}` : ''} · {listing.rental_mode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}</p><p className="mt-1 font-mono text-xs font-bold text-amber-400">{money(listing.price_cdf)} / {listing.rental_mode === 'SHORT_STAY' ? 'nuit' : 'mois'}</p></div><button type="button" onClick={() => onOpenListing(listing.id)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">Gérer le logement</button></article>)}</div>}

    {tab === 'INVOICES' && <div role="tabpanel" className="space-y-3"><h2 className="font-bold">Commissions facturées</h2><p className="text-xs text-slate-400">La commission de 10 % est facturée après le séjour réalisé. Le paiement du séjour vous est versé directement.</p><a className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-sky-300 hover:bg-slate-800" href="/v1/invoices/export.csv" download="nzubu-commissions.csv">Télécharger le suivi CSV</a>{invoices.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucune commission facturée à ce jour.</p>}{invoices.map((invoice) => <article key={invoice.id} className="flex flex-wrap justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm"><span>Facture {invoice.id.slice(0, 8)} · Séjour {invoice.booking_id.slice(0, 8)}</span><strong>{money(invoice.amount_cdf)} · {invoice.status}</strong></article>)}<p className="text-xs text-slate-500">Export de suivi interne ; la facture officielle reste à valider par la direction et la comptabilité.</p></div>}
    <div className="space-y-3 border-t border-slate-800 pt-5"><h2 className="font-bold">Tous les outils de votre compte</h2><p className="text-xs text-slate-400">Chaque espace reste accessible même sans logement, dossier ou service activé.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
      ['nouveau-logement', 'Déposer un logement', 'Créer une annonce et suivre sa validation'],
      ['mes-logements', 'Pièces et vérification', `${listings.filter((item) => item.status !== 'PUBLISHED').length} logement(s) à suivre`],
      ['videos', 'Vidéos', 'Envoi et état de revue des vidéos'],
      ['disponibilites', 'Disponibilités', `${counts.blocks} période(s) bloquée(s)`],
      ['visites', 'Visites', `${counts.viewings} demande(s) de visite`],
      ['dossiers', 'Candidatures et baux', `${counts.applications} dossier(s) de bail`],
      ['remboursements', 'Remboursements', `${counts.refunds} remboursement(s) à suivre`],
      ['preuves-reservations', 'Preuves de séjour', `${bookings.length} dossier(s) de réservation`],
      ['preuves-baux', 'Preuves de bail', `${counts.applications} dossier(s) de bail`],
      ['assistance', 'Assistance', `${counts.tickets} ticket(s) ouvert(s)`],
      ['notifications', 'Notifications', `${counts.notifications} notification(s)`],
    ].map(([id, label, description]) => <button key={id} type="button" onClick={() => onOpenSection(id)} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-amber-500/50 hover:bg-slate-800"><strong className="block text-sm text-white">{label}</strong><span className="mt-1 block text-xs text-slate-400">{description}</span></button>)}</div></div>
    <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> Données du compte connecté, actualisées après chaque action.</p>
  </section>;
}
