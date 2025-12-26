import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Persona pool for diversity - format: "role; constraints/context; priorities"
const PERSONA_POOL = [
    'bütçe odaklı üniversite öğrencisi; 35-45k bütçe; ikinci el bakıyor; taşınabilirlik önemli',
    'uzaktan çalışan; günlük toplantı yoğun; pil ve sessizlik kritik; uzun kullanım',
    'hafif içerik üreticisi; Lightroom Canva; depolama ve ekran önemli; dosya yönetimi',
    'kurumsal profesyonel; Office Slack Zoom; stabilite ve garanti önemli; az sürpriz',
    'teknoloji meraklısı; model kıyaslıyor; teknik detay seviyor; doğru seçim takıntısı',
    'aile için alışveriş yapan ebeveyn; ortak kullanım; dayanıklılık; servis ağı önemli',
    'sık seyahat eden; hafiflik; adaptör taşımak istemiyor; portlar ve şarj önemli',
    'performans odaklı kullanıcı; çok sekme çok uygulama; ısınma takıntısı; akıcılık önemli',
    'minimalist; gereksiz harcama istemiyor; işimi görsün modu; sade tercih',
    'ilk kez bu kategoride alım yapan; bilgi kirliliği yaşıyor; basit kriterlerle ilerliyor',
    'ikinci el düşünen; değer kaybına hassas; resale önemli; temiz cihaz arıyor',
    'Apple ekosistem kullanıcısı; iPhone AirPods var; uyum ve continuity önemli',
    'Windows alışkanlığı olan; geçişten çekiniyor; kısayollar ve alışkanlıklar önemli',
    'servis ve garanti hassas; risk sevmiyor; arıza korkusu; resmi kanal tercih',
    'acil ihtiyacı olan; eski cihaz bozulmuş; hızlı karar; stok kampanya baskısı',
    'kampanya kovalayan; indirim zamanlıyor; taksit ve fiyat değişimi takip ediyor'
]

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, archetype_id, context = '', count = 3 } = await req.json()

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

        // Pick outcome_type: 70% decided, 30% cancelled (no thinking - they don't write comments)
        const getRandomOutcomeType = () => {
            return Math.random() < 0.70 ? 'decided' : 'cancelled'
        }

        // Feeling based on outcome_type
        const getRandomFeeling = (outcomeType: string) => {
            const rand = Math.random()
            if (outcomeType === 'decided') {
                // Decided: mostly positive
                if (rand < 0.50) return 'happy'      // 50% happy
                if (rand < 0.75) return 'neutral'    // 25% neutral
                if (rand < 0.90) return 'uncertain'  // 15% uncertain
                return 'regret'                       // 10% regret
            } else {
                // Cancelled: mixed feelings
                if (rand < 0.40) return 'happy'      // 40% happy (relieved)
                if (rand < 0.70) return 'neutral'    // 30% neutral
                if (rand < 0.90) return 'regret'     // 20% regret (missed opportunity)
                return 'uncertain'                    // 10% uncertain
            }
        }

        // Generate outcome combinations
        const outcomeCombos = Array.from({ length: count }, () => {
            const outcomeType = getRandomOutcomeType()
            const feeling = getRandomFeeling(outcomeType)
            return { outcomeType, feeling }
        })

        // Ensure diversity: at least one cancelled if all are decided
        if (outcomeCombos.every(c => c.outcomeType === 'decided') && count >= 2) {
            outcomeCombos[1].outcomeType = 'cancelled'
            outcomeCombos[1].feeling = getRandomFeeling('cancelled')
        }

        // Ensure feeling diversity: not all the same feeling
        const allFeelings = outcomeCombos.map(c => c.feeling)
        const uniqueFeelings = new Set(allFeelings)
        if (uniqueFeelings.size === 1 && count >= 2) {
            // All same feeling, force one to be different
            const currentFeeling = allFeelings[0]
            const alternatives = ['happy', 'neutral', 'uncertain', 'regret'].filter(f => f !== currentFeeling)
            outcomeCombos[1].feeling = alternatives[Math.floor(Math.random() * alternatives.length)]
        }

        // Assign distinct personas
        const shuffledPersonas = [...PERSONA_POOL].sort(() => Math.random() - 0.5)
        const assignedPersonas = shuffledPersonas.slice(0, count)

        const feelingDescriptions: Record<string, Record<string, string>> = {
            decided: {
                happy: 'mutlu ve memnun, kararından çok hoşnut, iyi ki yapmış',
                neutral: 'nötr, yaptı ama ne çok mutlu ne mutsuz',
                uncertain: 'hala tam emin değil, doğru mu yaptı acaba diyor',
                regret: 'pişman, keşke yapmasaydı diyor'
            },
            cancelled: {
                happy: 'rahatlamış, vazgeçtiği için mutlu, iyi ki yapmamış',
                neutral: 'vazgeçti ama önemli bir şey değilmiş gibi',
                uncertain: 'acaba yapsaydım mı diyor, hala düşünüyor',
                regret: 'keşke deneseymiş, fırsatı kaçırmış gibi hissediyor'
            }
        }

        // Build the structured prompt
        const contextInstruction = context
            ? `\n\nKULLANICI BAĞLAMI (hikayelere doğal şekilde yansıt):\n${context}`
            : ''

        const prompt = `Sen Türkçe yazan yaratıcı bir hikaye anlatıcısısın. Aşağıdaki ikileme benzer bir karar vermiş ${count} farklı gerçek kullanıcının deneyimlerini paylaşacaksın.

Orijinal soru: "${user_question}"${contextInstruction}

HER BİR HİKAYE ZORUNLU OLARAK ŞU 6 ÖĞEYİ İÇERMELİ:
1. EN AZ 2 ALTERNATİF KARŞILAŞTIRMASI: Somut seçenekler (örn: M2 Air vs M3 Air, Air vs Pro, Mac vs Windows)
2. EN AZ 1 SOMUT KISIT: Bütçe aralığı/taksit limiti VEYA zaman baskısı VEYA stok/bulunabilirlik
3. SOMUT KULLANIM SENARYOSU: İş, okul, kodlama, toplantı, fotoğraf düzenleme, taşınabilirlik, pil ömrü vb.
4. SOMUT KRİTER: RAM, SSD, ekran boyutu, ağırlık, pil, servis, ikinci el değeri, klavye, port vb.
5. SOMUT TETİKLEYİCİ OLAY: İndirim, eski cihaz bozuldu, mağazada denedi, iş gereksinimi, seyahat planı vb.
6. SOMUT SONRASI GÖZLEM: Pil yetti/yetmedi, performans, pişmanlık nedeni, beklenmedik sorun, memnuniyet nedeni

YASAK İFADELER (bunları ASLA kullanma):
"şunu almalısın", "kesinlikle", "en iyisi", "tavsiye ederim", "yatırım önerisi", "garanti"

ZORUNLU KULLANIM: Yaşanmış deneyim dili kullan:
"benim durumumda", "bende şöyle oldu", "ben böyle yaptım", "benim için"

KİŞİLER VE DURUMLARI:
${outcomeCombos.map((c, i) => `${i + 1}. Kişi: 
   - Persona: ${assignedPersonas[i]}
   - Karar: ${c.outcomeType === 'decided' ? 'KARARINI VERDİ (Yaptı)' : 'VAZGEÇTİ (Yapmadı)'}
   - Hissiyat: ${feelingDescriptions[c.outcomeType][c.feeling]}
   - feeling değeri: "${c.feeling}"
   - outcome_type değeri: "${c.outcomeType}"`).join('\n')}

JSON formatında yanıt ver. ÖNEMLİ: YUKARIDAKİ PERSONA, FEELING VE OUTCOME_TYPE DEĞERLERİNİ AYNEN KULLAN:
{
  "outcomes": [
    {
      "similar_question": "Kısa, spesifik başlık (format: Konu + 1 kısıt + 1 alternatif, örn: '40-55 bin TL bütçe ile M2 Air mi M3 Air mi')",
      "persona": "Persona etiketi (yukarıdan al)",
      "options_considered": ["alternatif1", "alternatif2"],
      "constraints": ["kısıt1", "kısıt2"],
      "trigger": "Kararı tetikleyen olay",
      "tradeoffs": {
        "pros": ["artı1", "artı2"],
        "cons": ["eksi1", "eksi2"]
      },
      "what_happened_after": "1-2 cümle: karardan sonra ne oldu",
      "outcome_text": "1-2 paragraf, doğal Türkçe, detaylı süreç + sonuç. Persona'nın kısıtlarını ve kriterlerini yansıt.",
      "feeling": "happy|neutral|uncertain|regret (yukarıdaki değeri kullan)",
      "outcome_type": "decided|cancelled (yukarıdaki değeri kullan)"
    }
  ]
}

MANTIK KURALLARI:
- BİR KERE yapılan eylemler (almak, taşınmak, istifa): ASLA "almaya başladım" DEME → "Aldım" de
- SÜREKLİ eylemler (diyet, spor, kurs): "Başladım" diyebilirsin
- outcome_type "cancelled" ise NEDEN vazgeçtiğini SOMUT şekilde anlat

STİL KURALLARI:
- Doğal, samimi dil: "baya", "açıkçası", "ne yalan söyleyeyim", "kafam karışıktı" kullanabilirsin
- Yazım hatası yapma ama kurumsal konuşma
- Her hikaye FARKLI başlasın - "Sonunda" ile çok başlama
- HİKAYELER BİRBİRİNDEN TAMAMEN FARKLI OLMALI`

        // Helper: Retry fetch with exponential backoff
        const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
            let lastError: Error | null = null;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await fetch(url, options);
                    if (response.ok || response.status < 500) {
                        return response; // Success or client error (don't retry 4xx)
                    }
                    // 5xx error - retry
                    console.warn(`Attempt ${attempt + 1} failed with ${response.status}, retrying...`);
                    lastError = new Error(`HTTP ${response.status}`);
                } catch (err) {
                    console.warn(`Attempt ${attempt + 1} failed with network error, retrying...`);
                    lastError = err instanceof Error ? err : new Error(String(err));
                }
                // Wait before retry (exponential backoff: 1s, 2s, 4s)
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
            throw lastError || new Error('Max retries exceeded');
        };

        const openaiResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen Türkçe deneyim hikayeleri üreten bir asistansın. SADECE geçerli JSON formatında yanıt ver. Tavsiye verme, yaşanmış deneyim anlat. Doğal ve samimi bir dil kullan.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9,
                max_tokens: 3000,
                response_format: { type: 'json_object' }
            })
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text()
            console.error('OpenAI API error:', errorText)
            throw new Error('Failed to generate outcomes')
        }

        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0]?.message?.content

        if (!content) {
            throw new Error('No content in response')
        }

        let generatedData;
        try {
            generatedData = JSON.parse(content);
        } catch (parseErr) {
            console.error('Failed to parse OpenAI response:', content);
            throw new Error('Invalid JSON in OpenAI response');
        }
        let outcomes = generatedData.outcomes || []

        // Validation: Check required fields and specificity
        const requiredFields = ['similar_question', 'persona', 'options_considered', 'constraints', 'trigger', 'tradeoffs', 'what_happened_after', 'outcome_text', 'feeling', 'outcome_type']

        const validateOutcome = (outcome: any): { valid: boolean; missing: string[] } => {
            const missing: string[] = []

            // Check required fields exist
            for (const field of requiredFields) {
                if (!outcome[field]) {
                    missing.push(`missing ${field}`)
                }
            }

            // Check specificity in outcome_text (simple keyword heuristics)
            const text = (outcome.outcome_text || '').toLowerCase()

            // Check for at least 2 alternatives mentioned
            const hasAlternatives = outcome.options_considered && outcome.options_considered.length >= 2
            if (!hasAlternatives) missing.push('needs 2+ alternatives')

            // Check for constraints
            const hasConstraints = outcome.constraints && outcome.constraints.length >= 1
            if (!hasConstraints) missing.push('needs constraints')

            // Check for trigger
            if (!outcome.trigger || outcome.trigger.length < 5) missing.push('needs trigger')

            // Check tradeoffs structure
            if (!outcome.tradeoffs?.pros?.length || !outcome.tradeoffs?.cons?.length) {
                missing.push('needs pros and cons')
            }

            // Check what_happened_after
            if (!outcome.what_happened_after || outcome.what_happened_after.length < 10) {
                missing.push('needs what_happened_after')
            }

            // Simple text quality checks (at least 100 chars for detailed story)
            if (text.length < 100) missing.push('outcome_text too short')

            return { valid: missing.length === 0, missing }
        }

        // Validate all outcomes
        const validationResults = outcomes.map((o: any, i: number) => ({
            index: i,
            ...validateOutcome(o)
        }))

        const invalidOutcomes = validationResults.filter((r: any) => !r.valid)
        if (invalidOutcomes.length > 0) {
            console.warn('Some outcomes failed validation:', invalidOutcomes)
            // We'll proceed but log the issues - in production could retry
        }

        // Save to database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Helper function to generate embedding
        const generateEmbedding = async (text: string): Promise<number[] | null> => {
            if (!text) return null
            try {
                const resp = await fetch('https://api.openai.com/v1/embeddings', {
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
                if (!resp.ok) return null
                const data = await resp.json()
                return data.data[0]?.embedding || null
            } catch {
                return null
            }
        }

        // Valid feeling values that match database check constraint
        const validFeelings = ['happy', 'neutral', 'uncertain', 'regret'] as const
        type ValidFeeling = typeof validFeelings[number]

        // Sanitize feeling value - map invalid values to closest valid one
        const sanitizeFeeling = (feeling: string | undefined, fallback: string): ValidFeeling => {
            if (!feeling) return fallback as ValidFeeling
            const normalized = feeling.toLowerCase().trim()

            // Direct match
            if (validFeelings.includes(normalized as ValidFeeling)) {
                return normalized as ValidFeeling
            }

            // Map common alternatives
            const feelingMap: Record<string, ValidFeeling> = {
                'satisfaction': 'happy',
                'satisfied': 'happy',
                'relief': 'happy',
                'relieved': 'happy',
                'excited': 'happy',
                'content': 'happy',
                'positive': 'happy',
                'sad': 'regret',
                'disappointed': 'regret',
                'worry': 'uncertain',
                'worried': 'uncertain',
                'anxious': 'uncertain',
                'confused': 'uncertain',
                'indifferent': 'neutral',
                'okay': 'neutral',
                'fine': 'neutral'
            }

            return feelingMap[normalized] || fallback as ValidFeeling
        }

        // Generate embeddings for each outcome (based on similar_question + original context)
        // This ensures generated outcomes match users with similar question AND answers
        const outcomesWithEmbeddings = await Promise.all(
            outcomes.map(async (o: any, index: number) => {
                // Build rich text for embedding including new fields
                const embeddingParts = [
                    o.similar_question || user_question,
                    o.persona || '',
                    (o.options_considered || []).join(', '),
                    (o.constraints || []).join(', '),
                    o.trigger || '',
                    context
                ].filter(Boolean)
                const textForEmbedding = embeddingParts.join(' | ')
                const embedding = await generateEmbedding(textForEmbedding)

                // Sanitize feeling to prevent DB constraint violation
                const fallbackFeeling = outcomeCombos[index]?.feeling || 'neutral'
                const sanitizedFeeling = sanitizeFeeling(o.feeling, fallbackFeeling)

                // Build metadata JSON with the new structured fields
                const metadata = {
                    persona: o.persona || null,
                    options_considered: o.options_considered || [],
                    constraints: o.constraints || [],
                    trigger: o.trigger || null,
                    tradeoffs: o.tradeoffs || { pros: [], cons: [] },
                    what_happened_after: o.what_happened_after || null
                }

                return {
                    session_id: null,
                    outcome_type: o.outcome_type || outcomeCombos[index]?.outcomeType || 'decided',
                    outcome_text: o.outcome_text,
                    feeling: sanitizedFeeling,
                    related_question: o.similar_question,
                    archetype_id: archetype_id || null,
                    is_generated: true,
                    embedding,
                    metadata // Store additional structured data
                }
            })
        )

        const { data: insertedOutcomes, error: insertError } = await supabase
            .from('outcomes')
            .insert(outcomesWithEmbeddings)
            .select()

        if (insertError) {
            console.error('Error inserting outcomes:', insertError)
            throw insertError
        }

        return new Response(
            JSON.stringify({
                success: true,
                generated_count: insertedOutcomes?.length || 0,
                outcomes: insertedOutcomes,
                validation_warnings: invalidOutcomes.length > 0 ? invalidOutcomes : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to generate outcomes', details: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
