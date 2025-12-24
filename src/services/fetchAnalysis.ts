import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

interface FetchAnalysisResult {
    session_id: string;
    code: string;
    user_question: string;
    archetype_id: string;
    answers: Record<string, string>;
    analysis: {
        title: string;
        recommendation: string;
        reasoning: string;
        steps: string[];
        sentiment: string;
    } | null;
}

export async function fetchAnalysisByCode(code: string): Promise<FetchAnalysisResult | null> {
    if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase env vars not set');
        return null;
    }

    try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            console.error('Failed to fetch analysis:', response.status);
            return null;
        }

        const data = await response.json();
        return data as FetchAnalysisResult;
    } catch (error) {
        console.error('Error fetching analysis:', error);
        return null;
    }
}
