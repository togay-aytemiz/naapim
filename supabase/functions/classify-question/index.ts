import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassifyRequest {
    user_question: string;
    archetypes: Array<{
        id: string;
        label: string;
        routing_hints: {
            definition: string;
            keywords: string[];
            positive_examples: string[];
            negative_examples: string[];
            exclusions: string[];
        };
    }>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, archetypes }: ClassifyRequest = await req.json()

        if (!user_question || !archetypes) {
            return new Response(
                JSON.stringify({ error: 'user_question and archetypes required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            return new Response(
                JSON.stringify({ archetype_id: archetypes[0]?.id || 'career_decisions', confidence: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate system prompt
        let systemPrompt = `You are an expert decision-making assistant. Your goal is to classify a user's question into one of the following archetypes based on their specific needs and context.\n\n`
        systemPrompt += `Analyze the user's input carefully and select the most appropriate 'id' from the list below.\n`
        systemPrompt += `Return JSON: { "archetype_id": "string", "confidence": number (0.0-1.0) }\n\n`
        systemPrompt += `Archetypes:\n`

        archetypes.forEach(arch => {
            systemPrompt += `--- ${arch.label} (ID: ${arch.id}) ---\n`
            systemPrompt += `Definition: ${arch.routing_hints.definition}\n`
            systemPrompt += `Keywords: ${arch.routing_hints.keywords.join(', ')}\n`
            systemPrompt += `Examples: ${arch.routing_hints.positive_examples.join(', ')}\n`
            systemPrompt += `Exclusions: ${arch.routing_hints.exclusions.join(', ')}\n\n`
        })

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: user_question }
                ],
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content
        const result = JSON.parse(content || '{}')

        return new Response(
            JSON.stringify({
                archetype_id: result.archetype_id || archetypes[0]?.id,
                confidence: result.confidence || 0
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Classification error:', err)
        return new Response(
            JSON.stringify({ archetype_id: 'career_decisions', confidence: 0 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
