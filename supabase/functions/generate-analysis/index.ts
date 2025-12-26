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
                temperature: 0.7,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
  "sentiment": "positive OR cautious OR warning OR negative OR neutral",
  "followup_question": "A natural conversational question to ask the user when they return"
}

RULES:
- title: MUST be specific to the user's situation. Reference the actual topic.
  BAD examples (too generic): "Planla ve Harekete Geç", "Dikkatli Ol", "Karar Ver"
  GOOD examples (specific): "Kreşe Aşamalı Geçiş Yapın", "Yeni İş İçin Teklifi Değerlendir", "Ev Taşınmadan Önce Bütçe Oluşturun"
- Maximum 5 steps, each 5-10 words
- Everything in Turkish
- sentiment: YOU MUST CHOOSE THE MOST APPROPRIATE ONE:
  - "positive" = you actively ENCOURAGE them to do it. Use for: good opportunities, low risk, clear benefits
  - "cautious" = you say "do it but carefully". Use for: some risks but worth considering
  - "warning" = you have SERIOUS concerns. Use for: significant financial/health/relationship risks
  - "negative" = you ADVISE AGAINST it. Use for: clearly bad idea, high risk, low reward
  - "neutral" = truly balanced, no recommendation either way
  
  DO NOT always choose "cautious" - read the context and choose appropriately!
  If the user seems excited and the situation is reasonable, use "positive".
  
- followup_question: CRITICAL - This MUST directly reference the user's original question: "${user_question}"
  Transform their question into a past-tense follow-up about their decision.
  
  TRANSFORMATION RULE: Take the core topic from their question and ask if they did it.
  - User asked "Bu haftasonu ne yapsam?" → followup: "Haftasonu ne yapmaya karar verdin?"
  - User asked "Araba almalı mıyım?" → followup: "Araba almaya karar verdin mi?"
  - User asked "Yazılım kursuna gitmeli miyim?" → followup: "Yazılım kursuna gitmeye karar verdin mi?"
  - User asked "Taşınmalı mıyım?" → followup: "Taşınmaya karar verdin mi?"
  
  NEVER ask about something NOT mentioned in the original question!
  The follow-up should feel like a friend checking in about the EXACT thing they asked.
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
                temperature: 0.7,
                max_tokens: 1500,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'analysis_response',
                        strict: true,
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', description: 'Spesifik başlık' },
                                recommendation: { type: 'string', description: '1-2 cümle tavsiye' },
                                reasoning: { type: 'string', description: '2-3 cümle gerekçe' },
                                steps: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Maksimum 5 adım'
                                },
                                sentiment: {
                                    type: 'string',
                                    enum: ['positive', 'cautious', 'warning', 'negative', 'neutral'],
                                    description: 'Genel tavsiye tonu'
                                },
                                followup_question: { type: 'string', description: 'Takip sorusu' }
                            },
                            required: ['title', 'recommendation', 'reasoning', 'steps', 'sentiment', 'followup_question'],
                            additionalProperties: false
                        }
                    }
                }
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
