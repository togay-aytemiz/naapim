-- Add recovery_code column to outcomes table for caching LLM-generated outcomes
-- This allows fetching existing outcomes instead of regenerating on page refresh

ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- Create index for faster lookups by recovery_code
CREATE INDEX IF NOT EXISTS idx_outcomes_recovery_code ON outcomes(recovery_code);

-- Add a comment for documentation
COMMENT ON COLUMN outcomes.recovery_code IS 'Links LLM-generated outcomes to a session recovery code for caching';
