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
  CreditCard,
  FileDown,
  Lock,
  Unlock,
  Layers,
  Calculator,
  ClipboardCheck,
  MessageSquare,
  Flame,
  Award
} from 'lucide-react';
import { PropertyListing, BookingRequest } from '../../types';
import { AddListingModal } from './AddListingModal';
import { exportLeasePdf } from '../../utils/exportLeasePdf';
import { RentalYieldCalculatorModal } from './RentalYieldCalculatorModal';
import { PropertyInventoryModal } from './PropertyInventoryModal';
import { SecureChatModal } from '../common/SecureChatModal';

interface PartnerPortalProps {
  listings: PropertyListing[];
  bookings: BookingRequest[];
  onAddListing: (listing: Partial<PropertyListing>) => void;
  onAcceptBooking: (bookingId: string) => void;
  onConfirmHostPayment: (bookingId: string) => void;
  onToggleAvailability: (listingId: string) => void;
  onOpenCreateAd?: () => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({
  listings,
  bookings,
  onAddListing,
  onAcceptBooking,
  onConfirmHostPayment,
  onToggleAvailability,
  onOpenCreateAd,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'BOOKINGS' | 'CALENDAR' | 'INVOICES'>('BOOKINGS');
  const [selectedCalendarListingId, setSelectedCalendarListingId] = useState<string>(listings[0]?.id || '');
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({
    [listings[0]?.id || '1']: ['2026-11-12', '2026-11-13', '2026-11-20'],
  });
  const [isExportingLeaseId, setIsExportingLeaseId] = useState<string | null>(null);
  const [showYieldModal, setShowYieldModal] = useState<boolean>(false);
  const [inventoryListing, setInventoryListing] = useState<PropertyListing | null>(null);
  const [chatListing, setChatListing] = useState<PropertyListing | null>(null);
  const [boostedListings, setBoostedListings] = useState<Record<string, boolean>>({
    '1': true
  });

  const toggleBoost = (listingId: string) => {
    setBoostedListings(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  const toggleDateBlock = (listingId: string, dateStr: string) => {
    setBlockedDates(prev => {
      const current = prev[listingId] || [];
      if (current.includes(dateStr)) {
        return { ...prev, [listingId]: current.filter(d => d !== dateStr) };
      } else {
        return { ...prev, [listingId]: [...current, dateStr] };
      }
    });
  };

  const handleExportLease = async (listing: PropertyListing) => {
    setIsExportingLeaseId(listing.id);
    try {
      await exportLeasePdf(listing);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du contrat de bail.");
    } finally {
      setIsExportingLeaseId(null);
    }
  };

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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowYieldModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-all"
              title="Simuler vos gains : Séjour court vs Bail 3 ans"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Simulateur Rendement</span>
            </button>

            {listings[0] && (
              <button
                onClick={() => setInventoryListing(listings[0])}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all"
                title="Créer un PV d'État des Lieux Entrée/Sortie (Loi 15/025)"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <span>État des Lieux Numérique</span>
              </button>
            )}

            {onOpenCreateAd && (
              <button
                onClick={onOpenCreateAd}
                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Booster / Pub (MaishaPay)</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Déposer un nouveau logement</span>
            </button>
          </div>
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
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'CALENDAR'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Planning & Blocages</span>
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

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const l = listings.find(item => item.id === booking.listingId) || listings[0];
                            if (l) setChatListing(l);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chat Sécurisé</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const l = listings.find(item => item.id === booking.listingId) || listings[0];
                            if (l) setInventoryListing(l);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>État des Lieux (Loi 15/025)</span>
                        </button>

                        {booking.status === 'REQUESTED' && (
                          <button
                            onClick={() => onAcceptBooking(booking.id)}
                            className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepter (bloquer les dates 30 min)</span>
                          </button>
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
                          {item.publicationStatus === 'PENDING_INSPECTION' ? 'Inspection à venir' : item.publicationStatus === 'PENDING_APPROVAL' ? 'Validation en attente' : item.publicationStatus === 'SUSPENDED' ? 'Suspendu' : 'Vérifié 90j'}
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

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Super-Boost 48h Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleBoost(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        boostedListings[item.id]
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                      title="Remonte l'annonce en top priorité du TikTok Feed avec badge Coup de Cœur"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{boostedListings[item.id] ? 'Super-Boost 48h Actif' : 'Booster 48h'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInventoryListing(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Créer ou vérifier l'état des lieux contradictoire"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>État des Lieux</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowYieldModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Calculer le rendement prévisionnel"
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rendement</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportLease(item)}
                      disabled={isExportingLeaseId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-60"
                    >
                      <FileDown className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isExportingLeaseId === item.id ? 'Génération...' : 'Bail Type'}</span>
                    </button>

                    <button
                      onClick={() => onToggleAvailability(item.id)}
                      disabled={item.publicationStatus !== undefined && item.publicationStatus !== 'PUBLISHED'}
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

        {/* Tab: Interactive Availability & Blocking Calendar */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Planning des disponibilités & Blocage de dates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cliquez sur un jour du calendrier pour bloquer ou libérer la réservation de votre logement.
                </p>
              </div>

              {/* Listing selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Logement :</span>
                <select
                  value={selectedCalendarListingId}
                  onChange={(e) => setSelectedCalendarListingId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.commune})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">Novembre 2026</span>
                  <span className="text-[11px] text-amber-400 font-mono">Kinshasa (GMT+1)</span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                    <span>Disponible</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60" />
                    <span>Séjour Confirmé</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded bg-slate-800 border border-slate-600 line-through text-slate-500" />
                    <span>Bloqué par l'hôte</span>
                  </span>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 pb-1">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* 30 Days of November 2026 */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }, (_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `2026-11-${dayNum.toString().padStart(2, '0')}`;
                  const isBlocked = (blockedDates[selectedCalendarListingId] || []).includes(dateStr);
                  const isBooked = bookings.some(
                    (b) => b.listingId === selectedCalendarListingId &&
                      b.status === 'CONFIRMED' &&
                      dateStr >= b.checkInDate &&
                      dateStr <= b.checkOutDate
                  );

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={isBooked}
                      onClick={() => toggleDateBlock(selectedCalendarListingId, dateStr)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-1 transition-all text-xs min-h-[64px] ${
                        isBooked
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 cursor-not-allowed'
                          : isBlocked
                          ? 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-white hover:bg-emerald-500/20 hover:scale-105 shadow-sm'
                      }`}
                    >
                      <span className="font-mono font-bold text-sm">{dayNum}</span>
                      <span className="text-[10px] font-semibold">
                        {isBooked ? (
                          <span className="text-rose-400">Réservé</span>
                        ) : isBlocked ? (
                          <span className="flex items-center gap-0.5 text-slate-500">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Bloqué</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400">Libre</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  💡 Astuce : Bloquez vos dates si vous effectuez des travaux d'entretien (nettoyage cuve d'eau, révision groupe électrogène).
                </span>
                <span className="text-amber-400 font-semibold font-mono">
                  {(blockedDates[selectedCalendarListingId] || []).length} date(s) bloquée(s)
                </span>
              </div>
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

      {/* Rental Yield Calculator Modal */}
      {showYieldModal && (
        <RentalYieldCalculatorModal
          onClose={() => setShowYieldModal(false)}
        />
      )}

      {/* Property Inventory Modal (État des lieux) */}
      {inventoryListing && (
        <PropertyInventoryModal
          listing={inventoryListing}
          type="ENTRY"
          onClose={() => setInventoryListing(null)}
        />
      )}

      {/* Secure In-App Chat Modal */}
      {chatListing && (
        <SecureChatModal
          listing={chatListing}
          currentUserRole="HOST"
          currentUserName="Bailleur Hôte"
          onClose={() => setChatListing(null)}
        />
      )}
    </div>
  );
};
