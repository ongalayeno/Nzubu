import assert from 'node:assert/strict';
import test from 'node:test';
import { hasBookingConflict } from './booking';
import { canApproveListing, isListingPublic } from './listing';
import type { BookingRequest, FieldMission, PropertyListing } from '../types';

const SAMPLE_LISTING: PropertyListing = {
  id: 'nz-test-1',
  title: 'Appartement Test Gombe',
  description: 'Logement de test vérifié à Gombe',
  rentalMode: 'SHORT_STAY',
  furnishingStatus: 'FURNISHED',
  unitType: 'APARTMENT',
  commune: 'Gombe',
  quartier: 'Golf',
  landmark: 'Boulevard du 30 Juin',
  pricing: {
    amountCdf: 250000,
    priceUnit: 'PER_NIGHT',
    serviceChargesIncluded: true,
    securityDepositMonths: 2,
  },
  bedroomsCount: 2,
  bathroomsCount: 2,
  maxOccupants: 4,
  surfaceM2: 90,
  utilities: {
    water: { type: 'TANK_RESERVE', testedWorking: true, notes: 'Cuve OK' },
    electricity: { type: 'GENERATOR_BACKUP', testedWorking: true, notes: 'Groupe OK' },
    ac: true,
    wifi: true,
    parking: true,
    securityGuard: true,
  },
  media: {
    videoUrl: '',
    videoThumbnail: '',
    videoDurationSeconds: 30,
    photos: [],
  },
  verification: {
    verifiedAt: '2026-11-01',
    verifiedUntil: '2027-02-01',
    inspectorId: 'NZUBU-AG-02',
    inspectorName: 'Alain Kambale',
    reportReference: 'REP-001',
    checksCompleted: {
      identityAndRights: true,
      physicalExistence: true,
      utilitiesWaterElectricity: true,
      interiorMatch: true,
      mediaIntegrity: true,
      pricingInCdf: true,
    },
    disclaimers: [],
  },
  partner: {
    id: 'ptn-1',
    name: 'Bailleur Test',
    type: 'OWNER',
    verified: true,
    phoneMasked: '+243 81 ••• •• 00',
    rating: 4.9,
    responseRatePercent: 95,
  },
  availabilityStatus: 'AVAILABLE',
  publicationStatus: 'PUBLISHED',
  cancellationPolicy: {
    id: 'pol-1',
    summary: 'Standard 72h',
    rule72h: 'Remboursement intégral',
    rule24h: '50% retenu',
  },
};

const SAMPLE_BOOKING: BookingRequest = {
  id: 'bkg-test-1',
  listingId: SAMPLE_LISTING.id,
  listingTitle: SAMPLE_LISTING.title,
  commune: SAMPLE_LISTING.commune,
  guestName: 'Client Test',
  guestPhone: '+243 82 000 0000',
  checkInDate: '2026-12-10',
  checkOutDate: '2026-12-15',
  nightsCount: 5,
  adultsCount: 2,
  totalPriceCdf: 1250000,
  advanceAmountCdf: 250000,
  balanceDueArrivalCdf: 1000000,
  status: 'CONFIRMED',
  paymentMethod: 'VODACOM_MPESA',
  createdAt: '2026-11-10 10:00',
  expiresAt: '2099-01-01T00:00:00Z',
  hostPhone: '+243 81 555 0000',
};

test('une annonce soumise reste invisible jusqu’à la validation', () => {
  const listing: PropertyListing = {
    ...SAMPLE_LISTING,
    publicationStatus: 'PENDING_INSPECTION',
  };
  assert.equal(isListingPublic(listing), false);
  assert.equal(canApproveListing(listing, []), false);
  assert.equal(isListingPublic({ ...SAMPLE_LISTING, publicationStatus: 'SUSPENDED' }), false);
  assert.equal(isListingPublic({ ...SAMPLE_LISTING, verification: { ...SAMPLE_LISTING.verification, verifiedUntil: '2020-01-01' } }), false);
});

test('l’approbation exige un rapport favorable et des preuves réelles', () => {
  const listing = { ...SAMPLE_LISTING, publicationStatus: 'PENDING_APPROVAL' as const };
  const report: FieldMission = {
    id: 'test-mission',
    listingId: listing.id,
    unitTitle: listing.title,
    commune: listing.commune,
    quartier: listing.quartier,
    landmark: listing.landmark,
    contactPerson: listing.partner.name,
    contactPhone: '',
    scheduledTime: '',
    agentId: 'agent',
    agentName: 'Agent',
    status: 'REPORT_SUBMITTED',
    decisionOutcome: 'PASS',
    checklist: {
      identityVerified: true, mandateOrTitleChecked: true, physicalPresenceConfirmed: true,
      waterSupplyTested: true, electricityTested: true, roomsMatchedListing: true,
      pricingInCdfNoExcessiveDeposit: true, videoFilmedVerticalNoFaces: true, safetyEgressChecked: true,
    },
    gpsCoordinates: { latitude: -4.3, longitude: 15.3, source: 'DEVICE_GPS' },
    photos: [{ id: '1', url: 'data:image/png;base64,AA==', caption: 'Test', capturedAt: '12:00' }],
  };
  assert.equal(canApproveListing(listing, [report]), true);
  assert.equal(canApproveListing(listing, [{ ...report, photos: [{ ...report.photos![0], url: 'https://example.com/sample.jpg' }] }]), false);
  assert.equal(canApproveListing(listing, [{ ...report, decisionOutcome: 'SAFETY_CONCERN' }]), false);
});

test('les dates qui se chevauchent bloquent une autre réservation', () => {
  const booking = { ...SAMPLE_BOOKING, id: 'confirmed', status: 'CONFIRMED' as const,
    checkInDate: '2026-12-10', checkOutDate: '2026-12-15' };
  const candidate = { listingId: booking.listingId, checkInDate: '2026-12-14', checkOutDate: '2026-12-16' };
  assert.equal(hasBookingConflict([booking], candidate, ['CONFIRMED']), true);
  assert.equal(hasBookingConflict([booking], { ...candidate, checkInDate: '2026-12-15' }, ['CONFIRMED']), false);
  const hold = { ...booking, id: 'hold', status: 'HOST_ACCEPTED_TERMS' as const, expiresAt: '2020-01-01T00:00:00Z' };
  assert.equal(hasBookingConflict([hold], candidate, ['HOST_ACCEPTED_TERMS']), false);
});
