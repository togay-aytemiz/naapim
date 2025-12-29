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
  "alternatives": [
    { "name": "Alternative Option Name", "description": "Brief reason why this could also work" }
  ],
  "pros": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cons": ["Risk 1", "Risk 2"],
  "sentiment": "positive OR cautious OR warning OR negative",
  "decision_score": 75,
  "score_label": "Olumlu Yaklaşım",
  "metre_left_label": "YAPMA",
  "metre_right_label": "YAP",
  "ranked_options": [
    { "name": "Seçenek A", "fit_score": 88, "reason": "Neden en uygun olduğunu anlatan kısa açıklama." },
    { "name": "Seçenek B", "fit_score": 65, "reason": "" },
    { "name": "Seçenek C", "fit_score": 45, "reason": "" }
  ],
  "timing_recommendation": "6_months",
  "timing_reason": "Piyasa koşulları iyileşiyor, 6 ay içinde hareket etmek optimal.",
  "timing_alternatives": [
    { "label": "Hemen", "value": "now", "fit_score": 40 },
    { "label": "6 Ay İçinde", "value": "6_months", "fit_score": 85 },
    { "label": "1 Yıl Sonra", "value": "1_year", "fit_score": 60 }
  ],
  "followup_question": "A natural conversational question to ask the user when they return",
  "specific_suggestions": [
    { "name": "Item Name", "description": "Why this specific option?" }
  ],
  "suggestion_type": "product | food | activity | travel | media | gift | other",
  "method_steps": [
    { "title": "Keşif", "description": "Yakınındaki kort ve kulüpleri incele.", "icon": "search" },
    { "title": "Deneme", "description": "Ücretsiz derslere katıl.", "icon": "users" },
    { "title": "Ekipman", "description": "Başlangıç seviyesi raket edin.", "icon": "package" },
    { "title": "Rutin", "description": "Haftalık pratik planı oluştur.", "icon": "calendar" }
  ],
  "method_summary": "Sıfırdan başlarken önce dene sonra yatırım yap yöntemi en sürdürülebilir yaklaşımdır."
}

RULES:
1. **BE DIRECT & OPIMIONATED**: 
   - STOP using safe language. TAKE A STAND.
   - Use strong verbs: "Yap", "Git", "Ye", "Al", "İzle".
   - **NEVER assume user's city or location.** Do NOT use specific neighborhood names (Kadıköy, Beşiktaş, etc.).
     Instead, use generic phrases like "yakınındaki bir sahil", "şehrindeki bir park", "evine yakın bir cafe".

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
      - Suggest: "Yakınındaki sahilde yürüyüş", "Şehirdeki bir sergiye git", "Doğa yürüyüşü yap"
      - DO NOT assume user's city. Use generic location phrases.

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

3. **ALTERNATIVES (CRITICAL for "ne yapayım" questions)**:
   - ALWAYS provide 2-4 alternative options in 'alternatives' array, EVEN when you make a strong recommendation.
   - User asked "ne yapayım?", "ne yesem?", "nereye gitsem?", "hangisini seçsem?" → MUST have alternatives.
   - Each alternative should be different from your main recommendation.
   - Example for "Akşama ne yesem?":
     Main: Kremalı Mantarlı Makarna
     Alternatives: [{"name": "Ev Yapımı Burger", "description": "Daha doyurucu bir seçenek"}, {"name": "Tavuklu Salata", "description": "Hafif ve sağlıklı"}, {"name": "Sipariş Ver: Pizza", "description": "Hiç uğraşmak istemiyorsan"}]
   - Even for binary decisions (A vs B), suggest a 3rd creative option if applicable.

4. **STEPS LOGIC (Important)**:
   - **RETURN EMPTY ARRAY []** steps: If the decision is SIMPLE, IMPULSIVE, or PHYSICAL (e.g., "Coffee vs Tea?", "What to eat?", "Should I nap?").
     - DO NOT give stupid steps like "Go to kitchen", "Boil water". JUST RETURN EMPTY STEPS [].
   - **RETURN STRATEGIC STEPS**: If the decision is COMPLEX (e.g., "Buy car?", "Break up?", "Quit job?").
     - Steps must be STRATEGIC actions (e.g., "Check used market prices", "Update CV", "Talk to HR"), NOT physical motions.

5. **Title**: 
   - MUST be specific. 
   - BAD: "Karar Ver", "Yemek Seçimi"
   - GOOD: "Lahmacun Söyle Keyfine Bak", "Sony Kulaklığı Almalısın", "Sahilde Yürüyüşe Çık"

6. **Sentiment**:
   - "positive": Go for it! Highly recommended.
   - "cautious": Do it, but watch out for X.
   - "warning": Probably don't do it. High risk.
   - "negative": Definitely don't do it. Bad idea.

7. **Follow-up Question**:
   - MUST directly reference the user's specific question in the past tense.

8. **Naapim Metre (CRITICAL - Binary decision score)**:
   - "decision_score": 0-100 arası bir SAYISAL değer. BU ALANIN DOLDURULMASI ZORUNLUDUR.
     - 0-20 = Kesinlikle YAPMA (çok riskli, kırmızı)
     - 21-40 = Dikkatli ol (riskler var, turuncu)
     - 41-60 = Nötr/Her iki tarafı da düşün (sarı)
     - 61-80 = Olumlu yaklaşım (genel yeşil ışık)
     - 81-100 = Kesinlikle YAP (çok olumlu, koyu yeşil)
   - "score_label": Skoru özetleyen kısa Türkçe etiket:
     - "Kesinlikle Uzak Dur" (0-20)
     - "Dikkatli Ol" (21-40)
     - "İki Tarafı da Düşün" (41-60)
     - "Olumlu Yaklaşım" (61-80)
     - "Kesinlikle Yap!" (81-100)
   - "metre_left_label" ve "metre_right_label": Soruya uygun FIIL etiketleri (BÜYÜK HARF):
     - "Ev almalı mıyım?" → "ALMA" / "AL"
     - "Tenise başlamalı mıyım?" → "BAŞLAMA" / "BAŞLA"
     - "İşten ayrılmalı mıyım?" → "AYRILMA" / "AYRIL"
     - "Git mi gitmesem mi?" → "GİTME" / "GİT"
     - Varsayılan: "YAPMA" / "YAP"
   - Skor, sentiment ile UYUMLU olmalı:
     - sentiment: positive → decision_score: 70-95
     - sentiment: cautious → decision_score: 50-70
     - sentiment: warning → decision_score: 25-50
     - sentiment: negative → decision_score: 5-25
   - **BU KURAL SADECE BINARY (EVET/HAYIR) SORULAR İÇİN GEÇERLİ**:
     - "Kahve içeyim mi?" → BINARY → Naapim Metre göster, ranked_options: []
     - "Ev almalı mıyım?" → BINARY → Naapim Metre göster, ranked_options: []
     - "Tenise başlamalı mıyım?" → BINARY → Naapim Metre göster, ranked_options: []

9. **Karşılaştırma Sıralaması (SADECE birden fazla seçenek olan sorular)**:
   - **BU KURAL SADECE KARŞILAŞTIRMA/SEÇENEK SORULARI İÇİN GEÇERLİ**:
     - "MacBook mı Windows mu?" → KARŞILAŞTIRMA → ranked_options doldur
     - "Kahve mi çay mı?" → KARŞILAŞTIRMA → ranked_options doldur
     - "Akşama ne yesem?" → KARŞILAŞTIRMA → ranked_options doldur
     - "Hangi araba alsam?" → KARŞILAŞTIRMA → ranked_options doldur
   - Seçenekleri fit_score'a göre BÜYÜKTEN KÜÇÜĞE sırala.
   - İlk seçenek için "reason" alanını MUTLAKA doldur (neden en uygun?).
   - Diğer seçenekler için "reason" boş bırakılabilir.
   - Max 5 seçenek.

10. **WIDGET SEÇİMİ - ÇOK ÖNEMLİ! SADECE BİR WIDGET DOLDUR:**:

    **A) BINARY SORU (Evet/Hayır):**
       Örnekler: "Kahve içeyim mi?", "Tenise başlamalı mıyım?", "Ev almalı mıyım?"
       → decision_score: 0-100 DOLDUR
       → score_label: DOLDUR
       → metre_left_label/metre_right_label: DOLDUR
       → ranked_options: BOŞ DİZİ []
       → timing_recommendation: BOŞ STRING ""
       → timing_alternatives: BOŞ DİZİ []

    **B) KARŞILAŞTIRMA SORUSU (A mı B mi?):**
       Örnekler: "MacBook mı Windows mu?", "Kahve mi çay mı?", "Ne yesem?"
       → ranked_options: DOLDUR (2-5 seçenek)
       → decision_score: 50 (nötr, kullanılmayacak)
       → timing_recommendation: BOŞ STRING ""
       → timing_alternatives: BOŞ DİZİ []

    **C) ZAMANLAMA SORUSU (Ne zaman?):**
       Örnekler: "Ne zaman ev almalıyım?", "Ne zaman evlenmeliyim?", "Beklemeli miyim?"
       → timing_recommendation: DOLDUR ("now", "3_months", "6_months", "1_year", "2_years")
       → timing_reason: DOLDUR
       → timing_alternatives: DOLDUR (2-3 alternatif)
       → ranked_options: BOŞ DİZİ []
       → method_steps: BOŞ DİZİ []
       → decision_score: 50 (nötr, kullanılmayacak)

    **D) YÖNTEM/NASIL SORUSU (Nasıl yapmalıyım?):**
       Örnekler: "Tenise nasıl başlarım?", "Nasıl zam istemeliyim?", "Yatırıma nasıl başlarım?"
       → method_steps: DOLDUR (4-5 adım, her biri title/description/icon)
       → method_summary: DOLDUR (kısa özet cümlesi)
       → ranked_options: BOŞ DİZİ []
       → timing_recommendation: BOŞ STRING ""
       → timing_alternatives: BOŞ DİZİ []
       → decision_score: 50 (nötr)
       → Icon seçenekleri: "search", "users", "package", "calendar", "check", "target", "launch"

    **KARAR ŞEMASI:**
    - "nasıl", "ne şekilde", "adım adım", "yöntem" → YÖNTEM (D)
    - "ne zaman", "hangi zamanda", "beklemeli mi", "erken mi" → ZAMANLAMA (C)
    - "mı...mı", "mi...mi", "hangisi", "ne X-sem", iki+ seçenek → KARŞILAŞTIRMA (B)
    - tek eylem + "mı/mi/mu/mü" → BINARY (A)
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
                                alternatives: {
                                    type: 'array',
                                    description: 'Alternative options for the decision (2-4 items)',
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
                                },
                                decision_score: {
                                    type: 'integer',
                                    description: 'Karar skoru: 0=YAPMA, 50=NÖTR, 100=YAP. Binary kararlar için metre göstergesi.'
                                },
                                score_label: {
                                    type: 'string',
                                    description: 'Skoru özetleyen Türkçe etiket: Kesinlikle Uzak Dur, Dikkatli Ol, İki Tarafı da Düşün, Olumlu Yaklaşım, Kesinlikle Yap!'
                                },
                                metre_left_label: {
                                    type: 'string',
                                    description: 'Metre sol etiketi (negatif taraf): YAPMA, ALMA, BAŞLAMA, GİTME vb.'
                                },
                                metre_right_label: {
                                    type: 'string',
                                    description: 'Metre sağ etiketi (pozitif taraf): YAP, AL, BAŞLA, GİT vb.'
                                },
                                ranked_options: {
                                    type: 'array',
                                    description: 'Sıralı seçenekler (karşılaştırma kararları için, en yüksen fit_score\'dan en düşüğe)',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', description: 'Seçenek adı' },
                                            fit_score: { type: 'integer', description: 'Uygunluk skoru 0-100' },
                                            reason: { type: 'string', description: 'Sadece 1. sıra için neden en uygun olduğunu açıkla' }
                                        },
                                        required: ['name', 'fit_score', 'reason'],
                                        additionalProperties: false
                                    }
                                },
                                timing_recommendation: {
                                    type: 'string',
                                    enum: ['now', '1_month', '3_months', '6_months', '1_year', '2_years', 'uncertain', ''],
                                    description: 'Zamanlama önerisi (sadece timing soruları için)'
                                },
                                timing_reason: {
                                    type: 'string',
                                    description: 'Neden bu zamanlama önerildi'
                                },
                                timing_alternatives: {
                                    type: 'array',
                                    description: 'Alternatif zamanlamalar (timing soruları için)',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            label: { type: 'string', description: 'Görüntülenecek etiket' },
                                            value: { type: 'string', description: 'Değer: now, 1_month, 3_months, 6_months, 1_year, 2_years, uncertain' },
                                            fit_score: { type: 'integer', description: 'Uygunluk skoru 0-100' }
                                        },
                                        required: ['label', 'value', 'fit_score'],
                                        additionalProperties: false
                                    }
                                },
                                method_steps: {
                                    type: 'array',
                                    description: 'Yöntem adımları (nasıl soruları için 4-5 adım)',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            title: { type: 'string', description: 'Adım başlığı (kısa)' },
                                            description: { type: 'string', description: 'Adım açıklaması (1 cümle)' },
                                            icon: { type: 'string', description: 'İkon: search, users, package, calendar, check, target, launch' }
                                        },
                                        required: ['title', 'description', 'icon'],
                                        additionalProperties: false
                                    }
                                },
                                method_summary: {
                                    type: 'string',
                                    description: 'Yöntem özeti (sadece method soruları için kısa özet cümlesi)'
                                }
                            },
                            required: ['title', 'recommendation', 'reasoning', 'steps', 'alternatives', 'pros', 'cons', 'sentiment', 'followup_question', 'specific_suggestions', 'suggestion_type', 'decision_score', 'score_label', 'metre_left_label', 'metre_right_label', 'ranked_options', 'timing_recommendation', 'timing_reason', 'timing_alternatives', 'method_steps', 'method_summary'],
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
