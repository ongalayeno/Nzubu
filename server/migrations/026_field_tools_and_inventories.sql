ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS snel_meter_number text,
  ADD COLUMN IF NOT EXISTS snel_meter_index text,
  ADD COLUMN IF NOT EXISTS regideso_pressure_bar numeric,
  ADD COLUMN IF NOT EXISTS outage_tracker jsonb,
  ADD COLUMN IF NOT EXISTS agent_signature jsonb,
  ADD COLUMN IF NOT EXISTS sha256_seal text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

CREATE TABLE IF NOT EXISTS property_inventories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_type text NOT NULL CHECK (inventory_type IN ('ENTRY', 'EXIT')),
  tenant_name text NOT NULL,
  snel_index text,
  regideso_pressure text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  sha256_seal text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_inventories_listing_idx ON property_inventories (listing_id, created_at DESC);
