import type {
  BookingRequest,
  FieldMission,
  PropertyListing,
  SponsoredAd,
} from '../types';

export interface ApiListingRow {
  id: string;
  title: string;
  commune: string;
  rental_mode: 'SHORT_STAY' | 'LONG_TERM';
  price_cdf: number;
  status?: string;
  verified_until?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  boosted_until?: string | null;
  video_status?: string | null;
  data?: Record<string, any> | null;
}

export interface ApiAdRow {
  id: string;
  title: string;
  advertiser_name: string;
  advertiser_phone: string;
  category: SponsoredAd['category'];
  format: SponsoredAd['format'];
  media_url: string;
  thumbnail_url: string;
  tagline: string;
  description: string;
  cta_text: string;
  cta_action_type: SponsoredAd['ctaActionType'];
  cta_target: string;
  badge_label: string;
  price_paid_cdf: number;
  payment_provider: 'MAISHAPAY';
  duration_days: number;
  starts_at: string;
  expires_at: string;
  status: SponsoredAd['status'];
  impressions_count: number;
  clicks_count: number;
  featured_listing_id?: string | null;
}

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80';

export function apiListingToPropertyListing(row: ApiListingRow, isFavorite = false): PropertyListing {
  const d = (row.data || {}) as Record<string, any>;
  const isFurnished = Boolean(d.furnished ?? d.furnishingStatus === 'FURNISHED');
  const media = d.media || {};
  const utilities = d.utilities || {};
  const pricing = d.pricing || {};
  const verification = d.verification || {};
  const partner = d.partner || {};
  const cancellationPolicy = d.cancellationPolicy || {};

  return {
    id: row.id,
    publicationStatus: (row.status as PropertyListing['publicationStatus']) || 'PUBLISHED',
    title: row.title,
    description: d.description || `Bien vérifié NZUBU situé à ${row.commune}.`,
    rentalMode: row.rental_mode,
    furnishingStatus:
      d.furnishingStatus || (isFurnished ? 'FURNISHED' : 'UNFURNISHED'),
    unitType: d.unitType || 'APARTMENT',
    commune: row.commune,
    quartier: d.quartier || row.commune,
    landmark: d.landmark || `Repère local — ${row.commune}`,
    exactAddressPrivate: d.exactAddressPrivate,
    pricing: {
      amountCdf: Number(pricing.amountCdf ?? row.price_cdf ?? 0),
      priceUnit: row.rental_mode === 'SHORT_STAY' ? 'PER_NIGHT' : 'PER_MONTH',
      cleaningFeeCdf: pricing.cleaningFeeCdf,
      serviceChargesIncluded: Boolean(pricing.serviceChargesIncluded ?? true),
      serviceChargesDetail:
        pricing.serviceChargesDetail ||
        (d.chargesCdf ? `Charges : ${Number(d.chargesCdf).toLocaleString('fr-FR')} CDF` : undefined),
      securityDepositMonths: pricing.securityDepositMonths ?? d.securityDepositMonths ?? 0,
      bookingAdvancePercent: pricing.bookingAdvancePercent ?? 20,
    },
    bedroomsCount: Number(d.bedroomsCount ?? 2),
    bathroomsCount: Number(d.bathroomsCount ?? 1),
    maxOccupants: Number(d.maxOccupants ?? 4),
    surfaceM2: d.surfaceM2 ? Number(d.surfaceM2) : undefined,
    floor: d.floor,
    sharedSpaces: d.sharedSpaces,
    utilities: {
      water: {
        type: utilities.water?.type || 'REGIDESO',
        reserveCapacityLiters: utilities.water?.reserveCapacityLiters,
        testedWorking: utilities.water?.testedWorking ?? true,
        notes: utilities.water?.notes || 'Alimentation REGIDESO vérifiée lors du contrôle.',
      },
      electricity: {
        type: utilities.electricity?.type || 'SNEL_GRID',
        generatorKVA: utilities.electricity?.generatorKVA,
        testedWorking: utilities.electricity?.testedWorking ?? true,
        notes: utilities.electricity?.notes || 'Installation électrique testée lors de l’inspection.',
      },
      ac: Boolean(utilities.ac ?? isFurnished),
      wifi: Boolean(utilities.wifi ?? isFurnished),
      parking: Boolean(utilities.parking ?? true),
      securityGuard: Boolean(utilities.securityGuard ?? true),
    },
    media: {
      videoUrl: media.videoUrl || `/v1/listings/${row.id}/video?quality=low`,
      videoThumbnail: media.videoThumbnail || `/v1/listings/${row.id}/poster`,
      videoDurationSeconds: Number(media.videoDurationSeconds ?? 35),
      photos:
        Array.isArray(media.photos) && media.photos.length > 0
          ? media.photos
          : [DEFAULT_PHOTO],
    },
    verification: {
      verifiedAt: verification.verifiedAt || row.verified_at || new Date().toISOString().slice(0, 10),
      verifiedUntil: verification.verifiedUntil || row.verified_until || '2027-01-01',
      inspectorId: verification.inspectorId || row.verified_by || 'NZUBU-AGENT',
      inspectorName: verification.inspectorName || 'Agent Terrain NZUBU',
      reportReference: verification.reportReference || `RPT-${row.id.slice(0, 8).toUpperCase()}`,
      checksCompleted: verification.checksCompleted || {
        identityAndRights: true,
        physicalExistence: true,
        utilitiesWaterElectricity: true,
        interiorMatch: true,
        mediaIntegrity: true,
        pricingInCdf: true,
      },
      disclaimers: verification.disclaimers || [
        'Contrôle physique réalisé sur place par un agent NZUBU.',
        'La vérification ne constitue pas une garantie d’absence de litige foncier.',
      ],
    },
    partner: {
      id: partner.id || 'partner',
      name: partner.name || 'Partenaire vérifié NZUBU',
      type: partner.type || 'OWNER',
      verified: partner.verified ?? true,
      phoneMasked: partner.phoneMasked || '+243 81 ••• •• ••',
      rating: Number(partner.rating ?? 4.8),
      responseRatePercent: Number(partner.responseRatePercent ?? 95),
    },
    availabilityStatus: d.availabilityStatus || 'AVAILABLE',
    cancellationPolicy: {
      id: cancellationPolicy.id || 'pol-std',
      summary: cancellationPolicy.summary || d.conditions || 'Politique standard Kinshasa',
      rule72h:
        cancellationPolicy.rule72h ||
        'Remboursement intégral de l’avance de 20% si annulation > 72h avant l’arrivée',
      rule24h:
        cancellationPolicy.rule24h ||
        'Remboursement de 50% entre 24h et 72h. Non-remboursable à moins de 24h.',
    },
    isFavorite,
  };
}

export function apiAdToSponsoredAd(row: ApiAdRow): SponsoredAd {
  return {
    id: row.id,
    title: row.title,
    advertiserName: row.advertiser_name,
    advertiserPhone: row.advertiser_phone,
    category: row.category,
    format: row.format,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    tagline: row.tagline,
    description: row.description,
    ctaText: row.cta_text,
    ctaActionType: row.cta_action_type,
    ctaTarget: row.cta_target,
    badgeLabel: row.badge_label,
    pricePaidCdf: Number(row.price_paid_cdf),
    paymentProvider: row.payment_provider,
    durationDays: Number(row.duration_days),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    status: row.status,
    impressionsCount: Number(row.impressions_count),
    clicksCount: Number(row.clicks_count),
    featuredListingId: row.featured_listing_id || undefined,
  };
}

export function apiBookingToBookingRequest(
  row: Record<string, any>,
  listing?: PropertyListing
): BookingRequest {
  const checkIn = String(row.check_in || '').slice(0, 10);
  const checkOut = String(row.check_out || '').slice(0, 10);
  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 1;
  const total = Number(row.price_cdf ?? 0);
  const advance = Number(row.advance_cdf ?? Math.round(total * 0.2));
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: listing?.title || `Bien ${String(row.listing_id).slice(0, 8)}`,
    commune: listing?.commune || 'Kinshasa',
    guestName: row.guest_email || 'Client NZUBU',
    guestPhone: row.guest_phone || '',
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nightsCount: nights,
    adultsCount: Number(row.occupants ?? 1),
    totalPriceCdf: total,
    advanceAmountCdf: advance,
    balanceDueArrivalCdf: Math.max(0, total - advance),
    status: row.status,
    paymentMethod: row.payment_method || undefined,
    paymentReference: row.payment_reference || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    expiresAt: row.hold_expires_at || new Date().toISOString(),
    hostPhone: listing?.partner.phoneMasked,
  };
}

export function apiMissionToFieldMission(
  row: Record<string, any>,
  listing?: ApiListingRow
): FieldMission {
  const report = (row.report || {}) as Record<string, any>;
  const checks = report.checks || {
    identityVerified: false,
    mandateOrTitleChecked: false,
    physicalPresenceConfirmed: false,
    waterSupplyTested: false,
    electricityTested: false,
    roomsMatchedListing: false,
    pricingInCdfNoExcessiveDeposit: false,
    videoFilmedVerticalNoFaces: false,
    safetyEgressChecked: false,
  };
  return {
    id: row.id,
    listingId: row.listing_id,
    unitTitle: listing?.title || `Bien ${String(row.listing_id).slice(0, 8)}`,
    commune: listing?.commune || 'Kinshasa',
    quartier: listing?.data?.quartier || listing?.commune || '',
    landmark: listing?.data?.landmark || '',
    contactPerson: listing?.data?.partner?.name || 'Partenaire NZUBU',
    contactPhone: '',
    scheduledTime: String(row.created_at || '').slice(0, 16).replace('T', ' '),
    agentId: row.agent_id,
    agentName: 'Agent Terrain NZUBU',
    status: row.status,
    checklist: checks,
    decisionOutcome: row.outcome || undefined,
    notes: report.notes || '',
    gpsCoordinates: report.gps,
    photos: report.photos || [],
    agentSignature: row.agent_signature || undefined,
    completedAt: row.submitted_at || undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    sha256Seal: row.sha256_seal || undefined,
    outageTracker: row.outage_tracker || undefined,
    snelMeterNumber: row.snel_meter_number || undefined,
    snelMeterIndex: row.snel_meter_index || undefined,
    regidesoPressureBar: row.regideso_pressure_bar != null ? Number(row.regideso_pressure_bar) : undefined,
  };
}
