/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Eye, 
  Droplets, 
  Zap, 
  Wind, 
  Wifi, 
  Car, 
  Shield, 
  User, 
  ChevronRight,
  Maximize2,
  CheckCircle,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { PropertyListing } from '../../types';

interface ListingDetailModalProps {
  listing: PropertyListing | null;
  onClose: () => void;
  onOpenBooking: (listing: PropertyListing) => void;
  onOpenViewing: (listing: PropertyListing) => void;
  onOpenVerification: (listing: PropertyListing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onOpenBooking,
  onOpenViewing,
  onOpenVerification,
}) => {
  if (!listing) return null;

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl text-white max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white line-clamp-1 max-w-md">
              {listing.title}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {listing.rentalMode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Main Gallery */}
          <div className="space-y-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={listing.media.photos[selectedPhotoIndex] || listing.media.videoThumbnail}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onOpenVerification(listing)}
                className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/40 text-emerald-300 backdrop-blur-md text-xs font-semibold hover:bg-black/80 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Vérifié par NZUBU ({listing.verification.verifiedAt})</span>
              </button>
            </div>

            {/* Thumbnail selector */}
            {listing.media.photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {listing.media.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedPhotoIndex === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Essential Specs */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {formatCDF(listing.pricing.amountCdf)} CDF
                <span className="text-sm font-medium text-slate-400 ml-1">
                  / {listing.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {listing.pricing.serviceChargesIncluded 
                  ? 'Charges incluses (eau, électricité déclarée)' 
                  : listing.pricing.serviceChargesDetail}
              </div>
            </div>

            {listing.rentalMode === 'SHORT_STAY' ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking(listing);
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Demander à réserver (20% avance)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenViewing(listing);
                }}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Demander une visite gratuite</span>
              </button>
            )}
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[11px]">Chambres</span>
              <span className="font-bold text-white text-sm">{listing.bedroomsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[11px]">Salles de bain</span>
              <span className="font-bold text-white text-sm">{listing.bathroomsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[11px]">Mobilier</span>
              <span className="font-bold text-white text-sm">
                {listing.furnishingStatus === 'FURNISHED' ? 'Meublé' : 'Non-meublé'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[11px]">Capacité max</span>
              <span className="font-bold text-white text-sm">{listing.maxOccupants} pers.</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description du logement
            </h4>
            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Observed Utilities (Brief §8.3 & §9.2) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Équipements et réseaux contrôlés sur place
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                <Droplets className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Approvisionnement en eau :</strong>
                  <span className="text-slate-300 text-[11px]">
                    {listing.utilities.water.notes}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Électricité & Groupe de secours :</strong>
                  <span className="text-slate-300 text-[11px]">
                    {listing.utilities.electricity.notes}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                <Wind className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Climatisation :</strong>
                  <span className="text-slate-300 text-[11px]">
                    {listing.utilities.ac ? 'Climatisation fonctionnelle inspectée' : 'Ventilation naturelle'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                <Wifi className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Connexion Internet :</strong>
                  <span className="text-slate-300 text-[11px]">
                    {listing.utilities.wifi ? 'Fibre optique / Wi-Fi disponible' : 'Non fourni'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Localisation & Landmark */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Localisation et repères d'accès (Kinshasa)</span>
            </h4>
            <div className="text-xs text-white">
              <span className="font-bold">{listing.commune}</span> · Quartier {listing.quartier}
            </div>
            <p className="text-xs text-slate-300">
              <strong>Repère local :</strong> {listing.landmark}
            </p>
            <p className="text-[11px] text-slate-400">
              Note de sécurité : L'adresse exacte et le numéro de parcelle sont confidentiels et ne sont partagés qu'après confirmation de la réservation ou du créneau de visite.
            </p>
          </div>

          {/* Partner & Mandate Info */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{listing.partner.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                    {listing.partner.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Taux de réponse : {listing.partner.responseRatePercent}% · Note : ★ {listing.partner.rating}
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenVerification(listing)}
              className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Vérification</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Total</span>
            <span className="text-lg font-bold text-white tabular-nums">
              {formatCDF(listing.pricing.amountCdf)} CDF
              <span className="text-xs text-slate-400 font-normal"> / {listing.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}</span>
            </span>
          </div>

          {listing.rentalMode === 'SHORT_STAY' ? (
            <button
              onClick={() => {
                onClose();
                onOpenBooking(listing);
              }}
              className="py-2.5 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Réserver (20% avance à l'hôte)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenViewing(listing);
              }}
              className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Demander une visite gratuite</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
