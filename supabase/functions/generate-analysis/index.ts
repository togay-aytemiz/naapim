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

        const systemPrompt = `You are a decisive, opinionated, and highly practical decision-making consultant for "${archetype_label || 'general decisions'}".
        
User Question: "${user_question}"

User Context:
${context || 'No additional context provided'}

Generate a CONCISE response in strictly valid JSON:
{
  "title": "A SPECIFIC, ACTION-ORIENTED headline. Do not be vague.",
  "recommendation": "1-2 short, punchy sentences. BE DIRECT. Do not say 'it depends'. Tell them what to do.",
  "reasoning": "2-3 short sentences. Explain WHY this is the best path. Be convincing.",
  "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "pros": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cons": ["Risk 1", "Risk 2"],
  "sentiment": "positive OR cautious OR warning OR negative",
  "followup_question": "A natural conversational question to ask the user when they return",
  "specific_suggestions": [
    { "name": "Item Name", "description": "Why this specific option?" }
  ],
  "suggestion_type": "product | food | activity | travel | media | gift | other"
}

RULES:
1. **BE DIRECT & OPIMIONATED**: 
   - STOP using safe language. TAKE A STAND.
   - Use strong verbs: "Yap", "Git", "Ye", "Al", "İzle".

2. **SPECIFIC SUGGESTIONS (Crucial)**:
   You MUST provide 3-5 specific items in 'specific_suggestions' array IF the question falls into these categories:

   A. **MAJOR PURCHASES** (suggestion_type: "product"):
      - Question: "Hangi kulaklık?", "Hangi telefon?"
      - Suggest: "Sony WH-1000XM5", "iPhone 15", "Dyson V15" (REAL MODELS)

   B. **FOOD & DINING** (suggestion_type: "food"):
      - Question: "Akşama ne yesem?", "Dışarıdan ne söylesem?", "Pratik ne pişirsem?"
      - Suggest: "Lahmacun & Ayran", "Ev Yapımı Burger", "Kremalı Mantarlı Makarna", "Sushi Seti"
      - Description should be appetizing hints (e.g., "Hem doyurucu hem pratik").

   C. **ACTIVITIES** (suggestion_type: "activity"):
      - Question: "Bu akşam ne yapsam?", "Haftasonu nereye gitsem?" (General activity)
      - Suggest: "Kadıköy sahilde yürüyüş", "Yeni açılan X sergisine git", "Boğaz turu yap"

   D. **TRAVEL & PLACES** (suggestion_type: "travel"):
      - Question: "Balayı için nereye?", "Haftasonu kaçamağı?", "Yaz tatili?"
      - Suggest: "Kaş, Antalya", "Cunda Adası", "Kapadokya", "Roma, İtalya"
      - Description: Brief vibe (e.g., "Romantik ve sakin", "Macera dolu")

   E. **MEDIA & ENTERTAINMENT** (suggestion_type: "media"):
      - Question: "Hangi filmi izlesem?", "Dizi önerisi?", "Ne okusam?"
      - Suggest: "Oppenheimer", "Succession (Dizi)", "Kürk Mantolu Madonna (Kitap)"
      - Description: Genre or why (e.g., "Gerilim sevenler için", "Klasik bir eser")

   F. **GIFT IDEAS** (suggestion_type: "gift"):
      - Question: "Sevgilime ne alsam?", "Anneler günü hediyesi?"
      - Suggest: "Kişiye Özel Deri Cüzdan", "Spa Masajı Randevusu", "Analog Fotoğraf Makinesi"
      - Description: Why it fits (e.g., "Anı biriktirmeyi seviyorsa")

   - IF NO SPECIFIC CATEGORY MATCHES: Return empty array [] for 'specific_suggestions' and suggestion_type "other".

3. **STEPS LOGIC (Important)**:
   - **RETURN EMPTY ARRAY []** steps: If the decision is SIMPLE, IMPULSIVE, or PHYSICAL (e.g., "Coffee vs Tea?", "What to eat?", "Should I nap?").
     - DO NOT give stupid steps like "Go to kitchen", "Boil water". JUST RETURN EMPTY STEPS [].
   - **RETURN STRATEGIC STEPS**: If the decision is COMPLEX (e.g., "Buy car?", "Break up?", "Quit job?").
     - Steps must be STRATEGIC actions (e.g., "Check used market prices", "Update CV", "Talk to HR"), NOT physical motions.

4. **Title**: 
   - MUST be specific. 
   - BAD: "Karar Ver", "Yemek Seçimi"
   - GOOD: "Lahmacun Söyle Keyfine Bak", "Sony Kulaklığı Almalısın", "Sahilde Yürüyüşe Çık"

5. **Sentiment**:
   - "positive": Go for it! Highly recommended.
   - "cautious": Do it, but watch out for X.
   - "warning": Probably don't do it. High risk.
   - "negative": Definitely don't do it. Bad idea.

6. **Follow-up Question**:
   - MUST directly reference the user's specific question in the past tense.
`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // or gpt-5-mini if available in your env
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
                                recommendation: { type: 'string', description: '1-2 cümle net tavsiye' },
                                reasoning: { type: 'string', description: '2-3 cümle gerekçe' },
                                steps: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Maksimum 5 adım'
                                },
                                pros: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '3-5 artı madde'
                                },
                                cons: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '2-5 eksi madde'
                                },
                                sentiment: {
                                    type: 'string',
                                    enum: ['positive', 'cautious', 'warning', 'negative', 'neutral'],
                                    description: 'Genel tavsiye tonu'
                                },
                                followup_question: { type: 'string', description: 'Takip sorusu' },
                                specific_suggestions: {
                                    type: 'array',
                                    description: 'Specific suggestions for product/food/activity',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            description: { type: 'string' }
                                        },
                                        required: ['name', 'description'],
                                        additionalProperties: false
                                    }
                                },
                                suggestion_type: {
                                    type: 'string',
                                    enum: ['product', 'food', 'activity', 'travel', 'media', 'gift', 'other'],
                                    description: 'Type of suggestions provided'
                                }
                            },
                            required: ['title', 'recommendation', 'reasoning', 'steps', 'pros', 'cons', 'sentiment', 'followup_question', 'specific_suggestions', 'suggestion_type'],
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
