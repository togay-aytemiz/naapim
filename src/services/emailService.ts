// Email Service - Frontend helper for sending emails via Edge Function

import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

interface SendEmailResponse {
    success: boolean;
    message_id?: string;
    error?: string;
    details?: string;
}

/**
 * Send the session code to user's email
 */
export async function sendCodeEmail(email: string, code: string, userQuestion: string): Promise<SendEmailResponse> {
    try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                type: 'code_delivery',
                to: email,
                data: {
                    code,
                    user_question: userQuestion
                },
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Failed to send code email:', result);
            return { success: false, error: result.message || result.error || 'Failed to send email' };
        }

        return { success: true, message_id: result.message_id };
    } catch (error) {
        console.error('Send code email error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

/**
 * Schedule a 14-day reminder email
 * Note: For now this sends immediately. Scheduled sending will be added in next phase.
 */
export async function scheduleReminder(
    email: string,
    code: string,
    userQuestion: string,
    sessionId?: string,
    followupQuestion?: string,
    scheduleTime: 'tomorrow' | '1_week' | '2_weeks' = 'tomorrow',
    socialProofData?: any // Added dynamic social proof support
): Promise<SendEmailResponse> {
    try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                type: 'scheduled_reminder', // Use the new type we standardized
                to: email,
                data: {
                    code,
                    user_question: userQuestion,
                    session_id: sessionId,
                    followup_question: followupQuestion,
                    schedule_time: scheduleTime,
                    social_proof_data: socialProofData // Pass data to backend
                },
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Failed to schedule reminder:', result);
            return { success: false, error: result.error || 'Failed to schedule reminder' };
        }

        return { success: true, message_id: result.message_id };
    } catch (error) {
        console.error('Schedule reminder error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
