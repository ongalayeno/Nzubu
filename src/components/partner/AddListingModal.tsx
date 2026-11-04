/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Building2, UploadCloud, ShieldCheck, MapPin, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { PropertyListing, RentalMode, FurnishingStatus, UnitType } from '../../types';

interface AddListingModalProps {
  onClose: () => void;
  onSubmit: (listing: Partial<PropertyListing>) => void;
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rentalMode, setRentalMode] = useState<RentalMode>('SHORT_STAY');
  const [furnishingStatus, setFurnishingStatus] = useState<FurnishingStatus>('FURNISHED');
  const [unitType, setUnitType] = useState<UnitType>('APARTMENT');
  const [commune, setCommune] = useState('Gombe');
  const [quartier, setQuartier] = useState('Golf');
  const [landmark, setLandmark] = useState('');
  const [priceCdf, setPriceCdf] = useState(200000);
  const [cleaningFeeCdf, setCleaningFeeCdf] = useState(20000);
  const [securityDepositMonths, setSecurityDepositMonths] = useState(2);
  const [bedroomsCount, setBedroomsCount] = useState(2);
  const [bathroomsCount, setBathroomsCount] = useState(2);
  const [waterType, setWaterType] = useState<'TANK_RESERVE' | 'REGIDESO' | 'BOREHOLE_FORAGE'>('TANK_RESERVE');
  const [electricityType, setElectricityType] = useState<'GENERATOR_BACKUP' | 'SOLAR_HYBRID' | 'SNEL_GRID'>('GENERATOR_BACKUP');
  const [hasAc, setHasAc] = useState(true);
  const [hasWifi, setHasWifi] = useState(true);
  const [mandateType, setMandateType] = useState<'OWNER' | 'MANDATAIRE' | 'PROPERTY_MANAGER' | 'HOST'>('OWNER');
  const [hasUploadedMandate, setHasUploadedMandate] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !landmark) return;

    const newListing: Partial<PropertyListing> = {
      title,
      description: description || `Superbe logement situé à Kinshasa (${commune}), offrant d'excellentes prestations vérifiées.`,
      rentalMode,
      furnishingStatus,
      unitType,
      commune,
      quartier,
      landmark,
      pricing: {
        amountCdf: priceCdf,
        priceUnit: rentalMode === 'SHORT_STAY' ? 'PER_NIGHT' : 'PER_MONTH',
        cleaningFeeCdf: rentalMode === 'SHORT_STAY' ? cleaningFeeCdf : undefined,
        serviceChargesIncluded: true,
        securityDepositMonths: rentalMode === 'LONG_TERM' ? Math.min(3, securityDepositMonths) : undefined,
        bookingAdvancePercent: rentalMode === 'SHORT_STAY' ? 20 : undefined,
      },
      bedroomsCount,
      bathroomsCount,
      maxOccupants: bedroomsCount * 2,
      utilities: {
        water: {
          type: waterType,
          testedWorking: true,
          notes: waterType === 'TANK_RESERVE' ? 'Réserve surpresseur déclarée' : 'Alimentation déclarée',
        },
        electricity: {
          type: electricityType,
          testedWorking: true,
          notes: electricityType === 'GENERATOR_BACKUP' ? 'Groupe électrogène de secours disponible' : 'Alimentation déclarée',
        },
        ac: hasAc,
        wifi: hasWifi,
        parking: true,
        securityGuard: true,
      },
      media: {
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoThumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
        videoDurationSeconds: 35,
        photos: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
        ],
      },
      partner: {
        id: 'ptn-new',
        name: 'Vous (Partenaire NZUBU)',
        type: mandateType,
        verified: true,
        phoneMasked: '+243 82 ••• •• 00',
        rating: 5.0,
        responseRatePercent: 100,
      },
      availabilityStatus: 'AVAILABLE',
      cancellationPolicy: {
        id: 'pol-custom',
        summary: 'Conditions standards NZUBU',
        rule72h: 'Remboursement intégral de l\'avance si annulation > 72h',
        rule24h: '50% remboursé entre 24h et 72h',
      },
    };

    onSubmit(newListing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl text-white max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Espace Bailleur & Hôte · Dépôt de Logement
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Soumettre un logement pour vérification physique
            </h3>
            <p className="text-xs text-slate-400">
              Une mission d'inspection terrain sera planifiée avant toute publication dans le feed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Titre descriptif du bien
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Bel Appartement 2 Chambres Meublé avec Groupe"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Mode & Meublé (Strictly independent per Brief §2.1) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mode de location
              </label>
              <select
                value={rentalMode}
                onChange={(e) => setRentalMode(e.target.value as RentalMode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="SHORT_STAY">Courte durée (Séjour par nuitée)</option>
                <option value="LONG_TERM">Longue durée (Bail résidentiel mensuel)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobilier
              </label>
              <select
                value={furnishingStatus}
                onChange={(e) => setFurnishingStatus(e.target.value as FurnishingStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="FURNISHED">Meublé</option>
                <option value="UNFURNISHED">Non-meublé</option>
                <option value="PARTIALLY_FURNISHED">Partiellement meublé</option>
              </select>
            </div>
          </div>

          {/* Localisation Kinshasa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Commune (Zone pilote)
              </label>
              <select
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Gombe">Gombe</option>
                <option value="Ngaliema">Ngaliema</option>
                <option value="Lingwala">Lingwala</option>
                <option value="Kintambo">Kintambo</option>
                <option value="Limete">Limete</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quartier
              </label>
              <input
                type="text"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                placeholder="Ex : Golf, Ma Campagne, Huileries..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Repère kinois (Crucial for Kinshasa navigation §26.1) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Point de repère local kinois (visible publiquement)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Ex : À 200m de l'Avenue Batetela, croisement Huileries et Stade des Martyrs..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Prix en Franc Congolais (CDF) */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prix en Franc Congolais (CDF) {rentalMode === 'SHORT_STAY' ? '/ nuit' : '/ mois'}
                </label>
                <input
                  type="number"
                  value={priceCdf}
                  onChange={(e) => setPriceCdf(Number(e.target.value))}
                  step="5000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {rentalMode === 'SHORT_STAY' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Frais de ménage (CDF)
                  </label>
                  <input
                    type="number"
                    value={cleaningFeeCdf}
                    onChange={(e) => setCleaningFeeCdf(Number(e.target.value))}
                    step="5000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Garantie locative (max 3 mois selon Loi 15/025)
                  </label>
                  <select
                    value={securityDepositMonths}
                    onChange={(e) => setSecurityDepositMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>1 mois de loyer</option>
                    <option value={2}>2 mois de loyer</option>
                    <option value={3}>3 mois de loyer (Plafond légal)</option>
                  </select>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {rentalMode === 'SHORT_STAY' 
                ? 'Règle NZUBU : Le client vous versera directement 20% d\'avance pour bloquer les dates, et le solde à l\'arrivée.' 
                : 'Conformité Loi n°15/025 : La garantie locative résidentielle ne peut excéder 3 mois de loyer.'}
            </p>
          </div>

          {/* Droit de proposer & Justificatifs */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Votre qualité sur ce logement
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMandateType('OWNER')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  mandateType === 'OWNER'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400'
                }`}
              >
                Propriétaire direct
              </button>
              <button
                type="button"
                onClick={() => setMandateType('MANDATAIRE')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  mandateType === 'MANDATAIRE'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400'
                }`}
              >
                Mandataire écrit
              </button>
              <button
                type="button"
                onClick={() => setMandateType('PROPERTY_MANAGER')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  mandateType === 'PROPERTY_MANAGER'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400'
                }`}
              >
                Gestionnaire
              </button>
            </div>
          </div>

          {/* Justificatif dépôt */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-semibold text-white block">Titre foncier / Mandat écrit / ID</span>
                <span className="text-[11px] text-emerald-400">Dossier documentaire préparé pour l'agent</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              Joint
            </span>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Soumettre le bien pour inspection NZUBU</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
