import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createEncodedResponse, createEncodedErrorResponse } from '../_shared/encoding.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to generate embedding
async function generateEmbedding(text: string): Promise<number[] | null> {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey || !text) return null

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000),
                dimensions: 1536
            })
        })

        if (!response.ok) return null
        const data = await response.json()
        return data.data[0]?.embedding || null
    } catch {
        return null
    }
}

// Helper to enrich stories with vote data
async function enrichStoriesWithVotes(
    supabase: any,
    stories: any[],
    sessionId?: string
): Promise<any[]> {
    if (stories.length === 0) return stories

    const outcomeIds = stories.map(s => s.id)

    // Fetch all votes for these outcomes in one query
    const { data: votes, error: votesError } = await supabase
        .from('outcome_votes')
        .select('outcome_id, vote_type, session_id')
        .in('outcome_id', outcomeIds)

    if (votesError) {
        console.error('Error fetching votes:', votesError)
        // Return stories without vote data
        return stories.map(s => ({
            ...s,
            vote_counts: { up: 0, down: 0 },
            user_vote: null
        }))
    }

    // Build vote counts map and user votes map
    const voteCounts: Record<string, { up: number; down: number }> = {}
    const userVotes: Record<string, string> = {}

    for (const id of outcomeIds) {
        voteCounts[id] = { up: 0, down: 0 }
    }

    for (const vote of votes || []) {
        if (!voteCounts[vote.outcome_id]) {
            voteCounts[vote.outcome_id] = { up: 0, down: 0 }
        }
        if (vote.vote_type === 'up') {
            voteCounts[vote.outcome_id].up++
        } else if (vote.vote_type === 'down') {
            voteCounts[vote.outcome_id].down++
        }
        // Track user's own votes
        if (sessionId && vote.session_id === sessionId) {
            userVotes[vote.outcome_id] = vote.vote_type
        }
    }

    // Enrich stories with vote data
    return stories.map(s => ({
        ...s,
        vote_counts: voteCounts[s.id] || { up: 0, down: 0 },
        user_vote: userVotes[s.id] || null
    }))
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            archetype_id,
            limit = 10,
            offset = 0,           // NEW: Pagination offset
            exclude_session_id,
            session_id,           // NEW: User's session for fetching their votes
            user_question,
            context
        } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        let stories: any[] = []
        let totalCount = 0

        // Try semantic matching first if user_question provided
        if (user_question && offset === 0) {
            const textToEmbed = context ? `${user_question} | ${context}` : user_question
            const embedding = await generateEmbedding(textToEmbed)

            if (embedding) {
                // Use improved RPC with similarity threshold and archetype filter
                const { data: semanticResults, error: rpcError } = await supabase.rpc(
                    'match_outcomes_by_embedding',
                    {
                        query_embedding: embedding,
                        match_count: limit,
                        exclude_session: exclude_session_id || null,
                        in_archetype_id: archetype_id || null,  // Filter by same archetype
                        min_similarity: 0.70                     // Only return if >= 70% similar
                    }
                )

                if (!rpcError && semanticResults && semanticResults.length > 0) {
                    console.log('🎯 Semantic matching found:', semanticResults.length, 'results (min 70% similarity)')
                    stories = semanticResults
                } else {
                    console.log('⚠️ No semantic matches above 70% threshold, falling back to archetype')
                }
            }
        }

        // Fallback to archetype matching if semantic search returned nothing
        if (stories.length === 0) {
            console.log('📋 Falling back to archetype matching, offset:', offset)

            // First get total count for pagination
            let countQuery = supabase
                .from('outcomes')
                .select('id', { count: 'exact', head: true })
                .not('outcome_text', 'is', null)
                .not('outcome_text', 'eq', '')
                .not('feeling', 'is', null)

            if (archetype_id) {
                countQuery = countQuery.eq('archetype_id', archetype_id)
            }
            if (exclude_session_id) {
                countQuery = countQuery.neq('session_id', exclude_session_id)
            }

            const { count } = await countQuery
            totalCount = count || 0

            // Then fetch with pagination
            let query = supabase
                .from('outcomes')
                .select('id, outcome_type, outcome_text, feeling, related_question, is_generated, created_at')
                .not('outcome_text', 'is', null)
                .not('outcome_text', 'eq', '')
                .not('feeling', 'is', null)
                .order('is_generated', { ascending: true })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (archetype_id) {
                query = query.eq('archetype_id', archetype_id)
            }

            if (exclude_session_id) {
                query = query.neq('session_id', exclude_session_id)
            }

            const { data: outcomes, error } = await query

            if (error) throw error

            stories = (outcomes || []).map(o => ({
                id: o.id,
                outcome_type: o.outcome_type,
                outcome_text: o.outcome_text,
                feeling: o.feeling,
                related_question: o.related_question,
                is_generated: o.is_generated,
                created_at: o.created_at
            }))
        }

        // Determine if this is a "no exact match" situation
        // Only on first page (offset 0), if semantic search was attempted but found nothing
        const noExactMatch = offset === 0 && user_question && stories.length === 0

        // Enrich stories with vote counts and user's votes
        const enrichedStories = await enrichStoriesWithVotes(
            supabase,
            stories,
            session_id || exclude_session_id
        )

        const realCount = enrichedStories.filter(s => !s.is_generated).length
        const generatedCount = enrichedStories.filter(s => s.is_generated).length
        const hasMore = offset + enrichedStories.length < totalCount

        return createEncodedResponse({
            stories: enrichedStories,
            no_exact_match: noExactMatch,
            pagination: {
                offset,
                limit,
                total: totalCount,
                has_more: hasMore,
                next_offset: hasMore ? offset + limit : null
            },
            stats: {
                total: enrichedStories.length,
                real_users: realCount,
                generated: generatedCount
            }
        }, corsHeaders)

    } catch (err) {
        console.error('Error:', err)
        return createEncodedErrorResponse('Internal server error', corsHeaders, 500)
    }
})

