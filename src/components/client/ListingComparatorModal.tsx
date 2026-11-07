/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, Droplets, Zap, ShieldCheck, Scale, ArrowRight, Calendar, Eye } from 'lucide-react';
import { PropertyListing } from '../../types';

interface ListingComparatorModalProps {
  listings: PropertyListing[];
  onClose: () => void;
  onOpenBooking: (listing: PropertyListing) => void;
  onOpenViewing: (listing: PropertyListing) => void;
  onRemoveFromCompare: (listingId: string) => void;
}

export const ListingComparatorModal: React.FC<ListingComparatorModalProps> = ({
  listings,
  onClose,
  onOpenBooking,
  onOpenViewing,
  onRemoveFromCompare,
}) => {
  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num) + ' CDF';

  if (listings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Comparateur Express NZUBU ({listings.length} logements)
              </h3>
              <p className="text-xs text-slate-400">
                Comparez les loyers en CDF, les garanties locatives et la résilience eau/électricité.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Table Content */}
        <div className="flex-1 overflow-x-auto p-4 sm:p-6 space-y-4">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 text-slate-400 font-bold uppercase tracking-wider text-[11px] w-44">
                  Critères Vérifiés
                </th>
                {listings.map((item) => (
                  <th key={item.id} className="p-3 min-w-[200px] align-top">
                    <div className="relative space-y-2">
                      <button
                        onClick={() => onRemoveFromCompare(item.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center text-xs"
                        title="Retirer du comparateur"
                      >
                        ✕
                      </button>
                      <img
                        src={item.media.videoThumbnail}
                        alt={item.title}
                        className="w-full h-24 object-cover rounded-xl border border-slate-800"
                      />
                      <h4 className="font-bold text-white text-xs line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.commune} · {item.quartier}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Loyer en CDF */}
              <tr>
                <td className="p-3 font-semibold text-slate-300">Loyer officiel (CDF)</td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3 font-mono font-bold text-emerald-400 text-sm">
                    {formatCDF(l.pricing.amountCdf)}
                    <span className="text-[10px] text-slate-400 block font-sans font-normal">
                      / {l.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Plafond de caution */}
              <tr>
                <td className="p-3 font-semibold text-slate-300">
                  Garantie locative (Loi 15/025)
                </td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3">
                    <span className="font-semibold text-white">
                      {l.rentalMode === 'SHORT_STAY' ? 'Avance 20% (MaishaPay)' : 'Plafonnée à 3 mois max'}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">
                      {l.rentalMode === 'SHORT_STAY' ? `${formatCDF(Math.round(l.pricing.amountCdf * 0.2))} avance` : `${formatCDF(l.pricing.amountCdf * 3)} caution`}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Alimentation en Eau */}
              <tr>
                <td className="p-3 font-semibold text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Alimentation Eau</span>
                </td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3">
                    <div className="font-bold text-white flex items-center gap-1">
                      {l.utilities.water.testedWorking ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-amber-400">Cuve</span>
                      )}
                      <span>{l.utilities.water.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {l.utilities.water.notes}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Alimentation Électrique */}
              <tr>
                <td className="p-3 font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Secours Électricité</span>
                </td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3">
                    <div className="font-bold text-white flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{l.utilities.electricity.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {l.utilities.electricity.notes}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Pièces et capacité */}
              <tr>
                <td className="p-3 font-semibold text-slate-300">Chambres & SDB</td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3 font-semibold text-slate-200">
                    {l.bedroomsCount} ch. · {l.bathroomsCount} SDB · max {l.maxOccupants} pers.
                  </td>
                ))}
              </tr>

              {/* Actions row */}
              <tr>
                <td className="p-3 font-bold text-slate-400">Passer à l'action</td>
                {listings.map((l) => (
                  <td key={l.id} className="p-3">
                    {l.rentalMode === 'SHORT_STAY' ? (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenBooking(l);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-500/20"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Réserver (20%)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenViewing(l);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Planifier Visite</span>
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
