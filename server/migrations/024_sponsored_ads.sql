CREATE TABLE IF NOT EXISTS sponsored_ads (
  id text PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  featured_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  title text NOT NULL,
  advertiser_name text NOT NULL,
  advertiser_phone text NOT NULL,
  category text NOT NULL CHECK (category IN ('REAL_ESTATE_BOOST', 'SOLAR_ENERGY', 'SERVICES_DEMENAGEMENT', 'DECORATION_FURNITURE', 'SECURITY_AGENCY', 'LOCAL_BUSINESS')),
  format text NOT NULL CHECK (format IN ('VERTICAL_VIDEO_FEED', 'CATALOG_BANNER')),
  media_url text NOT NULL,
  thumbnail_url text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  cta_text text NOT NULL,
  cta_action_type text NOT NULL CHECK (cta_action_type IN ('WHATSAPP', 'PHONE', 'URL')),
  cta_target text NOT NULL,
  badge_label text NOT NULL DEFAULT 'Sponsorisé',
  price_paid_cdf bigint NOT NULL CHECK (price_paid_cdf >= 0),
  payment_provider text NOT NULL DEFAULT 'MAISHAPAY',
  duration_days integer NOT NULL CHECK (duration_days > 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED')),
  impressions_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsored_ads_active_idx ON sponsored_ads (status, expires_at);
