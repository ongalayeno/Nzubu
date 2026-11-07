/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Eye, 
  Heart, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Send,
  FileDown
} from 'lucide-react';
import { BookingRequest, ViewingRequest, PropertyListing } from '../../types';
import { ProgressStepper, StepItem } from '../common/ProgressStepper';
import { exportReceiptPdf } from '../../utils/exportReceiptPdf';

interface ClientRequestsViewProps {
  bookings: BookingRequest[];
  viewings: ViewingRequest[];
  favorites: PropertyListing[];
  onDeclarePayment: (bookingId: string, reference: string) => void;
  onOpenDetails: (listing: PropertyListing) => void;
}

export const ClientRequestsView: React.FC<ClientRequestsViewProps> = ({
  bookings,
  viewings,
  favorites,
  onDeclarePayment,
  onOpenDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'VIEWINGS' | 'FAVORITES'>('BOOKINGS');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<BookingRequest | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [exportingReceiptId, setExportingReceiptId] = useState<string | null>(null);

  const handleExportReceipt = async (booking: BookingRequest) => {
    setExportingReceiptId(booking.id);
    try {
      await exportReceiptPdf(booking);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du reçu PDF.");
    } finally {
      setExportingReceiptId(null);
    }
  };

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const handleDeclareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment || !paymentRefInput.trim()) return;
    onDeclarePayment(selectedBookingForPayment.id, paymentRefInput.trim());
    setSelectedBookingForPayment(null);
    setPaymentRefInput('');
  };

  const getBookingSteps = (b: BookingRequest): StepItem[] => [
    {
      id: 'step-req',
      label: 'Demande émise',
      subLabel: b.createdAt,
      isCompleted: true,
      isCurrent: b.status === 'REQUESTED',
    },
    {
      id: 'step-host',
      label: 'Accord de l’hôte',
      subLabel: b.status === 'REQUESTED' ? 'En attente' : 'Validé',
      isCompleted: b.status !== 'REQUESTED',
      isCurrent: b.status === 'HOST_ACCEPTED_TERMS',
    },
    {
      id: 'step-pay',
      label: 'Avance 20%',
      subLabel: b.status === 'PAYMENT_DECLARED' ? 'Vérification' : 'M-Pesa / Airtel',
      isCompleted: b.status === 'CONFIRMED' || b.status === 'COMPLETED',
      isCurrent: b.status === 'HOST_ACCEPTED_TERMS' || b.status === 'PAYMENT_DECLARED',
    },
    {
      id: 'step-confirm',
      label: 'Séjour Confirmé',
      subLabel: 'Accueil & Clés',
      isCompleted: b.status === 'CONFIRMED' || b.status === 'COMPLETED',
      isCurrent: false,
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Mes Demandes & Dossiers Immobiliers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Suivi en temps réel de vos demandes de séjour courte durée et visites de baux résidentiels.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'BOOKINGS'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Réservations Séjours ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('VIEWINGS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'VIEWINGS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Demandes de Visites ({viewings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FAVORITES')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'FAVORITES'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favoris ({favorites.length})</span>
          </button>
        </div>

        {/* Content Tab: Bookings */}
        {activeTab === 'BOOKINGS' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Vous n'avez aucune demande de réservation courte durée en cours.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Réf. {booking.id} · {booking.commune}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {booking.listingTitle}
                      </h4>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Du {booking.checkInDate} au {booking.checkOutDate}</span>
                        <span>·</span>
                        <span className="font-semibold text-white">{booking.nightsCount} nuits</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {booking.status === 'CONFIRMED' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Séjour Confirmé</span>
                        </span>
                      )}
                      {booking.status === 'HOST_ACCEPTED_TERMS' && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Accepté par l'hôte · En attente avance 20%</span>
                        </span>
                      )}
                      {booking.status === 'PAYMENT_DECLARED' && (
                        <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Paiement déclaré · Vérification hôte</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Stepper for booking lifecycle */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <ProgressStepper steps={getBookingSteps(booking)} accentColor="rose" />
                  </div>

                  {/* Financial & Hold details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Prix total du séjour</span>
                      <span className="text-sm font-bold text-white font-mono mt-0.5">
                        {formatCDF(booking.totalPriceCdf)} CDF
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
                      <span className="text-[11px] text-rose-300 block font-bold">Avance de 20% à l'hôte</span>
                      <span className="text-sm font-bold font-mono mt-0.5">
                        {formatCDF(booking.advanceAmountCdf)} CDF
                      </span>
                      <span className="text-[10px] block mt-0.5 text-rose-300/70">
                        Canal : {booking.paymentMethod || 'Mobile Money'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Solde à payer à l'arrivée (80%)</span>
                      <span className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                        {formatCDF(booking.balanceDueArrivalCdf)} CDF
                      </span>
                    </div>
                  </div>

                  {/* Context actions */}
                  {booking.status === 'HOST_ACCEPTED_TERMS' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-amber-300 block">
                          Dates temporairement bloquées (30 minutes)
                        </strong>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Veuillez régler l'avance de 20% ({formatCDF(booking.advanceAmountCdf)} CDF) directement au numéro de l'hôte : <strong className="text-white font-mono">{booking.hostPhone || '+243 81 555 4949'}</strong> (M-Pesa / Airtel Money).
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedBookingForPayment(booking)}
                        className="py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Déclarer la référence de paiement</span>
                      </button>
                    </div>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-emerald-300 block">
                          Réservation validée · Instructions d'accueil
                        </strong>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Référence paiement enregistrée : <span className="font-mono text-emerald-400">{booking.paymentReference}</span>. L'hôte vous attendra pour la remise des clés et le règlement du solde de 80%.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportReceipt(booking)}
                          disabled={exportingReceiptId === booking.id}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{exportingReceiptId === booking.id ? 'Génération...' : 'Reçu MaishaPay (PDF)'}</span>
                        </button>

                        <a
                          href={`tel:${booking.hostPhone}`}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Appeler l'hôte</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Content Tab: Viewings */}
        {activeTab === 'VIEWINGS' && (
          <div className="space-y-3">
            {viewings.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Aucune demande de visite enregistrée.
              </div>
            ) : (
              viewings.map((viewing) => (
                <div
                  key={viewing.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Réf. {viewing.id} · {viewing.commune}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {viewing.listingTitle}
                      </h4>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{viewing.meetingPoint}</span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      viewing.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {viewing.status === 'CONFIRMED' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Visite Confirmée</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Créneaux en cours de validation</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Créneaux proposés</span>
                      <ul className="mt-1 space-y-1 font-mono text-white text-[11px]">
                        {viewing.slots.map((s, idx) => (
                          <li key={idx} className={viewing.chosenSlot === s ? 'text-amber-400 font-bold' : ''}>
                            • {s} {viewing.chosenSlot === s ? '(Confirmé)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Agent NZUBU accompagnateur</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">
                        {viewing.agentAssignedName || 'Attribution en cours (Gombe/Ngaliema)'}
                      </span>
                      <span className="text-[10px] text-emerald-400 block mt-1">
                        Accompagnement gratuit · Aucun pourboire ou frais exigé
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content Tab: Favorites */}
        {activeTab === 'FAVORITES' && (
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Aucun favori enregistré. Cliquez sur le cœur dans le feed vidéo pour enregistrer vos logements préférés.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => onOpenDetails(fav)}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex gap-3 shadow-md"
                  >
                    <img
                      src={fav.media.videoThumbnail}
                      alt={fav.title}
                      className="w-24 h-20 rounded-xl object-cover bg-slate-950 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {fav.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {fav.commune} · {fav.quartier}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-rose-400 tabular-nums">
                        {formatCDF(fav.pricing.amountCdf)} CDF
                        <span className="text-[10px] text-slate-400 font-normal"> / {fav.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Reference Input Modal */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Déclarer le règlement de l'avance (20%)
              </h3>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Veuillez saisir le code de transaction ou référence SMS reçu après votre paiement direct à l'hôte ({formatCDF(selectedBookingForPayment.advanceAmountCdf)} CDF sur Vodacom M-Pesa ou Airtel Money).
            </p>

            <form onSubmit={handleDeclareSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Référence de la transaction
                </label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="Ex : MP-261104-984210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPayment(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmer la référence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
