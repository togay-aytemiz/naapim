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
                JSON.stringify({
                    archetype_id: archetypes[0]?.id || 'career_decisions',
                    confidence: 0,
                    needs_clarification: true,
                    clarification_prompt: 'Lütfen kararınızı biraz daha açıklayın.'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Enhanced system prompt for better understanding
        let systemPrompt = `Sen bir karar verme asistanısın. Kullanıcının yazdığı soruyu/düşünceyi analiz edip aşağıdaki kategorilerden birine sınıflandırmalısın.

GÖREV:
1. Kullanıcının ifadesini analiz et (kısa, belirsiz veya informal olsa bile)
2. Kullanıcının gerçek niyetini anlamaya çalış
3. En uygun kategoriyi seç
4. KARAR TİPİNİ belirle (aşağıdaki listeden)
5. Eğer ifade çok belirsiz veya kısaysa, kullanıcıdan detay iste

KARAR TİPLERİ (decision_type):
- binary_decision: "Yapayım mı yapmayayım mı?" tarzı evet/hayır kararları
- comparison: "A mı B mi?" tarzı iki veya daha fazla seçenek karşılaştırması
- timing: "Ne zaman yapmalıyım?" tarzı zamanlama kararları
- method: "Nasıl yapmalıyım?" tarzı yöntem/strateji soruları
- validation: "Doğru mu yaptım?" tarzı geçmiş karar değerlendirmesi
- emotional_support: "Yalnız mıyım bu durumda?" tarzı duygusal destek arayışı
- exploration: "Seçeneklerimi görmek istiyorum" tarzı keşif odaklı sorular

ÖRNEK KARAR TİPLERİ:
- "Tenis'e başlamalı mıyım?" → binary_decision
- "MacBook mu alsam Windows mu?" → comparison
- "Ne zaman ev almalıyım?" → timing
- "Nasıl zam istemeliyim?" → method
- "İşten ayrıldım, doğru mu yaptım?" → validation
- "Herkes böyle mi hissediyor?" → emotional_support
- "Kariyer seçeneklerimi görmek istiyorum" → exploration

ÖNEMLİ KURALLAR:
- Kısa ifadeler (örn: "ikinci çocuk?", "iş değişikliği") bağlamdan anlam çıkar
- "acaba", "belki", "düşünüyorum" gibi kelimeler karar verme sürecini ima eder
- Belirsiz ifadelerde confidence düşük olmalı (0.3-0.5)
- Net ifadelerde confidence yüksek olmalı (0.7-1.0)

GERÇEK DIŞI/FANTASTİK SORU TESPİTİ:
Aşağıdaki durumlarda MUTLAKA is_unrealistic: true VE needs_clarification: true olmalı:
- Süper kahramanlar, kurgusal karakterler (Superman, Batman, Harry Potter...)
- İmkansız senaryolar (zamanda yolculuk, uçma yeteneği, unicorn)
- Şaka/trolleme amaçlı absürt sorular
- Gerçek hayatta var olmayan durumlar

KATEGORİLER:
`

        archetypes.forEach(arch => {
            systemPrompt += `\n--- ${arch.label} (ID: ${arch.id}) ---\n`
            systemPrompt += `Tanım: ${arch.routing_hints.definition}\n`
            systemPrompt += `Anahtar kelimeler: ${arch.routing_hints.keywords.join(', ')}\n`
            systemPrompt += `Örnek sorular: ${arch.routing_hints.positive_examples.slice(0, 3).join(' | ')}\n`
            if (arch.routing_hints.exclusions.length > 0) {
                systemPrompt += `Bu kategoriye DAHİL DEĞİL: ${arch.routing_hints.exclusions.join(', ')}\n`
            }
        })

        systemPrompt += `\nÖRNEK ANALİZLER:

Girdi: "acaba ikinci çocuk?"
Çıktı: {"archetype_id": "parenting_decisions", "decision_type": "binary_decision", "confidence": 0.75, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "İkinci çocuk sahibi olmayı düşünüyorsunuz ve bu kararı tartmak istiyorsunuz."}

Girdi: "MacBook mu alsam Windows laptop mu?"
Çıktı: {"archetype_id": "major_purchase", "decision_type": "comparison", "confidence": 0.9, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "MacBook ve Windows laptop arasında seçim yapmaya çalışıyorsunuz."}

Girdi: "Ne zaman ev almalıyım?"
Çıktı: {"archetype_id": "money_finance", "decision_type": "timing", "confidence": 0.85, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Ev satın almak için doğru zamanlamayı belirlemeye çalışıyorsunuz."}

Girdi: "Tenis'e başlamalı mıyım?"
Çıktı: {"archetype_id": "health_wellness", "decision_type": "binary_decision", "confidence": 0.85, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Tenis sporuna başlayıp başlamamayı düşünüyorsunuz."}

Girdi: "iş"
Çıktı: {"archetype_id": "career_decisions", "decision_type": "exploration", "confidence": 0.3, "needs_clarification": true, "is_unrealistic": false, "clarification_prompt": "İşinizle ilgili nasıl bir karar vermek istiyorsunuz?"}
`

        // Build valid archetype IDs for enum
        const validArchetypeIds = archetypes.map(a => a.id)

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
                temperature: 0.3,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'classification_result',
                        strict: true,
                        schema: {
                            type: 'object',
                            properties: {
                                archetype_id: {
                                    type: 'string',
                                    enum: validArchetypeIds,
                                    description: 'En uygun kategori ID\'si'
                                },
                                decision_type: {
                                    type: 'string',
                                    enum: ['binary_decision', 'comparison', 'timing', 'method', 'validation', 'emotional_support', 'exploration'],
                                    description: 'Karar tipi'
                                },
                                confidence: {
                                    type: 'number',
                                    description: '0.0-1.0 arası güven skoru'
                                },
                                needs_clarification: {
                                    type: 'boolean',
                                    description: 'Kullanıcıdan detay gerekiyor mu'
                                },
                                is_unrealistic: {
                                    type: 'boolean',
                                    description: 'Gerçek dışı/fantastik soru mu'
                                },
                                clarification_prompt: {
                                    type: ['string', 'null'],
                                    description: 'Kullanıcıya sorulacak detay sorusu (needs_clarification true ise)'
                                },
                                interpreted_question: {
                                    type: ['string', 'null'],
                                    description: 'Kullanıcının niyetinin tam cümle hali'
                                }
                            },
                            required: ['archetype_id', 'decision_type', 'confidence', 'needs_clarification', 'is_unrealistic', 'clarification_prompt', 'interpreted_question'],
                            additionalProperties: false
                        }
                    }
                }
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content
        const result = JSON.parse(content || '{}')

        // Validate archetype_id exists (validArchetypeIds defined at line 128)
        const archetypeId = validArchetypeIds.includes(result.archetype_id)
            ? result.archetype_id
            : archetypes[0]?.id

        return new Response(
            JSON.stringify({
                archetype_id: archetypeId,
                decision_type: result.decision_type || 'binary_decision',
                confidence: result.confidence || 0,
                needs_clarification: result.needs_clarification || false,
                is_unrealistic: result.is_unrealistic || false,
                clarification_prompt: result.clarification_prompt || null,
                interpreted_question: result.interpreted_question || null
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Classification error:', err)
        return new Response(
            JSON.stringify({
                archetype_id: 'career_decisions',
                confidence: 0,
                needs_clarification: true,
                clarification_prompt: 'Bir hata oluştu. Lütfen kararınızı biraz daha açıklayarak tekrar deneyin.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

