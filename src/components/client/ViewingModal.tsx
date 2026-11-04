/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, MapPin, Eye, CheckCircle2, ShieldCheck, Clock, Info } from 'lucide-react';
import { PropertyListing, ViewingRequest } from '../../types';

interface ViewingModalProps {
  listing: PropertyListing | null;
  onClose: () => void;
  onSubmitViewing: (viewing: Partial<ViewingRequest>) => void;
}

export const ViewingModal: React.FC<ViewingModalProps> = ({
  listing,
  onClose,
  onSubmitViewing,
}) => {
  if (!listing) return null;

  const [clientName, setClientName] = useState('Ir. Serge Mukendi');
  const [clientPhone, setClientPhone] = useState('+243 81 999 1122');
  const [preferredDate1, setPreferredDate1] = useState('2026-11-06 10:00');
  const [preferredDate2, setPreferredDate2] = useState('2026-11-06 14:30');
  const [notes, setNotes] = useState('Recherche pour installation familiale à Kinshasa.');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;

    onSubmitViewing({
      listingId: listing.id,
      listingTitle: listing.title,
      commune: listing.commune,
      clientName,
      clientPhone,
      slots: [preferredDate1, preferredDate2],
      status: 'REQUESTED',
      meetingPoint: `Repère : ${listing.landmark}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Bail Résidentiel · Loi n°15/025
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                Visite Gratuite (0 CDF)
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 line-clamp-1">
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {/* Financial summary */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
            <div className="flex justify-between items-baseline font-bold text-white">
              <span>Loyer mensuel :</span>
              <span className="text-amber-400 text-base font-mono">
                {formatCDF(listing.pricing.amountCdf)} CDF / mois
              </span>
            </div>
            {listing.pricing.securityDepositMonths && (
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Garantie locative (Plafond légal 3 mois) :</span>
                <span className="font-mono text-emerald-300">
                  {listing.pricing.securityDepositMonths} mois ({formatCDF(listing.pricing.amountCdf * listing.pricing.securityDepositMonths)} CDF)
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Honoraires d'agence (Loi 15/025, Art. 10) :</span>
              <span className="font-mono">1 mois de loyer à la conclusion</span>
            </div>
            <div className="flex justify-between text-emerald-400 text-[11px] font-bold pt-1 border-t border-slate-700/40">
              <span>Frais pour demander cette visite :</span>
              <span>0 CDF (Gratuit au pilote)</span>
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Votre nom complet
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Slot 1 & Slot 2 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Proposer 2 créneaux de visite souhaités :
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Créneau prioritaire</span>
                <input
                  type="text"
                  value={preferredDate1}
                  onChange={(e) => setPreferredDate1(e.target.value)}
                  placeholder="Ex: 2026-11-06 10:00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Deuxième choix</span>
                <input
                  type="text"
                  value={preferredDate2}
                  onChange={(e) => setPreferredDate2(e.target.value)}
                  placeholder="Ex: 2026-11-06 14:30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Remarques ou questions particulières
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              placeholder="Ex: Nombre d'occupants, véhicule à garer..."
            />
          </div>

          {/* Legal and Safety Box */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Accompagnement et règles de visite</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Un agent officiel NZUBU sera présent au point de rendez-vous pour vous accompagner. L'adresse exacte et le contact direct vous seront communiqués dès confirmation du créneau par le bailleur. Aucun frais n'est perçu par l'agent sur place.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 accent-amber-500 rounded"
              required
            />
            <span>
              Je confirme avoir pris connaissance du loyer en CDF et des conditions de bail conformément à la Loi n°15/025.
            </span>
          </label>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!acceptTerms}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Demander la planification de la visite (Gratuit)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
