import { RegistryLoader } from './registryLoader';
import type { Archetype } from '../types/registry';

// @ts-ignore
import archetypesData from '../../config/registry/archetypes.json';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type Sentiment = 'positive' | 'cautious' | 'warning' | 'negative' | 'neutral';

export interface AnalysisResult {
    title: string;
    recommendation: string;
    reasoning: string;
    steps: string[];
    sentiment: Sentiment;
    followup_question?: string;
}

export class AnalysisService {
    private static archetypes: Archetype[] = (archetypesData as any).archetypes;

    private static getReadableContext(archetypeId: string, answers: Record<string, string>): string {
        const questions = RegistryLoader.getQuestionsForArchetype(archetypeId);
        let context = "";

        questions.forEach(q => {
            const answerId = answers[q.id];
            if (answerId) {
                const selectedOption = q.options.find(opt => opt.id === answerId);
                const answerLabel = selectedOption ? selectedOption.label : answerId;
                context += `- ${q.text}: ${answerLabel}\n`;
            }
        });

        return context;
    }

    static async generateAnalysis(
        userQuestion: string,
        answers: Record<string, string>,
        archetypeId: string
    ): Promise<AnalysisResult> {
        const archetype = this.archetypes.find(a => a.id === archetypeId);
        const context = this.getReadableContext(archetypeId, answers);
        const archetypeLabel = archetype ? archetype.label : archetypeId;

        // Check if Supabase is configured
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn("Supabase not configured, returning mock analysis.");
            return this.getMockAnalysis();
        }

        try {
            // Debug: Log context being sent
            console.log('📤 Sending analysis request:');
            console.log('   Question:', userQuestion);
            console.log('   Archetype:', archetypeLabel);
            console.log('   Context:', context || '(empty)');

            // Call server-side Edge Function
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    user_question: userQuestion,
                    context: context,
                    archetype_label: archetypeLabel
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Analysis API Error:", errorData);
                throw new Error(errorData.error || 'Analysis failed');
            }

            const result = await response.json() as AnalysisResult;
            console.log('📊 LLM Analysis Result:', result);
            console.log('🎨 Sentiment:', result.sentiment);

            // Fire and forget: Generate seeded community outcomes in background
            this.generateSeededOutcomes(userQuestion, archetypeId).catch(err => {
                console.warn('Failed to generate seeded outcomes:', err);
            });

            return result;

        } catch (error) {
            console.error("Analysis generation failed:", error);
            return this.getMockAnalysis();
        }
    }

    private static getMockAnalysis(): AnalysisResult {
        return {
            title: "Analiz Oluşturulamadı",
            recommendation: "Şu anda teknik bir sorun nedeniyle detaylı analiz hazırlayamadık.",
            reasoning: "Lütfen daha sonra tekrar deneyiniz veya bağlantınızı kontrol ediniz.",
            steps: ["Sayfayı yenile", "Bağlantını kontrol et"],
            sentiment: "neutral" as const
        };
    }

    /**
     * Generate seeded community outcomes in background
     */
    private static async generateSeededOutcomes(userQuestion: string, archetypeId: string): Promise<void> {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured, skipping seeded outcomes');
            return;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-seeded-outcomes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    user_question: userQuestion,
                    archetype_id: archetypeId,
                    count: 3
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('🌱 Generated seeded outcomes:', data.generated_count);
            } else {
                console.warn('Seeded outcomes generation failed:', response.status);
            }
        } catch (err) {
            console.warn('Error generating seeded outcomes:', err);
        }
    }
}

