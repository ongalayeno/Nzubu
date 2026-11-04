/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RentalMode = 'SHORT_STAY' | 'LONG_TERM';

export type FurnishingStatus = 'FURNISHED' | 'UNFURNISHED' | 'PARTIALLY_FURNISHED';

export type UnitType = 'APARTMENT' | 'VILLA' | 'STUDIO' | 'ROOM' | 'HOUSE';

export type UserRole = 'CLIENT' | 'PARTNER' | 'FIELD_AGENT' | 'OPERATIONS_ADMIN';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

export interface VerificationDetails {
  verifiedAt: string;
  verifiedUntil: string; // 90 days validity as defined in brief §9.4
  inspectorId: string;
  inspectorName: string;
  reportReference: string;
  checksCompleted: {
    identityAndRights: boolean;
    physicalExistence: boolean;
    utilitiesWaterElectricity: boolean;
    interiorMatch: boolean;
    mediaIntegrity: boolean;
    pricingInCdf: boolean;
  };
  disclaimers: string[];
}

export interface UtilitiesInfo {
  water: {
    type: 'REGIDESO' | 'BOREHOLE_FORAGE' | 'TANK_RESERVE';
    reserveCapacityLiters?: number;
    testedWorking: boolean;
    notes: string;
  };
  electricity: {
    type: 'SNEL_GRID' | 'GENERATOR_BACKUP' | 'SOLAR_HYBRID' | 'INVERTER';
    generatorKVA?: number;
    testedWorking: boolean;
    notes: string;
  };
  ac: boolean;
  wifi: boolean;
  parking: boolean;
  securityGuard: boolean;
}

export interface ListingPrice {
  amountCdf: number; // Stored in CDF as required by Loi 15/025 and BCC
  priceUnit: 'PER_NIGHT' | 'PER_MONTH';
  cleaningFeeCdf?: number;
  serviceChargesIncluded: boolean;
  serviceChargesDetail?: string;
  securityDepositMonths?: number; // Capped strictly at 3 months for residential lease (Loi 15/025)
  bookingAdvancePercent?: number; // 20% proposed for short stay paid directly to host
}

export interface PropertyListing {
  id: string;
  publicationStatus?: 'DRAFT' | 'PENDING_INSPECTION' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'SUSPENDED';
  title: string;
  description: string;
  rentalMode: RentalMode;
  furnishingStatus: FurnishingStatus;
  unitType: UnitType;
  commune: string; // Gombe, Ngaliema, Lingwala, Kintambo, Limete, etc.
  quartier: string;
  landmark: string; // Repère kinois clair sans révéler l'adresse exacte publiquement
  exactAddressPrivate?: string; // Private until confirmed
  pricing: ListingPrice;
  bedroomsCount: number;
  bathroomsCount: number;
  maxOccupants: number;
  surfaceM2?: number;
  floor?: string;
  sharedSpaces?: string[]; // If room
  utilities: UtilitiesInfo;
  media: {
    videoUrl: string;
    videoThumbnail: string;
    videoDurationSeconds: number;
    photos: string[];
  };
  verification: VerificationDetails;
  partner: {
    id: string;
    name: string;
    type: 'OWNER' | 'MANDATAIRE' | 'PROPERTY_MANAGER' | 'HOST';
    verified: boolean;
    phoneMasked: string;
    rating: number;
    responseRatePercent: number;
  };
  availabilityStatus: 'AVAILABLE' | 'UNDER_NEGOTIATION' | 'OCCUPIED';
  cancellationPolicy: {
    id: string;
    summary: string;
    rule72h: string;
    rule24h: string;
  };
  isFavorite?: boolean;
}

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  commune: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  adultsCount: number;
  totalPriceCdf: number;
  advanceAmountCdf: number; // 20% to host
  balanceDueArrivalCdf: number; // 80% at arrival
  status: 
    | 'REQUESTED' 
    | 'HOST_ACCEPTED_TERMS' 
    | 'CUSTOMER_ACCEPTED' 
    | 'PAYMENT_PENDING' 
    | 'PAYMENT_DECLARED' 
    | 'CONFIRMED' 
    | 'CANCELLED' 
    | 'COMPLETED';
  paymentMethod?: 'VODACOM_MPESA' | 'AIRTEL_MONEY' | 'ORANGE_MONEY' | 'CASH_AT_CHECKIN';
  paymentReference?: string;
  createdAt: string;
  expiresAt: string; // 30 min hold timer
  hostPhone?: string;
}

export interface ViewingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  commune: string;
  clientName: string;
  clientPhone: string;
  slots: string[];
  chosenSlot?: string;
  status: 'REQUESTED' | 'PROPOSED_SLOT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingPoint: string;
  agentAssignedName?: string;
  createdAt: string;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
  source?: 'DEVICE_GPS' | 'NETWORK_TRIANGULATION' | 'OFFLINE_CACHE';
}

export interface MissionPhotoEvidence {
  id: string;
  url: string;
  caption: string;
  capturedAt: string;
}

export interface FieldMission {
  id: string;
  listingId?: string;
  unitTitle: string;
  commune: string;
  quartier: string;
  landmark: string;
  contactPerson: string;
  contactPhone: string;
  scheduledTime: string;
  agentId: string;
  agentName: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'REPORT_SUBMITTED' | 'APPROVED' | 'NEEDS_CORRECTION';
  checklist: {
    identityVerified: boolean;
    mandateOrTitleChecked: boolean;
    physicalPresenceConfirmed: boolean;
    waterSupplyTested: boolean;
    electricityTested: boolean;
    roomsMatchedListing: boolean;
    pricingInCdfNoExcessiveDeposit: boolean;
    videoFilmedVerticalNoFaces: boolean;
    safetyEgressChecked: boolean;
  };
  decisionOutcome?: 'PASS' | 'PASS_WITH_DISCLOSURES' | 'NEEDS_CORRECTION' | 'SAFETY_CONCERN';
  notes?: string;
  gpsCoordinates?: GpsCoordinates;
  photos?: MissionPhotoEvidence[];
  completedAt?: string;
}

export interface PartnerStats {
  activeListingsCount: number;
  pendingRequestsCount: number;
  monthlyRevenueEstimateCdf: number;
  nzubuCommissionDueCdf: number;
}

export interface SecurityAlert {
  id: string;
  missionId: string;
  listingId?: string;
  unitTitle: string;
  commune: string;
  quartier?: string;
  agentName: string;
  agentId: string;
  notes: string;
  timestamp: string;
  resolved: boolean;
  gpsCoordinates?: GpsCoordinates;
  photos?: MissionPhotoEvidence[];
  checklistFailures?: string[];
}
