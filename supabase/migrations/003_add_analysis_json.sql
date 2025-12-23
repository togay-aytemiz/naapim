/* NeYapsam Database Migration
   Migration: 003_add_analysis_json
   Adds JSONB column to store LLM-generated analysis
*/

ALTER TABLE results ADD COLUMN IF NOT EXISTS analysis_json JSONB;

-- Update existing rows to have empty JSON object if needed
UPDATE results SET analysis_json = '{}' WHERE analysis_json IS NULL;

COMMENT ON COLUMN results.analysis_json IS 'Stores the LLM-generated analysis including title, recommendation, reasoning, and steps';
