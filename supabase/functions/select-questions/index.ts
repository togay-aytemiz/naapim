import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SelectQuestionsRequest {
    user_question: string;
    archetype_label: string;
    available_fields: Array<{
        key: string;
        label: string;
        options: string[];  // Just the labels
    }>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, archetype_label, available_fields }: SelectQuestionsRequest = await req.json()

        if (!user_question || !available_fields) {
            return new Response(
                JSON.stringify({ error: 'user_question and available_fields required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // If 10 or fewer fields, return all
        if (available_fields.length <= 10) {
            return new Response(
                JSON.stringify({
                    selectedFieldKeys: available_fields.map(f => f.key),
                    reasoning: 'Using all available fields (10 or fewer)'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            return new Response(
                JSON.stringify({
                    selectedFieldKeys: available_fields.slice(0, 7).map(f => f.key),
                    reasoning: 'Fallback: no API key'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Format fields for prompt
        const fieldList = available_fields.map(f =>
            `- ${f.key}: "${f.label}" [${f.options.join(' | ')}]`
        ).join('\n')

        const systemPrompt = `You are a question selector for a decision-making app.

User's Decision: "${user_question}"
Category: ${archetype_label}

Available Questions (select 5-10 most relevant):
${fieldList}

RULES:
- Select 5-10 questions that are DIRECTLY relevant to THIS specific decision
- SKIP obvious/redundant questions
- SKIP questions where the answer is already clear from the user's question
- Choose questions that would help personalize advice

Return JSON:
{
  "selectedFieldKeys": ["field_key_1", "field_key_2", ...],
  "reasoning": "Brief 1-line explanation"
}`

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
                    { role: 'user', content: 'Select the most relevant questions for this decision.' }
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

        // Validate and ensure 5-10 keys
        const validKeys = result.selectedFieldKeys?.filter((key: string) =>
            available_fields.some(f => f.key === key)
        ) || []

        if (validKeys.length < 5) {
            for (const field of available_fields) {
                if (!validKeys.includes(field.key)) {
                    validKeys.push(field.key)
                    if (validKeys.length >= 5) break
                }
            }
        } else if (validKeys.length > 10) {
            validKeys.length = 10
        }

        return new Response(
            JSON.stringify({
                selectedFieldKeys: validKeys,
                reasoning: result.reasoning || 'Selected based on relevance'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Question selection error:', err)
        return new Response(
            JSON.stringify({
                selectedFieldKeys: [],
                reasoning: 'Fallback due to error'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
