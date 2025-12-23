import { supabase } from '../lib/supabase';

export async function voteOutcome(outcomeId: string, voteType: 'up' | 'down', sessionId: string) {
    // Optimistic - we don't wait or check for duplicates here as RLS handles it or we just let it fail silently
    // Ideally we might want to capture error but for UX we just fire and forget mostly
    const { error } = await supabase
        .from('outcome_votes')
        .insert({
            outcome_id: outcomeId,
            vote_type: voteType,
            session_id: sessionId
        });

    if (error) {
        console.error('Error voting:', error);
        // We don't throw to avoid disrupting UI flow, just log
    }
}

/**
 * Fetch user's votes for given outcome IDs
 * Returns a map of outcome_id -> vote_type ('up' | 'down')
 */
export async function fetchUserVotes(
    outcomeIds: string[],
    sessionId: string
): Promise<Record<string, 'up' | 'down'>> {
    if (!outcomeIds.length || !sessionId) {
        return {};
    }

    try {
        const { data, error } = await supabase
            .from('outcome_votes')
            .select('outcome_id, vote_type')
            .in('outcome_id', outcomeIds)
            .eq('session_id', sessionId);

        if (error) {
            console.error('Error fetching votes:', error);
            return {};
        }

        // Build map of outcome_id -> vote_type
        const votesMap: Record<string, 'up' | 'down'> = {};
        for (const vote of data || []) {
            votesMap[vote.outcome_id] = vote.vote_type as 'up' | 'down';
        }
        return votesMap;
    } catch (err) {
        console.error('Error fetching votes:', err);
        return {};
    }
}

export interface VoteCounts {
    up: number;
    down: number;
}

/**
 * Fetch vote counts for given outcome IDs
 * Returns a map of outcome_id -> { up: number, down: number }
 */
export async function fetchVoteCounts(
    outcomeIds: string[]
): Promise<Record<string, VoteCounts>> {
    if (!outcomeIds.length) {
        return {};
    }

    try {
        const { data, error } = await supabase
            .from('outcome_votes')
            .select('outcome_id, vote_type')
            .in('outcome_id', outcomeIds);

        if (error) {
            console.error('Error fetching vote counts:', error);
            return {};
        }

        // Build map of outcome_id -> counts
        const countsMap: Record<string, VoteCounts> = {};

        // Initialize all outcome IDs with zero counts
        for (const id of outcomeIds) {
            countsMap[id] = { up: 0, down: 0 };
        }

        // Count votes
        for (const vote of data || []) {
            if (!countsMap[vote.outcome_id]) {
                countsMap[vote.outcome_id] = { up: 0, down: 0 };
            }
            if (vote.vote_type === 'up') {
                countsMap[vote.outcome_id].up++;
            } else if (vote.vote_type === 'down') {
                countsMap[vote.outcome_id].down++;
            }
        }

        return countsMap;
    } catch (err) {
        console.error('Error fetching vote counts:', err);
        return {};
    }
}
