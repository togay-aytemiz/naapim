-- Create RPC function for vector similarity search on outcomes
CREATE OR REPLACE FUNCTION match_outcomes_by_embedding(
    query_embedding extensions.vector(1536),
    match_count int DEFAULT 10,
    exclude_session uuid DEFAULT NULL
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
    ORDER BY 
        o.embedding <=> query_embedding,  -- Most similar first
        o.is_generated ASC,               -- Prefer real stories
        o.created_at DESC                 -- Most recent
    LIMIT match_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION match_outcomes_by_embedding TO service_role;
