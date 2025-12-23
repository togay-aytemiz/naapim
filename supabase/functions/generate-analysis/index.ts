import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
    user_question: string;
    context: string;  // Pre-formatted question-answer context
    archetype_label: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, context, archetype_label }: AnalysisRequest = await req.json()

        if (!user_question) {
            return new Response(
                JSON.stringify({ error: 'user_question is required' }),
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

        const systemPrompt = `You are a wise, empathetic decision-making consultant for "${archetype_label || 'general decisions'}".

User Question: "${user_question}"

User Context:
${context || 'No additional context provided'}

Generate a CONCISE response in strictly valid JSON:
{
  "title": "A SPECIFIC headline that summarizes your main advice for THIS exact situation (not generic)",
  "recommendation": "1-2 short sentences. Direct advice.",
  "reasoning": "2-3 short sentences max. Reference their specific situation.",
  "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "sentiment": "positive | cautious | warning | negative | neutral",
  "followup_question": "A natural conversational question to ask the user when they return, asking if they made a decision or took action. This should be specific to their situation."
}

RULES:
- title: MUST be specific to the user's situation. Reference the actual topic.
  BAD examples (too generic): "Planla ve Harekete Geç", "Dikkatli Ol", "Karar Ver"
  GOOD examples (specific): "Kreşe Aşamalı Geçiş Yapın", "İlk Birkaç Hafta Yarım Gün Deneyin", "Yeni İş İçin Risk Analizi Şart", "Ev Taşınmadan Önce Bütçe Oluşturun"
  The title should tell the user WHAT to do, not just HOW to approach it.
- Maximum 5 steps, each step 5-10 words only
- Keep reasoning very brief (2-3 sentences)
- Everything in Turkish
- Focus on actionable, practical advice
- sentiment: Choose based on overall tone of advice:
  - "positive" = encouraging, optimistic (e.g., "go for it")
  - "cautious" = proceed carefully (e.g., "consider first")
  - "warning" = significant risks (e.g., "think twice")
  - "negative" = advise against (e.g., "don't do it")
  - "neutral" = balanced, no strong direction
- followup_question: MUST be a short, conversational question in Turkish.
  Example for "Çocuğumu kreşe vereyim mi?": "Kreşe vermeye karar verdin mi? Ya da vermeye başladın mı?"
  Example for "İşimi değiştireyim mi?": "İşini değiştirmeye karar verdin mi?"
`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Lütfen "${user_question}" sorusunu analiz et ve JSON formatında yanıt ver.` }
                ],
                response_format: { type: 'json_object' }
            })
        })

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text()
            console.error('OpenAI API error:', errorText)
            throw new Error('Failed to generate analysis')
        }

        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0]?.message?.content

        if (!content) {
            throw new Error('No content in response')
        }

        const result = JSON.parse(content)
        console.log('📊 Analysis generated:', result.title)

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({
                error: 'Failed to generate analysis',
                // Fallback result
                title: "Analiz Oluşturulamadı",
                recommendation: "Şu anda teknik bir sorun nedeniyle detaylı analiz hazırlayamadık.",
                reasoning: "Lütfen daha sonra tekrar deneyiniz.",
                steps: ["Sayfayı yenile", "Tekrar dene"],
                sentiment: "neutral"
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
