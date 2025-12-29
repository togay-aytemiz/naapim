import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { fetchDecoded } from '../lib/apiDecoder'

export interface SubmitSessionParams {
    user_question: string
    answers: Record<string, string>
    archetype_id?: string
    decision_type?: 'binary_decision' | 'comparison' | 'timing' | 'method' | 'validation' | 'emotional_support' | 'exploration'
}

export interface SubmitSessionResponse {
    success: boolean
    session_id: string
    code: string
}

export async function submitSession(params: SubmitSessionParams): Promise<SubmitSessionResponse> {
    if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase not configured')
    }

    const data = await fetchDecoded<SubmitSessionResponse>(
        `${SUPABASE_FUNCTIONS_URL}/submit-session`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(params)
        }
    )

    return data
}
