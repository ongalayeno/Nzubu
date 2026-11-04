/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, Phone, Info } from 'lucide-react';
import { PropertyListing, BookingRequest } from '../../types';

interface BookingModalProps {
  listing: PropertyListing | null;
  onClose: () => void;
  onSubmitBooking: (booking: Partial<BookingRequest>) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  listing,
  onClose,
  onSubmitBooking,
}) => {
  if (!listing) return null;

  const [guestName, setGuestName] = useState('Didier Kazadi');
  const [guestPhone, setGuestPhone] = useState('+243 82 450 1234');
  const [checkInDate, setCheckInDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [checkOutDate, setCheckOutDate] = useState(() => new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10));
  const [adultsCount, setAdultsCount] = useState(2);
  const [paymentChannel, setPaymentChannel] = useState<'VODACOM_MPESA' | 'AIRTEL_MONEY' | 'CASH_AT_CHECKIN'>('VODACOM_MPESA');
  const [acceptPolicy, setAcceptPolicy] = useState(true);

  // Calculate nights
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const nightsCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePricePerNight = listing.pricing.amountCdf;
  const accommodationTotal = basePricePerNight * nightsCount;
  const cleaningFee = listing.pricing.cleaningFeeCdf || 0;
  const totalPrice = accommodationTotal + cleaningFee;

  // 20% advance directly to host per brief §3.2
  const advanceAmount = Math.round(accommodationTotal * 0.20);
  const balanceAtArrival = totalPrice - advanceAmount;

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptPolicy) return;

    onSubmitBooking({
      listingId: listing.id,
      listingTitle: listing.title,
      commune: listing.commune,
      guestName,
      guestPhone,
      checkInDate,
      checkOutDate,
      nightsCount,
      adultsCount,
      totalPriceCdf: totalPrice,
      advanceAmountCdf: advanceAmount,
      balanceDueArrivalCdf: balanceAtArrival,
      paymentMethod: paymentChannel,
      status: 'HOST_ACCEPTED_TERMS', // Transitions to terms review with 30-min hold
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      hostPhone: listing.partner.phoneMasked,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl text-white max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Réservation Courte Durée · Kinshasa
            </span>
            <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
              {listing.title}
            </h3>
            <p className="text-xs text-slate-400">
              {listing.commune} · {listing.quartier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {/* Dates selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date d'arrivée
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date de départ
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          {/* Occupants & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Occupants (max {listing.maxOccupants})
              </label>
              <select
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              >
                {Array.from({ length: listing.maxOccupants }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} personne{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Téléphone mobile
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nom complet du voyageur
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Transparent Financial Breakdown (in CDF) */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
            <h4 className="font-bold text-white text-xs border-b border-slate-700/50 pb-1.5 flex items-center justify-between">
              <span>Décomposition financière ({nightsCount} nuit{nightsCount > 1 ? 's' : ''})</span>
              <span className="text-emerald-400 font-mono">100% en Franc Congolais</span>
            </h4>

            <div className="flex justify-between text-slate-300">
              <span>{formatCDF(basePricePerNight)} CDF × {nightsCount} nuits :</span>
              <span className="font-mono">{formatCDF(accommodationTotal)} CDF</span>
            </div>

            {cleaningFee > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Frais de ménage :</span>
                <span className="font-mono">{formatCDF(cleaningFee)} CDF</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700/50 flex justify-between font-bold text-white text-sm">
              <span>Prix total du séjour :</span>
              <span className="font-mono text-rose-400">{formatCDF(totalPrice)} CDF</span>
            </div>

            {/* Split breakdown: 20% advance directly to host, 80% at check-in */}
            <div className="mt-2 pt-2 border-t border-slate-700/30 grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200">
                <span className="block font-bold">Avance 20% à l'hôte :</span>
                <span className="font-mono font-bold text-xs">{formatCDF(advanceAmount)} CDF</span>
                <span className="text-[10px] text-rose-300/80 block mt-0.5">Pour bloquer les dates</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-700/30 border border-slate-700/40 text-slate-300">
                <span className="block font-bold">Solde 80% à l'arrivée :</span>
                <span className="font-mono font-bold text-xs">{formatCDF(balanceAtArrival)} CDF</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Payé directement à l'hôte</span>
              </div>
            </div>
          </div>

          {/* Host Payment Method Selection (Direct Payment to Host, not NZUBU) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Canal de paiement direct accepté par l'hôte :
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentChannel('VODACOM_MPESA')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  paymentChannel === 'VODACOM_MPESA'
                    ? 'bg-rose-500/20 border-rose-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-[11px] text-rose-400">Vodacom</div>
                <div className="text-[10px]">M-Pesa RDC</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChannel('AIRTEL_MONEY')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  paymentChannel === 'AIRTEL_MONEY'
                    ? 'bg-rose-500/20 border-rose-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-[11px] text-red-400">Airtel</div>
                <div className="text-[10px]">Airtel Money</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChannel('CASH_AT_CHECKIN')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  paymentChannel === 'CASH_AT_CHECKIN'
                    ? 'bg-rose-500/20 border-rose-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-[11px] text-emerald-400">Espèces</div>
                <div className="text-[10px]">À l'arrivée</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 flex items-start gap-1 mt-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                NZUBU ne collecte pas le prix du logement. Le paiement s'effectue directement sur le compte de l'hôte après acceptation.
              </span>
            </p>
          </div>

          {/* Cancellation Policy Snapshot */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Conditions d'annulation acceptées :</span>
            <div>• Annulation &gt; 72h avant l'arrivée : Remboursement intégral de l'avance</div>
            <div>• Annulation entre 24h et 72h : Remboursement de 50% de l'avance</div>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={acceptPolicy}
              onChange={(e) => setAcceptPolicy(e.target.checked)}
              className="mt-0.5 accent-rose-500 rounded"
              required
            />
            <span>
              J'accepte les conditions de séjour, le règlement intérieur et le paiement direct de l'avance de {formatCDF(advanceAmount)} CDF à l'hôte.
            </span>
          </label>

          {/* CTA Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!acceptPolicy}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Envoyer la demande (Blocage temporaire 30 min)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
