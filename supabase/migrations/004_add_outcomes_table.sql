/* NeYapsam Database Migration
   Migration: 004_add_outcomes_table
   Stores user decisions and stories when they return
*/

-- Create outcomes table to track user decisions over time
CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,  -- NULL for generated outcomes
    outcome_type TEXT NOT NULL CHECK (outcome_type IN ('decided', 'thinking', 'cancelled')),
    outcome_text TEXT,
    feeling TEXT CHECK (feeling IS NULL OR feeling IN ('happy', 'neutral', 'regret', 'uncertain')),
    related_question TEXT,  -- For generated outcomes: similar question to original
    archetype_id TEXT,  -- For matching with similar questions
    is_generated BOOLEAN DEFAULT FALSE,  -- TRUE for LLM-generated seeded content
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add new columns if they don't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outcomes' AND column_name = 'feeling'
    ) THEN
        ALTER TABLE outcomes ADD COLUMN feeling TEXT CHECK (feeling IS NULL OR feeling IN ('happy', 'neutral', 'regret', 'uncertain'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outcomes' AND column_name = 'is_generated'
    ) THEN
        ALTER TABLE outcomes ADD COLUMN is_generated BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outcomes' AND column_name = 'related_question'
    ) THEN
        ALTER TABLE outcomes ADD COLUMN related_question TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outcomes' AND column_name = 'archetype_id'
    ) THEN
        ALTER TABLE outcomes ADD COLUMN archetype_id TEXT;
    END IF;
    
    -- Make session_id nullable for generated outcomes
    ALTER TABLE outcomes ALTER COLUMN session_id DROP NOT NULL;
END $$;

-- Index for faster queries by session
CREATE INDEX IF NOT EXISTS idx_outcomes_session_id ON outcomes(session_id);

-- Index for finding outcomes by type (for showing similar stories)
CREATE INDEX IF NOT EXISTS idx_outcomes_type ON outcomes(outcome_type);

-- Index for finding recent outcomes
CREATE INDEX IF NOT EXISTS idx_outcomes_created_at ON outcomes(created_at DESC);

-- Index for finding generated vs real outcomes
CREATE INDEX IF NOT EXISTS idx_outcomes_is_generated ON outcomes(is_generated);

-- Index for archetype matching
CREATE INDEX IF NOT EXISTS idx_outcomes_archetype_id ON outcomes(archetype_id);

-- Enable RLS
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Allow anonymous insert" ON outcomes;
DROP POLICY IF EXISTS "Allow anonymous read" ON outcomes;

-- Allow anonymous inserts (users can share their outcomes)
CREATE POLICY "Allow anonymous insert" ON outcomes
    FOR INSERT
    WITH CHECK (true);

-- Allow reading decided outcomes for community stories
CREATE POLICY "Allow anonymous read" ON outcomes
    FOR SELECT
    USING (true);

COMMENT ON TABLE outcomes IS 'Stores user decisions and stories when they return with their recovery code';
COMMENT ON COLUMN outcomes.outcome_type IS 'decided = made a decision, thinking = still considering, cancelled = gave up';
COMMENT ON COLUMN outcomes.outcome_text IS 'User-written story about their decision (shown anonymously to others)';
COMMENT ON COLUMN outcomes.feeling IS 'User feeling about their decision: happy, neutral, regret, uncertain';
COMMENT ON COLUMN outcomes.is_generated IS 'TRUE for LLM-generated seeded content, FALSE for real user submissions';
COMMENT ON COLUMN outcomes.related_question IS 'For generated outcomes: a similar question to the original user question';
COMMENT ON COLUMN outcomes.archetype_id IS 'Archetype ID for matching similar questions';
