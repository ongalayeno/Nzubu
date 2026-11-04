/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserRole, 
  PropertyListing, 
  BookingRequest, 
  ViewingRequest, 
  FieldMission,
  SecurityAlert
} from './types';
import { 
  INITIAL_LISTINGS, 
  INITIAL_BOOKINGS, 
  INITIAL_VIEWINGS, 
  INITIAL_MISSIONS 
} from './data/mockData';
import { Header } from './components/Header';
import { TikTokFeed } from './components/client/TikTokFeed';
import { ExploreGrid } from './components/client/ExploreGrid';
import { ClientRequestsView } from './components/client/ClientRequestsView';
import { VerifiedBadgeDrawer } from './components/client/VerifiedBadgeDrawer';
import { BookingModal } from './components/client/BookingModal';
import { ViewingModal } from './components/client/ViewingModal';
import { ListingDetailModal } from './components/client/ListingDetailModal';
import { PartnerPortal } from './components/partner/PartnerPortal';
import { AgentFieldApp } from './components/agent/AgentFieldApp';
import { BackOfficeView } from './components/admin/BackOfficeView';
import { ComplianceBadgeModal } from './components/legal/ComplianceBadgeModal';
import { 
  Video, 
  Search, 
  Inbox, 
  ShieldCheck, 
  Smartphone, 
  Wifi, 
  Battery, 
  Signal, 
  Calendar,
  Eye,
  Building2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CLIENT');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(true); // Smartphone preview by default
  const [clientSubTab, setClientSubTab] = useState<'FEED' | 'EXPLORE' | 'REQUESTS'>('FEED');

  // Core collections
  const [listings, setListings] = useState<PropertyListing[]>(INITIAL_LISTINGS);
  const [bookings, setBookings] = useState<BookingRequest[]>(INITIAL_BOOKINGS);
  const [viewings, setViewings] = useState<ViewingRequest[]>(INITIAL_VIEWINGS);
  const [missions, setMissions] = useState<FieldMission[]>(INITIAL_MISSIONS);

  // Security alerts registry
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    {
      id: 'alt-001',
      missionId: 'mis-2026-031',
      unitTitle: 'Appartement Haut Standing — Gombe Ambassades',
      commune: 'Gombe',
      quartier: 'Golf',
      agentName: 'Clarisse Ilunga',
      agentId: 'NZUBU-AG-01',
      notes: 'Risque d\'incendie électrique : Court-circuit constaté sur le tableau de répartition sans disjoncteur différentiel fonctionnel. Logement suspendu par précaution.',
      timestamp: 'Hier 17:15',
      resolved: false,
      gpsCoordinates: {
        latitude: -4.303314,
        longitude: 15.304521,
        accuracyMeters: 4,
        capturedAt: '17:12:00',
        source: 'DEVICE_GPS',
      },
      photos: [
        {
          id: 'alt-p1',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
          caption: 'Tableau électrique avec fils fondus et disjoncteur non conforme',
          capturedAt: '17:14',
        },
      ],
    },
  ]);

  // Filters for the video feed
  const [feedCommuneFilter, setFeedCommuneFilter] = useState<string>('ALL');
  const [feedModeFilter, setFeedModeFilter] = useState<string>('ALL');

  // Modals state
  const [detailListing, setDetailListing] = useState<PropertyListing | null>(null);
  const [verificationListing, setVerificationListing] = useState<PropertyListing | null>(null);
  const [bookingListing, setBookingListing] = useState<PropertyListing | null>(null);
  const [viewingListing, setViewingListing] = useState<PropertyListing | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState<boolean>(false);

  // Notifications feedback toast
  const [actionToast, setActionToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Filtered listings for video feed
  const activeFeedListings = listings.filter((item) => {
    if (item.availabilityStatus === 'OCCUPIED') return false;
    if (feedCommuneFilter !== 'ALL' && item.commune.toLowerCase() !== feedCommuneFilter.toLowerCase()) {
      return false;
    }
    if (feedModeFilter !== 'ALL' && item.rentalMode !== feedModeFilter) {
      return false;
    }
    return true;
  });

  // Handlers
  const handleToggleFavorite = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleSubmitBooking = (newBookingData: Partial<BookingRequest>) => {
    const newId = `bkg-2026-00${bookings.length + 1}`;
    const newBooking: BookingRequest = {
      id: newId,
      listingId: newBookingData.listingId || '',
      listingTitle: newBookingData.listingTitle || '',
      commune: newBookingData.commune || 'Gombe',
      guestName: newBookingData.guestName || 'Voyageur',
      guestPhone: newBookingData.guestPhone || '+243 82 000 0000',
      checkInDate: newBookingData.checkInDate || '2026-11-12',
      checkOutDate: newBookingData.checkOutDate || '2026-11-15',
      nightsCount: newBookingData.nightsCount || 3,
      adultsCount: newBookingData.adultsCount || 2,
      totalPriceCdf: newBookingData.totalPriceCdf || 250000,
      advanceAmountCdf: newBookingData.advanceAmountCdf || 50000,
      balanceDueArrivalCdf: newBookingData.balanceDueArrivalCdf || 200000,
      status: 'HOST_ACCEPTED_TERMS', // 30-min hold initiated per brief §15.4
      paymentMethod: newBookingData.paymentMethod || 'VODACOM_MPESA',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      hostPhone: newBookingData.hostPhone || '+243 81 555 4949',
    };

    setBookings((prev) => [newBooking, ...prev]);
    triggerToast("Demande de réservation enregistrée ! Blocage temporaire de 30 min initié.");
  };

  const handleDeclarePayment = (bookingId: string, reference: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'PAYMENT_DECLARED', paymentReference: reference }
          : b
      )
    );
    triggerToast("Référence de paiement enregistrée ! L'hôte vérifiera la réception sous peu.");
  };

  const handleConfirmHostPayment = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b
      )
    );
    triggerToast("Paiement de l'avance validé par l'hôte ! Séjour officiellement confirmé.");
  };

  const handleAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'HOST_ACCEPTED_TERMS' } : b
      )
    );
    triggerToast("Demande acceptée par l'hôte. Verrou temporaire de 30 min activé pour le client.");
  };

  const handleSubmitViewing = (newViewingData: Partial<ViewingRequest>) => {
    const newId = `view-2026-00${viewings.length + 1}`;
    const newViewing: ViewingRequest = {
      id: newId,
      listingId: newViewingData.listingId || '',
      listingTitle: newViewingData.listingTitle || '',
      commune: newViewingData.commune || 'Ngaliema',
      clientName: newViewingData.clientName || 'Client',
      clientPhone: newViewingData.clientPhone || '+243 81 000 0000',
      slots: newViewingData.slots || ['2026-11-06 10:00'],
      status: 'REQUESTED',
      meetingPoint: newViewingData.meetingPoint || 'Repère local convenu',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setViewings((prev) => [newViewing, ...prev]);
    triggerToast("Demande de visite enregistrée ! L'équipe opérations va confirmer le créneau avec le bailleur.");
  };

  const handleAddListing = (listingData: Partial<PropertyListing>) => {
    const newId = `nz-00${listings.length + 1}`;
    const newListing: PropertyListing = {
      id: newId,
      title: listingData.title || 'Nouveau Logement Vérifié',
      description: listingData.description || '',
      rentalMode: listingData.rentalMode || 'SHORT_STAY',
      furnishingStatus: listingData.furnishingStatus || 'FURNISHED',
      unitType: listingData.unitType || 'APARTMENT',
      commune: listingData.commune || 'Gombe',
      quartier: listingData.quartier || 'Golf',
      landmark: listingData.landmark || 'Près du Boulevard',
      pricing: listingData.pricing || {
        amountCdf: 200000,
        priceUnit: 'PER_NIGHT',
        serviceChargesIncluded: true,
      },
      bedroomsCount: listingData.bedroomsCount || 2,
      bathroomsCount: listingData.bathroomsCount || 2,
      maxOccupants: listingData.maxOccupants || 4,
      surfaceM2: 85,
      utilities: listingData.utilities || {
        water: { type: 'TANK_RESERVE', testedWorking: true, notes: 'Cuve surpresseur testée' },
        electricity: { type: 'GENERATOR_BACKUP', testedWorking: true, notes: 'Groupe électrogène automatique' },
        ac: true,
        wifi: true,
        parking: true,
        securityGuard: true,
      },
      media: listingData.media || {
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoThumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
        videoDurationSeconds: 40,
        photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'],
      },
      verification: {
        verifiedAt: new Date().toISOString().substring(0, 10),
        verifiedUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        inspectorId: 'NZUBU-AG-04',
        inspectorName: 'Patrick Mbiya (Agent Terrain)',
        reportReference: `RPT-${listingData.commune?.substring(0, 3).toUpperCase() || 'GOM'}-2026-NEW`,
        checksCompleted: {
          identityAndRights: true,
          physicalExistence: true,
          utilitiesWaterElectricity: true,
          interiorMatch: true,
          mediaIntegrity: true,
          pricingInCdf: true,
        },
        disclaimers: ['Contrôle physique certifié NZUBU réalisé sur place.'],
      },
      partner: listingData.partner || {
        id: 'ptn-user',
        name: 'Vous (Partenaire vérifié)',
        type: 'OWNER',
        verified: true,
        phoneMasked: '+243 82 ••• •• 00',
        rating: 5.0,
        responseRatePercent: 100,
      },
      availabilityStatus: 'AVAILABLE',
      cancellationPolicy: {
        id: 'pol-std',
        summary: 'Conditions standards Kinshasa',
        rule72h: 'Remboursement intégral avance > 72h',
        rule24h: '50% retenu entre 24h et 72h',
      },
      isFavorite: false,
    };

    setListings((prev) => [newListing, ...prev]);

    // Also create a field mission in operations
    const newMission: FieldMission = {
      id: `mis-2026-0${missions.length + 50}`,
      unitTitle: newListing.title,
      commune: newListing.commune,
      quartier: newListing.quartier,
      landmark: newListing.landmark,
      contactPerson: newListing.partner.name,
      contactPhone: '+243 82 000 1122',
      scheduledTime: 'Demain 10:30',
      agentId: 'NZUBU-AG-02',
      agentName: 'Alain Kambale',
      status: 'ASSIGNED',
      checklist: {
        identityVerified: false,
        mandateOrTitleChecked: false,
        physicalPresenceConfirmed: false,
        waterSupplyTested: false,
        electricityTested: false,
        roomsMatchedListing: false,
        pricingInCdfNoExcessiveDeposit: false,
        videoFilmedVerticalNoFaces: false,
        safetyEgressChecked: false,
      },
      notes: 'Nouveau logement soumis par le partenaire. Contrôler le groupe et la cuve.',
    };
    setMissions((prev) => [newMission, ...prev]);

    triggerToast("Logement soumis avec succès ! Mission terrain créée pour nos agents à Kinshasa.");
  };

  const handleToggleAvailability = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? {
              ...item,
              availabilityStatus:
                item.availabilityStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE',
            }
          : item
      )
    );
  };

  const handleCompleteMission = (
    missionId: string,
    checklist: Record<string, boolean>,
    outcome: 'PASS' | 'PASS_WITH_DISCLOSURES' | 'NEEDS_CORRECTION' | 'SAFETY_CONCERN',
    notes: string,
    gpsCoordinates?: import('./types').GpsCoordinates,
    photos?: import('./types').MissionPhotoEvidence[]
  ) => {
    const existingMission = missions.find((m) => m.id === missionId);

    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              status: 'REPORT_SUBMITTED',
              checklist: { ...m.checklist, ...checklist },
              decisionOutcome: outcome,
              notes,
              gpsCoordinates: gpsCoordinates || m.gpsCoordinates,
              photos: photos && photos.length > 0 ? photos : m.photos || [],
              completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : m
      )
    );

    // Automatic validation logic: When an agent selects SAFETY_CONCERN, trigger an immediate Urgent Safety Alert to the Back-Office
    if (outcome === 'SAFETY_CONCERN') {
      const newAlert: SecurityAlert = {
        id: `alt-${Date.now().toString().slice(-4)}`,
        missionId,
        unitTitle: existingMission?.unitTitle || 'Logement contrôlé',
        commune: existingMission?.commune || 'Gombe',
        quartier: existingMission?.quartier,
        agentName: existingMission?.agentName || 'Alain Kambale',
        agentId: existingMission?.agentId || 'NZUBU-AG-02',
        notes: notes || 'Alerte sécurité critique signalée par l\'agent lors du contrôle physique sur le terrain.',
        timestamp: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        resolved: false,
        gpsCoordinates,
        photos,
      };

      setSecurityAlerts((prev) => [newAlert, ...prev]);

      // Immediate protective measure: suspend / block the listing from public search feed
      setListings((prev) =>
        prev.map((item) => {
          const isMatching = 
            item.title.toLowerCase().includes(existingMission?.unitTitle.toLowerCase() || '___') ||
            (existingMission && item.commune.toLowerCase() === existingMission.commune.toLowerCase() && item.landmark.toLowerCase() === existingMission.landmark.toLowerCase());
          
          if (isMatching) {
            return {
              ...item,
              availabilityStatus: 'OCCUPIED',
              verification: {
                ...item.verification,
                disclaimers: [
                  'URGENT : Publication temporairement bloquée suite à une Alerte Sécurité signalée par l\'agent terrain.',
                  ...item.verification.disclaimers,
                ],
              },
            };
          }
          return item;
        })
      );

      triggerToast("🚨 URGENT : ALERTE SÉCURITÉ REÇUE ! Logement bloqué et supervision alertée en priorité.");
    } else {
      triggerToast("Rapport d'inspection, photos et coordonnées GPS certifiées transmis au Responsable de Marché !");
    }
  };

  const handleResolveSecurityAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    triggerToast("Alerte Sécurité acquittée avec succès par le Responsable de Marché.");
  };

  const handleApproveListingBadge = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? {
              ...item,
              verification: {
                ...item.verification,
                verifiedAt: new Date().toISOString().substring(0, 10),
                verifiedUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              },
            }
          : item
      )
    );
    triggerToast("Badge 'Vérifié par NZUBU' re-validé pour 90 jours !");
  };

  const handleSuspendListing = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { ...item, availabilityStatus: 'OCCUPIED' }
          : item
      )
    );
    triggerToast("Annonce temporairement suspendue et retirée du feed public.");
  };

  const handleAssignMission = (missionId: string, agentName: string) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, agentName } : m
      )
    );
    triggerToast(`Mission réaffectée à ${agentName} !`);
  };

  // Render client sub-view
  const renderClientContent = () => {
    if (clientSubTab === 'FEED') {
      return (
        <TikTokFeed
          listings={activeFeedListings}
          onOpenDetails={(l) => setDetailListing(l)}
          onOpenVerification={(l) => setVerificationListing(l)}
          onOpenBooking={(l) => setBookingListing(l)}
          onOpenViewing={(l) => setViewingListing(l)}
          onToggleFavorite={handleToggleFavorite}
          activeCommuneFilter={feedCommuneFilter}
          onChangeCommuneFilter={(c) => setFeedCommuneFilter(c)}
          activeModeFilter={feedModeFilter}
          onChangeModeFilter={(m) => setFeedModeFilter(m)}
        />
      );
    }
    if (clientSubTab === 'EXPLORE') {
      return (
        <ExploreGrid
          listings={listings}
          onOpenDetails={(l) => setDetailListing(l)}
          onOpenBooking={(l) => setBookingListing(l)}
          onOpenViewing={(l) => setViewingListing(l)}
          onToggleFavorite={handleToggleFavorite}
        />
      );
    }
    return (
      <ClientRequestsView
        bookings={bookings}
        viewings={viewings}
        favorites={listings.filter((l) => l.isFavorite)}
        onDeclarePayment={handleDeclarePayment}
        onOpenDetails={(l) => setDetailListing(l)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar Contract (Zone 1: Brand, Zone 2: Role Switcher, Zone 3: Actions) */}
      <Header
        currentRole={currentRole}
        onRoleChange={(r) => {
          setCurrentRole(r);
        }}
        isMobileDeviceView={isMobileDeviceView}
        onToggleDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
        onOpenCompliance={() => setShowComplianceModal(true)}
        unresolvedSafetyAlertsCount={securityAlerts.filter((a) => !a.resolved).length}
      />

      {/* Global Urgent Safety Alert Banner when not on Operations Admin */}
      {securityAlerts.some((a) => !a.resolved) && currentRole !== 'OPERATIONS_ADMIN' && (
        <div 
          onClick={() => setCurrentRole('OPERATIONS_ADMIN')}
          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg transition-colors cursor-pointer z-40"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
            <span>URGENT : {securityAlerts.filter((a) => !a.resolved).length} Alerte(s) Sécurité critique(s) signalée(s) par les agents terrain !</span>
          </div>
          <span className="text-[11px] underline font-semibold flex items-center gap-1">
            <span>Ouvrir Back-Office Opérations</span>
            <span>→</span>
          </span>
        </div>
      )}

      {/* Main Experience Container */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Device Frame View (when isMobileDeviceView is true) */}
        {isMobileDeviceView ? (
          <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
            <div className="w-[390px] h-[780px] sm:h-[820px] rounded-[44px] border-[10px] border-slate-900 shadow-2xl relative overflow-hidden bg-slate-950 flex flex-col ring-1 ring-slate-800">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Status Bar */}
              <div className="h-9 px-6 flex items-center justify-between text-[11px] font-semibold text-white/90 z-30 pt-1 pointer-events-none">
                <span>09:41</span>
                <div className="flex items-center gap-1.5 text-white/90">
                  <Signal className="w-3 h-3" />
                  <span className="text-[10px] font-mono">4G</span>
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 overflow-hidden relative">
                {currentRole === 'CLIENT' && renderClientContent()}
                {currentRole === 'PARTNER' && (
                  <PartnerPortal
                    listings={listings}
                    bookings={bookings}
                    onAddListing={handleAddListing}
                    onAcceptBooking={handleAcceptBooking}
                    onConfirmHostPayment={handleConfirmHostPayment}
                    onToggleAvailability={handleToggleAvailability}
                  />
                )}
                {currentRole === 'FIELD_AGENT' && (
                  <AgentFieldApp
                    missions={missions}
                    onCompleteMission={handleCompleteMission}
                  />
                )}
                {currentRole === 'OPERATIONS_ADMIN' && (
                  <BackOfficeView
                    listings={listings}
                    missions={missions}
                    bookings={bookings}
                    securityAlerts={securityAlerts}
                    onApproveListingBadge={handleApproveListingBadge}
                    onSuspendListing={handleSuspendListing}
                    onAssignMission={handleAssignMission}
                    onResolveSecurityAlert={handleResolveSecurityAlert}
                  />
                )}
              </div>

              {/* Mobile Bottom Thumb Bar (for Client role) */}
              {currentRole === 'CLIENT' && (
                <div className="h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 grid grid-cols-3 items-center z-40 px-2 pb-safe">
                  <button
                    onClick={() => setClientSubTab('FEED')}
                    className={`flex flex-col items-center justify-center h-full transition-colors ${
                      clientSubTab === 'FEED' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-tight mt-1">Feed Vidéo</span>
                  </button>

                  <button
                    onClick={() => setClientSubTab('EXPLORE')}
                    className={`flex flex-col items-center justify-center h-full transition-colors ${
                      clientSubTab === 'EXPLORE' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-tight mt-1">Explorer</span>
                  </button>

                  <button
                    onClick={() => setClientSubTab('REQUESTS')}
                    className={`flex flex-col items-center justify-center h-full transition-colors relative ${
                      clientSubTab === 'REQUESTS' ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-tight mt-1">Dossiers</span>
                    {bookings.length > 0 && (
                      <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                </div>
              )}

              {/* Bottom Home Indicator Bar */}
              <div className="h-4 bg-slate-950 flex items-center justify-center">
                <div className="w-32 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen / Responsive Desktop View */
          <div className="w-full h-full flex-1 flex flex-col">
            {/* If Client role in desktop view, show sub navigation */}
            {currentRole === 'CLIENT' && (
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setClientSubTab('FEED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      clientSubTab === 'FEED' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Feed Vidéo Vertical</span>
                  </button>

                  <button
                    onClick={() => setClientSubTab('EXPLORE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      clientSubTab === 'EXPLORE' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Catalogue & Recherche</span>
                  </button>

                  <button
                    onClick={() => setClientSubTab('REQUESTS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      clientSubTab === 'REQUESTS' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Mes Demandes ({bookings.length + viewings.length})</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Marché pilote : Gombe · Lingwala · Ngaliema (CDF uniquement)</span>
                </div>
              </div>
            )}

            <div className="flex-1 w-full h-[calc(100vh-8rem)] overflow-hidden">
              {currentRole === 'CLIENT' && renderClientContent()}
              {currentRole === 'PARTNER' && (
                <PartnerPortal
                  listings={listings}
                  bookings={bookings}
                  onAddListing={handleAddListing}
                  onAcceptBooking={handleAcceptBooking}
                  onConfirmHostPayment={handleConfirmHostPayment}
                  onToggleAvailability={handleToggleAvailability}
                />
              )}
              {currentRole === 'FIELD_AGENT' && (
                <AgentFieldApp
                  missions={missions}
                  onCompleteMission={handleCompleteMission}
                />
              )}
              {currentRole === 'OPERATIONS_ADMIN' && (
                <BackOfficeView
                  listings={listings}
                  missions={missions}
                  bookings={bookings}
                  securityAlerts={securityAlerts}
                  onApproveListingBadge={handleApproveListingBadge}
                  onSuspendListing={handleSuspendListing}
                  onAssignMission={handleAssignMission}
                  onResolveSecurityAlert={handleResolveSecurityAlert}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Interactive Modals */}
      {detailListing && (
        <ListingDetailModal
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onOpenBooking={(l) => setBookingListing(l)}
          onOpenViewing={(l) => setViewingListing(l)}
          onOpenVerification={(l) => setVerificationListing(l)}
        />
      )}

      {verificationListing && (
        <VerifiedBadgeDrawer
          listing={verificationListing}
          onClose={() => setVerificationListing(null)}
        />
      )}

      {bookingListing && (
        <BookingModal
          listing={bookingListing}
          onClose={() => setBookingListing(null)}
          onSubmitBooking={handleSubmitBooking}
        />
      )}

      {viewingListing && (
        <ViewingModal
          listing={viewingListing}
          onClose={() => setViewingListing(null)}
          onSubmitViewing={handleSubmitViewing}
        />
      )}

      {showComplianceModal && (
        <ComplianceBadgeModal
          onClose={() => setShowComplianceModal(false)}
        />
      )}

      {/* Action Toast Feedback */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
}
