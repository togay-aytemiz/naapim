-- Improve match_outcomes_by_embedding with similarity threshold and archetype filter
-- This ensures only relevant stories are matched to user questions

DROP FUNCTION IF EXISTS match_outcomes_by_embedding(extensions.vector, int, uuid);

CREATE OR REPLACE FUNCTION match_outcomes_by_embedding(
    query_embedding extensions.vector(1536),
    match_count int DEFAULT 10,
    exclude_session uuid DEFAULT NULL,
    in_archetype_id text DEFAULT NULL,
    min_similarity float DEFAULT 0.70
)
RETURNS TABLE (
    id uuid,
    outcome_type text,
    outcome_text text,
    feeling text,
    related_question text,
    is_generated boolean,
    created_at timestamptz,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.outcome_type,
        o.outcome_text,
        o.feeling,
        o.related_question,
        o.is_generated,
        o.created_at,
        1 - (o.embedding <=> query_embedding) AS similarity
    FROM outcomes o
    WHERE 
        o.embedding IS NOT NULL
        AND o.outcome_text IS NOT NULL
        AND o.outcome_text != ''
        AND o.feeling IS NOT NULL
        AND (exclude_session IS NULL OR o.session_id IS DISTINCT FROM exclude_session)
        -- NEW: Minimum similarity threshold - only return if >= 70% similar
        AND (1 - (o.embedding <=> query_embedding)) >= min_similarity
        -- NEW: Optional archetype filter for topic relevance
        AND (in_archetype_id IS NULL OR o.archetype_id = in_archetype_id)
    ORDER BY 
        o.embedding <=> query_embedding,  -- Most similar first
        o.is_generated ASC,               -- Prefer real stories
        o.created_at DESC                 -- Most recent
    LIMIT match_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION match_outcomes_by_embedding TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION match_outcomes_by_embedding IS 
'Semantic search for outcomes with minimum similarity threshold (default 70%) and optional archetype filtering. 
Returns only relevant matches to prevent unrelated stories appearing.';
