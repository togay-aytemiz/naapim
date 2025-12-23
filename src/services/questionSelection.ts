import type { Archetype } from '../types/registry';

// @ts-ignore
import archetypesData from '../../config/registry/archetypes.json';
// @ts-ignore
import categorySetsData from '../../config/registry/category_sets.json';
// @ts-ignore
import categoriesData from '../../config/registry/categories.json';
// @ts-ignore
import fieldsData from '../../config/registry/fields.json';
// @ts-ignore
import optionSetsData from '../../config/registry/option_sets.json';

interface Field {
    key: string;
    label: string;
    type: string;
    option_set_id: string;
}

interface Option {
    id: string;
    label: string;
}

interface FieldWithOptions extends Field {
    options: Option[];
}

interface QuestionSelectionResult {
    selectedFieldKeys: string[];
    reasoning?: string;
}

export class QuestionSelectionService {
    private static archetypes: Archetype[] = (archetypesData as any).archetypes;
    private static categorySets: any[] = (categorySetsData as any).category_sets;
    private static categories: any[] = (categoriesData as any).categories;
    private static fields: Field[] = (fieldsData as any).fields;
    private static optionSets: any[] = (optionSetsData as any).option_sets;

    /**
     * Get all available fields for an archetype with their options
     */
    static getAvailableFieldsForArchetype(archetypeId: string): FieldWithOptions[] {
        const archetype = this.archetypes.find(a => a.id === archetypeId);
        if (!archetype) return [];

        const allFieldKeys: string[] = [];

        // Gather all field keys from category sets
        for (const setId of archetype.category_set_ids) {
            const categorySet = this.categorySets.find(cs => cs.id === setId);
            if (!categorySet) continue;

            for (const categoryId of categorySet.category_ids) {
                const category = this.categories.find(c => c.id === categoryId);
                if (!category) continue;
                allFieldKeys.push(...category.field_keys);
            }
        }

        // Get full field objects with options
        const fieldsWithOptions: FieldWithOptions[] = [];
        for (const fieldKey of allFieldKeys) {
            const field = this.fields.find(f => f.key === fieldKey);
            if (!field) continue;

            const optionSet = this.optionSets.find(os => os.id === field.option_set_id);
            const options: Option[] = optionSet?.options || [];

            fieldsWithOptions.push({
                ...field,
                options
            });
        }

        return fieldsWithOptions;
    }

    /**
     * Create a compact representation of fields for the LLM prompt
     */
    private static formatFieldsForPrompt(fields: FieldWithOptions[]): string {
        return fields.map(f => {
            const optionLabels = f.options.map(o => o.label).join(' | ');
            return `- ${f.key}: "${f.label}" [${optionLabels}]`;
        }).join('\n');
    }

    /**
     * Use LLM to select the most relevant 3-5 fields for this specific user question
     */
    static async selectQuestions(
        userQuestion: string,
        archetypeId: string
    ): Promise<QuestionSelectionResult> {
        const archetype = this.archetypes.find(a => a.id === archetypeId);
        const archetypeLabel = archetype?.label || archetypeId;
        const availableFields = this.getAvailableFieldsForArchetype(archetypeId);

        if (availableFields.length <= 10) {
            // If 10 or fewer fields, just use all of them
            return {
                selectedFieldKeys: availableFields.map(f => f.key),
                reasoning: 'Using all available fields (10 or fewer)'
            };
        }

        const fieldListForPrompt = this.formatFieldsForPrompt(availableFields);

        const systemPrompt = `You are a question selector for a decision-making app.

User's Decision: "${userQuestion}"
Category: ${archetypeLabel}

Available Questions (select 5-10 most relevant):
${fieldListForPrompt}

RULES:
- Select 5-10 questions that are DIRECTLY relevant to THIS specific decision
- SKIP obvious/redundant questions (e.g., don't ask "what product?" if user already stated it)
- SKIP questions where the answer is already clear from the user's question
- Choose questions that would help personalize advice
- Return ONLY the field keys

Return JSON:
{
  "selectedFieldKeys": ["field_key_1", "field_key_2", "field_key_3"],
  "reasoning": "Brief 1-line explanation"
}`;

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

        if (!apiKey) {
            console.warn('No API key, returning first 7 fields');
            return {
                selectedFieldKeys: availableFields.slice(0, 7).map(f => f.key),
                reasoning: 'Fallback: no API key'
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'Select the most relevant questions for this decision.' }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            const result = JSON.parse(content) as QuestionSelectionResult;

            // Validate selected keys exist
            const validKeys = result.selectedFieldKeys.filter(key =>
                availableFields.some(f => f.key === key)
            );

            // Ensure we have 5-10 questions
            if (validKeys.length < 5) {
                // Add more from available fields
                for (const field of availableFields) {
                    if (!validKeys.includes(field.key)) {
                        validKeys.push(field.key);
                        if (validKeys.length >= 5) break;
                    }
                }
            } else if (validKeys.length > 10) {
                validKeys.length = 10; // Truncate
            }

            return {
                selectedFieldKeys: validKeys,
                reasoning: result.reasoning
            };

        } catch (error) {
            console.error('Question selection failed:', error);
            // Fallback: return first 7 fields
            return {
                selectedFieldKeys: availableFields.slice(0, 7).map(f => f.key),
                reasoning: 'Fallback due to error'
            };
        }
    }
}
