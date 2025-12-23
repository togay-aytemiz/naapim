import type { Archetype } from '../types/registry';

export interface ClassificationResult {
    archetype_id: string;
    confidence: number;
}

export class ClassificationService {
    private static generateSystemPrompt(archetypes: Archetype[]): string {
        let prompt = `You are an expert decision-making assistant. Your goal is to classify a user's question into one of the following archetypes based on their specific needs and context.\n\n`;
        prompt += `Analyze the user's input carefully and select the most appropriate 'id' from the list below. Use the provided definition, examples, keywords to guide your decision.\n\n`;
        prompt += `You must strictly return valid JSON in the following format: { "archetype_id": "string", "confidence": number }.\n`;
        prompt += `The confidence score should be between 0.0 and 1.0. If the input is vague, ambiguous, or does not clearly fit any archetype, return a low confidence score (e.g., < 0.6).\n\n`;

        prompt += `Defined Archetypes:\n`;

        archetypes.forEach(arch => {
            prompt += `--- Archetype: ${arch.label} (ID: ${arch.id}) ---\n`;
            prompt += `Definition: ${arch.routing_hints.definition}\n`;
            prompt += `Keywords: ${arch.routing_hints.keywords.join(', ')}\n`;
            prompt += `Positive Examples:\n - ${arch.routing_hints.positive_examples.join('\n - ')}\n`;
            prompt += `Negative Examples:\n - ${arch.routing_hints.negative_examples.join('\n - ')}\n`;
            prompt += `Exclusions: ${arch.routing_hints.exclusions.join(', ')}\n`;
            prompt += `\n`;
        });

        prompt += `If no archetype fits well, pick the closest one but set a very low confidence score.\n`;

        return prompt;
    }

    /**
     * Classifies the user's question into one of the provided archetypes.
     * 
     * @param userQuestion The raw input question from the user.
     * @param archetypes The list of available archetypes to choose from.
     * @returns A promise that resolves to the classification result.
     */
    static async classifyUserQuestion(userQuestion: string, archetypes: Archetype[]): Promise<ClassificationResult> {
        const systemPrompt = this.generateSystemPrompt(archetypes);

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini';

        if (!apiKey) {
            console.warn("Missing VITE_OPENAI_API_KEY. Returning mock response.");
            // Fallback mock if no key provided
            return { archetype_id: archetypes[0].id, confidence: 0.0 };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userQuestion }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("OpenAI API Error:", response.status, errorData);
                throw new Error(`OpenAI API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            if (!content) {
                throw new Error("Empty response from OpenAI");
            }

            const result = JSON.parse(content);
            return {
                archetype_id: result.archetype_id || archetypes[0].id,
                confidence: typeof result.confidence === 'number' ? result.confidence : 0.0
            };

        } catch (error) {
            console.error("Classification Service Error:", error);
            // Graceful fallback
            return {
                archetype_id: archetypes[0].id,
                confidence: 0.0
            };
        }
    }
}
