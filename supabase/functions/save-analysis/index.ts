import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
    title: string;
    recommendation: string;
    reasoning: string;
    steps: string[];
}

interface SaveAnalysisRequest {
    session_id: string;
    code: string;
    analysis: AnalysisResult;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { session_id, code, analysis }: SaveAnalysisRequest = await req.json()

        if (!session_id || !analysis) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: session_id, analysis' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Update the results table with the analysis JSON
        const { error: updateError } = await supabase
            .from('results')
            .update({
                analysis_json: analysis,
                decision: analysis.title, // Also store title in decision field for backward compatibility
                notes: code
            })
            .eq('session_id', session_id)

        if (updateError) {
            console.error('Failed to save analysis:', updateError)
            throw updateError
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Analysis saved successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Save analysis error:', error)
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
