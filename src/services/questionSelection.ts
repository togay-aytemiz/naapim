import type { Archetype } from '../types/registry';
import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

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

        for (const setId of archetype.category_set_ids) {
            const categorySet = this.categorySets.find(cs => cs.id === setId);
            if (!categorySet) continue;

            for (const categoryId of categorySet.category_ids) {
                const category = this.categories.find(c => c.id === categoryId);
                if (!category) continue;
                allFieldKeys.push(...category.field_keys);
            }
        }

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
     * Use LLM to select the most relevant 3-5 fields for this specific user question
     */
    static async selectQuestions(
        userQuestion: string,
        archetypeId: string
    ): Promise<QuestionSelectionResult> {
        const archetype = this.archetypes.find(a => a.id === archetypeId);
        const archetypeLabel = archetype?.label || archetypeId;
        const availableFields = this.getAvailableFieldsForArchetype(archetypeId);

        // If 10 or fewer fields, just use all of them
        if (availableFields.length <= 10) {
            return {
                selectedFieldKeys: availableFields.map(f => f.key),
                reasoning: 'Using all available fields (10 or fewer)'
            };
        }

        // Check if Supabase is configured
        if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured, returning first 7 fields');
            return {
                selectedFieldKeys: availableFields.slice(0, 7).map(f => f.key),
                reasoning: 'Fallback: Supabase not configured'
            };
        }

        try {
            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/select-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    user_question: userQuestion,
                    archetype_label: archetypeLabel,
                    available_fields: availableFields.map(f => ({
                        key: f.key,
                        label: f.label,
                        options: f.options.map(o => o.label)
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`Question selection API error: ${response.status}`);
            }

            const result = await response.json();

            // Validate selected keys exist
            const validKeys = (result.selectedFieldKeys || []).filter((key: string) =>
                availableFields.some(f => f.key === key)
            );

            // Ensure we have 5-10 questions
            if (validKeys.length < 5) {
                for (const field of availableFields) {
                    if (!validKeys.includes(field.key)) {
                        validKeys.push(field.key);
                        if (validKeys.length >= 5) break;
                    }
                }
            } else if (validKeys.length > 10) {
                validKeys.length = 10;
            }

            return {
                selectedFieldKeys: validKeys,
                reasoning: result.reasoning
            };

        } catch (error) {
            console.error('Question selection failed:', error);
            return {
                selectedFieldKeys: availableFields.slice(0, 7).map(f => f.key),
                reasoning: 'Fallback due to error'
            };
        }
    }
}

