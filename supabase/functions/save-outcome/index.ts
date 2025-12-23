import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveOutcomeRequest {
    session_id: string;
    outcome_type: 'decided' | 'thinking' | 'cancelled';
    outcome_text?: string;
    feeling?: 'happy' | 'neutral' | 'regret' | 'uncertain';
    archetype_id?: string;  // NEW: for matching similar questions
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { session_id, outcome_type, outcome_text, feeling, archetype_id }: SaveOutcomeRequest = await req.json()

        if (!session_id || !outcome_type) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: session_id, outcome_type' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Validate outcome_type
        if (!['decided', 'thinking', 'cancelled'].includes(outcome_type)) {
            return new Response(
                JSON.stringify({ error: 'Invalid outcome_type. Must be: decided, thinking, or cancelled' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Validate feeling if provided
        if (feeling && !['happy', 'neutral', 'regret', 'uncertain'].includes(feeling)) {
            return new Response(
                JSON.stringify({ error: 'Invalid feeling. Must be: happy, neutral, regret, or uncertain' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Fetch session to get user_question and archetype_id if not provided
        let finalArchetypeId = archetype_id;
        let relatedQuestion: string | null = null;

        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('user_question, archetype_id')
            .eq('id', session_id)
            .single()

        if (!sessionError && sessionData) {
            relatedQuestion = sessionData.user_question;
            if (!finalArchetypeId) {
                finalArchetypeId = sessionData.archetype_id;
            }
        }

        // Insert the outcome with all fields
        const { data, error: insertError } = await supabase
            .from('outcomes')
            .insert({
                session_id,
                outcome_type,
                outcome_text: outcome_text || null,
                feeling: feeling || null,
                archetype_id: finalArchetypeId || null,
                related_question: relatedQuestion,
                is_generated: false  // Real user outcome
            })
            .select('id, created_at')
            .single()

        if (insertError) {
            console.error('Failed to save outcome:', insertError)
            throw insertError
        }

        return new Response(
            JSON.stringify({
                success: true,
                outcome_id: data.id,
                created_at: data.created_at,
                message: 'Outcome saved successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Save outcome error:', error)
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})

