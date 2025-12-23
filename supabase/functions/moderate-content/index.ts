import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationRequest {
    text: string;
}

interface ModerationResult {
    approved: boolean;
    reason?: string;
    category?: string;
    corrected_text?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY not configured')
        }

        const { text }: ModerationRequest = await req.json()

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ approved: true, corrected_text: text }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use GPT to check content and fix grammar
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Sen bir içerik moderatörü ve dil editörüsün. İki görevin var:

1. MODERASYON - Topluluk kurallarına uygunluğu kontrol et
2. YAZIM DÜZELTMESİ - Yazım ve dilbilgisi hatalarını düzelt

YASAKLI İÇERİKLER:
1. İletişim bilgileri (e-posta, telefon numarası, sosyal medya hesapları, web sitesi)
2. Reklam veya tanıtım içeriği (ürün, hizmet, şirket tanıtımı)
3. Finansal tavsiye (yatırım tavsiyeleri, kripto, borsa önerileri)
4. Hakaret, küfür veya saldırgan dil
5. Kişisel bilgiler (isim, adres, kimlik numarası)
6. Spam veya anlamsız içerik
7. Zararlı veya tehlikeli içerik

YAZIM DÜZELTMESİ KURALLARI:
- SADECE yazım yanlışlarını düzelt (örn: "bişey" → "bir şey", "yapcam" → "yapacağım")
- SADECE dilbilgisi hatalarını düzelt (örn: eksik harfler, yanlış ekler)
- Anlamı DEĞİŞTİRME
- Cümle yapısını DEĞİŞTİRME
- Kelime seçimini DEĞİŞTİRME (eş anlamlı kelime koyma)
- Eğer metin zaten doğruysa, aynısını döndür

CEVAP FORMATI (JSON):
{
  "approved": true/false,
  "reason": "Reddedilme sebebi (sadece approved=false ise)",
  "category": "Kategori adı (contact_info, advertisement, financial_advice, offensive, personal_info, spam, harmful)",
  "corrected_text": "Yazım ve dilbilgisi düzeltilmiş metin (approved=true ise)"
}

ÖNEMLİ:
- Sadece gerçekten sorunlu içerikleri reddet
- Normal hikaye paylaşımlarına izin ver
- Duygusal ifadeler (üzgün, mutlu, korkmuş) sorun değil
- Türkçe cevap ver
- corrected_text her zaman doldurulmalı (approved=true ise)`
                    },
                    {
                        role: 'user',
                        content: `Bu metni değerlendir ve gerekirse düzelt:\n\n"${text}"`
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        })

        if (!response.ok) {
            console.error('OpenAI API error:', await response.text())
            // If OpenAI fails, approve by default (fail open)
            return new Response(
                JSON.stringify({ approved: true, corrected_text: text }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''

        // Parse the JSON response
        try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const result: ModerationResult = JSON.parse(jsonMatch[0])

                // Map category to user-friendly Turkish messages
                const categoryMessages: Record<string, string> = {
                    contact_info: 'İletişim bilgisi (e-posta, telefon, sosyal medya) paylaşamazsın.',
                    advertisement: 'Reklam veya tanıtım içeriği paylaşamazsın.',
                    financial_advice: 'Finansal tavsiye içeren içerik paylaşamazsın.',
                    offensive: 'Saldırgan veya küfürlü içerik paylaşamazsın.',
                    personal_info: 'Kişisel bilgi paylaşamazsın.',
                    spam: 'Spam veya anlamsız içerik paylaşamazsın.',
                    harmful: 'Zararlı içerik paylaşamazsın.'
                }

                return new Response(
                    JSON.stringify({
                        approved: result.approved,
                        reason: result.approved ? undefined : (categoryMessages[result.category || ''] || result.reason || 'Topluluk kurallarına uymuyor.'),
                        category: result.category,
                        corrected_text: result.approved ? (result.corrected_text || text) : undefined
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        } catch (parseError) {
            console.error('Failed to parse moderation response:', parseError, content)
        }

        // Default to approved if parsing fails
        return new Response(
            JSON.stringify({ approved: true, corrected_text: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Moderation error:', error)
        // Fail open - approve if there's an error
        return new Response(
            JSON.stringify({ approved: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
