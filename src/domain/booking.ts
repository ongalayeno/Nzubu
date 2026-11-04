import type { BookingRequest } from '../types';

export function hasBookingConflict(
  bookings: BookingRequest[],
  candidate: Pick<BookingRequest, 'listingId' | 'checkInDate' | 'checkOutDate'>,
  statuses: BookingRequest['status'][],
  excludeId?: string,
  now = Date.now(),
): boolean {
  return bookings.some((booking) => booking.id !== excludeId
    && booking.listingId === candidate.listingId
    && statuses.includes(booking.status)
    && (booking.status === 'CONFIRMED' || new Date(booking.expiresAt).getTime() > now)
    && candidate.checkInDate < booking.checkOutDate
    && candidate.checkOutDate > booking.checkInDate);
}
