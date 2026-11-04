ALTER TABLE missions ADD COLUMN IF NOT EXISTS report_key text;
CREATE UNIQUE INDEX IF NOT EXISTS missions_agent_report_key_idx ON missions(agent_id,report_key) WHERE report_key IS NOT NULL;
