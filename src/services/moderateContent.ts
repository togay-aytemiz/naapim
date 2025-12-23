const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ModerationResult {
    approved: boolean;
    reason?: string;
    category?: string;
    corrected_text?: string;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
    try {
        // Skip moderation for empty text
        if (!text || text.trim().length === 0) {
            return { approved: true, corrected_text: text };
        }

        // Check if Supabase is configured
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured, skipping moderation');
            return { approved: true, corrected_text: text };
        }

        // Call server-side Edge Function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/moderate-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            console.error('Moderation API error:', response.status);
            return { approved: true, corrected_text: text };
        }

        const result: ModerationResult = await response.json();

        // Map category to user-friendly Turkish messages
        const categoryMessages: Record<string, string> = {
            contact_info: 'İletişim bilgisi (e-posta, telefon, sosyal medya) paylaşamazsın.',
            advertisement: 'Reklam veya tanıtım içeriği paylaşamazsın.',
            financial_advice: 'Finansal tavsiye içeren içerik paylaşamazsın.',
            offensive: 'Saldırgan veya küfürlü içerik paylaşamazsın.',
            personal_info: 'Kişisel bilgi paylaşamazsın.',
            spam: 'Spam veya anlamsız içerik paylaşamazsın.',
            harmful: 'Zararlı içerik paylaşamazsın.'
        };

        return {
            approved: result.approved,
            reason: result.approved ? undefined : (categoryMessages[result.category || ''] || result.reason || 'Topluluk kurallarına uymuyor.'),
            category: result.category,
            corrected_text: result.approved ? (result.corrected_text || text) : undefined
        };

    } catch (error) {
        console.error('Moderation error:', error);
        return { approved: true, corrected_text: text };
    }
}

