ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS review_checks jsonb;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS review_note text;
