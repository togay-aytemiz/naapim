import { supabase } from '../lib/supabase'

export interface SubmitSessionParams {
    user_question: string
    answers: Record<string, string>
    archetype_id?: string
}

export interface SubmitSessionResponse {
    success: boolean
    session_id: string
    code: string
}

export async function submitSession(params: SubmitSessionParams): Promise<SubmitSessionResponse> {
    const { data, error } = await supabase.functions.invoke('submit-session', {
        body: params,
    })

    if (error) {
        console.error('Submit session error object:', error)
        let errorMessage = error.message || 'Submission failed';

        // Try to read the response body from the error context if it exists
        if ('context' in error && (error as any).context instanceof Response) {
            try {
                const errorResponse = await (error as any).context.json();
                console.error('Edge Function Error Response:', errorResponse);
                if (errorResponse.error) {
                    errorMessage = `Server Error: ${errorResponse.error}`;
                }
            } catch (e) {
                console.warn('Could not parse error response JSON', e);
            }
        }

        throw new Error(errorMessage)
    }

    return data
}
