import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_BOOKINGS, INITIAL_LISTINGS } from '../data/mockData';
import { hasBookingConflict } from './booking';
import { canApproveListing, isListingPublic } from './listing';
import type { FieldMission, PropertyListing } from '../types';

test('une annonce soumise reste invisible jusqu’à la validation', () => {
  const listing: PropertyListing = {
    ...INITIAL_LISTINGS[0],
    publicationStatus: 'PENDING_INSPECTION',
  };
  assert.equal(isListingPublic(listing), false);
  assert.equal(canApproveListing(listing, []), false);
  assert.equal(isListingPublic({ ...INITIAL_LISTINGS[0], publicationStatus: 'SUSPENDED' }), false);
  assert.equal(isListingPublic({ ...INITIAL_LISTINGS[0], verification: { ...INITIAL_LISTINGS[0].verification, verifiedUntil: '2020-01-01' } }), false);
});

test('l’approbation exige un rapport favorable et des preuves réelles', () => {
  const listing = { ...INITIAL_LISTINGS[0], publicationStatus: 'PENDING_APPROVAL' as const };
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
  const booking = { ...INITIAL_BOOKINGS[0], id: 'confirmed', status: 'CONFIRMED' as const,
    checkInDate: '2026-12-10', checkOutDate: '2026-12-15' };
  const candidate = { listingId: booking.listingId, checkInDate: '2026-12-14', checkOutDate: '2026-12-16' };
  assert.equal(hasBookingConflict([booking], candidate, ['CONFIRMED']), true);
  assert.equal(hasBookingConflict([booking], { ...candidate, checkInDate: '2026-12-15' }, ['CONFIRMED']), false);
  const hold = { ...booking, id: 'hold', status: 'HOST_ACCEPTED_TERMS' as const, expiresAt: '2020-01-01T00:00:00Z' };
  assert.equal(hasBookingConflict([hold], candidate, ['HOST_ACCEPTED_TERMS']), false);
});
