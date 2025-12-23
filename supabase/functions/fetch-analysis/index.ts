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
        const { code } = await req.json()

        if (!code) {
            return new Response(
                JSON.stringify({ error: 'Code is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Find the result by code (stored in notes column) - includes analysis_json
        const { data: resultData, error: resultError } = await supabase
            .from('results')
            .select('session_id, analysis_json')
            .eq('notes', code)
            .single()

        if (resultError || !resultData) {
            return new Response(
                JSON.stringify({ error: 'Session not found for code', code }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Now fetch the session for user_question and archetype_id
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('id, user_question, archetype_id')
            .eq('id', resultData.session_id)
            .single()

        if (sessionError || !sessionData) {
            return new Response(
                JSON.stringify({ error: 'Session data not found', session_id: resultData.session_id }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch responses for this session
        const { data: responsesData } = await supabase
            .from('responses')
            .select('field_key, option_id')
            .eq('session_id', resultData.session_id)

        // Convert responses to answers object
        const answers: Record<string, string> = {}
        if (responsesData) {
            for (const r of responsesData) {
                answers[r.field_key] = r.option_id
            }
        }

        // Fetch previous outcomes for this session (newest first)
        const { data: outcomesData } = await supabase
            .from('outcomes')
            .select('id, outcome_type, outcome_text, feeling, created_at')
            .eq('session_id', resultData.session_id)
            .order('created_at', { ascending: false })

        return new Response(
            JSON.stringify({
                session_id: sessionData.id,
                code: code,
                user_question: sessionData.user_question,
                archetype_id: sessionData.archetype_id,
                answers: answers,
                analysis: resultData.analysis_json || null,
                previous_outcomes: outcomesData || []
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
