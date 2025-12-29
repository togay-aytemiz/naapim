import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createEncodedResponse, createEncodedErrorResponse } from '../_shared/encoding.ts'

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
            return createEncodedErrorResponse('Code is required', corsHeaders, 400)
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
            return createEncodedErrorResponse('Session not found for code: ' + code, corsHeaders, 404)
        }

        // Now fetch the session for user_question, archetype_id, and created_at
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('id, user_question, archetype_id, created_at')
            .eq('id', resultData.session_id)
            .single()

        if (sessionError || !sessionData) {
            return createEncodedErrorResponse('Session data not found: ' + resultData.session_id, corsHeaders, 404)
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

        // Check if reminder exists for this code
        const { count: reminderCount } = await supabase
            .from('email_reminders')
            .select('*', { count: 'exact', head: true })
            .eq('code', code)

        return createEncodedResponse({
            session_id: sessionData.id,
            code: code,
            user_question: sessionData.user_question,
            archetype_id: sessionData.archetype_id,
            created_at: sessionData.created_at,
            has_reminder: (reminderCount || 0) > 0,
            answers: answers,
            analysis: resultData.analysis_json || null,
            previous_outcomes: outcomesData || []
        }, corsHeaders)

    } catch (err) {
        console.error('Error:', err)
        return createEncodedErrorResponse('Internal server error: ' + String(err), corsHeaders, 500)
    }
})
