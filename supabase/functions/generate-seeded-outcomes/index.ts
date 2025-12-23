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
        const { user_question, archetype_id, count = 3 } = await req.json()

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

        // Weighted random feeling - more positive outcomes
        const getRandomFeeling = () => {
            const rand = Math.random()
            if (rand < 0.45) return 'happy'      // 45% happy
            if (rand < 0.70) return 'neutral'    // 25% neutral
            if (rand < 0.85) return 'uncertain'  // 15% uncertain
            return 'regret'                       // 15% regret
        }

        // Generate feelings with guaranteed diversity
        // At least one should not be 'happy' for realism
        let feelings = Array.from({ length: count }, () => getRandomFeeling())

        // If all are 'happy', force one to be different
        if (feelings.every(f => f === 'happy') && feelings.length >= 2) {
            const alternatives = ['neutral', 'uncertain', 'regret']
            feelings[1] = alternatives[Math.floor(Math.random() * alternatives.length)]
        }

        const feelingDescriptions: Record<string, string> = {
            happy: 'mutlu ve memnun, kararından çok hoşnut',
            neutral: 'nötr, ne çok mutlu ne de mutsuz, idare eder',
            uncertain: 'kararsız ve belirsiz, hala emin değil',
            regret: 'pişman, keşke farklı yapsaydı diyor'
        }

        const prompt = `Sen Türkçe yazan bir içerik üreticisisin. Aşağıdaki soruya benzer bir karar veren ${count} farklı kişinin deneyimlerini yaz.

Orijinal soru: "${user_question}"

Her kişi için:
1. Benzer ama biraz farklı bir soru versiyonu yaz (anlam aynı olsun ama kelimeler değişsin)
2. O kişinin hissini belirt ve buna uygun bir deneyim hikayesi yaz
3. Hikaye doğal ve insan yazısı gibi olsun (AI gibi durmasın)
4. Uzunluk 1-3 cümle arasında olsun, bazıları kısa bazıları uzun
5. Bazılarında spesifik detay olsun (ama çok aşırı değil)

Hisler ve tonlar:
${feelings.map((f, i) => `${i + 1}. Kişi: ${feelingDescriptions[f]}`).join('\n')}

JSON formatında yanıt ver:
{
  "outcomes": [
    {
      "similar_question": "benzer soru versiyonu",
      "outcome_text": "kişinin deneyim hikayesi",
      "feeling": "${feelings[0]}",
      "outcome_type": "decided veya thinking veya cancelled"
    }
  ]
}

Önemli:
- Türkçe yaz
- Doğal ol, resmi olma
- Her hikaye farklı uzunlukta olsun
- Bazılarında emoji kullanılabilir ama zorunlu değil
- outcome_type genelde "decided" olsun ama bir tanesi "thinking" veya "cancelled" olabilir`

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

        const outcomesToInsert = outcomes.map((o: any, index: number) => ({
            session_id: null,  // No session for generated outcomes
            outcome_type: o.outcome_type || 'decided',
            outcome_text: o.outcome_text,
            feeling: feelings[index],  // Use our pre-generated weighted feelings
            related_question: o.similar_question,
            archetype_id: archetype_id || null,
            is_generated: true
        }))

        const { data: insertedOutcomes, error: insertError } = await supabase
            .from('outcomes')
            .insert(outcomesToInsert)
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
