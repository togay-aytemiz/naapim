import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createEncodedResponse, createEncodedErrorResponse } from '../_shared/encoding.ts'

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
    simple_question_pools?: Record<string, { key: string; label: string }[]>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, archetypes, simple_question_pools }: ClassifyRequest = await req.json()

        if (!user_question || !archetypes) {
            return createEncodedErrorResponse('user_question and archetypes required', corsHeaders, 400)
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            return createEncodedResponse({
                archetype_id: archetypes[0]?.id || 'career_decisions',
                confidence: 0,
                needs_clarification: true,
                clarification_prompt: 'Lütfen kararınızı biraz daha açıklayın.'
            }, corsHeaders)
        }

        // Enhanced system prompt for better understanding
        let systemPrompt = `Sen bir karar verme ve keşif asistanısın. Kullanıcının yazdığı soruyu/düşünceyi analiz edip aşağıdaki kategorilerden birine sınıflandırmalısın.

GÖREV:
1. Kullanıcının ifadesini analiz et (kısa, belirsiz veya informal olsa bile)
2. Kullanıcının gerçek niyetini anlamaya çalış
3. En uygun kategoriyi seç
4. KARAR TİPİNİ belirle (aşağıdaki listeden)
5. KARAR KARMAŞIKLIĞINI belirle (simple/moderate/complex)
6. SADECE çok belirsiz veya anlamsız ise clarification iste - "ne hazırlayım", "ne yapsam" gibi sorularda clarification GEREKMEZ

KARAR KARMAŞIKLIĞI (decision_complexity):
- simple: Günlük/anlık kararlar. Düşük risk, kolay geri dönüş, kısa vadeli etki, genelde sadece kişiyi ilgilendiren.
  Örnekler: "Kahve mi çay mı?", "Otobüsle mi gideyim arabayla mı?", "Bu akşam ne film izlesek?", "Hangi renk t-shirt giysem?"
- moderate: Biraz düşünme gerektiren ama hayat değiştirici olmayan kararlar.
  Örnekler: "Hafta sonu nereye gitsek?", "Hangi restoranı tercih etsek?", "Yeni telefon kılıfı hangisi olsun?"
- complex: Hayat değiştirici, uzun vadeli etki, birden fazla kişiyi etkileyen kararlar.
  Örnekler: "İşten ayrılmalı mıyım?", "Evlenmeli miyiz?", "Taşınmalı mıyım?", "İkinci çocuk yapalım mı?"

KARAR TİPLERİ (decision_type):
- binary_decision: "Yapayım mı yapmayayım mı?" tarzı evet/hayır kararları
- comparison: "A mı B mi?" tarzı iki veya daha fazla seçenek karşılaştırması
- timing: "Ne zaman yapmalıyım?" tarzı zamanlama kararları
- method: "Nasıl yapmalıyım?" tarzı yöntem/strateji soruları
- validation: "Doğru mu yaptım?" tarzı geçmiş karar değerlendirmesi
- emotional_support: "Yalnız mıyım bu durumda?" tarzı duygusal destek arayışı
- exploration: "Seçeneklerimi/fikirleri görmek istiyorum" tarzı keşif odaklı sorular

EXPLORATION (KEŞİF) TİPİ ÖNEMLİ:
"Ne hazırlayım?", "Ne yapsam?", "Ne alabilirim?", "Önerir misiniz?" gibi sorular exploration tipidir.
Bu sorularda kullanıcı başkalarının deneyimlerinden fikir almak istiyor - BU GEÇERLİ BİR KULLANIM.
Bu tür sorularda needs_clarification: false olmalı ve lifestyle_change veya en uygun kategori seçilmeli.

ÖRNEK KARAR TİPLERİ VE KARMAŞIKLIKLARI:
- "Tenis'e başlamalı mıyım?" → binary_decision, moderate
- "MacBook mu alsam Windows mu?" → comparison, moderate (ciddi harcama)
- "Kahve mi içsem çay mı?" → comparison, simple
- "Otobüsle mi gideyim arabayla mı?" → comparison, simple
- "Bu akşam ne film izlesek?" → exploration, simple
- "Ne zaman ev almalıyım?" → timing, complex
- "Nasıl zam istemeliyim?" → method, moderate
- "İşten ayrıldım, doğru mu yaptım?" → validation, complex
- "Herkes böyle mi hissediyor?" → emotional_support, moderate
- "Kariyer seçeneklerimi görmek istiyorum" → exploration, complex
- "Sıcak şarabın yanına ne hazırlayım?" → exploration, simple
- "Kızlar gecesi için ne hazırlasam?" → exploration, simple
- "Kahvaltıda ne yapsam?" → exploration, simple

ÖNEMLİ KURALLAR:
- Kısa ifadeler (örn: "ikinci çocuk?", "iş değişikliği") bağlamdan anlam çıkar
- "acaba", "belki", "düşünüyorum" gibi kelimeler karar verme sürecini ima eder
- "Ne yapsam?", "Ne hazırlasam?" gibi sorular geçerli exploration sorularıdır
- Belirsiz ama anlaşılır ifadelerde confidence 0.6-0.7 olmalı, needs_clarification: false
- Tamamen anlamsız veya tek kelimelik ifadeler için clarification iste

BASİT KARARLAR İÇİN SORU SEÇİMİ (ZORUNLU):
Eğer decision_complexity: "simple" ise, AŞAĞIDAKİ HAVUZDAN MUTLAKA 2-5 SORU SEÇMELİSİN.
"selected_simple_field_keys" alanı BOŞ OLAMAZ.
Kullanıcının sorusuyla (archetype_id) eşleşen havuzdan seçim yap.
Kullanıcının sorusuyla (archetype_id) eşleşen havuzdan seçim yap.
GERÇEK DIŞI / FANTASTİK SORU TESPİTİ:
Aşağıdaki durumlarda MUTLAKA is_unrealistic: true VE needs_clarification: true olmalı:
        - Süper kahramanlar, kurgusal karakterler(Superman, Batman, Harry Potter...)
            - İmkansız senaryolar(zamanda yolculuk, uçma yeteneği, unicorn)
                - Şaka / trolleme amaçlı absürt sorular
                    - Gerçek hayatta var olmayan durumlar

        KATEGORİLER:
        `

        archetypes.forEach(arch => {
            systemPrompt += `\n-- - ${arch.label} (ID: ${arch.id}) ---\n`
            systemPrompt += `Tanım: ${arch.routing_hints.definition} \n`
            systemPrompt += `Anahtar kelimeler: ${arch.routing_hints.keywords.join(', ')} \n`
            systemPrompt += `Örnek sorular: ${arch.routing_hints.positive_examples.slice(0, 3).join(' | ')} \n`
            if (arch.routing_hints.exclusions.length > 0) {
                systemPrompt += `Bu kategoriye DAHİL DEĞİL: ${arch.routing_hints.exclusions.join(', ')} \n`
            }
        })

        // Add simple question pools to prompt if available
        if (simple_question_pools) {
            systemPrompt += `\nBASİT SORU HAVUZLARI(decision_complexity: simple ise buradan 2 - 5 soru seç): \n`;
            for (const [archetypeId, questions] of Object.entries(simple_question_pools)) {
                systemPrompt += `\n${archetypeId}: \n`;
                questions.slice(0, 25).forEach(q => {
                    systemPrompt += `  - ${q.key}: "${q.label}"\n`;
                });
            }
        }

        systemPrompt += `\nÖRNEK ANALİZLER:

        Girdi: "acaba ikinci çocuk?"
        Çıktı: { "archetype_id": "parenting_decisions", "decision_type": "binary_decision", "decision_complexity": "complex", "confidence": 0.75, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "İkinci çocuk sahibi olmayı düşünüyorsunuz ve bu kararı tartmak istiyorsunuz." }

        Girdi: "Kahve mi içsem çay mı?"
        Çıktı: { "archetype_id": "food_hospitality", "decision_type": "comparison", "decision_complexity": "simple", "confidence": 0.9, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Kahve ve çay arasında seçim yapmak istiyorsunuz.", "selected_simple_field_keys": ["current_mood", "time_constraint", "food_caffeine_need"] }

        Girdi: "Otobüsle mi gideyim arabayla mı?"
        Çıktı: { "archetype_id": "lifestyle_change", "decision_type": "comparison", "decision_complexity": "simple", "confidence": 0.85, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "İşe/okula nasıl gideceğinize karar vermek istiyorsunuz." }

        Girdi: "MacBook mu alsam Windows laptop mu?"
        Çıktı: { "archetype_id": "major_purchase", "decision_type": "comparison", "decision_complexity": "moderate", "confidence": 0.9, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "MacBook ve Windows laptop arasında seçim yapmaya çalışıyorsunuz." }

        Girdi: "Ne zaman ev almalıyım?"
        Çıktı: { "archetype_id": "money_finance", "decision_type": "timing", "decision_complexity": "complex", "confidence": 0.85, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Ev satın almak için doğru zamanlamayı belirlemeye çalışıyorsunuz." }

        Girdi: "Sıcak şarabın yanına ne hazırlayım?"
        Çıktı: { "archetype_id": "food_hospitality", "decision_type": "exploration", "decision_complexity": "simple", "confidence": 0.8, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Sıcak şarap eşliğinde sunmak için meze/atıştırmalık fikirleri arıyorsunuz." }

        Girdi: "Yıldönümü için hangi restorana gitsek?"
        Çıktı: { "archetype_id": "food_hospitality", "decision_type": "exploration", "decision_complexity": "moderate", "confidence": 0.85, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Eşinizle yıldönümü için romantik bir restoran arıyorsunuz." }

        Girdi: "İşten ayrılmalı mıyım?"
        Çıktı: { "archetype_id": "career_decisions", "decision_type": "binary_decision", "decision_complexity": "complex", "confidence": 0.9, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Mevcut işinizden ayrılmayı düşünüyorsunuz." }

        Girdi: "iş"
        Çıktı: { "archetype_id": "career_decisions", "decision_type": "exploration", "decision_complexity": "moderate", "confidence": 0.3, "needs_clarification": true, "is_unrealistic": false, "clarification_prompt": "İşinizle ilgili nasıl bir karar vermek istiyorsunuz?" }
        `

        // Build valid archetype IDs for enum
        const validArchetypeIds = archetypes.map(a => a.id)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey} `,
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
                                decision_complexity: {
                                    type: 'string',
                                    enum: ['simple', 'moderate', 'complex'],
                                    description: 'Karar karmaşıklığı: simple (günlük/anlık), moderate (biraz düşünme gerektirir), complex (hayat değiştirici)'
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
                                },
                                selected_simple_field_keys: {
                                    type: ['array', 'null'],
                                    items: { type: 'string' },
                                    description: 'Simple kararlar için seçilen 2-5 soru field key listesi (decision_complexity: simple ise doldur)'
                                }
                            },
                            required: ['archetype_id', 'decision_type', 'decision_complexity', 'confidence', 'needs_clarification', 'is_unrealistic', 'clarification_prompt', 'interpreted_question', 'selected_simple_field_keys'],
                            additionalProperties: false
                        }
                    }
                }
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status} `)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content
        const result = JSON.parse(content || '{}')

        // Validate archetype_id exists (validArchetypeIds defined at line 128)
        const archetypeId = validArchetypeIds.includes(result.archetype_id)
            ? result.archetype_id
            : archetypes[0]?.id

        return createEncodedResponse({
            archetype_id: archetypeId,
            decision_type: result.decision_type || 'binary_decision',
            decision_complexity: result.decision_complexity || 'moderate',
            confidence: result.confidence || 0,
            needs_clarification: result.needs_clarification || false,
            is_unrealistic: result.is_unrealistic || false,
            clarification_prompt: result.clarification_prompt || null,
            interpreted_question: result.interpreted_question || null,
            selected_simple_field_keys: result.selected_simple_field_keys || null
        }, corsHeaders)

    } catch (err) {
        console.error('Classification error:', err)
        return createEncodedResponse({
            archetype_id: 'career_decisions',
            confidence: 0,
            needs_clarification: true,
            clarification_prompt: 'Bir hata oluştu. Lütfen kararınızı biraz daha açıklayarak tekrar deneyin.'
        }, corsHeaders)
    }
})

