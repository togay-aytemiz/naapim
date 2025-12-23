// Registry Types for NeYapsam

export interface RoutingHints {
    definition: string
    positive_examples: string[]
    negative_examples: string[]
    keywords: string[]
    exclusions: string[]
}

export interface Archetype {
    id: string
    label: string
    default_followup_days: number
    category_set_ids: string[]
    routing_hints: RoutingHints
}

export interface CategorySet {
    id: string
    label: string
    category_ids: string[]
}

export interface Category {
    id: string
    label: string
    description?: string
    field_keys: string[] // UI gösterim sırası - binding contract
}

export type FieldType = 'single_select' | 'text' | 'number' // multi_select phase-2

export interface Field {
    key: string
    label: string
    type: FieldType
    option_set_id?: string // text/number için yok
}

export interface Option {
    id: string
    label: string
}

export interface OptionSet {
    id: string
    description?: string
    options: Option[]
}

// Registry container types
export interface ArchetypesRegistry {
    archetypes: Archetype[]
}

export interface CategorySetsRegistry {
    category_sets: CategorySet[]
}

export interface CategoriesRegistry {
    categories: Category[]
    _meta?: {
        field_order_contract: string
    }
}

export interface FieldsRegistry {
    fields: Field[]
}

export interface OptionSetsRegistry {
    option_sets: OptionSet[]
    _meta?: {
        versioning: string
        separation_policy: string
    }
}

// =====================================================
// Database Types
// =====================================================

export type SessionStatus = 'active' | 'completed' | 'archived'

export interface Session {
    id: string
    created_at: string
    updated_at: string
    status: SessionStatus

    user_question: string
    archetype_id: string

    recovery_code_hash: string | null
    recovery_code_salt: string | null

    followup_at: string | null
    completed_at: string | null
}

export interface Response {
    id: string
    session_id: string
    field_key: string
    option_id: string
    created_at: string
}

export interface Result {
    id: string
    session_id: string
    decision: string | null
    confidence_score: number | null
    notes: string | null
    created_at: string
}

export type FollowupEventType =
    | 'reminder_scheduled'
    | 'reminder_sent'
    | 'user_returned'
    | 'outcome_collected'

export interface FollowupEvent {
    id: string
    session_id: string
    event_type: FollowupEventType
    event_at: string
    metadata: Record<string, unknown>
}

// Analytics
export interface AnalyticsSummary {
    archetype_id: string
    field_key: string
    option_id: string
    response_count: number
    percentage: number
}

// =====================================================
// Insert Types (for Supabase client)
// =====================================================

export interface SessionInsert {
    user_question: string
    archetype_id: string
    recovery_code_hash?: string
    recovery_code_salt?: string
    followup_at?: string | null
}

export interface ResponseInsert {
    session_id: string
    field_key: string
    option_id: string
}

export interface ResultInsert {
    session_id: string
    decision?: string
    confidence_score?: number
    notes?: string
}

export interface FollowupEventInsert {
    session_id: string
    event_type: FollowupEventType
    metadata?: Record<string, unknown>
}