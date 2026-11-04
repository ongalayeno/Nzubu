ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_terms jsonb NOT NULL DEFAULT '{"fullRefundBeforeHours":72,"halfRefundBeforeHours":24}'::jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_due_cdf bigint;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status text CHECK (refund_status IN ('PENDING_PARTNER','CONFIRMED_BY_PARTNER','NOT_APPLICABLE'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reference text;
