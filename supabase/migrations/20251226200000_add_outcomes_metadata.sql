-- Add metadata column to outcomes table if it doesn't exist
-- This stores structured data: persona, options_considered, constraints, trigger, tradeoffs, what_happened_after

ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN outcomes.metadata IS 'Structured data from seeded outcomes: persona, options_considered, constraints, trigger, tradeoffs, what_happened_after';
