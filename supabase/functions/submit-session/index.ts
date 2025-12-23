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

        // 3. Generate unique tracking code
        // Format: 8 alphanumeric characters (32^8 = ~1 trillion combinations)
        const generateUniqueCode = async (): Promise<string> => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing: 0,O,1,I
            const maxAttempts = 10;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Generate cryptographically random bytes
                const randomBytes = crypto.getRandomValues(new Uint8Array(8));
                const code = Array.from(randomBytes)
                    .map(b => chars[b % chars.length])
                    .join('');

                // Check for collision in results table
                const { data: existing } = await supabase
                    .from('results')
                    .select('id')
                    .eq('notes', code)
                    .maybeSingle();

                if (!existing) {
                    return code; // Unique code found
                }
                console.warn(`Code collision attempt ${attempt + 1}: ${code}`);
            }

            // Fallback: use timestamp + random
            const ts = Date.now().toString(36).toUpperCase().slice(-8);
            return ts.padStart(8, 'X');
        };

        const code = await generateUniqueCode();

        const { error: resultError } = await supabase
            .from('results')
            .insert({
                session_id: session.id,
                decision: 'Analiz tamamlandı',
                confidence_score: 5,
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
