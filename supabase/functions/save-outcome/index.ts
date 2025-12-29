import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { createEncodedResponse, createEncodedErrorResponse } from '../_shared/encoding.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveOutcomeRequest {
    session_id: string;
    outcome_type: 'decided' | 'thinking' | 'cancelled';
    outcome_text?: string;
    feeling?: 'happy' | 'neutral' | 'regret' | 'uncertain';
    archetype_id?: string;
}

// Helper function to generate embedding
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
    } catch (err) {
        console.error('Embedding generation failed:', err)
        return null
    }
}

serve(async (req) => {
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
            return createEncodedErrorResponse('Missing required fields: session_id, outcome_type', corsHeaders, 400)
        }

        if (!['decided', 'thinking', 'cancelled'].includes(outcome_type)) {
            return createEncodedErrorResponse('Invalid outcome_type', corsHeaders, 400)
        }

        if (feeling && !['happy', 'neutral', 'regret', 'uncertain'].includes(feeling)) {
            return createEncodedErrorResponse('Invalid feeling', corsHeaders, 400)
        }

        // Fetch session to get user_question, archetype_id, and responses for context
        let finalArchetypeId = archetype_id;
        let relatedQuestion: string | null = null;
        let contextForEmbedding = '';

        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('user_question, archetype_id')
            .eq('id', session_id)
            .single()

        if (!sessionError && sessionData) {
            relatedQuestion = sessionData.user_question;
            contextForEmbedding = sessionData.user_question || '';
            if (!finalArchetypeId) {
                finalArchetypeId = sessionData.archetype_id;
            }
        }

        // Fetch responses to build richer context for embedding
        const { data: responses } = await supabase
            .from('responses')
            .select('field_key, value')
            .eq('session_id', session_id)

        if (responses && responses.length > 0) {
            const responseContext = responses.map(r => `${r.field_key}: ${r.value}`).join(', ')
            contextForEmbedding += ` | ${responseContext}`
        }

        // Generate embedding for semantic matching
        console.log('🧠 Generating embedding for:', contextForEmbedding.substring(0, 100) + '...')
        const embedding = await generateEmbedding(contextForEmbedding)

        // Insert the outcome with embedding
        const { data, error: insertError } = await supabase
            .from('outcomes')
            .insert({
                session_id,
                outcome_type,
                outcome_text: outcome_text || null,
                feeling: feeling || null,
                archetype_id: finalArchetypeId || null,
                related_question: relatedQuestion,
                is_generated: false,
                embedding: embedding  // NEW: Store embedding
            })
            .select('id, created_at')
            .single()

        if (insertError) {
            console.error('Failed to save outcome:', insertError)
            throw insertError
        }

        return createEncodedResponse({
            success: true,
            outcome_id: data.id,
            created_at: data.created_at,
            has_embedding: !!embedding,
            message: 'Outcome saved successfully'
        }, corsHeaders)

    } catch (error) {
        console.error('Save outcome error:', error)
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        return createEncodedErrorResponse(errorMessage, corsHeaders, 500)
    }
})
