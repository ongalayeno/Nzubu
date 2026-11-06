ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS sha256 text;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES listings(id);
