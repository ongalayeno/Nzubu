CREATE TABLE IF NOT EXISTS case_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  lease_application_id uuid REFERENCES lease_applications(id),
  kind text NOT NULL CHECK (kind IN ('PAYMENT_RECEIPT','REFUND_RECEIPT','SIGNED_LEASE')),
  storage_key text NOT NULL,
  mime text NOT NULL CHECK (mime IN ('application/pdf','image/png','image/jpeg')),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((booking_id IS NOT NULL)::int + (lease_application_id IS NOT NULL)::int = 1)
);
CREATE INDEX IF NOT EXISTS case_evidence_booking_idx ON case_evidence(booking_id);
CREATE INDEX IF NOT EXISTS case_evidence_lease_idx ON case_evidence(lease_application_id);
