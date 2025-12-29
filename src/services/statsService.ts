import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { fetchDecoded } from '../lib/apiDecoder';

export interface ArchetypeStats {
    satisfaction_rate: number;
    satisfaction_change: number;
    most_common_feeling: string;
    most_common_feeling_emoji: string;
    average_decision_days: number;
    total_outcomes: number;
}

const defaultStats: ArchetypeStats = {
    satisfaction_rate: 85,
    satisfaction_change: 2,
    most_common_feeling: 'Rahatlama',
    most_common_feeling_emoji: '😌',
    average_decision_days: 14,
    total_outcomes: 0
};

export async function getArchetypeStats(archetypeId?: string): Promise<ArchetypeStats> {
    if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured');
        return defaultStats;
    }

    try {
        const data = await fetchDecoded<ArchetypeStats>(
            `${SUPABASE_FUNCTIONS_URL}/get-archetype-stats`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ archetype_id: archetypeId })
            }
        );
        return data || defaultStats;
    } catch (error) {
        console.error('Error fetching archetype stats:', error);
        return defaultStats;
    }
}
