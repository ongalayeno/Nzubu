import type { FieldMission, PropertyListing } from '../types';

export function isListingPublic(listing: PropertyListing, today = new Date().toISOString().slice(0, 10)): boolean {
  return (listing.publicationStatus === undefined || listing.publicationStatus === 'PUBLISHED')
    && listing.availabilityStatus === 'AVAILABLE'
    && Boolean(listing.verification.verifiedAt)
    && listing.verification.verifiedUntil >= today
    && Object.values(listing.verification.checksCompleted).every(Boolean);
}

export function canApproveListing(listing: PropertyListing, missions: FieldMission[]): boolean {
  const report = missions.find((mission) => mission.listingId === listing.id && mission.status === 'REPORT_SUBMITTED');
  return Boolean(report
    && report!.decisionOutcome === 'PASS'
    && Object.values(report!.checklist).every(Boolean)
    && report!.gpsCoordinates?.source === 'DEVICE_GPS'
    && report!.photos?.some((photo) => photo.url.startsWith('data:image/'))
    && listing.partner.verified);
}
