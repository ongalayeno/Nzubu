CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_confirmed_booking
  EXCLUDE USING gist (listing_id WITH =, daterange(check_in,check_out,'[)') WITH &&)
  WHERE (status='CONFIRMED');
