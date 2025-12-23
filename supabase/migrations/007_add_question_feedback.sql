-- Question Feedback table for tracking LLM-selected question relevance
CREATE TABLE IF NOT EXISTS question_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    archetype_id TEXT NOT NULL,
    field_key TEXT NOT NULL,
    feedback TEXT NOT NULL CHECK (feedback IN ('helpful', 'not_helpful')),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- One feedback per session per field
    CONSTRAINT question_feedback_unique UNIQUE (session_id, field_key)
);

-- Index for analytics queries by archetype
CREATE INDEX IF NOT EXISTS idx_question_feedback_archetype 
ON question_feedback (archetype_id, field_key);

-- RLS and permissions
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE question_feedback FROM anon, authenticated;

-- Comment
COMMENT ON TABLE question_feedback IS 'User feedback on LLM-selected questions to improve question relevance over time';
