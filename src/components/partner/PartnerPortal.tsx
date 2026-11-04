/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Phone,
  UserCheck,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { PropertyListing, BookingRequest } from '../../types';
import { AddListingModal } from './AddListingModal';

interface PartnerPortalProps {
  listings: PropertyListing[];
  bookings: BookingRequest[];
  onAddListing: (listing: Partial<PropertyListing>) => void;
  onAcceptBooking: (bookingId: string) => void;
  onConfirmHostPayment: (bookingId: string) => void;
  onToggleAvailability: (listingId: string) => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({
  listings,
  bookings,
  onAddListing,
  onAcceptBooking,
  onConfirmHostPayment,
  onToggleAvailability,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'BOOKINGS' | 'INVOICES'>('BOOKINGS');

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  // Calculate estimated stats
  const totalRevenueCdf = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.totalPriceCdf, 0);

  // 10% commission due to NZUBU on confirmed stays per brief §3.1
  const commissionDueCdf = Math.round(totalRevenueCdf * 0.10);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Espace Bailleur & Hôte
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                Partenaire Certifié
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Tableau de bord de vos logements à Kinshasa
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gérez vos disponibilités, validez les demandes de séjour et suivez vos encaissements directs.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer un nouveau logement</span>
          </button>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block">Biens vérifiés</span>
            <div className="text-2xl font-black text-white tabular-nums">
              {listings.length}
            </div>
            <span className="text-[10px] text-emerald-400">
              Badge actif 90 jours
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block">Demandes séjours</span>
            <div className="text-2xl font-black text-white tabular-nums">
              {bookings.length}
            </div>
            <span className="text-[10px] text-amber-300">
              {bookings.filter(b => b.status === 'HOST_ACCEPTED_TERMS' || b.status === 'PAYMENT_DECLARED').length} en attente
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block">Chiffre d'affaires séjour</span>
            <div className="text-xl font-black text-rose-400 tabular-nums">
              {formatCDF(totalRevenueCdf)} CDF
            </div>
            <span className="text-[10px] text-slate-400">
              Payé directement à vous
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block">Commission NZUBU (10%)</span>
            <div className="text-xl font-black text-slate-300 tabular-nums">
              {formatCDF(commissionDueCdf)} CDF
            </div>
            <span className="text-[10px] text-slate-400">
              Facturée post-séjour
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs">
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'BOOKINGS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Demandes & Séjours ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LISTINGS')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'LISTINGS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Mes Logements ({listings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'INVOICES'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Facturation Commissions</span>
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'BOOKINGS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Demandes de séjour à traiter</span>
              <span className="text-xs text-slate-400 font-normal">
                Règle : Vous encaissez directement l'avance de 20% et le solde de 80%
              </span>
            </h3>

            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Aucune réservation enregistrée pour l'instant.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {booking.id}
                          </span>
                          <span className="text-xs font-bold text-white">
                            Voyageur : {booking.guestName}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200 mt-1">
                          {booking.listingTitle} ({booking.commune})
                        </h4>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>Du {booking.checkInDate} au {booking.checkOutDate}</span>
                          <span>·</span>
                          <span className="text-white font-semibold">{booking.nightsCount} nuits</span>
                          <span>·</span>
                          <span>{booking.adultsCount} voyageur(s)</span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {booking.status === 'CONFIRMED' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmé · Avance reçue</span>
                          </span>
                        )}
                        {booking.status === 'HOST_ACCEPTED_TERMS' && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>Dates bloquées (30 min) · En attente paiement</span>
                          </span>
                        )}
                        {booking.status === 'PAYMENT_DECLARED' && (
                          <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Règlement déclaré par le client</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Prix total séjour</span>
                        <span className="text-sm font-bold text-white font-mono mt-0.5">
                          {formatCDF(booking.totalPriceCdf)} CDF
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
                        <span className="block font-bold text-[11px]">Avance 20% due à vous</span>
                        <span className="text-sm font-bold font-mono mt-0.5">
                          {formatCDF(booking.advanceAmountCdf)} CDF
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Solde 80% à l'arrivée</span>
                        <span className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                          {formatCDF(booking.balanceDueArrivalCdf)} CDF
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Téléphone client : <strong className="text-white font-mono">{booking.guestPhone}</strong></span>
                      </div>

                      {booking.status === 'REQUESTED' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onAcceptBooking(booking.id)}
                            className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepter (bloquer les dates 30 min)</span>
                          </button>
                        </div>
                      )}

                      {(booking.status === 'HOST_ACCEPTED_TERMS' || booking.status === 'PAYMENT_DECLARED') && (
                        <div className="flex items-center gap-2">
                          {booking.paymentReference && (
                            <span className="text-xs text-sky-300 font-mono">
                              Réf. reçue : {booking.paymentReference}
                            </span>
                          )}
                          <button
                            onClick={() => onConfirmHostPayment(booking.id)}
                            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmer la réception de l'avance (20%)</span>
                          </button>
                        </div>
                      )}

                      {booking.status === 'CONFIRMED' && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Dossier complet. Commission NZUBU 10% ({formatCDF(Math.round(booking.totalPriceCdf * 0.1))} CDF) calculée après le séjour.</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Listings */}
        {activeTab === 'LISTINGS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Vos annonces publiées et vérifiées
              </h3>
              <span className="text-xs text-slate-400">
                Périmètre pilote : Gombe, Ngaliema, Lingwala
              </span>
            </div>

            <div className="space-y-3">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.media.videoThumbnail}
                      alt={item.title}
                      className="w-20 h-16 rounded-xl object-cover bg-slate-950 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {item.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                          Vérifié 90j
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {item.commune} · {item.quartier} · {item.rentalMode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}
                      </div>
                      <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                        {formatCDF(item.pricing.amountCdf)} CDF / {item.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleAvailability(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        item.availabilityStatus === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                    >
                      {item.availabilityStatus === 'AVAILABLE' ? 'Disponible (Actif)' : 'Indisponible (Bloqué)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Commission Invoices */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Règles de rémunération NZUBU (Brief §3.1)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pour la courte durée, NZUBU facture une commission de 10% du prix d'hébergement effectivement réalisé. Cette commission vous est facturée périodiquement après réalisation du séjour. Pour les baux longue durée, les honoraires d'agence correspondent à 1 mois de loyer selon l'article 10 de la Loi 15/025.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">Facture estimée du mois en cours</span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {formatCDF(commissionDueCdf)} CDF
                </span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Base taxable (Séjours confirmés) :</span>
                <span className="font-mono text-white">{formatCDF(totalRevenueCdf)} CDF</span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Taux contractuel hôte :</span>
                <span className="font-mono text-white">10 %</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                Paiement de la facture à adresser au compte professionnel NZUBU Sarl (Vodacom M-Pesa Marchand / Rawbank Kinshasa).
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      {showAddModal && (
        <AddListingModal
          onClose={() => setShowAddModal(false)}
          onSubmit={onAddListing}
        />
      )}
    </div>
  );
};
