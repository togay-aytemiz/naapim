import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

        const prompt = `Sen Türkçe yazan bir içerik üreticisisin. Aşağıdaki soruya benzer bir karar veren ${count} farklı kişinin deneyimlerini yaz.

Orijinal soru: "${user_question}"

Her kişi için:
1. Benzer ama biraz farklı bir soru versiyonu yaz
2. Verilen karar durumu ve hissine uygun bir deneyim hikayesi yaz
3. Hikaye TUTARLI olmalı: karar verdiyse "yaptım/aldım/gittim", vazgeçtiyse "yapmadım/almadım/gitmedim" gibi
4. Doğal ve insan yazısı gibi olsun
5. 1-3 cümle arası, bazıları kısa bazıları uzun

Kişiler ve durumları:
${outcomeCombos.map((c, i) => `${i + 1}. Kişi: ${c.outcomeType === 'decided' ? 'KARAR VERDİ (yaptı)' : 'VAZGEÇTİ (yapmadı)'} - ${feelingDescriptions[c.outcomeType][c.feeling]}`).join('\n')}

JSON formatında yanıt ver:
{
  "outcomes": [
    {
      "similar_question": "benzer soru versiyonu",
      "outcome_text": "kişinin deneyim hikayesi - KARAR DURUMUNA UYGUN OLMALI",
      "feeling": "${outcomeCombos[0].feeling}",
      "outcome_type": "${outcomeCombos[0].outcomeType}"
    }
  ]
}

ÇOK ÖNEMLİ:
- outcome_type "decided" ise: "aldım", "yaptım", "başladım" gibi YAPILDI ifadeleri kullan
- outcome_type "cancelled" ise: NEDEN vazgeçtiğini kısaca açıkla! Örnek:
  - "Almaktan vazgeçtim, düşününce masrafları fazla geldi"
  - "Yapmamaya karar verdim, şartlar uygun değildi"  
  - "Vazgeçtim çünkü daha iyi bir seçenek çıktı"
  Ama çok uzun yazma, 1-2 cümle yeter. Doğal insan dili kullan.
- feeling ile outcome_type tutarlı olmalı (örn: cancelled + happy = "vazgeçtiğim için rahatladım")
- Türkçe yaz, doğal ol, resmi olma

CÜMLE BAŞLANGICI KURALLARI - ÇOK ÖNEMLİ:
- "Sonunda" kelimesiyle çok fazla cümle başlatma! Her hikayede farklı başlangıç kullan.
- İYİ başlangıç örnekleri: "Baya düşündüm ve...", "Uzun süre tartıştım ama...", "İlk başta...", "Tam...", "Aslında...", "Beklemeden...", "Hemen..."
- KÖTÜ: Her cümle "Sonunda..." ile başlıyor - BUNU YAPMA!
- Her hikayenin başlangıcı FARKLI olmalı.`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                        content: 'Sen Türkçe içerik üreticisisin. JSON formatında yanıt ver. Doğal ve insani bir dil kullan.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            })
        })

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

        const generatedData = JSON.parse(content)
        const outcomes = generatedData.outcomes || []

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

        // Generate embeddings for each outcome (based on similar_question + original context)
        // This ensures generated outcomes match users with similar question AND answers
        const outcomesWithEmbeddings = await Promise.all(
            outcomes.map(async (o: any, index: number) => {
                const textForEmbedding = context
                    ? `${o.similar_question || user_question} | ${context}`
                    : (o.similar_question || user_question)
                const embedding = await generateEmbedding(textForEmbedding)
                return {
                    session_id: null,
                    outcome_type: o.outcome_type || outcomeCombos[index]?.outcomeType || 'decided',
                    outcome_text: o.outcome_text,
                    feeling: o.feeling || outcomeCombos[index]?.feeling || 'neutral',
                    related_question: o.similar_question,
                    archetype_id: archetype_id || null,
                    is_generated: true,
                    embedding
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
                outcomes: insertedOutcomes
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
