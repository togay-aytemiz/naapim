import type {
    Archetype, CategorySet, Category, Field, OptionSet
} from '../types/registry';

// Import JSON data directly
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

export interface QuestionDefinition {
    id: string; // field_key
    text: string; // label from field
    options: {
        id: string; // option_id
        label: string;
    }[];
    categoryLabel?: string; // To optionally show grouping logic
}

export class RegistryLoader {
    private static archetypes: Archetype[] = (archetypesData as any).archetypes;
    private static categorySets: CategorySet[] = (categorySetsData as any).category_sets;
    private static categories: Category[] = (categoriesData as any).categories;
    private static fields: Field[] = (fieldsData as any).fields;
    private static optionSets: OptionSet[] = (optionSetsData as any).option_sets;

    static getQuestionsForArchetype(archetypeId: string): QuestionDefinition[] {
        const archetype = this.archetypes.find(a => a.id === archetypeId);
        if (!archetype) {
            console.error(`Archetype not found: ${archetypeId}`);
            return [];
        }

        const questions: QuestionDefinition[] = [];

        // Traverse: Archetype -> CategorySet -> Category -> Field -> OptionSet
        for (const catSetId of archetype.category_set_ids) {
            const catSet = this.categorySets.find(cs => cs.id === catSetId);
            if (!catSet) continue;

            for (const catId of catSet.category_ids) {
                const category = this.categories.find(c => c.id === catId);
                if (!category) continue;

                for (const fieldKey of category.field_keys) {
                    const field = this.fields.find(f => f.key === fieldKey);
                    if (!field) continue;

                    // Only support single_select for now as per QuestionFlow UI
                    if (field.type !== 'single_select' || !field.option_set_id) continue;

                    const optionSet = this.optionSets.find(os => os.id === field.option_set_id);
                    if (!optionSet) continue;

                    questions.push({
                        id: field.key,
                        text: field.label,
                        options: optionSet.options.map(opt => ({
                            id: opt.id,
                            label: opt.label
                        })),
                        categoryLabel: category.label
                    });
                }
            }
        }

        return questions;
    }

    /**
     * Get questions for specific field keys (for LLM-selected questions)
     */
    static getQuestionsForFieldKeys(fieldKeys: string[]): QuestionDefinition[] {
        const questions: QuestionDefinition[] = [];

        for (const fieldKey of fieldKeys) {
            const field = this.fields.find(f => f.key === fieldKey);
            if (!field) continue;

            if (field.type !== 'single_select' || !field.option_set_id) continue;

            const optionSet = this.optionSets.find(os => os.id === field.option_set_id);
            if (!optionSet) continue;

            // Find category for grouping label
            const category = this.categories.find(c => c.field_keys.includes(fieldKey));

            questions.push({
                id: field.key,
                text: field.label,
                options: optionSet.options.map(opt => ({
                    id: opt.id,
                    label: opt.label
                })),
                categoryLabel: category?.label
            });
        }

        return questions;
    }

    /**
     * Get lightweight questions for simple daily decisions.
     * If archetypeId is provided, uses archetype-specific simple questions.
     * Otherwise falls back to core_simple_v1.
     */
    static getSimpleQuestions(archetypeId?: string): QuestionDefinition[] {
        let simpleSetId = 'core_simple_v1';

        // Get archetype-specific simple set if available
        if (archetypeId) {
            const archetype = this.archetypes.find(a => a.id === archetypeId);
            if (archetype && (archetype as any).simple_category_set_id) {
                simpleSetId = (archetype as any).simple_category_set_id;
                console.log(`✨ Using archetype-specific simple set: ${simpleSetId} for ${archetypeId}`);
            }
        }

        const simpleSet = this.categorySets.find(cs => cs.id === simpleSetId);
        if (!simpleSet) {
            console.warn(`${simpleSetId} category set not found, falling back to core_simple_v1`);
            const fallbackSet = this.categorySets.find(cs => cs.id === 'core_simple_v1');
            if (!fallbackSet) return [];
            return this.getQuestionsFromCategorySet(fallbackSet);
        }

        return this.getQuestionsFromCategorySet(simpleSet);
    }

    /**
     * Helper to extract questions from a category set
     */
    private static getQuestionsFromCategorySet(catSet: any): QuestionDefinition[] {
        const questions: QuestionDefinition[] = [];

        for (const catId of catSet.category_ids) {
            const category = this.categories.find(c => c.id === catId);
            if (!category) continue;

            for (const fieldKey of category.field_keys) {
                const field = this.fields.find(f => f.key === fieldKey);
                if (!field) continue;

                if (field.type !== 'single_select' || !field.option_set_id) continue;

                const optionSet = this.optionSets.find(os => os.id === field.option_set_id);
                if (!optionSet) continue;

                questions.push({
                    id: field.key,
                    text: field.label,
                    options: optionSet.options.map(opt => ({
                        id: opt.id,
                        label: opt.label
                    })),
                    categoryLabel: category.label
                });
            }
        }

        return questions;
    }
}
