import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
    text: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text }: EmbeddingRequest = await req.json()

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'text is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            console.error('OPENAI_API_KEY not found')
            return new Response(
                JSON.stringify({ error: 'API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Call OpenAI Embeddings API
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000), // Limit to ~8K chars
                dimensions: 1536
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenAI Embeddings API error:', errorText)
            throw new Error('Failed to generate embedding')
        }

        const data = await response.json()
        const embedding = data.data[0]?.embedding

        if (!embedding) {
            throw new Error('No embedding in response')
        }

        console.log('🧠 Generated embedding, dimension:', embedding.length)

        return new Response(
            JSON.stringify({ embedding }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to generate embedding' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
