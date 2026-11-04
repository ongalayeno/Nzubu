ALTER TABLE documents ADD COLUMN IF NOT EXISTS upload_key text;
CREATE UNIQUE INDEX IF NOT EXISTS documents_uploader_upload_key_idx ON documents(uploaded_by,upload_key) WHERE upload_key IS NOT NULL;
