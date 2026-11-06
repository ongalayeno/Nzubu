CREATE TABLE IF NOT EXISTS listing_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX IF NOT EXISTS listing_blocks_dates_idx ON listing_blocks(listing_id,check_in,check_out);

ALTER TABLE viewings ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE viewings ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE viewings ADD COLUMN IF NOT EXISTS outcome_note text;
ALTER TABLE viewings ADD COLUMN IF NOT EXISTS handled_by uuid REFERENCES users(id);

ALTER TABLE lease_applications ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE lease_applications ADD COLUMN IF NOT EXISTS signature_reference text;
