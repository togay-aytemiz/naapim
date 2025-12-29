/**
 * Shared decoding utility for API responses.
 * Decodes Base64 encoded responses from Edge Functions.
 */

/**
 * Decode Base64 response back to original data (UTF-8 safe)
 */
export const decodeResponse = <T>(encoded: string): T => {
    const binaryString = atob(encoded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
};

/**
 * Fetch wrapper that handles encoded responses from Edge Functions.
 * Automatically decodes if response contains { _e: "..." }
 */
export const fetchDecoded = async <T>(
    url: string,
    options: RequestInit
): Promise<T> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        // Try to get error message from encoded response
        try {
            const data = await response.json();
            if (data._e) {
                const decoded = decodeResponse<{ error?: string }>(data._e);
                throw new Error(decoded.error || `HTTP ${response.status}`);
            }
            throw new Error(data.error || `HTTP ${response.status}`);
        } catch (e) {
            if (e instanceof Error && e.message !== `HTTP ${response.status}`) {
                throw e;
            }
            throw new Error(`HTTP ${response.status}`);
        }
    }

    const data = await response.json();

    // Check if response is encoded
    if (data._e && typeof data._e === 'string') {
        return decodeResponse<T>(data._e);
    }

    // Fallback for non-encoded responses (backwards compatibility)
    return data as T;
};
