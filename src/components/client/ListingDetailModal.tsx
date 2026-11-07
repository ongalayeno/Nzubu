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
  AlertTriangle,
  Calculator,
  Clock,
  Volume2,
  Play,
  Pause,
  Share2,
  FileDown,
  Check,
  Building2,
  Sparkles,
  MessageSquare,
  Globe,
  Award,
  Flame
} from 'lucide-react';
import { PropertyListing } from '../../types';
import { exportLeasePdf } from '../../utils/exportLeasePdf';
import { SecureChatModal } from '../common/SecureChatModal';
import { DiasporaPaymentModal } from './DiasporaPaymentModal';

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
  const [fuelShareCdf, setFuelShareCdf] = useState(150000);
  const [waterSecurityShareCdf, setWaterSecurityShareCdf] = useState(80000);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingLease, setIsExportingLease] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDiasporaModal, setShowDiasporaModal] = useState(false);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const totalMonthlyRealCost = listing.pricing.amountCdf + fuelShareCdf + waterSecurityShareCdf;
  const legalCautionMax = listing.pricing.amountCdf * 3; // Loi n°15/025 Article 7

  const handleExportLease = async () => {
    setIsExportingLease(true);
    try {
      await exportLeasePdf(listing);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du contrat de bail. Veuillez réécouter l'export.");
    } finally {
      setIsExportingLease(false);
    }
  };

  const getTrafficEstimates = (commune: string) => {
    const c = commune.toLowerCase();
    if (c.includes('gombe')) {
      return [
        { label: 'Boulevard du 30 Juin', time: '5 min', note: 'Accès fluide direct' },
        { label: 'Aéroport Int. N\'djili', time: '45 min', note: 'Via Poids Lourds ou Lumumba' },
        { label: 'CMK (Centre Médical)', time: '4 min', note: 'Proximité immédiate' },
        { label: 'Supermarché & Banques', time: '3 min', note: 'Premier Mall / Rawbank' },
      ];
    }
    if (c.includes('ngaliema')) {
      return [
        { label: 'Boulevard du 30 Juin', time: '20 min', note: 'Via Kintambo Magasin' },
        { label: 'Aéroport Int. N\'djili', time: '65 min', note: 'Anticiper heures de pointe' },
        { label: 'Clinique Ngaliema', time: '7 min', note: 'Secteur Ma Campagne' },
        { label: 'Supermarché Shoprite/Kin', time: '6 min', note: 'GB / Kintambo' },
      ];
    }
    return [
      { label: 'Boulevard du 30 Juin', time: '8 min', note: 'Via Huileries ou Triomphal' },
      { label: 'Aéroport Int. N\'djili', time: '50 min', note: 'Via Boulevard Triomphal' },
      { label: 'Hôpital du Cinquantenaire', time: '6 min', note: 'Axe direct' },
      { label: 'Grand Marché & Boutiques', time: '10 min', note: 'Centre commercial' },
    ];
  };

  const shareText = `NZUBU Kinshasa - Logement vérifié : ${listing.title} à ${listing.commune} (${listing.landmark}). Loyer : ${formatCDF(listing.pricing.amountCdf)} CDF. Eau & Électricité certifiées.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

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

            <div className="flex flex-wrap items-center gap-2">
              {listing.rentalMode === 'SHORT_STAY' ? (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBooking(listing);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Réserver (Avance 20%)</span>
                  </button>
                  <button
                    onClick={() => setShowDiasporaModal(true)}
                    className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                    title="Paiement par Visa / Mastercard pour Congolais de l'étranger"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Pack Diaspora</span>
                  </button>
                </>
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

              <button
                onClick={() => setShowChatModal(true)}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Chat Sécurisé</span>
              </button>
            </div>
          </div>

          {/* Passeport de Confiance & Score NZUBU (Feature 5) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Passeport de Confiance & Score Réciproque NZUBU
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                    98.4% Fiabilité
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Bailleur exemplaire : Aucune plainte sur la pression d'eau ni le groupe électrogène. Caution restituée sans litige.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
              <Check className="w-3.5 h-3.5" />
              <span>Garantie Zéro-Arnaque</span>
            </div>
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

          {/* Dynamic Real Budget Calculator (Kinshasa Charges & Loi 15/025) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Calculateur de Budget Réel Kinois
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Estimez le coût complet mensuel (Loyer + Groupe carburant + Sentinelle / Eau)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                100% en CDF
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Loyer de base déclaré :</span>
                <span className="font-mono font-bold text-white">{formatCDF(listing.pricing.amountCdf)} CDF</span>
              </div>

              {/* Fuel share slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Quote-part carburant groupe électrogène estimée :</span>
                  <span className="font-mono text-amber-300 font-bold">{formatCDF(fuelShareCdf)} CDF / mois</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="25000"
                  value={fuelShareCdf}
                  onChange={(e) => setFuelShareCdf(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              {/* Water & sentry slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Forfait gardiennage / sentinelle & cuve d'eau :</span>
                  <span className="font-mono text-sky-300 font-bold">{formatCDF(waterSecurityShareCdf)} CDF / mois</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250000"
                  step="10000"
                  value={waterSecurityShareCdf}
                  onChange={(e) => setWaterSecurityShareCdf(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex justify-between items-baseline font-bold">
                <span className="text-slate-200">Coût total prévisible par mois :</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  {formatCDF(totalMonthlyRealCost)} CDF
                </span>
              </div>

              {/* Legal Deposit reminder */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Plafond légal Loi 15/025 :</strong> La garantie locative exigible ne peut dépasser 3 mois de loyer ({formatCDF(legalCautionMax)} CDF maximum). Aucun paiement anticipatif abusif n'est admis.
                </span>
              </div>
            </div>
          </div>

          {/* Kinshasa Traffic & Route Estimator */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-rose-400" />
                <span>Temps de trajet & Accessibilité Kinshasa</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Trafic moyen estimé</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {getTrafficEstimates(listing.commune).map((t, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block truncate">{t.label}</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">{t.time}</span>
                  <span className="text-[9px] text-slate-500 block truncate">{t.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Voice Debrief Notes */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Débriefing Vocal de l'Agent Terrain
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Notes d'ambiance et observations de l'inspecteur NZUBU ({listing.verification.verifiedAt})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isPlayingVoice
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {isPlayingVoice ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Écouter (42s)</span>
                  </>
                )}
              </button>
            </div>

            {isPlayingVoice && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 animate-fade-in">
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 75, 90, 50, 30, 80, 100, 60, 45, 95, 70, 35, 85, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.6 + (i % 5) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-300 italic text-center">
                  « Quartier calme et sécurisé. Pression d'eau testée très satisfaisante au premier étage. Inverseur automatique du groupe électrogène réactif au quart de tour. »
                </p>
              </div>
            )}
          </div>

          {/* Social Share & Official Documents */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Partager sur WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Lien copié' : 'Copier lien'}</span>
              </button>
            </div>

            {/* Contract PDF Generator */}
            <button
              type="button"
              onClick={handleExportLease}
              disabled={isExportingLease}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>{isExportingLease ? 'Génération...' : 'Contrat de Bail Type (PDF Loi 15/025)'}</span>
            </button>
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

        {/* Secure Chat Modal */}
        {showChatModal && (
          <SecureChatModal
            listing={listing}
            currentUserRole="CLIENT"
            currentUserName="Client Intéressé"
            onClose={() => setShowChatModal(false)}
          />
        )}

        {/* Diaspora Payment Modal */}
        {showDiasporaModal && (
          <DiasporaPaymentModal
            listing={listing}
            onClose={() => setShowDiasporaModal(false)}
          />
        )}
      </div>
    </div>
  );
};
