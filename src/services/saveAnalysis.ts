import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { fetchDecoded } from '../lib/apiDecoder';
import type { AnalysisResult } from './analysis';

interface SaveAnalysisParams {
    session_id: string;
    code: string;
    analysis: AnalysisResult;
}

interface SaveAnalysisResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export async function saveAnalysis(params: SaveAnalysisParams): Promise<{ success: boolean; error?: string }> {
    const { session_id, code, analysis } = params;

    if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase not configured');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const data = await fetchDecoded<SaveAnalysisResponse>(
            `${SUPABASE_FUNCTIONS_URL}/save-analysis`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ session_id, code, analysis })
            }
        );

        if (data?.error) {
            console.error('Save analysis response error:', data.error);
            return { success: false, error: data.error };
        }

        console.log('Analysis saved successfully');
        return { success: true };
    } catch (err) {
        console.error('Save analysis exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
