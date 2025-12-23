-- Seed archetypes from registry/archetypes.json
-- These must exist before sessions can be created with valid archetype_id

-- First, create the archetypes table if it doesn't exist
CREATE TABLE IF NOT EXISTS archetypes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    default_followup_days INTEGER NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant service role access (Edge Functions use service role)
REVOKE ALL ON TABLE archetypes FROM anon, authenticated;

-- Insert seed data
INSERT INTO archetypes (id, label, default_followup_days)
VALUES 
    ('career_decisions', 'Kariyer ve iş', 30),
    ('parenting_decisions', 'Ebeveynlik ve çocuk', 14),
    ('relationship_decisions', 'İlişki kararları', 21),
    ('money_finance', 'Finansal kararlar', 30)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    default_followup_days = EXCLUDED.default_followup_days;
