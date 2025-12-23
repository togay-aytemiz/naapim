import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { archetype_id, limit = 10, exclude_session_id } = await req.json()

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Build query - now using archetype_id column directly on outcomes table
        let query = supabase
            .from('outcomes')
            .select('id, outcome_type, outcome_text, feeling, related_question, is_generated, created_at')
            .not('outcome_text', 'is', null)
            .not('outcome_text', 'eq', '')
            .not('feeling', 'is', null)  // Only include ones with feeling
            .order('is_generated', { ascending: true })  // Real stories first
            .order('created_at', { ascending: false })
            .limit(limit)

        // Filter by archetype if provided
        if (archetype_id) {
            query = query.eq('archetype_id', archetype_id)
        }

        // Exclude current user's session
        if (exclude_session_id) {
            query = query.neq('session_id', exclude_session_id)
        }

        const { data: outcomes, error } = await query

        if (error) {
            console.error('Error fetching community stories:', error)
            throw error
        }

        // Transform data - hide session info, show relevant fields
        const stories = (outcomes || []).map(o => ({
            id: o.id,
            outcome_type: o.outcome_type,
            outcome_text: o.outcome_text,
            feeling: o.feeling,
            related_question: o.related_question,
            is_generated: o.is_generated,
            created_at: o.created_at
        }))

        // Stats for analytics
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

