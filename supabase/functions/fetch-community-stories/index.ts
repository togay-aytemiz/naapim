import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            archetype_id,
            limit = 10,
            exclude_session_id,
            user_question,  // NEW: For semantic matching
            context         // NEW: Question + answers for better matching
        } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        let stories: any[] = []

        // Try semantic matching first if user_question provided
        if (user_question) {
            const textToEmbed = context ? `${user_question} | ${context}` : user_question
            const embedding = await generateEmbedding(textToEmbed)

            if (embedding) {
                // Use vector similarity search with RPC function
                const { data: semanticResults, error: rpcError } = await supabase.rpc(
                    'match_outcomes_by_embedding',
                    {
                        query_embedding: embedding,
                        match_count: limit,
                        exclude_session: exclude_session_id || null
                    }
                )

                if (!rpcError && semanticResults && semanticResults.length > 0) {
                    console.log('🎯 Semantic matching found:', semanticResults.length, 'results')
                    stories = semanticResults
                }
            }
        }

        // Fallback to archetype matching if semantic search returned nothing
        if (stories.length === 0) {
            console.log('📋 Falling back to archetype matching')
            let query = supabase
                .from('outcomes')
                .select('id, outcome_type, outcome_text, feeling, related_question, is_generated, created_at')
                .not('outcome_text', 'is', null)
                .not('outcome_text', 'eq', '')
                .not('feeling', 'is', null)
                .order('is_generated', { ascending: true })
                .order('created_at', { ascending: false })
                .limit(limit)

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

        const realCount = stories.filter(s => !s.is_generated).length
        const generatedCount = stories.filter(s => s.is_generated).length

        return new Response(
            JSON.stringify({
                stories,
                stats: {
                    total: stories.length,
                    real_users: realCount,
                    generated: generatedCount
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error', stories: [] }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
