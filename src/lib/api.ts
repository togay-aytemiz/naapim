import { SUPABASE_FUNCTIONS_URL } from './supabase'

interface HealthResponse {
    status: string
    timestamp: string
    message?: string
}

/**
 * Call the health/echo Edge Function to validate Supabase connectivity.
 * This is a minimal helper for testing purposes.
 */
export async function callHealthEcho(): Promise<HealthResponse> {
    const url = `${SUPABASE_FUNCTIONS_URL}/health`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ping: 'hello' }),
    })

    if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

/**
 * Test Supabase connectivity by calling the health endpoint.
 * Logs result to console for debugging.
 */
export async function testSupabaseConnection(): Promise<boolean> {
    try {
        const result = await callHealthEcho()
        console.log('✅ Supabase connection successful:', result)
        return true
    } catch (error) {
        console.error('❌ Supabase connection failed:', error)
        return false
    }
}
