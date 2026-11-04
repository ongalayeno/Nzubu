CREATE TABLE IF NOT EXISTS lease_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  client_id uuid NOT NULL REFERENCES users(id),
  viewing_id uuid REFERENCES viewings(id),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','UNDER_REVIEW','NEGOTIATING','LEASE_PREPARED','SIGNED_EXTERNALLY','CANCELLED')),
  message text NOT NULL,
  agreed_rent_cdf bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
