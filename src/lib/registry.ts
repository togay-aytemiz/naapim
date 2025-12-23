// Registry Loader - Loads JSON config files
import type {
    ArchetypesRegistry,
    CategorySetsRegistry,
    CategoriesRegistry,
    FieldsRegistry,
    OptionSetsRegistry,
    Archetype,
    CategorySet,
    Category,
    Field,
    OptionSet,
} from '../types/registry'

// Import registry JSON files
import archetypesData from '../../config/registry/archetypes.json'
import categorySetsData from '../../config/registry/category_sets.json'
import categoriesData from '../../config/registry/categories.json'
import fieldsData from '../../config/registry/fields.json'
import optionSetsData from '../../config/registry/option_sets.json'

// Type-cast imported JSON
const archetypes = archetypesData as ArchetypesRegistry
const categorySets = categorySetsData as CategorySetsRegistry
const categories = categoriesData as CategoriesRegistry
const fields = fieldsData as FieldsRegistry
const optionSets = optionSetsData as OptionSetsRegistry

// === Archetype Functions ===
export function getAllArchetypes(): Archetype[] {
    return archetypes.archetypes
}

export function getArchetypeById(id: string): Archetype | undefined {
    return archetypes.archetypes.find((a) => a.id === id)
}

// === Category Set Functions ===
export function getCategorySetById(id: string): CategorySet | undefined {
    return categorySets.category_sets.find((cs) => cs.id === id)
}

export function getCategorySetsForArchetype(archetypeId: string): CategorySet[] {
    const archetype = getArchetypeById(archetypeId)
    if (!archetype) return []

    return archetype.category_set_ids
        .map((id) => getCategorySetById(id))
        .filter((cs): cs is CategorySet => cs !== undefined)
}

// === Category Functions ===
export function getCategoryById(id: string): Category | undefined {
    return categories.categories.find((c) => c.id === id)
}

export function getCategoriesForArchetype(archetypeId: string): Category[] {
    const sets = getCategorySetsForArchetype(archetypeId)
    const categoryIds = sets.flatMap((s) => s.category_ids)
    const uniqueIds = [...new Set(categoryIds)]

    return uniqueIds
        .map((id) => getCategoryById(id))
        .filter((c): c is Category => c !== undefined)
}

// === Field Functions ===
export function getFieldByKey(key: string): Field | undefined {
    return fields.fields.find((f) => f.key === key)
}

export function getFieldsForCategory(categoryId: string): Field[] {
    const category = getCategoryById(categoryId)
    if (!category) return []

    return category.field_keys
        .map((key) => getFieldByKey(key))
        .filter((f): f is Field => f !== undefined)
}

// === Option Set Functions ===
export function getOptionSetById(id: string): OptionSet | undefined {
    return optionSets.option_sets.find((os) => os.id === id)
}

export function getOptionsForField(fieldKey: string): OptionSet | undefined {
    const field = getFieldByKey(fieldKey)
    if (!field) return undefined

    return getOptionSetById(field.option_set_id)
}

// === Composite Functions ===
export function getQuestionsForArchetype(archetypeId: string): Field[] {
    const cats = getCategoriesForArchetype(archetypeId)
    const allFields: Field[] = []

    for (const cat of cats) {
        const catFields = getFieldsForCategory(cat.id)
        allFields.push(...catFields)
    }

    // Remove duplicates by field key
    const uniqueFields = allFields.filter(
        (field, index, self) => index === self.findIndex((f) => f.key === field.key)
    )

    return uniqueFields
}
