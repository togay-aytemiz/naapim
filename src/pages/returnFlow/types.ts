import type { AnalysisResult } from '../../services/analysis';
import type { FeelingType } from '../../services/saveOutcome';

export interface Outcome {
    id: string;
    outcome_type: 'decided' | 'thinking' | 'cancelled';
    outcome_text?: string;
    feeling?: FeelingType;
    created_at: string;
    // Vote data from server
    vote_counts?: { up: number; down: number };
    user_vote?: 'up' | 'down' | null;
}

export interface SessionData {
    session_id: string;
    code: string;
    user_question: string;
    archetype_id: string;
    created_at: string; // For time-gating
    has_reminder: boolean; // For reminder CTA
    answers: Record<string, string>;
    analysis: AnalysisResult | null;
    previous_outcomes: Outcome[];
}

export type FlowStep =
    | 'enter-code'
    | 'too-early'           // Time-gated: user came back too soon
    | 'welcome-back'
    | 'returning-user'      // User has previous outcomes - show last choice
    | 'choose-outcome'      // Select decided/thinking/cancelled
    | 'ask-feeling'         // How do you feel about your decision?
    | 'share-outcome'
    | 'thinking-reminder'   // Prompt reminder for "thinking" users without future reminder
    | 'view-stories';

export type OutcomeType = 'decided' | 'thinking' | 'cancelled' | null;
