import type { Archetype } from '../types/registry';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ClassificationResult {
    archetype_id: string;
    confidence: number;
}

export class ClassificationService {
    /**
     * Classifies the user's question into one of the provided archetypes.
     */
    static async classifyUserQuestion(userQuestion: string, archetypes: Archetype[]): Promise<ClassificationResult> {
        // Check if Supabase is configured
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn("Supabase not configured. Returning fallback.");
            return { archetype_id: archetypes[0]?.id || 'career_decisions', confidence: 0 };
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-question`, {
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
            return {
                archetype_id: result.archetype_id || archetypes[0]?.id || 'career_decisions',
                confidence: result.confidence || 0
            };

        } catch (error) {
            console.error("Classification Service Error:", error);
            return {
                archetype_id: archetypes[0]?.id || 'career_decisions',
                confidence: 0
            };
        }
    }
}

