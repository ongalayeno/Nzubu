ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS registration_codes (
  email text PRIMARY KEY,
  phone text,
  purpose text NOT NULL DEFAULT 'REGISTER' CHECK (purpose IN ('REGISTER','RESET')),
  password_hash text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);
