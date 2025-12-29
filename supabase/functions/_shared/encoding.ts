/**
 * Shared encoding utility for Edge Functions.
 * Encodes JSON responses to Base64 to prevent casual inspection in browser DevTools.
 */

/**
 * Encode JSON data to Base64 (UTF-8 safe)
 */
export const encodeResponse = (data: any): string => {
    const json = JSON.stringify(data);
    // Handle Unicode characters properly
    const utf8Bytes = new TextEncoder().encode(json);
    const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
};

/**
 * Create an encoded HTTP Response
 */
export const createEncodedResponse = (
    data: any,
    corsHeaders: Record<string, string>,
    status = 200
): Response => {
    return new Response(
        JSON.stringify({ _e: encodeResponse(data) }),
        {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    );
};

/**
 * Create an encoded error Response
 */
export const createEncodedErrorResponse = (
    error: string,
    corsHeaders: Record<string, string>,
    status = 400
): Response => {
    return new Response(
        JSON.stringify({ _e: encodeResponse({ error }) }),
        {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    );
};
