import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createEncodedResponse, createEncodedErrorResponse } from '../_shared/encoding.ts'

console.log("🚀 Initializing generate-seeded-outcomes (Deno.serve)...")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Dynamic persona pools based on archetype - each archetype gets contextually relevant personas
const PERSONA_POOLS: Record<string, string[]> = {
    // Sports, fitness, health decisions
    health_wellness: [
        'yoğun iş temposunda çalışan; stres atmak istiyor; zaman sınırlı',
        'emekli; sağlık için aktif kalmak istiyor; sosyalleşme önemli',
        'anne/baba; çocuğa örnek olmak istiyor; aile aktivitesi arıyor',
        'kilolu birey; form kazanmak istiyor; motivasyon sorunu',
        'iş arkadaşlarıyla spor yapmak isteyen; networking potansiyeli',
        'eskiden sporcu; yaralanma sonrası temkinli; form kaybı stresi',
        'genç profesyonel; sosyal medyada paylaşmak istiyor; trendy sporlar',
        'introvert; bireysel aktivite tercih ediyor; kalabalıktan kaçınıyor',
        'sağlık sorunu yaşamış; doktor önerisiyle hareket etmek istiyor',
        'sabah insanı; erken saatlerde spor yapmak istiyor; rutin arıyor',
    ],
    // Lifestyle, hobbies, routines
    lifestyle_change: [
        'şehir stresi yaşayan; doğa arayışında; hafta sonu kaçışı',
        'uzaktan çalışmaya geçen; yer bağımsız; yeni rutin arıyor',
        'emekliliğe hazırlanan; yavaşlamak istiyor; hobi ağırlıklı',
        'yeni taşınan; çevre edinmek istiyor; aktiviteyle tanışma',
        'minimalist olmak isteyen; gereksiz tüketimi azaltmak; sadelik',
        'dijital yorgunluk yaşayan; offline aktivite arıyor; detoks',
        'sosyal çevre genişletmek isteyen; yeni insanlarla tanışma',
        'yaratıcı çıkış arayan; monotonluktan sıkılmış; kendini ifade',
    ],
    // Career, job, work decisions
    career_decisions: [
        'kurumsal çalışan; terfi bekliyor; sabırsız; değişim istiyor',
        'freelancer olmak isteyen; özgürlük arıyor; gelir belirsizliği korkusu',
        'sektör değiştirmek isteyen; yetkinlik endişesi; sıfırdan başlama',
        'yöneticilik teklifi alan; sorumluluk korkusu; work-life balance',
        'startup\'a katılmak isteyen; risk iştahı orta; büyüme potansiyeli',
        'yurt dışı iş teklifi alan; aile baskısı; kültür şoku endişesi',
        'tükenmişlik yaşayan; mola vermek istiyor; kariyer sorgulaması',
        'yan iş kurmak isteyen; ek gelir; asıl işi bırakmadan deneme',
    ],
    // Tech, electronics, big purchases
    major_purchase: [
        'bütçe odaklı üniversite öğrencisi; kısıtlı bütçe; ikinci el bakıyor; taşınabilirlik önemli',
        'uzaktan çalışan; günlük toplantı yoğun; pil ve sessizlik kritik; uzun kullanım',
        'hafif içerik üreticisi; Lightroom Canva; depolama ve ekran önemli; dosya yönetimi',
        'kurumsal profesyonel; Office Slack Zoom; stabilite ve garanti önemli; az sürpriz',
        'teknoloji meraklısı; model kıyaslıyor; teknik detay seviyor; doğru seçim takıntısı',
        'aile için alışveriş yapan ebeveyn; ortak kullanım; dayanıklılık; servis ağı önemli',
        'sık seyahat eden; hafiflik; adaptör taşımak istemiyor; portlar ve şarj önemli',
        'performans odaklı kullanıcı; çok sekme çok uygulama; ısınma takıntısı; akıcılık önemli',
        'minimalist; gereksiz harcama istemiyor; işimi görsün modu; sade tercih',
        'ilk kez bu kategoride alım yapan; bilgi kirliliği yaşıyor; basit kriterlerle ilerliyor',
        'ikinci el düşünen; değer kaybına hassas; resale önemli; temkin cihaz arıyor',
        'Apple ekosistem kullanıcısı; iPhone AirPods var; uyum ve continuity önemli',
        'Windows alışkanlığı olan; geçişten çekiniyor; kısayollar ve alışkanlıklar önemli',
        'servis ve garanti hassas; risk sevmiyor; arıza korkusu; resmi kanal tercih',
        'acil ihtiyacı olan; eski cihaz bozulmuş; hızlı karar; stok kampanya baskısı',
        'kampanya kovalayan; indirim zamanlıyor; taksit ve fiyat değişimi takip ediyor',
    ],
    // Relationships
    relationship_decisions: [
        'uzun süredir ilişkide olan; evlilik baskısı hisseden; kararsız',
        'yeni ilişkiye başlayan; geçmiş yaralardan temkinli; güven sorunu',
        'uzun mesafe ilişkisi yaşayan; fiziksel uzaklık stresi; gelecek belirsiz',
        'evli çift; iletişim sorunları yaşayan; terapi düşünen',
        'ayrılık düşünen; duygusal olarak yıpranmış; yalnızlık korkusu',
        'çocuklu ebeveyn; ilişkiyi çocuklar için sürdüren; kendi mutluluğu',
    ],
    // Parenting
    parenting_decisions: [
        'ilk kez ebeveyn olan; deneyimsiz; her şeyi doğru yapmak istiyor',
        'çalışan anne/baba; iş-aile dengesi stresi; suçluluk duygusu',
        'ikinci çocuk düşünen; maddi ve fiziksel kapasite sorgulaması',
        'çocuğun okulu için karar veren; eğitim kalitesi; ulaşım; bütçe',
        'ergen çocuğu olan; iletişim kopukluğu; sınır koyma zorluğu',
        'tek ebeveyn; destek sistemi sınırlı; tüm yük üzerinde',
    ],
    // Education
    education_learning: [
        'kariyer değişimi için eğitim arayan; yeni alan öğrenmek istiyor',
        'mevcut işinde yükselmek isteyen; sertifika veya derece düşünen',
        'öğrenci; yurt dışı eğitim düşünen; maliyet ve adaptasyon endişesi',
        'kendi kendine öğrenen; online kurs vs bootcamp kararsızlığı',
        'yabancı dil öğrenmek isteyen; zaman ve yöntem sorgulaması',
        'yüksek lisans düşünen; akademik kariyer mi sektör mü kararsız',
    ],
    // Finance
    money_finance: [
        'ilk kez ev almayı düşünen; kira mı mortgage mi kararsız',
        'yatırım yapmak isteyen; risk iştahını bilmiyor; bilgi eksikliği',
        'borç yönetimi ile uğraşan; konsolidasyon düşünen',
        'emeklilik planı yapan; bireysel emeklilik faydalı mı sorguluyor',
        'acil fon oluşturmak isteyen; tasarruf alışkanlığı zayıf',
        'kripto veya hisse düşünen; volatilite korkusu; timing endişesi',
    ],
    // Food, dining, hospitality
    food_hospitality: [
        'gurme damak tadına sahip; lezzet odaklı; yeni tatlar denemeyi seven',
        'evde yemek yapmayı seven; misafir ağırlamaktan keyif alan; sunum önemli',
        'pratik çözüm arayan çalışan; hızlı ve sağlıklı yemek istiyor; zaman kısıtlı',
        'özel beslenme rejimi uygulayan; diyet/alerji kısıtlaması var; seçenek arıyor',
        'bütçe dostu mekan arayan öğrenci; fiyat/performans önemli',
        'romantik akşam yemeği planlayan; atmosfer ve sakinlik arayan',
        'kalabalık grup için organizasyon yapan; herkesi memnun etme stresi',
        'geleneksel tatları seven; macera aramayan; bildiğinden şaşmayan',
    ],
    // Social interactions
    social_decisions: [
        'sosyal kelebek; sürekli plan yapan; enerjik; yalnız kalmayı sevmeyen',
        'içine kapanık; az ama öz arkadaş tercih eden; kalabalıktan yorulan',
        'çatışmadan kaçınan; barışçıl; ara bulucu rolünde; hayır diyemeyen',
        'yeni çevreye girmiş; uyum sağlamaya çalışan; dışlanma korkusu',
        'uzun süreli dostlukları olan; vefa ve güvene önem veren',
        'sınır koymakta zorlanan; fedakar; kendinden ödün veren',
        'ev arkadaşıyla sorun yaşayan; uyum/düzen takıntısı olan',
    ],
    // Eldercare
    eldercare_decisions: [
        'yaşlı ebeveynine bakan evlat; yıpranmış; vicdan azabı ve yorgunluk',
        'uzaktan destek olmaya çalışan; kontrolü kaybetme endişesi; suçluluk',
        'profesyonel bakım arayan; güvenlik ve hijyen takıntısı; bütçe zorluğu',
        'kardeşleriyle bakım sorumluluğunu paylaşamayan; yalnız kalmış hisseden',
        'ebeveyniyle aynı evde yaşayan; özel hayatı kısıtlanmış; sabır testi',
        'demans/alzheimer ile mücadele eden yakını olan; duygusal tükeniş',
    ],
    // Travel
    travel_vacation: [
        'macera arayan gezgin; plansız; spontane; deneyim odaklı',
        'konfor düşkünü tatilci; her şey dahil olsun; yorulmak istemeyen',
        'kültür turu seven; müze ve tarih meraklısı; yoğun program yapan',
        'bütçeli gezgin; hostel ve ucuz uçak kovalayan; ekonomi öncelikli',
        'çocuklu aile; çocuk dostu otel arayan; güvenlik ve kolaylık önemli',
        'balayı çifti; romantizm ve mahremiyet arayan; özel hissetmek isteyen',
        'yalnız seyahat eden; kendini keşfetme yolculuğunda; güvenlik endişesi',
    ],
    // Leisure & Entertainment
    leisure_entertainment: [
        'dizi maratonu seven; haftasonunu evde geçirmek isteyen; sürükleyici kurgu arıyor',
        'sinema tutkunu; yönetmen sinemasına ilgi duyan; sanatsal derinlik arıyor',
        'arkadaşlarıyla film gecesi planlayan; herkesin seveceği ortak bir tür arıyor',
        'kitap okuma alışkanlığı kazanmak isteyen; kısa ve akıcı kitaplarla başlamak istiyor',
        'belgesel meraklısı; yeni şeyler öğrenmek isteyen; tarih ve bilim odaklı',
        'oyun tutkunu (gamer); hikaye odaklı oyunları seviyor; uzun soluklu macera arıyor',
        'konser/etkinlik seven; canlı performans enerjisi arıyor; sosyalleşmek istiyor',
        'bilim kurgu hayranı; distopik evrenleri seven; düşündürücü içerik arıyor',
    ],
    // Default fallback
    default: [
        'genel karar verici; araştırma yapan; tereddütlü; farklı görüşler dinliyor',
        'ilk kez bu kararı veren; deneyimsiz; öğrenme sürecinde; hata yapmak istemiyor',
        'acele karar vermesi gereken; zaman baskısı altında; pratik çözüm arıyor',
        'uzun süredir düşünen; analiz felci yaşayan; artık harekete geçmek istiyor',
        'çevresinden tavsiye alan; sosyal onay arayan; yalnız karar vermekten kaçınan',
        'deneme yanılma ile öğrenen; küçük adımlarla ilerlemek isteyen',
    ],
}

// Helper to get personas for an archetype
const getPersonasForArchetype = (archetypeId: string): string[] => {
    return PERSONA_POOLS[archetypeId] || PERSONA_POOLS.default
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_question, archetype_id, context = '', count = 3, recovery_code, decision_type = 'binary_decision' } = await req.json()

        if (!user_question) {
            return createEncodedErrorResponse('user_question is required', corsHeaders, 400)
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!openaiApiKey) {
            console.error('OPENAI_API_KEY not found')
            return createEncodedErrorResponse('API key not configured', corsHeaders, 500)
        }

        // Check cache: if recovery_code is provided, look for existing outcomes
        if (recovery_code && supabaseUrl && supabaseKey) {
            console.log('🔍 Checking cache for recovery_code:', recovery_code)

            const cacheCheckResponse = await fetch(
                `${supabaseUrl}/rest/v1/outcomes?recovery_code=eq.${encodeURIComponent(recovery_code)}&select=*&order=created_at.asc`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                    }
                }
            )

            if (cacheCheckResponse.ok) {
                const cachedOutcomes = await cacheCheckResponse.json()
                if (cachedOutcomes && cachedOutcomes.length > 0) {
                    console.log(`✅ Found ${cachedOutcomes.length} cached outcomes for recovery_code, returning from cache`)
                    return createEncodedResponse({
                        outcomes: cachedOutcomes,
                        source: 'cache'
                    }, corsHeaders)
                }
            }
            console.log('📝 No cached outcomes found, generating new ones')
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

        // Assign distinct personas with Fisher-Yates shuffle (unbiased)
        const pickDistinct = (pool: string[], n: number): string[] => {
            const arr = [...pool]
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
            }
            return arr.slice(0, Math.min(n, arr.length))
        }

        // Dynamic LLM-based persona generation based on question context
        let assignedPersonas: string[] = []
        try {
            console.log('🎭 Generating dynamic personas for question context...')
            const personaGenResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                            content: `Sen persona üretici bir asistansın. Verilen soru ve bağlam için gerçekçi Türk kullanıcı personaları üret.
Format: "rol; kısıtlar/bağlam; öncelikler"
Örnek: "yoğun tempoda çalışan mimar; haftada 2 saat boş; stres atma ve sosyalleşme öncelikli"`
                        },
                        {
                            role: 'user',
                            content: `Soru: "${user_question}"
${context ? `Bağlam: ${context}` : ''}
${archetype_id ? `Kategori: ${archetype_id}` : ''}

Bu soruyla karşılaşabilecek ${count} farklı gerçekçi Türk kullanıcı personası üret.
Her persona BİRBİRİNDEN FARKLI olmalı (farklı yaş, meslek, motivasyon).
JSON formatında yanıt ver: { "personas": ["persona1", "persona2", "persona3"] }`
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 500,
                    response_format: { type: 'json_object' }
                })
            })

            if (personaGenResponse.ok) {
                const personaData = await personaGenResponse.json()
                const personaContent = personaData.choices[0]?.message?.content
                if (personaContent) {
                    const parsed = JSON.parse(personaContent)
                    if (parsed.personas && Array.isArray(parsed.personas) && parsed.personas.length >= count) {
                        assignedPersonas = parsed.personas.slice(0, count)
                        console.log('✅ Generated dynamic personas:', assignedPersonas)
                    }
                }
            }
        } catch (personaErr) {
            console.warn('⚠️ Dynamic persona generation failed, using fallback:', personaErr)
        }

        // Fallback to static pool if dynamic generation failed
        if (assignedPersonas.length < count) {
            const fallbackPool = getPersonasForArchetype(archetype_id || 'default')
            assignedPersonas = pickDistinct(fallbackPool, count)
            console.log('📋 Using fallback personas from pool:', archetype_id || 'default')
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

        // Build the structured prompt
        const contextInstruction = context
            ? `\n\nKULLANICI BAĞLAMI (hikayelere doğal şekilde yansıt):\n${context}`
            : ''

        // Decision type specific instructions
        const decisionTypeInstructions: Record<string, string> = {
            binary_decision: `Bu "yapayım mı yapmayayım mı" tarzı bir karar. Hikayelerde:
- Kişinin yaptığı/yapmadığı TEK ANA KARAR odak noktası olmalı
- Artılar ve eksiler karşılaştırması olmalı
- "Sonunda yaptım" veya "Vazgeçtim" şeklinde net sonuçlar`,
            comparison: `Bu "A mı B mi" tarzı bir karşılaştırma kararı. Hikayelerde:
- İki veya daha fazla somut alternatif MUTLAKA karşılaştırılmalı
- Her alternativin artıları ve eksileri detaylı belirtilmeli
- "X'i tercih ettim çünkü..." formatında net karşılaştırma sonucu`,
            timing: `Bu "ne zaman yapmalıyım" tarzı bir zamanlama kararı. Hikayelerde:
- Zamanlamanın önemi vurgulanmalı
- "Şimdi mi sonra mı" ikilemi işlenmeli
- Beklemek veya hemen harekete geçmek sonuçları anlatılmalı`,
            method: `Bu "nasıl yapmalıyım" tarzı bir yöntem kararı. Hikayelerde:
- Farklı yaklaşımlar/stratejiler karşılaştırılmalı
- Seçilen yöntemin sonuçları anlatılmalı`,
            validation: `Bu "doğru mu yaptım" tarzı bir geçmiş karar değerlendirmesi. Hikayelerde:
- Geçmişte alınan kararın sonuçları değerlendirilmeli
- "Hindsight" perspektifi kullanılmalı
- "Tekrar olsa..." tarzı düşünceler eklenebilir`,
            emotional_support: `Bu duygusal destek arayışı olan bir karar. Hikayelerde:
- Benzer durumda olan kişilerin deneyimleri paylaşılmalı
- "Sen yalnız değilsin" mesajı verilmeli
- Empati ve anlayış ön planda`,
            exploration: `Bu keşif odaklı bir soru. Hikayelerde:
- Çeşitli seçenekler ve alternatiflerin keşfi anlatılmalı
- "Ben de senin gibiyken şunları denedim" formatı`
        }
        const decisionTypeInstruction = decisionTypeInstructions[decision_type] || decisionTypeInstructions.binary_decision

        const prompt = `Sen Türkçe yazan yaratıcı bir hikaye anlatıcısısın. Aşağıdaki ikileme benzer bir karar vermiş ${count} farklı gerçek kullanıcının deneyimlerini paylaşacaksın.

Orijinal soru: "${user_question}"${contextInstruction}

⚠️ KRİTİK KURAL: Hikayeler SADECE ve SADECE yukarıdaki "Orijinal soru" ile ilgili olmalı.
Örneğin soru "kahve mi çay mı" ise, ASLA "bisiklet" veya "bilgisayar" anlatma. Konu dışına çıkma. Soru neyse bağlam o kalmalı.

KARAR TİPİ: ${decision_type}
${decisionTypeInstruction}

HER BİR HİKAYE ZORUNLU OLARAK ŞU 6 ÖĞEYİ İÇERMELİ:
1. EN AZ 2 ALTERNATİF KARŞILAŞTIRMASI: Somut seçenekler (Soru ile ilgili mantıklı seçenekler, örn: X Markası vs Y Markası, Gitmek vs Gitmemek)
2. EN AZ 1 SOMUT KISIT: Soruya uygun kısıtlar (Bütçe, zaman, alerji, mesafe, bulunabilirlik, hava durumu vb.)
3. SOMUT KULLANIM SENARYOSU: Kararın nerede ve nasıl kullanılacağı (Günlük rutin, iş, özel gün, seyahat, anlık istek vb.)
4. SOMUT KRİTER: Karar vermeyi etkileyen faktörler (Fiyat, kalite, lezzet, konfor, hız, dayanıklılık, his vb.)
5. SOMUT TETİKLEYİCİ OLAY: Kararı vermeye iten an (İhtiyaç oluşması, canın çekmesi, bozulma, davet, yorgunluk vb.)
6. SOMUT SONRASI GÖZLEM: Beklenti karşılandı mı, tatmin düzeyi, pişmanlık nedeni veya iyi ki yapmışım dedirten detay

KAT'İ YASAKLAR (BUNLARI ASLA KULLANMA):
- ❌ "Marka A", "Marka B", "Model X", "Seçenek 1" gibi JENERİK İSİMLENDİRMELER YASAK.
- ❌ "Bir marka", "Diğer marka" gibi belirsiz ifadeler YASAK.
- ❌ "Tavsiye ederim", "Kesinlikle almalısın" gibi TAVSİYE DİLİ YASAK.
- ❌ "45.000 TL", "100 Dolar" gibi KESİN SAYISAL TUTAR YASAK.

GERÇEKÇİLİK KURALI (ŞUNLARI KULLAN):
- ✅ GERÇEK MARKA/MODEL İSİMLERİ KULLAN: Eğer soru teknoloji ise "Samsung vs iPhone", "Sony vs Bose" de. Araba ise "Fiat Egea vs Renault Clio" de.
- ✅ Eğer marka ismi vermek istemiyorsan NİTELEYİCİ SIFAT KULLAN: "Pahalı olan", "Alman malı olan", "Çin menşeli olan", "Yerli üretim olan", "Eski model", "Yeni çıkan model".
- ✅ Hikaye sanki "Ekşi Sözlük" entry'si veya samimi bir forum yorumu gibi olmalı.

YASAK İFADELER (bunları ASLA kullanma - tavsiye veren dil):
"şunu almalısın", "kesinlikle tavsiye ederim", "en iyisi budur", "tavsiye ederim", "garanti ederim", "kesin sonuç alırsın"

SAYISAL TUTAR YASAĞI (enflasyon nedeniyle):
- Spesifik TL tutarı KULLANMA (örn: "45 bin TL", "30.000 TL", "50k")
- Bunun yerine göreceli ifadeler kullan: "bütçemin üst sınırı", "orta segment", "üst segment", "ekonomik seçenek", "premium fiyat"
- Taksit sayısı kullanabilirsin ama tutar verme

SERBEST İFADELER (bunları kullanabilirsin - teknik/somut terimler):
"garanti süresi", "resmi distribütör", "yetkili servis", "garanti kapsamı"

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
      "similar_question": "Kısa, spesifik başlık (format: Konu + 1 kısıt + 1 alternatif, örn: 'Kısıtlı zamanda X mi Y mi')",
      "persona": "Persona etiketi (yukarıdan al)",
      "options_considered": ["Gerçek marka/model 1", "Gerçek marka/model 2"],
      "constraints": ["kısıt1", "kısıt2"],
      "trigger": "Kararı tetikleyen olay",
      "tradeoffs": {
        "pros": ["artı1", "artı2"],
        "cons": ["eksi1", "eksi2"]
      },
      "what_happened_after": "1-2 cümle: karardan sonra ne oldu",
      "outcome_text": "1-2 paragraf, doğal Türkçe, detaylı süreç + sonuç. Marka A/B DEME, gerçek marka veya niteleyici kullan.",
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
                        content: 'Sen Türkçe deneyim hikayeleri üreten bir asistansın. Tavsiye verme, yaşanmış deneyim anlat. Doğal ve samimi bir dil kullan.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9,
                max_tokens: 3000,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'seeded_outcomes',
                        strict: true,
                        schema: {
                            type: 'object',
                            properties: {
                                outcomes: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            similar_question: { type: 'string', description: 'Kısa, spesifik başlık' },
                                            persona: { type: 'string', description: 'Persona etiketi' },
                                            options_considered: { type: 'array', items: { type: 'string' }, description: 'Değerlendirilen alternatifler' },
                                            constraints: { type: 'array', items: { type: 'string' }, description: 'Kısıtlar' },
                                            trigger: { type: 'string', description: 'Kararı tetikleyen olay' },
                                            tradeoffs: {
                                                type: 'object',
                                                properties: {
                                                    pros: { type: 'array', items: { type: 'string' } },
                                                    cons: { type: 'array', items: { type: 'string' } }
                                                },
                                                required: ['pros', 'cons'],
                                                additionalProperties: false
                                            },
                                            what_happened_after: { type: 'string', description: 'Karardan sonra ne oldu' },
                                            outcome_text: { type: 'string', description: '1-2 paragraf detaylı hikaye' },
                                            feeling: { type: 'string', enum: ['happy', 'neutral', 'uncertain', 'regret'] },
                                            outcome_type: { type: 'string', enum: ['decided', 'cancelled'] }
                                        },
                                        required: ['similar_question', 'persona', 'options_considered', 'constraints', 'trigger', 'tradeoffs', 'what_happened_after', 'outcome_text', 'feeling', 'outcome_type'],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ['outcomes'],
                            additionalProperties: false
                        }
                    }
                }
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

        // Validation: Type-based checks to avoid false positives on empty arrays/objects
        const hasValue = (v: any): boolean => v !== undefined && v !== null

        const validateOutcome = (o: any): { valid: boolean; missing: string[] } => {
            const missing: string[] = []

            // String field validations with min length
            if (!hasValue(o.similar_question) || String(o.similar_question).trim().length < 8)
                missing.push('similar_question')
            if (!hasValue(o.persona) || String(o.persona).trim().length < 5)
                missing.push('persona')
            if (!hasValue(o.trigger) || String(o.trigger).trim().length < 8)
                missing.push('trigger')
            if (!hasValue(o.what_happened_after) || String(o.what_happened_after).trim().length < 15)
                missing.push('what_happened_after')

            // Array field validations with min count
            if (!Array.isArray(o.options_considered) || o.options_considered.length < 2)
                missing.push('options_considered 2+')
            if (!Array.isArray(o.constraints) || o.constraints.length < 1)
                missing.push('constraints 1+')

            // Tradeoffs structure validation
            if (!o.tradeoffs || !Array.isArray(o.tradeoffs.pros) || o.tradeoffs.pros.length < 2)
                missing.push('tradeoffs.pros 2+')
            if (!o.tradeoffs || !Array.isArray(o.tradeoffs.cons) || o.tradeoffs.cons.length < 2)
                missing.push('tradeoffs.cons 2+')

            // outcome_text min length (raised to 220 for better quality)
            const text = String(o.outcome_text || '').trim()
            if (text.length < 220) missing.push('outcome_text too short')

            // Enum validations
            const validFeelings = ['happy', 'neutral', 'uncertain', 'regret']
            if (!validFeelings.includes(String(o.feeling || '').toLowerCase()))
                missing.push('invalid feeling')

            const validTypes = ['decided', 'cancelled']
            if (!validTypes.includes(String(o.outcome_type || '').toLowerCase()))
                missing.push('invalid outcome_type')

            return { valid: missing.length === 0, missing }
        }

        // Validate all outcomes
        const validationResults = outcomes.map((o: any, i: number) => ({
            index: i,
            ...validateOutcome(o)
        }))

        const invalidOutcomes = validationResults.filter((r: any) => !r.valid)

        // If there are invalid outcomes, try a fix pass
        let finalInvalidOutcomes = invalidOutcomes
        if (invalidOutcomes.length > 0) {
            console.warn('Some outcomes failed validation, attempting fix pass:', invalidOutcomes)

            const fixPrompt = `Aşağıdaki JSON'daki eksik alanları düzelt.

Eksik alanlar: ${invalidOutcomes.map((io: any) => `Outcome ${io.index + 1}: ${io.missing.join(', ')}`).join('; ')}

Mevcut JSON:
${JSON.stringify(generatedData, null, 2)}

KATI KURALLAR - İHLAL ETME:
1. outcomes array'inin eleman SAYISINI DEĞİŞTİRME - tam olarak ${count} tane outcome olmalı
2. Yeni outcome EKLEME veya mevcut outcome SİLME
3. persona, feeling, outcome_type değerlerini DEĞİŞTİRME
4. Sadece eksik/kısa alanları zenginleştir
5. Aynı JSON formatında yanıt ver`

            try {
                const fixResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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
                                content: 'Sen JSON düzeltici bir asistansın. SADECE eksik alanları tamamla. Outcome sayısını, persona/feeling/outcome_type değerlerini KESİNLİKLE değiştirme. Yeni outcome ekleme veya silme.'
                            },
                            { role: 'user', content: fixPrompt }
                        ],
                        temperature: 0.5,
                        max_tokens: 3000,
                        response_format: {
                            type: 'json_schema',
                            json_schema: {
                                name: 'fixed_outcomes',
                                strict: true,
                                schema: {
                                    type: 'object',
                                    properties: {
                                        outcomes: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    similar_question: { type: 'string' },
                                                    persona: { type: 'string' },
                                                    options_considered: { type: 'array', items: { type: 'string' } },
                                                    constraints: { type: 'array', items: { type: 'string' } },
                                                    trigger: { type: 'string' },
                                                    tradeoffs: {
                                                        type: 'object',
                                                        properties: {
                                                            pros: { type: 'array', items: { type: 'string' } },
                                                            cons: { type: 'array', items: { type: 'string' } }
                                                        },
                                                        required: ['pros', 'cons'],
                                                        additionalProperties: false
                                                    },
                                                    what_happened_after: { type: 'string' },
                                                    outcome_text: { type: 'string' },
                                                    feeling: { type: 'string', enum: ['happy', 'neutral', 'uncertain', 'regret'] },
                                                    outcome_type: { type: 'string', enum: ['decided', 'cancelled'] }
                                                },
                                                required: ['similar_question', 'persona', 'options_considered', 'constraints', 'trigger', 'tradeoffs', 'what_happened_after', 'outcome_text', 'feeling', 'outcome_type'],
                                                additionalProperties: false
                                            }
                                        }
                                    },
                                    required: ['outcomes'],
                                    additionalProperties: false
                                }
                            }
                        }
                    })
                })

                if (fixResponse.ok) {
                    const fixData = await fixResponse.json()
                    const fixContent = fixData.choices[0]?.message?.content
                    if (fixContent) {
                        const fixedData = JSON.parse(fixContent)
                        if (fixedData.outcomes && Array.isArray(fixedData.outcomes) && fixedData.outcomes.length === count) {
                            outcomes = fixedData.outcomes
                            console.log('Fix pass successful, using fixed outcomes')

                            // Re-validate after fix pass
                            const revalidationResults = outcomes.map((o: any, i: number) => ({
                                index: i,
                                ...validateOutcome(o)
                            }))
                            finalInvalidOutcomes = revalidationResults.filter((r: any) => !r.valid)
                            if (finalInvalidOutcomes.length > 0) {
                                console.warn('Some outcomes still invalid after fix pass:', finalInvalidOutcomes)
                            } else {
                                console.log('All outcomes valid after fix pass')
                            }
                        } else {
                            console.warn('Fix pass returned wrong outcome count, keeping original')
                        }
                    }
                }
            } catch (fixErr) {
                console.warn('Fix pass failed, proceeding with original outcomes:', fixErr)
            }
        }

        // Ensure we have exactly 'count' outcomes - pad with fallbacks if needed
        while (outcomes.length < count) {
            const idx = outcomes.length
            console.warn(`Padding missing outcome at index ${idx}`)
            outcomes.push({
                similar_question: user_question,
                persona: assignedPersonas[idx] || 'genel kullanıcı',
                options_considered: ['Seçenek A', 'Seçenek B'],
                constraints: ['Belirsiz kısıt'],
                trigger: 'Karar anı geldi',
                tradeoffs: { pros: ['Artı 1', 'Artı 2'], cons: ['Eksi 1', 'Eksi 2'] },
                what_happened_after: 'Sonuç henüz belirsiz.',
                outcome_text: 'Bu kullanıcı henüz tam hikayesini paylaşmadı. Benzer durumda olan başka kullanıcıların deneyimlerine bakabilirsiniz. Kararlar her zaman kolay olmuyor, ama sonunda herkes kendi yolunu buluyor.',
                feeling: outcomeCombos[idx]?.feeling || 'neutral',
                outcome_type: outcomeCombos[idx]?.outcomeType || 'decided'
            })
        }

        // Save to database
        const supabase = createClient(supabaseUrl!, supabaseKey!)

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

        // Valid outcome_type values that match database check constraint
        const validOutcomeTypes = ['decided', 'cancelled'] as const
        type ValidOutcomeType = typeof validOutcomeTypes[number]

        // Sanitize outcome_type value - map invalid values to fallback
        const sanitizeOutcomeType = (outcomeType: string | undefined, fallback: string): ValidOutcomeType => {
            if (!outcomeType) return fallback as ValidOutcomeType
            const normalized = outcomeType.toLowerCase().trim()

            // Direct match
            if (validOutcomeTypes.includes(normalized as ValidOutcomeType)) {
                return normalized as ValidOutcomeType
            }

            // Map common alternatives
            const typeMap: Record<string, ValidOutcomeType> = {
                'did': 'decided',
                'done': 'decided',
                'completed': 'decided',
                'yes': 'decided',
                'chose': 'decided',
                'cancel': 'cancelled',
                'no': 'cancelled',
                'skipped': 'cancelled',
                'abandoned': 'cancelled',
                'quit': 'cancelled'
            }

            return typeMap[normalized] || fallback as ValidOutcomeType
        }

        // Generate embeddings for each outcome (based on similar_question + original context)
        // This ensures generated outcomes match users with similar question AND answers
        const outcomesWithEmbeddings = await Promise.all(
            outcomes.map(async (o: any, index: number) => {
                // Force persona from assignedPersonas if model didn't use it correctly
                const finalPersona = o.persona || assignedPersonas[index] || 'genel kullanıcı'
                // Override o.persona to ensure consistency
                o.persona = finalPersona

                // Build rich text for embedding including new fields + decision_type
                const embeddingParts = [
                    o.similar_question || user_question,
                    decision_type, // decision type for better matching
                    finalPersona,
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

                // Sanitize outcome_type to prevent DB constraint violation
                const fallbackOutcomeType = outcomeCombos[index]?.outcomeType || 'decided'
                const sanitizedOutcomeType = sanitizeOutcomeType(o.outcome_type, fallbackOutcomeType)

                // Build metadata JSON with the new structured fields
                const metadata = {
                    persona: finalPersona,
                    options_considered: o.options_considered || [],
                    constraints: o.constraints || [],
                    trigger: o.trigger || null,
                    tradeoffs: o.tradeoffs || { pros: [], cons: [] },
                    what_happened_after: o.what_happened_after || null
                }

                return {
                    session_id: null,
                    outcome_type: sanitizedOutcomeType,
                    outcome_text: o.outcome_text,
                    feeling: sanitizedFeeling,
                    related_question: o.similar_question,
                    archetype_id: archetype_id || null,
                    is_generated: true,
                    embedding,
                    metadata, // Store additional structured data
                    recovery_code: recovery_code || null // Link to session for caching
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

        return createEncodedResponse({
            success: true,
            generated_count: insertedOutcomes?.length || 0,
            outcomes: insertedOutcomes,
            validation_warnings: finalInvalidOutcomes.length > 0 ? finalInvalidOutcomes : undefined
        }, corsHeaders)

    } catch (err) {
        console.error('Error:', err)
        return createEncodedErrorResponse('Failed to generate outcomes: ' + String(err), corsHeaders, 500)
    }
})
