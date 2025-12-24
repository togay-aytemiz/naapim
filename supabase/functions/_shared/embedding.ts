/**
 * Shared embedding generation utility for Edge Functions.
 * Uses OpenAI's text-embedding-3-small model with 1536 dimensions.
 */

export async function generateEmbedding(
    text: string,
    openaiApiKey: string
): Promise<number[] | null> {
    if (!text || !openaiApiKey) return null;

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000), // Limit to ~8K chars
                dimensions: 1536
            })
        });

        if (!response.ok) {
            console.error('Embedding API error:', response.status);
            return null;
        }

        const data = await response.json();
        return data.data[0]?.embedding || null;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}
