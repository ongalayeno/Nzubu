/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Filter, 
  Sparkles, 
  Heart, 
  Calendar, 
  Eye, 
  Droplets, 
  Zap,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { PropertyListing, SponsoredAd } from '../../types';
import { isAdActive, getRemainingAdTime } from '../../domain/ads';
import { MessageCircle, Clock, Plus } from 'lucide-react';

interface ExploreGridProps {
  listings: PropertyListing[];
  sponsoredAds?: SponsoredAd[];
  onOpenDetails: (listing: PropertyListing) => void;
  onOpenBooking: (listing: PropertyListing) => void;
  onOpenViewing: (listing: PropertyListing) => void;
  onToggleFavorite: (listingId: string) => void;
  onOpenCreateAd?: () => void;
}

export const ExploreGrid: React.FC<ExploreGridProps> = ({
  listings,
  sponsoredAds = [],
  onOpenDetails,
  onOpenBooking,
  onOpenViewing,
  onToggleFavorite,
  onOpenCreateAd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState<'ALL' | 'SHORT_STAY' | 'LONG_TERM'>('ALL');
  const [selectedFurnishing, setSelectedFurnishing] = useState<'ALL' | 'FURNISHED' | 'UNFURNISHED'>('ALL');
  const [onlyVerifiedWater, setOnlyVerifiedWater] = useState(false);
  const [onlyGenerator, setOnlyGenerator] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState('');

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const filteredListings = listings.filter((item) => {
    if (selectedCommune !== 'ALL' && item.commune.toLowerCase() !== selectedCommune.toLowerCase()) {
      return false;
    }
    if (selectedMode !== 'ALL' && item.rentalMode !== selectedMode) {
      return false;
    }
    if (selectedType !== 'ALL' && item.unitType !== selectedType) return false;
    if (maxPrice && item.pricing.amountCdf > Number(maxPrice)) return false;
    if (selectedFurnishing !== 'ALL' && item.furnishingStatus !== selectedFurnishing) {
      return false;
    }
    if (onlyVerifiedWater && !item.utilities.water.testedWorking) {
      return false;
    }
    if (onlyGenerator && item.utilities.electricity.type !== 'GENERATOR_BACKUP' && item.utilities.electricity.type !== 'SOLAR_HYBRID') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCommune = item.commune.toLowerCase().includes(q);
      const matchQuartier = item.quartier.toLowerCase().includes(q);
      const matchLandmark = item.landmark.toLowerCase().includes(q);
      if (!matchTitle && !matchCommune && !matchQuartier && !matchLandmark) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCommune('ALL');
    setSelectedMode('ALL');
    setSelectedFurnishing('ALL');
    setOnlyVerifiedWater(false);
    setOnlyGenerator(false);
    setSelectedType('ALL');
    setMaxPrice('');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      {/* Search Header */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Explorer les logements vérifiés à Kinshasa
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Recherche par commune, quartier, repère kinois, meublé ou non-meublé, courte ou longue durée.
            </p>
          </div>
          {onOpenCreateAd && (
            <button
              onClick={onOpenCreateAd}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Diffuser une Pub (MaishaPay)</span>
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par commune (Gombe, Ngaliema...), quartier (Ma Campagne, Golf...) ou repère..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1">
            <span className="text-slate-400">Type</span>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-transparent text-white text-xs">
              <option value="ALL">Tous</option>
              <option value="APARTMENT">Appartement</option>
              <option value="VILLA">Villa</option>
              <option value="STUDIO">Studio</option>
              <option value="ROOM">Chambre</option>
              <option value="HOUSE">Maison</option>
            </select>
          </label>
          <label className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1">
            <span className="text-slate-400">Prix max. CDF</span>
            <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Sans limite" className="w-24 bg-transparent text-white text-xs outline-none" />
          </label>
          {/* Communes Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {['ALL', 'Gombe', 'Ngaliema', 'Lingwala'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCommune(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCommune === c
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c === 'ALL' ? 'Toutes communes' : c}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedMode('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedMode === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous modes
            </button>
            <button
              onClick={() => setSelectedMode('SHORT_STAY')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedMode === 'SHORT_STAY' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Courte durée
            </button>
            <button
              onClick={() => setSelectedMode('LONG_TERM')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedMode === 'LONG_TERM' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bail résidentiel
            </button>
          </div>

          {/* Furnishing */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedFurnishing('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFurnishing === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedFurnishing('FURNISHED')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFurnishing === 'FURNISHED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Meublé
            </button>
            <button
              onClick={() => setSelectedFurnishing('UNFURNISHED')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFurnishing === 'UNFURNISHED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Non-meublé
            </button>
          </div>

          {/* Quick Utility Toggles */}
          <button
            onClick={() => setOnlyVerifiedWater(!onlyVerifiedWater)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              onlyVerifiedWater
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Eau vérifiée</span>
          </button>

          <button
            onClick={() => setOnlyGenerator(!onlyGenerator)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              onlyGenerator
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Groupe / Solaire</span>
          </button>

          {(selectedCommune !== 'ALL' || selectedMode !== 'ALL' || selectedFurnishing !== 'ALL' || selectedType !== 'ALL' || maxPrice || onlyVerifiedWater || onlyGenerator || searchQuery) && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Sponsored Partner Banners Section (Auto-expires once validity ends) */}
      {sponsoredAds.filter((ad) => ad.format === 'CATALOG_BANNER' && isAdActive(ad)).length > 0 && (
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Partenaires & Services Recommandés à Kinshasa</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Campagnes vérifiées MaishaPay
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sponsoredAds
              .filter((ad) => ad.format === 'CATALOG_BANNER' && isAdActive(ad))
              .map((ad) => {
                const remaining = getRemainingAdTime(ad.expiresAt);
                return (
                  <div
                    key={ad.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col sm:flex-row gap-3.5 shadow-lg relative overflow-hidden"
                  >
                    <div className="w-full sm:w-36 h-28 sm:h-auto rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                      <img
                        src={ad.thumbnailUrl || ad.mediaUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                        Sponsorisé
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-300">
                            {ad.advertiserName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>{remaining.label}</span>
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 mt-0.5">
                          {ad.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                          {ad.tagline || ad.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Régie NZUBU · MaishaPay
                        </span>
                        <a
                          href={`https://wa.me/${ad.ctaTarget.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, j'ai vu votre bannière sur NZUBU : ${ad.title}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                          <span>{ad.ctaText || 'WhatsApp'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Grid of Results */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>{filteredListings.length} logement{filteredListings.length > 1 ? 's' : ''} vérifié{filteredListings.length > 1 ? 's' : ''}</span>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Contrôle physique certifié 90 jours</span>
          </span>
        </div>

        {filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <Filter className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Aucun logement ne correspond à ces critères</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Élargissez vos filtres géographiques ou financiers pour voir les autres opportunités certifiées sur Kinshasa.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => onOpenDetails(listing)}
                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all cursor-pointer flex flex-col shadow-lg"
              >
                {/* Media thumbnail container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={listing.media.videoThumbnail}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Vérifié</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-md text-[10px] font-medium">
                      {listing.rentalMode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}
                    </span>
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(listing.id);
                    }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      listing.isFavorite ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${listing.isFavorite ? 'fill-white' : ''}`} />
                  </button>

                  {/* Bottom price over image */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-baseline justify-between text-white">
                    <div className="text-base font-black tabular-nums drop-shadow">
                      {formatCDF(listing.pricing.amountCdf)} CDF
                      <span className="text-[11px] font-medium text-slate-300 ml-1">
                        / {listing.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{listing.commune} · {listing.quartier}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {listing.landmark}
                    </p>

                    {/* Quick utility pill tags */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-2 font-medium">
                      <span>{listing.bedroomsCount} ch.</span>
                      <span>·</span>
                      <span>{listing.furnishingStatus === 'FURNISHED' ? 'Meublé' : 'Non-meublé'}</span>
                      <span>·</span>
                      <span>{listing.utilities.water.testedWorking ? 'Eau testée' : 'Cuve'}</span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(listing);
                      }}
                      className="text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Voir la fiche
                    </button>

                    {listing.rentalMode === 'SHORT_STAY' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBooking(listing);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-500/20"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Réserver (20%)</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenViewing(listing);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visiter</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
