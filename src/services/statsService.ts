import { supabase } from '../lib/supabase';

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
    try {
        const { data, error } = await supabase.functions.invoke('get-archetype-stats', {
            body: { archetype_id: archetypeId },
        });

        if (error) {
            console.error('Failed to fetch archetype stats:', error);
            return defaultStats;
        }

        return data || defaultStats;
    } catch (error) {
        console.error('Error fetching archetype stats:', error);
        return defaultStats;
    }
}
