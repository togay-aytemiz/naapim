-- Migration: Add embedding support for semantic matching
-- Requires: pgvector extension enabled in Supabase Dashboard

-- Add embedding column to outcomes table using extensions.vector type
ALTER TABLE outcomes 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- Add embedding column to sessions table (for matching on return)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- Create index for fast similarity search on outcomes
-- Using ivfflat for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS outcomes_embedding_idx 
ON outcomes 
USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);

-- Create index for sessions embedding
CREATE INDEX IF NOT EXISTS sessions_embedding_idx 
ON sessions 
USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);

-- Add comment explaining the embedding column
COMMENT ON COLUMN outcomes.embedding IS 'OpenAI text-embedding-3-small vector (1536 dims) for semantic matching of question+context';
COMMENT ON COLUMN sessions.embedding IS 'OpenAI text-embedding-3-small vector (1536 dims) for semantic matching';

