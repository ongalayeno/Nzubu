ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS diaspora_currency text,
  ADD COLUMN IF NOT EXISTS diaspora_amount numeric;
