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

// NOTE: fetchUserVotes and fetchVoteCounts were removed as they are now handled
// server-side in the fetch-community-stories Edge Function for better performance.

