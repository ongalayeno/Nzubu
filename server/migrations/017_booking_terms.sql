ALTER TABLE bookings ADD COLUMN IF NOT EXISTS occupants integer NOT NULL DEFAULT 1 CHECK (occupants > 0 AND occupants <= 20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS conditions_snapshot text;
