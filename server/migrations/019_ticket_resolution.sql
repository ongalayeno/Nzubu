ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);
