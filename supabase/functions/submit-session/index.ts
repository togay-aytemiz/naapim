// Supabase Edge Function: submit-session
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_question, answers, archetype_id } = await req.json()

        if (!user_question) {
            throw new Error('Missing user_question')
        }

        // 1. Create Session
        // Use archetype_id from frontend, fallback to career_decisions if missing
        const safeArchetypeId = archetype_id || 'career_decisions';

        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                user_question,
                archetype_id: safeArchetypeId,
                status: 'active'
            })
            .select('id')
            .single()

        if (sessionError) throw sessionError

        // 2. Create Responses
        // Handle answers as Record<string, string> (field_key -> option_id)
        let responseInserts = [];

        console.log('Processing answers:', JSON.stringify(answers));

        if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
            responseInserts = Object.entries(answers).map(([field_key, option_id]) => ({
                session_id: session.id,
                field_key,
                option_id
            }));
        } else if (Array.isArray(answers)) {
            // Fallback for legacy array format if any
            responseInserts = answers.map((ans: any, index: number) => ({
                session_id: session.id,
                field_key: ans.field_key || `q_${index}`,
                option_id: ans.option_id || `opt_${index}`
            }));
        }

        console.log('Prepared inserts:', JSON.stringify(responseInserts));

        if (responseInserts.length > 0) {
            const { error: responseError } = await supabase
                .from('responses')
                .insert(responseInserts)

            if (responseError) {
                console.error('Response insert error:', responseError);
                throw responseError
            }
        }

        // 3. Create Result (Placeholder code generation)
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase()
        const code = `NY-${archetype_id ? archetype_id.substring(0, 3).toUpperCase() : 'GEN'}-${randomSuffix}`

        const { error: resultError } = await supabase
            .from('results')
            .insert({
                session_id: session.id,
                decision: 'Analiz tamamlandı',
                confidence_score: 5, // Must be 1-10 per DB constraint
                notes: code
            })

        if (resultError) throw resultError

        return new Response(
            JSON.stringify({
                success: true,
                session_id: session.id,
                code: code
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Submit session error:', error)
        // Stringify the full error for debugging
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            // Supabase errors are often objects with 'message', 'code', 'details'
            errorMessage = JSON.stringify(error);
        }
        return new Response(
            JSON.stringify({ error: errorMessage, raw: JSON.stringify(error) }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
