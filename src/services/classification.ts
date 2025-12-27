import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import type { Archetype } from '../types/registry';

export interface ClassificationResult {
    archetype_id: string;
    decision_type: 'binary_decision' | 'comparison' | 'timing' | 'method' | 'validation' | 'emotional_support' | 'exploration';
    confidence: number;
    needs_clarification: boolean;
    is_unrealistic?: boolean;
    clarification_prompt?: string;
    interpreted_question?: string;
}

export class ClassificationService {
    /**
     * Classifies the user's question into one of the provided archetypes.
     * Returns needs_clarification: true if the input is too vague.
     */
    static async classifyUserQuestion(userQuestion: string, archetypes: Archetype[]): Promise<ClassificationResult> {
        // Check if Supabase is configured
        if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
            console.warn("Supabase not configured. Returning fallback.");
            return {
                archetype_id: archetypes[0]?.id || 'career_decisions',
                decision_type: 'binary_decision',
                confidence: 0,
                needs_clarification: true,
                clarification_prompt: 'Lütfen kararınızı biraz daha açıklayın.'
            };
        }

        try {
            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/classify-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    user_question: userQuestion,
                    archetypes: archetypes.map(a => ({
                        id: a.id,
                        label: a.label,
                        routing_hints: a.routing_hints
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`Classification API error: ${response.status}`);
            }

            const result = await response.json();

            // Fallback: if clarification_prompt mentions "gerçek bir karar", treat as unrealistic
            const promptIndicatesUnrealistic = result.clarification_prompt?.includes('gerçek bir karar') ||
                result.clarification_prompt?.includes('gerçek hayat');

            return {
                archetype_id: result.archetype_id || archetypes[0]?.id || 'career_decisions',
                decision_type: result.decision_type || 'binary_decision',
                confidence: result.confidence || 0,
                needs_clarification: result.needs_clarification || false,
                is_unrealistic: result.is_unrealistic || promptIndicatesUnrealistic || false,
                clarification_prompt: result.clarification_prompt || undefined,
                interpreted_question: result.interpreted_question || undefined
            };

        } catch (error) {
            console.error("Classification Service Error:", error);
            return {
                archetype_id: archetypes[0]?.id || 'career_decisions',
                decision_type: 'binary_decision',
                confidence: 0,
                needs_clarification: true,
                clarification_prompt: 'Bir hata oluştu. Lütfen tekrar deneyin.'
            };
        }
    }
}
