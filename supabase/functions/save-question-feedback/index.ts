import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedbackRequest {
    session_id?: string | null;  // Optional - may not exist during question flow
    archetype_id: string;
    field_key: string;
    feedback: 'helpful' | 'not_helpful';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { session_id, archetype_id, field_key, feedback }: FeedbackRequest = await req.json()

        // session_id is optional, but other fields are required
        if (!archetype_id || !field_key || !feedback) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!['helpful', 'not_helpful'].includes(feedback)) {
            return new Response(
                JSON.stringify({ error: 'Invalid feedback value' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Upsert feedback (update if exists, insert if not)
        const { error } = await supabase
            .from('question_feedback')
            .upsert({
                session_id,
                archetype_id,
                field_key,
                feedback
            }, {
                onConflict: 'session_id,field_key'
            })

        if (error) {
            console.error('Error saving feedback:', error)
            throw error
        }

        console.log(`📊 Feedback saved: ${field_key} = ${feedback}`)

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to save feedback' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
