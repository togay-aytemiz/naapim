// Supabase Edge Function: health/echo
// Minimal endpoint to validate connectivity with CORS support

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Parse request body if present
        let body = {}
        try {
            body = await req.json()
        } catch {
            // No body or invalid JSON, that's fine
        }

        // Return health response
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'NeYapsam API is running',
            echo: body,
        }

        return new Response(JSON.stringify(response), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
            status: 200,
        })
    } catch (error) {
        console.error('Health check error:', error)

        return new Response(
            JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
                status: 500,
            }
        )
    }
})
