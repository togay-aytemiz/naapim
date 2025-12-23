/* NeYapsam Database Schema
   Migration: 001_initial_schema
   Registry contract
   archetype_id snake_case and stable
   field_key matches registry fields.key
   option_id matches registry option_sets.options.id
   categories.field_keys order is the UI order
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'followup_event_type') THEN
    CREATE TYPE followup_event_type AS ENUM ('reminder_scheduled', 'reminder_sent', 'user_returned', 'outcome_collected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('active', 'completed', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  status session_status NOT NULL DEFAULT 'active',

  user_question TEXT NOT NULL,
  archetype_id TEXT NOT NULL,

  followup_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  recovery_code_hash TEXT,
  recovery_code_salt TEXT,

  CONSTRAINT sessions_recovery_hash_present_if_salt_present
    CHECK (recovery_code_salt IS NULL OR recovery_code_hash IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  option_id TEXT NOT NULL,

  CONSTRAINT responses_one_answer_per_field UNIQUE (session_id, field_key)
);

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  decision TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  notes TEXT,

  CONSTRAINT results_one_per_session UNIQUE (session_id)
);

CREATE TABLE IF NOT EXISTS followup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_type followup_event_type NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sessions_archetype_created ON sessions (archetype_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_followup_at ON sessions (followup_at) WHERE followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_recovery_hash ON sessions (recovery_code_hash) WHERE recovery_code_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses (session_id);
CREATE INDEX IF NOT EXISTS idx_responses_field_key ON responses (field_key);

CREATE INDEX IF NOT EXISTS idx_results_session_id ON results (session_id);

CREATE INDEX IF NOT EXISTS idx_followup_events_session_id ON followup_events (session_id);
CREATE INDEX IF NOT EXISTS idx_followup_events_type_time ON followup_events (event_type, event_at);

CREATE OR REPLACE FUNCTION set_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
CREATE TRIGGER trg_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION set_sessions_updated_at();

CREATE OR REPLACE VIEW analytics_summary AS
SELECT
  s.archetype_id,
  r.field_key,
  r.option_id,
  COUNT(*) AS response_count,
  ROUND(
    COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY s.archetype_id, r.field_key), 0),
    1
  ) AS percentage
FROM sessions s
JOIN responses r ON r.session_id = s.id
GROUP BY s.archetype_id, r.field_key, r.option_id;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_events ENABLE ROW LEVEL SECURITY;

/* Important
   We are using Edge Functions as the only write path
   Client must not have direct table access
   Service role bypasses RLS, so we keep policies closed here
*/

REVOKE ALL ON TABLE sessions FROM anon, authenticated;
REVOKE ALL ON TABLE responses FROM anon, authenticated;
REVOKE ALL ON TABLE results FROM anon, authenticated;
REVOKE ALL ON TABLE followup_events FROM anon, authenticated;

REVOKE ALL ON TABLE analytics_summary FROM anon, authenticated;