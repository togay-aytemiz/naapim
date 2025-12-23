const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type OutcomeType = 'decided' | 'thinking' | 'cancelled';
export type FeelingType = 'happy' | 'neutral' | 'regret' | 'uncertain';

export interface SaveOutcomeParams {
    session_id: string;
    outcome_type: OutcomeType;
    outcome_text?: string;
    feeling?: FeelingType;
    archetype_id?: string;  // For matching similar questions
}

export interface SaveOutcomeResponse {
    success: boolean;
    outcome_id?: string;
    created_at?: string;
    message?: string;
    error?: string;
}

export async function saveOutcome(params: SaveOutcomeParams): Promise<SaveOutcomeResponse> {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/save-outcome`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Save outcome failed:', data);
            return { success: false, error: data.error || 'Failed to save outcome' };
        }

        return data;
    } catch (error) {
        console.error('Save outcome error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
