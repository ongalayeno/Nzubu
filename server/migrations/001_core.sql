CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  role text NOT NULL CHECK (role IN ('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS login_codes (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'PENDING_DOCUMENTS' CHECK (status IN ('PENDING_DOCUMENTS','PENDING_INSPECTION','PENDING_APPROVAL','PUBLISHED','SUSPENDED','REJECTED')),
  title text NOT NULL,
  commune text NOT NULL,
  rental_mode text NOT NULL CHECK (rental_mode IN ('SHORT_STAY','LONG_TERM')),
  price_cdf bigint NOT NULL CHECK (price_cdf > 0),
  verified_until date,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL CHECK (kind IN ('IDENTITY','TITLE','MANDATE','MEDIA_CONSENT','INSPECTION_PHOTO')),
  storage_key text NOT NULL,
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  agent_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED','IN_PROGRESS','REPORT_SUBMITTED','APPROVED','NEEDS_CORRECTION')),
  outcome text CHECK (outcome IN ('PASS','PASS_WITH_DISCLOSURES','NEEDS_CORRECTION','SAFETY_CONCERN')),
  report jsonb NOT NULL DEFAULT '{}',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  client_id uuid NOT NULL REFERENCES users(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','HOST_ACCEPTED_TERMS','PAYMENT_DECLARED','CONFIRMED','CANCELLED','COMPLETED')),
  price_cdf bigint NOT NULL,
  advance_cdf bigint NOT NULL,
  hold_expires_at timestamptz,
  payment_reference text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id,idempotency_key),
  CHECK (check_out > check_in)
);
CREATE INDEX IF NOT EXISTS bookings_calendar_idx ON bookings(listing_id,check_in,check_out,status);
CREATE TABLE IF NOT EXISTS viewings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  client_id uuid NOT NULL REFERENCES users(id),
  slots jsonb NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by uuid NOT NULL REFERENCES users(id),
  listing_id uuid REFERENCES listings(id),
  booking_id uuid REFERENCES bookings(id),
  category text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES users(id),
  booking_id uuid UNIQUE REFERENCES bookings(id),
  amount_cdf bigint NOT NULL,
  status text NOT NULL DEFAULT 'DUE',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  channel text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
