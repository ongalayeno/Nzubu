ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS low_storage_key text;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS duration_seconds numeric;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS height integer;
