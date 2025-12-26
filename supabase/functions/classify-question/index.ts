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
4. Eğer ifade çok belirsiz veya kısaysa, kullanıcıdan detay iste

ÖNEMLİ KURALLAR:
- Kısa ifadeler (örn: "ikinci çocuk?", "iş değişikliği") bağlamdan anlam çıkar
- "acaba", "belki", "düşünüyorum" gibi kelimeler karar verme sürecini ima eder
- Belirsiz ifadelerde confidence düşük olmalı (0.3-0.5)
- Net ifadelerde confidence yüksek olmalı (0.7-1.0)

GERÇEK DIŞI/FANTASTİK SORU TESPİTİ:
Aşağıdaki durumlarda MUTLAKA needs_clarification: true döndür ve is_unrealistic: true ekle:
- Hayali varlıklar (unicorn, ejderha, süperman, batman, peri, vs.)
- İmkansız senaryolar (zamanda yolculuk, uçma yeteneği, ölümsüzlük)
- Var olmayan ürünler/kavramlar
- Trolleme/şaka amaçlı saçma sorular
- Aşırı absürt veya mantıksız karşılaştırmalar

Bu durumlarda clarification_prompt şöyle olmalı:
"Bu soru gerçek bir karar durumunu yansıtmıyor gibi görünüyor. Naapim gerçek hayat kararlarında yardımcı olabilir. Lütfen gerçek bir karar veya ikilem paylaşır mısın?"

ÇIKTI FORMATI (JSON):
{
    "archetype_id": "kategori_id",
    "confidence": 0.0-1.0 arası sayı,
    "needs_clarification": true/false,
    "is_unrealistic": true/false (fantastik/gerçek dışı soru ise true),
    "clarification_prompt": "Kullanıcıya sorulacak nazik detay sorusu (needs_clarification true ise)",
    "interpreted_question": "Kullanıcının niyetinin tam cümle hali (needs_clarification false ise)"
}

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
Çıktı: {"archetype_id": "parenting_decisions", "confidence": 0.75, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "İkinci çocuk sahibi olmayı düşünüyorsunuz ve bu kararı tartmak istiyorsunuz."}

Girdi: "iş"
Çıktı: {"archetype_id": "career_decisions", "confidence": 0.3, "needs_clarification": true, "is_unrealistic": false, "clarification_prompt": "İşinizle ilgili nasıl bir karar vermek istiyorsunuz? Örneğin: İşimi değiştirmeli miyim? veya Terfi istemeli miyim?"}

Girdi: "Unicorn mu alsam superman mı?"
Çıktı: {"archetype_id": "general", "confidence": 0, "needs_clarification": true, "is_unrealistic": true, "clarification_prompt": "Bu soru gerçek bir karar durumunu yansıtmıyor gibi görünüyor. Naapim gerçek hayat kararlarında yardımcı olabilir. Lütfen gerçek bir karar veya ikilem paylaşır mısın?"}

Girdi: "Evimden taşınmalı mıyım yoksa tadilat mı yaptırmalıyım?"
Çıktı: {"archetype_id": "lifestyle_change", "confidence": 0.9, "needs_clarification": false, "is_unrealistic": false, "interpreted_question": "Mevcut evinizde kalıp tadilat mı yaptırmalısınız yoksa taşınmalı mısınız kararını vermeye çalışıyorsunuz."}
`

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
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content
        const result = JSON.parse(content || '{}')

        // Validate archetype_id exists
        const validArchetypeIds = archetypes.map(a => a.id)
        const archetypeId = validArchetypeIds.includes(result.archetype_id)
            ? result.archetype_id
            : archetypes[0]?.id

        return new Response(
            JSON.stringify({
                archetype_id: archetypeId,
                confidence: result.confidence || 0,
                needs_clarification: result.needs_clarification || false,
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

