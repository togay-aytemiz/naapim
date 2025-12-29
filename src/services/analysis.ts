import { RegistryLoader } from './registryLoader';
import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import type { Archetype } from '../types/registry';

// @ts-ignore
import archetypesData from '../../config/registry/archetypes.json';

export type Sentiment = 'positive' | 'cautious' | 'warning' | 'negative' | 'neutral';

export interface RankedOption {
    name: string;
    fit_score: number;  // 0-100
    reason: string;     // Only filled for top option
}

export interface TimingOption {
    label: string;
    value: string;  // "now", "1_month", "3_months", "6_months", "1_year", "2_years", "uncertain"
    fit_score: number;  // 0-100
}

export interface AnalysisResult {
    title: string;
    recommendation: string;
    reasoning: string;
    steps: string[];
    alternatives?: { name: string; description: string }[];
    pros?: string[];
    cons?: string[];
    sentiment: Sentiment;
    followup_question?: string;
    specific_suggestions?: { name: string; description: string }[];
    suggestion_type?: 'product' | 'food' | 'activity' | 'travel' | 'media' | 'gift' | 'other';
    decision_score?: number; // 0-100, only for binary_decision (0=YAPMA, 100=YAP)
    score_label?: string;    // "Olumlu Yaklaşım" etc.
    metre_left_label?: string;  // "YAPMA", "ALMA", "GİTME" etc.
    metre_right_label?: string; // "YAP", "AL", "GİT" etc.
    ranked_options?: RankedOption[]; // For comparison decisions
    timing_recommendation?: string;  // "now", "3_months", "6_months", etc. for timing decisions
    timing_reason?: string;          // Why this timing
    timing_alternatives?: TimingOption[]; // Alternative timings with scores
}

export class AnalysisService {
    private static archetypes: Archetype[] = (archetypesData as any).archetypes;

    static getReadableContext(archetypeId: string, answers: Record<string, string>): string {
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
        if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
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
            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/generate-analysis`, {
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

            // Note: Seeded outcomes are now generated in ResultPage to capture results for UI

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
    static async generateSeededOutcomes(
        userQuestion: string,
        archetypeId: string,
        context: string,
        recoveryCode?: string,
        decisionType: string = 'binary_decision'
    ): Promise<{ outcomes: any[], source?: string } | null> {
        if (!SUPABASE_FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured, skipping seeded outcomes');
            return null;
        }

        try {
            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/generate-seeded-outcomes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    user_question: userQuestion,
                    archetype_id: archetypeId,
                    context: context,  // Pass user's answers for better matching
                    count: 3,
                    recovery_code: recoveryCode, // For caching - reuse existing outcomes
                    decision_type: decisionType // For decision type-specific prompts
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('🌱 Generated seeded outcomes:', data.generated_count);
                return data;
            } else {
                console.warn('Seeded outcomes generation failed:', response.status);
                return null;
            }
        } catch (err) {
            console.warn('Error generating seeded outcomes:', err);
            return null;
        }
    }
}

