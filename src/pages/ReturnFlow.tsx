import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Clock, X, ChevronDown, ChevronUp, Pencil, Smile, Meh, Frown, HelpCircle } from 'lucide-react';
import type { AnalysisResult, Sentiment } from '../services/analysis';
import { RegistryLoader } from '../services/registryLoader';
import { saveOutcome, type FeelingType } from '../services/saveOutcome';
import { moderateContent } from '../services/moderateContent';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Outcome {
    id: string;
    outcome_type: 'decided' | 'thinking' | 'cancelled';
    outcome_text?: string;
    feeling?: FeelingType;
    created_at: string;
}

interface SessionData {
    session_id: string;
    code: string;
    user_question: string;
    archetype_id: string;
    answers: Record<string, string>;
    analysis: AnalysisResult | null;
    previous_outcomes: Outcome[];
}

type FlowStep =
    | 'enter-code'
    | 'welcome-back'
    | 'returning-user'      // User has previous outcomes - show last choice
    | 'choose-outcome'      // Select decided/thinking/cancelled
    | 'ask-feeling'         // How do you feel about your decision?
    | 'share-outcome'
    | 'view-stories';

type OutcomeType = 'decided' | 'thinking' | 'cancelled' | null;

// Sentiment styles
const sentimentStyles: Record<string, { bg: string; border: string; text: string }> = {
    positive: { bg: 'var(--emerald-50)', border: 'var(--emerald-300)', text: 'var(--emerald-700)' },
    cautious: { bg: 'var(--amber-50)', border: 'var(--amber-300)', text: 'var(--amber-700)' },
    warning: { bg: 'var(--orange-50)', border: 'var(--orange-300)', text: 'var(--orange-700)' },
    negative: { bg: 'var(--red-50)', border: 'var(--red-300)', text: 'var(--red-700)' },
    neutral: { bg: 'var(--neutral-100)', border: 'var(--neutral-300)', text: 'var(--neutral-700)' }
};

// Outcome type labels in Turkish
const outcomeLabels: Record<string, string> = {
    decided: 'Karar verdim',
    thinking: 'Hala düşünüyorum',
    cancelled: 'Vazgeçtim'
};

// Feeling labels and icons
const feelingOptions: { type: FeelingType; label: string; emoji: string; color: string }[] = [
    { type: 'happy', label: 'Mutlu', emoji: '😊', color: 'var(--emerald-600)' },
    { type: 'neutral', label: 'Nötr', emoji: '😐', color: 'var(--neutral-500)' },
    { type: 'regret', label: 'Pişman', emoji: '😔', color: 'var(--amber-600)' },
    { type: 'uncertain', label: 'Kararsız', emoji: '🤔', color: 'var(--blue-600)' }
];

// Moderation messages
const moderationMessages = [
    "Topluluk kurallarına uygunluğu kontrol ediliyor...",
    "Yazım yanlışları düzeltiliyor...",
    "Dilbilgisi kurallarına bakılıyor...",
    "Mesajın inceleniyor...",
    "İçerik güvenliği değerlendiriliyor...",
    "Son düzenlemeler yapılıyor...",
    "Neredeyse bitti..."
];

export const ReturnFlow: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = React.useState(() => new URLSearchParams(window.location.search));

    // Get code from URL query param or location state
    const urlCode = searchParams.get('code') || '';
    const stateCode = location.state?.code || '';
    const initialCode = urlCode || stateCode;

    const [step, setStep] = useState<FlowStep>('enter-code');
    const [code, setCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    // Outcome state
    const [outcomeType, setOutcomeType] = useState<OutcomeType>(null);
    const [outcomeText, setOutcomeText] = useState('');
    const [feeling, setFeeling] = useState<FeelingType | null>(null);

    // UI state
    const [showDetails, setShowDetails] = useState(false);
    const [showAllAnswers, setShowAllAnswers] = useState(false);
    const [isModerating, setIsModerating] = useState(false);
    const [moderationError, setModerationError] = useState<string | null>(null);
    const [moderationMessageIndex, setModerationMessageIndex] = useState(0);
    const [communityStories, setCommunityStories] = useState<Outcome[]>([]);

    // Auto-fetch if code in URL or passed from HomeScreen
    useEffect(() => {
        if (initialCode) {
            fetchSession(initialCode);
        }
    }, []);

    // Rotating moderation messages
    useEffect(() => {
        if (!isModerating) return;
        const interval = setInterval(() => {
            setModerationMessageIndex(prev => (prev + 1) % moderationMessages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isModerating]);

    // Fetch session data
    const fetchSession = async (codeToFetch: string) => {
        if (!codeToFetch.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ code: codeToFetch.trim().toUpperCase() })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Kod bulunamadı');
                return;
            }

            setSessionData(data);

            // Update URL with code (for sharing/bookmarking)
            const newUrl = `${window.location.pathname}?code=${codeToFetch.trim().toUpperCase()}`;
            window.history.replaceState({}, '', newUrl);

            // Decide which step to show
            if (data.previous_outcomes && data.previous_outcomes.length > 0) {
                // User has previous outcomes - show returning user flow
                setStep('returning-user');
            } else {
                // First time - show welcome back
                setStep('welcome-back');
            }

        } catch (err) {
            console.error('Error fetching session:', err);
            setError('Bir hata oluştu. Lütfen tekrar dene.');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = () => fetchSession(code);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.trim()) handleCodeSubmit();
    };

    // Handle "Keep" - user's decision stayed the same
    const handleKeepDecision = () => {
        if (sessionData?.previous_outcomes?.[0]) {
            setOutcomeType(sessionData.previous_outcomes[0].outcome_type);
            setStep('ask-feeling');
        }
    };

    // Handle "Change" - user wants to update their decision
    const handleChangeDecision = () => {
        setStep('choose-outcome');
    };

    // Select outcome type
    const handleOutcomeSelect = (type: OutcomeType) => {
        setOutcomeType(type);
        setModerationError(null);
        setStep('ask-feeling');
    };

    // Select feeling
    const handleFeelingSelect = (f: FeelingType) => {
        setFeeling(f);
        setStep('share-outcome');
    };

    // Share outcome
    const handleShare = async () => {
        if (!sessionData || !outcomeType) return;

        setModerationError(null);
        let finalText = outcomeText.trim();

        // Moderate text if provided
        if (finalText) {
            setIsModerating(true);
            setModerationMessageIndex(0);

            try {
                const modResult = await moderateContent(finalText);

                if (!modResult.approved) {
                    setModerationError(modResult.reason || 'Topluluk kurallarına uymuyor.');
                    setIsModerating(false);
                    return;
                }

                if (modResult.corrected_text) {
                    finalText = modResult.corrected_text;
                    setOutcomeText(finalText);
                }
            } catch (err) {
                console.error('Moderation error:', err);
            }

            setIsModerating(false);
        }

        // Save outcome
        setLoading(true);
        try {
            await saveOutcome({
                session_id: sessionData.session_id,
                outcome_type: outcomeType,
                outcome_text: finalText || undefined,
                feeling: feeling || undefined,
                archetype_id: sessionData.archetype_id
            });

            // Fetch community stories before showing them (uses session context for matching)
            await fetchCommunityStories();

            setStep('view-stories');
        } catch (err) {
            console.error('Error saving outcome:', err);
            setStep('view-stories');
        } finally {
            setLoading(false);
        }
    };

    // Fetch community stories from DB - matches based on user's question + context
    const fetchCommunityStories = async () => {
        if (!sessionData) return;

        try {
            // Build context from session responses for semantic matching
            const context = sessionData.responses
                ? Object.entries(sessionData.responses)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                : '';

            const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-community-stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    archetype_id: sessionData.archetype_id,
                    limit: 10,
                    exclude_session_id: sessionData.session_id,
                    user_question: sessionData.user_question,  // For semantic matching
                    context: context  // User's answers for better matching
                })
            });

            const data = await response.json();
            if (data.stories) {
                setCommunityStories(data.stories);
            }
        } catch (err) {
            console.error('Error fetching community stories:', err);
        }
    };

    // Get sentiment style
    const getSentimentStyle = (sentiment: Sentiment | undefined) => {
        return sentimentStyles[sentiment || 'neutral'] || sentimentStyles.neutral;
    };

    // Get last outcome
    const lastOutcome = sessionData?.previous_outcomes?.[0];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
            <div className="max-w-md mx-auto">

                {/* Step 1: Enter Code */}
                {step === 'enter-code' && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar hoş geldin!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Takip kodunu girerek kaldığın yerden devam et.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyPress={handleKeyPress}
                                placeholder="NY-XXXX-XX"
                                className="w-full px-5 py-4 text-center text-xl font-mono tracking-widest rounded-2xl"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '2px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                autoFocus
                            />

                            {error && (
                                <p className="text-center text-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
                            )}

                            <button
                                onClick={handleCodeSubmit}
                                disabled={!code.trim() || loading}
                                className="w-full py-4 rounded-xl font-medium"
                                style={{
                                    backgroundColor: code.trim() ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                                    color: code.trim() ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Yükleniyor...' : 'Devam Et'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                ← Ana sayfaya dön
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Welcome Back (First Time - No Previous Outcomes) */}
                {step === 'welcome-back' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">👋</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar merhaba!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Geçen seferki sorunla ilgili nasıl gidiyor?
                            </p>
                        </div>

                        {/* Original Question */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sorduğun soru:</p>
                            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>"{sessionData.user_question}"</p>
                        </div>

                        {/* Previous Recommendation */}
                        {sessionData.analysis && (() => {
                            const style = getSentimentStyle(sessionData.analysis.sentiment);
                            return (
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                                    <div className="p-5">
                                        <p className="text-xs font-medium mb-2" style={{ color: style.text, opacity: 0.7 }}>Önerimiz:</p>
                                        <p className="font-semibold text-lg" style={{ color: style.text }}>{sessionData.analysis.title}</p>
                                        <p className="mt-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.recommendation}</p>
                                    </div>

                                    {showDetails && (
                                        <div className="px-5 pb-5 space-y-4">
                                            <div className="h-px" style={{ backgroundColor: style.border }} />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: style.text, opacity: 0.6 }}>Neden?</p>
                                                <p className="text-sm leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.reasoning}</p>
                                            </div>
                                            {sessionData.analysis.steps?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: style.text, opacity: 0.6 }}>Adımlar</p>
                                                    <ul className="space-y-2">
                                                        {sessionData.analysis.steps.slice(0, 5).map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>
                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: style.border, color: style.text }}>{i + 1}</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button onClick={() => setShowDetails(!showDetails)} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium" style={{ color: style.text, borderTop: `1px solid ${style.border}` }}>
                                        <span>{showDetails ? 'Daha az göster' : 'Detayları gör'}</span>
                                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Followup Question */}
                        <div className="space-y-4">
                            <p className="text-center text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                                {sessionData.analysis?.followup_question || `"${sessionData.user_question}" konusunda bir karar verdin mi?`}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button onClick={() => handleOutcomeSelect('decided')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Evet, bir şeyler oldu!
                                </button>
                                <button onClick={() => handleOutcomeSelect('thinking')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--amber-600)' }} /> Henüz düşünüyorum
                                </button>
                                <button onClick={() => handleOutcomeSelect('cancelled')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <X className="w-5 h-5" style={{ color: 'var(--red-500)' }} /> Vazgeçtim
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2b: Returning User (Has Previous Outcomes) */}
                {step === 'returning-user' && sessionData && lastOutcome && (
                    <div className="space-y-6 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">👋</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar hoş geldin!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Geçen seferden bu yana neler değişti?
                            </p>
                        </div>

                        {/* Original Question */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sorduğun soru:</p>
                            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>"{sessionData.user_question}"</p>
                        </div>

                        {/* Previous Recommendation */}
                        {sessionData.analysis && (() => {
                            const style = getSentimentStyle(sessionData.analysis.sentiment);
                            return (
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                                    <div className="p-5">
                                        <p className="text-xs font-medium mb-2" style={{ color: style.text, opacity: 0.7 }}>Önerimiz:</p>
                                        <p className="font-semibold text-lg" style={{ color: style.text }}>{sessionData.analysis.title}</p>
                                        <p className="mt-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.recommendation}</p>
                                    </div>

                                    {showDetails && (
                                        <div className="px-5 pb-5 space-y-4">
                                            <div className="h-px" style={{ backgroundColor: style.border }} />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: style.text, opacity: 0.6 }}>Neden?</p>
                                                <p className="text-sm leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.reasoning}</p>
                                            </div>
                                            {sessionData.analysis.steps?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: style.text, opacity: 0.6 }}>Adımlar</p>
                                                    <ul className="space-y-2">
                                                        {sessionData.analysis.steps.slice(0, 5).map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>
                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: style.border, color: style.text }}>{i + 1}</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button onClick={() => setShowDetails(!showDetails)} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium" style={{ color: style.text, borderTop: `1px solid ${style.border}` }}>
                                        <span>{showDetails ? 'Daha az göster' : 'Detayları gör'}</span>
                                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Last Decision Display */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Son paylaşımın:</p>
                            <div className="flex items-center gap-3">
                                {lastOutcome.outcome_type === 'decided' && <Check className="w-6 h-6" style={{ color: 'var(--emerald-600)' }} />}
                                {lastOutcome.outcome_type === 'thinking' && <Clock className="w-6 h-6" style={{ color: 'var(--amber-600)' }} />}
                                {lastOutcome.outcome_type === 'cancelled' && <X className="w-6 h-6" style={{ color: 'var(--red-500)' }} />}
                                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {outcomeLabels[lastOutcome.outcome_type]}
                                </p>
                                {lastOutcome.feeling && (() => {
                                    const feelingInfo = feelingOptions.find(f => f.type === lastOutcome.feeling);
                                    return feelingInfo ? (
                                        <span className="text-lg ml-auto">{feelingInfo.emoji}</span>
                                    ) : null;
                                })()}
                            </div>
                            {lastOutcome.outcome_text && (
                                <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>"{lastOutcome.outcome_text}"</p>
                            )}
                        </div>

                        {/* CTA - Encourage sharing */}
                        <div className="space-y-4">
                            <p className="text-center text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                                Kararını paylaş, başkalarında neler değişmiş gör! ✨
                            </p>

                            <div className="flex flex-col gap-3">
                                <button onClick={handleKeepDecision} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Aynı karardayım
                                </button>
                                <button onClick={handleChangeDecision} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Pencil className="w-5 h-5" style={{ color: 'var(--blue-600)' }} /> Kararım değişti
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Choose Outcome (Change Decision) */}
                {step === 'choose-outcome' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Şu an ne durumdasın?
                            </h1>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleOutcomeSelect('decided')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Karar verdim
                            </button>
                            <button onClick={() => handleOutcomeSelect('thinking')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                <Clock className="w-5 h-5" style={{ color: 'var(--amber-600)' }} /> Hala düşünüyorum
                            </button>
                            <button onClick={() => handleOutcomeSelect('cancelled')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                <X className="w-5 h-5" style={{ color: 'var(--red-500)' }} /> Vazgeçtim
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Ask Feeling */}
                {step === 'ask-feeling' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Bu kararla ilgili nasıl hissediyorsun?
                            </h1>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {feelingOptions.map((f) => (
                                <button
                                    key={f.type}
                                    onClick={() => handleFeelingSelect(f.type)}
                                    className="py-5 rounded-xl font-medium flex flex-col items-center gap-2"
                                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                >
                                    <span className="text-3xl">{f.emoji}</span>
                                    <span className="text-sm">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 5: Share Outcome */}
                {step === 'share-outcome' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Deneyimini paylaş
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Kısaca ne olduğunu anlat. Diğer insanlara ilham olabilirsin.
                            </p>
                        </div>

                        <textarea
                            value={outcomeText}
                            onChange={(e) => { setOutcomeText(e.target.value); setModerationError(null); }}
                            disabled={isModerating || loading}
                            className="w-full p-4 rounded-2xl min-h-[150px] resize-none"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: moderationError ? '2px solid var(--red-400)' : '2px solid var(--border-primary)',
                                color: 'var(--text-primary)',
                                opacity: (isModerating || loading) ? 0.7 : 1
                            }}
                            placeholder="Ne karar verdin? Ne oldu? Nasıl hissettin?"
                        />

                        {moderationError && (
                            <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'var(--red-50)', border: '1px solid var(--red-300)' }}>
                                <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red-500)' }} />
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--red-700)' }}>Topluluk kurallarına uymuyor</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--red-600)' }}>{moderationError}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleShare}
                            disabled={isModerating || loading}
                            className="w-full py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--btn-primary-bg)', opacity: (isModerating || loading) ? 0.7 : 1 }}
                        >
                            {isModerating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span key={moderationMessageIndex} className="animate-in fade-in duration-300">{moderationMessages[moderationMessageIndex]}</span>
                                </div>
                            ) : loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </div>
                            ) : (
                                <>Paylaş ve diğerlerini gör <ChevronDown className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 6: View Stories */}
                {step === 'view-stories' && sessionData && (
                    <div className="space-y-6 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">🎉</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Teşekkürler!</h1>
                            <p className="text-[var(--text-secondary)]">Hikayeni paylaştığın için teşekkürler.</p>
                        </div>

                        {/* User's story with feeling */}
                        {(outcomeText.trim() || feeling) && (
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Senin hikayen:</p>
                                {outcomeText.trim() && (
                                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>"{outcomeText}"</p>
                                )}
                                {feeling && (
                                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                        <span className="text-xl">{feelingOptions.find(f => f.type === feeling)?.emoji}</span>
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {feelingOptions.find(f => f.type === feeling)?.label} hissediyorsun
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Expandable Answers Section */}
                        {sessionData.answers && sessionData.archetype_id && Object.keys(sessionData.answers).length > 0 && (() => {
                            const questions = RegistryLoader.getQuestionsForArchetype(sessionData.archetype_id);
                            const allAnswers = Object.entries(sessionData.answers);
                            const answersToShow = showAllAnswers ? allAnswers : allAnswers.slice(0, 3);
                            const hasMore = allAnswers.length > 3;

                            return (
                                <div className="p-4 rounded-2xl relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Senin gibi düşünenler de var:</p>
                                    <div
                                        className="space-y-3 transition-all duration-500 ease-in-out overflow-hidden"
                                        style={{
                                            maxHeight: showAllAnswers ? `${allAnswers.length * 60}px` : '180px',
                                        }}
                                    >
                                        {answersToShow.map(([fieldKey, optionId], index) => {
                                            const question = questions.find(q => q.id === fieldKey);
                                            const option = question?.options.find(o => o.id === optionId);
                                            if (!question || !option) return null;

                                            const isLastVisible = !showAllAnswers && index === 2 && hasMore;

                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className="flex flex-col gap-0.5 transition-opacity duration-300"
                                                    style={{
                                                        opacity: isLastVisible ? 0.4 : 1,
                                                    }}
                                                >
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{question.text}</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Gradient overlay when collapsed */}
                                    {hasMore && !showAllAnswers && (
                                        <div
                                            className="absolute bottom-12 left-0 right-0 h-16 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to bottom, transparent, var(--bg-secondary))',
                                            }}
                                        />
                                    )}

                                    {/* Show more/less button */}
                                    {hasMore && (
                                        <button
                                            onClick={() => setShowAllAnswers(!showAllAnswers)}
                                            className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <span>{showAllAnswers ? 'Daha az göster' : `Tüm cevapları gör (${allAnswers.length})`}</span>
                                            {showAllAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Others' Experiences with Feelings - Real Data */}
                        {communityStories.filter(s => s.feeling && s.outcome_text).length > 0 && (
                            <>
                                <div className="text-center pt-2">
                                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Diğerlerinin deneyimleri:</h3>
                                </div>

                                <div className="space-y-4">
                                    {communityStories
                                        .filter(story => story.feeling && story.outcome_text)
                                        .slice(0, 5)
                                        .map(story => {
                                            const feelingInfo = feelingOptions.find(f => f.type === story.feeling);
                                            if (!feelingInfo) return null;

                                            const badgeColors: Record<string, { bg: string; text: string }> = {
                                                happy: { bg: 'var(--emerald-100)', text: 'var(--emerald-700)' },
                                                neutral: { bg: 'var(--neutral-200)', text: 'var(--neutral-700)' },
                                                regret: { bg: 'var(--amber-100)', text: 'var(--amber-700)' },
                                                uncertain: { bg: 'var(--blue-100)', text: 'var(--blue-700)' }
                                            };

                                            const colors = badgeColors[story.feeling || 'neutral'];

                                            return (
                                                <div key={story.id} className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-lg">{feelingInfo.emoji}</span>
                                                        <span
                                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                            style={{ backgroundColor: colors.bg, color: colors.text }}
                                                        >
                                                            {feelingInfo.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                        "{story.outcome_text}"
                                                    </p>
                                                    <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>— Anonim kullanıcı</p>
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        )}

                        <button onClick={() => navigate('/')} className="w-full py-4 rounded-xl font-medium" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                            Ana sayfaya dön
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReturnFlow;
