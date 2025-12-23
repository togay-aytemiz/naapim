import { supabase } from '../lib/supabase';
import type { AnalysisResult } from './analysis';

interface SaveAnalysisParams {
    session_id: string;
    code: string;
    analysis: AnalysisResult;
}

export async function saveAnalysis(params: SaveAnalysisParams): Promise<{ success: boolean; error?: string }> {
    const { session_id, code, analysis } = params;

    try {
        const { data, error } = await supabase.functions.invoke('save-analysis', {
            body: { session_id, code, analysis }
        });

        if (error) {
            console.error('Save analysis error:', error);
            return { success: false, error: error.message };
        }

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
